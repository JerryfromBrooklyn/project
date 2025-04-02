import { supabase } from '../../../lib/supabaseClient';
// Import FaceIndexingService
import FaceIndexingService from '../../../services/FaceIndexingService'; 
// Import aiAnalysisService with a dynamic import to avoid circular dependency
let aiAnalysisService;
const loadAIService = async () => {
  if (!aiAnalysisService) {
    const module = await import('./aiAnalysisService');
    aiAnalysisService = module.default;
  }
  return aiAnalysisService;
};

/**
 * Service for handling photo operations
 */
export const photoService = {
  /**
   * Upload a photo with metadata
   * @param {File} file - The file to upload
   * @param {Object} metadata - Additional metadata like event details
   * @param {Function} progressCallback - Callback for upload progress
   * @param {boolean} analyzeWithAI - Whether to analyze the photo with AI
   * @returns {Promise<Object>} The uploaded photo data
   */
  uploadPhoto: async (file, metadata = {}, progressCallback = () => {}, analyzeWithAI = true) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Generate ID for the file
      const fileId = crypto.randomUUID();
      const fileName = `${fileId}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      progressCallback(20);

      // Upload to storage
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      progressCallback(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Process metadata with required fields and formats
      const photoMetadata = {
        id: fileId,
        storage_path: filePath,
        public_url: publicUrl,
        url: publicUrl,
        uploaded_by: user.id,
        uploadedBy: user.id,
        file_size: file.size,
        fileSize: file.size,
        file_type: file.type,
        fileType: file.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        faces: metadata.faces || [],
        matched_users: metadata.matched_users || [],
        face_ids: metadata.face_ids || [],
        location: metadata.location || { lat: null, lng: null, name: null },
        venue: metadata.venue || { id: null, name: null },
        event_details: metadata.event_details || { date: null, name: null, type: null },
        tags: metadata.tags || [],
        ai_analysis: null // Will be filled later if analyzeWithAI is true
      };

      progressCallback(70);

      // Save to localStorage as backup
      photoService.saveToLocalStorage(user.id, photoMetadata);

      progressCallback(80);

      // Try to save to database
      let dbResult = null;
      try {
        const { data, error: insertError } = await supabase
          .from('simple_photos')
          .insert(photoMetadata)
          .select();

        if (insertError) {
          console.error('DB insert error:', insertError);
          // Try RPC as fallback
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'add_simple_photo',
            photoMetadata
          );

          if (!rpcError) {
            dbResult = rpcData;
          }
        } else {
          dbResult = data;
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if database fails, we have localStorage backup
      }

      progressCallback(90);
      
      // If AI analysis is requested, start analysis in background
      if (analyzeWithAI) {
        // Don't await this, let it run in the background and update later
        photoService.startAIAnalysis(photoMetadata).catch(err => {
          console.error('Background AI analysis failed:', err);
        });
      }

      progressCallback(100);

      return {
        ...photoMetadata,
        dbResult
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  /**
   * Start AI analysis in the background and update photo when complete
   * @param {Object} photo - Photo to analyze
   */
  startAIAnalysis: async (photo) => {
    try {
      // Load the AI service
      const aiService = await loadAIService();
      
      // Run analysis
      console.log(`Starting AI analysis for photo ${photo.id}`);
      const analysis = await aiService.analyzePhoto(photo);
      
      console.log(`AI analysis complete for photo ${photo.id}`, analysis);
      return analysis;
    } catch (error) {
      console.error(`AI analysis failed for photo ${photo.id}:`, error);
      throw error;
    }
  },

  /**
   * Save photo metadata to localStorage
   * @param {string} userId - The user ID
   * @param {Object} photoMetadata - The photo metadata to save
   */
  saveToLocalStorage: (userId, photoMetadata) => {
    try {
      // Create a key based on the file ID
      const storageKey = `photo_metadata_${photoMetadata.id}`;
      
      // Store the complete metadata as JSON in localStorage
      localStorage.setItem(storageKey, JSON.stringify(photoMetadata));
      
      // Also store in a master list of photos for this user
      const userPhotosKey = `user_photos_${userId}`;
      const existingPhotos = JSON.parse(localStorage.getItem(userPhotosKey) || '[]');
      
      // Only add if not already in the list
      if (!existingPhotos.includes(photoMetadata.id)) {
        existingPhotos.push(photoMetadata.id);
        localStorage.setItem(userPhotosKey, JSON.stringify(existingPhotos));
      }
    } catch (localStorageError) {
      console.error('Failed to save to localStorage:', localStorageError);
    }
  },

  /**
   * Get photo data from localStorage
   * @param {string} photoId - The photo ID
   * @returns {Object|null} The photo metadata or null if not found
   */
  getFromLocalStorage: (photoId) => {
    try {
      const storageKey = `photo_metadata_${photoId}`;
      const metadataStr = localStorage.getItem(storageKey);
      if (metadataStr) {
        return JSON.parse(metadataStr);
      }
      return null;
    } catch (error) {
      console.error(`Error retrieving photo ${photoId} from localStorage:`, error);
      return null;
    }
  },

  /**
   * Get all photo metadata from localStorage for a user
   * @param {string} userId - The user ID
   * @returns {Array} Array of photo metadata
   */
  getAllFromLocalStorage: (userId) => {
    try {
      const userPhotosKey = `user_photos_${userId}`;
      const photoIds = JSON.parse(localStorage.getItem(userPhotosKey) || '[]');
      
      const photos = [];
      for (const photoId of photoIds) {
        const photo = photoService.getFromLocalStorage(photoId);
        if (photo) {
          photos.push(photo);
        }
      }
      
      return photos;
    } catch (error) {
      console.error('Error retrieving photos from localStorage:', error);
      return [];
    }
  },

  /**
   * Fetch photos from all sources (database, localStorage, storage)
   * @param {Object} options - Options for fetching photos
   * @returns {Promise<Array>} Array of normalized photos
   */
  fetchPhotos: async (options = {}) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('FetchPhotos Error: No authenticated user found.', userError);
        throw userError || new Error('User not authenticated');
      }

      // Get linked user IDs
      let linkedUserIds = [user.id]; // Default to current user ID
      try {
        linkedUserIds = await FaceIndexingService.getLinkedUserIds(user.id);
        console.log(`[fetchPhotos] Found ${linkedUserIds.length} linked user IDs:`, linkedUserIds);
      } catch (linkedIdError) {
        console.error('[fetchPhotos] Error getting linked user IDs, falling back to current user ID:', linkedIdError);
        // Keep linkedUserIds as [user.id]
      }
      
      if (!linkedUserIds || linkedUserIds.length === 0) {
          console.warn('[fetchPhotos] No linked user IDs found, defaulting to current user ID.');
          linkedUserIds = [user.id];
      }

      // Initialize photo collections
      const dbPhotos = [];
      const storagePhotos = [];
      // Fetch localStorage photos for the primary user ID only - This might need review later
      // if photos uploaded by linked accounts should also be checked in localStorage.
      const localStoragePhotos = photoService.getAllFromLocalStorage(user.id); 
      
      // Try to get photos from database for linked accounts
      try {
        // Build the OR condition string for the query
        const ownerFilter = `uploaded_by.in.(${linkedUserIds.join(',')})`;
        // Check if matched_users contains any of the linked IDs
        // Assuming matched_users is an array of objects like { userId: '...' }
        const matchFilters = linkedUserIds.map(id => `matched_users.cs.{"userId":"${id}"}`); 
        const orCondition = `${ownerFilter},${matchFilters.join(',')}`;

        console.log(`[fetchPhotos] Querying simple_photos with OR condition: ${orCondition}`);

        const { data, error } = await supabase
          .from('simple_photos')
          .select('*')
          .or(orCondition) // Filter by uploaded_by OR matched_users containing linked IDs
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('[fetchPhotos] Supabase DB Error:', error);
          // Consider only throwing if it's not a 'resource not found' type error, 
          // maybe the table doesn't exist yet? But for now, log and continue.
        } else if (data) {
          console.log(`[fetchPhotos] Fetched ${data.length} photos from DB for linked accounts.`);
          dbPhotos.push(...data);
        }
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
      }
      
      // Try to get photos from storage - This currently only checks the primary user's folder.
      // This might need adjustment if linked accounts upload to different folders.
      try {
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('photos')
          .list(user.id); // Only lists files for the current user's path
          
        if (!storageError && storageFiles) {
          // Process storage files into photo objects
          for (const file of storageFiles) {
            const storagePath = `${user.id}/${file.name}`;
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(storagePath);
              
            // Try to extract ID from filename
            let extractedId = null;
            const uuidMatch = file.name.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/);
            if (uuidMatch && uuidMatch[1]) {
              extractedId = uuidMatch[1];
              
              // Check if we already have this photo from DB or localStorage
              const existingPhoto = [
                ...dbPhotos,
                ...localStoragePhotos
              ].find(p => p.id === extractedId);
              
              if (existingPhoto) {
                continue; // Skip if we already have this photo
              }
            }
            
            // Create basic photo object if not found elsewhere
            storagePhotos.push({
              id: extractedId || file.id || storagePath,
              storage_path: storagePath,
              public_url: publicUrl,
              url: publicUrl,
              uploaded_by: user.id,
              file_size: file.metadata?.size || 0,
              file_type: file.metadata?.mimetype || 'image/jpeg',
              created_at: file.created_at || new Date().toISOString(),
              faces: [],
              matched_users: [],
              face_ids: [],
              location: { lat: null, lng: null, name: null },
              venue: { id: null, name: null },
              event_details: { date: null, name: null, type: null },
              tags: []
            });
          }
        }
      } catch (storageError) {
        console.error('Error fetching from storage:', storageError);
      }
      
      // Combine all photo sources and normalize
      const allPhotos = [
        ...dbPhotos,
        ...localStoragePhotos,
        ...storagePhotos
      ];
      
      // Remove duplicates by ID
      const uniquePhotos = [];
      const photoIds = new Set();
      
      for (const photo of allPhotos) {
        if (photo.id && !photoIds.has(photo.id)) {
          photoIds.add(photo.id);
          uniquePhotos.push(photo);
        }
      }
      
      // Sort by creation date (newest first)
      uniquePhotos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Normalize all photos
      return uniquePhotos.map(photo => photoService.normalizePhotoFormat(photo));
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  },

  /**
   * Normalize photo format to ensure consistent structure
   * @param {Object} photo - The photo to normalize
   * @returns {Object} Normalized photo object
   */
  normalizePhotoFormat: (photo) => {
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
          
          return {
            userId: face.userId || face.user_id || '',
            confidence: face.confidence || face.Confidence || 0,
            boundingBox: face.boundingBox || face.BoundingBox || null,
            faceId: face.faceId || `face-${photo.id?.substring(0,8)}-${Math.random().toString(36).substring(2,7)}`,
            attributes: face.attributes || (hasAwsAttributes ? awsAttributes : dirtyAttributes)
          };
        }) 
      : [];
    
    // Process matched_users
    const processedMatchedUsers = photo.matched_users && Array.isArray(photo.matched_users)
      ? photo.matched_users.map(user => ({
          userId: user.userId || user.user_id || '',
          fullName: user.fullName || user.full_name || 'Unknown User',
          avatarUrl: user.avatarUrl || user.avatar_url || null,
          confidence: user.confidence || 0
        }))
      : [];
      
    // Ensure all required fields exist
    return {
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
      tags: Array.isArray(photo.tags) ? photo.tags : [],
      
      // AI analysis
      ai_analysis: photo.ai_analysis
    };
  },

  /**
   * Get a photo by ID
   * @param {string} photoId - The photo ID
   * @returns {Promise<Object|null>} The photo or null if not found
   */
  getPhotoById: async (photoId) => {
    // First check localStorage (fastest)
    const localStoragePhoto = photoService.getFromLocalStorage(photoId);
    if (localStoragePhoto) {
      return photoService.normalizePhotoFormat(localStoragePhoto);
    }
    
    // Then try database
    try {
      const { data, error } = await supabase
        .from('simple_photos')
        .select('*')
        .eq('id', photoId)
        .single();
        
      if (!error && data) {
        return photoService.normalizePhotoFormat(data);
      }
    } catch (dbError) {
      console.error('Error fetching photo from database:', dbError);
    }
    
    return null;
  },

  /**
   * Delete a photo
   * @param {string} photoId - The photo ID to delete
   * @returns {Promise<boolean>} Success status
   */
  deletePhoto: async (photoId) => {
    try {
      // Get photo details first
      const photo = await photoService.getPhotoById(photoId);
      if (!photo) return false;
      
      // Delete from storage if we have path
      if (photo.storage_path) {
        await supabase.storage
          .from('photos')
          .remove([photo.storage_path]);
      }
      
      // Delete from database
      await supabase
        .from('simple_photos')
        .delete()
        .eq('id', photoId);
      
      // Delete from localStorage
      const storageKey = `photo_metadata_${photoId}`;
      localStorage.removeItem(storageKey);
      
      // Update user's photo list
      const { data: { user } } = await supabase.auth.getUser();
      const userPhotosKey = `user_photos_${user.id}`;
      const existingPhotos = JSON.parse(localStorage.getItem(userPhotosKey) || '[]');
      const updatedPhotos = existingPhotos.filter(id => id !== photoId);
      localStorage.setItem(userPhotosKey, JSON.stringify(updatedPhotos));
      
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }
};

export default photoService; 