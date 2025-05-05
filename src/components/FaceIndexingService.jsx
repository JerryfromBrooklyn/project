// Assuming AWS SDK clients (rekognition, possibly S3) and Supabase client 
// are initialized elsewhere and passed to the constructor or configured globally.
// Example: import { rekognitionClient } from '../lib/awsClient';
// Example: import { supabase } from '../lib/supabaseClient';

class FaceIndexingService {
    constructor(rekognitionClient, supabaseClient, faceCollectionId) {
        if (!rekognitionClient || !supabaseClient || !faceCollectionId) {
            throw new Error("FaceIndexingService requires rekognitionClient, supabaseClient, and faceCollectionId");
        }
        this.rekognition = rekognitionClient; // Using AWS SDK v2 based on .promise() usage
        this.supabase = supabaseClient;
        this.faceCollectionId = faceCollectionId;
        console.log("FaceIndexingService initialized");
    }

    // Helper to detect faces (if needed separately)
    async detectFaces(imageData) {
      // Convert base64 to buffer if necessary
      let imageBuffer = imageData;
      if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
        imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
      }
      const params = {
        Image: { Bytes: imageBuffer },
        Attributes: ['ALL']
      };
      try {
          console.log("Detecting faces...");
          const response = await this.rekognition.detectFaces(params).promise();
          console.log(`Detection complete, found ${response.FaceDetails?.length || 0} faces.`);
          return response;
      } catch (error) {
          console.error("Error in detectFaces:", error);
          throw error; // Re-throw the error to be handled by the caller
      }
    }

    // Helper to save face metadata (example assumes Supabase)
    async saveFaceToDatabase(userId, faceId, faceAttributes) {
      console.log(`Saving face ${faceId} for user ${userId} to database...`);
      try {
          const { data, error } = await this.supabase
              .from('user_faces') // Assuming a table named 'user_faces'
              .insert([
                  { 
                      user_id: userId, 
                      rekognition_face_id: faceId,
                      // Store desired attributes as JSON or individual columns
                      attributes: faceAttributes 
                  }
              ]);
          
          if (error) {
              console.error("Error saving face to database:", error);
              throw error;
          } 
          console.log("Face saved to database successfully.", data);
          return data;
      } catch (error) {
          console.error("Exception saving face to database:", error);
          throw error;
      }
    }

    async searchForFaceMatches(faceId) {
      console.log(`Searching for faces matching FaceId: ${faceId}`);
      
      try {
        // Use AWS Rekognition to find similar faces
        const params = {
          CollectionId: this.faceCollectionId,
          FaceId: faceId,
          MaxFaces: 250,
          FaceMatchThreshold: 95 // Adjust threshold as needed
        };
        
        // NOTE: This code uses .promise() which indicates AWS SDK v2 syntax.
        // Our backend services use SDK v3 (await client.send(command)). 
        // This client-side code might need updating to v3 if used extensively.
        const searchResults = await this.rekognition.searchFaces(params).promise(); 
        
        console.log(`Found ${searchResults.FaceMatches?.length || 0} matching faces in AWS collection`);
        
        if (searchResults.FaceMatches && searchResults.FaceMatches.length > 0) {
          // Extract matched face IDs for database query
          const matchedFaceIds = searchResults.FaceMatches.map(match => match.Face.FaceId);
          console.log(`Matching face IDs (first 5): ${matchedFaceIds.slice(0, 5).join(', ')}${matchedFaceIds.length > 5 ? '...' : ''}`);
          
          // --- IMPORTANT: Database Query Logic for Matching Photos --- 
          // The original logic filtering `photos.face_ids` is complex and might be inefficient.
          // A better approach depends on your DB schema:
          // 1. If `photos` table has a column linking to detected faces: Query based on that.
          // 2. If using the `DetectedFaces` table (like our backend): This logic should happen backend-side.
          // For now, just return the matched AWS Face IDs.
          console.warn("searchForFaceMatches: Database photo matching logic needs review/implementation based on schema.");
          return { awsMatches: searchResults.FaceMatches }; // Return raw matches for now
        }
        
        return { awsMatches: [] };
      } catch (error) {
        console.error(`Error searching for face matches: ${error.message}`);
        throw error; // Re-throw
      }
    }

    /**
     * Find and update matches for a newly registered face in existing photos
     * This should primarily happen on the BACKEND after registration.
     * Keeping a simplified version here for context if needed, but recommend backend handles this.
     */
    async findMatchesForNewFace(userId, faceId) {
      console.warn("findMatchesForNewFace called on client-side. This logic is usually better handled by the backend after registration.")
      try {
        console.log(`[Client-side INFO] Finding matches for newly registered face ID ${faceId} for user ${userId}`);
        
        // 1. Search AWS Rekognition for matches with this new face
        const params = {
          CollectionId: this.faceCollectionId,
          FaceId: faceId,
          MaxFaces: 250,
          FaceMatchThreshold: 95 // Use high confidence threshold
        };
        
        const searchResults = await this.rekognition.searchFaces(params).promise();
        console.log(`[Client-side INFO] Found ${searchResults.FaceMatches?.length || 0} potential face matches in AWS collection`);
        
        if (!searchResults.FaceMatches || searchResults.FaceMatches.length === 0) {
          return { matchCount: 0, updatedPhotos: 0 };
        }

        // NOTE: The rest of this function involves querying and updating potentially many photos.
        // This is computationally expensive and data-intensive for a client browser.
        // It's highly recommended to trigger this process on the backend after registration.
        // The backend can query DynamoDB efficiently using GSIs and update records.
        console.log("[Client-side WARN] Photo update logic skipped. Backend should handle historical matching.");

        // Return only the count found by Rekognition for info purposes
        return {
          matchCount: searchResults.FaceMatches.length, 
          updatedPhotos: 0 // Indicate no client-side updates performed
        };
        
      } catch (error) {
        console.error(`[Client-side ERROR] Error processing matches for new face: ${error.message}`);
        return { error: error.message, matchCount: 0, updatedPhotos: 0 };
      }
    }

    /**
     * Main function called by the FaceRegistration component.
     * Detects, indexes, saves face metadata, and triggers historical matching.
     */
    async indexUserFace(imageData, userId) {
      console.log("Face Indexing Process for User:", userId);
      console.log("🔍 Starting face indexing...");
      
      try {
        // 1. Detect face(s) first for validation
        console.log("Step 1: Detecting faces in image...");
        const detectResult = await this.detectFaces(imageData);
        
        if (!detectResult || !detectResult.FaceDetails || detectResult.FaceDetails.length === 0) {
          console.log("❌ No face detected in the image");
          return { error: "No face detected in the image.", success: false };
        }
        if (detectResult.FaceDetails.length > 1) {
          console.log(`❌ Multiple faces (${detectResult.FaceDetails.length}) detected. Please ensure only one face is present.`);
          return { error: "Multiple faces detected. Please capture only your face.", success: false };
        }
        
        // 2. Index the detected face
        console.log("Step 2: Indexing face...");
        let imageBuffer = imageData;
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
        }
        
        const indexParams = {
          CollectionId: this.faceCollectionId,
          ExternalImageId: `user-${userId}-profile`, // Associate with user
          Image: { Bytes: imageBuffer },
          MaxFaces: 1,
          QualityFilter: "AUTO",
          DetectionAttributes: ["ALL"] // Get attributes to save
        };
        
        const indexResult = await this.rekognition.indexFaces(indexParams).promise();
        
        if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
          const faceRecord = indexResult.FaceRecords[0];
          const faceId = faceRecord.Face?.FaceId;
          const faceAttributes = faceRecord.FaceDetail;

          if (!faceId) {
             console.log("❌ Failed to index face: No FaceId returned by Rekognition.");
             return { error: "Failed to get Face ID from Rekognition.", success: false };
          }
          
          console.log(`✅ Face indexed successfully: ${faceId}`);
          
          // 3. Save face metadata to database (using helper)
          // Consider if this should happen client-side or server-side
          // await this.saveFaceToDatabase(userId, faceId, faceAttributes);
          console.warn("Skipping client-side saveFaceToDatabase. Backend should handle associating FaceID with user.")

          // 4. Trigger backend historical matching (Recommended)
          // Instead of doing search/linking here, call a backend endpoint
          // await triggerBackendHistoricalMatch(userId, faceId); 
          console.warn("Skipping client-side historical matching. Backend should handle this after registration.");
          const matchResults = { matchCount: 0, updatedPhotos: 0 }; // Simulate no client-side matching
          
          return {
            faceId: faceId,
            faceAttributes: faceAttributes,
            matchResults: matchResults, // Include results if performed client-side (not recommended)
            success: true
          };
        } else {
          // Log unindexed faces for debugging
          const unindexedReason = indexResult.UnindexedFaces?.[0]?.Reasons?.join(', ') || 'Unknown';
          console.log(`❌ Failed to index face: No face records returned. Reason: ${unindexedReason}`);
          return { error: `Failed to index face. Reason: ${unindexedReason}`, success: false };
        }
      } catch (error) {
        console.error("❌ Error during face indexing:", error);
        // Check for specific Rekognition errors if needed
        return { error: `Error during face indexing: ${error.message}`, success: false };
      }
    }
}

// Export the class
export default FaceIndexingService; 