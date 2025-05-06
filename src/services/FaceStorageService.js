// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutItemCommand, QueryCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, dynamoClient, docClient, rekognitionClient } from '../lib/awsClient';
import { normalizeToS3Url, convertCloudFrontToS3Url } from '../utils/s3Utils';
import { marshall } from '@aws-sdk/util-dynamodb';
// Use DocumentClient commands for simplified interaction
import { PutCommand as DocPutCommand, QueryCommand as DocQueryCommand, GetCommand as DocGetCommand, DeleteCommand as DocDeleteCommand, UpdateCommand as DocUpdateCommand, BatchGetCommand as DocBatchGetCommand } from '@aws-sdk/lib-dynamodb';
// Import Rekognition DetectLabels
import { DetectLabelsCommand } from '@aws-sdk/client-rekognition';

// S3 Bucket name for face data
const FACE_BUCKET_NAME = 'shmong';

// Feature flag for face verification
const ENABLE_FACE_VERIFICATION = false; // Set to false by default until fully tested

// Ensure Buffer exists in the environment - critical fix for browser compatibility
const isBrowser = typeof window !== 'undefined';
const hasBuffer = typeof Buffer !== 'undefined';

// Log the environment for debugging
console.log(`🔧 [FaceStorage] Environment detection: Browser=${isBrowser}, HasBuffer=${hasBuffer}`);

// Access AWS Clients - Now includes docClient
const getAWSClients = async () => {
  return {
    dynamoClient: dynamoClient, // Keep base client if needed elsewhere
    docClient: docClient,       // Add docClient
    s3Client,
    rekognitionClient
  };
};

// DetectLabels Configuration
const DETECT_LABELS_CONFIG = {
  maxLabels: 20,
  minConfidence: 80,
  maxDominantColors: 5,
  maxForegroundColors: 5,
  maxBackgroundColors: 5
};

/**
 * Analyze image with AWS Rekognition DetectLabels
 * @param {Uint8Array|Buffer} imageBytes - Binary image data
 * @returns {Promise<Object>} - Image analysis results
 */
export const analyzeImageWithDetectLabels = async (imageBytes) => {
  if (!imageBytes) {
    console.error('[FaceStorage] Cannot analyze image - missing image data');
    return null;
  }
  
  try {
    console.log(`✏️ [FaceStorage] Analyzing image with DetectLabels (maxLabels=${DETECT_LABELS_CONFIG.maxLabels}, minConfidence=${DETECT_LABELS_CONFIG.minConfidence}%)`);
    console.log(`✏️ [FaceStorage] Image data size: ${imageBytes.length} bytes`);
    
    const { rekognitionClient } = await getAWSClients();
    
    const params = {
      Image: {
        Bytes: imageBytes
      },
      Features: ["GENERAL_LABELS", "IMAGE_PROPERTIES"],
      MaxLabels: DETECT_LABELS_CONFIG.maxLabels,
      MinConfidence: DETECT_LABELS_CONFIG.minConfidence,
      Settings: {
        ImageProperties: {
          MaxDominantColors: DETECT_LABELS_CONFIG.maxDominantColors,
          // Configure color detection for foreground and background
          Foreground: {
            MaxDominantColors: DETECT_LABELS_CONFIG.maxForegroundColors
          },
          Background: {
            MaxDominantColors: DETECT_LABELS_CONFIG.maxBackgroundColors
          }
        }
      }
    };
    
    console.log(`✏️ [FaceStorage] Sending DetectLabels request to AWS...`);
    const command = new DetectLabelsCommand(params);
    const response = await rekognitionClient.send(command);
    
    console.log(`✏️ [FaceStorage] DetectLabels request successful!`);
    console.log(`✏️ [FaceStorage] DetectLabels found ${response.Labels?.length || 0} labels and image properties`);
    
    // Log some key information about the response
    if (response.Labels && response.Labels.length > 0) {
      const topLabels = response.Labels.slice(0, 5).map(label => `${label.Name} (${label.Confidence.toFixed(2)}%)`);
      console.log(`✏️ [FaceStorage] Top labels: ${topLabels.join(', ')}`);
    } else {
      console.log(`✏️ [FaceStorage] No labels found in the image`);
    }
    
    if (response.ImageProperties && response.ImageProperties.Quality) {
      const quality = response.ImageProperties.Quality;
      console.log(`✏️ [FaceStorage] Image quality: Sharpness=${quality.Sharpness?.toFixed(2)}, Brightness=${quality.Brightness?.toFixed(2)}, Contrast=${quality.Contrast?.toFixed(2)}`);
    } else {
      console.log(`✏️ [FaceStorage] No image quality information available`);
    }
    
    if (response.ImageProperties && response.ImageProperties.DominantColors) {
      const topColors = response.ImageProperties.DominantColors.slice(0, 3).map(color => color.HexCode);
      console.log(`✏️ [FaceStorage] Top 3 dominant colors: ${topColors.join(', ')}`);
    } else {
      console.log(`✏️ [FaceStorage] No dominant color information available`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ [FaceStorage] Error analyzing image with DetectLabels:', error);
    console.error('❌ [FaceStorage] Error details:', error.message);
    return null;
  }
};

/**
 * Deeply sanitizes an object for DynamoDB storage
 * Ensures all values are properly formatted according to DynamoDB requirements
 */
const sanitizeForDynamoDB = (obj) => {
  if (obj === null || obj === undefined) {
    return { NULL: true };
  }
  
  if (typeof obj === 'string') {
    return { S: obj };
  }
  
  if (typeof obj === 'number') {
    if (isNaN(obj) || obj === Infinity || obj === -Infinity) {
      return { N: '0' };
    }
    return { N: obj.toString() };
  }
  
  if (typeof obj === 'boolean') {
    return { BOOL: obj };
  }
  
  if (Array.isArray(obj)) {
    // Filter out undefined/null values and sanitize each element
    const validItems = obj.filter(item => item !== undefined && item !== null)
      .map(item => sanitizeForDynamoDB(item));
    
    if (validItems.length === 0) {
      return { L: [] };
    }
    
    return { L: validItems };
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
        sanitizedObj[key] = sanitizeForDynamoDB(obj[key]);
      }
    }
    
    if (Object.keys(sanitizedObj).length === 0) {
      return { M: {} };
    }
    
    return { M: sanitizedObj };
  }
  
  // Fallback for any other type
  return { S: String(obj) };
};

