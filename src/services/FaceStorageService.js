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
 * Store face ID and metadata in DynamoDB and S3
 * @param {string} userId - The user ID
 * @param {string} faceId - The face ID from Rekognition
 * @param {Blob} imageData - The face image data
 * @param {string} imagePath - The path where the image is stored in S3
 * @param {Object} faceAttributes - The face attributes from Rekognition
 * @param {Array} historicalMatches - Array of historical matches
 * @returns {Promise<Object>} - The result of the operation
 */
export const storeFaceId = async (userId, faceId, imageData, imagePath, faceAttributes, historicalMatches = []) => {
  if (!userId || !faceId) {
    console.error('[FaceStorage] Cannot store face ID - missing userId or faceId');
    return { success: false, error: 'Missing user ID or face ID' };
  }
  
  console.log('[FaceStorage] Storing face ID and metadata for user:', userId);
  
  try {
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
    
    // Process historical matches for storage if any
    let processedMatches = [];
    if (historicalMatches && historicalMatches.length > 0) {
      console.log('[FaceStorage] Processing historical matches for storage:', historicalMatches.length);
      
      // Ensure we're working with an array and handle potential very large arrays
      const matchArray = Array.isArray(historicalMatches) ? historicalMatches : [];
      
      if (matchArray.length > 150) {
        console.log(`[FaceStorage] Warning: Large number of matches (${matchArray.length}). Limiting to top 150 by similarity.`);
        // Sort by similarity and take top 150
        matchArray.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        matchArray.splice(150); // Keep only first 150 items
      }
      
      processedMatches = matchArray
        .filter(match => match && match.id && match.similarity != null) // Ensure basic required fields exist
        .map(match => ({
          M: { // Explicitly define as a Map
            id: { S: match.id },
            similarity: { N: String(match.similarity) }, // Ensure similarity is a string for N type
            imageUrl: match.imageUrl ? { S: match.imageUrl } : { NULL: true },
            owner: match.owner ? { S: match.owner } : { NULL: true },
            eventId: match.eventId ? { S: match.eventId } : { NULL: true },
            createdAt: match.createdAt ? { S: match.createdAt } : { S: timestamp }
          }
        }));
        
      console.log(`[FaceStorage] Processed ${processedMatches.length} matches for DynamoDB storage`);
    }
    
    // Prepare DynamoDB item
    const item = {
      userId: { S: userId },
      faceId: { S: faceId },
      createdAt: { S: timestamp },
      updatedAt: { S: timestamp }
    };
    
    // Add image URL and path if available
    if (imageUrl) {
      item.imageUrl = { S: imageUrl };
    }
    
    if (imagePath) {
      item.imagePath = { S: imagePath };
    }
    
    // Add face attributes if available
    if (faceAttributes) {
      console.log('[FaceStorage] Storing face attributes in DynamoDB:', 
        Object.keys(faceAttributes).length);
      
      // Ensure faceAttributes is properly serialized for DynamoDB
      const attributesString = JSON.stringify(faceAttributes);
      item.faceAttributes = { S: attributesString };
    }
    
    // Add historical matches if available
    if (processedMatches.length > 0) {
      console.log('[FaceStorage] Storing historical matches in DynamoDB:', processedMatches.length);
      item.historicalMatches = { L: processedMatches };
    }
    
    // Save to DynamoDB
    const params = {
      TableName: 'shmong-face-data',
      Item: item
    };
    
    console.log('[FaceStorage] Storing face data in DynamoDB:', Object.keys(item).length, 'fields');
    console.log('[FaceStorage] Item structure:', JSON.stringify(params, null, 2));
    
    await dynamoClient.send(new PutItemCommand(params));
    console.log('[FaceStorage] Face data stored successfully in DynamoDB');
    
    return {
      success: true,
      faceId,
      imageUrl,
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
        // Then check nested face_data structure
        else if (item.face_data && item.face_data.M && item.face_data.M.public_url && item.face_data.M.public_url.S) {
          imageUrl = item.face_data.M.public_url.S;
          console.log(`✅ [FaceStorage] Found image URL in face_data.public_url field: ${imageUrl}`);
        }
        
        // If we found a CloudFront URL, convert to S3 URL
        if (imageUrl && imageUrl.includes('cloudfront.net')) {
          console.log(`🔄 [FaceStorage] Converting CloudFront URL to S3 URL`);
          imageUrl = convertCloudFrontToS3Url(imageUrl);
          console.log(`🔄 [FaceStorage] Converted S3 URL: ${imageUrl}`);
        }
        
        return { 
          success: true, 
          faceId: item.faceId.S,
          faceAttributes: faceAttributes,
          status: item.status?.S || 'unknown',
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
      // Will try fallbacks next
    }
    
    // If we get here, all methods failed
    console.error(`❌ [FaceStorage] All methods failed to retrieve face ID for user: ${userId}`);
    return { 
      success: false, 
      error: 'Failed to retrieve face ID from any source' 
    };
  } catch (error) {
    console.error(`❌ [FaceStorage] Error getting face ID:`, error);
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

// Helper function to convert stream to string
const streamToString = (stream) => {
  // BROWSER-SAFE IMPLEMENTATION
  if (isBrowser && !hasBuffer) {
    // In browser environments, work with Response objects or Readable streams
    if (stream instanceof Response) {
      return stream.text();
    } else if (typeof stream.getReader === 'function') {
      // Web Streams API
      return new Promise((resolve, reject) => {
        const reader = stream.getReader();
        const chunks = [];
        
        function processText({ done, value }) {
          if (done) {
            const decoder = new TextDecoder();
            const text = chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('');
            resolve(text);
            return;
          }
          
          chunks.push(value);
          return reader.read().then(processText);
        }
        
        reader.read().then(processText).catch(reject);
      });
    } else {
      // Fallback for other types
      return Promise.resolve(stream.toString());
    }
  } else {
    // Node.js environment with Buffer
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => {
          try {
            if (hasBuffer) {
              resolve(Buffer.concat(chunks).toString('utf8'));
            } else {
              // Final fallback if somehow we get here without Buffer
              const decoder = new TextDecoder();
              resolve(chunks.map(chunk => decoder.decode(chunk, { stream: true })).join(''));
            }
          } catch (e) {
            reject(e);
          }
        });
      } catch (streamError) {
        console.error('Stream processing error:', streamError);
        // Last resort fallback
        try {
          resolve(String(stream));
        } catch (e) {
          reject(new Error('Failed to convert stream to string'));
        }
      }
    });
  }
};

