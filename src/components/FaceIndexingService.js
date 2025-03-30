async searchForFaceMatches(faceId) {
  console.log(`Searching for faces matching FaceId: ${faceId}`);
  
  try {
    // Use AWS Rekognition to find similar faces
    const params = {
      CollectionId: this.faceCollectionId,
      FaceId: faceId,
      MaxFaces: 100,
      FaceMatchThreshold: 70
    };
    
    const searchResults = await this.rekognition.searchFaces(params).promise();
    
    console.log(`Found ${searchResults.FaceMatches?.length || 0} matching faces in AWS collection`);
    
    if (searchResults.FaceMatches && searchResults.FaceMatches.length > 0) {
      // Extract matched face IDs for database query
      const matchedFaceIds = searchResults.FaceMatches.map(match => match.Face.FaceId);
      console.log(`Matching face IDs: ${matchedFaceIds.slice(0, 5).join(', ')}${matchedFaceIds.length > 5 ? '...' : ''} (and more)`);
      
      console.log(`Fetching all photos to check for matches...`);
      
      // Query the database for photos containing these faces
      // Note: This is not finding photos correctly - needs to be fixed
      const { data: photos, error } = await this.supabase
        .from('photos')
        .select('*')
        .filter('face_ids', 'cs', `{${matchedFaceIds.join(',')}}`);
      
      if (error) {
        console.error(`Error fetching photos: ${error.message}`);
        return [];
      }
      
      if (!photos || photos.length === 0) {
        console.log(`No photos found in database`);
        return [];
      }
      
      return photos;
    }
    
    return [];
  } catch (error) {
    console.error(`Error searching for face matches: ${error.message}`);
    return [];
  }
}

/**
 * Find and update matches for a newly registered face in existing photos
 * This is an enhanced version that properly handles the all_photos view
 * and updates existing photos to include the new face in matched_users
 * 
 * @param {string} userId - The user ID who registered the face
 * @param {string} faceId - The AWS Rekognition face ID
 * @returns {Promise<object>} - Summary of matching operations
 */
async findMatchesForNewFace(userId, faceId) {
  try {
    console.log(`[INFO] Finding matches for newly registered face ID ${faceId} for user ${userId}`);
    
    // 1. Search AWS Rekognition for matches with this new face
    const params = {
      CollectionId: this.faceCollectionId,
      FaceId: faceId,
      MaxFaces: 100,
      FaceMatchThreshold: 90 // Use high confidence threshold
    };
    
    const searchResults = await this.rekognition.searchFaces(params).promise();
    
    console.log(`[INFO] Found ${searchResults.FaceMatches?.length || 0} potential face matches in AWS collection`);
    
    if (!searchResults.FaceMatches || searchResults.FaceMatches.length === 0) {
      return { matchCount: 0, updatedPhotos: 0 };
    }
    
    // Get the user profile for the match metadata
    const { data: userProfile } = await this.supabase
      .from('profiles')
      .select('email, full_name, avatar_url')
      .eq('id', userId)
      .single();
    
    const userName = userProfile?.full_name || userProfile?.email || 'Unknown User';
    const userEmail = userProfile?.email || '';
    const userAvatar = userProfile?.avatar_url || null;
    
    // 2. Extract matched face IDs for database query
    const matchedFaceIds = searchResults.FaceMatches.map(match => match.Face.FaceId);
    
    // 3. Query photos using the same approach as PhotoManager.js 
    // Using the "all_photos" view since that's what PhotoManager uses
    const { data: photos, error } = await this.supabase
      .from('all_photos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`[ERROR] Failed to fetch photos: ${error.message}`);
      return { matchCount: 0, updatedPhotos: 0, error: error.message };
    }
    
    if (!photos || photos.length === 0) {
      console.log(`[INFO] No photos found in database to match against`);
      return { matchCount: 0, updatedPhotos: 0 };
    }
    
    console.log(`[INFO] Found ${photos.length} photos to check for face matches`);
    
    // 4. Find photos that contain any of the matched face IDs
    // We need to manually filter since the database query may not support complex array operations
    const photosToUpdate = [];
    const matchSimilarities = {};
    
    // Store similarity scores by face ID for easy lookup
    searchResults.FaceMatches.forEach(match => {
      matchSimilarities[match.Face.FaceId] = match.Similarity;
    });
    
    // Find photos that contain any of the matched face IDs but don't already have this user as a match
    for (const photo of photos) {
      // Skip if photo doesn't have face_ids array
      if (!photo.face_ids || !Array.isArray(photo.face_ids)) continue;
      
      // Check if any of this photo's face_ids match the ones we found in AWS
      const matchingPhotoFaces = photo.face_ids.filter(id => matchedFaceIds.includes(id));
      
      if (matchingPhotoFaces.length > 0) {
        // Check if this user is already in the matched_users array
        const matchedUsers = photo.matched_users || [];
        const alreadyMatched = matchedUsers.some(match => match.userId === userId);
        
        if (!alreadyMatched) {
          // Get the best similarity score among the matching faces
          const bestMatchFaceId = matchingPhotoFaces.reduce((best, faceId) => {
            const similarity = matchSimilarities[faceId] || 0;
            return similarity > (matchSimilarities[best] || 0) ? faceId : best;
          }, matchingPhotoFaces[0]);
          
          const similarity = matchSimilarities[bestMatchFaceId] || 99;
          
          photosToUpdate.push({
            photoId: photo.id,
            currentMatches: matchedUsers,
            similarity: similarity,
            matchingFaceId: bestMatchFaceId
          });
        }
      }
    }
    
    console.log(`[INFO] Found ${photosToUpdate.length} photos that need updating with the new face match`);
    
    if (photosToUpdate.length === 0) {
      return { matchCount: searchResults.FaceMatches.length, updatedPhotos: 0 };
    }
    
    // 5. Update each photo with the new user match
    let successCount = 0;
    
    // Process in small batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < photosToUpdate.length; i += batchSize) {
      const batch = photosToUpdate.slice(i, Math.min(i + batchSize, photosToUpdate.length));
      
      const updatePromises = batch.map(photoData => {
        // Create match object
        const matchObject = {
          userId: userId,
          faceId: faceId,
          fullName: userName,
          email: userEmail,
          avatarUrl: userAvatar,
          confidence: Math.round(photoData.similarity * 100) / 100,
          similarity: Math.round(photoData.similarity * 100) / 100,
          matched_at: new Date().toISOString()
        };
        
        // Update the photo's matched_users array
        return this.supabase
          .from('photos')
          .update({
            matched_users: [...photoData.currentMatches, matchObject]
          })
          .eq('id', photoData.photoId);
      });
      
      // Wait for all updates in this batch to complete
      const results = await Promise.all(updatePromises);
      
      // Count successful updates
      successCount += results.filter(r => !r.error).length;
      
      // Add a small delay between batches
      if (i + batchSize < photosToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`[INFO] Successfully updated ${successCount} photos with new face match for user ${userId}`);
    
    return {
      matchCount: searchResults.FaceMatches.length,
      updatedPhotos: successCount
    };
    
  } catch (error) {
    console.error(`[ERROR] Error processing matches for new face: ${error.message}`);
    return { error: error.message, matchCount: 0, updatedPhotos: 0 };
  }
}

