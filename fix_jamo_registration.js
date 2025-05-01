const AWS = require('aws-sdk');

// Initialize AWS services with the correct region
const rekognition = new AWS.Rekognition({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const s3 = new AWS.S3({ region: 'us-east-1' });

// Constants
const COLLECTION_ID = 'shmong-faces';
const FACE_DATA_TABLE = 'shmong-face-data';
const USER_ID = '5428a458-30c1-70c8-1a3c-51301838ff0e'; // Jamo's user ID

// Main function
async function fixJamoRegistration() {
  try {
    console.log(`Fixing face registration for user ${USER_ID} (Jamo)...`);

    // Step 1: Check if the user exists
    const userResult = await dynamoDB.get({
      TableName: 'shmong-users',
      Key: { id: USER_ID }
    }).promise();

    if (!userResult.Item) {
      console.error(`User ${USER_ID} not found in users table!`);
      return;
    }

    console.log(`Found user: ${userResult.Item.email}`);

    // Step 2: List faces in Rekognition collection to find Jamo's face
    const listFacesResult = await rekognition.listFaces({
      CollectionId: COLLECTION_ID,
      MaxResults: 1000
    }).promise();

    console.log(`Found ${listFacesResult.Faces.length} faces in Rekognition collection`);

    // Step 3: Find faces that might belong to Jamo
    // Looking for faces with ExternalImageId containing Jamo's user ID
    let jamoFaces = listFacesResult.Faces.filter(face => 
      face.ExternalImageId && 
      (face.ExternalImageId === `user_${USER_ID}` || 
       face.ExternalImageId.includes(USER_ID))
    );

    if (jamoFaces.length === 0) {
      console.log("No faces found with Jamo's user ID as ExternalImageId");
      console.log("Scanning all faces to find potential matches...");
      
      // If no direct match, let's scan the photos table for any matched_users entry with this user ID
      const scanParams = {
        TableName: 'shmong-photos',
        FilterExpression: 'contains(matched_users, :userId)',
        ExpressionAttributeValues: {
          ':userId': USER_ID
        }
      };
      
      const photosWithJamo = await dynamoDB.scan(scanParams).promise();
      
      if (photosWithJamo.Items && photosWithJamo.Items.length > 0) {
        console.log(`Found ${photosWithJamo.Items.length} photos with matches for Jamo`);
        
        // Extract face IDs from the matched_users array
        const potentialFaceIds = new Set();
        
        for (const photo of photosWithJamo.Items) {
          if (photo.matched_users && Array.isArray(photo.matched_users)) {
            const jamoMatches = photo.matched_users.filter(match => match.userId === USER_ID);
            for (const match of jamoMatches) {
              if (match.faceId) {
                potentialFaceIds.add(match.faceId);
              }
            }
          }
        }
        
        if (potentialFaceIds.size > 0) {
          console.log(`Found ${potentialFaceIds.size} potential face IDs for Jamo: ${Array.from(potentialFaceIds).join(', ')}`);
          
          // Verify each face ID exists in Rekognition
          for (const faceId of potentialFaceIds) {
            try {
              const describeResult = await rekognition.describeFaces({
                CollectionId: COLLECTION_ID,
                FaceIds: [faceId]
              }).promise();
              
              if (describeResult.Faces && describeResult.Faces.length > 0) {
                console.log(`Verified face ID ${faceId} exists in Rekognition: ${JSON.stringify(describeResult.Faces[0])}`);
                jamoFaces = describeResult.Faces;
                break;
              }
            } catch (error) {
              console.error(`Error verifying face ID ${faceId}:`, error.message);
            }
          }
        }
      }
    }

    if (jamoFaces.length === 0) {
      console.log("No faces found for Jamo. We need to register a new face.");
      console.log("Please capture and register a face through the UI first.");
      return;
    }

    console.log(`Found ${jamoFaces.length} faces belonging to Jamo`);
    console.log(JSON.stringify(jamoFaces.map(face => ({
      FaceId: face.FaceId,
      ExternalImageId: face.ExternalImageId
    })), null, 2));

    // Step 4: Use the first face as Jamo's canonical face
    const primaryFace = jamoFaces[0];
    console.log(`Using face ID ${primaryFace.FaceId} as Jamo's canonical face`);

    // Step 5: Check if face data already exists in DynamoDB
    const existingFaceData = await dynamoDB.query({
      TableName: FACE_DATA_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': USER_ID
      }
    }).promise();

    // Step 6: Create or update face data in DynamoDB
    const timestamp = new Date().toISOString();
    const imagePath = `${USER_ID}/${Date.now()}.jpg`;
    const imageUrl = `https://shmong.s3.amazonaws.com/face-images/${imagePath}`;
    
    // Construct face data record
    const faceData = {
      userId: USER_ID,
      faceId: primaryFace.FaceId,
      createdAt: timestamp,
      updatedAt: timestamp,
      imageUrl: imageUrl,
      imagePath: imagePath,
      historicalMatches: [],
      // Add face attributes in a format compatible with the app
      faceAttributes: JSON.stringify({
        Confidence: primaryFace.Confidence,
        BoundingBox: primaryFace.BoundingBox,
        // Add more attributes as available
      })
    };

    console.log("Saving face data to DynamoDB:", JSON.stringify(faceData, null, 2));
    
    await dynamoDB.put({
      TableName: FACE_DATA_TABLE,
      Item: faceData
    }).promise();
    
    console.log("✅ Face data saved successfully to DynamoDB");

    // Step 7: Now search for matches to properly populate the user's matches
    console.log("Searching for matches with Jamo's face...");
    
    const searchParams = {
      CollectionId: COLLECTION_ID,
      FaceId: primaryFace.FaceId,
      MaxFaces: 150,      // Increase from original 10 to find more matches
      FaceMatchThreshold: 93  // Lower from 95 to find more matches
    };
    
    const searchResult = await rekognition.searchFaces(searchParams).promise();
    
    if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
      console.log(`Found ${searchResult.FaceMatches.length} face matches for Jamo`);
      
      // Record these matches in the photos table
      for (const match of searchResult.FaceMatches) {
        const externalId = match.Face.ExternalImageId;
        // Skip matches that don't look like photo IDs
        if (!externalId || !externalId.startsWith('photo_')) {
          continue;
        }
        
        // Extract photo ID
        const photoId = externalId.substring(6);
        console.log(`Processing match in photo: ${photoId}, similarity: ${match.Similarity}`);
        
        try {
          // Get the current photo record
          const photoResult = await dynamoDB.get({
            TableName: 'shmong-photos',
            Key: { id: photoId }
          }).promise();
          
          if (!photoResult.Item) {
            console.log(`Photo ${photoId} not found, skipping`);
            continue;
          }
          
          // Prepare matched_users array
          let matchedUsers = photoResult.Item.matched_users || [];
          if (!Array.isArray(matchedUsers)) {
            matchedUsers = [];
          }
          
          // Check if Jamo is already in this photo's matches
          const alreadyMatched = matchedUsers.some(user => 
            user.userId === USER_ID || 
            (typeof user === 'string' && user === USER_ID)
          );
          
          if (alreadyMatched) {
            console.log(`User ${USER_ID} already in matched_users for photo ${photoId}`);
            continue;
          }
          
          // Add Jamo to the matched_users array
          matchedUsers.push({
            userId: USER_ID,
            faceId: primaryFace.FaceId,
            similarity: match.Similarity,
            matchedAt: timestamp
          });
          
          // Update the photo
          await dynamoDB.update({
            TableName: 'shmong-photos',
            Key: { id: photoId },
            UpdateExpression: 'set matched_users = :matched_users, updated_at = :updated_at',
            ExpressionAttributeValues: {
              ':matched_users': matchedUsers,
              ':updated_at': timestamp
            }
          }).promise();
          
          console.log(`✅ Successfully added Jamo to matched_users for photo ${photoId}`);
        } catch (error) {
          console.error(`Error updating photo ${photoId}:`, error.message);
        }
      }
    } else {
      console.log("No matches found for Jamo's face");
    }
    
    // Final step: Update Jamo's user record to mark face as registered
    await dynamoDB.update({
      TableName: 'shmong-users',
      Key: { id: USER_ID },
      UpdateExpression: 'set face_registered = :registered, rekognitionFaceId = :faceId, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':registered': true,
        ':faceId': primaryFace.FaceId,
        ':timestamp': timestamp
      }
    }).promise();
    
    console.log(`✅ Updated user record for Jamo (${USER_ID})`);
    console.log("Face registration repair complete! Jamo should now see matches in the UI.");
    
  } catch (error) {
    console.error("Error fixing face registration:", error);
  }
}

// Run the fix function
fixJamoRegistration(); 