// Add the getFaceDataForUser function
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
        // IndexName: 'UserIdCreatedAtIndex', // REMOVED - Querying base table
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
        ':userId': userId // No need for { S: ... } with docClient
        },
        // Limit: 5, // Can't Limit easily without sort key, get all and sort below
        // ScanIndexForward: false // Sorting done manually below
    };
    
    console.log('[FaceStorage] Querying DynamoDB BASE TABLE with docClient params:', JSON.stringify(params, null, 2));
    const response = await docClient.send(new DocQueryCommand(params)); // Use DocQueryCommand
    
    if (response.Items && response.Items.length > 0) {
        // Log all results for debugging (Items are plain JS objects now)
        console.log(`✅ [FaceStorage] Found ${response.Items.length} face records for user ${userId} in base table.`);
        
        // Log keys of first item to understand schema
        console.log(`🔑 [FaceStorage] Face data record keys:`, Object.keys(response.Items[0]));
        console.log(`🔑 [FaceStorage] User ID: ${userId}`);
        console.log(`🔑 [FaceStorage] Image Path:`, response.Items[0].imagePath);
        console.log(`🔑 [FaceStorage] Has imagePath:`, !!response.Items[0].imagePath);
        
        // MANUAL SORTING: Sort by createdAt timestamp descending (newest first)
        const sortedItems = response.Items.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB - dateA; // Descending order
        });

        console.log(`[FaceStorage] Sorted Items (newest first):`, sortedItems.map(i => ({faceId: i.faceId, createdAt: i.createdAt || i.created_at})));

        // Get the most recent "active" record if available from the sorted list
        const activeRecord = sortedItems.find(item => item.status === 'active');
        
        // Otherwise, use the most recent record (which is now sortedItems[0])
        const faceData = activeRecord || sortedItems[0];
        console.log('🟢 [FaceStorage] Selected face data (record structure):', JSON.stringify(faceData, null, 2));

        // Format and return the face data (access properties directly)
        let attributes = null;
        if (faceData.faceAttributes && typeof faceData.faceAttributes === 'string') {
            try { attributes = JSON.parse(faceData.faceAttributes); } catch(e) { console.error('Failed to parse faceAttributes'); }
        } else if (faceData.face_attributes && typeof faceData.face_attributes === 'string') {
            try { attributes = JSON.parse(faceData.face_attributes); } catch(e) { console.error('Failed to parse face_attributes'); }
        }

        return {
            faceId: faceData.faceId,
            faceAttributes: attributes,
            imageUrl: faceData.imageUrl || faceData.public_url,
            imagePath: faceData.imagePath,
            // Historical matches might need parsing if stored complexly, adjust if needed
            historicalMatches: faceData.historicalMatches || [], 
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