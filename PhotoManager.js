// Find where photos are filtered for matches - likely in a function like processPhotos or applyFilters
// Add this line before the filtering happens:

// In the function where you process photos and filter for matches mode
// Look for code like this:
if (mode === 'matches') {
  // ... existing code ...
  
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