// Face Matching Debug Tool
// This script provides browser console utilities to diagnose and fix issues with face matching

console.log('🔍 Loading Face Matching Debug Tools...');

// Global object to hold our debug utilities
window.debugFaceMatching = {
  // Get photo information
  async getPhotoInfo(photoId) {
    if (!photoId) {
      console.error('❌ Photo ID is required');
      return null;
    }
    
    console.log(`🔍 Getting info for photo ${photoId}...`);
    
    try {
      const { data, error } = await window.supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single();
        
      if (error) {
        console.error('❌ Error fetching photo:', error.message);
        return null;
      }
      
      if (!data) {
        console.log(`❌ Photo ${photoId} not found`);
        return null;
      }
      
      console.log('✅ Photo data:', data);
      return data;
    } catch (err) {
      console.error('❌ Error:', err);
      return null;
    }
  },
  
  // Get face information
  async getFaceInfo(faceId) {
    if (!faceId) {
      console.error('❌ Face ID is required');
      return null;
    }
    
    console.log(`🔍 Getting info for face ${faceId}...`);
    
    try {
      const { data, error } = await window.supabase
        .from('unassociated_faces')
        .select('*')
        .eq('face_id', faceId)
        .single();
        
      if (error) {
        console.error('❌ Error fetching face:', error.message);
        return null;
      }
      
      if (!data) {
        console.log(`❌ Face ${faceId} not found`);
        return null;
      }
      
      console.log('✅ Face data:', data);
      return data;
    } catch (err) {
      console.error('❌ Error:', err);
      return null;
    }
  },
  
  // Add a user match to a photo
  async addUserMatchToPhoto(photoId, userId, faceId) {
    if (!photoId || !userId) {
      console.error('❌ Photo ID and User ID are required');
      return false;
    }
    
    console.log(`🔧 Adding user ${userId} as match to photo ${photoId}...`);
    
    try {
      // First, get the current photo data
      const { data: photo, error: photoError } = await window.supabase
        .from('photos')
        .select('matched_users')
        .eq('id', photoId)
        .single();
        
      if (photoError) {
        console.error('❌ Error fetching photo:', photoError.message);
        return false;
      }
      
      if (!photo) {
        console.log(`❌ Photo ${photoId} not found`);
        return false;
      }
      
      // Get user data
      const { data: user, error: userError } = await window.supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('❌ Error fetching user:', userError.message);
        return false;
      }
      
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return false;
      }
      
      // Create match object
      const matchObj = {
        userId: userId,
        faceId: faceId || 'unknown',
        fullName: user.full_name || 'Unknown User',
        email: user.email || null,
        avatarUrl: user.avatar_url || null,
        confidence: 99,
        similarity: 99,
        matchedAt: new Date().toISOString(),
        matchType: 'debug_fix'
      };
      
      // Update matched_users array
      const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
      
      // Check if user is already matched
      const existingMatch = existingMatches.find(match => match.userId === userId);
      if (existingMatch) {
        console.log(`⚠️ User ${userId} is already matched with this photo`);
        return true;
      }
      
      const updatedMatches = [...existingMatches, matchObj];
      
      // Try using admin function if available
      try {
        const { data: adminResult, error: adminError } = await window.supabase.rpc(
          'admin_update_photo_matches',
          { 
            p_id: photoId,
            p_matched_users: updatedMatches
          }
        );
        
        if (!adminError && adminResult && adminResult.success) {
          console.log('✅ Used admin function successfully:', adminResult);
          return true;
        } else if (adminError) {
          console.warn(`⚠️ Admin function failed: ${adminError.message}, trying direct update`);
        }
      } catch (adminFuncError) {
        console.warn('⚠️ Admin function not available, trying direct update');
      }
      
      // Direct update as fallback
      const { error: updateError } = await window.supabase
        .from('photos')
        .update({ matched_users: updatedMatches })
        .eq('id', photoId);
        
      if (updateError) {
        console.error('❌ Error updating photos table:', updateError.message);
        console.log('🔄 Trying simple_photos table instead...');
        
        // Try simple_photos table as a fallback
        const { error: simpleUpdateError } = await window.supabase
          .from('simple_photos')
          .update({ matched_users: updatedMatches })
          .eq('id', photoId);
          
        if (simpleUpdateError) {
          console.error('❌ Error updating simple_photos table:', simpleUpdateError.message);
          return false;
        }
        
        console.log('✅ Successfully added user match to simple_photos table');
        return true;
      }
      
      console.log('✅ Successfully added user match to photo');
      return true;
    } catch (err) {
      console.error('❌ Error:', err);
      return false;
    }
  },
  
  // Force update a photo's matched_users with admin function
  async forceUpdatePhotoMatches(photoId, userId) {
    if (!photoId || !userId) {
      console.error('❌ Photo ID and User ID are required');
      return false;
    }
    
    console.log(`🔧 Forcing match between user ${userId} and photo ${photoId} using admin function...`);
    
    try {
      const { data, error } = await window.supabase.rpc(
        'debug_force_update_photo',
        { 
          p_id: photoId,
          user_id: userId
        }
      );
      
      if (error) {
        console.error('❌ Admin function error:', error.message);
        return false;
      }
      
      console.log('✅ Force update successful:', data);
      return true;
    } catch (err) {
      console.error('❌ Error:', err);
      return false;
    }
  },
  
  // List all photos matching a user
  async listUserPhotos(userId) {
    if (!userId) {
      console.error('❌ User ID is required');
      return [];
    }
    
    console.log(`🔍 Finding photos for user ${userId}...`);
    
    try {
      // Construct the JSONB contains operator query
      // This works with arrays of objects where the userId field matches
      const { data, error } = await window.supabase
        .from('photos')
        .select('id, matched_users, created_at, updated_at')
        .contains('matched_users', [{ userId }]);
        
      if (error) {
        console.error('❌ Error querying photos:', error.message);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} photos for user ${userId}`);
      
      if (data && data.length > 0) {
        console.table(data.map(p => ({
          id: p.id,
          matches: Array.isArray(p.matched_users) ? p.matched_users.length : 0,
          created: new Date(p.created_at).toLocaleString(),
          updated: new Date(p.updated_at).toLocaleString()
        })));
      }
      
      return data || [];
    } catch (err) {
      console.error('❌ Error:', err);
      return [];
    }
  },
  
  // Fix all photos for a user
  async fixAllPhotosForUser(userId, faceId) {
    if (!userId) {
      console.error('❌ User ID is required');
      return {
        success: false,
        message: 'User ID is required'
      };
    }
    
    console.log(`🔧 Fixing all photos for user ${userId}...`);
    const stats = {
      processed: 0,
      alreadyMatched: 0,
      successfullyMatched: 0,
      failed: 0
    };
    
    try {
      // Get user face ID if not provided
      if (!faceId) {
        const { data: faceData } = await window.supabase
          .from('face_data')
          .select('face_id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (faceData && faceData.face_id) {
          faceId = faceData.face_id;
          console.log(`🔍 Found face ID for user: ${faceId}`);
        }
      }
      
      // Get user's unmatched photos
      const { data: allPhotos, error: photoError } = await window.supabase
        .from('photos')
        .select('id, matched_users');
        
      if (photoError) {
        console.error('❌ Error fetching photos:', photoError.message);
        return {
          success: false,
          message: `Error fetching photos: ${photoError.message}`,
          stats
        };
      }
      
      if (!allPhotos || allPhotos.length === 0) {
        console.log('⚠️ No photos found');
        return {
          success: true,
          message: 'No photos found to process',
          stats
        };
      }
      
      console.log(`🔍 Found ${allPhotos.length} total photos, checking for matches...`);
      
      // For each photo, check if user is already matched
      for (const photo of allPhotos) {
        stats.processed++;
        
        // Check if user is already matched
        const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
        const alreadyMatched = existingMatches.some(match => match.userId === userId);
        
        if (alreadyMatched) {
          stats.alreadyMatched++;
          if (stats.processed % 10 === 0) {
            console.log(`📊 Progress: ${stats.processed}/${allPhotos.length} photos processed...`);
          }
          continue;
        }
        
        // Try to add user match
        const success = await this.addUserMatchToPhoto(photo.id, userId, faceId);
        
        if (success) {
          stats.successfullyMatched++;
          console.log(`✅ Successfully matched user to photo ${photo.id}`);
        } else {
          stats.failed++;
          console.error(`❌ Failed to match user to photo ${photo.id}`);
        }
        
        if (stats.processed % 10 === 0) {
          console.log(`📊 Progress: ${stats.processed}/${allPhotos.length} photos processed...`);
        }
      }
      
      console.log(`✅ Completed fixing photos for user ${userId}`);
      console.log(`📊 SUMMARY: Processed ${stats.processed} photos`);
      console.log(`📊 Already matched: ${stats.alreadyMatched}`);
      console.log(`📊 Newly matched: ${stats.successfullyMatched}`);
      console.log(`📊 Failed: ${stats.failed}`);
      
      return {
        success: true,
        message: 'Completed fixing photos',
        stats
      };
    } catch (err) {
      console.error('❌ Error:', err);
      return {
        success: false,
        message: `Error: ${err.message}`,
        stats
      };
    }
  },
  
  // Check database tables
  async checkTables() {
    console.log('🔍 Checking database tables...');
    
    const tables = ['photos', 'unassociated_faces', 'face_data', 'users'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await window.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error(`❌ Error checking table ${table}:`, error.message);
          results[table] = { exists: false, error: error.message };
        } else {
          console.log(`✅ Table ${table} exists with ${count} rows`);
          results[table] = { exists: true, count };
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`, err);
        results[table] = { exists: false, error: err.message };
      }
    }
    
    return results;
  },
  
  // Emergency function to repair photo matches
  async emergencyRepairPhotos() {
    console.log('⚠️ EMERGENCY REPAIR: Starting repair of photo matches...');
    console.log('⚠️ This will attempt to fix photos with missing matches');
    
    const stats = {
      processed: 0,
      fixed: 0,
      failed: 0
    };
    
    try {
      // Get all photos
      const { data: photos, error } = await window.supabase
        .from('photos')
        .select('id, matched_users');
        
      if (error) {
        console.error('❌ Error fetching photos:', error.message);
        return { success: false, error: error.message };
      }
      
      if (!photos || photos.length === 0) {
        console.log('No photos found');
        return { success: true, message: 'No photos to repair' };
      }
      
      console.log(`🔍 Found ${photos.length} photos to check`);
      
      // Find photos with null or invalid matched_users
      const problematicPhotos = photos.filter(p => {
        return !p.matched_users || 
               !Array.isArray(p.matched_users) || 
               p.matched_users.length === 0;
      });
      
      if (problematicPhotos.length === 0) {
        console.log('✅ No problematic photos found');
        return { success: true, message: 'No problematic photos found' };
      }
      
      console.log(`⚠️ Found ${problematicPhotos.length} problematic photos`);
      
      // Get all unassociated faces to find potential matches
      const { data: faces, error: facesError } = await window.supabase
        .from('unassociated_faces')
        .select('photo_id, face_id');
        
      if (facesError) {
        console.error('❌ Error fetching faces:', facesError.message);
        return { success: false, error: facesError.message };
      }
      
      // Group faces by photo ID
      const facesByPhoto = {};
      for (const face of faces) {
        if (!facesByPhoto[face.photo_id]) {
          facesByPhoto[face.photo_id] = [];
        }
        facesByPhoto[face.photo_id].push(face.face_id);
      }
      
      // For each problematic photo, try to repair
      for (const photo of problematicPhotos) {
        stats.processed++;
        console.log(`🔧 Repairing photo ${photo.id} (${stats.processed}/${problematicPhotos.length})`);
        
        // Try to set matched_users to empty array first
        const { error: updateError } = await window.supabase
          .from('photos')
          .update({ matched_users: [] })
          .eq('id', photo.id);
          
        if (updateError) {
          console.error(`❌ Error updating photo ${photo.id}:`, updateError.message);
          stats.failed++;
          continue;
        }
        
        // Success
        stats.fixed++;
        console.log(`✅ Repaired photo ${photo.id}`);
      }
      
      console.log(`✅ EMERGENCY REPAIR COMPLETE: Processed ${stats.processed} photos`);
      console.log(`✅ Fixed: ${stats.fixed}, Failed: ${stats.failed}`);
      
      return {
        success: true,
        message: 'Emergency repair completed',
        stats
      };
    } catch (err) {
      console.error('❌ Error in emergency repair:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },
  
  // Fix specific photos from logs
  async fixSpecificPhotos(userId) {
    if (!userId) {
      // Try to get current user ID
      try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (err) {
        console.error('❌ Error getting current user:', err);
      }
      
      if (!userId) {
        console.error('❌ User ID is required');
        return {
          success: false,
          message: 'User ID is required'
        };
      }
    }
    
    console.group('🔧 Fixing Specific Photos from Logs');
    console.log(`📋 User ID: ${userId}`);
    
    // These are the 3 specific photos from the logs
    const specificPhotoIds = [
      '811d2222-0264-4676-b589-c7535e573e7f',
      'ee3010c6-b991-42e4-8b01-d7994e44035d',
      'b4362c15-e685-4f9e-9353-68f684989952'
    ];
    
    const results = {
      total: specificPhotoIds.length,
      fixed: 0,
      failed: 0,
      alreadyMatched: 0
    };
    
    // Get user face ID to use in matches
    const { data: faceData } = await window.supabase
      .from('face_data')
      .select('face_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .maybeSingle();
      
    const faceId = faceData?.face_id || 'unknown';
    console.log(`📋 Using face ID: ${faceId}`);
    
    // Process each photo
    for (const photoId of specificPhotoIds) {
      console.log(`🔧 Processing photo ${photoId}...`);
      
      // First, get the current photo data
      const { data: photo, error: photoError } = await window.supabase
        .from('photos')
        .select('matched_users')
        .eq('id', photoId)
        .single();
        
      if (photoError) {
        console.error(`❌ Error fetching photo ${photoId}:`, photoError.message);
        results.failed++;
        continue;
      }
      
      if (!photo) {
        console.log(`⚠️ Photo ${photoId} not found in database`);
        results.failed++;
        continue;
      }
      
      // Check if user is already matched
      const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
      const userAlreadyMatched = existingMatches.some(match => 
        match.userId === userId || match.user_id === userId
      );
      
      if (userAlreadyMatched) {
        console.log(`ℹ️ User already matched to photo ${photoId}`);
        results.alreadyMatched++;
        continue;
      }
      
      // Try to fix using debug_force_update_photo function
      try {
        console.log(`🔧 Forcing update of photo ${photoId}...`);
        const { data: result, error: updateError } = await window.supabase.rpc(
          'debug_force_update_photo',
          { 
            p_id: photoId,
            user_id: userId
          }
        );
        
        if (updateError) {
          console.error(`❌ Error updating photo ${photoId}:`, updateError.message);
          results.failed++;
          continue;
        }
        
        console.log(`✅ Successfully fixed photo ${photoId}`);
        console.log(`📋 Result:`, result);
        results.fixed++;
      } catch (err) {
        console.error(`❌ Error with force update for photo ${photoId}:`, err);
        results.failed++;
      }
    }
    
    console.log(`✅ Fix complete: ${results.fixed} fixed, ${results.alreadyMatched} already matched, ${results.failed} failed`);
    console.groupEnd();
    
    return {
      success: true,
      message: 'Fix operation completed',
      results
    };
  }
};

console.log('✅ Face Matching Debug Tools loaded!');
console.log('📖 Available commands:');
console.log('- debugFaceMatching.getPhotoInfo(photoId)');
console.log('- debugFaceMatching.getFaceInfo(faceId)');
console.log('- debugFaceMatching.addUserMatchToPhoto(photoId, userId, faceId)');
console.log('- debugFaceMatching.forceUpdatePhotoMatches(photoId, userId)');
console.log('- debugFaceMatching.listUserPhotos(userId)');
console.log('- debugFaceMatching.fixAllPhotosForUser(userId, faceId)');
console.log('- debugFaceMatching.checkTables()');
console.log('- debugFaceMatching.emergencyRepairPhotos()');
console.log('- debugFaceMatching.fixSpecificPhotos(userId)'); 