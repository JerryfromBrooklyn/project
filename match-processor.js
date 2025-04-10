const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();
const cloudwatch = new AWS.CloudWatch();

// Configuration
const PHOTOS_TABLE = 'shmong-photos';
const USER_PHOTOS_TABLE = 'shmong-user-photos';
const COLLECTION_ID = 'shmong-faces';
const FACE_MATCH_THRESHOLD = 80.0;

/**
 * Lambda handler for processing face match queue
 * Uses EXACTLY the same approach as the Fred fix
 * @param {Object} event - SQS event containing messages
 */
exports.handler = async (event) => {
  console.log(`Processing ${event.Records.length} match update requests`);
  
  const results = [];
  const processingStats = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
    totalMatchesAdded: 0,
    detailedResults: []
  };
  
  for (const record of event.Records) {
    try {
      processingStats.totalProcessed++;
      const message = JSON.parse(record.body);
      const { userId, faceId } = message;
      const startTime = Date.now();
      
      console.log(`[USER-${userId.substring(0,8)}] Processing match update`);
      
      // Process this specific user's matches
      const result = await processUserMatches(userId, faceId);
      const duration = Date.now() - startTime;
      
      const stats = {
        userId,
        success: true,
        matchesAdded: result.matchesAdded,
        totalMatches: result.totalMatches,
        processingTimeMs: duration,
        timestamp: new Date().toISOString()
      };
      
      processingStats.totalSuccess++;
      processingStats.totalMatchesAdded += result.matchesAdded;
      processingStats.detailedResults.push(stats);
      
      // Send stats to CloudWatch
      await sendMetricsToCloudWatch(userId, result.matchesAdded, duration);
      
      results.push(stats);
      
      console.log(`[USER-${userId.substring(0,8)}] Stats: Added ${result.matchesAdded} new matches, total: ${result.totalMatches}, processing time: ${duration}ms`);
      
    } catch (error) {
      processingStats.totalFailed++;
      console.error('Error processing message:', error);
      
      const errorDetail = {
        error: error.message,
        errorStack: error.stack,
        success: false,
        timestamp: new Date().toISOString()
      };
      
      processingStats.detailedResults.push(errorDetail);
      results.push(errorDetail);
    }
  }
  
  console.log('===== PROCESSING COMPLETE =====');
  console.log(`Total processed: ${processingStats.totalProcessed}`);
  console.log(`Successful: ${processingStats.totalSuccess}`);
  console.log(`Failed: ${processingStats.totalFailed}`);
  console.log(`Total new matches added: ${processingStats.totalMatchesAdded}`);
  
  return {
    batchItemFailures: results
      .filter(r => !r.success)
      .map((r, i) => ({ itemIdentifier: event.Records[i].messageId })),
    processingStats
  };
};

/**
 * Send metrics to CloudWatch
 */
