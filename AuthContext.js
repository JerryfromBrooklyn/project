// Add this import at the top of the file
import { Lambda } from './aws-config';

// Around line 110 where it says "[AUTH_CONTEXT] Sign-in successful"
console.log('[AUTH_CONTEXT] Sign-in successful');
// Update user state
updateUserState(userId);

// Add this right after it - these logs will definitely show up
console.log('🔍🔍🔍 DIRECT TEST - FIND EXACT SIGN-IN LOCATION');
console.log('🔍🔍🔍 User ID:', userId);
console.log('🔍🔍🔍 Attempting direct AWS call next');

// Check for new photo matches
console.log('[AUTH_CONTEXT] Checking for face matches');

console.log('🔥 [AUTH_CONTEXT] Making direct API call to check for matches');

// Use fetch API to call our endpoint
fetch(`/api/user-photos/${userId}/check-matches`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
})
.then(response => {
  console.log('🔥 [AUTH_CONTEXT] Got response from face match API:', response.status);
  return response.json();
})
.then(data => {
  console.log('🔥 [AUTH_CONTEXT] Face match data:', data);
  
  // Dispatch event to notify about results
  window.dispatchEvent(new CustomEvent('photo:match:update', {
    detail: { results: data }
  }));
  
  // If we need to update matches, do it in the background
  if (data && data.matchesUpdated) {
    console.log('🔥 [AUTH_CONTEXT] Found new matches, triggering update');
    
    // Send the update request in the background
    fetch(`/api/user-photos/${userId}/update-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    .then(response => response.json())
    .then(updateData => {
      console.log('🔥 [AUTH_CONTEXT] Update complete:', updateData);
      
      // Notify about the completed update
      if (updateData.matchesAdded > 0) {
        console.log(`🔥 [AUTH_CONTEXT] Added ${updateData.matchesAdded} new matches`);
        
        window.dispatchEvent(new CustomEvent('photo:match:update:complete', {
          detail: { results: updateData }
        }));
      }
    })
    .catch(error => {
      console.error('🔥 [AUTH_CONTEXT] Error updating matches:', error);
    });
  }
})
.catch(error => {
  console.error('🔥 [AUTH_CONTEXT] Error fetching face matches:', error);
}); 