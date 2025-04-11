// API endpoint to check for user photo matches
// POST /api/user-photos/[userId]/check-matches

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
const FACE_MATCH_THRESHOLD = 80.0;

/**
 * API handler to check for user's photo matches
 */
module.exports = async (req, res) => {
  console.log('API: /api/user-photos/[userId]/check-matches called');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId' });
  }
  
  console.log(`API: Processing match request for user ${userId}`);
  
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
        success: true, 
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
    
    const needsUpdate = newMatchPhotoIds.length > 0;
    
    return res.status(200).json({
      success: true,
      matchesUpdated: needsUpdate,
      currentMatches: existingPhotoIds.size,
      newMatches: newMatchPhotoIds.length,
      totalMatches: existingPhotoIds.size + newMatchPhotoIds.length,
      userId
    });
  } catch (error) {
    console.error(`API: Error checking matches for user ${userId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to check photo matches',
      details: error.message
    });
  }
}; 
// POST /api/user-photos/[userId]/check-matches

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
const FACE_MATCH_THRESHOLD = 80.0;

/**
 * API handler to check for user's photo matches
 */
module.exports = async (req, res) => {
  console.log('API: /api/user-photos/[userId]/check-matches called');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId' });
  }
  
  console.log(`API: Processing match request for user ${userId}`);
  
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
        success: true, 
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
    
    const needsUpdate = newMatchPhotoIds.length > 0;
    
    return res.status(200).json({
      success: true,
      matchesUpdated: needsUpdate,
      currentMatches: existingPhotoIds.size,
      newMatches: newMatchPhotoIds.length,
      totalMatches: existingPhotoIds.size + newMatchPhotoIds.length,
      userId
    });
  } catch (error) {
    console.error(`API: Error checking matches for user ${userId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to check photo matches',
      details: error.message
    });
  }
}; 