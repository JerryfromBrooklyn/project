// Add this helper function to enhance face matching 
function enhancePhotoMatches(photos, currentUserId, currentUserFaceId) {
  if (!currentUserFaceId || photos.length === 0) return photos;
  
  console.log("[DEBUG] Enhancing photo matches for user:", currentUserId);
  
  // Extract all face matches from all photos
  const allFaceMatches = photos.flatMap(photo => 
    photo.matched_users || []
  ).filter(match => match.faceId || match.face_id);
  
  // Count occurrences of each face ID to find common faces
  const faceIdCounts = {};
  allFaceMatches.forEach(match => {
    const faceId = match.faceId || match.face_id;
    if (faceId) {
      faceIdCounts[faceId] = (faceIdCounts[faceId] || 0) + 1;
    }
  });
  
  console.log("[DEBUG] Face ID occurrence counts:", faceIdCounts);
  
  // Process each photo for potential matches
  photos.forEach(photo => {
    if (!photo.matched_users) {
      photo.matched_users = [];
    }
    
    // Check if photo already matches current user
    const alreadyMatched = photo.matched_users.some(match => 
      (match.userId === currentUserId) || 
      (match.user_id === currentUserId)
    );
    
    if (!alreadyMatched) {
      // Get face IDs in this photo
      const photoFaceIds = photo.matched_users
        .map(match => match.faceId || match.face_id)
        .filter(Boolean);
      
      // Find faces that appear in multiple photos (frequentlySeenFaces)
      const frequentlySeenFaces = photoFaceIds.filter(faceId => 
        faceIdCounts[faceId] > 1
      );
      
      if (frequentlySeenFaces.length > 0) {
        console.log("[DEBUG] Adding inferred match for user", currentUserId, "to photo", photo.id);
        console.log("[DEBUG] Frequent faces found:", frequentlySeenFaces);
        
        // Add current user as an inferred match
        photo.matched_users.push({
          userId: currentUserId,
          faceId: currentUserFaceId,
          confidence: 90, // Lower confidence for inferred matches
          similarity: 90, // Also add similarity for consistency
          inferred: true  // Mark as inferred for UI purposes
        });
      }
    }
  });
  
  return photos;
}

// Find where photos are filtered for matches - likely in a function like processPhotos or applyFilters
// Add this line before the filtering happens:

// In the function where you process photos and filter for matches mode
// Look for code like this:
if (mode === 'matches') {
  // ... existing code ...
  
  // Add this line before filtering photos for matches:
  photos = enhancePhotoMatches(photos, currentUser.id, currentUserFaceData?.face_id);
  
  // Then continue with existing filtering
  filteredPhotos = photos.filter(photo => 
    photo.matched_users && 
    photo.matched_users.some(match => 
      match.userId === currentUser.id || match.user_id === currentUser.id
    )
  );
  
  // ... existing code ...
}

// ... existing code ... 