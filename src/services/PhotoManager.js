/**
 * Safely query the Supabase database, handling common errors
 * @param {string} table - Table name to query
 * @param {Function} queryFn - Function that performs the actual query
 * @param {string} errorMessage - Error message to show on failure
 * @returns {Promise<Object>} - Query result or safe fallback
 */
const safeDbQuery = async (table, queryFn, errorMessage = 'Database query failed') => {
  try {
    // First check if table exists (in case DB schema is missing)
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema_tables')
      .select('table_name')
      .eq('table_name', table)
      .limit(1);

    if (tablesError) {
      console.warn(`[DB-SAFE] Error checking if table ${table} exists:`, tablesError);
      // Continue anyway, the query might still work
    } else if (!tablesData || tablesData.length === 0) {
      console.warn(`[DB-SAFE] Table ${table} might not exist in the database`);
      // Continue anyway, the query might still work with RLS or schema differences
    }

    // Perform the actual query
    const result = await queryFn();

    // Basic validation of result
    if (!result) {
      console.error(`[DB-SAFE] Query returned no result for table ${table}`);
      return { data: null, error: new Error('No result from query') };
    }

    return result;
  } catch (error) {
    console.error(`[DB-SAFE] ${errorMessage}:`, error);
    // Return a safe, empty response that won't break the application
    return { data: null, error: { message: errorMessage, originalError: error } };
  }
};

/**
 * Fetch user photos using multiple strategies for reliability
 */
const fetchUserPhotos = async (userId, mode = 'upload') => {
  const usesUploadedPhotos = mode === 'upload';
  const usesMatchedPhotos = mode === 'matches';
  const logPrefix = usesUploadedPhotos ? '[MY-PHOTOS]' : '[MATCHED-PHOTOS]';

  console.log(`${logPrefix} Fetching photos for user ${userId} in ${mode} mode`);

  try {
    // Strategy 1: Try RPC functions first (most reliable)
    try {
      const funcName = usesUploadedPhotos ? 'get_user_photos' : 'get_matched_photos_for_user';
      console.log(`${logPrefix} Trying RPC function: ${funcName}`);
      
      const { data, error } = await supabase.rpc(funcName, { user_id_param: userId });
      
      if (error) {
        console.warn(`${logPrefix} RPC function failed:`, error);
      } else if (data && data.length > 0) {
        console.log(`${logPrefix} Successfully fetched ${data.length} photos via RPC`);
        return data;
      } else {
        console.log(`${logPrefix} No photos found via RPC function`);
      }
    } catch (rpcError) {
      console.warn(`${logPrefix} Error calling RPC function:`, rpcError);
    }

    // Strategy 2: Try direct database query
    try {
      if (usesUploadedPhotos) {
        console.log(`${logPrefix} Trying direct photos table query`);
        
        const { data, error } = await safeDbQuery('photos', () => 
          supabase
            .from('photos')
            .select('*')
            .eq('uploaded_by', userId)
            .order('created_at', { ascending: false })
        );
        
        if (error) {
          console.warn(`${logPrefix} Direct query failed:`, error);
        } else if (data && data.length > 0) {
          console.log(`${logPrefix} Successfully fetched ${data.length} photos via direct query`);
          return data;
        }
      } else {
        // For matched photos, try text search
        console.log(`${logPrefix} Trying matched_users LIKE query`);
        
        // Due to different DB setups, we need to try multiple approaches
        const approaches = [
          // Approach 1: JSONB containment with text pattern
          async () => {
            const { data, error } = await safeDbQuery('photos', () =>
              supabase
                .from('photos')
                .select('*')
                .filter('matched_users::text', 'ilike', `%"userId":"${userId}"%`)
                .order('created_at', { ascending: false })
            );
            return { data, error };
          },
          
          // Approach 2: Alternative text pattern
          async () => {
            const { data, error } = await safeDbQuery('photos', () =>
              supabase
                .from('photos')
                .select('*')
                .filter('matched_users::text', 'ilike', `%"user_id":"${userId}"%`)
                .order('created_at', { ascending: false })
            );
            return { data, error };
          },
          
          // Approach 3: Get all and filter client-side
          async () => {
            const { data, error } = await safeDbQuery('photos', () =>
              supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false })
            );
            
            if (error || !data) return { data: null, error };
            
            // Filter client-side
            const filtered = data.filter(photo => {
              if (!photo.matched_users) return false;
              
              // Handle both array and string formats
              let matchedUsers = photo.matched_users;
              if (typeof matchedUsers === 'string') {
                try {
                  matchedUsers = JSON.parse(matchedUsers);
                } catch (e) {
                  return false;
                }
              }
              
              if (!Array.isArray(matchedUsers)) return false;
              
              return matchedUsers.some(user => 
                (user.userId === userId || user.user_id === userId)
              );
            });
            
            return { data: filtered, error: null };
          }
        ];
        
        // Try each approach in sequence
        for (const approach of approaches) {
          const { data, error } = await approach();
          
          if (error) {
            console.warn(`${logPrefix} Query approach failed:`, error);
            continue;
          }
          
          if (data && data.length > 0) {
            console.log(`${logPrefix} Successfully fetched ${data.length} matched photos`);
            return data;
          }
        }
      }
    } catch (queryError) {
      console.warn(`${logPrefix} Error in database query:`, queryError);
    }

    // Strategy 3: Storage bucket fallback (for uploaded photos)
    if (usesUploadedPhotos) {
      try {
        console.log(`${logPrefix} Trying storage bucket fallback`);
        const photos = await fetchFromStorageBucket(userId);
        
        if (photos && photos.length > 0) {
          console.log(`${logPrefix} Found ${photos.length} photos in storage bucket`);
          return photos;
        }
      } catch (storageError) {
        console.warn(`${logPrefix} Storage bucket fallback failed:`, storageError);
      }
    }

    // Strategy 4 for matched photos: Face indexing service fallback
    if (usesMatchedPhotos) {
      try {
        console.log(`${logPrefix} Trying FaceIndexingService fallback`);
        const faceId = await getUserFaceId();
        
        if (faceId) {
          console.log(`${logPrefix} Using face ID: ${faceId}`);
          
          if (window.FaceIndexingService) {
            const matchedPhotos = await window.FaceIndexingService.searchFacesByFaceId(faceId, userId);
            
            if (matchedPhotos && matchedPhotos.length > 0) {
              console.log(`${logPrefix} Found ${matchedPhotos.length} photos via FaceIndexingService`);
              return matchedPhotos;
            }
          }
        }
      } catch (faceError) {
        console.warn(`${logPrefix} FaceIndexingService fallback failed:`, faceError);
      }
    }

    console.log(`${logPrefix} No photos found after trying all strategies`);
    return [];
  } catch (error) {
    console.error(`${logPrefix} Unexpected error fetching photos:`, error);
    return [];
  }
};

