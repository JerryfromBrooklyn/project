// src/services/PhotoService.ts

// TODO: Implement backend endpoint call to get a download URL (e.g., S3 pre-signed URL)

import { updatePhotoVisibility } from './userVisibilityService';

const getDownloadUrlFromBackend = async (photoId: string): Promise<string> => {
    console.warn(`PhotoService: getDownloadUrlFromBackend called for ${photoId} - Needs implementation!`);
    // Placeholder: Replace with actual fetch to your backend API
    // const response = await fetch(`/api/photos/${photoId}/download-url`);
    // if (!response.ok) throw new Error('Failed to get download URL');
    // const { downloadUrl } = await response.json();
    // return downloadUrl;
    
    // Dummy URL for now:
    return `https://your-s3-bucket.s3.amazonaws.com/photos/${photoId}.jpg?presigned_token=dummy`;
};

export const PhotoService = {
    /**
     * Gets a temporary URL to download the photo.
     * In a real implementation, this would likely call a backend endpoint
     * which generates and returns an S3 pre-signed GET URL.
     */
    downloadPhoto: async (photoId: string): Promise<string> => {
        try {
            const downloadUrl = await getDownloadUrlFromBackend(photoId);
            // For direct S3 URLs or simple URLs, just return.
            // If the backend returns raw file data (not recommended for large files),
            // you might need to create a Blob URL here:
            // const blob = await response.blob();
            // return URL.createObjectURL(blob);
            return downloadUrl;
        } catch (error) {
            console.error(`Error getting download URL for photo ${photoId}:`, error);
            throw new Error(`Could not get download URL for photo ${photoId}.`);
        }
    },

    // Add other photo-related service functions here if needed
    // e.g., uploadPhotoMetadata, getPhotoDetails, etc.

    // In the uploadPhoto method, after face matching logic
    // Look for a section around line ~290 where highConfidenceMatches is used

    // Filter matches by confidence threshold
    const highConfidenceMatches = matches.filter(match => match.confidence >= FACE_MATCH_THRESHOLD);
    console.log('High confidence matches:', highConfidenceMatches);

    if (highConfidenceMatches.length > 0) {
      // Update query to handle potential non-UUID formats in userId
      const userIds = highConfidenceMatches.map(match => match.userId)
        .filter(id => !id.startsWith('photo_') && !id.startsWith('p'))
        .filter(id => id && id.length > 10); // Basic validation
      
      if (userIds.length > 0) {
        console.log('Querying for user details with IDs:', userIds);
        
        // Get user details for matches
        const { data: matchedUsersData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            avatar_url,
            user_profiles (
              metadata
            )
          `)
          .in('id', userIds);

        if (userError) {
          console.error('Error fetching matched users:', userError);
        } else if (matchedUsersData && matchedUsersData.length > 0) {
          console.log('Matched users data:', matchedUsersData);
          
          // Update faces array with matched user IDs and confidence scores
          // and build matched_users array for database storage
          matched_users = highConfidenceMatches
            .filter(match => !match.userId.startsWith('photo_') && !match.userId.startsWith('p'))
            .filter(match => match.userId && match.userId.length > 10)
            .map(match => {
              const userData = matchedUsersData.find(u => u.id === match.userId);
              if (!userData) return null;
            
              // Find face index for this match
              const faceIndex = faces.findIndex(face => face.faceId === match.faceId);
              if (faceIndex !== -1) {
                faces[faceIndex].userId = match.userId;
                faces[faceIndex].confidence = match.confidence;
              }
            
              // Create matched_users entry  
              return {
                userId: match.userId,
                fullName: userData.full_name || userData?.user_profiles?.[0]?.metadata?.full_name || 'Unknown User',
                avatarUrl: userData.avatar_url || userData?.user_profiles?.[0]?.metadata?.avatar_url,
                confidence: match.confidence
              };
            })
            .filter(Boolean) as MatchedUser[]; // Remove null entries
            
          // Create visibility records for all matched users
          try {
            for (const matchedUser of matched_users) {
              await updatePhotoVisibility(matchedUser.userId, [photoId], 'VISIBLE');
              console.log(`Set visibility for photo ${photoId} to VISIBLE for matched user ${matchedUser.userId}`);
            }
          } catch (visibilityError) {
            console.error("Error setting visibility for matched users:", visibilityError);
          }
        }
      }
    }
}; 