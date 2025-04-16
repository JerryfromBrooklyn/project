const AWS = require('aws-sdk');

// Initialize AWS clients
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const USER_TABLE = 'shmong-users';
const PHOTOS_TABLE = 'shmong-photos';
const DETECTED_FACES_TABLE = 'shmong-detected-faces';
const NOTIFICATIONS_TABLE = 'shmong-notifications';

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
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'No face registered',
          error: 'The user has not registered a face for matching'
        })
      };
    }

    // Get recent notifications (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    const notifyParams = {
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'UserIdIndex',  // GSI on userId
      KeyConditionExpression: 'userId = :userId AND notificationType = :type',
      FilterExpression: 'createdAt >= :startDate',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'NEW_MATCH',
        ':startDate': oneWeekAgoStr
      }
    };

    console.log('Querying recent match notifications for user:', userId);
    const notifyResult = await dynamoDB.query(notifyParams).promise();
    const recentNotifications = notifyResult.Items || [];

    // Extract photo IDs from notifications
    const photoIds = [];
    const matchData = {};
    
    for (const notification of recentNotifications) {
      if (notification.photoId && notification.faceId) {
        photoIds.push(notification.photoId);
        
        // Store match data by photoId for easy lookup later
        if (!matchData[notification.photoId]) {
          matchData[notification.photoId] = [];
        }
        
        matchData[notification.photoId].push({
          faceId: notification.faceId,
          confidence: notification.confidence,
          boundingBox: notification.boundingBox,
          notificationId: notification.id
        });
      }
    }

    // Get unique photo IDs
    const uniquePhotoIds = [...new Set(photoIds)];
    
    if (uniquePhotoIds.length === 0) {
      console.log('No recent matches found for user:', userId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'No recent matches found',
          matches: []
        })
      };
    }

    // Batch get the photos
    const photoChunks = [];
    for (let i = 0; i < uniquePhotoIds.length; i += 25) {  // DynamoDB BatchGet limit is 25
      photoChunks.push(uniquePhotoIds.slice(i, i + 25));
    }

    const photos = [];
    for (const chunk of photoChunks) {
      const photoKeys = chunk.map(id => ({ photoId: id }));
      
      const batchParams = {
        RequestItems: {
          [PHOTOS_TABLE]: {
            Keys: photoKeys
          }
        }
      };
      
      console.log('Batch getting photos, chunk size:', chunk.length);
      const batchResult = await dynamoDB.batchGet(batchParams).promise();
      const retrievedPhotos = batchResult.Responses?.[PHOTOS_TABLE] || [];
      photos.push(...retrievedPhotos);
    }

    // Associate match details with photos
    const matchedPhotos = photos.map(photo => {
      return {
        ...photo,
        matches: matchData[photo.photoId] || []
      };
    });

    // Mark notifications as read
    for (const notification of recentNotifications) {
      if (notification.status !== 'read') {
        const updateParams = {
          TableName: NOTIFICATIONS_TABLE,
          Key: { 
            id: notification.id,
            notificationType: notification.notificationType
          },
          UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': 'read',
            ':updatedAt': new Date().toISOString()
          }
        };
        
        console.log('Marking notification as read:', notification.id);
        await dynamoDB.update(updateParams).promise();
      }
    }

    // Return successful response with matched photos
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Recent matches retrieved successfully',
        matchCount: matchedPhotos.length,
        matches: matchedPhotos
      })
    };
  } catch (error) {
    console.error('Recent matches error:', error);
    
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