// FaceStorageService.js - Utility to store and retrieve face IDs using Supabase Storage
import { supabase } from '../lib/supabaseClient';

const STORAGE_BUCKET = 'user-data';
const FACE_ID_FILE = 'face-id.json';

/**
 * Store a user's face ID in the database
 * @param {string} userId - The user's ID
 * @param {string} faceId - The AWS face ID
 * @returns {Promise<void>}
 */
export const storeFaceId = async (userId, faceId) => {
    if (!userId || !faceId) {
        console.warn('[FaceStorage] Missing userId or faceId');
        return;
    }

    try {
        console.log(`[FaceStorage] Storing face ID ${faceId} for user ${userId}`);

        // Store in user_face_data table
        const { error: userFaceError } = await supabase
            .from('user_face_data')
            .upsert({
                user_id: userId,
                face_id: faceId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (userFaceError) {
            console.error('[FaceStorage] Error storing in user_face_data:', userFaceError);
            throw userFaceError;
        }

        console.log('[FaceStorage] Successfully stored face ID');
    } catch (error) {
        console.error('[FaceStorage] Error storing face ID:', error);
        throw error;
    }
};

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