async function sendMetricsToCloudWatch(userId, matchesAdded, duration) {
  try {
    const params = {
      MetricData: [
        {
          MetricName: 'MatchesAdded',
          Dimensions: [
            {
              Name: 'UserId',
              Value: userId.substring(0, 8) // First 8 chars to avoid dimension explosion
            }
          ],
          Unit: 'Count',
          Value: matchesAdded
        },
        {
          MetricName: 'ProcessingTime',
          Dimensions: [
            {
              Name: 'UserId',
              Value: userId.substring(0, 8)
            }
          ],
          Unit: 'Milliseconds',
          Value: duration
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
 * Process face matches for a single user
 * This is EXACTLY the same approach used in the Fred fix
 */
async function processUserMatches(userId, faceId) {
  // Track step timing for debugging
  const timings = {
    start: Date.now(),
    afterSearchFaces: 0,
    afterFilteringResults: 0,
    afterGettingExistingPhotos: 0,
    afterProcessingUpdates: 0
  };

  const matchStats = {
    potentialMatches: 0,
    filteredMatches: 0,
    newMatches: 0,
    errors: [],
    successfulUpdates: 0
  };

  try {
    // STEP 1: Make the ONE Rekognition API call to find all matching faces
    console.log(`[USER-${userId.substring(0,8)}] Searching for faces matching faceId ${faceId}`);
    const searchParams = {
      CollectionId: COLLECTION_ID,
      FaceId: faceId,
      FaceMatchThreshold: FACE_MATCH_THRESHOLD,
      MaxFaces: 1000
    };
    
    const searchResponse = await rekognition.searchFaces(searchParams).promise();
    timings.afterSearchFaces = Date.now();
    
    matchStats.potentialMatches = searchResponse.FaceMatches.length;
    console.log(`[USER-${userId.substring(0,8)}] Found ${searchResponse.FaceMatches.length} potential matches in ${timings.afterSearchFaces - timings.start}ms`);
    
    // STEP 2: Filter to only include photos (with photo_ prefix)
    const matchingPhotoIds = searchResponse.FaceMatches
      .filter(match => match.Face.ExternalImageId.startsWith('photo_'))
      .map(match => match.Face.ExternalImageId.replace('photo_', ''));
    
    timings.afterFilteringResults = Date.now();
    matchStats.filteredMatches = matchingPhotoIds.length;
    
    console.log(`[USER-${userId.substring(0,8)}] Filtered to ${matchingPhotoIds.length} valid photo matches in ${timings.afterFilteringResults - timings.afterSearchFaces}ms`);
    
    // STEP 3: Get existing matches for comparison
    const userPhotosParams = {
      TableName: USER_PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const existingPhotos = await dynamoDB.query(userPhotosParams).promise();
    const existingPhotoIds = new Set(existingPhotos.Items.map(item => item.photoId));
    
    timings.afterGettingExistingPhotos = Date.now();
    console.log(`[USER-${userId.substring(0,8)}] Found ${existingPhotoIds.size} existing matches in ${timings.afterGettingExistingPhotos - timings.afterFilteringResults}ms`);
    
    // STEP 4: Find photos that need to be added to the user's matches
    const newMatchPhotoIds = matchingPhotoIds.filter(photoId => !existingPhotoIds.has(photoId));
    matchStats.newMatches = newMatchPhotoIds.length;
    
    console.log(`[USER-${userId.substring(0,8)}] Found ${newMatchPhotoIds.length} new matches to add`);
    
    // STEP 5: Update each matching photo with this user ID if needed
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
          console.warn(`[USER-${userId.substring(0,8)}] Photo ${photoId} not found in database`);
          matchStats.errors.push({ photoId, error: 'Photo not found in database' });
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
          matchStats.successfulUpdates++;
        }
      } catch (error) {
        console.error(`[USER-${userId.substring(0,8)}] Error updating photo ${photoId}:`, error);
        matchStats.errors.push({ photoId, error: error.message });
      }
    }
    
    timings.afterProcessingUpdates = Date.now();
    
    console.log(`[USER-${userId.substring(0,8)}] Successfully added ${matchesAdded} new matches for user ${userId}`);
    console.log(`[USER-${userId.substring(0,8)}] Timing breakdown:`, {
      rekognitionSearch: timings.afterSearchFaces - timings.start,
      filtering: timings.afterFilteringResults - timings.afterSearchFaces,
      existingPhotosLookup: timings.afterGettingExistingPhotos - timings.afterFilteringResults,
      databaseUpdates: timings.afterProcessingUpdates - timings.afterGettingExistingPhotos,
      total: timings.afterProcessingUpdates - timings.start
    });
    
    return {
      matchesAdded,
      totalMatches: existingPhotoIds.size + matchesAdded,
      timings,
      matchStats
    };
  } catch (error) {
    console.error(`[USER-${userId.substring(0,8)}] Critical error processing matches:`, error);
    throw error;
  }
} 