// Replace fetchPhotos function with a more reliable version
const fetchPhotos = async () => {
  try {
    setLoading(true);
    setError(null);
    
    if (!user) return;

    console.log('[DEBUG] Fetching photos...');
    
    let photos = [];
    
    // Use our new super-reliable fetch function
    photos = await fetchUserPhotos(user.id, mode);
    
    if (!photos || photos.length === 0) {
      const modeMessage = mode === 'upload' 
        ? 'No uploaded photos found. Try uploading a photo first.'
        : 'No matched photos found. This could mean either no one has uploaded photos with your face, or you need to complete face registration.';
      
      setError(modeMessage);
      setPhotos([]);
      setLoading(false);
      return;
    }
    
    console.log(`[DEBUG] Processing ${photos.length} photos for display`);
    
    // Process the photos with our helper function
    const processedPhotos = photos.map(photo => {
      // Deep clone to avoid mutating original
      const processedPhoto = { ...photo };
      
      // Normalize URL field
      if (!processedPhoto.url && processedPhoto.public_url) {
        processedPhoto.url = processedPhoto.public_url;
      }
      
      // Ensure matched_users is an array
      if (!processedPhoto.matched_users) {
        processedPhoto.matched_users = [];
      } else if (typeof processedPhoto.matched_users === 'string') {
        try {
          processedPhoto.matched_users = JSON.parse(processedPhoto.matched_users);
        } catch (e) {
          processedPhoto.matched_users = [];
        }
      }
      
      // Ensure faces is an array
      if (!processedPhoto.faces) {
        processedPhoto.faces = [];
      } else if (typeof processedPhoto.faces === 'string') {
        try {
          processedPhoto.faces = JSON.parse(processedPhoto.faces);
        } catch (e) {
          processedPhoto.faces = [];
        }
      }
      
      // Ensure other required fields have defaults
      processedPhoto.location = processedPhoto.location || { lat: null, lng: null, name: null };
      processedPhoto.venue = processedPhoto.venue || { id: null, name: null };
      processedPhoto.event_details = processedPhoto.event_details || { date: null, name: null, type: null };
      processedPhoto.tags = processedPhoto.tags || [];
      
      return processedPhoto;
    });
    
    console.log(`[DEBUG] Completed processing ${processedPhotos.length} photos`);
    setPhotos(processedPhotos);
  } catch (err) {
    console.error('[DEBUG] Error in fetchPhotos:', err);
    setError('Failed to load photos. Please try again.');
    setPhotos([]);
  } finally {
    setLoading(false);
  }
}; 