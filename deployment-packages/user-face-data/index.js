const AWS = require('aws-sdk');

// Initialize AWS clients
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const USER_TABLE = 'shmong-users';
const FACE_COLLECTION_ID = 'shmong-faces';

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { userId } = queryParams;

    // Validate request parameters
    if (!userId) {
      console.error('Missing required userId parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'userId is required',
          error: 'Missing required query parameter'
        })
      };
    }

    // Verify user exists
    const userParams = {
      TableName: USER_TABLE,
      Key: { id: userId }
    };

    console.log('Looking up user by ID:', userId);
    const userResult = await dynamoDB.get(userParams).promise();
    if (!userResult.Item) {
      console.error('User not found:', userId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          message: 'User not found',
          error: 'The requested user does not exist'
        })
      };
    }

    const user = userResult.Item;
    
    // Check if user has registered a face
    if (!user.rekognitionFaceId) {
      console.log('User has not registered a face:', userId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'No face registered',
          hasFaceRegistered: false,
          faceData: null
        })
      };
    }

    // Get face details from Rekognition
    const faceParams = {
      CollectionId: FACE_COLLECTION_ID,
      FaceId: user.rekognitionFaceId
    };

    console.log('Getting face details from Rekognition for face ID:', user.rekognitionFaceId);
    const faceResult = await rekognition.describeFaces(faceParams).promise();
    
    if (!faceResult.Faces || faceResult.Faces.length === 0) {
      console.warn('Face not found in Rekognition collection:', user.rekognitionFaceId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Face registered but not found in Rekognition',
          hasFaceRegistered: true,
          faceData: null
        })
      };
    }

    // Get historical match count
    const statsParams = {
      FunctionName: 'shmong-face-stats',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({
        userId: userId,
        faceId: user.rekognitionFaceId
      })
    };

    let faceStats = {
      totalMatches: 0,
      recentMatches: 0,
      lastMatchDate: null
    };

    try {
      const lambda = new AWS.Lambda();
      console.log('Invoking stats Lambda for user:', userId);
      const statsResult = await lambda.invoke(statsParams).promise();
      
      if (statsResult.StatusCode === 200 && statsResult.Payload) {
        const statsPayload = JSON.parse(statsResult.Payload);
        if (statsPayload.statusCode === 200) {
          faceStats = JSON.parse(statsPayload.body);
        }
      }
    } catch (statsError) {
      console.error('Error getting face stats:', statsError);
      // Continue without stats rather than failing the whole request
    }

    // Return successful response with face data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Face data retrieved successfully',
        hasFaceRegistered: true,
        faceData: {
          faceId: user.rekognitionFaceId,
          registrationDate: user.updatedAt || user.createdAt,
          faceDetails: faceResult.Faces[0],
          stats: faceStats
        }
      })
    };
  } catch (error) {
    console.error('User face data error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: process.env.DEBUG === 'true' ? error.message : 'An unexpected error occurred'
      })
    };
  }
}; 