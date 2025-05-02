// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutItemCommand, QueryCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, dynamoClient, docClient } from '../lib/awsClient';
import { normalizeToS3Url, convertCloudFrontToS3Url } from '../utils/s3Utils';
import { marshall } from '@aws-sdk/util-dynamodb';
// Use DocumentClient commands for simplified interaction
import { PutCommand as DocPutCommand, QueryCommand as DocQueryCommand, GetCommand as DocGetCommand, DeleteCommand as DocDeleteCommand } from '@aws-sdk/lib-dynamodb';

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
    s3Client
  };
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
    if (imageData) {
      console.log('[FaceStorage] Image data provided, uploading to S3...');
      const uploadResult = await uploadFaceImage(userId, imageData, imagePath);
      if (uploadResult.success) {
        imageUrl = uploadResult.imageUrl; // Use the correct URL from the response
        console.log('[FaceStorage] Image uploaded successfully:', imageUrl);
      } else {
        console.error('[FaceStorage] Failed to upload image:', uploadResult.error);
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
         console.log('[FaceStorage] Stringifying faceAttributes...');
         const attributesString = JSON.stringify(faceAttributes);
         faceDataItem.faceAttributes = attributesString;
         console.log(`😊✅ [FaceStorage] OK: Stringified faceAttributes. Length: ${attributesString.length}.`);
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
        
    // --- End preparing the cleaned item --- 

    // DEBUG: Log the final item structure JUST BEFORE sending
    console.log(`📄 [FaceStorage] FINAL ITEM TO SAVE (verify structure):`, JSON.stringify(faceDataItem, null, 2));

    // Store face data in DynamoDB using DocumentClient
    const { docClient } = await getAWSClients(); // Get the docClient
    try {
      console.log('🚀 [FaceStorage] Sending PutCommand to DynamoDB with docClient...');
      const command = new DocPutCommand({
        TableName: "shmong-face-data",
        Item: faceDataItem // Use the clean JS object 
      });
      
      await docClient.send(command); 
      console.log(`✅ [FaceStorage] PutCommand successful!`);
      
      // Update Users table redundantly (keep this attempt)
      try {
        await updateUserWithFaceData(userId, {
          faceId,
          imageUrl,
          videoUrl: videoData?.videoUrl,
          locationData: locationData, // Pass original JS object
          deviceData: finalDeviceDataForBlob // Pass prepared JS object
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
    const getCommand = new GetCommand({
      TableName: "users",
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

    // Prepend the new face data to keep the latest at the start (optional)
    faces.unshift(newFaceEntry); 
    
    // Keep only the latest N face records if desired (e.g., latest 5)
    const MAX_RECORDS = 5; 
    if (faces.length > MAX_RECORDS) {
       faces.length = MAX_RECORDS; 
    }

    // Update the user record using docClient UpdateCommand
    const updateCommand = new UpdateCommand({
      TableName: "users",
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
            createdAt: faceData.createdAt || faceData.created_at
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

export default {
  storeFaceId,
  getFaceId,
  uploadFaceImage,
  deleteFaceImage,
  getFaceDataForUser
};