// Add a new helper function for parallel JSON stringification
/**
 * Stringify an object asynchronously to avoid blocking the main thread
 * @param {Object} data - Data to stringify
 * @returns {Promise<string>} - Stringified JSON
 */
const stringifyAsync = (data) => {
  return new Promise((resolve) => {
    try {
      // Use setTimeout to avoid blocking the main thread
      setTimeout(() => {
        try {
          const jsonString = JSON.stringify(data);
          resolve(jsonString);
        } catch (error) {
          console.error(`❌ [FaceStorage] Error stringifying data:`, error);
          resolve("{}"); // Return empty object on error
        }
      }, 0);
    } catch (error) {
      console.error(`❌ [FaceStorage] Error setting up async stringify:`, error);
      resolve("{}");
    }
  });
};

/**
 * Process parallel JSON string operations
 * @param {Object} dataMap - Map of field names to data objects
 * @returns {Promise<Object>} - Map of field names to stringified JSON
 */
const processParallelJsonOperations = async (dataMap) => {
  const keys = Object.keys(dataMap);
  if (keys.length === 0) return {};
  
  console.log(`🔄 [FaceStorage] Processing ${keys.length} JSON fields in parallel`);
  
  const promises = {};
  for (const key of keys) {
    if (dataMap[key]) {
      promises[key] = stringifyAsync(dataMap[key]);
    }
  }
  
  const results = {};
  for (const key of keys) {
    if (promises[key]) {
      try {
        results[key] = await promises[key];
        console.log(`✅ [FaceStorage] Successfully stringified ${key} (${results[key].length} chars)`);
      } catch (error) {
        console.error(`❌ [FaceStorage] Error waiting for ${key} stringify:`, error);
        results[key] = "{}";
      }
    }
  }
  
  return results;
};

/**
 * Store face ID and metadata in DynamoDB and S3
 * @param {string} userId - The user ID
 * @param {string} faceId - The face ID from Rekognition
 * @param {Blob} imageData - The face image data
 * @param {string} imagePath - The path where the image is stored in S3
 * @param {Object} faceAttributes - The face attributes from Rekognition
 * @param {Array} historicalMatches - Array of historical matches
 * @param {Object} videoData - Video recording data including pendingVideoPromise
 * @param {Object} locationData - Location data including address, latitude and longitude
 * @param {Object} deviceData - Optional device and browser metadata
 * @returns {Promise<Object>} - The result of the operation
 */
