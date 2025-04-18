import { supabase } from '../lib/supabaseClient';
import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { DetectFacesCommand, IndexFacesCommand } from '@aws-sdk/client-rekognition';
import { v4 as uuidv4 } from 'uuid';
import { FaceIndexingService } from './FaceIndexingService';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { validateForTable } from '../utils/databaseValidator';
import FaceDetectionService from './FaceDetectionService';

export class PhotoService {
    // Maximum number of retries for API calls
    static MAX_RETRIES = 3;
    // Delay between retries in ms (will be multiplied by retry number)
    static RETRY_DELAY = 1000;
    
    /**
     * Saves photo data to localStorage as a backup mechanism
     * @param {string} userId - User ID for namespace
     * @param {Object} photoData - Complete photo data object
     * @returns {boolean} - Success or failure
     */
    static saveToLocalStorage(userId, photoData) {
        try {
            // Create a photos cache if it doesn't exist
            const cacheKey = `photos_cache_${userId}`;
            let photosCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            
            // Store this photo data indexed by its ID
            photosCache[photoData.id] = {
                ...photoData,
                cached_at: new Date().toISOString()
            };
            
            // Keep only the newest 50 photos to avoid localStorage size limits
            const photoIds = Object.keys(photosCache);
            if (photoIds.length > 50) {
                // Sort by cached_at date, newest first
                photoIds.sort((a, b) => 
                    new Date(photosCache[b].cached_at) - new Date(photosCache[a].cached_at)
                );
                
                // Keep only the newest 50
                const idsToKeep = photoIds.slice(0, 50);
                const newCache = {};
                idsToKeep.forEach(id => {
                    newCache[id] = photosCache[id];
                });
                
                // Replace with the trimmed cache
                photosCache = newCache;
            }
            
            // Save back to localStorage
            localStorage.setItem(cacheKey, JSON.stringify(photosCache));
            console.log(`[DEBUG] Saved photo ${photoData.id} to local cache (${Object.keys(photosCache).length} photos cached)`);
            return true;
        } catch (error) {
            console.error('[DEBUG] Error saving to local cache:', error);
            return false;
        }
    }
    
    /**
     * Retrieves photo data from localStorage
     * @param {string} userId - User ID for namespace
     * @param {string} photoId - Photo ID to retrieve
     * @returns {Object|null} - Photo data or null if not found
     */
    static getFromLocalStorage(userId, photoId) {
        try {
            const cacheKey = `photos_cache_${userId}`;
            const photosCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            return photosCache[photoId] || null;
        } catch (error) {
            console.error('[DEBUG] Error retrieving from local cache:', error);
            return null;
        }
    }
    
    /**
     * Validates photo data before database insertion
     * @param {Object} photoData - The photo data object
     * @param {File|Blob} file - The file object
     * @param {string} publicUrl - The public URL
     * @returns {Object} - Validated photo data with all required fields
     * @throws {Error} - If validation fails
     */
    static validatePhotoData(photoData, file, publicUrl) {
        // Create a data object with all available fields
        const dataToValidate = {
            ...photoData,
            public_url: publicUrl || photoData.public_url,
            file_size: file?.size || photoData.file_size,
            file_type: file?.type || photoData.file_type || 'image/jpeg'
        };
        
        // Use the generic validator with the photos table schema
        return validateForTable('photos', dataToValidate);
    }

