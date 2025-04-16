// API endpoint to update user photo matches
// POST /api/user-photos/[userId]/update-matches

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();

// Configure AWS
AWS.config.update({
  region: 'us-east-1'
});

// Configuration
const COLLECTION_ID = 'shmong-faces';
const FACE_DATA_TABLE = 'shmong-face-data';
const PHOTOS_TABLE = 'shmong-photos';
const USER_PHOTOS_TABLE = 'shmong-user-photos';
const FACE_MATCH_THRESHOLD = 98.0;

/**
 * API handler to update a user's photo matches
 */
module.exports = async (req, res) => {
  console.log('API: /api/user-photos/[userId]/update-matches called');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId' });
  }
  
  console.log(`API: Processing match update for user ${userId}`);
  
  try {
    // Step 1: Check if user has a registered face
    const faceDataParams = {
      TableName: FACE_DATA_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ':userId': userId }
    };
    
    const faceDataResponse = await dynamoDB.scan(faceDataParams).promise();
    
    if (!faceDataResponse.Items || faceDataResponse.Items.length === 0) {
      console.log(`API: User ${userId} has no registered face`);
      return res.status(200).json({ 
        success: false, 
        matchesUpdated: false,
        noFaceRegistered: true
      });
    }
    
    const faceId = faceDataResponse.Items[0].faceId;
    console.log(`API: Found registered face ID: ${faceId}`);
    
    // Step 2: Find matches for this user's face using Rekognition
    // This uses ONE API call to get ALL potential matches
    console.log(`API: Searching for face matches for ID ${faceId}`);
    
    const searchParams = {
      CollectionId: COLLECTION_ID,
      FaceId: faceId,
      FaceMatchThreshold: FACE_MATCH_THRESHOLD,
      MaxFaces: 1000
    };
    
    const searchResponse = await rekognition.searchFaces(searchParams).promise();
    console.log(`API: Found ${searchResponse.FaceMatches.length} potential matches`);
    
    // Step 3: Filter to only include photos
    const matchingPhotoIds = searchResponse.FaceMatches
      .filter(match => match.Face.ExternalImageId.startsWith('photo_'))
      .map(match => match.Face.ExternalImageId.replace('photo_', ''));
    
    console.log(`API: Filtered to ${matchingPhotoIds.length} valid photo matches`);
    
    // Step 4: Get existing matches for comparison
    const userPhotosParams = {
      TableName: USER_PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const existingPhotos = await dynamoDB.query(userPhotosParams).promise();
    const existingPhotoIds = new Set(existingPhotos.Items.map(item => item.photoId));
    
    console.log(`API: User has ${existingPhotoIds.size} existing matches`);
    
    // Step 5: Find photos that need to be added
    const newMatchPhotoIds = matchingPhotoIds.filter(photoId => !existingPhotoIds.has(photoId));
    console.log(`API: Found ${newMatchPhotoIds.length} new matches to add`);
    
    // Step 6: Update each matching photo with this user ID if needed
    let matchesAdded = 0;
    
    for (const photoId of newMatchPhotoIds) {
      try {
        // Get current photo data
        const photoParams = {
          TableName: PHOTOS_TABLE,
          Key: { photoId }
        };
        
        const photoData = await dynamoDB.get(photoParams).promise();
        
        if (!photoData.Item) {
          console.warn(`API: Photo ${photoId} not found in database`);
          continue;
        }
        
        // Check if user is already in matched_users
        const matchedUsers = photoData.Item.matched_users || [];
        if (!matchedUsers.includes(userId)) {
          // Add user to matched_users array
          const updateParams = {
            TableName: PHOTOS_TABLE,
            Key: { photoId },
            UpdateExpression: 'set matched_users = list_append(if_not_exists(matched_users, :empty_list), :user)',
            ExpressionAttributeValues: {
              ':user': [userId],
              ':empty_list': []
            }
          };
          
          await dynamoDB.update(updateParams).promise();
          
          // Also add to user_photos table
          const similarity = searchResponse.FaceMatches.find(
            match => match.Face.ExternalImageId === `photo_${photoId}`
          )?.Similarity || FACE_MATCH_THRESHOLD;
          
          const userPhotoParams = {
            TableName: USER_PHOTOS_TABLE,
            Item: {
              userId,
              photoId,
              matchTimestamp: Date.now(),
              confidence: similarity
            }
          };
          
          await dynamoDB.put(userPhotoParams).promise();
          matchesAdded++;
        }
      } catch (error) {
        console.error(`API: Error updating photo ${photoId}:`, error);
      }
    }
    
    console.log(`API: Successfully added ${matchesAdded} new matches for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      matchesAdded,
      newMatches: matchesAdded,
      totalMatches: existingPhotoIds.size + matchesAdded,
      userId
    });
  } catch (error) {
    console.error(`API: Error updating matches for user ${userId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to update photo matches',
      details: error.message
    });
  }
}; 