export const storeFaceId = async (userId, faceId, imageData, imagePath, faceAttributes, historicalMatches = [], videoData = null, locationData = null, deviceData = null) => {
  if (!userId || !faceId) {
    console.error('[FaceStorage] Cannot store face ID - missing userId or faceId');
    return { success: false, error: 'Missing user ID or face ID' };
  }
  
  console.log('[FaceStorage] Storing face ID and metadata for user:', userId);
  
  try {
    // Track all parallel operations to manage concurrency effectively
    const parallelOperations = {};
    
    // PARALLEL OPERATION 1: Upload image to S3 (if provided)
    if (imageData) {
      console.log('[FaceStorage] PARALLEL: Starting image upload to S3...');
      // Don't await - let it run in parallel
      parallelOperations.imageUpload = uploadFaceImage(userId, imageData, imagePath);
    }
    
    // PARALLEL OPERATION 2: Handle video upload (if pending promise provided) 
    if (videoData && videoData.pendingVideoPromise) {
      console.log('[FaceStorage] PARALLEL: Tracking existing video upload...');
      parallelOperations.videoUpload = videoData.pendingVideoPromise;
    }
    
    // PARALLEL OPERATION 3: Process JSON stringify operations in parallel with chunking for large data
    console.log('[FaceStorage] PARALLEL: Starting JSON stringify operations...');
    
    // Helper function to chunk large arrays for more efficient processing
    const chunkArray = (array, chunkSize = 100) => {
      const chunks = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
      }
      return chunks;
    };
    
    // Process historicalMatches in chunks if it's a large array
    let chunkedHistoricalMatches = null;
    if (historicalMatches && historicalMatches.length > 100) {
      console.log(`[FaceStorage] PARALLEL: Chunking large historicalMatches array (${historicalMatches.length} items) for processing`);
      chunkedHistoricalMatches = chunkArray(historicalMatches);
      
      // Start processing each chunk in parallel
      parallelOperations.historicalMatchesChunks = Promise.all(
        chunkedHistoricalMatches.map((chunk, index) => 
          stringifyAsync(chunk).then(result => {
            console.log(`[FaceStorage] Processed historicalMatches chunk ${index+1}/${chunkedHistoricalMatches.length}`);
            return result;
          })
        )
      );
    }
    
    // Set up regular JSON operations for other data
    const jsonOperations = {};
    
    if (locationData) {
      jsonOperations.locationData = locationData;
    }
    
    if (deviceData) {
      jsonOperations.deviceData = deviceData;
    }
    
    if (faceAttributes) {
      jsonOperations.faceAttributes = faceAttributes;
    }
    
    // Only include historicalMatches if not being processed in chunks
    if (historicalMatches && historicalMatches.length > 0 && !chunkedHistoricalMatches) {
      jsonOperations.historicalMatches = historicalMatches;
    }
    
    // Process all regular JSON stringify operations in parallel
    parallelOperations.jsonProcessing = processParallelJsonOperations(jsonOperations);
    
    // Prepare the base item for DynamoDB (with fields that don't need processing)
    const timestamp = new Date().toISOString();
    const faceDataItem = {
      userId: userId,
      faceId: faceId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Add historicalMatchCount if available
    if (historicalMatches && historicalMatches.length > 0) {
      faceDataItem.historicalMatchCount = historicalMatches.length;
    }
    
    // WAIT FOR PARALLEL OPERATIONS: Resolve operations that we need results from
    console.log('[FaceStorage] Waiting for critical parallel operations to complete...');
    
    // Wait for image upload to get URL - this is critical
    let imageUrl = null;
    if (parallelOperations.imageUpload) {
      try {
        const imageUploadResult = await parallelOperations.imageUpload;
        if (imageUploadResult.success) {
          imageUrl = imageUploadResult.imageUrl;
          faceDataItem.imageUrl = imageUrl;
          faceDataItem.imagePath = imageUploadResult.imagePath;
          console.log('[FaceStorage] Image upload completed successfully:', imageUrl);
        } else {
          console.error('[FaceStorage] Image upload failed:', imageUploadResult.error);
        }
      } catch (error) {
        console.error('[FaceStorage] Error during image upload:', error);
      }
    }
    
    // Check on video upload status but don't block if it's still in progress
    if (parallelOperations.videoUpload) {
      try {
        // Use Promise.race to check status without waiting indefinitely
        const uploadStatus = await Promise.race([
          parallelOperations.videoUpload,
          // Timeout after 100ms to avoid blocking
          new Promise(resolve => setTimeout(() => resolve({ pending: true }), 100))
        ]);
        
        if (uploadStatus && !uploadStatus.pending) {
          console.log('[FaceStorage] Video upload completed quickly, adding URL');
          if (uploadStatus.videoUrl) {
            faceDataItem.videoUrl = uploadStatus.videoUrl;
          }
          if (uploadStatus.videoId) {
            faceDataItem.videoId = uploadStatus.videoId;
          }
        } else {
          console.log('[FaceStorage] Video upload still in progress, will continue in background');
        }
      } catch (error) {
        console.warn('[FaceStorage] Error checking video upload status:', error);
      }
    }
    
    // Add basic video details if available regardless of upload status
    if (videoData) {
      if (videoData.videoUrl) {
        faceDataItem.videoUrl = videoData.videoUrl;
      }
      if (videoData.videoId) {
        faceDataItem.videoId = videoData.videoId;
      }
      if (videoData.resolution) {
        faceDataItem.videoResolution = videoData.resolution;
      }
      if (videoData.duration) {
        faceDataItem.videoDuration = (videoData.duration === Infinity || !isFinite(videoData.duration)) ? -1 : videoData.duration;
      }
      if (videoData.frameRate) {
        faceDataItem.videoFrameRate = videoData.frameRate;
      }
    }
    
    // Wait for JSON processing to complete
    try {
      const jsonResults = await parallelOperations.jsonProcessing;
      
      // Add stringified JSON fields to the item
      if (jsonResults.locationData) {
        faceDataItem.locationData = jsonResults.locationData;
        
        // Also add location data directly (if it exists)
        try {
          const parsedLocation = JSON.parse(jsonResults.locationData);
          if (parsedLocation.latitude) faceDataItem.latitude = parsedLocation.latitude;
          if (parsedLocation.longitude) faceDataItem.longitude = parsedLocation.longitude;
          if (parsedLocation.address) faceDataItem.address = parsedLocation.address;
        } catch (e) {
          console.error('[FaceStorage] Failed to extract location fields:', e);
        }
      }
      
      if (jsonResults.deviceData) {
        faceDataItem.deviceData = jsonResults.deviceData;
        
        // Extract IP address if available
        try {
          const parsedDevice = JSON.parse(jsonResults.deviceData);
          if (parsedDevice.ipAddress) {
            faceDataItem.ipAddress = parsedDevice.ipAddress;
          }
        } catch (e) {
          console.error('[FaceStorage] Failed to extract device fields:', e);
        }
      }
      
      if (jsonResults.faceAttributes) {
        faceDataItem.faceAttributes = jsonResults.faceAttributes;
      }
      
      if (jsonResults.historicalMatches) {
        faceDataItem.historicalMatches = jsonResults.historicalMatches;
      }
      
      console.log('[FaceStorage] All regular JSON fields processed successfully');
    } catch (error) {
      console.error('[FaceStorage] Error processing JSON fields:', error);
    }
    
    // Process chunked historical matches if they exist
    if (parallelOperations.historicalMatchesChunks) {
      try {
        console.log('[FaceStorage] Waiting for chunked historical matches processing...');
        const chunkedResults = await parallelOperations.historicalMatchesChunks;
        
        // Combine all chunks into one string
        const combinedHistoricalMatches = JSON.stringify(
          chunkedResults.flatMap(chunk => JSON.parse(chunk))
        );
        
        faceDataItem.historicalMatches = combinedHistoricalMatches;
        console.log(`[FaceStorage] Successfully processed chunked historical matches (${combinedHistoricalMatches.length} chars)`);
      } catch (error) {
        console.error('[FaceStorage] Error processing chunked historical matches:', error);
        
        // Fallback: try to stringify the entire array at once
        try {
          console.log('[FaceStorage] Attempting fallback stringification of historical matches...');
          faceDataItem.historicalMatches = JSON.stringify(historicalMatches);
        } catch (fallbackError) {
          console.error('[FaceStorage] Fallback stringification also failed:', fallbackError);
          // Set empty array as last resort
          faceDataItem.historicalMatches = "[]";
        }
      }
    }
    
    // Store face data in DynamoDB
    console.log('[FaceStorage] Storing face data in DynamoDB...');
    const { docClient } = await getAWSClients();
    
    try {
      const command = new DocPutCommand({
        TableName: "shmong-face-data",
        Item: faceDataItem
      });
      
      await docClient.send(command);
      console.log('[FaceStorage] Face data stored in DynamoDB successfully');
      
      // Update Users table with face data in the background (don't wait for completion)
      // Wrap in a try/catch to ensure we don't fail the main operation
      const backgroundUpdatePromise = (async () => {
        try {
          await updateUserWithFaceData(userId, {
            faceId,
            imageUrl,
            faceAttributes: faceAttributes,
            locationData: locationData,
            deviceData: deviceData
          });
          console.log('[FaceStorage] BACKGROUND: Users table update completed successfully');
          return { success: true };
        } catch (updateError) {
          console.error('[FaceStorage] BACKGROUND: Error updating user data:', updateError);
          return { success: false, error: updateError.message };
        }
      })();
      
      // Store the promise in videoData if available
      if (videoData) {
        videoData.userUpdatePromise = backgroundUpdatePromise;
      }
      
      // Return success immediately, let background operations continue
      return {
        success: true,
        imageUrl,
        faceId,
        pendingOperations: {
          videoUpload: parallelOperations.videoUpload,
          userUpdate: backgroundUpdatePromise
        }
      };
    } catch (dbError) {
      console.error('[FaceStorage] Failed to store face data in DynamoDB:', dbError);
      return { success: false, error: `Database Save Error: ${dbError.message}` };
    }
  } catch (error) {
    console.error('[FaceStorage] Error in storeFaceId:', error);
    return { success: false, error: error.message || 'Error storing face ID' };
  }
};

