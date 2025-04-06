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
 * Index a user's face in the AWS Rekognition collection
 * @param {string} imageData - Base64 encoded image data
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result with success status
 */
export const indexUserFace = async (imageData, userId) => {
  try {
    console.log('🔍 [FaceIndexing] Indexing face for user:', userId);
    console.groupCollapsed('📋 [FaceIndexing] Image data details:');
    console.log('Type:', typeof imageData);
    if (imageData instanceof Blob) {
      console.log('Format: Blob, Size:', imageData.size);
    } else if (imageData instanceof ArrayBuffer) {
      console.log('Format: ArrayBuffer, Size:', imageData.byteLength);
    } else if (imageData instanceof Uint8Array) {
      console.log('Format: Uint8Array, Size:', imageData.length);
    } else if (typeof imageData === 'string') {
      console.log('Format: String, Length:', imageData.length);
      console.log('Prefix:', imageData.substring(0, 30) + '...');
    }
    console.groupEnd();
    
    // Convert to binary format (Uint8Array or Buffer, depending on environment)
    let imageBytes;
    
    // Handle async conversions (like Blob)
    if (imageData instanceof Blob) {
      console.log('🔄 [FaceIndexing] Converting Blob to binary buffer');
      const arrayBuffer = await imageData.arrayBuffer();
      imageBytes = hasBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
    } else if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      console.log('🔄 [FaceIndexing] Converting base64 string to binary buffer');
      const base64Data = imageData.split(',')[1];
      if (hasBuffer) {
        imageBytes = Buffer.from(base64Data, 'base64');
      } else {
        // Browser-compatible base64 decode
        const binaryString = atob(base64Data);
        imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          imageBytes[i] = binaryString.charCodeAt(i);
        }
      }
    } else if (imageData instanceof Uint8Array) {
      console.log('🔄 [FaceIndexing] Using Uint8Array directly');
      imageBytes = imageData;
    } else if (imageData instanceof ArrayBuffer) {
      console.log('🔄 [FaceIndexing] Converting ArrayBuffer to binary');
      imageBytes = hasBuffer ? Buffer.from(imageData) : new Uint8Array(imageData);
    } else {
      console.log('🔄 [FaceIndexing] Converting to binary using generic approach');
      try {
        imageBytes = hasBuffer ? Buffer.from(imageData) : new Uint8Array(imageData.buffer || imageData);
      } catch (e) {
        console.warn('❌ [FaceIndexing] Error during generic conversion, creating empty buffer');
        imageBytes = hasBuffer ? Buffer.alloc(1) : new Uint8Array(1);
      }
    }
    
    console.log('📦 [FaceIndexing] Prepared image buffer of size:', imageBytes.length, 'bytes, type:', imageBytes.constructor.name);
    
    // Index face with AWS Rekognition
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      ExternalImageId: userId,
      DetectionAttributes: ['ALL'],
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    });
    
    console.log('🚀 [FaceIndexing] Sending IndexFaces command to Rekognition');
    const response = await rekognitionClient.send(command);
    console.log('✅ [FaceIndexing] Received response from Rekognition');
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      console.error('❌ [FaceIndexing] No face detected in the image');
      return {
        success: false,
        error: 'No face detected in the image' 
      };
    }
    
    const faceId = response.FaceRecords[0].Face.FaceId;
    console.log('🆔 [FaceIndexing] Face ID retrieved:', faceId);
    
    // Extract face attributes
    const faceAttributes = response.FaceRecords[0].FaceDetail;
    console.groupCollapsed('📊 [FaceIndexing] Extracted face attributes:');
    console.log('Attributes:', Object.keys(faceAttributes));
    console.log('Full data:', faceAttributes);
    console.groupEnd();
    
    // Make a browser-compatible copy of the image bytes for storage
    console.log('📷 [FaceIndexing] Creating copy of image buffer for storage');
    
    // Create a copy in a browser-safe way
    let imageBytesCopy;
    if (imageBytes instanceof Uint8Array) {
      console.log('📷 [FaceIndexing] Creating Uint8Array copy');
      imageBytesCopy = new Uint8Array(imageBytes);
    } else if (hasBuffer && Buffer.isBuffer(imageBytes)) {
      console.log('📷 [FaceIndexing] Creating Buffer copy');
      imageBytesCopy = Buffer.from(imageBytes);
    } else {
      console.log('📷 [FaceIndexing] Creating generic copy');
      imageBytesCopy = copyBinaryData(imageBytes);
    }
    
    console.log('📷 [FaceIndexing] Created copy of image buffer, size:', imageBytesCopy.length, 'bytes, type:', imageBytesCopy.constructor.name);
    
    // Store face ID for future reference with image and attributes
    console.log('💾 [FaceIndexing] Calling storeFaceId with image data of size:', imageBytesCopy.length);
    const storageResult = await storeFaceId(userId, faceId, faceAttributes, imageBytesCopy);
    
    console.log('📝 [FaceIndexing] storeFaceId result:', 
      storageResult.success ? '✅ Success' : '❌ Failed', 
      storageResult.imageUrl ? `(Image URL: ${storageResult.imageUrl})` : '(No image URL)'
    );
    console.log('💾 [FaceIndexing] S3 upload successful:', !!storageResult.success);
    console.log('🖼️ [FaceIndexing] Image URL received:', storageResult.imageUrl || 'None');
    
    // Get the image URL from the storage result and normalize it to S3 format
    let imageUrl = normalizeToS3Url(storageResult.imageUrl);
    console.log('🔄 [FaceIndexing] Normalized S3 URL:', imageUrl || 'None');
    
    // Store face data in DynamoDB
    await storeFaceData(userId, {
      face_id: faceId,
      bounding_box: response.FaceRecords[0].Face.BoundingBox,
      confidence: response.FaceRecords[0].Face.Confidence,
      image_id: response.FaceRecords[0].Face.ImageId,
      face_detail: response.FaceRecords[0].FaceDetail,
      indexed_at: new Date().toISOString()
    });
    
    // Perform historical matching
    await matchAgainstExistingFaces(userId, faceId);
    
    return {
      success: true,
      faceId: faceId,
      imageUrl: imageUrl || null
    };
  } catch (error) {
    console.error('❌ [FaceIndexing] Error indexing face:', error);
    // Log the stack trace for better debugging
    console.error('📚 [FaceIndexing] Stack trace:', error.stack);
    return {
      success: false,
      error: error.message 
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