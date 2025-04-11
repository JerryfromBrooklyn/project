import { RekognitionClient, IndexFacesCommand, SearchFacesCommand } from "@aws-sdk/client-rekognition";
import { ScanCommand, UpdateCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, PHOTOS_TABLE, rekognitionClient as globalRekognitionClient } from '../lib/awsClient';
import { getFaceDataForUser } from './FaceStorageService';

// --- Configuration ---
// Best practice: Load these from environment variables or a config service
const AWS_REGION = process.env.AWS_REGION || "us-east-1"; 
const REKOGNITION_COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || "shmong-faces"; 
const FACE_MATCH_THRESHOLD = 99; // Confidence threshold for matching faces

// --- AWS SDK Client Initialization ---
let rekognitionClient;

/**
 * Initializes and returns the Rekognition client.
 * Uses the global client from awsClient.js if available.
 */
const initializeRekognitionClient = () => {
  if (!rekognitionClient) {
    console.log(`Initializing Rekognition client for region: ${AWS_REGION}`);
    // Try to use the global client first
    if (globalRekognitionClient) {
      console.log('Using global Rekognition client');
      rekognitionClient = globalRekognitionClient;
    } else {
      // Fallback to creating a new client with default config
      console.log('Creating new Rekognition client');
      rekognitionClient = new RekognitionClient({
        region: AWS_REGION
      });
    }
  }
  return rekognitionClient;
};

/**
 * Updates a user's matches by directly calling Rekognition's searchFaces API
 * This is more efficient than the bidirectional matching method for finding
 * all potential matches at once
 * 
 * @param {string} userId - The user ID to update matches for
 * @returns {Promise<{success: boolean, updatedCount: number}>}
 */