/**
 * Update user record with face data without blocking
 * @param {string} userId - User ID to update
 * @param {Object} faceDataPayload - Face data to add to user record
 */
async function updateUserWithFaceData(userId, faceDataPayload) {
  try {
    console.log(`[FaceStorage] BACKGROUND: Updating user ${userId} with face data...`);
    const { docClient } = await getAWSClients();
    
    // Check if user exists first
    const getCommand = new DocGetCommand({
      TableName: "shmong-users",
      Key: { id: userId }
    });
    
    const userData = await docClient.send(getCommand);
    
    if (!userData || !userData.Item) {
      console.log(`[FaceStorage] User ${userId} not found for background update`);
      return;
    }
    
    // Create the new face entry
    const faces = userData.Item.faces || [];
    
    // Create new face entry with basic data
    const newFaceEntry = {
      faceId: faceDataPayload.faceId,
      createdAt: new Date().toISOString(),
      imageUrl: faceDataPayload.imageUrl
    };
    
    // Let's process any complex objects in parallel
    const jsonOps = {};
    
    if (faceDataPayload.locationData) {
      jsonOps.locationData = faceDataPayload.locationData;
    }
    
    if (faceDataPayload.deviceData) {
      jsonOps.deviceData = faceDataPayload.deviceData;
    }
    
    if (faceDataPayload.faceAttributes) {
      jsonOps.faceAttributes = faceDataPayload.faceAttributes;
    }
    
    // Process JSON stringification in parallel if needed
    if (Object.keys(jsonOps).length > 0) {
      try {
        const jsonResults = await processParallelJsonOperations(jsonOps);
        
        // Add results to the face entry
        if (jsonResults.locationData) {
          newFaceEntry.locationData = JSON.parse(jsonResults.locationData);
        }
        
        if (jsonResults.deviceData) {
          newFaceEntry.deviceData = JSON.parse(jsonResults.deviceData);
        }
        
        if (jsonResults.faceAttributes) {
          // Just store a simplified version of face attributes
          try {
            const parsedAttrs = JSON.parse(jsonResults.faceAttributes);
            newFaceEntry.faceAttributes = {
              age: parsedAttrs.AgeRange || parsedAttrs.ageRange,
              gender: parsedAttrs.Gender?.Value || parsedAttrs.gender?.value || parsedAttrs.gender,
              smile: parsedAttrs.Smile?.Value || parsedAttrs.smile?.value || parsedAttrs.smile,
              emotions: parsedAttrs.Emotions?.slice(0, 3).map(e => e.Type) || 
                      parsedAttrs.emotions?.slice(0, 3).map(e => e.type) || 
                      parsedAttrs.emotions?.slice(0, 3)
            };
          } catch (e) {
            console.error('[FaceStorage] Error processing face attributes for user record:', e);
          }
        }
      } catch (error) {
        console.error('[FaceStorage] Error processing JSON for user record:', error);
      }
    }
    
    // Prepend the new face data (most recent first)
    faces.unshift(newFaceEntry);
    
    // Keep only the latest 5 face records
    const MAX_RECORDS = 2;
    if (faces.length > MAX_RECORDS) {
      faces.length = MAX_RECORDS;
    }
    
    // Update the user record
    const updateCommand = new DocUpdateCommand({
      TableName: "shmong-users",
      Key: { id: userId },
      UpdateExpression: "set faces = :faces, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":faces": faces,
        ":updatedAt": new Date().toISOString()
      },
      ReturnValues: "NONE" // Don't need the response
    });
    
    await docClient.send(updateCommand);
    console.log(`[FaceStorage] BACKGROUND: Successfully updated user ${userId} with face data`);
    return true;
  } catch (error) {
    console.error(`[FaceStorage] BACKGROUND: Error updating user with face data:`, error);
    // Don't propagate the error since this is a background operation
    return false;
  }
}

/**
 * Retrieve a face ID for a user from database or localStorage backup
 * @param {string} userId - The user ID
 * @returns {Promise<string|null>} - The face ID or null if not found
 */
