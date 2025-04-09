// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
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
    const { dynamoDBClient } = await getAWSClients();
    
    const timestamp = new Date().toISOString();
    
    // Process historical matches for storage if any
    let processedMatches = [];
    if (historicalMatches && historicalMatches.length > 0) {
      console.log('[FaceStorage] Processing historical matches for storage:', historicalMatches.length);
      processedMatches = historicalMatches.map(match => ({
        id: { S: match.id || 'unknown' },
        similarity: { N: match.similarity?.toString() || '0' },
        imageUrl: match.imageUrl ? { S: match.imageUrl } : { NULL: true },
        owner: match.owner ? { S: match.owner } : { NULL: true },
        eventId: match.eventId ? { S: match.eventId } : { NULL: true },
        createdAt: match.createdAt ? { S: match.createdAt } : { S: timestamp }
      }));
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
      
      // Convert attributes to DynamoDB format - this requires special handling
      // We'll store it as a stringified JSON
      item.faceAttributes = { S: JSON.stringify(faceAttributes) };
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
    await dynamoDBClient.send(new PutItemCommand(params));
    console.log('[FaceStorage] Face data stored successfully in DynamoDB');
    
    return {
      success: true,
      faceId,
      imageUrl
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
 * Upload a face image to S3
 * @param {string} userId - The user ID
 * @param {Blob} imageData - The image data
 * @param {string} imagePath - Optional path override
 * @returns {Promise<Object>} - The result of the operation
 */
export const uploadFaceImage = async (userId, imageData, customPath = null) => {
  if (!userId || !imageData) {
    console.error('[FaceStorage] Cannot upload face image - missing userId or imageData');
    return { success: false, error: 'Missing user ID or image data' };
  }

  console.log('[FaceStorage] Uploading face image for user:', userId);

  try {
    // Convert image data to buffer
    let buffer;
    console.log('🔄 [FaceStorage] uploadFaceImage conversion process:');
    
    if (imageData instanceof Buffer) {
      buffer = imageData;
    } else if (imageData instanceof Uint8Array) {
      buffer = Buffer.from(imageData);
    } else if (imageData instanceof Blob) {
      const arrayBuffer = await imageData.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = imageData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      return { 
        success: false, 
        error: 'Unsupported image data format'
      };
    }

    // Generate a unique path for the image
    const imagePath = customPath || `${userId}/${Date.now()}.jpg`;
    
    // Upload to S3
    const { s3Client } = await getAWSClients();
    const s3Params = {
      Bucket: 'shmong',
      Key: `face-images/${imagePath}`,
      Body: buffer,
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
  
  console.log('[FaceStorage] Fetching face data for user:', userId);
  
  try {
    const { dynamoDBClient } = await getAWSClients();
    
    const params = {
      TableName: 'shmong-face-data',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: 1,
      ScanIndexForward: false // Get the most recent entry first
    };
    
    console.log('[FaceStorage] Querying DynamoDB for face data...');
    const response = await dynamoDBClient.send(new QueryCommand(params));
    
    if (response.Items && response.Items.length > 0) {
      const faceData = response.Items[0];
      console.log('[FaceStorage] Face data found:', faceData);
      
      // Format and return the face data
      return {
        faceId: faceData.faceId,
        faceAttributes: faceData.faceAttributes,
        imageUrl: faceData.imageUrl,
        imagePath: faceData.imagePath,
        historicalMatches: faceData.historicalMatches || [],
        createdAt: faceData.createdAt
      };
    } else {
      console.log('[FaceStorage] No face data found for user:', userId);
      return null;
    }
  } catch (error) {
    console.error('[FaceStorage] Error fetching face data from DynamoDB:', error);
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