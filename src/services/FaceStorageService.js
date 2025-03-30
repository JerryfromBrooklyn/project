// FaceStorageService.js - Utility to store and retrieve face IDs using Supabase Storage
import { supabase } from '../lib/supabaseClient'; // Correct import path

const STORAGE_BUCKET = 'user-data';
const FACE_ID_FILE = 'face-id.json';

/**
 * Stores a user's face ID in a dedicated storage file
 * @param {string} userId - The user's ID
 * @param {string} faceId - The face ID from AWS Rekognition
 * @returns {Promise<boolean>} - Success status
 */
export const storeFaceId = async (userId, faceId) => {
  try {
    if (!userId || !faceId) {
      console.error('[FaceStorage] Missing userId or faceId');
      return false;
    }

    console.log(`[FaceStorage] Storing face ID ${faceId} for user ${userId}`);
    
    // Check if bucket exists, create if needed
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets.find(b => b.name === STORAGE_BUCKET)) {
      console.log(`[FaceStorage] Creating bucket: ${STORAGE_BUCKET}`);
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false
      });
    }
    
    // Store the face ID in a user-specific file
    const filePath = `${userId}/${FACE_ID_FILE}`;
    const content = JSON.stringify({ faceId, updatedAt: new Date().toISOString() });
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, content, {
        upsert: true,
        contentType: 'application/json'
      });
      
    if (error) {
      console.error('[FaceStorage] Error storing face ID:', error);
      return false;
    }
    
    console.log(`[FaceStorage] Successfully stored face ID for user ${userId}`);
    return true;
  } catch (err) {
    console.error('[FaceStorage] Unexpected error storing face ID:', err);
    return false;
  }
};

/**
 * Retrieves a user's face ID from storage
 * @param {string} userId - The user's ID
 * @returns {Promise<string|null>} - The face ID or null if not found
 */
export const getFaceId = async (userId) => {
  try {
    if (!userId) {
      console.error('[FaceStorage] Missing userId');
      return null;
    }
    
    console.log(`[FaceStorage] Retrieving face ID for user ${userId}`);
    
    // Get the face ID file for this user
    const filePath = `${userId}/${FACE_ID_FILE}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);
      
    if (error) {
      console.log(`[FaceStorage] Face ID file not found for user ${userId}:`, error);
      return null;
    }
    
    // Parse the JSON content
    const text = await data.text();
    const { faceId } = JSON.parse(text);
    
    console.log(`[FaceStorage] Retrieved face ID ${faceId} for user ${userId}`);
    return faceId;
  } catch (err) {
    console.error('[FaceStorage] Error retrieving face ID:', err);
    return null;
  }
};

/**
 * Checks if a face ID exists for a user
 * @param {string} userId - The user's ID 
 * @returns {Promise<boolean>} - Whether a face ID exists
 */
export const hasFaceId = async (userId) => {
  try {
    const faceId = await getFaceId(userId);
    return !!faceId;
  } catch (err) {
    return false;
  }
}; 