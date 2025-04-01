// Add this helper function to enhance face matching 
function enhancePhotoMatches(photos, currentUserId, currentUserFaceId) {
  console.log("[DEBUG] Strict direct matching only - inferred matching disabled");
  console.log(`[DEBUG] Using direct matching only for user: ${currentUserId}`);
  
  // Return photos as-is without adding inferred matches
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
  
  // Then continue with existing filtering, but modify to exclude inferred matches
  filteredPhotos = photos.filter(photo => 
    photo.matched_users && 
    photo.matched_users.some(match => 
      (match.userId === currentUser.id || match.user_id === currentUser.id) &&
      !match.inferred
    )
  );
  
  // ... existing code ...
}

// ... existing code ... 