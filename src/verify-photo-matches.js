// Verification script for photo matching issues
console.log('🔍 Running Photo Matching Verification...');

(async function() {
  // Step 1: Check if we're authenticated
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('❌ Not authenticated! Please sign in first.');
    return;
  }
  
  console.log(`📋 Current user ID: ${user.id}`);
  
  // Step 2: Check specific photos from logs
  const specificPhotoIds = [
    '811d2222-0264-4676-b589-c7535e573e7f', 
    'ee3010c6-b991-42e4-8b01-d7994e44035d', 
    'b4362c15-e685-4f9e-9353-68f684989952'
  ];
  
  console.group('🔍 Checking Specific Photos');
  for (const photoId of specificPhotoIds) {
    try {
      console.log(`📷 Checking photo ${photoId}...`);
      const { data, error } = await window.supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single();
        
      if (error) {
        console.error(`❌ Error fetching photo ${photoId}:`, error.message);
        continue;
      }
      
      if (!data) {
        console.log(`⚠️ Photo ${photoId} not found in database`);
        continue;
      }
      
      console.log(`✅ Found photo ${photoId}`);
      console.log(`📋 matched_users:`, data.matched_users);
      
      // Check if user is in matched_users
      const matchedUsers = data.matched_users || [];
      if (!Array.isArray(matchedUsers)) {
        console.error(`❌ matched_users is not an array for photo ${photoId}:`, matchedUsers);
        continue;
      }
      
      const userMatch = matchedUsers.find(match => 
        match.userId === user.id || match.user_id === user.id
      );
      
      if (userMatch) {
        console.log(`✅ User is matched to photo ${photoId} with:`, userMatch);
      } else {
        console.log(`❌ User is NOT matched to photo ${photoId}`);
      }
    } catch (err) {
      console.error(`❌ Error processing photo ${photoId}:`, err);
    }
  }
  console.groupEnd();
  
  // Step 3: Check user's face registration
  console.group('🔍 Checking Face Registration');
  try {
    const { data: faceData, error } = await window.supabase
      .from('face_data')
      .select('face_id, quality_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching face data:', error.message);
    } else if (!faceData?.length) {
      console.log('⚠️ No face registration found for current user');
    } else {
      console.log(`✅ Found ${faceData.length} registered faces`);
      faceData.forEach((face, index) => {
        console.log(`👤 Face #${index+1}: ${face.face_id} (Score: ${face.quality_score}, Registered: ${new Date(face.created_at).toLocaleString()})`);
      });
    }
  } catch (err) {
    console.error('❌ Error checking face registration:', err);
  }
  console.groupEnd();
  
  // Step 4: Check "My Photos" filtering logic
  console.group('🔍 Checking "My Photos" Filtering Logic');
  try {
    // This replicates the filtering logic from PhotoManager.js
    const { data: allPhotos, error } = await window.supabase
      .from('photos')
      .select('id, matched_users');
      
    if (error) {
      console.error('❌ Error fetching photos:', error.message);
    } else {
      console.log(`📊 Found ${allPhotos.length} total photos`);
      
      // Apply the same filtering logic used in the app
      const matchedPhotos = allPhotos.filter(photo => {
        const matchedUsers = photo.matched_users || [];
        return matchedUsers.some(match => match.userId === user.id || match.user_id === user.id);
      });
      
      console.log(`📊 After filtering: ${matchedPhotos.length} photos match current user`);
      
      if (matchedPhotos.length > 0) {
        console.log('📋 Matched photos:', matchedPhotos.map(p => p.id));
      } else {
        console.log('⚠️ No photos match current user after filtering');
        
        // Check format issues in a sample of photos
        const samplePhotos = allPhotos.slice(0, 5);
        console.log('🔍 Examining sample photos for format issues:');
        samplePhotos.forEach(photo => {
          console.log(`Photo ${photo.id} matched_users:`, photo.matched_users);
        });
      }
    }
  } catch (err) {
    console.error('❌ Error checking "My Photos" filtering:', err);
  }
  console.groupEnd();
  
  console.log('✅ Verification complete. Add this script to your page and run it in the console to see results.');
})(); 