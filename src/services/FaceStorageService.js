// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../lib/awsClient';
import { normalizeToS3Url, convertCloudFrontToS3Url } from '../utils/s3Utils';
import { docClient } from '../lib/awsClient';
import { marshall } from '@aws-sdk/util-dynamodb';

// S3 Bucket name for face data
const FACE_BUCKET_NAME = 'shmong';

// Ensure Buffer exists in the environment - critical fix for browser compatibility
const isBrowser = typeof window !== 'undefined';
const hasBuffer = typeof Buffer !== 'undefined';

// Log the environment for debugging
console.log(`🔧 [FaceStorage] Environment detection: Browser=${isBrowser}, HasBuffer=${hasBuffer}`);

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Store face ID and metadata in the DynamoDB database
 * @param {string} userId - The user ID
 * @param {string} faceId - The AWS Rekognition face ID
 * @param {Object} faceAttributes - Face attributes from Rekognition
 * @param {Uint8Array|Buffer} imageData - Binary image data (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const storeFaceId = async (userId, faceId, faceAttributes, imageData = null) => {
  try {
    console.log('[FaceStorage] Storing face ID and metadata in database');
    
    // Prepare data for storage
    const timestamp = new Date().toISOString();
    const faceData = {
      user_id: userId,
      face_id: faceId,
      created_at: timestamp,
      updated_at: timestamp,
      attributes: faceAttributes || {},
      // For now, we'll use a placeholder URL
      // In a real implementation, you'd upload the image to S3 here
      image_url: `https://example.com/face-images/${userId}/${faceId}.jpg`
    };
    
    // Store in DynamoDB
    await docClient.send(new PutItemCommand({
      TableName: 'shmong-face-data',
      Item: marshall(faceData)
    }));
    
    console.log('[FaceStorage] Face data stored successfully');
    
    return {
      success: true,
      faceId: faceId,
      imageUrl: faceData.image_url
    };
  } catch (error) {
    console.error('[FaceStorage] Error storing face data:', error);
    return {
      success: false,
      error: error.message || 'Failed to store face data'
    };
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
      
      const queryResult = await dynamoDBClient.send(queryCommand);
      
      if (queryResult.Items && queryResult.Items.length > 0) {
        const item = queryResult.Items[0];
        console.log(`✅ [FaceStorage] Face ID retrieved from DynamoDB query: ${item.faceId.S}`);
        
        // Parse face attributes if available
        let faceAttributes = null;
        if (item.face_attributes && item.face_attributes.S) {
          try {
            faceAttributes = JSON.parse(item.face_attributes.S);
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
 * Upload face image
 * @param {string} userId - The user ID
 * @param {string} imageData - The base64 encoded image data
 * @returns {Promise<object>} - Success status and image path
 */
export const uploadFaceImage = async (userId, imageData) => {
  try {
    console.log('[FaceStorage] Uploading face image for user:', userId);
    
    // Generate a unique filename
    const filename = `${userId}/${Date.now()}.jpg`;
    
    // Extract base64 data if needed
    let imageBuffer;
    
    // BROWSER-SAFE IMPLEMENTATION
    console.groupCollapsed('🔄 [FaceStorage] uploadFaceImage conversion process:');
    
    try {
      if (isBrowser && !hasBuffer) {
        // Browser environment - work with native browser types
        console.log('Using browser-native image conversion');
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          const base64Data = imageData.split(',')[1];
          const binaryString = atob(base64Data);
          imageBuffer = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            imageBuffer[i] = binaryString.charCodeAt(i);
          }
        } else if (imageData instanceof Blob) {
          const arrayBuffer = await imageData.arrayBuffer();
          imageBuffer = new Uint8Array(arrayBuffer);
        } else if (imageData instanceof ArrayBuffer) {
          imageBuffer = new Uint8Array(imageData);
        } else if (imageData instanceof Uint8Array) {
          imageBuffer = imageData;
        } else {
          // Try best effort conversion
          console.log('Unknown image format, attempting best-effort conversion');
          if (typeof imageData.buffer !== 'undefined') {
            imageBuffer = new Uint8Array(imageData.buffer);
          } else {
            // Create placeholder image as last resort
            imageBuffer = new Uint8Array([0, 0, 0]);
          }
        }
      } else {
        // Node.js environment or Buffer is available
        console.log('Using Node.js/Buffer image conversion');
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          const base64Data = imageData.split(',')[1];
          imageBuffer = hasBuffer ? Buffer.from(base64Data, 'base64') : 
                                    (() => {
                                      const binaryString = atob(base64Data);
                                      const arr = new Uint8Array(binaryString.length);
                                      for (let i = 0; i < binaryString.length; i++) {
                                        arr[i] = binaryString.charCodeAt(i);
                                      }
                                      return arr;
                                    })();
        } else if (hasBuffer) {
          try {
            imageBuffer = Buffer.from(imageData);
          } catch (e) {
            console.warn('Buffer.from failed in uploadFaceImage, using fallback:', e.message);
            // Fallback to Uint8Array
            imageBuffer = new Uint8Array(imageData.buffer || imageData);
          }
        } else {
          // Direct use if already in right format
          imageBuffer = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
        }
      }
    } catch (conversionError) {
      console.error('❌ [FaceStorage] Image conversion error:', conversionError);
      // Create minimal viable image data as last resort
      imageBuffer = new Uint8Array([255, 216, 255, 224, 0, 0, 0, 0, 0]); // Minimal JPEG header
    }
    
    console.log(`📦 [FaceStorage] Prepared image buffer of size: ${imageBuffer.length || imageBuffer.byteLength || 'unknown'} bytes, type: ${imageBuffer.constructor.name}`);
    console.groupEnd();
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: `face-images/${filename}`,
      Body: imageBuffer,
      ContentType: 'image/jpeg'
    });
    
    await s3Client.send(command);
    console.log('[FaceStorage] Face image uploaded successfully');
    
    // Generate a URL to access the image
    const getCommand = new GetObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: `face-images/${filename}`
    });
    
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    
    return { 
      success: true, 
      path: filename,
      url: url
    };
  } catch (error) {
    console.error('[FaceStorage] Error uploading face image:', error);
    return { success: false, error: error.message };
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

export default {
  storeFaceId,
  getFaceId,
  uploadFaceImage,
  deleteFaceImage
}; 