export const getFaceId = async (userId) => {
  try {
    console.log(`🔍 [FaceStorage] Getting face ID for user: ${userId}`);
    
    // PRIMARY METHOD: Get from DynamoDB
    console.log(`🔍 [FaceStorage] Checking DynamoDB for user: ${userId}`);
    
    try {
      // Use proper query instead of scan for better performance
      const queryCommand = new QueryCommand({
        TableName: "shmong-face-data",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        }
      });
      
      console.log(`🔍 [FaceStorage] Executing DynamoDB query for userId: ${userId}`);
      
      const queryResult = await dynamoClient.send(queryCommand);
      
      if (queryResult.Items && queryResult.Items.length > 0) {
        const item = queryResult.Items[0];
        console.log(`✅ [FaceStorage] Face ID retrieved from DynamoDB query: ${item.faceId.S}`);
        
        // Parse face attributes if available
        let faceAttributes = null;
        if (item.faceAttributes && item.faceAttributes.S) {
          try {
            faceAttributes = JSON.parse(item.faceAttributes.S);
            console.log(`✅ [FaceStorage] Face attributes retrieved from DynamoDB`);
          } catch (parseError) {
            console.error(`❌ [FaceStorage] Error parsing face attributes:`, parseError);
          }
        }
        
        // Extract image URL - may be stored in different places in the record
        let imageUrl = null;
        
        // First check direct public_url field
        if (item.public_url && item.public_url.S) {
          imageUrl = item.public_url.S;
          console.log(`✅ [FaceStorage] Found image URL in public_url field: ${imageUrl}`);
        } 
        
        // If public_url is not available, check imageUrl
        if (!imageUrl && item.imageUrl && item.imageUrl.S) {
          imageUrl = item.imageUrl.S;
          console.log(`✅ [FaceStorage] Found image URL in imageUrl field: ${imageUrl}`);
        }
        
        // If imageUrl is not available, check imagePath
        if (!imageUrl && item.imagePath && item.imagePath.S) {
          imageUrl = item.imagePath.S;
          console.log(`✅ [FaceStorage] Found image URL in imagePath field: ${imageUrl}`);
        }
        
        // If imageUrl is still not available, check videoUrl
        if (!imageUrl && item.videoUrl && item.videoUrl.S) {
          imageUrl = item.videoUrl.S;
          console.log(`✅ [FaceStorage] Found image URL in videoUrl field: ${imageUrl}`);
        }
        
        // If imageUrl is still not available, check locationData
        if (!imageUrl && item.locationData && item.locationData.S) {
          const locationData = JSON.parse(item.locationData.S);
          if (locationData.imageUrl) {
            imageUrl = locationData.imageUrl;
            console.log(`✅ [FaceStorage] Found image URL in locationData: ${imageUrl}`);
          }
        }
        
        // If imageUrl is still not available, check deviceData
        if (!imageUrl && item.deviceData && item.deviceData.S) {
          const deviceData = JSON.parse(item.deviceData.S);
          if (deviceData.imageUrl) {
            imageUrl = deviceData.imageUrl;
            console.log(`✅ [FaceStorage] Found image URL in deviceData: ${imageUrl}`);
          }
        }
        
        // If imageUrl is still not available, check faceAttributes
        if (!imageUrl && faceAttributes && faceAttributes.imageUrl) {
          imageUrl = faceAttributes.imageUrl;
          console.log(`✅ [FaceStorage] Found image URL in faceAttributes: ${imageUrl}`);
        }
        
        // If imageUrl is still not available, check historicalMatches
        if (!imageUrl && item.historicalMatches && item.historicalMatches.L) {
          const historicalMatches = item.historicalMatches.L.map(match => match.M);
          for (const match of historicalMatches) {
            if (match.imageUrl && match.imageUrl.S) {
              imageUrl = match.imageUrl.S;
              console.log(`✅ [FaceStorage] Found image URL in historicalMatches: ${imageUrl}`);
              break;
            }
          }
        }
        
        // Return the face ID and image URL
        return { 
          success: true, 
          faceId: item.faceId.S,
          faceAttributes: faceAttributes,
          status: item.status?.S || 'active',
          imageUrl: imageUrl
        };
      }
      
      // If no results, return empty
      console.log(`⚠️ [FaceStorage] No face ID found in DynamoDB for user: ${userId}`);
      return { 
        success: false, 
        error: 'No face ID found for user' 
      };
    } catch (dbError) {
      console.error(`❌ [FaceStorage] DynamoDB query failed:`, dbError);
      throw dbError; // Propagate error to outer catch
    }
  } catch (error) {
    console.error('[FaceStorage] Error retrieving face ID:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Upload a face image to S3
 * @param {string} userId - The user ID
 * @param {Blob} imageData - The image data
 * @param {string} imagePath - Optional path override
 * @returns {Promise<Object>} - The result of the operation
 */
export const uploadFaceImage = async (userId, imageData, customPath = null) => {
  if (!userId || !imageData) {
    return { success: false, error: 'Missing user ID or image data' };
  }

  console.log('[FaceStorage] Uploading face image for user:', userId);
  console.log('[FaceStorage] Image type:', typeof imageData, 
              imageData instanceof Blob ? 'is Blob' : 'not Blob',
              imageData instanceof Uint8Array ? 'is Uint8Array' : 'not Uint8Array',
              typeof imageData === 'string' ? `string starts with: ${imageData.substring(0, 30)}...` : '');

  try {
    // Convert image data to Uint8Array
    let binaryData;
    console.log('🔄 [FaceStorage] uploadFaceImage conversion process:');
    
    if (imageData instanceof Uint8Array) {
      binaryData = imageData;
      console.log('[FaceStorage] Using Uint8Array directly');
    } else if (typeof imageData === 'string') {
      // Handle base64 string
      const base64Data = imageData.split(',')[1];
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('[FaceStorage] Converted base64 to Uint8Array');
    } else if (imageData instanceof Blob) {
      // Handle Blob
      const arrayBuffer = await imageData.arrayBuffer();
      binaryData = new Uint8Array(arrayBuffer);
      console.log('[FaceStorage] Converted Blob to Uint8Array');
    } else {
      console.error('[FaceStorage] Unsupported image data type:', typeof imageData);
      return { success: false, error: 'Unsupported image data type' };
    }

    // Generate a unique path for the image
    const imagePath = customPath || `${userId}/${Date.now()}.jpg`;
    
    // Upload to S3
    const { s3Client } = await getAWSClients();
    const s3Params = {
      Bucket: 'shmong',
      Key: `face-images/${imagePath}`,
      Body: binaryData,
      ContentType: 'image/jpeg'
    };

    await s3Client.send(new PutObjectCommand(s3Params));
    console.log('[FaceStorage] Face image uploaded successfully to S3');

    // Generate URLs for the image
    // 1. Direct S3 URL
    const baseS3Url = `https://shmong.s3.amazonaws.com/face-images/${imagePath}`;
    
    // 2. Generate a pre-signed URL as a backup
    const getObjectParams = {
      Bucket: 'shmong',
      Key: `face-images/${imagePath}`,
    };
    
    const signedUrl = await getSignedUrl(
      s3Client, 
      new GetObjectCommand(getObjectParams), 
      { expiresIn: 604800 } // 7 days
    );
    
    console.log('[FaceStorage] Generated permanent URL:', baseS3Url);
    console.log('[FaceStorage] Generated signed URL (backup):', signedUrl);

    return {
      success: true,
      imageUrl: baseS3Url,
      signedUrl: signedUrl,
      imagePath: imagePath
    };
  } catch (error) {
    console.error('[FaceStorage] Error uploading face image:', error);
    return { success: false, error: error.message || 'Error uploading face image' };
  }
};

/**
 * Delete face image
 * @param {string} path - The image path
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFaceImage = async (path) => {
  try {
    console.log('[FaceStorage] Deleting face image:', path);
    
    const { s3Client } = await getAWSClients();
    const command = new DeleteObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: `face-images/${path}`
    });
    
    await s3Client.send(command);
    console.log('[FaceStorage] Face image deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('[FaceStorage] Error deleting face image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Retrieves comprehensive face data for a user from DynamoDB
 * @param {string} userId - The user ID to retrieve data for
 * @returns {Promise<Object|null>} - Face data object or null if not found
 */
export const getFaceDataForUser = async (userId) => {
  if (!userId) {
    console.error('[FaceStorage] Cannot fetch face data - missing userId');
    return null;
  }
  
  console.log(`🔍🔍🔍 [FaceStorage] Fetching face data for user: ${userId}`);
  
  try {
    const { docClient } = await getAWSClients(); // Use docClient
    
    // Query the base table directly using only the HASH key (userId)
    const params = {
        TableName: 'shmong-face-data',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
        ':userId': userId // No need for { S: ... } with docClient
        }
    };
    
    console.log('[FaceStorage] Querying DynamoDB BASE TABLE with docClient params:', JSON.stringify(params, null, 2));
    const response = await docClient.send(new DocQueryCommand(params)); // Use DocQueryCommand
    
    if (response.Items && response.Items.length > 0) {
        // Log all results for debugging (Items are plain JS objects now)
        console.log(`✅ [FaceStorage] Found ${response.Items.length} face records for user ${userId} in base table.`);
        
        // Sort by createdAt timestamp descending (newest first)
        const sortedItems = response.Items.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB - dateA; // Descending order
        });

        // Get the most recent "active" record if available from the sorted list
        const activeRecord = sortedItems.find(item => item.status === 'active');
        
        // Otherwise, use the most recent record (which is now sortedItems[0])
        const faceData = activeRecord || sortedItems[0];

        // Parse any stringified JSON data
        let faceAttributes = null;
        if (faceData.faceAttributes && typeof faceData.faceAttributes === 'string') {
            try { faceAttributes = JSON.parse(faceData.faceAttributes); } 
            catch(e) { console.error('Failed to parse faceAttributes'); }
        }

        // Parse location data if it exists
        let locationData = null;
        if (faceData.locationData && typeof faceData.locationData === 'string') {
            try { locationData = JSON.parse(faceData.locationData); } 
            catch(e) { console.error('Failed to parse locationData'); }
        }

        // Parse device data if it exists
        let deviceData = null;
        if (faceData.deviceData && typeof faceData.deviceData === 'string') {
            try { deviceData = JSON.parse(faceData.deviceData); } 
            catch(e) { console.error('Failed to parse deviceData'); }
        }
        
        // Parse image labels if they exist
        let imageLabels = null;
        if (faceData.imageLabels && typeof faceData.imageLabels === 'string') {
            try { imageLabels = JSON.parse(faceData.imageLabels); } 
            catch(e) { console.error('Failed to parse imageLabels'); }
        }
        
        // Parse image properties if they exist
        let imageProperties = null;
        if (faceData.imageProperties && typeof faceData.imageProperties === 'string') {
            try { imageProperties = JSON.parse(faceData.imageProperties); } 
            catch(e) { console.error('Failed to parse imageProperties'); }
        }
        
        // Parse image analysis if it exists
        let imageAnalysis = null;
        if (faceData.imageAnalysis && typeof faceData.imageAnalysis === 'string') {
            try { imageAnalysis = JSON.parse(faceData.imageAnalysis); } 
            catch(e) { console.error('Failed to parse imageAnalysis'); }
        }

        return {
            faceId: faceData.faceId,
            faceAttributes: faceAttributes,
            imageUrl: faceData.imageUrl,
            imagePath: faceData.imagePath,
            videoUrl: faceData.videoUrl,
            locationData: locationData,
            latitude: faceData.latitude,
            longitude: faceData.longitude,
            address: faceData.address,
            historicalMatches: faceData.historicalMatches || [], 
            historicalMatchCount: faceData.historicalMatchCount,
            deviceData: deviceData,
            createdAt: faceData.createdAt || faceData.created_at,
            // Add image analysis data
            imageLabels: imageLabels,
            imageProperties: imageProperties,
            imageAnalysis: imageAnalysis,
            topLabels: faceData.topLabels ? JSON.parse(faceData.topLabels) : null,
            dominantColors: faceData.dominantColors ? JSON.parse(faceData.dominantColors) : null,
            imageQuality: faceData.imageQuality ? JSON.parse(faceData.imageQuality) : null
        };
    } else {
        console.log('⚠️ [FaceStorage] No face data found for user:', userId);
        return null;
    }
  } catch (error) {
    console.error('❌ [FaceStorage] Error fetching face data from DynamoDB:', error);
    return null;
  }
};

