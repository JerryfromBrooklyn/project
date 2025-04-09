/* =========================================================
 * Face Indexing Service - AWS Implementation
 * =========================================================
 */

import {
  IndexFacesCommand,
  DetectFacesCommand,
  SearchFacesCommand,
  SearchFacesByImageCommand,
  DescribeCollectionCommand,
  ListFacesCommand
} from '@aws-sdk/client-rekognition';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, rekognitionClient, dynamoClient, s3Client, COLLECTION_ID as AWS_COLLECTION_ID } from '../lib/awsClient';
import * as FaceStorageService from './FaceStorageService';
import { storeFaceMatch } from './database-utils';
import { Buffer } from 'buffer';

// Configure Rekognition constants
const COLLECTION_ID = AWS_COLLECTION_ID || 'shmong-faces';
const FACE_MATCH_THRESHOLD = 80.0;

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
    console.log('🔍 [FaceIndexing] Image data type:', typeof imageData);
    
    if (typeof imageData === 'string') {
      console.log('🔍 [FaceIndexing] Image data starts with:', imageData.substring(0, 30) + '...');
    }
    
    // Get AWS clients
    const { rekognitionClient } = await getAWSClients();
    
    // Convert to binary format
    let imageBytes;
    
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      // Base64 data
      const base64Data = imageData.split(',')[1];
      console.log('🔍 [FaceIndexing] Extracted base64 data, first 20 chars:', base64Data.substring(0, 20) + '...');
      
      if (hasBuffer) {
        imageBytes = Buffer.from(base64Data, 'base64');
      } else {
        const binaryString = atob(base64Data);
        imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          imageBytes[i] = binaryString.charCodeAt(i);
        }
      }
      console.log('🔍 [FaceIndexing] Converted base64 data to binary format');
    } else if (imageData instanceof Blob) {
      // Blob data
      const arrayBuffer = await imageData.arrayBuffer();
      imageBytes = hasBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
      console.log('🔍 [FaceIndexing] Converted Blob to binary format');
    } else if (imageData instanceof ArrayBuffer) {
      // ArrayBuffer data
      imageBytes = hasBuffer ? Buffer.from(imageData) : new Uint8Array(imageData);
      console.log('🔍 [FaceIndexing] Converted ArrayBuffer to binary format');
    } else if (imageData instanceof Uint8Array) {
      // Already Uint8Array
      imageBytes = imageData;
      console.log('🔍 [FaceIndexing] Using Uint8Array directly');
    } else {
      console.error('🔍 [FaceIndexing] Unsupported image data format:', typeof imageData);
      throw new Error('Unsupported image data format');
    }
    
    console.log('🔍 [FaceIndexing] Image bytes prepared, calling Rekognition...');
    
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
    const storageResult = await FaceStorageService.storeFaceId(
      userId,   // userId
      faceId,   // faceId
      imageData, // imageData - original image data
      null,     // imagePath - let the service generate a path
      faceAttributes, // faceAttributes 
      []        // historicalMatches - empty for initial registration
    );
    
    // Return the results
    return {
      success: true,
      faceId: faceId,
      faceAttributes: faceAttributes,
      imageUrl: storageResult.imageUrl || null,
      message: 'Face indexed successfully'
    };
  } catch (error) {
    console.error(`❌ [FaceIndexing] Error indexing face:`, error);
    
    return {
      success: false,
      error: error.message || 'Failed to index face'
    };
  }
};

