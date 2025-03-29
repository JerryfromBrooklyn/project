import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import SimplePhotoUpload from './components/workaround/SimplePhotoUpload';
import AdminTools from './components/AdminTools';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { PhotoUploader } from './components/PhotoUploader';
import SimplePhotoInfoModal from './components/SimplePhotoInfoModal';
import LocalStorageDebugPanel from './components/LocalStorageDebugPanel';

const SimpleApp = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showPhotoInfoModal, setShowPhotoInfoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchPhotos();
      }
    });

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session) {
          fetchPhotos();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoadingPhotos(true);
      console.log("[fetchPhotos] Starting to fetch photos");
      
      // First try getting photos from simple_photos table
      const { data: dbPhotos, error: dbError } = await supabase
        .from('simple_photos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (dbError) {
        console.error('[fetchPhotos] ERROR fetching from database:', dbError);
      } else {
        console.log(`[fetchPhotos] Successfully fetched ${dbPhotos?.length || 0} photos from database`);
        console.log('[fetchPhotos] First database photo:', dbPhotos?.[0] ? JSON.stringify(dbPhotos[0], null, 2) : 'No photos');
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[fetchPhotos] ERROR getting user:', userError);
        setLoadingPhotos(false);
        return;
      } else {
        console.log('[fetchPhotos] Current user ID:', user.id);
      }
      
      // Directly check the storage bucket for files with user ID prefix
      console.log('[fetchPhotos] Checking storage bucket for files matching user ID:', user.id);
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('photos')
        .list(user.id);
      
      if (storageError) {
        console.error('[fetchPhotos] ERROR checking storage:', storageError);
        // If we have database photos, use those
        if (dbPhotos && dbPhotos.length > 0) {
          console.log(`[fetchPhotos] Using ${dbPhotos.length} database photos as fallback`);
          setPhotos(dbPhotos);
        }
        setLoadingPhotos(false);
        return;
      } else {
        console.log(`[fetchPhotos] Found ${storageFiles?.length || 0} files in storage bucket`);
      }
      
      // Try to get photo metadata from localStorage
      console.log('[fetchPhotos] Checking localStorage for additional metadata');
      const userPhotosKey = `user_photos_${user.id}`;
      const localStoragePhotoIds = JSON.parse(localStorage.getItem(userPhotosKey) || '[]');
      console.log(`[fetchPhotos] Found ${localStoragePhotoIds.length} photo IDs in localStorage`);
      
      // Get metadata for each photo from localStorage
      const localStoragePhotos = [];
      for (const photoId of localStoragePhotoIds) {
        const storageKey = `photo_metadata_${photoId}`;
        const photoMetadataStr = localStorage.getItem(storageKey);
        if (photoMetadataStr) {
          try {
            const photoMetadata = JSON.parse(photoMetadataStr);
            console.log(`[fetchPhotos] Successfully retrieved metadata from localStorage for photo ${photoId}`);
            localStoragePhotos.push(photoMetadata);
          } catch (err) {
            console.error(`[fetchPhotos] ERROR parsing metadata from localStorage for photo ${photoId}:`, err);
          }
        }
      }
      console.log(`[fetchPhotos] Found ${localStoragePhotos.length} photos with metadata in localStorage`);
      
      // If we found files in storage
      if (storageFiles && storageFiles.length > 0) {
        console.log('[fetchPhotos] Processing storage files:', storageFiles.length);
        
        // Convert storage files to photo objects
        const storagePhotos = storageFiles.map(file => {
          const storagePath = `${user.id}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(storagePath);
          
          // Try to extract a unique ID from the filename (UUID pattern at the beginning)
          let extractedId = null;
          const uuidMatch = file.name.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/);
          if (uuidMatch && uuidMatch[1]) {
            extractedId = uuidMatch[1];
            console.log(`[fetchPhotos] Extracted ID from filename: ${extractedId}`);
            
            // Check if we have metadata in localStorage for this ID
            const localStorageKey = `photo_metadata_${extractedId}`;
            const localMetadataStr = localStorage.getItem(localStorageKey);
            if (localMetadataStr) {
              try {
                const localMetadata = JSON.parse(localMetadataStr);
                console.log(`[fetchPhotos] Found metadata in localStorage for ${extractedId}`);
                // Return the complete metadata instead of building a new object
                return localMetadata;
              } catch (err) {
                console.error(`[fetchPhotos] ERROR parsing localStorage metadata for ${extractedId}:`, err);
              }
            }
          }
          
          // Create a photo object from storage file with default attributes
          const storagePhoto = {
            id: extractedId || file.id || storagePath,
            storage_path: storagePath,
            public_url: publicUrl,
            url: publicUrl,
            uploaded_by: user.id,
            file_size: file.metadata?.size || 0,
            file_type: file.metadata?.mimetype || 'image/jpeg',
            created_at: file.created_at || new Date().toISOString(),
            // Add default values for face detection and matching
            faces: [], // Empty array for faces
            matched_users: [], // Empty array for matched users
            face_ids: [], // Empty array for face IDs
            // Add default values for location, venue and event details
            location: {
              lat: null,
              lng: null,
              name: null
            },
            venue: {
              id: null,
              name: null
            },
            event_details: {
              date: null,
              name: null,
              type: null
            },
            tags: []
          };
          
          console.log(`[fetchPhotos] Created storage photo object for ${file.name}:`, 
            JSON.stringify({
              id: storagePhoto.id,
              public_url: storagePhoto.public_url,
              file_type: storagePhoto.file_type,
              created_at: storagePhoto.created_at
            }, null, 2)
          );
          
          return storagePhoto;
        });
        
        console.log(`[fetchPhotos] Converted ${storagePhotos.length} storage files to photo objects`);
        
        // Combine database photos with storage photos and localStorage photos, removing duplicates
        const allPhotos = [...(dbPhotos || [])];
        
        // First add localStorage photos that aren't in the database
        let localPhotosAdded = 0;
        localStoragePhotos.forEach(localPhoto => {
          const exists = allPhotos.some(dbPhoto => dbPhoto.id === localPhoto.id);
          
          if (!exists) {
            console.log(`[fetchPhotos] Adding localStorage photo that's not in database: ${localPhoto.id}`);
            allPhotos.push(localPhoto);
            localPhotosAdded++;
          }
        });
        console.log(`[fetchPhotos] Added ${localPhotosAdded} new photos from localStorage that weren't in the database`);
        
        // Add storage photos that aren't in the database or localStorage
        let newPhotosAdded = 0;
        storagePhotos.forEach(storagePhoto => {
          const exists = allPhotos.some(photo => 
            photo.storage_path === storagePhoto.storage_path || 
            photo.public_url === storagePhoto.public_url ||
            photo.id === storagePhoto.id
          );
          
          if (!exists) {
            console.log(`[fetchPhotos] Adding storage photo that's not in database: ${storagePhoto.id}`);
            allPhotos.push(storagePhoto);
            newPhotosAdded++;
          }
        });
        
        console.log(`[fetchPhotos] Added ${newPhotosAdded} new photos from storage that weren't in the database or localStorage`);
        
        // Sort by created_at
        allPhotos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Normalize all photos to ensure consistent format
        console.log(`[fetchPhotos] Normalizing ${allPhotos.length} photos`);
        const processedPhotos = allPhotos.map((photo, index) => {
          console.log(`[fetchPhotos] Normalizing photo ${index} (id: ${photo.id})`);
          const normalized = normalizePhotoFormat(photo);
          
          // Check for critical data
          if (normalized.faces?.length > 0) {
            console.log(`[fetchPhotos] Photo ${index} has ${normalized.faces.length} faces`);
          }
          if (normalized.matched_users?.length > 0) {
            console.log(`[fetchPhotos] Photo ${index} has ${normalized.matched_users.length} matched users`);
          }
          if (normalized.event_details?.name) {
            console.log(`[fetchPhotos] Photo ${index} has event name: ${normalized.event_details.name}`);
          }
          if (normalized.venue?.name) {
            console.log(`[fetchPhotos] Photo ${index} has venue name: ${normalized.venue.name}`);
          }
          
          return normalized;
        });
        
        console.log(`[fetchPhotos] Finished normalizing ${processedPhotos.length} photos`);
        
        setPhotos(processedPhotos);
      } else if (dbPhotos && dbPhotos.length > 0) {
        // If no storage files but we have database records
        console.log(`[fetchPhotos] No storage files found, using ${dbPhotos.length} database photos`);
        const processedPhotos = dbPhotos.map(photo => normalizePhotoFormat(photo));
        console.log(`[fetchPhotos] Normalized ${processedPhotos.length} database photos`);
        setPhotos(processedPhotos);
      } else {
        console.log('[fetchPhotos] No photos found in database or storage');
        setPhotos([]);
      }
    } catch (error) {
      console.error('[fetchPhotos] ERROR fetching photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'jerry@jerry.com',
      password: '!Jerrydec051488'
    });

    if (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPhotos([]);
  };

  const refreshPhotos = () => {
    console.log('[refreshPhotos] Manually refreshing photos');
    fetchPhotos();
  };

  // Convert any photo format to a consistent format
  const normalizePhotoFormat = (photo) => {
    console.log(`[normalizePhotoFormat] Starting to normalize photo: ${photo.id}`);
    
    // Check if this is an upload result with metadata in photoMetadata
    if (photo.photoMetadata) {
      console.log(`[normalizePhotoFormat] Found photoMetadata in the upload result for: ${photo.id}`);
      return normalizePhotoFormat(photo.photoMetadata);
    }
    
    // Process faces to ensure they have standard structure
    const processedFaces = photo.faces && Array.isArray(photo.faces) 
      ? photo.faces.map(face => {
          const hasAwsAttributes = Boolean(face.AgeRange || face.Gender || face.Smile || face.Emotions);
          
          // Convert AWS format to our format if needed
          const awsAttributes = {
            age: face.AgeRange 
              ? { low: face.AgeRange.Low, high: face.AgeRange.High } 
              : { low: 0, high: 0 },
            gender: face.Gender 
              ? { value: face.Gender.Value, confidence: face.Gender.Confidence } 
              : { value: '', confidence: 0 },
            smile: face.Smile 
              ? { value: face.Smile.Value, confidence: face.Smile.Confidence } 
              : { value: false, confidence: 0 },
            emotions: Array.isArray(face.Emotions) 
              ? face.Emotions.map(emotion => ({
                  type: emotion.Type,
                  confidence: emotion.Confidence
                })) 
              : []
          };
          
          // Handle the case where attributes might be directly on the face object
          const dirtyAttributes = {
            age: face.age || { low: 0, high: 0 },
            gender: face.gender || { value: '', confidence: 0 },
            smile: face.smile || { value: false, confidence: 0 },
            emotions: Array.isArray(face.emotions) ? face.emotions : []
          };
          
          const processedFace = {
            userId: face.userId || face.user_id || '',
            confidence: face.confidence || face.Confidence || 0,
            boundingBox: face.boundingBox || face.BoundingBox || null,
            faceId: face.faceId || `face-${photo.id.substring(0,8)}-${Math.random().toString(36).substring(2,7)}`,
            attributes: face.attributes || (hasAwsAttributes ? awsAttributes : dirtyAttributes)
          };
          
          console.log(`[normalizePhotoFormat] Created processed face with attributes:`, 
            Object.keys(processedFace.attributes).length > 0 ? 
            `${Object.keys(processedFace.attributes).join(', ')}` : 
            'No attributes');
          
          return processedFace;
        }) 
      : [];
    
    console.log(`[normalizePhotoFormat] Processed ${processedFaces.length} faces for photo ${photo.id}`);
    
    // Process matched_users to ensure they have the expected structure
    const processedMatchedUsers = photo.matched_users && Array.isArray(photo.matched_users)
      ? photo.matched_users.map(user => ({
          userId: user.userId || user.user_id || '',
          fullName: user.fullName || user.full_name || 'Unknown User',
          avatarUrl: user.avatarUrl || user.avatar_url || null,
          confidence: user.confidence || 0
        }))
      : [];
      
    console.log(`[normalizePhotoFormat] Processed ${processedMatchedUsers.length} matched users for photo ${photo.id}`);
    
    // Ensure all required fields exist
    const normalized = {
      // Basic photo info
      id: photo.id,
      url: photo.url || photo.public_url,
      storage_path: photo.storage_path,
      public_url: photo.public_url,
      uploaded_by: photo.uploaded_by || photo.uploadedBy,
      uploadedBy: photo.uploaded_by || photo.uploadedBy,
      
      // File metadata
      file_size: photo.file_size || photo.fileSize || 0,
      file_type: photo.file_type || photo.fileType || 'image/jpeg',
      fileSize: photo.file_size || photo.fileSize || 0,
      fileType: photo.file_type || photo.fileType || 'image/jpeg',
      
      // Timestamps
      created_at: photo.created_at || photo.createdAt || new Date().toISOString(),
      updated_at: photo.updated_at || photo.updatedAt || new Date().toISOString(),
      date_taken: photo.date_taken || photo.dateTaken,
      
      // Content metadata
      title: photo.title || '',
      description: photo.description || '',
      
      // Face recognition data with proper structure
      faces: processedFaces,
      matched_users: processedMatchedUsers,
      face_ids: Array.isArray(photo.face_ids) ? photo.face_ids : [],
      
      // Location data
      location: photo.location || { lat: null, lng: null, name: null },
      venue: photo.venue || { id: null, name: null },
      
      // Event data
      event_details: photo.event_details || photo.eventDetails || { date: null, name: null, type: null },
      eventDetails: photo.event_details || photo.eventDetails || { date: null, name: null, type: null },
      
      // Tags
      tags: Array.isArray(photo.tags) ? photo.tags : []
    };
    
    console.log(`[normalizePhotoFormat] Completed normalizing photo ${photo.id} with:
      - ${normalized.faces.length} faces
      - ${normalized.matched_users.length} matched users
      - Event details: ${normalized.event_details ? JSON.stringify(normalized.event_details) : 'none'}
      - Location: ${normalized.location ? JSON.stringify(normalized.location) : 'none'}`
    );
    
    return normalized;
  };

  const handlePhotoClick = (photo) => {
    console.log(`[handlePhotoClick] User clicked on photo: ${photo.id}`);
    
    // First ensure the photo has all required attributes
    const ensurePhotoAttributes = (p) => {
      console.log('[ensurePhotoAttributes] Adding missing attributes to photo before display');
      
      // Create a deep copy to avoid mutations
      const photoWithAttributes = { 
        ...p,
        // Ensure faces data is available
        faces: Array.isArray(p.faces) ? p.faces : [],
        
        // Ensure matched_users data is available
        matched_users: Array.isArray(p.matched_users) ? p.matched_users : [],
        
        // Ensure location data is available
        location: p.location || { lat: null, lng: null, name: null },
        
        // Ensure venue data is available
        venue: p.venue || { id: null, name: null },
        
        // Ensure event_details data is available
        event_details: p.event_details || { date: null, name: null, type: null },
        
        // Ensure tags data is available
        tags: Array.isArray(p.tags) ? p.tags : []
      };
      
      // Log what we've done for debugging
      console.log('[ensurePhotoAttributes] Photo prepared for display with attributes:', {
        id: photoWithAttributes.id,
        faces_count: photoWithAttributes.faces.length,
        has_matched_users: Array.isArray(photoWithAttributes.matched_users),
        has_location: photoWithAttributes.location !== null,
        has_venue: photoWithAttributes.venue !== null,
        has_event_details: photoWithAttributes.event_details !== null,
        has_tags: Array.isArray(photoWithAttributes.tags)
      });
      
      return photoWithAttributes;
    };
    
    // Normalize photo format before opening modal
    const normalizedPhoto = normalizePhotoFormat(ensurePhotoAttributes(photo));
    console.log('[handlePhotoClick] Setting selected photo for modal display');
    setSelectedPhoto(normalizedPhoto);
    setShowPhotoInfoModal(true);
  };

  const closePhotoInfoModal = () => {
    console.log('[closePhotoInfoModal] Closing photo info modal');
    setShowPhotoInfoModal(false);
    setSelectedPhoto(null);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Photo Upload Workaround</h1>
        <Auth 
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Photo Upload Workaround</h1>
        <div className="flex gap-2">
          <button 
            onClick={refreshPhotos} 
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Refresh
          </button>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="mb-8">
        <AdminTools />
      </div>
      
      <div className="mb-8">
        <SimplePhotoUpload onSuccess={refreshPhotos} />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Your Photos</h2>
        {loadingPhotos ? (
          <div className="text-center p-4">Loading photos...</div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map(photo => (
              <div 
                key={photo.id} 
                className="border rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handlePhotoClick(photo)}
              >
                <img 
                  src={photo.public_url} 
                  alt="User uploaded"
                  className="w-full h-48 object-cover"
                />
                <div className="p-2">
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(photo.created_at).toLocaleString()}
                  </p>
                  {photo.matched_users && Array.isArray(photo.matched_users) && photo.matched_users.length > 0 && (
                    <div className="mt-1 inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {photo.matched_users.length} {photo.matched_users.length === 1 ? 'Match' : 'Matches'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            No photos uploaded yet
          </div>
        )}
      </div>

      {/* Photo Info Modal */}
      {showPhotoInfoModal && selectedPhoto && (
        <SimplePhotoInfoModal
          photo={selectedPhoto}
          onClose={closePhotoInfoModal}
        />
      )}
      
      {/* Debug Section */}
      <div className="mt-8 border-t pt-4">
        <details className="bg-gray-50 p-4 rounded-lg">
          <summary className="font-semibold text-gray-700 cursor-pointer">
            Debug Info - Locally Stored Photos
          </summary>
          <LocalStorageDebugPanel userId={session?.user?.id} />
        </details>
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg mt-8">
        <h3 className="font-bold">Instructions for fixing database</h3>
        <p className="mb-2">To fix the database issue with 'column u.full_name does not exist', run the following SQL in the Supabase dashboard:</p>
        <pre className="p-2 bg-gray-800 text-white rounded overflow-x-auto text-xs mb-2">
          {`-- Fix the update_matched_users function
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match - without using u.full_name
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      u.email as display_name, -- Use email instead of full_name
      NULL as avatar_url,
      (f->>'confidence')::float as confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f,
      auth.users u
    WHERE 
      u.id = (f->>'userId')::uuid
  )
  -- Update matched_users with user details
  UPDATE public.photos 
  SET matched_users = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'userId', id,
        'fullName', display_name,
        'avatarUrl', avatar_url,
        'confidence', confidence
      )
    )
    FROM matched_details
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`}
        </pre>
      </div>
    </div>
  );
};

export default SimpleApp; 