/**
 * Retrieve complete photo data for a specific photo ID, including all analysis data
 * @param {string} photoId - ID of the photo to retrieve
 * @returns {Promise<Object>} - Complete photo data with analysis
 */
export const getCompletePhotoData = async (photoId) => {
  if (!photoId) {
    console.error('🔍 [FaceStorage] Cannot get complete photo data - missing photo ID');
    return null;
  }
  
  try {
    console.log(`📊 [FaceStorage] Fetching complete data for photo: ${photoId}`);
    
    // Get AWS clients
    const { docClient } = await getAWSClients();
    
    // Query DynamoDB for the complete photo data
    const params = {
      TableName: 'shmong-photos',
      Key: {
        id: photoId
      }
    };
    
    console.log(`📊 [FaceStorage] Executing GetCommand for photo: ${photoId}`);
    const command = new DocGetCommand(params);
    const response = await docClient.send(command);
    
    if (!response.Item) {
      console.warn(`⚠️ [FaceStorage] Photo not found: ${photoId}`);
      return null;
    }
    
    const photoData = response.Item;
    console.log(`✅ [FaceStorage] Successfully fetched complete data for photo: ${photoId}`);
    
    // Parse any string-encoded JSON fields
    if (photoData.imageLabels && typeof photoData.imageLabels === 'string') {
      try {
        photoData.imageLabels = JSON.parse(photoData.imageLabels);
        console.log(`📊 [FaceStorage] Parsed imageLabels JSON for photo: ${photoId}`);
      } catch (error) {
        console.error(`❌ [FaceStorage] Error parsing imageLabels JSON for photo ${photoId}:`, error);
      }
    }
    
    if (photoData.imageProperties && typeof photoData.imageProperties === 'string') {
      try { 
        photoData.imageProperties = JSON.parse(photoData.imageProperties);
        console.log(`📊 [FaceStorage] Parsed imageProperties JSON for photo: ${photoId}`);
      } catch (error) {
        console.error(`❌ [FaceStorage] Error parsing imageProperties JSON for photo ${photoId}:`, error);
      }
    }
    
    if (photoData.dominantColors && typeof photoData.dominantColors === 'string') {
      try {
        photoData.dominantColors = JSON.parse(photoData.dominantColors);
        console.log(`📊 [FaceStorage] Parsed dominantColors JSON for photo: ${photoId}`);
      } catch (error) {
        console.error(`❌ [FaceStorage] Error parsing dominantColors JSON for photo ${photoId}:`, error);
      }
    }
    
    if (photoData.topLabels && typeof photoData.topLabels === 'string') {
      try {
        photoData.topLabels = JSON.parse(photoData.topLabels);
        console.log(`📊 [FaceStorage] Parsed topLabels JSON for photo: ${photoId}`);
      } catch (error) {
        console.error(`❌ [FaceStorage] Error parsing topLabels JSON for photo ${photoId}:`, error);
      }
    }
    
    if (photoData.imageQuality && typeof photoData.imageQuality === 'string') {
      try {
        photoData.imageQuality = JSON.parse(photoData.imageQuality);
        console.log(`📊 [FaceStorage] Parsed imageQuality JSON for photo: ${photoId}`);
      } catch (error) {
        console.error(`❌ [FaceStorage] Error parsing imageQuality JSON for photo ${photoId}:`, error);
      }
    }
    
    // Also check for analysis data in faces
    if (photoData.faces && Array.isArray(photoData.faces)) {
      photoData.faces.forEach((face, index) => {
        // Parse face attributes if they exist
        if (face.attributes && typeof face.attributes === 'string') {
          try {
            face.attributes = JSON.parse(face.attributes);
            console.log(`📊 [FaceStorage] Parsed face attributes JSON for face #${index} in photo: ${photoId}`);
            
            // If there's analysis data in attributes, move it up to the face level for easier access
            if (face.attributes.imageLabels) {
              face.imageLabels = face.attributes.imageLabels;
            }
            if (face.attributes.imageProperties) {
              face.imageProperties = face.attributes.imageProperties;
            }
            if (face.attributes.dominantColors) {
              face.dominantColors = face.attributes.dominantColors;
            }
            if (face.attributes.topLabels) {
              face.topLabels = face.attributes.topLabels;
            }
            if (face.attributes.imageQuality) {
              face.imageQuality = face.attributes.imageQuality;
            }
          } catch (error) {
            console.error(`❌ [FaceStorage] Error parsing face attributes JSON for face #${index} in photo ${photoId}:`, error);
          }
        }
        
        // Also check for each analysis data field at the face level
        ['imageLabels', 'imageProperties', 'dominantColors', 'topLabels', 'imageQuality'].forEach(field => {
          if (face[field] && typeof face[field] === 'string') {
            try {
              face[field] = JSON.parse(face[field]);
              console.log(`📊 [FaceStorage] Parsed ${field} JSON for face #${index} in photo: ${photoId}`);
            } catch (error) {
              console.error(`❌ [FaceStorage] Error parsing ${field} JSON for face #${index} in photo ${photoId}:`, error);
            }
          }
        });
      });
    }
    
    // Log what we've got
    console.log(`📊 [FaceStorage] Complete photo data for ${photoId} includes:`, {
      hasLabels: !!photoData.imageLabels,
      labelCount: photoData.imageLabels?.length || 0,
      hasProperties: !!photoData.imageProperties,
      hasTopLabels: !!photoData.topLabels,
      topLabelCount: photoData.topLabels?.length || 0,
      hasDominantColors: !!photoData.dominantColors,
      colorCount: photoData.dominantColors?.length || 0, 
      hasImageQuality: !!photoData.imageQuality,
      faceCount: photoData.faces?.length || 0
    });
    
    return photoData;
  } catch (error) {
    console.error(`❌ [FaceStorage] Error retrieving complete photo data for ${photoId}:`, error);
    return null;
  }
};

