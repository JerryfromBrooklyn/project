/**
 * Photo Matching Debug Tools
 * 
 * This file contains browser-friendly debugging functions to help troubleshoot
 * face matching issues. Copy these functions into your browser console to use them.
 */

// Expose the debugging functions globally
window.photoMatchingDebug = {
  /**
   * Checks if a specific photo exists and displays its metadata
   * @param {string} photoId - The UUID of the photo to check
   */
  async checkPhoto(photoId) {
    console.group(`🔍 Checking photo ${photoId}...`);
    try {
      const { data: result, error } = await window.supabase.rpc(
        'debug_check_photo',
        { p_id: photoId }
      );
      
      if (error) {
        console.error('❌ Error checking photo:', error);
        console.error('Details:', JSON.stringify(error));
      } else if (!result || !result.success) {
        console.warn('⚠️ Check failed:', result?.error || 'Unknown error');
      } else {
        console.log('✅ Photo exists!');
        console.log('📊 Photo data:', result.data);
        console.log(`📊 Matched users: ${result.matched_users_count} (${result.matched_users_type})`);
        
        if (result.data.matched_users && result.matched_users_count > 0) {
          console.table(result.data.matched_users);
        }
      }
    } catch (err) {
      console.error('❌ Exception checking photo:', err);
    }
    console.groupEnd();
  },

  /**
   * Force updates a photo with a user match (emergency repair)
   * @param {string} photoId - The UUID of the photo to update
   * @param {string} userId - The UUID of the user to add as a match
   */
  async forceMatchUser(photoId, userId) {
    console.group(`🛠️ Force matching user ${userId} to photo ${photoId}...`);
    try {
      // First check if the user exists
      const { data: userData, error: userError } = await window.supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('❌ Error checking user:', userError);
        console.groupEnd();
        return;
      }
      
      console.log('✅ User found:', userData.full_name || userData.email || userId);
      
      // Now force the update
      const { data: result, error } = await window.supabase.rpc(
        'debug_force_update_photo',
        { 
          p_id: photoId,
          user_id: userId
        }
      );
      
      if (error) {
        console.error('❌ Error updating photo:', error);
      } else if (!result || !result.success) {
        console.warn('⚠️ Update failed:', result?.error || 'Unknown error');
      } else {
        console.log('✅ Photo updated successfully!');
        console.log('📊 Updated photo data:', result.data);
      }
    } catch (err) {
      console.error('❌ Exception updating photo:', err);
    }
    console.groupEnd();
  },

  /**
   * Check all photos with your face in them
   */
  async findMyPhotos() {
    console.group('🔍 Finding photos with your face...');
    try {
      // Get current user ID
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Error getting current user:', userError || 'Not logged in');
        console.groupEnd();
        return;
      }
      
      console.log('🧑 Current user:', user.id);
      
      // Try direct JSONB contains query
      console.log('🔍 Searching for matching photos - Method 1 (JSONB contains)...');
      const { data: directMatches, error: directError } = await window.supabase
        .from('photos')
        .select('id, storage_path, public_url, matched_users')
        .contains('matched_users', [{ userId: user.id }]);
        
      if (directError) {
        console.error('❌ Direct search error:', directError);
      } else {
        console.log(`✅ Direct search found ${directMatches?.length || 0} photos`);
        if (directMatches?.length > 0) {
          console.table(directMatches.map(p => ({ 
            id: p.id, 
            url: p.public_url || p.storage_path,
            matches: Array.isArray(p.matched_users) ? p.matched_users.length : 'not an array'
          })));
        }
      }
      
      // Try a text search (fallback)
      console.log('🔍 Searching for matching photos - Method 2 (text contains)...');
      const { data: textMatches, error: textError } = await window.supabase.rpc(
        'admin_run_sql',
        { sql: `SELECT id, matched_users FROM photos WHERE matched_users::text LIKE '%${user.id}%' LIMIT 50` }
      );
      
      if (textError) {
        console.error('❌ Text search error:', textError);
      } else {
        console.log(`✅ Text search found ${textMatches?.length || 0} photos`);
        if (textMatches?.length > 0) {
          console.table(textMatches);
        }
      }
      
      // Check database structure
      console.log('ℹ️ Getting photos table schema...');
      const { data: schema, error: schemaError } = await window.supabase.rpc(
        'admin_run_sql',
        { sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'photos'` }
      );
      
      if (schemaError) {
        console.error('❌ Schema query error:', schemaError);
      } else {
        console.log('📋 Photos table schema:');
        console.table(schema);
      }
      
      // Check a sample of all photos to see matched_users structure
      console.log('🔍 Checking sample photos for matched_users structure...');
      const { data: samplePhotos, error: sampleError } = await window.supabase
        .from('photos')
        .select('id, matched_users')
        .limit(5);
        
      if (sampleError) {
        console.error('❌ Sample query error:', sampleError);
      } else if (samplePhotos?.length > 0) {
        for (const photo of samplePhotos) {
          console.log(`📸 Photo ${photo.id}:`);
          console.log(` - matched_users type: ${typeof photo.matched_users}`);
          console.log(` - is array: ${Array.isArray(photo.matched_users)}`);
          console.log(` - value: ${JSON.stringify(photo.matched_users)}`);
        }
      }
    } catch (err) {
      console.error('❌ Exception finding photos:', err);
    }
    console.groupEnd();
  },
  
  /**
   * Emergency repair of face matching records
   */
  async emergencyRepair() {
    console.group('🚨 EMERGENCY REPAIR OF FACE MATCHING');
    try {
      // Get current user
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Error getting current user:', userError || 'Not logged in');
        console.groupEnd();
        return;
      }
      
      console.log('🧑 Current user:', user.id);
      
      // Get the user's face ID
      console.log('🔍 Getting your face ID...');
      const { data: faceData, error: faceError } = await window.supabase
        .from('user_faces')
        .select('face_id')
        .eq('user_id', user.id)
        .single();
        
      if (faceError || !faceData?.face_id) {
        console.error('❌ Error getting face ID:', faceError || 'No face registered');
        console.groupEnd();
        return;
      }
      
      console.log('😊 Your face ID:', faceData.face_id);
      
      // Find photos in unassociated_faces that match your face ID
      console.log('🔍 Finding photos with your face using unassociated_faces table...');
      const { data: matchingPhotos, error: matchError } = await window.supabase
        .from('unassociated_faces')
        .select('photo_id, face_id')
        .eq('face_id', faceData.face_id);
        
      if (matchError) {
        console.error('❌ Error finding matching photos:', matchError);
      } else {
        console.log(`✅ Found ${matchingPhotos?.length || 0} photos with your face`);
        
        // Fix each photo
        if (matchingPhotos?.length > 0) {
          console.log('🛠️ Repairing photos...');
          
          const results = {
            success: 0,
            failure: 0
          };
          
          for (const match of matchingPhotos) {
            console.log(`🔄 Repairing photo ${match.photo_id}...`);
            
            try {
              const { data: result, error } = await window.supabase.rpc(
                'debug_force_update_photo',
                { 
                  p_id: match.photo_id,
                  user_id: user.id
                }
              );
              
              if (error || !result?.success) {
                console.error(`❌ Failed to repair photo ${match.photo_id}:`, error || (result?.error || 'Unknown error'));
                results.failure++;
              } else {
                console.log(`✅ Successfully repaired photo ${match.photo_id}`);
                results.success++;
              }
            } catch (err) {
              console.error(`❌ Exception repairing photo ${match.photo_id}:`, err);
              results.failure++;
            }
          }
          
          console.log(`🏁 Repair completed: ${results.success} successful, ${results.failure} failed`);
        }
      }
      
      // Also check AWS Rekognition matches
      console.log('🔍 Checking for additional AWS Rekognition matches...');
      console.log('⚠️ This approach can only be done from server-side code.');
      console.log('💡 To perform this check, you should:');
      console.log('1. Run the FaceIndexingService.searchFacesByFaceId function server-side');
      console.log('2. Process all matches with photo- prefix in their ExternalImageId');
      console.log('3. Extract the photo IDs and update them using the debug_force_update_photo function');
      
    } catch (err) {
      console.error('❌ Exception during emergency repair:', err);
    }
    console.groupEnd();
  },
  
  /**
   * Check for the correct database functions
   */
  async verifyFunctions() {
    console.group('🔍 Verifying SQL Functions');
    try {
      // Check for admin_update_photo_matches function
      const { data: updateFn, error: updateError } = await window.supabase.rpc(
        'function_exists',
        { function_name: 'admin_update_photo_matches' }
      );
      
      console.log(`Function admin_update_photo_matches exists: ${updateFn ? '✅ YES' : '❌ NO'}`);
      if (updateError) console.error('Error checking function:', updateError);
      
      // Check for debug functions
      const { data: debugFn, error: debugError } = await window.supabase.rpc(
        'function_exists',
        { function_name: 'debug_force_update_photo' }
      );
      
      console.log(`Function debug_force_update_photo exists: ${debugFn ? '✅ YES' : '❌ NO'}`);
      if (debugError) console.error('Error checking function:', debugError);
      
      // Test a simple admin_run_sql call
      const { data: testResult, error: testError } = await window.supabase.rpc(
        'admin_run_sql',
        { sql: 'SELECT 1 as test' }
      );
      
      console.log(`admin_run_sql test: ${testError ? '❌ FAILED' : '✅ SUCCEEDED'}`);
      if (testError) console.error('Test error:', testError);
      else console.log('Test result:', testResult);
      
    } catch (err) {
      console.error('❌ Exception during function verification:', err);
    }
    console.groupEnd();
  }
};

console.log(`
🔧 Photo Matching Debug Tools loaded! Available commands:

1. photoMatchingDebug.checkPhoto(photoId)
   - Check a specific photo's details

2. photoMatchingDebug.forceMatchUser(photoId, userId)
   - Force add a user match to a photo

3. photoMatchingDebug.findMyPhotos()
   - Find all photos containing your face

4. photoMatchingDebug.emergencyRepair()
   - EMERGENCY: Try to repair all matching records
   
5. photoMatchingDebug.verifyFunctions()
   - Check if the required SQL functions exist

Example: photoMatchingDebug.emergencyRepair()
`); 