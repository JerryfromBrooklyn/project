const AWS = require('aws-sdk');

// Initialize DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const USER_TABLE = 'shmong-users';

/**
 * Handles user face data retrieval
 */
exports.handler = async (event) => {
  try {
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

    // Get userId from query parameters
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'userId is required' })
      };
    }

    // Query DynamoDB for user
    const params = {
      TableName: USER_TABLE,
      Key: { userId }
    };

    const result = await dynamoDB.get(params).promise();
    
    // Check if user exists
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'User not found' })
      };
    }

    // Return only the face-related data
    const userData = {
      userId: result.Item.userId,
      hasFaceRegistered: !!result.Item.rekognitionFaceId,
      rekognitionFaceId: result.Item.rekognitionFaceId
    };

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User face data retrieved successfully',
        userData
      })
    };
  } catch (error) {
    console.error('User face data error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET'
      },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: process.env.DEBUG === 'true' ? error.message : undefined
      })
    };
  }
}; 