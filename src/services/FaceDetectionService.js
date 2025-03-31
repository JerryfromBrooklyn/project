import { supabase } from '../lib/supabase';

/**
 * Service for handling face detection with proper error handling
 */
class FaceDetectionService {
  /**
   * Detect faces in an image using AWS Rekognition via Supabase Edge Function
   * @param {string|Blob} imageSource - Either a base64 string, Blob, or storage path
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Face detection results with safe fallbacks
   */
  static async detectFaces(imageSource, options = {}) {
    try {
      console.log('[FACE-DETECT] Starting face detection');
      
      // Prepare the payload based on the type of imageSource
      const payload = {};
      
      if (typeof imageSource === 'string') {
        // Check if it's a base64 string or a storage path
        if (imageSource.startsWith('data:image')) {
          payload.imageData = imageSource;
        } else {
          payload.storagePath = imageSource;
        }
      } else if (imageSource instanceof Blob) {
        // Convert Blob to base64
        payload.imageData = await this.blobToBase64(imageSource);
      } else {
        throw new Error('Invalid image source. Must be base64 string, storage path, or Blob');
      }
      
      // Add any additional options
      Object.assign(payload, options);
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('detect-faces', {
        body: payload
      });
      
      if (error) {
        console.error('[FACE-DETECT] Error calling face detection edge function:', error);
        return this.getSafeResponse('Error calling face detection service', error);
      }
      
      if (!data) {
        console.warn('[FACE-DETECT] No data returned from face detection function');
        return this.getSafeResponse('No data returned from face detection service');
      }
      
      console.log(`[FACE-DETECT] Detection completed successfully. Found ${data.faceCount} faces.`);
      return data;
    } catch (error) {
      console.error('[FACE-DETECT] Unexpected error in face detection:', error);
      return this.getSafeResponse('Unexpected error in face detection', error);
    }
  }
  
  /**
   * Create a safe default response for face detection
   * @param {string} message - Error message
   * @param {Error} error - Original error object (optional)
   * @returns {Object} - Safe response object
   */
  static getSafeResponse(message = 'Face detection failed', error = null) {
    return {
      success: false,
      message: message,
      faceCount: 0,
      faces: [],
      error: error ? error.toString() : undefined
    };
  }
  
  /**
   * Convert a Blob to base64 string
   * @param {Blob} blob - Image blob
   * @returns {Promise<string>} - Base64 string
   */
  static async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Extract face details from the response safely
   * @param {Object} response - Response from face detection
   * @returns {Array} - Array of face details or empty array if none
   */
  static extractFaces(response) {
    if (!response || !response.success || !response.faces) {
      console.warn('[FACE-DETECT] No valid faces to extract');
      return [];
    }
    
    return response.faces.map(face => ({
      boundingBox: face.BoundingBox || {},
      confidence: face.Confidence || 0,
      landmarks: face.Landmarks || [],
      pose: face.Pose || {},
      quality: face.Quality || {},
      emotions: (face.Emotions || []).map(e => ({
        type: e.Type || 'unknown',
        confidence: e.Confidence || 0
      }))
    }));
  }
  
  /**
   * Process face matching results to ensure they're properly stored
   * @param {Array} faces - Face detection results from AWS
   * @param {string} userId - Current user ID 
   * @returns {Array} - Enhanced face data with match info
   */
  static enhanceFaceMatchingData(faces, userId) {
    if (!faces || !Array.isArray(faces)) return [];
    
    return faces.map(face => {
      // Generate a consistent face ID if not present
      if (!face.faceId) {
        // Use existing ID or generate new one
        face.faceId = face.face_id || 
                     `face-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      
      // Ensure matches array exists
      if (!face.matches) {
        face.matches = [];
      }
      
      // If this face has high confidence, add the current user as a match
      if (face.confidence > 90) {
        // Only add if not already there
        const userAlreadyMatched = face.matches.some(match => 
          match.userId === userId || match.user_id === userId
        );
        
        if (!userAlreadyMatched) {
          face.matches.push({
            userId: userId,
            user_id: userId, // Add both formats for compatibility
            confidence: face.confidence,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return face;
    });
  }
  
  /**
   * Safely get face detection results with fallback
   * @param {string|Blob} imageSource - Either a base64 string, Blob, or storage path
   * @returns {Promise<Array>} - Array of face details or empty array
   */
  static async getFaces(imageSource) {
    try {
      const response = await this.detectFaces(imageSource);
      const faces = this.extractFaces(response);
      
      // Get the current user ID
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      
      // Enhance with matching data before returning
      if (userId) {
        return this.enhanceFaceMatchingData(faces, userId);
      }
      
      return faces;
    } catch (error) {
      console.error('[FACE-DETECT] Error in getFaces:', error);
      return [];
    }
  }
}

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.FaceDetectionService = FaceDetectionService;
}

export default FaceDetectionService; 