/**
 * Retrieve complete photo data for multiple photos in a single batch operation
 * @param {string[]} photoIds - Array of photo IDs to retrieve
 * @returns {Promise<Object>} - Object with photoIds as keys and complete data as values
 */
export const getPhotosWithAnalysisBatch = async (photoIds) => {
  if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
    console.error('🔍 [FaceStorage] Cannot batch get photos - invalid or empty photo IDs array');
    return {};
  }
  
  try {
    console.log(`📊 [FaceStorage] Batch fetching complete data for ${photoIds.length} photos`);
    console.log(`📊 [FaceStorage] First few photo IDs: ${photoIds.slice(0, 3).join(', ')}${photoIds.length > 3 ? '...' : ''}`);
    
    // Get AWS clients
    const { docClient } = await getAWSClients();
    
    // DynamoDB has a limit of 100 items per BatchGetItem request, so we need to chunk
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < photoIds.length; i += chunkSize) {
      chunks.push(photoIds.slice(i, i + chunkSize));
    }
    
    console.log(`📊 [FaceStorage] Split into ${chunks.length} chunks of max ${chunkSize} photos each`);
    
    // Process each chunk with BatchGetItem
    const results = {};
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📊 [FaceStorage] Processing chunk ${i+1}/${chunks.length} with ${chunk.length} photos`);
      
      // Set up BatchGetItem request
      const batchParams = {
        RequestItems: {
          'shmong-photos': {
            Keys: chunk.map(id => ({ id }))
          }
        }
      };
      
      console.log(`📊 [FaceStorage] Executing BatchGetItem command for chunk ${i+1}`);
      const command = new DocBatchGetCommand(batchParams);
      const response = await docClient.send(command);
      
      if (response.Responses && response.Responses['shmong-photos']) {
        const items = response.Responses['shmong-photos'];
        console.log(`✅ [FaceStorage] Received ${items.length} items for chunk ${i+1}`);
        
        // Process each item to parse JSON strings
        items.forEach(item => {
          // Parse any string-encoded JSON fields
          ['imageLabels', 'imageProperties', 'dominantColors', 'topLabels', 'imageQuality'].forEach(field => {
            if (item[field] && typeof item[field] === 'string') {
              try {
                item[field] = JSON.parse(item[field]);
              } catch (error) {
                console.error(`❌ [FaceStorage] Error parsing ${field} JSON for photo ${item.id}:`, error);
              }
            }
          });
          
          // Also check for analysis data in faces
          if (item.faces && Array.isArray(item.faces)) {
            item.faces.forEach((face, index) => {
              // Parse face attributes if they exist
              if (face.attributes && typeof face.attributes === 'string') {
                try {
                  face.attributes = JSON.parse(face.attributes);
                  
                  // If there's analysis data in attributes, move it up to the face level
                  ['imageLabels', 'imageProperties', 'dominantColors', 'topLabels', 'imageQuality'].forEach(field => {
                    if (face.attributes[field]) {
                      face[field] = face.attributes[field];
                    }
                  });
                } catch (error) {
                  console.error(`❌ [FaceStorage] Error parsing face attributes JSON for face #${index} in photo ${item.id}:`, error);
                }
              }
              
              // Also parse any JSON fields at the face level
              ['imageLabels', 'imageProperties', 'dominantColors', 'topLabels', 'imageQuality'].forEach(field => {
                if (face[field] && typeof face[field] === 'string') {
                  try {
                    face[field] = JSON.parse(face[field]);
                  } catch (error) {
                    console.error(`❌ [FaceStorage] Error parsing ${field} JSON for face #${index} in photo ${item.id}:`, error);
                  }
                }
              });
            });
          }
          
          // Store in results by ID
          results[item.id] = item;
        });
      }
      
      // Handle unprocessed keys for retries if needed
      if (response.UnprocessedKeys && 
          response.UnprocessedKeys['shmong-photos'] && 
          response.UnprocessedKeys['shmong-photos'].Keys &&
          response.UnprocessedKeys['shmong-photos'].Keys.length > 0) {
        console.warn(`⚠️ [FaceStorage] Got ${response.UnprocessedKeys['shmong-photos'].Keys.length} unprocessed keys in batch`);
        
        // Here you would implement retry logic for unprocessed keys
        // For simplicity, we'll log it but not retry in this example
      }
    }
    
    console.log(`✅ [FaceStorage] Successfully fetched ${Object.keys(results).length}/${photoIds.length} photos with analysis data`);
    
    // Optional: Log how many photos have various types of analysis data
    const withLabels = Object.values(results).filter(photo => 
      photo.imageLabels || (photo.faces && photo.faces.some(face => face.imageLabels))
    ).length;
    
    const withColors = Object.values(results).filter(photo => 
      photo.dominantColors || (photo.faces && photo.faces.some(face => face.dominantColors))
    ).length;
    
    console.log(`📊 [FaceStorage] Analysis stats: ${withLabels} photos with labels, ${withColors} with color data`);
    
    return results;
  } catch (error) {
    console.error(`❌ [FaceStorage] Error batch retrieving photos:`, error);
    return {};
  }
};

