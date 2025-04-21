/* =========================================================
 * Face Matching Service - AWS Rekognition Implementation
 * =========================================================
 * 
 * This service implements face matching using AWS Rekognition.
 * It follows the approach of:
 * 1. Index each user's face ONCE during registration using IndexFaces API
 * 2. For subsequent uploads, use SearchFacesByImage API (never reindex)
 * 3. Store all match results, similarity scores, and face IDs in the database
 *
 * Extensive logging is included for debugging purposes.
 * =========================================================
 */

import { rekognitionClient, COLLECTION_ID } from '../../config/aws-config';
import { 
  IndexFacesCommand, 
  SearchFacesByImageCommand,
  SearchFacesCommand,
  DetectFacesCommand
} from '@aws-sdk/client-rekognition';
import { supabase } from '../../lib/supabaseClient';

// Constants
const FACE_MATCH_THRESHOLD = 80; // Minimum confidence for face matches (0-100)
const MAX_RETRIES = 3;           // Number of retries for AWS API calls
const RETRY_DELAY = 1000;        // Delay between retries in milliseconds

/**
 * The FaceMatchingService handles all face recognition operations including:
 * - Face registration (indexing) for new users
 * - Face matching for uploaded photos
 * - Finding matches for newly registered users in existing photos
 */
export class FaceMatchingService {
  /**
   * Register a user's face in AWS Rekognition (index once only)
   * This should only be called during user registration
   * 
   * @param {Uint8Array} imageBytes - The image data containing the user's face
   * @param {string} userId - The user's unique ID
   * @returns {Promise<object>} Result with success flag and face ID
   */
  static async registerUserFace(imageBytes, userId) {
    try {
      console.log('[FACE-REG] Starting face registration for user:', userId);
      
      // 1. First detect faces to ensure we have a valid face
      console.log('[FACE-REG] Detecting faces in image...');
      const detectedFaces = await this.detectFaces(imageBytes);
      
      if (!detectedFaces || detectedFaces.length === 0) {
        console.error('[FACE-REG] No faces detected in image');
        return {
          success: false,
          error: 'No faces detected in image'
        };
      }
      
      if (detectedFaces.length > 1) {
        console.error('[FACE-REG] Multiple faces detected in image');
        return {
          success: false,
          error: 'Only one face can be registered at a time'
        };
      }
      
      // 2. Check if user already has a registered face
      console.log('[FACE-REG] Checking if user already has a registered face');
      const { data: existingFace, error: faceCheckError } = await supabase
        .from('face_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (faceCheckError) {
        console.error('[FACE-REG] Error checking existing face data:', faceCheckError);
      } else if (existingFace) {
        console.log('[FACE-REG] User already has a registered face:', existingFace.face_id);
        return {
          success: true,
          faceId: existingFace.face_id,
          message: 'User already has a registered face'
        };
      }
      
      // 3. Index the face in AWS Rekognition - THIS HAPPENS ONCE PER USER
      console.log('[FACE-REG] Indexing face in AWS Rekognition...');
      const command = new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: userId,
        DetectionAttributes: ['ALL'],
        MaxFaces: 1,
        QualityFilter: 'AUTO'
      });
      
      const response = await this.executeWithRetry(() => rekognitionClient.send(command));
      console.log('[FACE-REG] AWS IndexFaces response:', JSON.stringify(response, null, 2));
      
      if (!response.FaceRecords || response.FaceRecords.length === 0) {
        console.error('[FACE-REG] No faces indexed');
        return {
          success: false,
          error: 'Failed to index face'
        };
      }
      
      const faceRecord = response.FaceRecords[0];
      const faceId = faceRecord.Face?.FaceId;
      
      console.log('[FACE-REG] Face indexed successfully with ID:', faceId);
      
