const AWS = require('aws-sdk');

// Configure AWS SDK 
AWS.config.update({ region: 'us-east-1' }); // Update with your region

// Clients
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();

// Constants
const PHOTOS_TABLE = 'shmong-photos';
const USERS_TABLE = 'shmong-users';
const FACE_DATA_TABLE = 'shmong-face-data';
const COLLECTION_ID = 'shmong-faces';

/**
 * Main function to run the retroactive matching
 */
async function runRetroactiveMatching() {
  console.log('Starting retroactive face matching process...');
  
  try {
    // Step 1: Get all registered users with their face IDs
    const users = await getAllRegisteredUsers();
    console.log(`Found ${users.length} registered users with face data`);
    
    // Step 2: Get all photos with face data
    const photos = await getAllPhotos();
    console.log(`Found ${photos.length} photos with face data`);
    
    // Step 3: Process each photo
    let updatedCount = 0;
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      console.log(`Processing photo ${i+1}/${photos.length}: ${photo.id}`);
      
      // Skip photos without faces detected
      if (!photo.face_ids || photo.face_ids.length === 0) {
        console.log(`  - Skipping photo ${photo.id}: No faces detected`);
        continue;
      }
      
      // Initialize matched_users array if it doesn't exist
      if (!photo.matched_users) {
        photo.matched_users = [];
      }
      
      // Convert matched_users to array if it's a string
      if (typeof photo.matched_users === 'string') {
        try {
          photo.matched_users = JSON.parse(photo.matched_users);
        } catch (e) {
          console.log(`  - Error parsing matched_users JSON for photo ${photo.id}`);
          photo.matched_users = [];
        }
      }
      
      // Check matched_users is an array
      if (!Array.isArray(photo.matched_users)) {
        console.log(`  - matched_users is not an array for photo ${photo.id}, resetting it`);
        photo.matched_users = [];
      }
      
      // Track if we need to update this photo
      let photoUpdated = false;
      
      // For each face in the photo
      for (const faceId of photo.face_ids) {
        console.log(`  - Processing face ID: ${faceId}`);
        
        // Search for matches with this face
        const matches = await searchFaceMatches(faceId);
        
        if (matches && matches.length > 0) {
          console.log(`    - Found ${matches.length} potential matches`);
          
          // Process each match
          for (const match of matches) {
            const { faceId: matchedFaceId, externalImageId, similarity } = match;
            
            // Skip if matched face is not a user_* face
            if (!externalImageId || !externalImageId.startsWith('user_')) {
              continue;
            }
            
            // Extract user ID
            const userId = externalImageId.substring(5);
            
            // Skip if similarity is below threshold
            if (similarity < 80) {
              console.log(`    - Match with user ${userId} has low similarity (${similarity.toFixed(2)}%), skipping`);
              continue;
            }
            
            // Skip if this is the photo uploader
            if (userId === photo.user_id) {
              console.log(`    - Matching user ${userId} is the photo uploader, already included`);
              continue;
            }
            
            // Check if this user is already in matched_users
            const existingMatch = photo.matched_users.find(m => 
              (m.userId && m.userId === userId) || 
              (m.user_id && m.user_id === userId) ||
              (typeof m === 'string' && m === userId)
            );
            
            if (!existingMatch) {
              console.log(`    - Adding new match: User ${userId} with similarity ${similarity.toFixed(2)}%`);
              
              // Add user to matched_users
              photo.matched_users.push({
                userId: userId,
                faceId: matchedFaceId,
                similarity: parseFloat(similarity.toFixed(4)),
                matchedAt: new Date().toISOString()
              });
              
              photoUpdated = true;
            } else {
              console.log(`    - User ${userId} already in matched_users list`);
            }
          }
        } else {
          console.log(`    - No matches found for face ${faceId}`);
        }
      }
      
      // If we added any new matches, update the photo in DynamoDB
      if (photoUpdated) {
        console.log(`  - Updating photo ${photo.id} with ${photo.matched_users.length} matched users`);
        await updatePhotoMatches(photo.id, photo.matched_users);
        updatedCount++;
      } else {
        console.log(`  - No new matches for photo ${photo.id}`);
      }
    }
    
    console.log(`\nRetroactive matching complete. Updated ${updatedCount} photos.`);
    
  } catch (error) {
    console.error('Error in retroactive matching process:', error);
  }
}

/**
 * Get all users who have registered their face
 */
async function getAllRegisteredUsers() {
  const registeredUsers = [];
  
  try {
    // Scan the face data table to get all registered users
    const scanParams = {
      TableName: FACE_DATA_TABLE
    };
    
    const response = await dynamoDB.scan(scanParams).promise();
    
    if (response.Items && response.Items.length > 0) {
      // Filter for users with valid face IDs
      return response.Items.filter(item => item.userId && item.faceId);
    }
  } catch (error) {
    console.error('Error fetching registered users:', error);
  }
  
  return registeredUsers;
}

/**
 * Get all photos with faces from DynamoDB
 */
async function getAllPhotos() {
  const photos = [];
  
  try {
    // Scan the photos table
    const scanParams = {
      TableName: PHOTOS_TABLE
    };
    
    const response = await dynamoDB.scan(scanParams).promise();
    
    if (response.Items && response.Items.length > 0) {
      // Return all photos
      return response.Items;
    }
  } catch (error) {
    console.error('Error fetching photos:', error);
  }
  
  return photos;
}

/**
 * Search for matching faces in the collection
 */
async function searchFaceMatches(faceId) {
  try {
    const searchParams = {
      CollectionId: COLLECTION_ID,
      FaceId: faceId,
      MaxFaces: 150,
      FaceMatchThreshold: 95.0
    };
    
    const response = await rekognition.searchFaces(searchParams).promise();
    
    if (response.FaceMatches && response.FaceMatches.length > 0) {
      // Transform the results to a simpler format
      return response.FaceMatches.map(match => ({
        faceId: match.Face.FaceId,
        externalImageId: match.Face.ExternalImageId,
        similarity: match.Similarity
      }));
    }
  } catch (error) {
    console.error(`Error searching for face matches for face ${faceId}:`, error);
  }
  
  return [];
}

/**
 * Update a photo's matched_users array in DynamoDB
 */
async function updatePhotoMatches(photoId, matchedUsers) {
  try {
    const updateParams = {
      TableName: PHOTOS_TABLE,
      Key: { id: photoId },
      UpdateExpression: 'SET matched_users = :matchedUsers, updated_at = :updatedAt',
      ExpressionAttributeValues: {
        ':matchedUsers': matchedUsers,
        ':updatedAt': new Date().toISOString()
      }
    };
    
    await dynamoDB.update(updateParams).promise();
    return true;
  } catch (error) {
    console.error(`Error updating matched_users for photo ${photoId}:`, error);
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  runRetroactiveMatching()
    .then(() => console.log('Script completed'))
    .catch(err => console.error('Script failed:', err));
}

module.exports = {
  runRetroactiveMatching
}; 