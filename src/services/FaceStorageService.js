// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../lib/awsClient';

// S3 Bucket name for face data
const FACE_BUCKET_NAME = 'shmong-face-data';

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
 * @returns {Promise<boolean>} - Success status
 */
export const storeFaceId = async (userId, faceId) => {
  try {
    console.log(`[FaceStorage] 🔶 Storing face ID mapping for user: ${userId} with faceId: ${faceId}`);
    
    // Create mapping object for potential S3 fallback
    const mappingData = {
      user_id: userId,
      face_id: faceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // PRIMARY METHOD: Update DynamoDB directly
    console.log(`[FaceStorage] 🔶 Updating DynamoDB record for user: ${userId}`);
    
    try {
      const item = {
        userId: { S: userId },
        faceId: { S: faceId },
        status: { S: "active" },
        updated_at: { S: new Date().toISOString() },
        created_at: { S: new Date().toISOString() }
      };
      
      console.log(`[FaceStorage] 🔶 DynamoDB put operation preparing:`, {
        table: "shmong-face-data", 
        keys: Object.keys(item)
      });
      
      const putCommand = new PutItemCommand({
        TableName: "shmong-face-data",
        Item: item
      });
      
      await dynamoDBClient.send(putCommand);
      console.log(`[FaceStorage] ✅ DynamoDB update SUCCESSFUL for user ${userId}`);
    } catch (dbError) {
      console.error(`[FaceStorage] ❌ DynamoDB update FAILED:`, dbError);
      console.error(`[FaceStorage] 📝 Error details:`, {
        message: dbError.message,
        code: dbError.code,
        requestId: dbError.$metadata?.requestId
      });
      
      // FALLBACK: Try S3 storage only if DynamoDB fails
      console.log(`[FaceStorage] 🔶 FALLBACK: Attempting S3 storage after DynamoDB failure`);
      
      try {
        // Store mapping in S3
        const command = new PutObjectCommand({
          Bucket: FACE_BUCKET_NAME,
          Key: `face-mappings/${userId}.json`,
          Body: JSON.stringify(mappingData),
          ContentType: 'application/json'
        });
        
        await s3Client.send(command);
        console.log(`[FaceStorage] ✅ S3 fallback storage succeeded`);
      } catch (s3Error) {
        console.error(`[FaceStorage] ❌ S3 fallback ALSO FAILED:`, s3Error);
        throw new Error(`Both DynamoDB and S3 storage failed: ${dbError.message} | ${s3Error.message}`);
      }
    }
    
    // Final success
    console.log(`[FaceStorage] ✅ Face ID mapping stored successfully for user: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`[FaceStorage] ❌ CRITICAL ERROR storing face ID mapping:`, error);
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
    console.log(`[FaceStorage] 🔍 Getting face ID for user: ${userId}`);
    
    // PRIMARY METHOD: Get from DynamoDB
    console.log(`[FaceStorage] 🔍 Checking DynamoDB for user: ${userId}`);
    
    try {
      // Using scan with filter as a simple approach
      // In a production app, you'd use a more efficient query
      const scanCommand = {
        TableName: "shmong-face-data",
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        }
      };
      
      console.log(`[FaceStorage] 🔍 Preparing DynamoDB scan`);
      
      // Use fetch API to call API Gateway for scanning DynamoDB
      // This avoids the SDK limitations in browser
      const response = await fetch(
        "https://60x98imf4a.execute-api.us-east-1.amazonaws.com/prod/scan-dynamodb", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            tableName: "shmong-face-data",
            filterExpression: "userId = :userId",
            expressionValues: {
              ":userId": userId
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Gateway error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.items && result.items.length > 0) {
        const item = result.items[0];
        console.log(`[FaceStorage] ✅ Face ID retrieved from DynamoDB: ${item.faceId}`);
        return { success: true, faceId: item.faceId };
      } else {
        console.log(`[FaceStorage] ⚠️ No face ID found in DynamoDB for user: ${userId}`);
        throw new Error("No data found in DynamoDB");
      }
    } catch (dbError) {
      console.error(`[FaceStorage] ⚠️ DynamoDB retrieval failed:`, dbError);
      
      // FALLBACK: Try S3 retrieval if DynamoDB fails
      console.log(`[FaceStorage] 🔍 Falling back to S3 retrieval`);
      
      try {
        const command = new GetObjectCommand({
          Bucket: FACE_BUCKET_NAME,
          Key: `face-mappings/${userId}.json`
        });
        
        const response = await s3Client.send(command);
        
        // Convert stream to text
        const bodyContents = await streamToString(response.Body);
        
        // Parse JSON
        const data = JSON.parse(bodyContents);
        console.log(`[FaceStorage] ✅ Face ID retrieved from S3: ${data.face_id}`);
        
        return { success: true, faceId: data.face_id };
      } catch (s3Error) {
        console.error(`[FaceStorage] ❌ S3 fallback retrieval failed:`, s3Error);
        throw new Error(`Both DynamoDB and S3 retrieval failed: ${dbError.message} | ${s3Error.message}`);
      }
    }
  } catch (error) {
    console.error(`[FaceStorage] ❌ ERROR getting face ID: ${error.message}`);
    return { success: false, error: error.message };
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
    if (imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(imageData);
    }
    
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
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

export default {
  storeFaceId,
  getFaceId,
  uploadFaceImage,
  deleteFaceImage
}; 