export const updateUserMatchesWithRekognition = async (userId) => {
  console.log(`🔍🔍🔍 [FaceMatchingService] Running direct Rekognition search for user ${userId}`);
  
  try {
    // 1. Get the user's face ID
    const faceData = await getFaceDataForUser(userId);
    
    if (!faceData || !faceData.faceId) {
      console.error(`❌ [FaceMatchingService] No face data or faceId found for user ${userId}`);
      return { success: false, error: "No face data found for user" };
    }
    
    console.log(`✅ [FaceMatchingService] Found faceId for user ${userId}: ${faceData.faceId}`);
    
    // 2. Call Rekognition to get matches
    const matches = await searchFacesByFaceId(faceData.faceId);
    
    // Note that searchFacesByFaceId now always returns an array (empty if there's an error)
    if (!matches.length) {
      console.log(`ℹ️ [FaceMatchingService] No matches found for user ${userId} with faceId ${faceData.faceId}`);
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`✅ [FaceMatchingService] Found ${matches.length} potential matches for user ${userId}`);
    
    let updatedCount = 0;
    const matchedPhotoIds = [];
    const matchedPhotos = [];
    
    // 3. Process each match
    for (const match of matches) {
      // Extract photo ID from ExternalImageId
      console.log(`[FaceMatchingService] Processing match with ExternalImageId: ${match.Face?.ExternalImageId}`);
      
      // The ExternalImageId should be the photo ID or contain it
      const photoId = match.Face?.ExternalImageId;
      
      if (!photoId) {
        console.log(`⚠️ [FaceMatchingService] No photoId extracted from match: ${JSON.stringify(match)}`);
        continue;
      }
      
      try {
        // Get the photo from DynamoDB
        const getParams = {
          TableName: PHOTOS_TABLE,
          Key: { id: photoId }
        };
        
        const photoResponse = await docClient.send(new GetCommand(getParams));
        const photo = photoResponse.Item;
        
        if (!photo) {
          console.log(`⚠️ [FaceMatchingService] Photo ${photoId} not found in database`);
          continue;
        }
        
        console.log(`✅ [FaceMatchingService] Found photo match in database: ${photoId}`);
        matchedPhotoIds.push(photoId);
        matchedPhotos.push({
          id: photoId,
          url: photo.public_url || photo.url,
          confidence: match.Similarity,
          timestamp: new Date().toISOString()
        });
        
        // Update matched_users array if it doesn't already include this user
        const matched_users = photo.matched_users || [];
        const userExists = matched_users.some(user => user.id === userId);
        
        if (!userExists) {
          // Add user to matched_users array
          matched_users.push({
            id: userId,
            timestamp: new Date().toISOString(),
            confidence: match.Similarity
          });
          
          // Update the photo record
          const updateParams = {
            TableName: PHOTOS_TABLE,
            Key: { id: photoId },
            UpdateExpression: 'SET matched_users = :matched_users',
            ExpressionAttributeValues: {
              ':matched_users': matched_users
            }
          };
          
          console.log(`✅ [FaceMatchingService] Added user to matched_users for photo ${photoId}`);
          await docClient.send(new UpdateCommand(updateParams));
          updatedCount++;
        } else {
          console.log(`ℹ️ [FaceMatchingService] User ${userId} already in matched_users for photo ${photoId}`);
        }
      } catch (error) {
        console.error(`❌ [FaceMatchingService] Error processing photo ${photoId}:`, error);
      }
    }
    
    // 4. Update the user's historicalMatches in their face data record
    if (matchedPhotoIds.length > 0) {
      try {
        console.log(`[FaceMatchingService] Updating user ${userId} historical matches with ${matchedPhotoIds.length} photos`);
        
        // Get current historicalMatches
        let historicalMatches = faceData?.historicalMatches || [];
        
        // Filter out matches that already exist
        const newMatches = matchedPhotos.filter(newMatch => 
          !historicalMatches.some(existingMatch => existingMatch.id === newMatch.id)
        );
        
        if (newMatches.length > 0) {
          // Add new matches
          historicalMatches = [...historicalMatches, ...newMatches];
          
          // IMPORTANT: We need the correct key structure from the user's face data record
          // Check if the required fields for the database key are present in faceData
          if (!faceData.imagePath) {
            console.error(`❌ [FaceMatchingService] Missing imagePath in face data for user ${userId}, cannot update historicalMatches`);
            return { success: false, updatedCount, error: "Missing imagePath in face data" };
          }
          
          // Build the correct composite key based on the actual table structure
          const keyObject = { 
            userId: userId,
            imagePath: faceData.imagePath  // This is the required RANGE key
          };
          
          console.log(`🔑 [FaceMatchingService] Using key for historicalMatches update:`, keyObject);
          
          const updateParams = {
            TableName: 'shmong-face-data',
            Key: keyObject,
            UpdateExpression: 'SET historicalMatches = :historicalMatches',
            ExpressionAttributeValues: {
              ':historicalMatches': historicalMatches
            },
            ReturnValues: 'UPDATED_NEW'
          };
          
          const updateResult = await docClient.send(new UpdateCommand(updateParams));
          console.log(`✅ [FaceMatchingService] Successfully updated historicalMatches for user ${userId}:`, updateResult);
          console.log(`✅ [FaceMatchingService] Added ${newMatches.length} new matches to user history`);
        } else {
          console.log(`[FaceMatchingService] No new historical matches to add for user ${userId}`);
        }
      } catch (historyUpdateError) {
        console.error(`❌ [FaceMatchingService] Error updating historicalMatches for user ${userId}:`, historyUpdateError);
        return { success: false, updatedCount, error: historyUpdateError.message };
      }
    }
    
    console.log(`✅ [FaceMatchingService] Direct Rekognition update complete. Updated ${updatedCount} photos.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('❌ [FaceMatchingService] Error in direct Rekognition update:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Indexes the primary face from user registration (e.g., webcam capture)
 * into the Rekognition collection.
 * @param imageBytes - The image data as a Uint8Array or Buffer.
 * @param userId - The unique ID of the user registering.
 * @returns The canonical FaceId assigned by Rekognition, or null on failure.
 */
export const indexFaceForRegistration = async (imageBytes, userId) => {
  const client = initializeRekognitionClient();
  const command = new IndexFacesCommand({
    CollectionId: REKOGNITION_COLLECTION_ID,
    Image: { Bytes: imageBytes },
    ExternalImageId: `user_${userId}`, // Consistent prefix
    MaxFaces: 1, // We only want to index the single best face for the user's canonical record
    QualityFilter: "AUTO", // Use Rekognition's default quality filtering
    DetectionAttributes: ["DEFAULT"],
  });
  try {
    console.log(`Indexing face for user: ${userId}`);
    const response = await client.send(command);
    if (response.FaceRecords && response.FaceRecords.length > 0 && response.FaceRecords[0].Face?.FaceId) {
      const faceId = response.FaceRecords[0].Face.FaceId;
      console.log(`Successfully indexed face for user ${userId}. Canonical FaceId: ${faceId}`);
      return faceId;
    }
    else {
      console.warn(`No face record found in IndexFaces response for user ${userId}. Unindexed faces:`, response.UnindexedFaces);
      return null;
    }
  }
  catch (error) {
    console.error(`Error indexing face for user ${userId}:`, error);
    // Consider more specific error handling based on AWS error types
    return null;
  }
};

/**
 * Searches the collection for faces matching the user's canonical FaceId.
 * Used for historical matching right after registration.
 * @param faceId - The user's canonical FaceId obtained from indexFaceForRegistration.
 * @returns An array of matching FaceMatches from the collection, or empty array on failure.
 */
export const searchFacesByFaceId = async (faceId) => {
  if (!faceId) {
    console.log('No faceId provided to searchFacesByFaceId');
    return [];
  }
  
  const client = initializeRekognitionClient();
  const command = new SearchFacesCommand({
    CollectionId: REKOGNITION_COLLECTION_ID,
    FaceId: faceId,
    FaceMatchThreshold: FACE_MATCH_THRESHOLD,
    MaxFaces: 1000, // Adjust as needed, limits the number of matches returned *per call*
  });
  
  try {
    console.log(`Searching for matches for FaceId: ${faceId}`);
    const response = await client.send(command);
    if (response.FaceMatches && response.FaceMatches.length > 0) {
      console.log(`Found ${response.FaceMatches.length} matches for FaceId ${faceId}`);
      return response.FaceMatches; // Return the full FaceMatches array with Face objects
    }
    else {
      console.log(`No matches found for FaceId ${faceId}`);
      return []; // Return empty array if no matches
    }
  }
  catch (error) {
    // Check specifically for "face not found" errors
    if (error.name === 'InvalidParameterException' && error.message.includes('not found in the collection')) {
      console.warn(`FaceId ${faceId} no longer exists in the collection. This may be due to face deletion or collection changes.`);
      // Consider flagging this face ID for cleanup in your database
      return [];
    }
    
    console.error(`Error searching faces for FaceId ${faceId}:`, error);
    return []; // Return empty array instead of null to make error handling easier
  }
};

/**
 * FaceMatchingService - Handles bidirectional face matching functionality
 */
const FaceMatchingService = {
  /**
   * Updates face matches bidirectionally in the database
   * This ensures that if person A is in person B's photo, person B is also in person A's matched photos
   * @param {string} userId - The user ID to update matches for
   * @returns {Promise<{success: boolean, updated: number}>} - Number of photos updated
   */
  updateBidirectionalMatches: async (userId) => {
    console.log(`🔄 [FaceMatchingService] Running bidirectional match update for user ${userId}`);
    
    if (!userId) {
      console.error('[FaceMatchingService] Cannot update bidirectional matches - missing userId');
      return { success: false, updated: 0 };
    }
    
    try {
      // 1. Get the user's registered face IDs
      const faceData = await getFaceDataForUser(userId);
      
      if (!faceData || !faceData.faceId) {
        console.log(`[FaceMatchingService] No face data found for user ${userId}`);
        return { success: false, updated: 0 };
      }
      
      const userFaceIds = [faceData.faceId];
      console.log(`[FaceMatchingService] User ${userId} has registered face IDs:`, userFaceIds);
      
      // 2. Scan the photos table to find all photos
      console.log(`[FaceMatchingService] Scanning ${PHOTOS_TABLE} to find all photos...`);
      const scanCommand = new ScanCommand({ TableName: PHOTOS_TABLE });
      const response = await docClient.send(scanCommand);
      
      if (!response.Items || response.Items.length === 0) {
        console.log(`[FaceMatchingService] No photos found in scan.`);
        return { success: false, updated: 0 };
      }
      
      console.log(`[FaceMatchingService] Found ${response.Items.length} total photos in the database.`);
      
      // 3. For each photo where user's face is detected, ensure bidirectional match
      let updatedCount = 0;
      const timestamp = new Date().toISOString();
      
      // Track which photos match the current user's face for later updating their historicalMatches
      const matchedPhotoIds = [];
      const matchedPhotos = [];
      
      for (const photo of response.Items) {
        // Skip photos uploaded by the user themselves (they already have access)
        if (photo.uploaded_by === userId || photo.user_id === userId) {
          continue;
        }
        
        let needsUpdate = false;
        let matchedUsers = photo.matched_users || [];
        
        // Standardize the matched_users format
        if (typeof matchedUsers === 'string') {
          try {
            matchedUsers = JSON.parse(matchedUsers);
          } catch (e) {
            console.error(`[FaceMatchingService] Invalid JSON in matched_users for photo ${photo.id}:`, e);
            continue;
          }
        }
        
        if (!Array.isArray(matchedUsers)) {
          matchedUsers = [];
        }
        
        // Check if our user's face matches any faces in this photo
        if (photo.faces && Array.isArray(photo.faces)) {
          const matchedFace = photo.faces.find(face => {
            const faceId = typeof face === 'object' ? face.faceId : face;
            // If this photo contains a face with 100% similarity to user's face
            return faceId && userFaceIds.includes(faceId);
          });
          
          if (matchedFace) {
            // Check if user is already in the matched_users array
            const userIndex = matchedUsers.findIndex(match => {
              if (typeof match === 'object' && match !== null) {
                return match.userId === userId || match.user_id === userId;
              } else if (typeof match === 'string') {
                return match === userId;
              }
              return false;
            });
            
            if (userIndex === -1) {
              // User not found in matched_users, add them
              console.log(`[FaceMatchingService] Adding user ${userId} to matched_users for photo ${photo.id}`);
              
              // Get the actual confidence value from the matched face if available
              let similarity = 90; // Default fallback value
              if (typeof matchedFace === 'object' && matchedFace.confidence) {
                similarity = matchedFace.confidence;
              }
              
              // Use the standardized object format
              matchedUsers.push({
                userId: userId,
                faceId: userFaceIds[0],
                similarity: similarity, // Using actual confidence when available
                matchedAt: timestamp
              });
              
              needsUpdate = true;
            }
            
            // Track this photo for updating the user's historicalMatches later
            matchedPhotoIds.push(photo.id);
            matchedPhotos.push({
              id: photo.id,
              uploadedBy: photo.uploaded_by || photo.user_id,
              uploadedAt: photo.uploaded_at || photo.created_at,
              url: photo.url || photo.photo_url,
              thumbnailUrl: photo.thumbnail_url || photo.url,
              similarity: 90, // Default
              matchedAt: timestamp
            });
          }
        }
        
        // If a face with the user's face ID is found in the photo and the user ID
        // is not yet in the matched_users array, update the database
        if (needsUpdate) {
          try {
            const updateParams = {
              TableName: PHOTOS_TABLE,
              Key: { id: photo.id },
              UpdateExpression: 'SET matched_users = :matchedUsers',
              ExpressionAttributeValues: {
                ':matchedUsers': matchedUsers
              },
              ReturnValues: 'UPDATED_NEW'
            };
            
            console.log(`✅ [FaceMatchingService] Added user to matched_users for photo ${photo.id}`);
            await docClient.send(new UpdateCommand(updateParams));
            updatedCount++;
          } catch (error) {
            console.error(`❌ [FaceMatchingService] Error processing photo ${photo.id}:`, error);
          }
        }
      }
      
      // 4. Update the user's historicalMatches in their face data record
      if (matchedPhotoIds.length > 0) {
        try {
          console.log(`[FaceMatchingService] Updating user ${userId} historical matches with ${matchedPhotoIds.length} photos`);
          
          // Get current historicalMatches
          let historicalMatches = faceData?.historicalMatches || [];
          
          // Filter out matches that already exist
          const newMatches = matchedPhotos.filter(newMatch => 
            !historicalMatches.some(existingMatch => existingMatch.id === newMatch.id)
          );
          
          if (newMatches.length > 0) {
            // Add new matches
            historicalMatches = [...historicalMatches, ...newMatches];
            
            // IMPORTANT: We need the correct key structure from the user's face data record
            // Check if the required fields for the database key are present in faceData
            if (!faceData.imagePath) {
              console.error(`❌ [FaceMatchingService] Missing imagePath in face data for user ${userId}, cannot update historicalMatches`);
              return { success: false, updatedCount, error: "Missing imagePath in face data" };
            }
            
            // Build the correct composite key based on the actual table structure
            const keyObject = { 
              userId: userId,
              imagePath: faceData.imagePath  // This is the required RANGE key
            };
            
            console.log(`🔑 [FaceMatchingService] Using key for historicalMatches update:`, keyObject);
            
            const updateParams = {
              TableName: 'shmong-face-data',
              Key: keyObject,
              UpdateExpression: 'SET historicalMatches = :historicalMatches',
              ExpressionAttributeValues: {
                ':historicalMatches': historicalMatches
              },
              ReturnValues: 'UPDATED_NEW'
            };
            
            const updateResult = await docClient.send(new UpdateCommand(updateParams));
            console.log(`✅ [FaceMatchingService] Successfully updated historicalMatches for user ${userId}:`, updateResult);
            console.log(`✅ [FaceMatchingService] Added ${newMatches.length} new matches to user history`);
          } else {
            console.log(`[FaceMatchingService] No new historical matches to add for user ${userId}`);
          }
        } catch (historyUpdateError) {
          console.error(`❌ [FaceMatchingService] Error updating historicalMatches for user ${userId}:`, historyUpdateError);
          return { success: false, updatedCount, error: historyUpdateError.message };
        }
      }
      
      console.log(`✅ [FaceMatchingService] Direct Rekognition update complete. Updated ${updatedCount} photos.`);
      return { success: true, updatedCount };
    } catch (error) {
      console.error('❌ [FaceMatchingService] Error in direct Rekognition update:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Updates a user's matches using direct Rekognition API calls
   * More efficient for finding all matches at once
   * @param {string} userId - The user ID to update matches for
   * @returns {Promise<{success: boolean, updatedCount: number}>}
   */
  updateUserMatchesWithRekognition: async (userId) => {
    return updateUserMatchesWithRekognition(userId);
  },
  
  /**
   * Processes matches for all users in the system
   * This is a heavy operation and should be run as a background job
   * @returns {Promise<{success: boolean, results: Array}>}
   */
  updateAllUserMatches: async () => {
    console.log(`🔄 [FaceMatchingService] Starting match update for all users...`);
    
    try {
      // 1. Get all unique users who have uploaded photos
      console.log(`[FaceMatchingService] Scanning ${PHOTOS_TABLE} to find all users...`);
      const scanCommand = new ScanCommand({ 
        TableName: PHOTOS_TABLE,
        ProjectionExpression: "uploaded_by, user_id"
      });
      
      const response = await docClient.send(scanCommand);
      
      if (!response.Items || response.Items.length === 0) {
        console.log(`[FaceMatchingService] No photos found to extract users.`);
        return { success: false, results: [] };
      }
      
      // Extract all unique user IDs
      const userIds = new Set();
      response.Items.forEach(item => {
        if (item.uploaded_by) userIds.add(item.uploaded_by);
        if (item.user_id) userIds.add(item.user_id);
      });
      
      console.log(`[FaceMatchingService] Found ${userIds.size} unique users with photos.`);
      
      // 2. Update matches for each user using the direct Rekognition method
      const results = [];
      const errors = [];
      
      for (const userId of userIds) {
        try {
          console.log(`[FaceMatchingService] Processing matches for user: ${userId}`);
          const result = await FaceMatchingService.updateUserMatchesWithRekognition(userId);
          results.push({ userId, ...result });
        } catch (userError) {
          console.error(`[FaceMatchingService] Error processing user ${userId}:`, userError);
          errors.push({ userId, error: userError.message });
          // Continue with next user instead of breaking the entire process
        }
      }
      
      console.log(`[FaceMatchingService] All user matches updated. Success: ${results.length}, Errors: ${errors.length}`);
      return { 
        success: true, 
        results,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('[FaceMatchingService] Error updating all user matches:', error);
      return { success: false, results: [], error: error.message };
    }
  }
};

export default FaceMatchingService;