/* =========================================================
 * Face Matching System API Endpoints
 * =========================================================
 * 
 * This file contains the API endpoints for the face matching system:
 * - User registration with face indexing
 * - Photo upload with face matching
 * - User dashboard data
 * - Face match analytics
 *
 * These endpoints are implemented using direct AWS SDK calls
 * without relying on Supabase Edge Functions or RPC.
 * =========================================================
 */

import FaceMatchingService from './FaceMatchingService';
import { supabase } from '../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process user sign-up
 * @param {object} userData - User data including email, password, and name
 * @returns {Promise<object>} Result with user ID and success flag
 */
export async function signUpUser(userData) {
  try {
    console.log('[AUTH] Starting user sign-up process');
    
    const { email, password, fullName } = userData;
    
    // Validate input
    if (!email || !password) {
      console.error('[AUTH] Missing required fields for sign-up');
      return {
        success: false,
        error: 'Email and password are required'
      };
    }
    
    // Sign up user with Supabase Auth
    console.log('[AUTH] Creating user account with Supabase Auth');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      console.error('[AUTH] Supabase Auth error:', authError);
      return {
        success: false,
        error: authError.message
      };
    }
    
    if (!authData.user) {
      console.error('[AUTH] No user data returned from Supabase Auth');
      return {
        success: false,
        error: 'Failed to create user account'
      };
    }
    
    const userId = authData.user.id;
    console.log('[AUTH] User created with ID:', userId);
    
    // Add user to users table with profile data
    console.log('[AUTH] Adding user to users table');
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: 'HASHED', // In a real app, we wouldn't store this
        full_name: fullName || email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error('[AUTH] Error adding user to users table:', profileError);
      // Continue despite error to maintain the user in Auth
    }
    
    return {
      success: true,
      userId,
      email
    };
  } catch (error) {
    console.error('[AUTH] Exception during sign-up:', error);
    return {
      success: false,
      error: error.message || 'Sign-up failed'
    };
  }
}

/**
 * Register a user's face
 * @param {string} userId - User ID
 * @param {Uint8Array} imageBytes - Face image data
 * @returns {Promise<object>} Registration result with face ID
 */
export async function registerFace(userId, imageBytes) {
  try {
    console.log('[API] Starting face registration for user:', userId);
    
    // Call FaceMatchingService to register the face
    const result = await FaceMatchingService.registerUserFace(imageBytes, userId);
    
    console.log('[API] Face registration result:', result);
    
    return result;
  } catch (error) {
    console.error('[API] Error during face registration:', error);
    return {
      success: false,
      error: error.message || 'Face registration failed'
    };
  }
}

/**
 * Upload a photo with face matching
 * @param {string} userId - User ID
 * @param {File} file - Photo file
 * @param {object} metadata - Photo metadata
 * @returns {Promise<object>} Upload result with matched users
 */
