import { RekognitionClient, IndexFacesCommand, SearchFacesCommand } from "@aws-sdk/client-rekognition";
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, PHOTOS_TABLE, rekognitionClient as globalRekognitionClient } from '../lib/awsClient';
import { getFaceDataForUser } from './FaceStorageService';
// --- Configuration ---
// Best practice: Load these from environment variables or a config service
const AWS_REGION = process.env.AWS_REGION || "us-east-1"; // Replace with your desired AWS region
const REKOGNITION_COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || "shmong-faces"; // Replace with your Rekognition Collection ID
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
// --- Service Functions ---
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
        ExternalImageId: `user-${userId}-profile`, // Example ExternalImageId
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
 * @returns An array of matching anonymous FaceIds from the collection, or null on failure.
 */
export const searchFacesByFaceId = async (faceId) => {
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
            const matchedFaceIds = response.FaceMatches
                .filter(match => match.Face?.FaceId) // Ensure FaceId exists
                .map(match => match.Face.FaceId); // Extract the IDs
            console.log(`Found ${matchedFaceIds.length} matches for FaceId ${faceId}`);
            return matchedFaceIds;
        }
        else {
            console.log(`No matches found for FaceId ${faceId}`);
            return []; // Return empty array if no matches
        }
    }
    catch (error) {
        console.error(`Error searching faces for FaceId ${faceId}:`, error);
        return null;
    }
};
/**
 * Processes a newly uploaded photo: detects faces, indexes them anonymously,
 * stores metadata (requires backend DB logic), and attempts real-time matching.
 * @param photoId - The unique ID assigned to the photo in your database.
 * @param imageBytes - The image data as a Uint8Array or Buffer.
 * @returns {Promise<void>}
 */
