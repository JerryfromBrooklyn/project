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
    // Collect additional device and browser data if not provided
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
        } catch (e) {
          console.log('[FaceStorage] Battery info not available');
        }
      }
      
      console.log(`✏️ Collecting device data for analytics`);
    }
    
    // Verify the face ID exists in Rekognition before proceeding
    if (ENABLE_FACE_VERIFICATION) {
      try {
        // Use the already imported AWS clients instead of dynamic imports
        const AWS = require('aws-sdk');
        const rekognition = new AWS.Rekognition({ region: 'us-east-1' });
        
        console.log(`[FaceStorage] Verifying face ID ${faceId} in Rekognition collection...`);
        const verifyResponse = await rekognition.describeFaces({
          CollectionId: 'shmong-faces',
          FaceIds: [faceId]
        }).promise();
        
        if (!verifyResponse.Faces || verifyResponse.Faces.length === 0) {
          console.warn(`[FaceStorage] ⚠️ Face ID ${faceId} not found in Rekognition collection, but continuing storage process`);
          // Don't exit - continue with storage even if verification fails
        } else {
          console.log(`[FaceStorage] ✅ Face ID ${faceId} verified in Rekognition collection`);
        }
      } catch (verifyError) {
        console.error(`[FaceStorage] Error verifying face ID in Rekognition - continuing anyway:`, verifyError);
        // Continue anyway, as this is just a verification step
      }
    }
    
    // Upload image to S3 if provided
    let imageUrl = null;
    if (imageData) {
      console.log('[FaceStorage] Image data provided, uploading to S3...');
      const uploadResult = await uploadFaceImage(userId, imageData, imagePath);
      if (uploadResult.success) {
        imageUrl = uploadResult.imageUrl;
        console.log('[FaceStorage] Image uploaded successfully:', imageUrl);
      } else {
        console.error('[FaceStorage] Failed to upload image:', uploadResult.error);
      }
    }
    
    // Store in DynamoDB
    const { dynamoClient } = await getAWSClients();
    
    const timestamp = new Date().toISOString();
    
    // Create a simpler item structure first with native JS types
    let rawItem = {
      userId: userId,
      faceId: faceId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    console.log(`✏️ Storing Face ID in database: ${faceId}`);
    
    // Add image URL and path if available
    if (imageUrl) {
      rawItem.imageUrl = imageUrl;
    }
    
    if (imagePath) {
      rawItem.imagePath = imagePath;
    }
    
    // Add video data if available
    if (videoData) {
      console.log('[FaceStorage] Storing video data in DynamoDB');
      
      if (videoData.videoUrl) {
        rawItem.videoUrl = videoData.videoUrl;
        console.log(`✏️ Storing Video URL in database: ${videoData.videoUrl}`);
      }
      
      if (videoData.videoId) {
        rawItem.videoId = videoData.videoId;
      }

      // Add video metadata if available
      if (videoData.resolution) {
        rawItem.videoResolution = videoData.resolution;
        console.log(`✏️ Storing video resolution: ${videoData.resolution}`);
      }

      if (videoData.duration) {
        // Handle Infinity values
        rawItem.videoDuration = videoData.duration === Infinity ? 86400 : videoData.duration;
        console.log(`✏️ Storing video duration: ${rawItem.videoDuration} seconds (original: ${videoData.duration})`);
      }

      if (videoData.frameRate) {
        rawItem.videoFrameRate = videoData.frameRate;
        console.log(`✏️ Storing video frame rate: ${videoData.frameRate} fps`);
      }
    }
    
    // Add registration URL
    const registrationUrl = `https://shmong.com/face-registration/${userId}`;
    rawItem.registrationUrl = registrationUrl;
    console.log(`✏️ Storing registration URL: ${registrationUrl}`);
    
    // Add location data if available
    if (locationData) {
      console.log('[FaceStorage] Storing location data in DynamoDB:', 
        Object.keys(locationData).length);
      
      // Store location data as a serialized JSON string
      rawItem.locationData = JSON.stringify(locationData);
      
      // Also store individual components for easier querying
      if (locationData.latitude !== undefined) {
        rawItem.latitude = locationData.latitude;
        console.log(`✏️ Storing latitude in database: ${locationData.latitude}`);
      }
      
      if (locationData.longitude !== undefined) {
        rawItem.longitude = locationData.longitude;
        console.log(`✏️ Storing longitude in database: ${locationData.longitude}`);
      }
      
      if (locationData.address) {
        rawItem.address = locationData.address;
        console.log(`✏️ Storing address in database: ${locationData.address}`);
      }
      
      // Extract and store country and city for better data segmentation
      if (locationData.addressDetails) {
        if (locationData.addressDetails.country) {
          rawItem.country = locationData.addressDetails.country;
          console.log(`✏️ Storing country in database: ${locationData.addressDetails.country}`);
        }
        
        if (locationData.addressDetails.city) {
          rawItem.city = locationData.addressDetails.city;
          console.log(`✏️ Storing city in database: ${locationData.addressDetails.city}`);
        } else if (locationData.addressDetails.town) {
          rawItem.city = locationData.addressDetails.town;
          console.log(`✏️ Storing town in database: ${locationData.addressDetails.town}`);
        }
      }
    }
    
    // Add device and browser data if available
    if (deviceData) {
      console.log('[FaceStorage] Storing device and browser data');
      
      // Store device data as a serialized JSON string in a single column
      rawItem.deviceData = JSON.stringify(deviceData);
      console.log(`✏️ Storing device data in database (full JSON object)`);
      
      // Store IP address in its own separate column for better querying
      if (deviceData.ipAddress) {
        rawItem.ipAddress = deviceData.ipAddress;
        console.log(`✏️ Storing IP address in dedicated column: ${deviceData.ipAddress}`);
      }
      
      // Store specific device properties
      if (deviceData.userAgent) {
        // Extract browser type
        let browser = 'unknown';
        if (deviceData.userAgent.includes('Chrome')) browser = 'Chrome';
        else if (deviceData.userAgent.includes('Firefox')) browser = 'Firefox';
        else if (deviceData.userAgent.includes('Safari')) browser = 'Safari';
        else if (deviceData.userAgent.includes('Edge')) browser = 'Edge';
        
        rawItem.browser = browser;
        console.log(`✏️ Storing browser type in dedicated column: ${browser}`);
        
        // Extract OS
        let os = 'unknown';
        if (deviceData.userAgent.includes('Windows')) os = 'Windows';
        else if (deviceData.userAgent.includes('Mac OS')) os = 'Mac OS';
        else if (deviceData.userAgent.includes('iPhone')) os = 'iOS';
        else if (deviceData.userAgent.includes('Android')) os = 'Android';
        else if (deviceData.userAgent.includes('Linux')) os = 'Linux';
        
        rawItem.operatingSystem = os;
        console.log(`✏️ Storing operating system in dedicated column: ${os}`);
      }
      
      // Store other device properties
      if (deviceData.language) {
        rawItem.language = deviceData.language;
      }
      
      if (deviceData.timezone) {
        rawItem.timezone = deviceData.timezone;
      }
      
      if (deviceData.networkType) {
        rawItem.networkType = deviceData.networkType;
      }
      
      // Store geolocation data from IP if device location not available
      if (!locationData && deviceData.ipCountry) {
        if (deviceData.ipCountry) rawItem.country = deviceData.ipCountry;
        if (deviceData.ipCity) rawItem.city = deviceData.ipCity;
        if (deviceData.ipLatitude) rawItem.latitude = deviceData.ipLatitude;
        if (deviceData.ipLongitude) rawItem.longitude = deviceData.ipLongitude;
        console.log(`✏️ Storing IP-based location in dedicated columns: ${deviceData.ipCity}, ${deviceData.ipCountry}`);
      }
      
      // Store ISP/organization
      if (deviceData.ipOrganization) {
        rawItem.isp = deviceData.ipOrganization;
      }
    }
    
    // Add face attributes if available
    if (faceAttributes) {
      console.log('[FaceStorage] Storing face attributes in DynamoDB:', 
        Object.keys(faceAttributes).length);
      
      // Store the full face attributes object as a JSON string in one column
      rawItem.faceAttributes = JSON.stringify(faceAttributes);
      
      // Store landmarks in their own column if available
      if (faceAttributes.Landmarks && faceAttributes.Landmarks.length > 0) {
        rawItem.faceLandmarks = JSON.stringify(faceAttributes.Landmarks);
        console.log(`✏️ Storing facial landmarks in dedicated column (${faceAttributes.Landmarks.length} points)`);
      }
      
      // Store age range in dedicated columns for easier filtering and querying
      if (faceAttributes.AgeRange) {
        if (faceAttributes.AgeRange.Low !== undefined) {
          rawItem.ageRangeLow = faceAttributes.AgeRange.Low;
        }
        if (faceAttributes.AgeRange.High !== undefined) {
          rawItem.ageRangeHigh = faceAttributes.AgeRange.High;
        }
        console.log(`✏️ Storing age range in dedicated columns: ${faceAttributes.AgeRange.Low}-${faceAttributes.AgeRange.High}`);
      }
      
      // Store gender in its own column for demographic filtering
      if (faceAttributes.Gender && faceAttributes.Gender.Value) {
        rawItem.gender = faceAttributes.Gender.Value;
        console.log(`✏️ Storing gender in dedicated column: ${faceAttributes.Gender.Value}`);
      }
      
      // Store emotions if available in dedicated column
      if (faceAttributes.Emotions && faceAttributes.Emotions.length > 0) {
        // Get the dominant emotion (highest confidence)
        const dominantEmotion = faceAttributes.Emotions.sort((a, b) => b.Confidence - a.Confidence)[0];
        if (dominantEmotion) {
          rawItem.emotion = dominantEmotion.Type;
          rawItem.emotionConfidence = dominantEmotion.Confidence;
          console.log(`✏️ Storing dominant emotion in dedicated column: ${dominantEmotion.Type}`);
        }
      }
    }
    
    // Process historical matches data
    if (historicalMatches && Array.isArray(historicalMatches) && historicalMatches.length > 0) {
      console.log(`[FaceStorage] Processing ${historicalMatches.length} historical matches`);
      
      // Instead of complex format, store them in a way that's easier for DynamoDB
      let simplifiedMatches = historicalMatches
        .filter(match => match && typeof match === 'object' && match.id)
        .slice(0, 150) // Limit to 150 matches
        .map(match => ({
          id: String(match.id),
          similarity: typeof match.similarity === 'number' ? match.similarity : parseFloat(match.similarity) || 0,
          matchType: match.matchType || 'unknown',
          imageUrl: match.imageUrl || null,
          owner: match.owner || null,
          eventId: match.eventId || null,
          createdAt: match.createdAt || timestamp
        }));
      
      // Store as JSON string to avoid serialization issues
      rawItem.historicalMatchesJson = JSON.stringify(simplifiedMatches);
      rawItem.historicalMatchCount = simplifiedMatches.length;
      console.log(`✏️ Storing historical match count: ${simplifiedMatches.length}`);
    }
    
    // Use the marshall function from AWS SDK to convert the item to DynamoDB format
    const marshalledItem = marshall(rawItem, {
      convertEmptyValues: true,
      removeUndefinedValues: true
    });
    
    // Save to DynamoDB
    const params = {
      TableName: 'shmong-face-data',
      Item: marshalledItem
    };
    
    console.log('[FaceStorage] Storing face data in DynamoDB:', Object.keys(rawItem).length, 'fields');
    console.log('[FaceStorage] Data storage structure:');
    console.log('  - JSON data stored in columns: deviceData, locationData, faceAttributes, historicalMatchesJson');
    console.log('  - Key demographic/analytical data stored in individual columns for efficient querying');
    
    try {
      await dynamoClient.send(new PutItemCommand(params));
      console.log('✏️ Successfully stored all data in database');
    } catch (putError) {
      console.error('[FaceStorage] DynamoDB PutItem error:', putError);
      // Fall back to a safer method with just the essential fields
      try {
        console.log('[FaceStorage] Attempting to store minimal dataset as fallback...');
        const minimalItem = marshall({
          userId: userId,
          faceId: faceId,
          createdAt: timestamp,
          updatedAt: timestamp,
          imageUrl: imageUrl || null,
          imagePath: imagePath || null
        }, {
          removeUndefinedValues: true,
          convertEmptyValues: true
        });
        
        await dynamoClient.send(new PutItemCommand({
          TableName: 'shmong-face-data',
          Item: minimalItem
        }));
        console.log('[FaceStorage] Successfully stored minimal face data as fallback');
      } catch (fallbackError) {
        console.error('[FaceStorage] Even fallback storage failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    return {
      success: true,
      faceId,
      imageUrl,
      videoUrl: videoData?.videoUrl,
      locationData: locationData,
      deviceData: deviceData,
      faceAttributes: faceAttributes ? JSON.parse(JSON.stringify(faceAttributes)) : null
    };
  } catch (error) {
    console.error('[FaceStorage] Error storing face ID:', error);
    return { success: false, error: error.message || 'Error storing face ID' };
  }
};

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
