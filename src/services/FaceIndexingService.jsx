/* =========================================================
 * Face Indexing Service - AWS Implementation
 * =========================================================
 */

import { rekognitionClient, COLLECTION_ID } from '../lib/awsClient';
import { 
  IndexFacesCommand, 
  SearchFacesByImageCommand, 
  SearchFacesCommand, 
  DetectFacesCommand, 
  ListCollectionsCommand, 
  DeleteCollectionCommand, 
  CreateCollectionCommand, 
  DescribeCollectionCommand, 
  ListFacesCommand 
} from '@aws-sdk/client-rekognition';
import { FACE_MATCH_THRESHOLD } from '../lib/awsClient';
import { storeFaceData, storeFaceMatch } from './database-utils';
import { storeFaceId } from './FaceStorageService';
import { normalizeToS3Url } from '../utils/s3Utils';

// Add environment detection for browser-safe code
const isBrowser = typeof window !== 'undefined';
const hasBuffer = typeof Buffer !== 'undefined';

// Log the environment
console.log(`🔧 [FaceIndexing] Environment detection: Browser=${isBrowser}, HasBuffer=${hasBuffer}`);

// Browser-safe function to copy binary data
const copyBinaryData = (data) => {
  if (hasBuffer && Buffer.isBuffer(data)) {
    return Buffer.from(data);
  } else if (data instanceof Uint8Array) {
    return new Uint8Array(data);
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(new Uint8Array(data));
  } else if (typeof data === 'string') {
    if (data.startsWith('data:image')) {
      const base64Data = data.split(',')[1];
      if (hasBuffer) {
        return Buffer.from(base64Data, 'base64');
      } else {
        // Browser-compatible base64 decode
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
    } else {
      // Regular string
      if (hasBuffer) {
        return Buffer.from(data);
      } else {
        const encoder = new TextEncoder();
        return encoder.encode(data);
      }
    }
  } else {
    console.warn('Unsupported data type for binary copy, using as-is');
    return data;
  }
};

// Browser-safe function to convert to binary format
const toBinary = (data) => {
  try {
    if (typeof data === 'string' && data.startsWith('data:image')) {
      console.log('🔄 [FaceIndexing] Converting base64 string to binary');
      const base64Data = data.split(',')[1];
      if (hasBuffer) {
        return Buffer.from(base64Data, 'base64');
      } else {
        // Browser-compatible base64 decode
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
    } else if (data instanceof Blob) {
      console.log('🔄 [FaceIndexing] Converting Blob to binary');
      return data.arrayBuffer().then(buffer => {
        if (hasBuffer) {
          return Buffer.from(buffer);
        } else {
          return new Uint8Array(buffer);
        }
      });
    } else if (data instanceof ArrayBuffer) {
      console.log('🔄 [FaceIndexing] Converting ArrayBuffer to binary');
      if (hasBuffer) {
        return Buffer.from(data);
      } else {
        return new Uint8Array(data);
      }
    } else if (data instanceof Uint8Array) {
      console.log('🔄 [FaceIndexing] Using Uint8Array directly');
      return data;
    } else {
      console.log('🔄 [FaceIndexing] Converting to binary using generic approach');
      if (hasBuffer) {
        return Buffer.from(data);
      } else {
        // Try to handle unknown types gracefully
        if (typeof data.buffer !== 'undefined') {
          return new Uint8Array(data.buffer);
        } else {
          console.warn('Unknown binary data type, converting to string and then to binary');
          const encoder = new TextEncoder();
          return encoder.encode(String(data));
        }
      }
    }
  } catch (error) {
    console.error('❌ [FaceIndexing] Error converting to binary:', error);
    throw error;
  }
};

/**
 * Index a user's face in AWS Rekognition collection directly
 * @param {string|Blob|ArrayBuffer} imageData - The image data containing a face
 * @param {string} userId - The user ID to associate with the face
 * @returns {Promise<Object>} Result object with success status
 */
export const indexUserFace = async (imageData, userId) => {
  try {
    console.log('🔍 [FaceIndexing] Indexing face for user:', userId);
    
    // Convert to binary format
    let imageBytes;
    
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      // Base64 data
      const base64Data = imageData.split(',')[1];
      const binaryString = atob(base64Data);
      imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }
    } else if (imageData instanceof Blob) {
      // Blob data
      const arrayBuffer = await imageData.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
    } else if (imageData instanceof ArrayBuffer) {
      // ArrayBuffer data
      imageBytes = new Uint8Array(imageData);
    } else if (imageData instanceof Uint8Array) {
      // Already Uint8Array
      imageBytes = imageData;
    } else {
      throw new Error('Unsupported image data format');
    }
    
    // Call AWS Rekognition to index the face
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBytes
      },
      ExternalImageId: userId,
      MaxFaces: 1,
      DetectionAttributes: ['ALL']
    });
    
    const response = await rekognitionClient.send(command);
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      console.error('[FaceIndexing] No face detected in the image');
      return {
        success: false,
        error: 'No face detected in the image'
      };
    }
    
    const faceId = response.FaceRecords[0].Face.FaceId;
    const faceAttributes = response.FaceRecords[0].FaceDetail;
    
    console.log('[FaceIndexing] Face indexed with ID:', faceId);
    
    // Store the face data in your database/storage
    const imageBytesCopy = copyBinaryData(imageBytes);
    const storageResult = await storeFaceId(userId, faceId, faceAttributes, imageBytesCopy);
    
    // Return the results
    return {
      success: true,
      faceId: faceId,
      faceAttributes: faceAttributes,
      imageUrl: storageResult.imageUrl || null
    };
  } catch (error) {
    console.error('[FaceIndexing] Error indexing face:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Indexes a user's face with AWS Rekognition - Simplified wrapper for components
 * @param {string} userId - User ID
 * @param {Blob|string} imageData - Image data (Blob or base64 string)
 * @returns {Promise<Object>} Result with success status, faceId, and faceAttributes
 */
export const indexFace = async (userId, imageData) => {
    console.log('[FaceIndexingService] Indexing face for user:', userId);
    
    try {
        // Call the direct implementation
        const result = await indexUserFace(imageData, userId);
        
        if (!result.success) {
            console.error('[FaceIndexingService] Face indexing failed:', result.error);
            return {
                success: false,
                error: result.error || 'Failed to index face',
                faceId: null,
                faceAttributes: null
            };
        }
        
        console.log('[FaceIndexingService] Face indexed successfully:', result.faceId);
        
        // Return all the relevant data
        return {
            success: true,
            faceId: result.faceId,
            faceAttributes: result.faceAttributes || {},
            imageUrl: result.imageUrl
        };
    } catch (error) {
        console.error('[FaceIndexingService] Error in indexFace:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred',
            faceId: null,
            faceAttributes: null
        };
    }
};

/**
 * Match a face against existing faces in the collection
 * @param {string} userId - User ID
 * @param {string} faceId - Face ID
 * @returns {Promise<object>} Result with matches
 */
const matchAgainstExistingFaces = async (userId, faceId) => {
  try {
    console.log('[FaceIndexing] Matching face against existing faces');
    
    // Search for similar faces
    const command = new SearchFacesCommand({
      CollectionId: COLLECTION_ID,
      FaceId: faceId,
      MaxFaces: 10,
      FaceMatchThreshold: FACE_MATCH_THRESHOLD
    });
    
    const response = await rekognitionClient.send(command);
    
    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      console.log('[FaceIndexing] No matches found');
      return { 
        success: true, 
        matches: [] 
      };
    }
    
    // Process and store matches
    const matches = [];
    for (const match of response.FaceMatches) {
      if (match.Face.ExternalImageId === userId) {
        // Skip self-matches
        continue;
      }
      
      const matchData = {
        user_id: userId,
        target_user_id: match.Face.ExternalImageId,
        face_id: faceId,
        target_face_id: match.Face.FaceId,
        similarity: match.Similarity,
        matched_at: new Date().toISOString()
      };
      
      // Store match in database
      await storeFaceMatch(matchData);
      
      matches.push(matchData);
    }
    
    console.log(`[FaceIndexing] Found ${matches.length} matches`);
    return { 
      success: true, 
      matches 
    };
  } catch (error) {
    console.error('[FaceIndexing] Error matching face:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Search for a face in the collection
 * @param {string} imageData - Base64 encoded image data
 * @param {string} userId - User ID to exclude from results (optional)
 * @returns {Promise<object>} Result with matches
 */
export const searchFaceByImage = async (imageData, userId = null) => {
  try {
    console.log('[FaceIndexing] Searching for face in collection');
    
    // Extract base64 data if needed (browser-safe implementation)
    let imageBytes;
    
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      if (hasBuffer) {
        imageBytes = Buffer.from(base64Data, 'base64');
      } else {
        const binaryString = atob(base64Data);
        imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          imageBytes[i] = binaryString.charCodeAt(i);
        }
      }
    } else if (imageData instanceof Blob) {
      const arrayBuffer = await imageData.arrayBuffer();
      imageBytes = hasBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
    } else if (imageData instanceof Uint8Array) {
      imageBytes = imageData;
    } else if (imageData instanceof ArrayBuffer) {
      imageBytes = hasBuffer ? Buffer.from(imageData) : new Uint8Array(imageData);
    } else {
      if (hasBuffer) {
        try {
          imageBytes = Buffer.from(imageData);
        } catch (e) {
          console.warn('Buffer conversion failed, using Uint8Array fallback');
          imageBytes = new Uint8Array(imageData.buffer || imageData);
        }
      } else {
        imageBytes = new Uint8Array(imageData.buffer || imageData);
      }
    }
    
    // Search by image
    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      MaxFaces: 10,
      FaceMatchThreshold: FACE_MATCH_THRESHOLD
    });
    
    const response = await rekognitionClient.send(command);
    
    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      console.log('[FaceIndexing] No matches found');
      return {
        success: true, 
        matches: [] 
      };
    }
    
    // Filter and process matches
    const matches = response.FaceMatches
      .filter(match => !userId || match.Face.ExternalImageId !== userId)
      .map(match => ({
        user_id: match.Face.ExternalImageId,
        face_id: match.Face.FaceId,
        similarity: match.Similarity,
        bounding_box: match.Face.BoundingBox,
        confidence: match.Face.Confidence
      }));
    
    console.log(`[FaceIndexing] Found ${matches.length} matches`);
    return { 
      success: true, 
      matches 
    };
  } catch (error) {
    console.error('[FaceIndexing] Error searching face:', error);
    return {
      success: false, 
      error: error.message 
    };
  }
};

// Export functions as an object for easier importing
export const FaceIndexingService = {
  indexUserFace,
  searchFaceByImage
};

export default FaceIndexingService; 