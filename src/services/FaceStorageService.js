// FaceStorageService.js - Utility to store and retrieve face IDs using AWS S3
import { s3Client } from '../lib/awsClient';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Bucket name for face data
const FACE_BUCKET_NAME = 'shmong-face-data';

/**
 * Store a face ID for a user in both the database and localStorage backup
 * @param {string} userId - The user ID
 * @param {string} faceId - The AWS Rekognition face ID
 * @returns {Promise<boolean>} - Success status
 */
export const storeFaceId = async (userId, faceId) => {
  try {
    console.log('[FaceStorage] Storing face ID mapping for user:', userId);
    
    // Create mapping object
    const mappingData = {
      user_id: userId,
      face_id: faceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store mapping in S3
    const command = new PutObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: `face-mappings/${userId}.json`,
      Body: JSON.stringify(mappingData),
      ContentType: 'application/json'
    });
    
    await s3Client.send(command);
    console.log('[FaceStorage] Face ID mapping stored successfully');
    
    return { success: true };
  } catch (error) {
    console.error('[FaceStorage] Error storing face ID mapping:', error);
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
    console.log('[FaceStorage] Getting face ID for user:', userId);
    
    const command = new GetObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: `face-mappings/${userId}.json`
    });
    
    const response = await s3Client.send(command);
    
    // Convert stream to text
    const bodyContents = await streamToString(response.Body);
    
    // Parse JSON
    const data = JSON.parse(bodyContents);
    console.log('[FaceStorage] Face ID retrieved successfully');
    
    return { success: true, faceId: data.face_id };
  } catch (error) {
    console.error('[FaceStorage] Error getting face ID:', error);
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