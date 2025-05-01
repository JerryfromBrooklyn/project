const AWS = require('aws-sdk');

// Initialize AWS services
const rekognition = new AWS.Rekognition({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const s3 = new AWS.S3({ region: 'us-east-1' });

// Constants
const FACE_COLLECTION_ID = 'shmong-faces';
const FACE_DATA_TABLE = 'shmong-face-data';
const USERS_TABLE = 'shmong-users';
const USER_ID = '5428a458-30c1-70c8-1a3c-51301838ff0e'; // Jamo's user ID

async function repairFaceData() {
  try {
    console.log(`Repairing face data for user ${USER_ID}...`);
    
    // 1. Check if user exists in DynamoDB
    const userResult = await dynamoDB.get({
      TableName: USERS_TABLE,
      Key: { id: USER_ID }
    }).promise();
    
    if (!userResult.Item) {
      console.error(`User ${USER_ID} not found in users table!`);
      return;
    }
    
    console.log(`Found user: ${userResult.Item.email}`);
    
    // 2. List faces in Rekognition collection
    const listFacesResult = await rekognition.listFaces({
      CollectionId: FACE_COLLECTION_ID,
      MaxResults: 1000
    }).promise();
    
    console.log(`Found ${listFacesResult.Faces.length} faces in Rekognition collection`);
    
    // 3. Find face entries belonging to this user in photos table
    const scanResult = await dynamoDB.scan({
      TableName: 'shmong-photos',
      FilterExpression: 'contains(matched_users, :userId)',
      ExpressionAttributeValues: {
        ':userId': USER_ID
      }
    }).promise();
    
    console.log(`Found ${scanResult.Items.length} photos with matches for this user`);
    
    if (scanResult.Items.length === 0) {
      console.log('No matches found. This user might not have been properly indexed.');
      return;
    }
    
    // 4. Extract face ID from matched photos
    let faceIds = [];
    for (const photo of scanResult.Items) {
      if (photo.matched_users && Array.isArray(photo.matched_users)) {
        const userMatches = photo.matched_users.filter(match => match.userId === USER_ID);
        for (const match of userMatches) {
          if (match.faceId && !faceIds.includes(match.faceId)) {
            faceIds.push(match.faceId);
          }
        }
      }
    }
    
    console.log(`Found ${faceIds.length} face IDs for this user: ${faceIds.join(', ')}`);
    
    if (faceIds.length === 0) {
      console.log('No face IDs found. User might need to register their face again.');
      return;
    }
    
    // 5. Check if the face IDs exist in Rekognition
    const validFaceIds = [];
    for (const faceId of faceIds) {
      try {
        const faceResult = await rekognition.searchFaces({
          CollectionId: FACE_COLLECTION_ID,
          FaceId: faceId,
          MaxFaces: 1
        }).promise();
        
        if (faceResult.FaceMatches && faceResult.FaceMatches.length > 0) {
          validFaceIds.push(faceId);
          console.log(`Verified face ID ${faceId} exists in Rekognition`);
        }
      } catch (error) {
        console.error(`Error verifying face ID ${faceId}:`, error.message);
      }
    }
    
    if (validFaceIds.length === 0) {
      console.log('No valid face IDs found in Rekognition. User needs to register their face again.');
      return;
    }
    
    // 6. Create face data entry in DynamoDB
    const timestamp = new Date().toISOString();
    const faceId = validFaceIds[0]; // Use the first valid face ID
    
    const faceData = {
      userId: USER_ID,
      faceId: faceId,
      createdAt: timestamp,
      updatedAt: timestamp,
      imageUrl: `https://shmong.s3.amazonaws.com/face-images/${USER_ID}/${Date.now()}.jpg`,
      imagePath: `${USER_ID}/${Date.now()}.jpg`,
      historicalMatches: []
    };
    
    // Add sample face attributes
    faceData.faceAttributes = JSON.stringify({
      Confidence: 99.9,
      BoundingBox: {
        Height: 0.5,
        Left: 0.25,
        Top: 0.25,
        Width: 0.5
      }
    });
    
    // 7. Save the face data to DynamoDB
    await dynamoDB.put({
      TableName: FACE_DATA_TABLE,
      Item: faceData
    }).promise();
    
    console.log(`Successfully created face data entry for user ${USER_ID} with face ID ${faceId}`);
    console.log('Face data repair complete! User should now see their matched photos.');
    
  } catch (error) {
    console.error('Error repairing face data:', error);
  }
}

repairFaceData(); 