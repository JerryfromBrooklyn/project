import { supabase } from '../lib/supabaseClient';
import { RekognitionClient, DetectFacesCommand, IndexFacesCommand, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';

// Initialize AWS Rekognition client once
const rekognitionClient = new RekognitionClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
});

const COLLECTION_ID = 'user-faces';

/**
 * Service for handling face detection with proper error handling
 */
class FaceDetectionService {
  /**
   * Detect faces in an image and store the results
   * @param {string|Blob} imageSource - Image source
   * @returns {Promise<Object>} Detection results
   */
  static async detectFaces(imageSource) {
    try {
      console.log('[FACE-DETECT] Starting face detection');
      
      // First check if we have cached results for this image
      if (typeof imageSource === 'string' && !imageSource.startsWith('data:image')) {
        const { data: existingResults } = await supabase
          .from('face_detection_results')
          .select('*')
          .eq('image_path', imageSource)
          .single();
        
        if (existingResults) {
          console.log('[FACE-DETECT] Using cached results');
          return {
            success: true,
            message: 'Using cached face detection results',
            faceCount: existingResults.face_count,
            faces: existingResults.faces
          };
        }
      }

      // Get image bytes
      let imageBytes;
      if (typeof imageSource === 'string') {
        if (imageSource.startsWith('data:image')) {
          console.log('[FACE-DETECT] Processing base64 image');
          const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
          imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
          console.log('[FACE-DETECT] Downloading image from storage:', imageSource);
          const { data, error } = await supabase.storage
            .from('photos')
            .download(imageSource);
          if (error) throw error;
          imageBytes = new Uint8Array(await data.arrayBuffer());
        }
      } else if (imageSource instanceof Blob) {
        console.log('[FACE-DETECT] Processing Blob image');
        imageBytes = new Uint8Array(await imageSource.arrayBuffer());
      } else if (imageSource instanceof Uint8Array) {
        console.log('[FACE-DETECT] Using provided Uint8Array directly');
        imageBytes = imageSource;
      } else {
        console.error('[FACE-DETECT] Invalid image source type:', typeof imageSource);
        throw new Error('Invalid image source');
      }

      // Verify we have valid image bytes
      if (!imageBytes || imageBytes.length === 0) {
        console.error('[FACE-DETECT] Empty image bytes');
        throw new Error('Invalid image data: empty bytes');
      }

      console.log('[FACE-DETECT] Image bytes length:', imageBytes.length);

      // Detect faces
      const command = new DetectFacesCommand({
        Image: { Bytes: imageBytes },
        Attributes: ['ALL']
      });

      const response = await rekognitionClient.send(command);
      
      const result = {
        success: true,
        message: 'Faces detected successfully',
        faceCount: response.FaceDetails?.length || 0,
        faces: response.FaceDetails || []
      };

      // Cache results if this is a stored image
      if (typeof imageSource === 'string' && !imageSource.startsWith('data:image')) {
        await supabase
          .from('face_detection_results')
          .upsert({
            image_path: imageSource,
            face_count: result.faceCount,
            face_ids: [], // Will be populated when faces are indexed
            confidence_scores: result.faces.map(f => f.Confidence),
            last_accessed: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      return result;
    } catch (error) {
      console.error('[FACE-DETECT] Error:', error);
      return {
        success: false,
        message: 'Face detection failed',
        faceCount: 0,
        faces: [],
        error: error.toString()
      };
    }
  }

  /**
   * Index a face in the collection
   * @param {Uint8Array} imageBytes - Image data
   * @returns {Promise<string>} Face ID
   */
  static async indexFace(imageBytes) {
    try {
      const command = new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        DetectionAttributes: ['ALL'],
        MaxFaces: 1,
        QualityFilter: 'HIGH'
      });

      const response = await rekognitionClient.send(command);
      
      if (!response.FaceRecords?.[0]?.Face?.FaceId) {
        throw new Error('No face indexed');
      }

      return response.FaceRecords[0].Face.FaceId;
    } catch (error) {
      console.error('[FACE-INDEX] Error:', error);
      throw error;
    }
  }

  /**
   * Search for matching faces
   * @param {Uint8Array} imageBytes - Image data
   * @returns {Promise<Array>} Matching faces
   */
  static async searchFaces(imageBytes) {
    try {
      const command = new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        MaxFaces: 100,
        FaceMatchThreshold: 90
      });

      const response = await rekognitionClient.send(command);
      return response.FaceMatches || [];
    } catch (error) {
      console.error('[FACE-SEARCH] Error:', error);
      return [];
    }
  }

  /**
   * Extract essential face data for storage
   * @param {Object} face - Face details from AWS
   * @returns {Object} Essential face data
   */
  static extractEssentialFaceData(face) {
    return {
      confidence: face.Confidence,
      boundingBox: face.BoundingBox,
      landmarks: face.Landmarks,
      pose: face.Pose,
      quality: face.Quality
    };
  }

  /**
   * Store detailed face data
   * @param {string} faceId - AWS face ID
   * @param {Object} faceDetails - Full face details
   */
  static async storeFaceDetails(faceId, faceDetails) {
    try {
      await supabase
        .from('face_details')
        .upsert({
          face_id: faceId,
          details: faceDetails,
          last_accessed: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[FACE-DETECT] Error storing face details:', error);
    }
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
    if (!response?.success || !response?.faces) {
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