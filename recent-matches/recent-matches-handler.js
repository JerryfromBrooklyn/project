const AWS = require('aws-sdk');

// Initialize DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const FACE_DATA_TABLE = 'shmong-face-data';
const PHOTOS_TABLE = 'shmong-photos';

/**
 * Handles recent matches retrieval
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

    // Query DynamoDB for recent matches
    const params = {
      TableName: FACE_DATA_TABLE,
      IndexName: 'UserIdIndex', // Assuming we have a GSI on matchedUserId
      KeyConditionExpression: 'matchedUserId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort in descending order (newest first)
      Limit: 10 // Limit to 10 recent matches
    };

    const result = await dynamoDB.query(params).promise();
    
    // If no matches found, return empty array
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'No recent matches found',
          matches: []
        })
      };
    }

    // Get the photoIds from the matches
    const photoIds = [...new Set(result.Items.map(item => item.photoId))];
    
    // Get the photo details for these photoIds
    const photoPromises = photoIds.map(photoId => {
      const photoParams = {
        TableName: PHOTOS_TABLE,
        Key: { photoId }
      };
      return dynamoDB.get(photoParams).promise()
        .then(result => result.Item)
        .catch(error => {
          console.error(`Error fetching photo ${photoId}:`, error);
          return null;
        });
    });

    const photos = (await Promise.all(photoPromises)).filter(Boolean);
    
    // Map matches to include photo details
    const matches = result.Items.map(match => {
      const photo = photos.find(p => p.photoId === match.photoId);
      return {
        faceId: match.faceId,
        photoId: match.photoId,
        boundingBox: match.boundingBox,
        confidence: match.confidence,
        indexedAt: match.indexedAt,
        photo: photo || { photoId: match.photoId, message: 'Photo details not available' }
      };
    });

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recent matches retrieved successfully',
        matches
      })
    };
  } catch (error) {
    console.error('Recent matches error:', error);
    
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