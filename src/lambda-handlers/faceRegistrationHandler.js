const AWS = require('aws-sdk');

// Initialize AWS clients
const rekognition = new AWS.Rekognition({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const USER_TABLE = 'shmong-users';
const FACE_COLLECTION_ID = 'shmong-faces';

/**
 * Handles user face registration
 */
exports.handler = async (event) => {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid request body' })
      };
    }

    // Validate request parameters
    const { userId, imageData } = requestBody;
    if (!userId || !imageData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'userId and imageData are required' })
      };
    }

    // Verify user exists
    const userParams = {
      TableName: USER_TABLE,
      Key: { userId }
    };

    const userResult = await dynamoDB.get(userParams).promise();
    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'User not found' })
      };
    }

    // Prepare image data for Rekognition
    let imageBuffer;
    try {
      // Strip the base64 prefix if it exists (e.g., "data:image/jpeg;base64,")
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid image data format' })
      };
    }

    // Index face in Rekognition
    const indexParams = {
      CollectionId: FACE_COLLECTION_ID,
      ExternalImageId: userId,
      Image: {
        Bytes: imageBuffer
      },
      MaxFaces: 1,
      QualityFilter: 'AUTO',
      DetectionAttributes: ['ALL']
    };

    const indexResult = await rekognition.indexFaces(indexParams).promise();
    
    // Check if face was detected
    if (!indexResult.FaceRecords || indexResult.FaceRecords.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'No face detected in the image' })
      };
    }

    // Get the face ID
    const faceId = indexResult.FaceRecords[0].Face.FaceId;

    // Update user record with face ID
    const updateParams = {
      TableName: USER_TABLE,
      Key: { userId },
      UpdateExpression: 'set rekognitionFaceId = :faceId, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':faceId': faceId,
        ':timestamp': new Date().toISOString()
      },
      ReturnValues: 'UPDATED_NEW'
    };

    await dynamoDB.update(updateParams).promise();

    // Start a search for this face to find historical matches
    const searchParams = {
      CollectionId: FACE_COLLECTION_ID,
      FaceId: faceId,
      MaxFaces: 100,
      FaceMatchThreshold: 95
    };

    const searchResult = await rekognition.searchFaces(searchParams).promise();
    const matches = searchResult.FaceMatches || [];

    // Return successful response with face ID and match count
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Face registered successfully',
        faceId,
        matchCount: matches.length,
        faceDetails: indexResult.FaceRecords[0].FaceDetail
      })
    };
  } catch (error) {
    console.error('Face registration error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
      },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: process.env.DEBUG === 'true' ? error.message : undefined
      })
    };
  }
}; 