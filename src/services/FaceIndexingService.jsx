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

/**
 * Index a user's face in the AWS Rekognition collection
 * @param {string} imageData - Base64 encoded image data
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result with success status
 */
export const indexUserFace = async (imageData, userId) => {
  try {
    console.log('[FaceIndexing] Indexing face for user:', userId);
    
    // Extract base64 data if needed
    let imageBytes;
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      imageBytes = Buffer.from(base64Data, 'base64');
    } else if (imageData instanceof Uint8Array) {
      imageBytes = imageData;
    } else {
      imageBytes = Buffer.from(imageData);
    }
    
    // Index face with AWS Rekognition
                    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
                        Image: { Bytes: imageBytes },
      ExternalImageId: userId,
                        DetectionAttributes: ['ALL'],
                        MaxFaces: 1,
                        QualityFilter: 'AUTO'
                    });
                    
                    const response = await rekognitionClient.send(command);
                    
                    if (!response.FaceRecords || response.FaceRecords.length === 0) {
                    return {
                        success: false,
        error: 'No face detected in the image' 
      };
    }
    
    const faceId = response.FaceRecords[0].Face.FaceId;
    
    // Store face ID for future reference
    await storeFaceId(userId, faceId);
    
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
      faceId: faceId 
    };
  } catch (error) {
    console.error('[FaceIndexing] Error indexing face:', error);
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
    
    // Extract base64 data if needed
    let imageBytes;
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      imageBytes = Buffer.from(base64Data, 'base64');
    } else if (imageData instanceof Uint8Array) {
      imageBytes = imageData;
                        } else {
      imageBytes = Buffer.from(imageData);
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