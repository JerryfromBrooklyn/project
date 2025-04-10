const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
const cloudwatch = new AWS.CloudWatch();

// Configuration
const FACE_DATA_TABLE = 'shmong-face-data';
const USER_PROFILES_TABLE = 'shmong-user-profiles';
const MATCH_UPDATE_QUEUE_URL = process.env.MATCH_UPDATE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/photo-match-queue';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Main handler for user sign-in - checks if face matches need updating
 * @param {Object} event - Contains userId 
 */
exports.handler = async (event) => {
  const startTime = Date.now();
  const result = {
    success: false,
    matchesUpdated: false,
    async: false,
    timing: {
      total: 0,
      faceDataCheck: 0,
      profileCheck: 0,
      queueUpdate: 0
    },
    errors: []
  };
  
  try {
    const { userId } = event;
    if (!userId) {
      const error = new Error('Missing required parameter: userId');
      console.error('[ERROR] Missing userId:', error);
      result.errors.push({ code: 'MISSING_USERID', message: error.message });
      return result;
    }
    
    console.log(`[USER-${userId.substring(0,8)}] Processing sign-in`);
    
    const timeCheckStart = Date.now();
    
    // Step 1: Check if user has a registered face
    try {
      const faceData = await getFaceData(userId);
      result.timing.faceDataCheck = Date.now() - timeCheckStart;
      
      if (!faceData) {
        console.log(`[USER-${userId.substring(0,8)}] No registered face found`);
        result.success = true;
        result.noFaceRegistered = true;
        result.timing.total = Date.now() - startTime;
        
        // Log this to CloudWatch
        await sendMetricsToCloudWatch(userId, 'NoFaceRegistered');
        return result;
      }
      
      console.log(`[USER-${userId.substring(0,8)}] Found registered face ID: ${faceData.faceId}`);
      
      // Step 2: Check when matches were last updated
      const profileCheckStart = Date.now();
      const userProfile = await getUserProfile(userId);
      result.timing.profileCheck = Date.now() - profileCheckStart;
      
      const lastMatchUpdate = userProfile?.lastMatchUpdate || 0;
      const timeSinceUpdate = Date.now() - lastMatchUpdate;
      const hoursSinceUpdate = Math.floor(timeSinceUpdate / 3600000);
      
      console.log(`[USER-${userId.substring(0,8)}] Last match update: ${new Date(lastMatchUpdate).toISOString()} (${hoursSinceUpdate} hours ago)`);
      
      // Step 3: Only update if it's been more than the update interval
      if (timeSinceUpdate > UPDATE_INTERVAL) {
        console.log(`[USER-${userId.substring(0,8)}] Needs matches update after ${hoursSinceUpdate} hours`);
        
        // Queue the update process instead of doing it synchronously
        const queueStart = Date.now();
        try {
          await queueMatchUpdateJob(userId, faceData.faceId);
          
          // Update the timestamp immediately to prevent multiple updates
          await updateLastMatchTimestamp(userId);
          
          result.timing.queueUpdate = Date.now() - queueStart;
          result.success = true;
          result.matchesUpdated = true;
          result.async = true;
          
          // Log this to CloudWatch
          await sendMetricsToCloudWatch(userId, 'UpdateQueued');
        } catch (queueError) {
          console.error(`[USER-${userId.substring(0,8)}] Error queuing match update:`, queueError);
          result.errors.push({ 
            code: 'QUEUE_ERROR', 
            message: queueError.message,
            stack: queueError.stack
          });
          
          // Still mark as success for login flow - this is a background task
          result.success = true;
          result.queueError = true;
          
          // Log this to CloudWatch
          await sendMetricsToCloudWatch(userId, 'QueueError');
        }
      } else {
        console.log(`[USER-${userId.substring(0,8)}] Matches are up to date (updated ${hoursSinceUpdate} hours ago)`);
        result.success = true;
        result.recentlyUpdated = true;
        
        // Log this to CloudWatch
        await sendMetricsToCloudWatch(userId, 'AlreadyUpToDate');
      }
    } catch (faceCheckError) {
      console.error(`[USER-${userId.substring(0,8)}] Error checking face data:`, faceCheckError);
      result.errors.push({ 
        code: 'FACE_CHECK_ERROR', 
        message: faceCheckError.message,
        stack: faceCheckError.stack
      });
      
      // Still mark as success for login flow - matching is a background task
      result.success = true;
      result.faceCheckError = true;
      
      // Log this to CloudWatch
      await sendMetricsToCloudWatch(userId, 'FaceCheckError');
    }
    
    result.timing.total = Date.now() - startTime;
    console.log(`[USER-${userId.substring(0,8)}] Processing complete in ${result.timing.total}ms`);
    
    return result;
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('[CRITICAL] Error in sign-in process:', error);
    
    result.errors.push({ 
      code: 'CRITICAL_ERROR', 
      message: error.message,
      stack: error.stack
    });
    result.timing.total = errorTime;
    
    // Try to identify the userId for logging even on error
    const userId = event?.userId || 'unknown';
    await sendMetricsToCloudWatch(userId, 'CriticalError');
    
    return result;
  }
};