      // 4. Store the face data in the database
      console.log('[FACE-REG] Storing face data in database');
      const { data: insertData, error: insertError } = await supabase
        .from('face_data')
        .insert({
          user_id: userId,
          face_id: faceId,
          aws_data: faceRecord,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('[FACE-REG] Error storing face data:', insertError);
        // Continue despite database error since AWS has the face
      } else {
        console.log('[FACE-REG] Face data stored successfully in database');
      }
      
      // 5. Search for matches in existing photos
      console.log('[FACE-REG] Searching for matches in existing photos');
      const matchedPhotos = await this.searchFacesByFaceId(faceId, userId);
      
      console.log(`[FACE-REG] Found ${matchedPhotos.length} matched photos for new user`);
      
      return {
        success: true,
        faceId,
        matchCount: matchedPhotos.length
      };
    } catch (error) {
      console.error('[FACE-REG] Error during face registration:', error);
      return {
        success: false,
        error: error.message || 'Face registration failed'
      };
    }
  }
  
  /**
   * Match faces in a photo against the AWS Rekognition collection
   * Uses SearchFacesByImage API to find matches
   * 
   * @param {string} photoId - The ID of the uploaded photo
   * @param {Uint8Array} imageBytes - The image data to search
   * @returns {Promise<Array>} Array of matched users
   */
  static async matchFaces(photoId, imageBytes) {
    try {
      console.log('[FACE-MATCH] Starting face matching for photo:', photoId);
      
      // 1. Detect faces in the image
      console.log('[FACE-MATCH] Detecting faces in image...');
      const detectedFaces = await this.detectFaces(imageBytes);
      
      if (!detectedFaces || detectedFaces.length === 0) {
        console.log('[FACE-MATCH] No faces detected in image');
        return [];
      }
      
      console.log(`[FACE-MATCH] Detected ${detectedFaces.length} faces in image`);
      
      // 2. Store detected faces information
      const faces = detectedFaces.map(face => ({
        boundingBox: face.BoundingBox,
        confidence: face.Confidence,
        landmarks: face.Landmarks,
        pose: face.Pose,
        quality: face.Quality,
        emotions: face.Emotions
      }));
      
      // 3. Search for matches in AWS Rekognition collection
      console.log('[FACE-MATCH] Searching for matches in AWS Rekognition collection');
      const command = new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
        MaxFaces: 10
      });
      
      const searchResponse = await this.executeWithRetry(() => rekognitionClient.send(command));
      console.log('[FACE-MATCH] AWS SearchFacesByImage response:', JSON.stringify(searchResponse, null, 2));
      
      if (!searchResponse.FaceMatches || searchResponse.FaceMatches.length === 0) {
        console.log('[FACE-MATCH] No matches found');
        
        // Still update the photos table with face information
        await this.updatePhotoWithFaces(photoId, faces, [], []);
        
        return [];
      }
      
      // 4. Process matches
      console.log(`[FACE-MATCH] Processing ${searchResponse.FaceMatches.length} matches`);
      
      const faceIds = searchResponse.FaceMatches.map(match => match.Face.FaceId);
      
      // 5. Get matched users data
      const matchedUsersData = await this.getMatchedUsersData(searchResponse.FaceMatches);
      
      // 6. Update the photos table with faces and matches
      await this.updatePhotoWithFaces(photoId, faces, matchedUsersData, searchResponse.FaceMatches, faceIds);
      
      // 7. Update user_matches table for dashboard
      await this.updateUserMatches(photoId, matchedUsersData);
      
      // 8. Store analytics data
      await this.storeMatchAnalytics(photoId, searchResponse.FaceMatches);
      
      return matchedUsersData;
    } catch (error) {
      console.error('[FACE-MATCH] Error during face matching:', error);
      return [];
    }
  }
  
  /**
   * Search for existing photos that match a user's face ID
   * This is used after registering a new user to find their face in existing photos
   * 
   * @param {string} faceId - The face ID from AWS Rekognition
   * @param {string} userId - The user's unique ID
   * @returns {Promise<Array>} Array of matched photo IDs
   */
  static async searchFacesByFaceId(faceId, userId) {
    try {
      console.log(`[FACE-SEARCH] Searching for photos matching face ID: ${faceId}`);
      
      // 1. Use SearchFaces API (more efficient than SearchFacesByImage)
      const command = new SearchFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceId: faceId,
        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
        MaxFaces: 150 // Set high to get all possible matches
      });
      
      const response = await this.executeWithRetry(() => rekognitionClient.send(command));
      console.log('[FACE-SEARCH] AWS SearchFaces response:', JSON.stringify(response, null, 2));
      
      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        console.log('[FACE-SEARCH] No matching faces found');
        return [];
      }
      
      console.log(`[FACE-SEARCH] Found ${response.FaceMatches.length} matching faces in AWS collection`);
      
      // 2. Get the matched face IDs
      const matchedFaceIds = response.FaceMatches
        .map(match => match.Face?.FaceId)
        .filter(id => id);
        
      console.log('[FACE-SEARCH] Matched face IDs:', matchedFaceIds);
      
      // 3. Find photos with these face IDs
      const { data: photos, error } = await supabase
        .from('photos')
        .select('id, face_ids, matched_users')
        .contains('face_ids', [matchedFaceIds[0]]);
        
      if (error) {
        console.error('[FACE-SEARCH] Error fetching photos:', error);
        return [];
      }
      
      if (!photos || photos.length === 0) {
        console.log('[FACE-SEARCH] No photos found with matching face IDs');
        return [];
      }
      
      console.log(`[FACE-SEARCH] Found ${photos.length} photos with matching face IDs`);
      
      // 4. Get user data for enhancing matches
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('[FACE-SEARCH] Error fetching user data:', userError);
        return [];
      }
      
      // 5. Update each photo's matched_users array
      const updatedPhotoIds = [];
      for (const photo of photos) {
        // Skip if user is already in matched_users
        const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
        if (existingMatches.some(match => match.userId === userId)) {
          console.log(`[FACE-SEARCH] User ${userId} already matched with photo ${photo.id}`);
          continue;
        }
        
        // Find the match confidence from AWS results
        const matchInfo = response.FaceMatches.find(match => 
          photo.face_ids.includes(match.Face.FaceId)
        );
        
        const confidence = matchInfo ? matchInfo.Similarity : FACE_MATCH_THRESHOLD;
        
        // Create the new match
        const newMatch = {
          userId,
          faceId,
          fullName: userData.full_name || 'Unknown User',
          avatarUrl: userData.avatar_url || null,
          confidence,
          similarity: confidence
        };
        
        // Update the photo
        const updatedMatches = [...existingMatches, newMatch];
        console.log(`[FACE-SEARCH] Updating photo ${photo.id} with matched user ${userId}`);
        
        const { error: updateError } = await supabase
          .from('photos')
          .update({ 
            matched_users: updatedMatches,
            updated_at: new Date().toISOString()
          })
          .eq('id', photo.id);
          
        if (updateError) {
          console.error(`[FACE-SEARCH] Error updating photo ${photo.id}:`, updateError);
        } else {
          updatedPhotoIds.push(photo.id);
          console.log(`[FACE-SEARCH] Successfully updated photo ${photo.id}`);
          
          // 6. Add to user_matches table for dashboard
          await this.addUserMatch(userId, photo.id, confidence);
          
          // 7. Add to analytics
          await this.addMatchAnalytics(photo.id, userId, faceId, confidence);
        }
      }
      
      return updatedPhotoIds;
    } catch (error) {
      console.error('[FACE-SEARCH] Error searching by face ID:', error);
      return [];
    }
  }
  
  /**
   * Update a user's dashboard with new matches
   * 
   * @param {string} userId - The user's unique ID
   * @returns {Promise<Array>} Array of updated match entries
   */
  static async updateUserMatches(userId) {
    try {
      console.log(`[DASHBOARD] Updating matches for user ${userId}`);
      
      // 1. Get the user's face ID
      const { data: faceData, error: faceError } = await supabase
        .from('face_data')
        .select('face_id')
        .eq('user_id', userId)
        .single();
        
      if (faceError) {
        console.error('[DASHBOARD] Error fetching face data:', faceError);
        return [];
      }
      
      if (!faceData || !faceData.face_id) {
        console.log('[DASHBOARD] No face ID found for user');
        return [];
      }
      
      // 2. Search for matches with this face ID
      return await this.searchFacesByFaceId(faceData.face_id, userId);
    } catch (error) {
      console.error('[DASHBOARD] Error updating user matches:', error);
      return [];
    }
  }
  
  /**
   * Detect faces in an image
   * 
   * @param {Uint8Array} imageBytes - The image data
   * @returns {Promise<Array>} Array of detected faces
   */
  static async detectFaces(imageBytes) {
    try {
      console.log('[FACE-DETECT] Detecting faces in image');
      
      const command = new DetectFacesCommand({
        Image: { Bytes: imageBytes },
        Attributes: ['ALL']
      });
      
      const response = await this.executeWithRetry(() => rekognitionClient.send(command));
      
      console.log(`[FACE-DETECT] Detected ${response.FaceDetails?.length || 0} faces`);
      
      return response.FaceDetails || [];
    } catch (error) {
      console.error('[FACE-DETECT] Error detecting faces:', error);
      return [];
    }
  }
  
  /**
   * Execute an AWS API call with retry logic
   * 
   * @param {Function} apiCall - The AWS API call function
   * @returns {Promise<any>} The API response
   */
  static async executeWithRetry(apiCall) {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        return await apiCall();
      } catch (error) {
        console.error(`[AWS-RETRY] Error on attempt ${retries + 1}/${MAX_RETRIES}:`, error);
        
        retries++;
        
        if (retries >= MAX_RETRIES) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  /**
   * Get user data for matched faces
   * 
   * @param {Array} faceMatches - Array of face matches from AWS
   * @returns {Promise<Array>} Enhanced matches with user data
   */
  static async getMatchedUsersData(faceMatches) {
    try {
      console.log('[USER-DATA] Getting user data for matches');
      
      // Extract user IDs from matches (stored in ExternalImageId)
      const userIds = faceMatches.map(match => match.Face.ExternalImageId);
      
      console.log('[USER-DATA] User IDs to fetch:', userIds);
      
      // Get user data from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
        
      if (error) {
        console.error('[USER-DATA] Error fetching user data:', error);
        return [];
      }
      
      console.log(`[USER-DATA] Fetched data for ${userData.length} users`);
      
      // Map AWS matches to enhanced matches with user data
      return faceMatches.map(match => {
        const userId = match.Face.ExternalImageId;
        const user = userData.find(u => u.id === userId);
        
        return {
          userId,
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          fullName: user?.full_name || 'Unknown User',
          avatarUrl: user?.avatar_url || null
        };
      });
    } catch (error) {
      console.error('[USER-DATA] Error getting matched users data:', error);
      return [];
    }
  }
  
  /**
   * Update photo record with faces and matches
   * 
   * @param {string} photoId - The photo ID
   * @param {Array} faces - Detected faces
   * @param {Array} matchedUsers - Matched users
   * @param {Array} rawMatches - Raw AWS match responses
   * @param {Array} faceIds - Face IDs from matches
   */
  static async updatePhotoWithFaces(photoId, faces, matchedUsers, rawMatches, faceIds = []) {
    try {
      console.log(`[DB-UPDATE] Updating photo ${photoId} with faces and matches`);
      
      const { error } = await supabase
        .from('photos')
        .update({
          faces,
          matched_users: matchedUsers,
          face_matches: rawMatches,
          face_ids: faceIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', photoId);
        
      if (error) {
        console.error('[DB-UPDATE] Error updating photo:', error);
      } else {
        console.log('[DB-UPDATE] Photo updated successfully');
      }
    } catch (error) {
      console.error('[DB-UPDATE] Exception during photo update:', error);
    }
  }
  
  /**
   * Update user_matches table for dashboard
   * 
   * @param {string} photoId - The photo ID
   * @param {Array} matchedUsers - Matched users
   */
  static async updateUserMatches(photoId, matchedUsers) {
    try {
      console.log(`[USER-MATCHES] Updating user_matches for photo ${photoId}`);
      
      for (const match of matchedUsers) {
        await this.addUserMatch(match.userId, photoId, match.similarity || match.confidence);
      }
    } catch (error) {
      console.error('[USER-MATCHES] Error updating user matches:', error);
    }
  }
  
  /**
   * Add a user match entry
   * 
   * @param {string} userId - The user ID
   * @param {string} photoId - The photo ID
   * @param {number} similarity - The match similarity score
   */
  static async addUserMatch(userId, photoId, similarity) {
    try {
      console.log(`[USER-MATCH] Adding match: User ${userId} to Photo ${photoId}`);
      
      // Use upsert to avoid duplicates
      const { error } = await supabase
        .from('user_matches')
        .upsert({
          user_id: userId,
          photo_id: photoId,
          similarity,
          confidence: similarity,
          matched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,photo_id',
          ignoreDuplicates: false
        });
        
      if (error) {
        console.error('[USER-MATCH] Error adding user match:', error);
      } else {
        console.log('[USER-MATCH] User match added successfully');
      }
    } catch (error) {
      console.error('[USER-MATCH] Exception adding user match:', error);
    }
  }
  
  /**
   * Store match analytics data
   * 
   * @param {string} photoId - The photo ID
   * @param {Array} faceMatches - Raw AWS face matches
   */
  static async storeMatchAnalytics(photoId, faceMatches) {
    try {
      console.log(`[ANALYTICS] Storing analytics for photo ${photoId}`);
      
      const analyticsRecords = faceMatches.map(match => ({
        photo_id: photoId,
        user_id: match.Face.ExternalImageId,
        face_id: match.Face.FaceId,
        similarity: match.Similarity,
        confidence: match.Face.Confidence,
        raw_data: match,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('face_match_analytics')
        .insert(analyticsRecords);
        
      if (error) {
        console.error('[ANALYTICS] Error storing analytics:', error);
      } else {
        console.log(`[ANALYTICS] Successfully stored ${analyticsRecords.length} analytics records`);
      }
    } catch (error) {
      console.error('[ANALYTICS] Exception storing analytics:', error);
    }
  }
  
  /**
   * Add a match analytics entry
   * 
   * @param {string} photoId - The photo ID
   * @param {string} userId - The user ID
   * @param {string} faceId - The face ID
   * @param {number} similarity - The match similarity score
   */
  static async addMatchAnalytics(photoId, userId, faceId, similarity) {
    try {
      console.log(`[ANALYTICS] Adding analytics: User ${userId}, Photo ${photoId}`);
      
      const { error } = await supabase
        .from('face_match_analytics')
        .insert({
          photo_id: photoId,
          user_id: userId,
          face_id: faceId,
          similarity,
          confidence: similarity,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('[ANALYTICS] Error adding analytics:', error);
      } else {
        console.log('[ANALYTICS] Analytics added successfully');
      }
    } catch (error) {
      console.error('[ANALYTICS] Exception adding analytics:', error);
    }
  }
}

export default FaceMatchingService; 