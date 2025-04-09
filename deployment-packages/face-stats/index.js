const AWS = require('aws-sdk');

// Initialize AWS clients
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const DETECTED_FACES_TABLE = 'shmong-detected-faces';
const NOTIFICATIONS_TABLE = 'shmong-notifications';

exports.handler = async (event) => {
  try {
    // Parse request payload
    const { userId, faceId } = event;

    // Validate request parameters
    if (!userId) {
      console.error('Missing required userId parameter');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'userId is required',
          error: 'Missing required parameter'
        })
      };
    }

    // Get total face matches
    const faceParams = {
      TableName: DETECTED_FACES_TABLE,
      IndexName: 'UserIdIndex',  // GSI on userId
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    console.log('Counting total face matches for user:', userId);
    const faceResult = await dynamoDB.query(faceParams).promise();
    const totalMatches = faceResult.Items?.length || 0;

    // Get recent matches (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    const recentParams = {
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'UserIdIndex',  // GSI on userId
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'createdAt >= :startDate',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': oneWeekAgoStr
      }
    };

    console.log('Counting recent notifications for user:', userId);
    const recentResult = await dynamoDB.query(recentParams).promise();
    const recentMatches = recentResult.Items?.length || 0;

    // Get last match date
    let lastMatchDate = null;
    
    if (recentResult.Items && recentResult.Items.length > 0) {
      // Sort by created date in descending order
      const sortedNotifications = [...recentResult.Items].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      lastMatchDate = sortedNotifications[0].createdAt;
    }

    // Return successful response with stats
    return {
      statusCode: 200,
      body: JSON.stringify({
        totalMatches,
        recentMatches,
        lastMatchDate
      })
    };
  } catch (error) {
    console.error('Face stats error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: process.env.DEBUG === 'true' ? error.message : 'An unexpected error occurred'
      })
    };
  }
}; 