export async function uploadPhotoWithMatching(userId, file, metadata = {}) {
  try {
    console.log('[API] Starting photo upload with face matching');
    console.log('[API] User ID:', userId);
    console.log('[API] File:', file.name, file.size, 'bytes');
    
    // 1. Generate unique ID for the photo
    const photoId = uuidv4();
    console.log('[API] Generated photo ID:', photoId);
    
    // 2. Upload to Supabase Storage
    console.log('[API] Uploading file to storage');
    const filePath = `${userId}/${photoId}.${file.name.split('.').pop()}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('[API] Storage upload error:', uploadError);
      return {
        success: false,
        error: 'Failed to upload photo to storage'
      };
    }
    
    console.log('[API] File uploaded successfully');
    
    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);
      
    console.log('[API] Public URL:', publicUrl);
    
    // 4. Convert file to bytes for face matching
    console.log('[API] Converting file to bytes for face matching');
    const arrayBuffer = await file.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);
    
    // 5. Create initial photo record
    console.log('[API] Creating initial photo record');
    const { error: dbError } = await supabase
      .from('photos')
      .insert({
        id: photoId,
        user_id: userId,
        storage_path: filePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (dbError) {
      console.error('[API] Database error creating photo record:', dbError);
      // Continue despite error since we have the file in storage
    }
    
    // 6. Match faces in the photo
    console.log('[API] Matching faces in the photo');
    const matchedUsers = await FaceMatchingService.matchFaces(photoId, imageBytes);
    
    console.log(`[API] Found ${matchedUsers.length} matched users`);
    
    return {
      success: true,
      photoId,
      url: publicUrl,
      matchedUsers
    };
  } catch (error) {
    console.error('[API] Error during photo upload:', error);
    return {
      success: false,
      error: error.message || 'Photo upload failed'
    };
  }
}

/**
 * Get user dashboard data (photos they appear in)
 * @param {string} userId - User ID
 * @param {object} filters - Optional filters (date, confidence, etc.)
 * @returns {Promise<object>} Dashboard data with matched photos
 */
export async function getUserDashboard(userId, filters = {}) {
  try {
    console.log('[API] Getting dashboard data for user:', userId);
    console.log('[API] Filters:', filters);
    
    // Build query for user_matches table
    let query = supabase
      .from('user_matches')
      .select(`
        id,
        similarity,
        confidence,
        matched_at,
        photos (
          id,
          public_url,
          file_name,
          created_at,
          user_id,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('matched_at', { ascending: false });
      
    // Apply filters if provided
    if (filters.minConfidence) {
      query = query.gte('confidence', filters.minConfidence);
    }
    
    if (filters.startDate) {
      query = query.gte('matched_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('matched_at', filters.endDate);
    }
    
    // Paginate results
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    
    query = query.range(start, end);
    
    console.log('[API] Executing dashboard query');
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[API] Error fetching dashboard data:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard data'
      };
    }
    
    console.log(`[API] Fetched ${data.length} matched photos`);
    
    // Format the response
    const formattedData = data.map(match => ({
      id: match.id,
      photoId: match.photos.id,
      photoUrl: match.photos.public_url,
      fileName: match.photos.file_name,
      uploadedAt: match.photos.created_at,
      matchedAt: match.matched_at,
      similarity: match.similarity,
      confidence: match.confidence,
      uploadedBy: {
        id: match.photos.users.id,
        name: match.photos.users.full_name,
        avatarUrl: match.photos.users.avatar_url
      }
    }));
    
    return {
      success: true,
      matches: formattedData,
      pagination: {
        page,
        pageSize,
        totalItems: count
      }
    };
  } catch (error) {
    console.error('[API] Error getting dashboard data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    };
  }
}

/**
 * Refresh user matches by searching for new matches in existing photos
 * @param {string} userId - User ID
 * @returns {Promise<object>} Refresh result with new match count
 */
export async function refreshUserMatches(userId) {
  try {
    console.log('[API] Refreshing matches for user:', userId);
    
    // Get the user's face ID
    console.log('[API] Getting user face ID');
    const { data: faceData, error: faceError } = await supabase
      .from('face_data')
      .select('face_id')
      .eq('user_id', userId)
      .single();
      
    if (faceError || !faceData) {
      console.error('[API] Error fetching face data:', faceError);
      return {
        success: false,
        error: 'No face ID found for user'
      };
    }
    
    console.log('[API] Found face ID:', faceData.face_id);
    
    // Search for matches using face ID
    const matchedPhotos = await FaceMatchingService.searchFacesByFaceId(faceData.face_id, userId);
    
    console.log(`[API] Found ${matchedPhotos.length} new matched photos`);
    
    return {
      success: true,
      newMatchCount: matchedPhotos.length,
      matchedPhotoIds: matchedPhotos
    };
  } catch (error) {
    console.error('[API] Error refreshing user matches:', error);
    return {
      success: false,
      error: error.message || 'Failed to refresh matches'
    };
  }
}

/**
 * Get face matching analytics data
 * @param {object} filters - Filters for analytics data
 * @returns {Promise<object>} Analytics data
 */
export async function getFaceMatchAnalytics(filters = {}) {
  try {
    console.log('[API] Getting face match analytics');
    console.log('[API] Filters:', filters);
    
    // Build analytics query
    let query = supabase
      .from('face_match_analytics')
      .select(`
        id,
        photo_id,
        user_id,
        face_id,
        similarity,
        confidence,
        created_at,
        users (
          id,
          full_name,
          email
        )
      `);
      
    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.photoId) {
      query = query.eq('photo_id', filters.photoId);
    }
    
    if (filters.minConfidence) {
      query = query.gte('confidence', filters.minConfidence);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    // Add limit
    const limit = filters.limit || 100;
    query = query.limit(limit);
    
    console.log('[API] Executing analytics query');
    const { data, error } = await query;
    
    if (error) {
      console.error('[API] Error fetching analytics data:', error);
      return {
        success: false,
        error: 'Failed to fetch analytics data'
      };
    }
    
    console.log(`[API] Fetched ${data.length} analytics records`);
    
    return {
      success: true,
      analytics: data
    };
  } catch (error) {
    console.error('[API] Error getting analytics data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch analytics data'
    };
  }
}

export default {
  signUpUser,
  registerFace,
  uploadPhotoWithMatching,
  getUserDashboard,
  refreshUserMatches,
  getFaceMatchAnalytics
}; 