/**
 * Send metrics to CloudWatch
 */
async function sendMetricsToCloudWatch(userId, eventType) {
  try {
    const params = {
      MetricData: [
        {
          MetricName: 'SignInMatchCheckEvent',
          Dimensions: [
            {
              Name: 'UserId',
              Value: userId.substring(0, 8) // First 8 chars to avoid dimension explosion
            },
            {
              Name: 'EventType',
              Value: eventType
            }
          ],
          Unit: 'Count',
          Value: 1
        }
      ],
      Namespace: 'Shmong/PhotoMatching'
    };
    
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error('Error sending metrics to CloudWatch:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Get user's face ID from the face data table
 */
async function getFaceData(userId) {
  try {
    const params = {
      TableName: FACE_DATA_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ':userId': userId }
    };
    
    const response = await dynamoDB.scan(params).promise();
    
    if (response.Items && response.Items.length > 0) {
      return response.Items[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting face data for user ${userId}:`, error);
    throw new Error(`Failed to retrieve face data: ${error.message}`);
  }
}

/**
 * Get user profile from the profiles table
 */
async function getUserProfile(userId) {
  try {
    const params = {
      TableName: USER_PROFILES_TABLE,
      Key: { userId }
    };
    
    const response = await dynamoDB.get(params).promise();
    return response.Item;
  } catch (error) {
    console.error(`Error getting user profile for ${userId}:`, error);
    throw new Error(`Failed to retrieve user profile: ${error.message}`);
  }
}

/**
 * Update the lastMatchUpdate timestamp for a user
 */
async function updateLastMatchTimestamp(userId) {
  try {
    const params = {
      TableName: USER_PROFILES_TABLE,
      Key: { userId },
      UpdateExpression: 'set lastMatchUpdate = :now',
      ExpressionAttributeValues: { ':now': Date.now() }
    };
    
    await dynamoDB.update(params).promise();
    console.log(`[USER-${userId.substring(0,8)}] Updated lastMatchUpdate timestamp`);
  } catch (error) {
    console.error(`Error updating lastMatchUpdate for user ${userId}:`, error);
    throw new Error(`Failed to update last match timestamp: ${error.message}`);
  }
}

/**
 * Add a match update job to the SQS queue
 */
async function queueMatchUpdateJob(userId, faceId) {
  try {
    const message = {
      userId,
      faceId,
      timestamp: Date.now()
    };
    
    const params = {
      QueueUrl: MATCH_UPDATE_QUEUE_URL,
      MessageBody: JSON.stringify(message)
    };
    
    const result = await sqs.sendMessage(params).promise();
    console.log(`[USER-${userId.substring(0,8)}] Queued match update job: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error(`Error queuing match update job for user ${userId}:`, error);
    throw new Error(`Failed to queue match update job: ${error.message}`);
  }
} 