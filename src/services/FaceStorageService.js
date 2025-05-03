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
  maxLabels: 40,
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

/**
 * Store face ID and metadata in DynamoDB and S3
 * @param {string} userId - The user ID
 * @param {string} faceId - The face ID from Rekognition
 * @param {Blob} imageData - The face image data
 * @param {string} imagePath - The path where the image is stored in S3
 * @param {Object} faceAttributes - The face attributes from Rekognition
 * @param {Array} historicalMatches - Array of historical matches
 * @param {Object} videoData - Video recording data with URL and metadata
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
    // Collect device data if needed (keep this part)
    if (!deviceData && typeof window !== 'undefined') {
       deviceData = {
          userAgent: window.navigator.userAgent,
          language: window.navigator.language,
          platform: window.navigator.platform,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          pixelRatio: window.devicePixelRatio,
          colorDepth: window.screen.colorDepth,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          sessionTime: new Date().toISOString()
        };
        // Network information if available
        if (window.navigator.connection) {
          deviceData.networkType = window.navigator.connection.effectiveType;
          deviceData.downlink = window.navigator.connection.downlink;
          deviceData.rtt = window.navigator.connection.rtt;
        }
        // Battery information if available
        if (window.navigator.getBattery) {
          try {
            const battery = await window.navigator.getBattery();
            deviceData.batteryLevel = battery.level;
            deviceData.batteryCharging = battery.charging;
          } catch (e) { console.log('[FaceStorage] Battery info not available'); }
        }
        console.log(`✏️ Collecting device data for analytics`);
    }

    // Upload image to S3 (keep this part)
    let imageUrl = null;
    let binaryData = null;
    let imageAnalysis = null;
    
    if (imageData) {
      console.log('[FaceStorage] Image data provided, uploading to S3...');
      
      // Convert image data to binary for S3 and Rekognition
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
      }
      
      // Now upload to S3
      const uploadResult = await uploadFaceImage(userId, imageData, imagePath);
      if (uploadResult.success) {
        imageUrl = uploadResult.imageUrl; // Use the correct URL from the response
        console.log('[FaceStorage] Image uploaded successfully:', imageUrl);
      } else {
        console.error('[FaceStorage] Failed to upload image:', uploadResult.error);
      }
      
      // Perform image analysis with DetectLabels if binary data is available
      if (binaryData) {
        console.log('[FaceStorage] Performing image analysis with DetectLabels...');
        imageAnalysis = await analyzeImageWithDetectLabels(binaryData);
        if (imageAnalysis) {
          console.log(`✏️ [FaceStorage] Image analysis successful: found ${imageAnalysis.Labels?.length || 0} labels`);
          // Log some of the labels found for verification
          if (imageAnalysis.Labels && imageAnalysis.Labels.length > 0) {
            const topLabels = imageAnalysis.Labels.slice(0, 5).map(label => `${label.Name} (${label.Confidence.toFixed(2)}%)`);
            console.log(`✏️ [FaceStorage] Top labels: ${topLabels.join(', ')}`);
          }
          // Log image quality metrics if available
          if (imageAnalysis.ImageProperties && imageAnalysis.ImageProperties.Quality) {
            const quality = imageAnalysis.ImageProperties.Quality;
            console.log(`✏️ [FaceStorage] Image quality: Sharpness=${quality.Sharpness?.toFixed(2)}, Brightness=${quality.Brightness?.toFixed(2)}, Contrast=${quality.Contrast?.toFixed(2)}`);
          }
        }
      }
    }
    
    const timestamp = new Date().toISOString();
    
    // --- Start preparing the CLEANED item for DynamoDB --- 
    // Only include core keys + ipAddress + stringified blobs
    const faceDataItem = {
      userId: userId, // Plain string
      faceId: faceId, // Plain string
      createdAt: timestamp, // Plain string
      updatedAt: timestamp, // Plain string
      // ipAddress will be added below if available
    };
        
    // Add image/video refs if they exist
    if (imageUrl) {
      faceDataItem.imageUrl = imageUrl;
      faceDataItem.imagePath = imagePath; // Assuming imagePath is determined/passed correctly
    }
    if (videoData && videoData.videoUrl) {
      faceDataItem.videoUrl = videoData.videoUrl;
      if (videoData.videoId) faceDataItem.videoId = videoData.videoId;
      // Store video metadata as plain values
      if (videoData.resolution) faceDataItem.videoResolution = videoData.resolution;
      if (videoData.duration) faceDataItem.videoDuration = (videoData.duration === Infinity || !isFinite(videoData.duration)) ? -1 : videoData.duration; 
      if (videoData.frameRate) faceDataItem.videoFrameRate = videoData.frameRate;
    }

    // Add Stringified locationData
    if (locationData) {
      try {
        console.log('[FaceStorage] Stringifying locationData...');
        const locationDataString = JSON.stringify(locationData); 
        faceDataItem.locationData = locationDataString;
        console.log(`📍✅ [FaceStorage] OK: Stringified locationData. Length: ${locationDataString.length}.`);
      } catch (e) {
        console.error(`❌💥 [FaceStorage] FAILED to stringify locationData:`, e);
        faceDataItem.locationDataError = e.message;
      }
    } else {
      console.log(`📍 [FaceStorage] No location data object provided.`);
    }

    // Prepare finalDeviceData (including redundant locationData)
    let finalDeviceDataForBlob = deviceData ? { ...deviceData } : {};
    if (locationData) {
      try {
        finalDeviceDataForBlob.locationData = JSON.parse(JSON.stringify(locationData)); 
      } catch (cloneError) {
        console.error('❌💥 [FaceStorage] FAILED to deep clone locationData for deviceData:', cloneError);
        finalDeviceDataForBlob.locationData = { error: 'Cloning failed', originalData: locationData }; 
      }
    }
    
    // Add Stringified deviceData and the top-level ipAddress
    if (Object.keys(finalDeviceDataForBlob).length > 0) {
      try {
        console.log('[FaceStorage] Stringifying finalDeviceDataForBlob...');
        const deviceDataString = JSON.stringify(finalDeviceDataForBlob);
        faceDataItem.deviceData = deviceDataString;
        console.log(`📱✅ [FaceStorage] OK: Stringified finalDeviceData. Length: ${deviceDataString.length}.`);
        // Add top-level ipAddress (plain string) as it's in the schema
        if (finalDeviceDataForBlob.ipAddress) {
          faceDataItem.ipAddress = finalDeviceDataForBlob.ipAddress; // Use plain string value
        }
      } catch (e) {
        console.error(`❌💥 [FaceStorage] FAILED to stringify finalDeviceData:`, e);
        faceDataItem.deviceDataError = e.message;
        if (finalDeviceDataForBlob.ipAddress) faceDataItem.ipAddress = finalDeviceDataForBlob.ipAddress; // Use plain string value
      }
    } else {
       console.log(`📱 [FaceStorage] No device data object provided.`);
    }

    // Add Stringified faceAttributes
    if (faceAttributes) {
       try {
         console.log('✏️ [FaceStorage] Preparing face attributes for database write...');
         
         // Add skin tone detection if we have image analysis data
         if (imageAnalysis) {
           const skinToneData = determineSkinTone(imageAnalysis, faceAttributes);
           if (skinToneData) {
             faceAttributes.skinTone = skinToneData;
             console.log(`✏️ [FaceStorage] DATABASE WRITE: Adding skin tone data (${skinToneData.skinToneColor}) to face attributes`);
           }
         }
         
         const attributesString = JSON.stringify(faceAttributes);
         faceDataItem.faceAttributes = attributesString;
         console.log(`✏️ [FaceStorage] DATABASE WRITE: Face attributes stored (${attributesString.length} bytes)`);
       } catch (e) {
         console.error(`❌💥 [FaceStorage] FAILED to stringify faceAttributes:`, e);
         faceDataItem.faceAttributesError = e.message;
       }
    }

    // Add Stringified historicalMatches
    if (historicalMatches && historicalMatches.length > 0) {
      try {
        console.log('[FaceStorage] Stringifying historicalMatches...');
        const matchesString = JSON.stringify(historicalMatches);
        faceDataItem.historicalMatches = matchesString; 
        console.log(`🤝✅ [FaceStorage] OK: Stringified historicalMatches. Length: ${matchesString.length}.`);
        faceDataItem.historicalMatchCount = historicalMatches.length; // Keep plain number count
      } catch (e) {
         console.error(`❌💥 [FaceStorage] FAILED to stringify historicalMatches:`, e);
         faceDataItem.historicalMatchesError = e.message;
      }
    }
    
    // Add image analysis data from DetectLabels
    if (imageAnalysis) {
      try {
        console.log('✏️ [FaceStorage] Processing image analysis data for database write...');
        
        // Extract and store labels in a separate field
        if (imageAnalysis.Labels && imageAnalysis.Labels.length > 0) {
          const labelsString = JSON.stringify(imageAnalysis.Labels);
          faceDataItem.imageLabels = labelsString;
          console.log(`✏️ [FaceStorage] DATABASE WRITE: Storing ${imageAnalysis.Labels.length} image labels in database.`);
          
          // Store the count of labels as a separate field for easier querying
          faceDataItem.labelCount = imageAnalysis.Labels.length;
          
          // Extract top 5 label names for quick access
          const topLabelNames = imageAnalysis.Labels.slice(0, 5).map(label => label.Name);
          faceDataItem.topLabels = JSON.stringify(topLabelNames);
          console.log(`✏️ [FaceStorage] DATABASE WRITE: Top 5 labels stored: ${topLabelNames.join(', ')}`);
        } else {
          console.log(`✏️ [FaceStorage] No labels found in the image for storage`);
        }
        
        // Extract and store image properties in a separate field
        if (imageAnalysis.ImageProperties) {
          const propertiesString = JSON.stringify(imageAnalysis.ImageProperties);
          faceDataItem.imageProperties = propertiesString;
          console.log(`✏️ [FaceStorage] DATABASE WRITE: Storing image properties in database.`);
          
          // Extract image quality metrics for quick access
          if (imageAnalysis.ImageProperties.Quality) {
            const quality = imageAnalysis.ImageProperties.Quality;
            const qualityData = {
              sharpness: quality.Sharpness,
              brightness: quality.Brightness,
              contrast: quality.Contrast
            };
            faceDataItem.imageQuality = JSON.stringify(qualityData);
            console.log(`✏️ [FaceStorage] DATABASE WRITE: Image quality metrics stored: Sharpness=${quality.Sharpness?.toFixed(2)}, Brightness=${quality.Brightness?.toFixed(2)}, Contrast=${quality.Contrast?.toFixed(2)}`);
          }
          
          // Extract dominant colors for quick access
          if (imageAnalysis.ImageProperties.DominantColors) {
            const dominantColors = imageAnalysis.ImageProperties.DominantColors;
            // Store simplified version with hex codes for quick access
            const colorHexCodes = dominantColors.slice(0, 5).map(color => color.HexCode);
            faceDataItem.dominantColors = JSON.stringify(colorHexCodes);
            console.log(`✏️ [FaceStorage] DATABASE WRITE: Dominant colors stored: ${colorHexCodes.join(', ')}`);
          }
        } else {
          console.log(`✏️ [FaceStorage] No image properties found for storage`);
        }
        
        // Store the complete raw analysis as a separate field
        const analysisString = JSON.stringify(imageAnalysis);
        faceDataItem.imageAnalysis = analysisString;
        console.log(`✏️ [FaceStorage] DATABASE WRITE: Complete image analysis stored (${analysisString.length} bytes)`);
        
      } catch (e) {
        console.error(`❌💥 [FaceStorage] FAILED to process image analysis data:`, e);
        faceDataItem.imageAnalysisError = e.message;
      }
    }
        
    // --- End preparing the cleaned item --- 

    // DEBUG: Log the final item structure JUST BEFORE sending
    console.log(`📄 [FaceStorage] FINAL ITEM TO SAVE (verify structure):`, JSON.stringify(faceDataItem, null, 2));

    // Store face data in DynamoDB using DocumentClient
    const { docClient } = await getAWSClients(); // Get the docClient
    try {
      console.log('✏️ [FaceStorage] Sending PutCommand to DynamoDB with docClient...');
      const command = new DocPutCommand({
        TableName: "shmong-face-data",
        Item: faceDataItem // Use the clean JS object 
      });
      
      await docClient.send(command); 
      console.log(`✏️ [FaceStorage] DATABASE WRITE SUCCESSFUL: Face data stored in DynamoDB!`);
      
      // Update Users table redundantly (keep this attempt)
      try {
        await updateUserWithFaceData(userId, {
          faceId,
          imageUrl,
          videoUrl: videoData?.videoUrl,
          locationData: locationData, // Pass original JS object
          deviceData: finalDeviceDataForBlob, // Pass prepared JS object
          imageAnalysis: imageAnalysis // Pass image analysis data
        });
        console.log(`✅ [FaceStorage] Face data also updated in Users table`);
      } catch (userUpdateError) {
        console.error(`⚠️ [FaceStorage] Error updating Users table (non-critical):`, userUpdateError);
      }
      
      // Return success ONLY if the main PutCommand succeeded
    return {
      success: true,
      imageUrl,
        faceId
      };
    } catch (dbError) {
      console.error(`❌💥 [FaceStorage] FAILED DynamoDB PutCommand with docClient:`, dbError);
      console.error(`   Failed item data:`, JSON.stringify(faceDataItem, null, 2));
      // CRITICAL: Return failure if the main save fails
      return { success: false, error: `Database Save Error: ${dbError.message}` }; 
    }
  } catch (error) {
    console.error('[FaceStorage] Outer error in storeFaceId:', error);
    return { success: false, error: error.message || 'Error storing face ID' };
  }
};

/**
 * Update user record with face data (redundancy)
 */
