const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();

// Config
const FRED_USER_ID = '749824e8-b011-7008-69ba-fbd51a255bb9';
const PHOTOS_TABLE = 'shmong-photos';
const FACE_DATA_TABLE = 'shmong-face-data';
const COLLECTION_ID = 'shmong-faces';

/**
 * Main function to update all of Fred's matches
 */
async function updateFredMatches() {
  console.log('🔄 Starting comprehensive update for Fred\'s matches');
  console.log(`🧑 Fred's User ID: ${FRED_USER_ID}`);
  
  // Step 1: Get Fred's face ID
  console.log('\n🔍 Step 1: Getting Fred\'s registered face ID...');
  let fredFaceId;
  
  try {
    const faceDataParams = {
      TableName: FACE_DATA_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": FRED_USER_ID }
    };
    
    const faceData = await dynamoDB.scan(faceDataParams).promise();
    
    if (!faceData.Items || faceData.Items.length === 0) {
      console.error('❌ ERROR: Fred does not have a registered face!');
      return;
    }
    
    fredFaceId = faceData.Items[0].faceId;
    console.log(`✅ Found Fred's face ID: ${fredFaceId}`);
  } catch (error) {
    console.error('❌ Error getting Fred\'s face data:', error);
    return;
  }
  
  // Step 2: Search for matches in Rekognition collection
  console.log('\n🔍 Step 2: Searching for Fred\'s face matches in Rekognition...');
  
  try {
    const searchParams = {
      CollectionId: COLLECTION_ID,
      FaceId: fredFaceId,
      MaxFaces: 1000,
      FaceMatchThreshold: 98.0
    };
    
    const searchResponse = await rekognition.searchFaces(searchParams).promise();
    
    if (!searchResponse.FaceMatches || searchResponse.FaceMatches.length === 0) {
      console.log('❌ No matches found for Fred\'s face in Rekognition!');
      return;
    }
    
    console.log(`✅ Found ${searchResponse.FaceMatches.length} potential matches in Rekognition`);
    
    // Step 3: Filter matches to only include photo_ prefix (not user_ prefix)
    const photoMatches = searchResponse.FaceMatches.filter(match => {
      const externalId = match.Face.ExternalImageId;
      return externalId && externalId.startsWith('photo_');
    });
    
    console.log(`✅ Filtered to ${photoMatches.length} matches with photo_ prefix`);
    
    // Step 4: Update all matched photos
    console.log('\n🔍 Step 4: Updating all matched photos to include Fred...');
    let updatedCount = 0;
    const timestamp = new Date().toISOString();
    
    for (const match of photoMatches) {
      const externalId = match.Face.ExternalImageId;
      const similarity = match.Similarity;
      
      // Extract the photoId by removing the 'photo_' prefix
      const photoId = externalId.substring(6);
      
      // Get the photo data
      try {
        const getPhotoParams = {
          TableName: PHOTOS_TABLE,
          Key: { id: photoId }
        };
        
        const photoResult = await dynamoDB.get(getPhotoParams).promise();
        const photo = photoResult.Item;
        
        if (!photo) {
          console.log(`❌ Photo ${photoId} not found in database!`);
          continue;
        }
        
        // Process matched_users array
        let matchedUsers = photo.matched_users || [];
        
        // Convert to array if it's a string
        if (typeof matchedUsers === 'string') {
          try {
            matchedUsers = JSON.parse(matchedUsers);
          } catch (e) {
            console.log(`❌ Invalid JSON in matched_users for photo ${photoId}`);
            matchedUsers = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(matchedUsers)) {
          matchedUsers = [];
        }
        
        // Check if Fred is already in matched_users
        const fredIndex = matchedUsers.findIndex(m => {
          if (typeof m === 'string') return m === FRED_USER_ID;
          if (m && typeof m === 'object') {
            return m.userId === FRED_USER_ID || m.user_id === FRED_USER_ID;
          }
          return false;
        });
        
        // If Fred is not already in matched_users, add him
        if (fredIndex === -1) {
          // Add Fred to matched_users
          matchedUsers.push({
            userId: FRED_USER_ID,
            faceId: fredFaceId,
            similarity: parseFloat(similarity.toFixed(4)),
            matchedAt: timestamp
          });
          
          // Update the photo record
          const updateParams = {
            TableName: PHOTOS_TABLE,
            Key: { id: photoId },
            UpdateExpression: 'SET matched_users = :matchedUsers, updated_at = :updatedAt',
            ExpressionAttributeValues: {
              ':matchedUsers': matchedUsers,
              ':updatedAt': timestamp
            },
            ReturnValues: 'UPDATED_NEW'
          };
          
          await dynamoDB.update(updateParams).promise();
          updatedCount++;
          console.log(`✅ Added Fred to matched_users for photo ${photoId} (Similarity: ${similarity.toFixed(2)}%)`);
        } else {
          console.log(`ℹ️ Fred already in matched_users for photo ${photoId}`);
        }
      } catch (error) {
        console.error(`❌ Error updating photo ${photoId}:`, error);
      }
    }
    
    console.log(`\n🎉 Update complete! Added Fred to ${updatedCount} photos.`);
    
    if (updatedCount === 0) {
      console.log(`\n⚠️ WARNING: No new photos were updated. This could mean:`);
      console.log('1. Fred is already in all possible matches');
      console.log('2. There are filtering issues in the matching process');
      console.log('3. The "My Photos" UI has a limit on displayed photos');
    }
  } catch (error) {
    console.error('❌ Error searching for face matches:', error);
  }
}

// Run the update
updateFredMatches().catch(console.error); 