/**
 * Indexes a user's face with AWS Rekognition - Simplified wrapper for components
 * @param {string} userId - User ID
 * @param {Blob|string} imageData - Image data (Blob or base64 string)
 * @returns {Promise<Object>} Result with success status, faceId, and faceAttributes
 */
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log('🔍 [FaceIndexing] Indexing face for user:', userId);
    
    if (!userId) {
      console.error('[FaceIndexing] Missing user ID');
      return { success: false, error: 'Missing user ID' };
    }
    
    if (!imageBlob) {
      console.error('[FaceIndexing] Missing image blob');
      return { success: false, error: 'Missing image data' };
    }
    
    // Step 1: Get AWS clients
    const { rekognitionClient } = await getAWSClients();
    
    // Step 2: Convert image to base64 buffer
    const buffer = await imageToBuffer(imageBlob);
    
    // Step 3: Detect faces first to get attributes
    console.log('[FaceIndexing] Detecting faces to extract attributes...');
    const detectParams = {
      Image: {
        Bytes: buffer
      },
      Attributes: ['ALL']
    };
    
    const detectResponse = await rekognitionClient.send(new DetectFacesCommand(detectParams));
    const faceDetails = detectResponse.FaceDetails;
    
    if (!faceDetails || faceDetails.length === 0) {
      console.error('[FaceIndexing] No faces detected in image');
      return { success: false, error: 'No faces detected in image' };
    }
    
    console.log('[FaceIndexing] Face detected with attributes:', 
      JSON.stringify(faceDetails[0], null, 2));
    const faceAttributes = faceDetails[0];
    
    // Step 4: Index the face in the Collection
    console.log('[FaceIndexing] Indexing face in collection...');
    const indexParams = {
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: buffer
      },
      ExternalImageId: userId,
      DetectionAttributes: ['ALL'],
      MaxFaces: 1,
    };
    
    const indexResponse = await rekognitionClient.send(new IndexFacesCommand(indexParams));
    
    if (!indexResponse.FaceRecords || indexResponse.FaceRecords.length === 0) {
      console.error('[FaceIndexing] Failed to index face:', indexResponse);
      return { success: false, error: 'Failed to index face' };
    }
    
    const faceId = indexResponse.FaceRecords[0].Face.FaceId;
    console.log('[FaceIndexing] Face indexed with ID:', faceId);
    
    // Step 5: Search for this face in existing photos
    console.log('[FaceIndexing] Searching for historical matches...');
    let historicalMatches = [];
    try {
      const searchParams = {
        CollectionId: COLLECTION_ID,
        FaceId: faceId,
        MaxFaces: 10,
        FaceMatchThreshold: 90.0 // Higher threshold for higher confidence
      };
      
      const searchResponse = await rekognitionClient.send(new SearchFacesCommand(searchParams));
      
      if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
        console.log('[FaceIndexing] Found matches in user photos:', searchResponse.FaceMatches.length);
        
        // Fetch details for each match
        historicalMatches = await Promise.all(searchResponse.FaceMatches.map(async (match) => {
          // Get photo details from DynamoDB
          const photoId = match.Face.ExternalImageId;
          const similarityScore = match.Similarity;
          
          console.log(`[FaceIndexing] Match found - Photo ID: ${photoId}, Similarity: ${similarityScore}%`);
          
          try {
            // Fetch photo details from shmong-photos table instead of user_photos
            const { dynamoClient } = await getAWSClients();
            const params = {
              TableName: 'shmong-photos',
              Key: {
                id: { S: photoId }
              }
            };
            
            const photoData = await dynamoClient.send(new GetItemCommand(params));
            
            if (photoData && photoData.Item) {
              const photoDetails = photoData.Item;
              return {
                id: photoId,
                similarity: similarityScore,
                imageUrl: photoDetails.imageUrl?.S || photoDetails.public_url?.S || null,
                owner: photoDetails.userId?.S || photoDetails.user_id?.S || null,
                eventId: photoDetails.eventId?.S || photoDetails.event_id?.S || null,
                createdAt: photoDetails.createdAt?.S || photoDetails.created_at?.S || null
              };
            }
            
            // If no photo found, still return basic match info
            return {
              id: photoId,
              similarity: similarityScore
            };
          } catch (matchError) {
            console.error(`[FaceIndexing] Error fetching details for match ${photoId}:`, matchError);
            return {
              id: photoId,
              similarity: similarityScore,
              error: matchError.message
            };
          }
        }));
        
        console.log('[FaceIndexing] Processed historical matches:', historicalMatches);
      } else {
        console.log('[FaceIndexing] No historical matches found');
      }
    } catch (searchError) {
      console.error('[FaceIndexing] Error searching for historical matches:', searchError);
      // Don't fail the whole process if historical matching fails
    }
    
    // Step 6: Store image and face data
    const imagePath = `${userId}/${Date.now()}.jpg`;
    const storageResult = await FaceStorageService.storeFaceId(
      userId, 
      faceId, 
      imageBlob, 
      imagePath, 
      faceAttributes,
      historicalMatches
    );
    
    if (!storageResult.success) {
      console.warn('[FaceIndexing] Warning: Face indexed but storage failed:', storageResult.error);
      // Still return success since the face was indexed, just with a warning
    }
    
    return {
      success: true,
      faceId,
      faceAttributes,
      historicalMatches,
      imageUrl: storageResult.imageUrl || null
    };
  } catch (error) {
    console.error('[FaceIndexing] Error indexing face:', error);
    return { success: false, error: error.message || 'Error indexing face' };
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
    
    // Get AWS clients
    const { rekognitionClient } = await getAWSClients();
    
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
    
    // Get AWS clients
    const { rekognitionClient } = await getAWSClients();
    
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

// Helper to convert image to buffer format for Rekognition
const imageToBuffer = async (imageData) => {
  if (imageData instanceof Buffer) {
    return imageData;
  } else if (imageData instanceof Uint8Array) {
    return Buffer.from(imageData);
  } else if (imageData instanceof Blob) {
    const arrayBuffer = await imageData.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    // Handle base64 data URL
    const base64Data = imageData.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    throw new Error('Unsupported image data format');
  }
};

// Get AWS clients function
const getAWSClients = async () => {
  try {
    // Return the pre-configured clients
    return {
      rekognitionClient,
      dynamoClient,
      s3Client
    };
  } catch (error) {
    console.error('[FaceIndexing] Error getting AWS clients:', error);
    throw error;
  }
};

// Export functions as an object for easier importing
export const FaceIndexingService = {
  indexUserFace,
  indexFace,
  searchFaceByImage
};

export default FaceIndexingService; 