// Now modify the indexFace method to call our new function after successful indexing
async indexFace(imageData, userId) {
  console.log("Face Indexing Process");
  console.log("🔍 Starting face indexing...");
  
  try {
    console.log("Step 1: Detecting faces in image...");
    const detectedFaces = await this.detectFaces(imageData);
    
    if (!detectedFaces || detectedFaces.FaceDetails.length === 0) {
      console.log("❌ No face detected in the image");
      return { error: "No face detected in the image", success: false };
    }
    
    // Continue with indexing...
    console.log("Step 2: Indexing face...");
    
    // Convert base64 to buffer if necessary
    let imageBuffer = imageData;
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    }
    
    // Index the face in the collection
    const indexParams = {
      CollectionId: this.faceCollectionId,
      DetectionAttributes: ["ALL"],
      Image: {
        Bytes: imageBuffer
      },
      MaxFaces: 1,
      QualityFilter: "AUTO"
    };
    
    const indexResult = await this.rekognition.indexFaces(indexParams).promise();
    
    if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
      const faceId = indexResult.FaceRecords[0].Face.FaceId;
      const faceAttributes = indexResult.FaceRecords[0].FaceDetail;
      
      console.log(`✅ Face indexed successfully: ${faceId}`);
      console.log("Face attributes:", faceAttributes);
      
      // Save the face data to database
      await this.saveFaceToDatabase(userId, faceId, faceAttributes);
      
      // NEW STEP: Find and update matches for this new face in existing photos
      const matchResults = await this.findMatchesForNewFace(userId, faceId);
      console.log(`Processed matches for new face: found ${matchResults.matchCount} potential matches, updated ${matchResults.updatedPhotos} photos`);
      
      // Continue with searches for matches (original flow)
      console.log("Step 3: Searching for face matches using FaceId...");
      const matchingPhotos = await this.searchForFaceMatches(faceId);
      
      if (matchingPhotos.length === 0) {
        console.log("No matching photos found");
      } else {
        console.log(`Found ${matchingPhotos.length} matching photos`);
      }
      
      return {
        faceId: faceId,
        faceAttributes: faceAttributes,
        matchingPhotos: matchingPhotos,
        success: true
      };
    } else {
      console.log("❌ Failed to index face: No face records returned");
      return { error: "Failed to index face", success: false };
    }
  } catch (error) {
    console.error("❌ Error during face indexing:", error);
    return { error: error.message, success: false };
  }
} 