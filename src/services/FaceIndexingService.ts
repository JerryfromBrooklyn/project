private static async searchFacesByFaceId(faceId: string, userId: string): Promise<string[]> {
  try {
    console.log(`Searching for faces matching FaceId: ${faceId}`);
    
    // Use SearchFaces API (which is more efficient than SearchFacesByImage)
    const command = new SearchFacesCommand({
      CollectionId: this.COLLECTION_ID,
      FaceId: faceId,
      FaceMatchThreshold: FACE_MATCH_THRESHOLD,
      MaxFaces: 150 // Set high to get all possible matches in one call
    });
    
    const response = await rekognitionClient.send(command);
    
    if (!response.FaceMatches?.length) {
      console.log('No matching faces found');
      return [];
    }
    
    console.log(`Found ${response.FaceMatches.length} matching faces in AWS collection`);
    
    // ... rest of existing code ...

    // For each photo, check if the user is already matched
    const photosToUpdate = matchingPhotos.filter(photo => {
      if (!Array.isArray(photo.matched_users)) return true; // If no matched_users, definitely need to update
      return !photo.matched_users.some((match: any) => match.userId === userId);
    });
    
    if (photosToUpdate.length === 0) {
      console.log('User already matched with all photos');
      return [];
    }
    
    console.log(`Found ${photosToUpdate.length} photos to update with new match`);
    
    // Get user data for the match
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        user_profiles (
          metadata
        )
      `)
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.log('User data not found:', userError);
      return [];
    }
    
    // Import the visibility service
    const { updatePhotoVisibility } = await import('./userVisibilityService');
    
    // Update each photo with the new match
    const updatedPhotoIds: string[] = [];
    
    for (const photo of photosToUpdate) {
      // ... existing update code ...
      
      const { error: updateError } = await supabase
        .from('photos')
        .update({ matched_users: updatedMatches })
        .eq('id', photo.id);
      
      if (!updateError) {
        updatedPhotoIds.push(photo.id);
        console.log(`Successfully updated photo ${photo.id} with new user match`);
        
        // Also set the visibility of this photo to VISIBLE for the matched user
        try {
          await updatePhotoVisibility(userId, [photo.id], 'VISIBLE');
          console.log(`Successfully set visibility of photo ${photo.id} to VISIBLE for user ${userId}`);
        } catch (visibilityError) {
          console.error(`Error setting visibility for photo ${photo.id}:`, visibilityError);
        }
      } else {
        console.error(`Error updating photo ${photo.id}:`, updateError);
      }
    }
    
    return updatedPhotoIds;
  } catch (error) {
    console.error('Error searching faces by FaceId:', error);
    return [];
  }
} 