async function updateUserWithFaceData(userId, faceDataPayload) { // Renamed arg
  const { docClient } = await getAWSClients(); // Use docClient

  try {
    // Check if user exists first using docClient
    const getCommand = new DocGetCommand({
      TableName: "shmong-users",
      Key: { id: userId } // Assuming 'id' is the key for users table
    });

    const userData = await docClient.send(getCommand); 

    if (!userData.Item) {
      console.log(`⚠️ [FaceStorage] User ${userId} not found in Users table for redundant update.`);
      return false; // User doesn't exist, can't update
    }

    // User exists, prepare the face data entry
    const faces = userData.Item.faces || [];

    // Create the new entry for the 'faces' list
    const newFaceEntry = {
      faceId: faceDataPayload.faceId,
      createdAt: new Date().toISOString(),
      imageUrl: faceDataPayload.imageUrl,
      videoUrl: faceDataPayload.videoUrl,
      // Store the full objects, DocumentClient handles marshalling correctly here
      locationData: faceDataPayload.locationData, 
      deviceData: faceDataPayload.deviceData 
    };
    
    // Add image analysis data if available
    if (faceDataPayload.imageAnalysis) {
      // Only include essential data to keep the size reasonable
      const imageAnalysis = faceDataPayload.imageAnalysis;
      
      if (imageAnalysis.Labels && imageAnalysis.Labels.length > 0) {
        // Just store top 5 labels with name and confidence
        newFaceEntry.topLabels = imageAnalysis.Labels.slice(0, 5).map(label => ({
          name: label.Name,
          confidence: label.Confidence
        }));
      }
      
      if (imageAnalysis.ImageProperties && imageAnalysis.ImageProperties.Quality) {
        newFaceEntry.imageQuality = {
          sharpness: imageAnalysis.ImageProperties.Quality.Sharpness,
          brightness: imageAnalysis.ImageProperties.Quality.Brightness,
          contrast: imageAnalysis.ImageProperties.Quality.Contrast
        };
      }
      
      if (imageAnalysis.ImageProperties && imageAnalysis.ImageProperties.DominantColors) {
        // Just store hex codes of top 3 dominant colors
        newFaceEntry.dominantColors = imageAnalysis.ImageProperties.DominantColors
          .slice(0, 3)
          .map(color => color.HexCode);
      }
    }

    // Prepend the new face data to keep the latest at the start (optional)
    faces.unshift(newFaceEntry); 
    
    // Keep only the latest N face records if desired (e.g., latest 5)
    const MAX_RECORDS = 5; 
    if (faces.length > MAX_RECORDS) {
       faces.length = MAX_RECORDS; 
    }

    // Update the user record using docClient UpdateCommand
    const updateCommand = new DocUpdateCommand({
      TableName: "shmong-users",
      Key: { id: userId },
      UpdateExpression: "set faces = :faces, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":faces": faces, // Pass the array directly
        ":updatedAt": new Date().toISOString()
      },
       ReturnValues: "UPDATED_NEW" // Optional: get updated attributes back
    });

    await docClient.send(updateCommand); 
    return true;
  } catch (error) {
    // Log specific errors for update failure
    if (error.name === 'ResourceNotFoundException') {
         console.error(`❌ [FaceStorage] Users table not found during update attempt.`);
    } else if (error.name === 'ValidationException') {
         console.error(`❌ [FaceStorage] Validation error updating Users table:`, error.message);
    } else {
        console.error(`❌ [FaceStorage] Generic error updating user with face data:`, error);
    }
    throw error; // Re-throw error to be caught by the caller if needed
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
