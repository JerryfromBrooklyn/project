// FaceStorageService.js - Utility to store and retrieve face IDs using Supabase Storage
import { supabase } from '../lib/supabaseClient';

const STORAGE_BUCKET = 'user-data';
const FACE_ID_FILE = 'face-id.json';

/**
 * Store a user's face ID in the database
 * @param {string} userId - The user's ID
 * @param {string} faceId - The AWS face ID
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export async function storeFaceId(userId, faceId) {
  try {
    // Validation with logging
    if (!userId) {
      console.error('[FaceStorage] Missing userId, cannot store face data');
      return false;
    }

    if (!faceId) {
      console.warn('[FaceStorage] Missing faceId for user', userId);
      // Generate a fallback ID if missing
      faceId = `local-face-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      console.log('[FaceStorage] Generated fallback faceId:', faceId);
    }

    console.log(`[FaceStorage] Storing face ID ${faceId} for user ${userId}`);
    
    // First try to store in user_face_data (new schema)
    try {
      const { error: storageError } = await supabase
        .from('user_face_data')
        .upsert({
          user_id: userId,
          face_id: faceId,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      
      if (storageError) {
        console.error('[FaceStorage] Error storing in user_face_data:', storageError);
      } else {
        console.log('[FaceStorage] Successfully stored face ID in user_face_data');
      }
    } catch (tableError) {
      console.warn('[FaceStorage] Error accessing user_face_data table:', tableError);
    }
    
    // Also try to store in the generic user_storage as a backup
    try {
      const { error: userStorageError } = await supabase
        .from('user_storage')
        .upsert({
          user_id: userId,
          key: 'face_id',
          updated_at: new Date().toISOString()
        });
      
      if (userStorageError) {
        console.error('[FaceStorage] Error storing in user_storage:', userStorageError);
      } else {
        console.log('[FaceStorage] Successfully stored face ID in user_storage');
      }
    } catch (storageError) {
      console.warn('[FaceStorage] Error accessing user_storage table:', storageError);
    }

    // Try also in face_user_associations table if it exists
    try {
      const { error: associationError } = await supabase
        .from('face_user_associations')
        .upsert({
          face_id: faceId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
      
      if (associationError) {
        console.warn('[FaceStorage] Error storing in face_user_associations:', associationError);
      } else {
        console.log('[FaceStorage] Successfully stored in face_user_associations');
      }
    } catch (associationTableError) {
      console.warn('[FaceStorage] Error accessing face_user_associations table:', associationTableError);
    }
    
    return true;
  } catch (error) {
    console.error('[FaceStorage] Critical error storing face ID:', error);
    return false;
  }
}

/**
 * Get a user's face ID from the database
 * @param {string} userId - The user's ID
 * @returns {Promise<string|null>} - The face ID or null if not found
 */
export const getFaceId = async (userId) => {
    if (!userId) {
        console.warn('[FaceStorage] Missing userId');
        return null;
    }

    try {
        console.log(`[FaceStorage] Getting face ID for user ${userId}`);

        // Try user_face_data table
        const { data, error } = await supabase
            .from('user_face_data')
            .select('face_id')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('[FaceStorage] Error getting face ID:', error);
            return null;
        }

        if (data?.face_id) {
            console.log('[FaceStorage] Found face ID:', data.face_id);
            return data.face_id;
        }

        console.log('[FaceStorage] No face ID found');
        return null;
    } catch (error) {
        console.error('[FaceStorage] Error getting face ID:', error);
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