/**
 * Extract and determine skin tone from detected face colors
 * @param {Object} imageAnalysis - The full image analysis response
 * @param {Object} faceAttributes - Face attributes with bounding box
 * @returns {Object|null} - Skin tone information or null if not determinable
 */
export const determineSkinTone = (imageAnalysis, faceAttributes) => {
  if (!imageAnalysis || !faceAttributes) {
    console.log('⚠️ [FaceStorage] Cannot determine skin tone without image analysis and face attributes');
    return null;
  }
  
  try {
    const boundingBox = 
      faceAttributes.BoundingBox || 
      faceAttributes.boundingBox ||
      (faceAttributes.attributes ? faceAttributes.attributes.boundingBox : null);
    
    if (!boundingBox) {
      console.log('⚠️ [FaceStorage] No bounding box available for skin tone detection');
      return null;
    }
    
    // Extract dominant colors from face foreground
    // For our purposes, the face foreground colors are most likely to contain skin tones
    let possibleSkinColors = [];
    
    if (imageAnalysis.ImageProperties && 
        imageAnalysis.ImageProperties.Foreground && 
        imageAnalysis.ImageProperties.Foreground.DominantColors) {
      possibleSkinColors = imageAnalysis.ImageProperties.Foreground.DominantColors.slice(0, 3);
    } else if (imageAnalysis.ImageProperties && 
        imageAnalysis.ImageProperties.DominantColors) {
      // Fallback to overall dominant colors if foreground specific colors aren't available
      possibleSkinColors = imageAnalysis.ImageProperties.DominantColors.slice(0, 3);
    }
    
    if (possibleSkinColors.length === 0) {
      console.log('⚠️ [FaceStorage] No colors available for skin tone detection');
      return null;
    }
    
    // Create a simple skin tone classifier by hex code
    // Most likely the first dominant color in a face area is the skin tone
    const primaryColor = possibleSkinColors[0];
    
    console.log(`✅ [FaceStorage] Extracted potential skin tone: ${primaryColor.HexCode}`);
    
    // Return the detected skin tone
    return {
      skinToneColor: primaryColor.HexCode,
      skinToneConfidence: primaryColor.Confidence || 0,
      alternateColors: possibleSkinColors.slice(1).map(c => c.HexCode)
    };
  } catch (error) {
    console.error('❌ [FaceStorage] Error determining skin tone:', error);
    return null;
  }
};

// Export as default object for easier import
export default {
  getCompletePhotoData,
  getPhotosWithAnalysisBatch,
  storeFaceId,
  getFaceId,
  uploadFaceImage,
  deleteFaceImage,
  getFaceDataForUser,
  analyzeImageWithDetectLabels
}; 