    /**
     * Compresses an image while maintaining high quality for 4K photos
     * @param {File|Blob} file - The file object to compress
     * @param {Object} options - Compression options
     * @param {number} options.maxWidth - Maximum width for the image (default: 3840 for 4K)
     * @param {number} options.quality - JPEG quality 1-100 (default: 92, perceptually lossless)
     * @param {string} options.format - Output format (default: 'jpeg')
     * @returns {Promise<File>} - A compressed File object
     */
    static async compressImage(file, options = {}) {
        const {
            maxWidth = 3840, // 4K UHD width
            quality = 0.92,  // High quality - barely perceptible loss (0-1 for canvas)
            format = 'jpeg'  // Most efficient format with good quality
        } = options;

        console.log(`[PhotoService.compressImage] Starting compression for ${file.name}`);
        console.log(`[PhotoService.compressImage] Original size: ${Math.round(file.size / 1024)}KB`);
        
        try {
            // Create a FileReader to read the image
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const img = new Image();
                    
                    img.onload = () => {
                        // Check if resizing is needed
                        let width = img.width;
                        let height = img.height;
                        
                        // Only resize if image is larger than maxWidth
                        if (width > maxWidth) {
                            const ratio = maxWidth / width;
                            width = maxWidth;
                            height = Math.round(height * ratio);
                            console.log(`[PhotoService.compressImage] Resizing from ${img.width}x${img.height} to ${width}x${height}`);
                        } else {
                            console.log(`[PhotoService.compressImage] No resize needed, width (${width}px) <= ${maxWidth}px`);
                        }
                        
                        // Create a canvas for the resized image
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw the image on the canvas
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Get the mime type
                        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                        
                        // Convert the canvas to a blob with the specified quality
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                console.error('[PhotoService.compressImage] Failed to compress image');
                                resolve(file); // Fall back to original file
                                return;
                            }
                            
                            // Create a new filename with the correct extension
                            const filenameBase = file.name.replace(/\.\w+$/, '');
                            const newFilename = `${filenameBase}.${format}`;
                            
                            // Convert to File object
                            const compressedFile = new File(
                                [blob], 
                                newFilename,
                                { type: mimeType }
                            );
                            
                            // Log compression results
                            const compressionRatio = Math.round((file.size / compressedFile.size) * 100) / 100;
                            const sizeSaved = file.size - compressedFile.size;
                            console.log(`[PhotoService.compressImage] Compression results:`);
                            console.log(`- Original: ${Math.round(file.size / 1024)}KB`);
                            console.log(`- Compressed: ${Math.round(compressedFile.size / 1024)}KB`);
                            console.log(`- Saved: ${Math.round(sizeSaved / 1024)}KB (${Math.round((sizeSaved / file.size) * 100)}%)`);
                            console.log(`- Compression ratio: ${compressionRatio}x`);
                            
                            resolve(compressedFile);
                        }, mimeType, quality);
                    };
                    
                    img.onerror = () => {
                        console.error('[PhotoService.compressImage] Failed to load image');
                        resolve(file); // Fall back to original file
                    };
                    
                    // Set the image source from the FileReader result
                    img.src = event.target.result;
                };
                
                reader.onerror = () => {
                    console.error('[PhotoService.compressImage] Failed to read file');
                    resolve(file); // Fall back to original file
                };
                
                // Read the file as a data URL
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('[PhotoService.compressImage] Error compressing image:', error);
            // In case of any errors, return the original file
            return file;
        }
    }

    static async uploadPhoto(file, eventId, folderPath, metadata) {
        try {
            console.log('[PhotoService.uploadPhoto] Starting photo upload process');
            console.log('[PhotoService.uploadPhoto] File:', file.name, 'Size:', file.size, 'Type:', file.type);
            
            // Compress the image before uploading if it's an image
            if (file.type.startsWith('image/')) {
                console.log('[PhotoService.uploadPhoto] Compressing image before upload...');
                file = await this.compressImage(file);
                console.log('[PhotoService.uploadPhoto] Compression complete, new size:', file.size);
            }
            
            // Generate a unique ID for this photo
            const photoId = uuidv4();
            console.log('[PhotoService.uploadPhoto] Created photoId:', photoId);
            
            // Determine storage path
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('[DEBUG] Error getting current user:', userError);
                throw new Error(`Error getting current user: ${userError.message}`);
            }
            
            if (!userData || !userData.user) {
                console.error('[DEBUG] No authenticated user found');
                throw new Error('No authenticated user found');
            }
            
            const userId = userData.user.id;
            console.log('[PhotoService.uploadPhoto] User ID for upload:', userId);
            
            const storagePath = `${userId}/${photoId}-${file.name}`;
            console.log('[PhotoService.uploadPhoto] Storage path:', storagePath);
            
            // Upload to storage bucket
            console.log('[PhotoService.uploadPhoto] Starting file upload to storage bucket "photos"...');
            const { data: storageData, error: storageError } = await supabase.storage
                .from('photos')
                .upload(storagePath, file, { upsert: true });
                
            if (storageError) {
                console.error('[DEBUG] Storage upload error:', storageError);
                throw new Error(`Error uploading to storage: ${storageError.message}`);
            }
            
            console.log('[PhotoService.uploadPhoto] File uploaded successfully to storage:', storageData);
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('photos')
                .getPublicUrl(storagePath);
                
            console.log('[PhotoService.uploadPhoto] Generated public URL:', publicUrl);
            
            // Detect faces in the uploaded image
            let faces = [];
            let faceIds = [];
            let matchedUsers = [];
            
            try {
                console.log('[PhotoService.uploadPhoto] Calling detectFaces method...');
                const facesResult = await this.detectFaces(publicUrl);
                console.log('[PhotoService.uploadPhoto] Detected faces result:', facesResult.length, 'faces found');
                
                if (facesResult && facesResult.length > 0) {
                    // Process face attributes (age, gender, emotions)
                    console.log('[PhotoService.uploadPhoto] Processing face attributes for', facesResult.length, 'faces');
                    const processedFaces = facesResult.map((face, index) => {
                        console.log(`[PhotoService.uploadPhoto] Processing face ${index} attributes`);
                        return {
                            faceId: `local-${photoId.substring(0, 10)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                            confidence: face.confidence,
                            boundingBox: face.boundingBox,
                            attributes: {
                                age: face.age,
                                gender: face.gender,
                                smile: face.smile,
                                emotions: face.emotions,
                                // Add all additional attributes
                                eyesOpen: face.eyesOpen,
                                mouthOpen: face.mouthOpen,
                                eyeglasses: face.eyeglasses,
                                sunglasses: face.sunglasses,
                                beard: face.beard,
                                mustache: face.mustache,
                                pose: face.pose,
                                quality: face.quality
                            },
                            overallConfidence: face.confidence
                        };
                    });
                    
                    console.log('[PhotoService.uploadPhoto] Processed face attributes:', JSON.stringify(processedFaces, null, 2));
                    
                    faces = processedFaces;
                    
                    // Assign face IDs for indexing
                    console.log('[PhotoService.uploadPhoto] Indexing', faces.length, 'faces for future matching...');
                    faceIds = faces.map(face => face.faceId);
                    console.log('[PhotoService.uploadPhoto] Added face_ids to metadata:', faceIds);
                    
                    // Search for face matches
                    console.log('[PhotoService.uploadPhoto] Searching for face matches in registered users...');
                    try {
                        // Check if the function exists before calling it
                        if (typeof FaceIndexingService.searchFacesByImage === 'function') {
                            console.log('[PhotoService.uploadPhoto] Calling FaceIndexingService.searchFacesByImage');
                            const faceMatches = await FaceIndexingService.searchFacesByImage(photoId, publicUrl);
                            console.log('[PhotoService.uploadPhoto] Found', faceMatches.length, 'matching users!', faceMatches);
                            
                            // Filter matches with valid confidence
                            const validMatches = faceMatches.filter(match => match.confidence >= 80);
                            console.log('[PhotoService.uploadPhoto]', validMatches.length, 'valid matches to save to database');
                            
                            if (validMatches.length > 0) {
                                // Get user information for each match and add it to the matched_users array
                                const enhancedMatches = [];
                                
                                for (const match of validMatches) {
                                    try {
                                        // Get user data from the users table
                                        const { data: userData, error: userError } = await supabase
                                            .from('users')
                                            .select('id, email, full_name, avatar_url')
                                            .eq('id', match.userId)
                                            .single();
                                        
                                        if (userError) {
                                            console.error('[PhotoService.uploadPhoto] Error fetching user data:', userError);
                                            
                                            // Try falling back to the profiles table
                                            const { data: profileData, error: profileError } = await supabase
                                                .from('profiles')
                                                .select('id, username, full_name, avatar_url')
                                                .eq('id', match.userId)
                                                .single();
                                                
                                            if (profileError) {
                                                console.error('[PhotoService.uploadPhoto] Error fetching profile data:', profileError);
                                                // Add match with basic information
                                                enhancedMatches.push({
                                                    userId: match.userId,
                                                    faceId: match.faceId || null,
                                                    fullName: 'Unknown User',
                                                    email: null,
                                                    avatarUrl: null,
                                                    similarity: match.similarity || 0,
                                                    confidence: match.confidence || match.similarity || 0
                                                });
                                            } else {
                                                // Add match with profile information
                                                enhancedMatches.push({
                                                    userId: match.userId,
                                                    faceId: match.faceId || null,
                                                    fullName: profileData.full_name || profileData.username || 'Unknown User',
                                                    email: null, 
                                                    avatarUrl: profileData.avatar_url,
                                                    similarity: match.similarity || 0,
                                                    confidence: match.confidence || match.similarity || 0
                                                });
                                                console.log('[PhotoService.uploadPhoto] Enhanced match with profile data:', {
                                                    userId: match.userId,
                                                    fullName: profileData.full_name || profileData.username || 'Unknown User'
                                                });
                                            }
                                        } else {
                                            // Add match with complete user information
                                            enhancedMatches.push({
                                                userId: match.userId,
                                                faceId: match.faceId || null,
                                                fullName: userData.full_name || userData.email || 'Unknown User',
                                                email: userData.email || null,
                                                avatarUrl: userData.avatar_url,
                                                similarity: match.similarity || 0,
                                                confidence: match.confidence || match.similarity || 0
                                            });
                                            console.log('[PhotoService.uploadPhoto] Enhanced match with user data:', {
                                                userId: match.userId,
                                                fullName: userData.full_name || userData.email || 'Unknown User'
                                            });
                                        }
                                    } catch (matchProcessingError) {
                                        console.error('[PhotoService.uploadPhoto] Error processing match:', matchProcessingError);
                                        // Add basic match data in case of error
                                        enhancedMatches.push({
                                            userId: match.userId,
                                            faceId: match.faceId || null,
                                            fullName: 'Unknown User',
                                            email: null,
                                            avatarUrl: null,
                                            similarity: match.similarity || 0,
                                            confidence: match.confidence || match.similarity || 0
                                        });
                                    }
                                }
                                
                                matchedUsers = enhancedMatches;
                                console.log('[PhotoService.uploadPhoto] Added matched_users to metadata:', matchedUsers);
                            }
                        } else {
                            console.warn('[PhotoService.uploadPhoto] WARNING: searchFacesByImage function not available, skipping face matching');
                        }
                    } catch (faceMatchError) {
                        console.error('[PhotoService.uploadPhoto] ERROR during face matching (continuing upload):', faceMatchError);
                        console.error('[PhotoService.uploadPhoto] Face matching error stack:', faceMatchError.stack);
                    }
                } else {
                    console.log('[PhotoService.uploadPhoto] No faces detected in the uploaded image');
                }
            } catch (faceError) {
                console.error('[PhotoService.uploadPhoto] ERROR during face detection (continuing upload):', faceError);
                console.error('[PhotoService.uploadPhoto] Face detection error stack:', faceError.stack);
            }
            
            // Process any additional uploaded faces
            try {
                if (faces.length > 0 && typeof FaceIndexingService.processFaces === 'function') {
                    await FaceIndexingService.processFaces(photoId, faces);
                } else {
                    console.log('[DEBUG] processFaces function not available or no faces to process');
                }
            } catch (processingError) {
                console.error('[DEBUG] Error processing faces (continuing upload):', processingError);
            }
            
            // Prepare photo metadata
            const photoMetadata = {
                title: file.name,
                event_details: {
                    name: metadata.eventName || "Untitled Event",
                    date: metadata.date || new Date().toISOString(),
                    promoter: metadata.promoterName || "Unknown"
                },
                venue: {
                    name: metadata.venueName || "Unknown Venue",
                    id: null
                },
                location: metadata.location && metadata.location.name ? metadata.location : {
                    lat: null,
                    lng: null,
                    name: "Unknown Location",
                    address: null
                },
                date_taken: metadata.date || new Date().toISOString(),
                // Add empty structures for things that will be populated by the service
                tags: [],
                matched_users: []
            };
            
            console.log(`[DEBUG] Location data in metadata:`, JSON.stringify(metadata.location, null, 2));
            console.log(`[DEBUG] Prepared metadata for ${file.name}:`, JSON.stringify(photoMetadata, null, 2));
            
            // Create final photo record with all metadata
            let finalMetadata = {
                id: photoId,
                uploaded_by: userId,
                user_id: userId,
                storage_path: storagePath,
                public_url: publicUrl,
                url: publicUrl,
                file_size: file.size,
                size: file.size,
                file_type: file.type,
                type: file.type,
                title: metadata?.title || file.name,
                created_at: new Date().toISOString(),
                faces: faces || [],
                face_ids: faceIds || [],
                matched_users: matchedUsers || [],
                location: metadata?.location || { lat: null, lng: null, name: null, address: null },
                ...metadata
            };
            
            console.log('[DEBUG] Uploading photo to database:', photoId);
            console.log('[DEBUG] Full photo record:', finalMetadata);
            
            // Use the new complete_photo_insert RPC function as the primary method
            try {
                console.log('[DEBUG] Using complete_photo_insert RPC function...');
                
                // Create metadata object with all additional data
                const metadataObj = {
                    location: metadata?.location || { lat: null, lng: null, name: null, address: null },
                    venue: metadata?.venue || { id: null, name: null },
                    event_details: metadata?.event_details || { date: null, name: null, type: null },
                    tags: metadata?.tags || [],
                    title: metadata?.title || file.name,
                    date_taken: metadata?.date_taken || new Date().toISOString()
                };
                
                console.log('[DEBUG] Metadata being sent to database:', JSON.stringify(metadataObj, null, 2));
                
                // Save to localStorage as a backup before attempting database operations
                this.saveToLocalStorage(userId, finalMetadata);
                console.log('[DEBUG] Photo data backed up to localStorage');
                
                // Call the RPC function with all data including faces
                const { data: rpcData, error: rpcError } = await supabase.rpc(
                    'complete_photo_insert',
                    {
                        p_id: photoId,
                        p_user_id: userId,
                        p_storage_path: storagePath,
                        p_public_url: publicUrl,
                        p_file_size: file.size,
                        p_file_type: file.type,
                        p_faces: faces || [],
                        p_face_ids: faceIds || [],
                        p_matched_users: matchedUsers || [],
                        p_metadata: metadataObj
                    }
                );
                
                if (rpcError) {
                    console.error('[DEBUG] Error calling complete_photo_insert:', rpcError);
                    
                    // If the new function fails, fall back to the original methods as a backup
                    console.log('[DEBUG] Falling back to original insertion methods...');
                    
                    // Try direct insert with all data as before
                    const { data, error } = await supabase
                        .from('photos')
                        .insert(finalMetadata)
                        .select()
                        .single();
                        
                    if (error) {
                        console.log('[DEBUG] Database direct insert error:', error);
                        
                        // If that fails, try with minimal record (permissions issue)
                        try {
                            console.log('[DEBUG] Trying minimal record insert due to permission error...');
                            const minimalRecord = {
                                id: photoId,
                                uploaded_by: userId,
                                user_id: userId,
                                storage_path: storagePath,
                                public_url: publicUrl,
                                url: publicUrl,
                                file_size: file.size,
                                size: file.size,
                                file_type: file.type,
                                type: file.type
                            };
                            
                            const { data: minData, error: minError } = await supabase
                                .from('photos')
                                .insert(minimalRecord)
                                .select()
                                .single();
                                
                            if (minError) {
                                console.log('[DEBUG] All database insertion methods failed');
                                console.log('[DEBUG] Photo uploaded to storage but database record failed');
                            }
                        } catch (minimalErr) {
                            console.error('[DEBUG] Minimal record insert failed:', minimalErr);
                        }
                    }
                } else {
                    console.log('[DEBUG] complete_photo_insert succeeded with result:', rpcData);
                }
                
                // Verify the photo exists in database using our new function
                try {
                    console.log('[DEBUG] Verifying photo record was created...');
                    
                    // Use our new verification function instead of direct table query
                    const { data: verifyData, error: verifyError } = await supabase.rpc(
                        'verify_photo_exists',
                        { p_photo_id: photoId }
                    );
                    
                    if (verifyError) {
                        console.error('[DEBUG] Error verifying photo record:', verifyError);
                        
                        // Fall back to localStorage data if verification fails
                        console.log('[DEBUG] Using cached data as fallback');
                        const cachedData = this.getFromLocalStorage(userId, photoId);
                        if (cachedData) {
                            console.log('[DEBUG] Found cached photo data:', cachedData.id);
                        }
                    } else if (!verifyData || verifyData.source_table === 'none') {
                        console.error('[DEBUG] Photo record not found after database operations!');
                        
                        // If the record wasn't found, ensure it gets added to simple_photos
                        const { error: insertError } = await supabase
                            .from('simple_photos')
                            .insert({
                                id: photoId,
                                uploaded_by: userId,
                                storage_path: storagePath,
                                public_url: publicUrl,
                                file_size: file.size,
                                file_type: file.type,
                                title: metadata?.title || file.name,
                                faces: faces || [],
                                face_ids: faceIds || [],
                                matched_users: matchedUsers || [],
                                location: metadata?.location || { lat: null, lng: null, name: null, address: null },
                                venue: metadata?.venue || { id: null, name: null },
                                event_details: metadata?.event_details || { date: null, name: null, type: null },
                                tags: metadata?.tags || [],
                                date_taken: metadata?.date_taken || new Date().toISOString()
                            });
                            
                        if (insertError) {
                            console.error('[DEBUG] Error inserting into simple_photos:', insertError);
                            
                            // Try one more time with a smaller payload
                            const { error: retryError } = await supabase
                                .from('simple_photos')
                                .insert({
                                    id: photoId,
                                    uploaded_by: userId,
                                    storage_path: storagePath,
                                    public_url: publicUrl,
                                    file_size: file.size,
                                    file_type: file.type,
                                    title: metadata?.title || file.name,
                                    matched_users: matchedUsers || []
                                });
                                
                            if (retryError) {
                                console.error('[DEBUG] Retry also failed:', retryError);
                            } else {
                                console.log('[DEBUG] Successfully inserted minimal photo data into simple_photos table');
                            }
                        } else {
                            console.log('[DEBUG] Successfully inserted photo into simple_photos table');
                        }
                    } else {
                        console.log('[DEBUG] Photo record verified in database:', verifyData.id, 'in table:', verifyData.source_table);
                    }
                } catch (verifyErr) {
                    console.error('[DEBUG] Exception during photo verification:', verifyErr);
                }

                // Skip database verification - using the finalMetadata directly
                console.log('[DEBUG] Skipping database verification - using finalMetadata directly');
                // This implements Solution 1 - using data we already have instead of verifying
            } catch (dbError) {
                console.error('[DEBUG] Database error:', dbError);
                
                // Allow upload to "succeed" even with DB errors, since the file is in storage
                console.log('[DEBUG] Photo uploaded to storage but database record failed');
            }
            
            console.log('[DEBUG] Photo uploaded successfully:', photoId);
            
            // Return success response with photo details
            return {
                success: true,
                photoId,
                url: publicUrl,
                photoMetadata: finalMetadata
            };
        }
        catch (err) {
            console.error('[PhotoService.uploadPhoto] ERROR during photo upload:', err);
            console.error('[PhotoService.uploadPhoto] Upload error stack:', err.stack);
            throw err;
        }
    }
    static async updatePhotoMetadata(photoId, metadata) {
        try {
            let retries = 0;
            let error;
            
            console.log('[DEBUG] Updating photo metadata for', photoId);
            
            while (retries < this.MAX_RETRIES) {
                try {
                    // First try using the RPC function
                    const { error: rpcError } = await supabase.rpc(
                        'update_photo_details_adapter',
                        {
                            p_id: photoId,
                            p_title: metadata.title,
                            p_date_taken: metadata.date_taken,
                            p_event_details: metadata.event_details,
                            p_venue: metadata.venue
                        }
                    );
                    
                    if (!rpcError) {
                        console.log('[DEBUG] Photo metadata updated successfully via RPC');
                        return true;
                    }
                    
                    console.log('[DEBUG] RPC update failed, trying direct update...', rpcError);
                    
                    // Fall back to direct update
                    const { error: updateError } = await supabase
                        .from('photos')
                        .update({
                            title: metadata.title,
                            description: metadata.description,
                            location: metadata.location,
                            venue: metadata.venue,
                            tags: metadata.tags,
                            date_taken: metadata.date_taken,
                            event_details: metadata.event_details
                        })
                        .eq('id', photoId);
                        
                    if (!updateError) {
                        console.log('[DEBUG] Photo metadata updated successfully via direct update');
                        return true;
                    }
                    
                    error = updateError || rpcError;
                    console.log('[DEBUG] Both update methods failed:', error);
                } catch (err) {
                    error = err;
                    console.error('[ERROR] Exception during metadata update:', err);
                }
                
                retries++;
                if (retries < this.MAX_RETRIES) {
                    const delay = this.RETRY_DELAY * retries;
                    console.log(`[DEBUG] Retrying metadata update in ${delay}ms (attempt ${retries+1}/${this.MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            console.error('[ERROR] Failed to update photo metadata after all retries');
            throw error;
        } catch (error) {
            console.error('[ERROR] Error updating photo metadata:', error);
            return false;
        }
    }
    static async batchUpdatePhotos(photoIds, data) {
        try {
            let retries = 0;
            let error;
            let successCount = 0;
            
            console.log(`[DEBUG] Batch updating ${photoIds.length} photos`);
            
            // Create parameters for the update
            const updateData = {
                location: data.location,
                venue: data.venue,
                tags: data.tags,
                date_taken: data.date_taken,
                event_details: data.event_details
            };
            
            while (retries < this.MAX_RETRIES) {
                try {
                    // Use direct update for batch operations
                    const { error: updateError } = await supabase
                        .from('photos')
                        .update(updateData)
                        .in('id', photoIds);
                        
                    if (!updateError) {
                        console.log(`[DEBUG] Successfully batch updated ${photoIds.length} photos`);
                        return true;
                    }
                    
                    // If batch update fails, try updating photos one by one
                    console.log('[DEBUG] Batch update failed, trying individual updates...', updateError);
                    error = updateError;
                    
                    // Try individual updates
                    successCount = 0;
                    for (const photoId of photoIds) {
                        try {
                            const { error: singleError } = await supabase
                                .from('photos')
                                .update(updateData)
                                .eq('id', photoId);
                                
                            if (!singleError) {
                                successCount++;
                            } else {
                                console.log(`[DEBUG] Failed to update photo ${photoId}:`, singleError);
                            }
                        } catch (singleErr) {
                            console.error(`[ERROR] Exception updating photo ${photoId}:`, singleErr);
                        }
                    }
                    
                    if (successCount === photoIds.length) {
                        console.log(`[DEBUG] Successfully updated all ${successCount} photos individually`);
                        return true;
                    } else if (successCount > 0) {
                        console.warn(`[WARN] Partially successful: Updated ${successCount}/${photoIds.length} photos`);
                        return true;
                    }
                    
                } catch (err) {
                    error = err;
                    console.error('[ERROR] Exception during batch update:', err);
                }
                
                retries++;
                if (retries < this.MAX_RETRIES) {
                    const delay = this.RETRY_DELAY * retries;
                    console.log(`[DEBUG] Retrying batch update in ${delay}ms (attempt ${retries+1}/${this.MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            if (successCount > 0) {
                console.warn(`[WARN] Partial success: Updated ${successCount}/${photoIds.length} photos after all retries`);
                return true;
            }
            
            console.error('[ERROR] Failed to update any photos after all retries');
            throw error;
        } catch (error) {
            console.error('[ERROR] Error in batch update photos:', error);
            return false;
        }
    }
    static async renameFolder(oldPath, newName) {
        try {
            let retries = 0;
            let error;
            while (retries < this.MAX_RETRIES) {
                try {
                    const { error: updateError } = await supabase
                        .from('photos')
                        .update({
                        folder_name: newName,
                        folder_path: oldPath.split('/').slice(0, -1).concat(newName).join('/')
                    })
                        .eq('folder_path', oldPath);
                    if (!updateError) {
                        return true;
                    }
                    error = updateError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            throw error;
        }
        catch (error) {
            console.error('Error renaming folder:', error);
            return false;
        }
    }
    static async getUserStorageUsage(userId) {
        try {
            // First check if user has a storage record
            const { data: existingData, error: checkError } = await supabase
                .from('user_storage')
                .select('total_size, quota_limit')
                .eq('user_id', userId)
                .maybeSingle();
            // If no record exists, create one with ON CONFLICT handling
            if (!existingData) {
                const { data: newData, error: insertError } = await supabase
                    .from('user_storage')
                    .upsert([{
                        user_id: userId,
                        total_size: 0,
                        quota_limit: 10737418240 // 10GB in bytes
                    }])
                    .select('total_size, quota_limit')
                    .single();
                if (insertError)
                    throw insertError;
                return { data: newData };
            }
            return { data: existingData };
        }
        catch (error) {
            console.error('Error getting/creating storage usage:', error);
            return { error: error };
        }
    }
    static async detectFaces(imageDataOrPath) {
        try {
            console.log('[PhotoService.detectFaces] Starting face detection...');
            
            // Use our new safe FaceDetectionService instead of direct AWS calls
            const faces = await FaceDetectionService.getFaces(imageDataOrPath);
            
            console.log(`[PhotoService.detectFaces] Successfully detected ${faces.length} faces`);
            
            // Map the faces to our expected format
            return faces.map((face, index) => {
                return {
                    id: `face-${index}`,
                    boundingBox: face.boundingBox || {},
                    confidence: face.confidence || 0,
                    landmarks: face.landmarks || [],
                    faceId: null, // Will be set later if indexed
                    rekognitionId: null, // Will be set later if indexed
                    emotions: face.emotions || [],
                    gender: face.gender || { Value: 'Unknown', Confidence: 0 },
                    age: face.age || { Low: 0, High: 100, Confidence: 0 },
                    quality: face.quality || { Brightness: 0, Sharpness: 0 }
                };
            });
        } catch (error) {
            console.error('[PhotoService.detectFaces] Face detection error:', error);
            // Always return an empty array as a safe fallback rather than throwing
            return [];
        }
    }
    static async getPhotosForEvent(eventId) {
        try {
            let retries = 0;
            let data;
            let error;
            while (retries < this.MAX_RETRIES) {
                try {
                    const { data: response, error: queryError } = await supabase
                        .from('photos')
                        .select(`
              *,
              users (
                id,
                full_name,
                avatar_url,
                user_profiles (
                  metadata
                )
              )
            `)
                        .eq('event_id', eventId)
                        .order('created_at', { ascending: false });
                    if (!queryError) {
                        data = response;
                        break;
                    }
                    error = queryError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            if (error)
                throw error;
            
            // Apply the filter to remove inferred matches before returning
            let mappedPhotos = (data || []).map(photo => ({
                id: photo.id,
                url: photo.public_url,
                eventId: photo.event_id,
                uploadedBy: photo.uploaded_by,
                created_at: photo.created_at,
                folderPath: photo.folder_path,
                folderName: photo.folder_name,
                fileSize: photo.file_size,
                fileType: photo.file_type,
                faces: photo.faces || [],
                title: photo.title,
                description: photo.description,
                location: photo.location,
                venue: photo.venue,
                tags: photo.tags,
                date_taken: photo.date_taken,
                event_details: photo.event_details,
                matched_users: photo.matched_users || []
            }));
            
            // Get the current user ID from the auth context or session
            const currentUser = await this.getCurrentUser();
            const userId = currentUser?.id;
            
            // Only filter if we have a user ID
            if (userId) {
                // Filter out inferred matches before returning
                return this.filterOutInferredMatches(mappedPhotos, userId);
            }
            
            return mappedPhotos;
        }
        catch (error) {
            console.error('Error fetching event photos:', error);
            throw error;
        }
    }
    static async getPhotosForUser(userId) {
        try {
            let retries = 0;
            let data, error;
            
            while (retries < this.MAX_RETRIES) {
                try {
                    // Use all_photos view instead of photos table to see both regular and simple photos
                    const { data: fetchedData, error: fetchError } = await supabase
                        .from('all_photos')
                        .select(`
                            *,
                            users (
                                id,
                                full_name,
                                avatar_url,
                                user_profiles (
                                    metadata
                                )
                            )
                        `)
                        .or(`uploaded_by.eq.${userId},faces->0->>userId.eq.${userId}`)
                        .order('created_at', { ascending: false });
                        
                    if (!fetchError) {
                        data = fetchedData;
                        break;
                    }
                    error = fetchError;
                } catch (err) {
                    error = err;
                }
                
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            
            if (error) throw error;
            
            // Apply the filter to remove inferred matches before returning
            let mappedPhotos = (data || []).map(photo => ({
                id: photo.id,
                url: photo.public_url,
                eventId: photo.event_id,
                uploadedBy: photo.uploaded_by,
                created_at: photo.created_at,
                folderPath: photo.folder_path,
                folderName: photo.folder_name,
                fileSize: photo.file_size,
                fileType: photo.file_type,
                faces: photo.faces || [],
                title: photo.title,
                description: photo.description,
                location: photo.location,
                venue: photo.venue,
                tags: photo.tags,
                date_taken: photo.date_taken,
                event_details: photo.event_details,
                matched_users: photo.matched_users || []
            }));
            
            // Filter out inferred matches before returning
            return this.filterOutInferredMatches(mappedPhotos, userId);
        }
        catch (error) {
            console.error('Error fetching user photos:', error);
            throw error;
        }
    }
    static async updatePhotoPermissions(photoId, permissions) {
        try {
            let retries = 0;
            let error;
            while (retries < this.MAX_RETRIES) {
                try {
                    const { error: updateError } = await supabase
                        .from('photo_permissions')
                        .upsert(permissions.map(p => ({
                        photo_id: photoId,
                        user_id: p.userId,
                        access_level: p.access
                    })));
                    if (!updateError) {
                        return;
                    }
                    error = updateError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            throw error;
        }
        catch (error) {
            console.error('Error updating photo permissions:', error);
            throw error;
        }
    }
    static async deletePhoto(photoId) {
        try {
            // Get photo details
            const { data: photo, error: fetchError } = await supabase
                .from('photos')
                .select('storage_path, file_size')
                .eq('id', photoId)
                .single();
            if (fetchError)
                throw fetchError;
            let retries = 0;
            let error;
            // Delete from storage with retries
            while (retries < this.MAX_RETRIES) {
                try {
                    const { error: storageError } = await supabase.storage
                        .from('photos')
                        .remove([photo.storage_path]);
                    if (!storageError) {
                        error = null;
                        break;
                    }
                    error = storageError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            if (error)
                throw error;
            // Delete metadata with retries
            retries = 0;
            while (retries < this.MAX_RETRIES) {
                try {
                    const { error: dbError } = await supabase
                        .from('photos')
                        .delete()
                        .eq('id', photoId);
                    if (!dbError) {
                        return;
                    }
                    error = dbError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            throw error;
        }
        catch (error) {
            console.error('Error deleting photo:', error);
            throw error;
        }
    }
    static async downloadPhoto(photoId) {
        try {
            let retries = 0;
            let data;
            let error;
            // Get photo path
            while (retries < this.MAX_RETRIES) {
                try {
                    const { data: photo, error: fetchError } = await supabase
                        .from('photos')
                        .select('storage_path')
                        .eq('id', photoId)
                        .single();
                    if (!fetchError) {
                        data = photo;
                        break;
                    }
                    error = fetchError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            if (error)
                throw error;
            // Download photo with retries
            retries = 0;
            let downloadedData;
            while (retries < this.MAX_RETRIES) {
                try {
                    const { data: fileData, error: downloadError } = await supabase.storage
                        .from('photos')
                        .download(data.storage_path);
                    if (!downloadError) {
                        downloadedData = fileData;
                        break;
                    }
                    error = downloadError;
                }
                catch (err) {
                    error = err;
                }
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            if (error)
                throw error;
            return URL.createObjectURL(downloadedData);
        }
        catch (error) {
            console.error('Error downloading photo:', error);
            throw error;
        }
    }
    static async getPhotoById(photoId) {
        try {
            let retries = 0;
            let data, error;
            
            while (retries < this.MAX_RETRIES) {
                try {
                    // Use all_photos view instead of photos table
                    const { data: fetchedData, error: fetchError } = await supabase
                        .from('all_photos')
                        .select(`
                            *,
                            users (
                                id,
                                full_name,
                                avatar_url,
                                user_profiles (
                                    metadata
                                )
                            )
                        `)
                        .eq('id', photoId)
                        .single();
                        
                    if (!fetchError) {
                        data = fetchedData;
                        break;
                    }
                    error = fetchError;
                } catch (err) {
                    error = err;
                }
                
                retries++;
                if (retries < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
                }
            }
            
            if (error) throw error;
            
            return data;
        }
        catch (error) {
            console.error('Error fetching photo by ID:', error);
            throw error;
        }
    }
    // Process matches between user faces and photos
    static async processMatches(userId) {
        try {
            console.log(`[DEBUG-MATCH] Processing matches for user ${userId}`);
            
            // Get all face IDs for this user
            const { data: faceData, error: faceError } = await supabase
                .from('face_data')
                .select('face_id')
                .eq('user_id', userId);
                
            if (faceError) {
                console.error('[DEBUG-MATCH] Error fetching face data:', faceError);
                throw faceError;
            }
            
            console.log(`[DEBUG-MATCH] Found ${faceData?.length || 0} registered faces for user`);
            
            if (!faceData || faceData.length === 0) {
                return { success: false, message: 'No face data found' };
            }
            
            const faceIds = faceData.map(fd => fd.face_id);
            console.log('[DEBUG-MATCH] Face IDs:', faceIds);
            
            // Use safer text-based filtering instead of JSON operators
            // This avoids the 400 Bad Request errors with the 'cs' operator
            const userIdPattern = `%"userId":"${userId}"%`;
            
            // Get all photos that might match these faces but aren't already matched
            let { data: photos, error: photoError } = await supabase
                .from('photos')
                .select('*')
                .not('matched_users::text', 'ilike', userIdPattern);
                
            if (photoError) {
                console.error('[DEBUG-MATCH] Error fetching photos:', photoError);
                // Try alternative approach if that fails
                try {
                    // Get all photos and filter client-side
                    const { data: allPhotoRecords, error: allPhotosError } = await supabase
                        .from('photos')
                        .select('*');
                        
                    // Filter manually to find photos without this user
                    if (allPhotoRecords) {
                        const filteredPhotos = allPhotoRecords.filter(photo => {
                            if (!photo.matched_users) return true;
                            const matches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
                            return !matches.some(match => match.userId === userId);
                        });
                        console.log(`[DEBUG-MATCH] Using client-side filtering: found ${filteredPhotos.length} of ${allPhotoRecords.length} photos`);
                        const matchablePhotos = filteredPhotos;
                        photos = matchablePhotos;
                    }
                } catch (fallbackError) {
                    console.error('[DEBUG-MATCH] Fallback query also failed:', fallbackError);
                    throw photoError; // Use the original error
                }
            }
            
            if (!photos || photos.length === 0) {
                return { success: true, message: 'No new photos to match' };
            }
            
            console.log(`[DEBUG-MATCH] Found ${photos.length} potential photos to match`);
            
            // Check each photo for face matches
            let matchCount = 0;
            
            // Process in small batches to prevent overloading
            const BATCH_SIZE = 5;
            
            for (let i = 0; i < photos.length; i += BATCH_SIZE) {
                const batch = photos.slice(i, Math.min(i + BATCH_SIZE, photos.length));
                
                console.log(`[DEBUG-MATCH] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(photos.length/BATCH_SIZE)}`);
                
                await Promise.all(batch.map(async (photo) => {
                    try {
                        let hasMatch = false;
                        
                        // Check if any of the user's face IDs match in this photo's faces array
                        if (Array.isArray(photo.faces)) {
                            hasMatch = photo.faces.some(face => 
                                face.faceId && faceIds.includes(face.faceId)
                            );
                        }
                        
                        // Also check in the face_ids array
                        if (!hasMatch && Array.isArray(photo.face_ids)) {
                            hasMatch = photo.face_ids.some(id => faceIds.includes(id));
                        }
                        
                        if (hasMatch) {
                            console.log(`[DEBUG-MATCH] Found match in photo ${photo.id}`);
                            
                            // Get user data
                            const { data: userData, error: userError } = await supabase
                                .from('users')
                                .select('id, full_name, avatar_url')
                                .eq('id', userId)
                                .single();
                                
                            if (userError) {
                                console.error('[DEBUG-MATCH] Error fetching user data:', userError);
                                return;
                            }
                            
                            // Add user to matched_users if not already present
                            const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
                            
                            // Check if user is already in the matches
                            if (existingMatches.some(match => match.userId === userId)) {
                                console.log(`[DEBUG-MATCH] User ${userId} already in matches for photo ${photo.id}`);
                                return;
                            }
                            
                            // Add user to matched_users
                            const newMatch = {
                                userId: userId,
                                fullName: userData.full_name || 'Unknown User',
                                avatarUrl: userData.avatar_url,
                                confidence: 95,
                                similarity: 95
                            };
                            
                            const updatedMatches = [...existingMatches, newMatch];
                            
                            // Update the photo with retries
                            let updated = false;
                            let retryCount = 0;
                            const MAX_RETRIES = 3;
                            
                            while (!updated && retryCount < MAX_RETRIES) {
                                try {
                                    const { error: updateError } = await supabase
                                        .from('photos')
                                        .update({ 
                                            matched_users: updatedMatches,
                                            updated_at: new Date().toISOString()
                                        })
                                        .eq('id', photo.id);
                                        
                                    if (!updateError) {
                                        updated = true;
                                        matchCount++;
                                        console.log(`[DEBUG-MATCH] Successfully updated photo ${photo.id}`);
                                    } else {
                                        console.error(`[DEBUG-MATCH] Error updating photo ${photo.id} (attempt ${retryCount + 1}):`, updateError);
                                        retryCount++;
                                        
                                        // Exponential backoff
                                        await new Promise(r => setTimeout(r, 200 * Math.pow(2, retryCount)));
                                    }
                                } catch (updateError) {
                                    console.error(`[DEBUG-MATCH] Exception updating photo ${photo.id}:`, updateError);
                                    retryCount++;
                                    
                                    // Exponential backoff
                                    await new Promise(r => setTimeout(r, 200 * Math.pow(2, retryCount)));
                                }
                            }
                        }
                    } catch (photoError) {
                        console.error(`[DEBUG-MATCH] Error processing photo ${photo.id}:`, photoError);
                    }
                }));
                
                // Add delay between batches to prevent overwhelming the API
                if (i + BATCH_SIZE < photos.length) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            
            console.log(`[DEBUG-MATCH] Updated ${matchCount} photos with user ${userId}`);
            
            return { 
                success: true, 
                message: `Updated ${matchCount} photos with matches`,
                matchCount
            };
        } catch (error) {
            console.error('[DEBUG-MATCH] Error processing matches:', error);
            return { success: false, message: error.message };
        }
    }
    
    static async verifyPhoto(photoId) {
        try {
            // Check simple_photos table instead of photos
            console.log('[DEBUG] Verifying photo record was created...');
            const { data, error } = await supabase
                .from('simple_photos')
                .select('*')
                .eq('id', photoId)
                .single();

            if (error) {
                console.log('[DEBUG] Error verifying photo record:', error);
                return false;
            }

            if (!data) {
                console.log('[DEBUG] No photo record found in simple_photos');
                return false;
            }

            console.log('[DEBUG] Successfully verified photo in simple_photos:', data.id);
            return true;
        } catch (err) {
            console.log('[DEBUG] Exception verifying photo record:', err);
            return false;
        }
    }

    /**
     * Get the current authenticated user
     * @returns {Promise<Object>} - User data object
     */
    static async getCurrentUser() {
        try {
            const { data, error } = await supabase.auth.getUser();
            
            if (error) {
                console.error('[DEBUG] Error getting current user:', error);
                return null;
            }
            
            return data.user;
        } catch (error) {
            console.error('[DEBUG] Exception getting current user:', error);
            return null;
        }
    }

    // Add this static method for filtering photos to exclude inferred matches
    static filterOutInferredMatches(photos, userId) {
        if (!photos || !Array.isArray(photos)) return [];
        
        console.log(`[PhotoService] Filtering out inferred matches for user ${userId}`);
        
        return photos.map(photo => {
            // Return a new copy of the photo with matched_users filtered
            if (photo.matched_users && Array.isArray(photo.matched_users)) {
                // Keep only non-inferred matches for this user
                const filteredMatches = photo.matched_users.filter(match => 
                    !(match.inferred === true && 
                     (match.userId === userId || match.user_id === userId))
                );
                
                return {
                    ...photo,
                    matched_users: filteredMatches
                };
            }
            
            // No matched_users, return photo as-is
            return photo;
        });
    }
}


