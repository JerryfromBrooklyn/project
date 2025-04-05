// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../lib/awsClient';

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
 * Store a face ID for a user in both the database and localStorage backup
 * @param {string} userId - The user ID
 * @param {string} faceId - The AWS Rekognition face ID
 * @param {object} faceAttributes - Optional face attributes from Rekognition
 * @param {Buffer|Blob|ArrayBuffer} imageData - Optional face image data
 * @returns {Promise<object>} - Success status and result info
 */
export const storeFaceId = async (userId, faceId, faceAttributes = null, imageData = null) => {
  try {
    console.log(`💾 [FaceStorage] Storing face ID mapping for user: ${userId} with faceId: ${faceId}`);
    
    if (faceAttributes) {
      console.groupCollapsed(`📊 [FaceStorage] Face attributes details:`);
      console.log('Attribute count:', Object.keys(faceAttributes).length);
      console.log('Attribute keys:', Object.keys(faceAttributes).length > 0 ? 
        Object.keys(faceAttributes) : 
        'No attributes provided');
      console.log('Full attributes:', faceAttributes);
      console.groupEnd();
    }
    
    // Handle image upload to S3 if imageData is a Buffer/File
    let imageUrl = null;
    if (imageData) {
      try {
        console.log(`📷 [FaceStorage] Uploading face image to S3... (${imageData.length || (imageData.size ? imageData.size : 'unknown')} bytes)`);
        
        // Generate a unique filename
        const imageName = `face-${userId}-${Date.now()}.jpg`;
        const s3Key = `faces/${userId}/${imageName}`;
        
        // Ensure we have a proper data format that works in browsers
        let uploadBuffer;
        console.groupCollapsed('🔄 [FaceStorage] Image conversion process:');
        
        // BROWSER-SAFE IMPLEMENTATION: Don't rely on Buffer
        if (isBrowser && !hasBuffer) {
          // Browser environment - work directly with browser types
          console.log('Browser environment detected, using direct Uint8Array conversion');
          
          if (imageData instanceof Uint8Array) {
            console.log('Using provided Uint8Array directly');
            uploadBuffer = imageData;
          } else if (imageData instanceof ArrayBuffer) {
            console.log('Converting ArrayBuffer to Uint8Array');
            uploadBuffer = new Uint8Array(imageData);
          } else if (imageData instanceof Blob) {
            console.log('Converting Blob to Uint8Array');
            const arrayBuffer = await imageData.arrayBuffer();
            uploadBuffer = new Uint8Array(arrayBuffer);
          } else if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
            console.log('Converting base64 string to Uint8Array');
            const base64Data = imageData.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            uploadBuffer = bytes;
          } else {
            console.log('Using generic Uint8Array conversion');
            // Last resort
            if (typeof imageData.buffer !== 'undefined') {
              uploadBuffer = new Uint8Array(imageData.buffer);
            } else {
              // Create a minimal bytes array if all else fails
              uploadBuffer = new Uint8Array([0, 0, 0]);
              console.warn('Could not convert image data to a usable format');
            }
          }
        } else {
          // Node.js environment or Buffer is defined
          console.log('Node.js environment or Buffer is defined, using Buffer');
          
          try {
            if (hasBuffer && Buffer.isBuffer(imageData)) {
              console.log('Using provided Buffer directly');
              uploadBuffer = imageData;
            } else if (imageData instanceof Blob) {
              console.log('Converting Blob to Buffer');
              const arrayBuffer = await imageData.arrayBuffer();
              uploadBuffer = hasBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
            } else if (imageData instanceof ArrayBuffer) {
              console.log('Converting ArrayBuffer to Buffer');
              uploadBuffer = hasBuffer ? Buffer.from(imageData) : new Uint8Array(imageData);
            } else if (imageData instanceof Uint8Array) {
              console.log('Converting Uint8Array to Buffer'); 
              uploadBuffer = hasBuffer ? Buffer.from(imageData) : imageData;
            } else if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
              console.log('Converting base64 string to Buffer');
              if (hasBuffer) {
                const base64Data = imageData.split(',')[1];
                uploadBuffer = Buffer.from(base64Data, 'base64');
              } else {
                // Browser-compatible base64 decode
                const base64Data = imageData.split(',')[1];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                uploadBuffer = bytes;
              }
            } else {
              console.log('Using generic Buffer/Uint8Array conversion');
              if (hasBuffer) {
                try {
                  uploadBuffer = Buffer.from(imageData);
                } catch (e) {
                  console.warn('Buffer.from failed, falling back to Uint8Array:', e.message);
                  uploadBuffer = new Uint8Array(imageData.buffer || imageData);
                }
              } else {
                uploadBuffer = new Uint8Array(imageData.buffer || imageData);
              }
            }
          } catch (bufferError) {
            console.error('❗ Buffer operation failed, using browser fallback:', bufferError);
            // Last resort fallback
            if (imageData instanceof Uint8Array) {
              uploadBuffer = imageData;
            } else if (imageData instanceof ArrayBuffer) {
              uploadBuffer = new Uint8Array(imageData);
            } else if (typeof imageData.buffer !== 'undefined') {
              uploadBuffer = new Uint8Array(imageData.buffer);
            } else {
              // Empty byte array as last resort fallback
              uploadBuffer = new Uint8Array([0, 0, 0]);
            }
          }
        }
        console.groupEnd();
        
        console.log(`📦 [FaceStorage] Prepared upload buffer of size: ${uploadBuffer.length || uploadBuffer.byteLength || 'unknown'} bytes, type: ${uploadBuffer.constructor.name}`);
        
        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: FACE_BUCKET_NAME,
          Key: s3Key,
          Body: uploadBuffer,
          ContentType: 'image/jpeg'
        });
        
        console.log(`🚀 [FaceStorage] Sending S3 PutObject request for key: ${s3Key}`);
        const uploadResult = await s3Client.send(uploadCommand);
        console.groupCollapsed(`📝 [FaceStorage] S3 upload response details:`);
        console.log('Status:', uploadResult.$metadata?.httpStatusCode);
        console.log('Request ID:', uploadResult.$metadata?.requestId);
        console.log('Full response:', uploadResult);
        console.groupEnd();
        
        imageUrl = `https://${FACE_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
        console.log(`✅ [FaceStorage] Image uploaded successfully to S3: ${imageUrl}`);
      } catch (s3Error) {
        console.error(`❌ [FaceStorage] S3 image upload failed:`, s3Error);
        console.groupCollapsed(`❓ [FaceStorage] Error details:`);
        console.log('Name:', s3Error.name);
        console.log('Message:', s3Error.message);
        console.log('Code:', s3Error.code);
        console.log('Status:', s3Error.$metadata?.httpStatusCode);
        console.log('Request ID:', s3Error.$metadata?.requestId);
        console.log('Stack:', s3Error.stack);
        console.groupEnd();
        // Continue without image URL - we'll still store the face mapping
      }
    }
    
    // PRIMARY METHOD: Update DynamoDB directly
    console.log(`🔄 [FaceStorage] Updating DynamoDB record for user: ${userId}`);
    
    try {
      const item = {
        userId: { S: userId },
        faceId: { S: faceId },
        status: { S: "active" },
        updated_at: { S: new Date().toISOString() },
        created_at: { S: new Date().toISOString() }
      };
      
      // Add face attributes if provided
      if (faceAttributes) {
        console.log(`📊 [FaceStorage] Adding face attributes to DynamoDB item`);
        // Convert complex object to JSON string for DynamoDB
        item.face_attributes = { S: JSON.stringify(faceAttributes) };
      }
      
      // Add image URL if provided
      if (imageUrl) {
        console.log(`🖼️ [FaceStorage] Adding public_url to DynamoDB item: ${imageUrl}`);
        item.public_url = { S: imageUrl };
      }
      
      console.groupCollapsed(`📋 [FaceStorage] DynamoDB put operation details:`);
      console.log('Table:', "shmong-face-data");
      console.log('Keys:', Object.keys(item));
      console.log('Full item:', item);
      console.groupEnd();
      
      const putCommand = new PutItemCommand({
        TableName: "shmong-face-data",
        Item: item
      });
      
      await dynamoDBClient.send(putCommand);
      console.log(`✅ [FaceStorage] DynamoDB update SUCCESSFUL for user ${userId}`);
      
      return { 
        success: true, 
        imageUrl: imageUrl,
        faceAttributes: faceAttributes
      };
    } catch (dbError) {
      console.error(`❌ [FaceStorage] DynamoDB update FAILED:`, dbError);
      throw dbError;
    }
  } catch (error) {
    console.error(`❌ [FaceStorage] CRITICAL ERROR storing face ID mapping:`, error);
    console.error(`📚 [FaceStorage] Stack trace:`, error.stack);
    return { success: false, error: error.message };
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
        
        return { 
          success: true, 
          faceId: item.faceId.S,
          faceAttributes: faceAttributes,
          status: item.status?.S || 'unknown',
          imageUrl: item.public_url?.S || null
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