export const processUploadedPhotoForIndexingAndMatching = async (photoId, imageBytes) => {
    const client = initializeRekognitionClient();
    // --- 1. Detect Faces (Optional but Recommended for Quality Check) ---
    // You might want to detect first to check quality before indexing.
    // For simplicity here, we'll combine detection implicitly within IndexFaces below,
    // but a separate DetectFaces call allows pre-filtering.
    // const detectCommand = new DetectFacesCommand({ ... });
    // const detectedFaces = await client.send(detectCommand);
    // Filter detectedFaces based on quality, size etc. before proceeding...
    // --- 2. Index Detected Faces Anonymously ---
    const indexCommand = new IndexFacesCommand({
        CollectionId: REKOGNITION_COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: `photo-${photoId}`, // Link face records back to the photo
        MaxFaces: 100, // Index up to 100 largest faces found in the photo
        QualityFilter: "AUTO",
        DetectionAttributes: ["DEFAULT"], // Or "ALL" if you need more attributes like landmarks, emotions
    });
    let indexedFaces = []; // Store successfully indexed faces for searching
    try {
        console.log(`Indexing faces for photo: ${photoId}`);
        const indexResponse = await client.send(indexCommand);
        if (indexResponse.FaceRecords && indexResponse.FaceRecords.length > 0) {
            indexedFaces = indexResponse.FaceRecords
                .filter(record => record.Face?.FaceId)
                .map(record => ({
                faceId: record.Face.FaceId,
                boundingBox: record.Face.BoundingBox // Store bounding box too
            }));
            console.log(`Successfully indexed ${indexedFaces.length} faces for photo ${photoId}.`);
            // --- 3. Store Anonymous Face Data (Backend Logic Needed) ---
            // TODO: Implement database logic here
            // For each face in indexedFaces:
            //  - Save the anonymous faceId (indexedFaces[i].faceId)
            //  - Save the associated photoId
            //  - Save the boundingBox (indexedFaces[i].boundingBox)
            //  - Initially, set the associated userId to NULL
            // Example placeholder: await saveDetectedFaceToDB(photoId, indexedFaces[i].faceId, indexedFaces[i].boundingBox);
            console.log(`Placeholder: Would now save ${indexedFaces.length} detected faces to DB for photo ${photoId}`);
        }
        else {
            console.log(`No faces were indexed for photo ${photoId}. Unindexed:`, indexResponse.UnindexedFaces);
            return; // Nothing more to do if no faces were indexed
        }
        if (indexResponse.UnindexedFaces && indexResponse.UnindexedFaces.length > 0) {
            console.log(`Photo ${photoId} had ${indexResponse.UnindexedFaces.length} faces not indexed due to quality/size/etc.`);
            // You might want to log details about why faces were unindexed
        }
    }
    catch (error) {
        console.error(`Error indexing faces for photo ${photoId}:`, error);
        return; // Stop processing this photo if indexing fails
    }
    // --- 4. Search for Matches for Each Newly Indexed Face (Real-time Matching) ---
    if (indexedFaces.length > 0) {
        console.log(`Performing real-time search for ${indexedFaces.length} newly indexed faces from photo ${photoId}...`);
        for (const indexedFace of indexedFaces) {
            const searchCommand = new SearchFacesCommand({
                CollectionId: REKOGNITION_COLLECTION_ID,
                FaceId: indexedFace.faceId, // Search using the *anonymous* ID just indexed
                FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                MaxFaces: 5, // Usually expect only 0 or 1 match against registered users' canonical faces
            });
            try {
                const searchResponse = await client.send(searchCommand);
                if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                    // We found potential matches in the collection for this anonymous face
                    for (const match of searchResponse.FaceMatches) {
                        if (match.Face?.FaceId && match.Similarity) {
                            const matchedCanonicalFaceId = match.Face.FaceId;
                            const similarity = match.Similarity;
                            console.log(`Real-time match found for anonymous face ${indexedFace.faceId} (Photo: ${photoId})! Matched Canonical FaceId: ${matchedCanonicalFaceId} with similarity ${similarity}%`);
                            // --- 5. Link to User (Backend Logic Needed) ---
                            // TODO: Implement database logic here
                            //  - Look up which userId corresponds to the matchedCanonicalFaceId in your Users table
                            //  - If found, update the specific DetectedFaces record (for photoId and indexedFace.faceId)
                            //    to set its userId field.
                            // Example placeholder: await linkDetectedFaceToUser(indexedFace.faceId, matchedCanonicalFaceId);
                            console.log(`Placeholder: Would now link anonymous face ${indexedFace.faceId} to user via canonical ID ${matchedCanonicalFaceId} in DB.`);
                        }
                    }
                }
                // else { console.log(`No registered user match found for anonymous face ${indexedFace.faceId}`); }
            }
            catch (searchError) {
                console.error(`Error searching for matches for anonymous face ${indexedFace.faceId} (Photo: ${photoId}):`, searchError);
                // Continue processing other faces even if one search fails
            }
        }
        console.log(`Finished real-time search for photo ${photoId}.`);
    }
};
// --- Helper Functions (Example) ---
// TODO: Implement these functions in your backend data access layer
// async function saveDetectedFaceToDB(photoId: string, anonymousFaceId: string, boundingBox: any): Promise<void> {
//   console.log(`DB: Saving detected face ${anonymousFaceId} for photo ${photoId}`);
//   // ... database insertion logic ...
// }
// async function linkDetectedFaceToUser(anonymousFaceId: string, matchedCanonicalFaceId: string): Promise<void> {
//   console.log(`DB: Linking anonymous face ${anonymousFaceId} to user with canonical face ${matchedCanonicalFaceId}`);
//   // 1. Find userId associated with matchedCanonicalFaceId in Users table
//   // 2. Update DetectedFaces table SET userId = foundUserId WHERE anonymousRekognitionFaceId = anonymousFaceId
//   // ... database update logic ...
// }

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
            
            console.log(`[FaceMatchingService] Updating photo ${photo.id} with new matched_users list`);
            await docClient.send(new UpdateCommand(updateParams));
            updatedCount++;
          } catch (updateError) {
            console.error(`[FaceMatchingService] Error updating photo ${photo.id}:`, updateError);
          }
        }
      }
      
      console.log(`[FaceMatchingService] Bidirectional match update complete. Updated ${updatedCount} photos.`);
      return { success: true, updated: updatedCount };
    } catch (error) {
      console.error('[FaceMatchingService] Error updating bidirectional matches:', error);
      return { success: false, updated: 0, error };
    }
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
      
      // 2. Update matches for each user
      const results = [];
      for (const userId of userIds) {
        console.log(`[FaceMatchingService] Processing matches for user: ${userId}`);
        const result = await FaceMatchingService.updateBidirectionalMatches(userId);
        results.push({ userId, ...result });
      }
      
      console.log(`[FaceMatchingService] All user matches updated.`, results);
      return { success: true, results };
    } catch (error) {
      console.error('[FaceMatchingService] Error updating all user matches:', error);
      return { success: false, results: [], error };
    }
  }
};

export default FaceMatchingService; 
