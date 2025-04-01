import { supabase } from '../lib/supabaseClient';
import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { DetectFacesCommand, IndexFacesCommand } from '@aws-sdk/client-rekognition';
import { v4 as uuidv4 } from 'uuid';
import { FaceIndexingService } from './FaceIndexingService';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { validateForTable } from '../utils/databaseValidator';

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
            let processedFile = file; // Use let as it might be reassigned by compression
            
            // Compress if it's an image
            if (processedFile.type.startsWith('image/')) {
                console.log('[PhotoService.uploadPhoto] Compressing image...');
                processedFile = await this.compressImage(processedFile);
                console.log('[PhotoService.uploadPhoto] Compression complete, new size:', processedFile.size);
            }
            
            const photoId = uuidv4();
            console.log('[PhotoService.uploadPhoto] Generated photoId:', photoId);
            
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user) {
                throw new Error(`Authentication error: ${userError?.message || 'No user found'}`);
            }
            const userId = userData.user.id;
            console.log('[PhotoService.uploadPhoto] User ID:', userId);
            
            // Construct path using the processed file name
            const storagePath = `${userId}/${photoId}-${processedFile.name}`;
            console.log('[PhotoService.uploadPhoto] Storage path:', storagePath);
            
            // 1. Upload to storage
            console.log('[PhotoService.uploadPhoto] Uploading file to storage...');
            const { data: storageData, error: storageError } = await supabase.storage
                .from('photos')
                .upload(storagePath, processedFile, { upsert: true });
            
            if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`);
            console.log('[PhotoService.uploadPhoto] Storage upload successful:', storageData);

            // 2. Get Public URL
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storagePath);
            const publicUrl = urlData?.publicUrl;
            if (!publicUrl) {
                 console.warn('[PhotoService.uploadPhoto] Could not get public URL for photo', photoId);
                 // Proceed anyway, URL might not be strictly needed immediately
            }
            console.log('[PhotoService.uploadPhoto] Public URL:', publicUrl);

            // 3. Prepare minimal photo data for initial DB insert
            // We insert basic info first, then trigger face matching
            const initialPhotoData = {
                id: photoId,
                uploaded_by: userId,
                user_id: userId, // Assuming user_id is the same as uploaded_by
                storage_path: storagePath,
                path: storagePath, // Include path if used
                public_url: publicUrl,
                url: publicUrl, // Include url if used
                file_size: processedFile.size,
                size: processedFile.size, // Include size if used
                file_type: processedFile.type,
                type: processedFile.type, // Include type if used
                event_id: eventId || null,
                // Initialize potentially null fields
                faces: [],
                matched_users: [],
                face_ids: [],
                tags: [],
                location: null,
                venue: null,
                event_details: null,
                title: metadata?.title || null,
                description: metadata?.description || null,
                date_taken: metadata?.date_taken || null
            };
            
            // 4. Insert minimal data into database (use Admin client if needed for triggers/RLS bypass)
            console.log('[PhotoService.uploadPhoto] Inserting initial photo record...');
            // Consider using supabaseAdmin if this needs to bypass RLS or trigger specific backend logic
            const { data: insertData, error: insertError } = await supabase
                 .from('photos') // Or 'simple_photos' if that's the target
                 .insert(initialPhotoData)
                        .select()
                        .single();
                        
            if (insertError) {
                // Attempt cleanup: delete the file from storage if DB insert fails?
                console.error('[PhotoService.uploadPhoto] Database insert failed:', insertError);
                // Consider deleting from storage: await supabase.storage.from('photos').remove([storagePath]);
                throw new Error(`Database insert failed: ${insertError.message}`);
            }
            console.log('[PhotoService.uploadPhoto] Initial DB record created:', insertData?.id);

            // 5. Trigger Asynchronous Face Matching (IMPORTANT)
            console.log('[PhotoService.uploadPhoto] Triggering asynchronous face processing...');
            // Read file into bytes *again* (or pass from earlier if feasible)
            const arrayBuffer = await processedFile.arrayBuffer();
            const imageBytes = new Uint8Array(arrayBuffer);
            
            // Call the refactored service method - NO `await` here for async!
            FaceIndexingService.processPhotoUpload(photoId, imageBytes)
                .then(result => {
                    if (result.success) {
                        console.log(`[Background] Photo ${photoId}: Face processing completed. Matches found: ${result.matchesFound}`);
                        // Optionally update the photo record again here with face count or match status if needed
                } else {
                        console.error(`[Background] Photo ${photoId}: Face processing failed: ${result.error}`);
                        // Log error, maybe update photo status to 'matching_failed'
                    }
                })
                .catch(err => {
                    console.error(`[Background] Photo ${photoId}: Uncaught error during face processing: ${err}`);
                });

            // 6. Return success indication immediately to the UI
            console.log('[PhotoService.uploadPhoto] Upload process initiated. Face matching running in background.');
            return {
                success: true,
                url: publicUrl,
                photoId: photoId,
                // Return initial metadata, not waiting for faces
                photoMetadata: {
                     ...initialPhotoData,
                     faces: [], // Indicate faces haven't been processed yet
                     matched_users: [] // Indicate matches haven't been processed yet
                } 
            };

        } catch (error) {
            console.error('[PhotoService.uploadPhoto] Upload failed:', error);
            return {
                success: false,
                error: error.message
            };
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

    static async detectFaces(photoId, imageUrl) {
        try {
            console.log('[PhotoService.detectFaces] Starting face detection for photo:', photoId);
            console.log('[PhotoService.detectFaces] Image URL:', imageUrl);
            
            // First, we need to download the image as a blob since AWS can't process URLs directly
            try {
                console.log('[PhotoService.detectFaces] Downloading image from URL for processing');
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    console.error(`[PhotoService.detectFaces] ERROR: Failed to fetch image: ${response.status} ${response.statusText}`);
                    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                }
                
                // Get the image as an ArrayBuffer
                const imageArrayBuffer = await response.arrayBuffer();
                const imageBytes = new Uint8Array(imageArrayBuffer);
                
                console.log('[PhotoService.detectFaces] Image downloaded successfully, size:', imageBytes.length, 'bytes');
                
                // Now try face detection with the actual image bytes
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        console.log(`[PhotoService.detectFaces] Face detection attempt ${attempt}/3`);
                        
                        const detectFacesCommand = new DetectFacesCommand({
                            Image: {
                                Bytes: imageBytes
                            },
                            Attributes: ['ALL']
                        });
                        
                        console.log('[PhotoService.detectFaces] Sending request to AWS Rekognition...');
                        const detectFacesResponse = await rekognitionClient.send(detectFacesCommand);
                        console.log(`[PhotoService.detectFaces] AWS face detection successful - found ${detectFacesResponse.FaceDetails?.length || 0} faces`);
                        
                        // If we reach here, we have successfully detected faces
                        if (detectFacesResponse.FaceDetails && detectFacesResponse.FaceDetails.length > 0) {
                            console.log(`[PhotoService.detectFaces] Processing ${detectFacesResponse.FaceDetails.length} detected faces`);
                            
                            const faces = detectFacesResponse.FaceDetails.map((face, index) => {
                                console.log(`[PhotoService.detectFaces] Processing face ${index} details`);
                                
                                // Log available attributes
                                const attributeKeys = Object.keys(face);
                                console.log(`[PhotoService.detectFaces] Face ${index} has attributes:`, attributeKeys.join(', '));
                                
                                // Extract attributes
                                const processedFace = {
                                    id: `${photoId}-face-${index}`,
                                    confidence: face.Confidence,
                                    boundingBox: face.BoundingBox,
                                    age: face.AgeRange ? {
                                        low: face.AgeRange.Low,
                                        high: face.AgeRange.High
                                    } : null,
                                    gender: face.Gender ? {
                                        value: face.Gender.Value,
                                        confidence: face.Gender.Confidence
                                    } : null,
                                    smile: face.Smile ? {
                                        value: face.Smile.Value,
                                        confidence: face.Smile.Confidence
                                    } : null,
                                    emotions: face.Emotions ? face.Emotions.map(emotion => ({
                                        type: emotion.Type,
                                        confidence: emotion.Confidence
                                    })) : [],
                                    // Add additional facial attributes
                                    eyesOpen: face.EyesOpen ? {
                                        value: face.EyesOpen.Value,
                                        confidence: face.EyesOpen.Confidence
                                    } : null,
                                    mouthOpen: face.MouthOpen ? {
                                        value: face.MouthOpen.Value,
                                        confidence: face.MouthOpen.Confidence
                                    } : null,
                                    eyeglasses: face.Eyeglasses ? {
                                        value: face.Eyeglasses.Value,
                                        confidence: face.Eyeglasses.Confidence
                                    } : null,
                                    sunglasses: face.Sunglasses ? {
                                        value: face.Sunglasses.Value,
                                        confidence: face.Sunglasses.Confidence
                                    } : null,
                                    beard: face.Beard ? {
                                        value: face.Beard.Value,
                                        confidence: face.Beard.Confidence
                                    } : null,
                                    mustache: face.Mustache ? {
                                        value: face.Mustache.Value,
                                        confidence: face.Mustache.Confidence
                                    } : null,
                                    pose: face.Pose ? face.Pose : null,
                                    quality: face.Quality ? face.Quality : null,
                                    // Also preserve the original Quality with uppercase properties
                                    Quality: face.Quality ? {
                                        Brightness: face.Quality.Brightness,
                                        Sharpness: face.Quality.Sharpness
                                    } : null
                                };
                                
                                // Log full details of what we received and extracted
                                console.log(`[PhotoService.detectFaces] Face ${index} full details:`, JSON.stringify({
                                    original: face,
                                    processed: processedFace
                                }, null, 2));
                                
                                // Check for required attributes
                                if (!processedFace.age) console.warn(`[PhotoService.detectFaces] WARNING: Face ${index} missing age range data`);
                                if (!processedFace.gender) console.warn(`[PhotoService.detectFaces] WARNING: Face ${index} missing gender data`);
                                if (!processedFace.smile) console.warn(`[PhotoService.detectFaces] WARNING: Face ${index} missing smile data`);
                                if (processedFace.emotions.length === 0) console.warn(`[PhotoService.detectFaces] WARNING: Face ${index} has no emotions data`);
                                
                                return processedFace;
                            });
                            
                            console.log(`[PhotoService.detectFaces] Returning ${faces.length} processed faces`);
                            return faces;
                        }
                        
                        console.log('[PhotoService.detectFaces] No faces detected in the image');
                        return [];
                        
                    } catch (awsError) {
                        console.error(`[PhotoService.detectFaces] ERROR: AWS face detection error (attempt ${attempt})`, awsError);
                        
                        // If not the last attempt, wait and retry
                        if (attempt < 3) {
                            const waitTime = attempt * 1000; // Exponential backoff
                            console.log(`[PhotoService.detectFaces] Retrying face detection in ${waitTime}ms...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            console.error('[PhotoService.detectFaces] ERROR: All face detection attempts failed');
                            // Return empty array for no faces on final failure
                            return [];
                        }
                    }
                }
                
                // If we reach here, all attempts failed
                console.warn('[PhotoService.detectFaces] WARNING: All AWS face detection attempts failed, returning empty array');
                return [];
                
            } catch (fetchError) {
                console.error('[PhotoService.detectFaces] ERROR: Failed to fetch image for face detection:', fetchError);
                return [];
            }
        } catch (error) {
            console.error('[PhotoService.detectFaces] ERROR: Face detection error:', error);
            console.error('[PhotoService.detectFaces] Stack trace:', error.stack);
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
            return (data || []).map(photo => ({
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
            
            return (data || []).map(photo => ({
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
            
            // Get all photos that might match these faces but aren't already matched
            const { data: photos, error: photoError } = await supabase
                .from('photos')
                .select('*')
                .not('matched_users', 'cs', `[{"userId":"${userId}"}]`);
                
            if (photoError) {
                console.error('[DEBUG-MATCH] Error fetching photos:', photoError);
                throw photoError;
            }
            
            console.log(`[DEBUG-MATCH] Found ${photos?.length || 0} potential photos to match`);
            
            if (!photos || photos.length === 0) {
                return { success: true, message: 'No new photos to match' };
            }
            
            // Check each photo for face matches
            let matchCount = 0;
            
            for (const photo of photos) {
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
                        continue;
                    }
                    
                    console.log('[DEBUG-MATCH] User data:', userData);
                    
                    // Add user to matched_users if not already present
                    const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
                    
                    // Check if user is already in the matches
                    if (existingMatches.some(match => match.userId === userId)) {
                        console.log(`[DEBUG-MATCH] User ${userId} already in matches for photo ${photo.id}`);
                        continue;
                    }
                    
                    // Add the new match
                    const newMatch = {
                        userId,
                        fullName: userData.full_name || 'Unknown User',
                        avatarUrl: userData.avatar_url || null,
                        confidence: 95 // Default high confidence since we're checking exact face ID matches
                    };
                    
                    const updatedMatches = [...existingMatches, newMatch];
                    console.log('[DEBUG-MATCH] Updated matches:', updatedMatches);
                    
                    // Update the photo
                    const { error: updateError } = await supabase
                        .from('photos')
                        .update({ matched_users: updatedMatches })
                        .eq('id', photo.id);
                        
                    if (updateError) {
                        console.error('[DEBUG-MATCH] Error updating photo:', updateError);
                        continue;
                    }
                    
                    console.log(`[DEBUG-MATCH] Successfully updated matches for photo ${photo.id}`);
                    matchCount++;
                }
            }
            
            return { 
                success: true, 
                matches: matchCount,
                message: `Found ${matchCount} new matches` 
            };
        } catch (error) {
            console.error('[DEBUG-MATCH] Error processing matches:', error);
            return { 
                success: false, 
                error: error.message 
            };
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
                return { data: null, error };
            }
            
            return { data: data.user, error: null };
        } catch (error) {
            console.error('[DEBUG] Exception getting current user:', error);
            return { data: null, error };
        }
    }

    /**
     * Analyzes a photo for a specific user using multiple fallback methods
     * @param {string} photoId - ID of the photo to analyze 
     * @param {string} userId - ID of the user to compare with
     * @returns {Promise<Object>} - Analysis results with confidence score
     */
    static async analyzePhotoForUser(photoId, userId) {
        try {
            // First try: Use Supabase RPC function that calls our Edge Function
            console.log(`[PhotoService] Attempting to use Supabase RPC for analysis...`);
            try {
                const { supabase } = await import('../lib/supabaseClient');
                
                const { data, error } = await supabase.rpc('match_faces_with_aws_data', {
                    p_photo_id: photoId,
                    p_user_id: userId
                });
                
                if (!error && data?.success) {
                    console.log(`[PhotoService] RPC analysis successful:`, data);
                    return {
                        success: true,
                        confidence: data.similarity,
                        faceDetails: data.face_details,
                        matchCount: data.match_count,
                        method: 'supabase_rpc'
                    };
                }
                
                console.warn(`[PhotoService] RPC analysis failed:`, error || 'No data returned');
                
                // Fall through to next approach if RPC fails
            } catch (rpcError) {
                console.warn(`[PhotoService] RPC analysis error:`, rpcError);
                // Fall through to next approach
            }
            
            // Second try: Use Edge Function endpoint directly
            console.log(`[PhotoService] Attempting to use Edge Function for analysis...`);
            try {
                // Get supabase URL and key from environment
                const { supabase } = await import('../lib/supabaseClient');
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gmupwzjxirpkskolsuix.supabase.co';
                
                // Get the anon key directly from environment or try to find it another way
                let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                // If not available in environment, try to get from localStorage (if browser)
                if (!supabaseKey && typeof localStorage !== 'undefined') {
                    try {
                        const storedKey = localStorage.getItem('supabase.auth.token');
                        if (storedKey) {
                            const parsedToken = JSON.parse(storedKey);
                            supabaseKey = parsedToken?.currentSession?.access_token;
                        }
                    } catch (e) {
                        console.warn('[PhotoService] Error retrieving token from localStorage:', e);
                    }
                }
                
                // Fallback to a hardcoded key - only for development, remove in production!
                if (!supabaseKey) {
                    console.warn('[PhotoService] No Supabase key found, using anonymous session');
                    const { data: { session }, error: authError } = await supabase.auth.getSession();
                    
                    if (authError) {
                        throw new Error(`Auth error: ${authError.message}`);
                    }
                    
                    supabaseKey = session?.access_token;
                }
                
                if (!supabaseKey) {
                    throw new Error('No Supabase key available for authorization');
                }
                
                console.log(`[PhotoService] Calling Edge Function at ${supabaseUrl}/functions/v1/compare-faces`);
                
                // Try with no-cors mode first if we have CORS issues
                const fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({ photoId, userId }),
                    credentials: 'include',
                    mode: 'cors' // We'll try with cors first
                };
                
                try {
                    const response = await fetch(`${supabaseUrl}/functions/v1/compare-faces`, fetchOptions);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`[PhotoService] Edge Function HTTP error ${response.status}:`, errorText);
                        throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`);
                    }
                    
                    const result = await response.json();
                    console.log(`[PhotoService] Edge Function result:`, result);
                    
                    if (result.success) {
                        return {
                            success: true,
                            confidence: result.similarity,
                            faceDetails: result.face_details,
                            matchCount: result.match_count,
                            method: 'edge_function'
                        };
                    }
                    
                    throw new Error(result.message || 'Function returned success: false');
                } catch (fetchError) {
                    // If the error is specifically a CORS error, log it clearly
                    if (fetchError.message && (
                        fetchError.message.includes('Failed to fetch') || 
                        fetchError.message.includes('CORS') ||
                        fetchError.message.includes('NetworkError')
                    )) {
                        console.error('[PhotoService] CORS error detected. Please make sure your Edge Function has CORS headers:', fetchError);
                        console.error('To fix this, update your Edge Function with proper CORS headers:');
                        console.error('- Add: Access-Control-Allow-Origin: *');
                        console.error('- Add: Access-Control-Allow-Methods: POST, OPTIONS');
                        console.error('- Add: Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type');
                        throw new Error('CORS error: The Edge Function needs to be updated with CORS headers');
                    }
                    throw fetchError;
                }
            } catch (edgeFunctionError) {
                console.warn(`[PhotoService] Edge Function error:`, edgeFunctionError);
                
                // Log more details about the error for debugging
                if (edgeFunctionError.name === 'TypeError' && edgeFunctionError.message.includes('Failed to fetch')) {
                    console.error('[PhotoService] Network error - likely CORS issue or Function not accessible');
                } else if (edgeFunctionError.message.includes('401')) {
                    console.error('[PhotoService] Authentication error - check your JWT token/API key');
                }
                
                // Fall through to next approach
            }
            
            // Final try: Direct AWS SDK call with error handling
            console.log(`[PhotoService] Attempting direct AWS SDK call for analysis...`);
            try {
                // Load AWS config and SDK
                const { rekognitionClient, COLLECTION_ID } = await import('../config/aws-config');
                const { CompareFacesCommand } = await import('@aws-sdk/client-rekognition');
                
                // 1. Get user's face image
                const { data: faceData } = await supabase
                    .from('face_data')
                    .select('face_data')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                    
                if (!faceData?.face_data?.image_path) {
                    throw new Error('No face image found for user');
                }
                
                // 2. Download face image
                const { data: faceImageData } = await supabase.storage
                    .from('face-data')
                    .download(faceData.face_data.image_path);
                    
                if (!faceImageData) {
                    throw new Error('Failed to download face image');
                }
                
                const faceArrayBuffer = await faceImageData.arrayBuffer();
                const faceBytes = new Uint8Array(faceArrayBuffer);
                
                // 3. Get photo image path
                try {
                    console.log(`[PhotoService] Querying database for photo ID:`, photoId);
                    
                    // First check the photos table
                    let { data: photoResults, error: photoError } = await supabase
                        .from('photos')
                        .select('storage_path')
                        .eq('id', photoId);
                        
                    // If not found in photos table, try the simple_photos table
                    if (!photoResults || photoResults.length === 0) {
                        console.log(`[PhotoService] Not found in photos table, checking simple_photos...`);
                        ({ data: photoResults, error: photoError } = await supabase
                            .from('simple_photos')
                            .select('storage_path')
                            .eq('id', photoId));
                    }
                    
                    // If not found in simple_photos, try all_photos view
                    if (!photoResults || photoResults.length === 0) {
                        console.log(`[PhotoService] Not found in simple_photos, checking all_photos...`);
                        ({ data: photoResults, error: photoError } = await supabase
                            .from('all_photos') 
                            .select('storage_path')
                            .eq('id', photoId));
                    }
                    
                    if (photoError) {
                        console.error(`[PhotoService] Database query error:`, photoError);
                        throw new Error(`Database error: ${photoError.message}`);
                    }
                    
                    // Get the first result if available
                    let photoData = null;
                    if (photoResults && photoResults.length > 0) {
                        photoData = photoResults[0];
                        console.log(`[PhotoService] Found photo in database:`, photoData);
                    } else {
                        // Try to get the photo directly from the UI component
                        console.log(`[PhotoService] No photo found in database, trying to use passed photo object directly...`);
                        
                        // Try to get the photo from PhotoManager.jsx
                        try {
                            // Attempt to construct a path from the ID if we have to
                            const constructedPath = `photos/${photoId}.png`;
                            console.log(`[PhotoService] Using constructed storage path: ${constructedPath}`);
                            
                            photoData = { storage_path: constructedPath };
                        } catch (pathError) {
                            console.error(`[PhotoService] Error constructing path:`, pathError);
                            throw new Error(`No photo found with ID: ${photoId}`);
                        }
                    }
                    
                    if (!photoData?.storage_path) {
                        console.error(`[PhotoService] No storage path found for photo ID:`, photoId);
                        throw new Error('No storage path found for photo');
                    }
                    
                    console.log(`[PhotoService] Using storage path:`, photoData.storage_path);
                
                    // 4. Download photo image
                    const { data: photoImageData, error: downloadError } = await supabase.storage
                        .from('photos')
                        .download(photoData.storage_path);
                        
                    if (downloadError) {
                        console.error(`[PhotoService] Error downloading photo:`, downloadError);
                        throw new Error(`Failed to download photo: ${downloadError.message}`);
                    }
                    
                    if (!photoImageData) {
                        throw new Error('Failed to download photo image');
                    }
                    
                    const photoArrayBuffer = await photoImageData.arrayBuffer();
                    const photoBytes = new Uint8Array(photoArrayBuffer);
                    
                    // 5. Call AWS Rekognition
                    const command = new CompareFacesCommand({
                        SourceImage: { Bytes: faceBytes },
                        TargetImage: { Bytes: photoBytes },
                        SimilarityThreshold: 95
                    });
                    
                    const response = await rekognitionClient.send(command);
                    
                    if (response.FaceMatches && response.FaceMatches.length > 0) {
                        const bestMatch = response.FaceMatches[0];
                        
                        console.log(`[PhotoService] Direct AWS analysis successful:`, bestMatch);
                        
                        // Store the match in the database for future reference
                        try {
                            const matchData = {
                                photo_id: photoId,
                                user_id: userId,
                                confidence: bestMatch.Similarity / 100,
                                matched_at: new Date().toISOString(),
                                // Convert any non-serializable parts to avoid issues
                                aws_response: JSON.stringify(response)
                            };
                            
                            console.log(`[PhotoService] Storing match data in database:`, matchData);
                            
                            const { error: upsertError } = await supabase
                                .from('photo_faces')
                                .upsert(matchData, { onConflict: 'photo_id,user_id' });
                                
                            if (upsertError) {
                                console.error(`[PhotoService] Error storing match data:`, upsertError);
                            } else {
                                console.log(`[PhotoService] Successfully stored match data`);
                            }
                        } catch (dbError) {
                            console.error(`[PhotoService] Database storage error:`, dbError);
                            // Continue even if storage fails
                        }
                        
                        return {
                            success: true,
                            confidence: bestMatch.Similarity / 100,
                            faceDetails: bestMatch.Face,
                            boundingBox: bestMatch.Face.BoundingBox,
                            method: 'direct_aws'
                        };
                    } else {
                        console.log(`[PhotoService] Direct AWS analysis found no matches`);
                        return {
                            success: false,
                            message: 'No face matches found',
                            method: 'direct_aws'
                        };
                    }
                } catch (photoError) {
                    console.error(`[PhotoService] Error handling photo:`, photoError);
                    throw photoError;
                }
            } catch (awsError) {
                console.warn(`[PhotoService] Direct AWS analysis error:`, awsError);
                
                // Fallback: Just indicate failure, don't simulate
                return {
                    success: false,
                    message: `All methods failed. Last error (AWS): ${awsError.message}`,
                    method: 'all_failed'
                };
            }
        } catch (err) {
            console.error(`[PhotoService] All analysis approaches failed:`, err);
            return {
                success: false,
                message: err.message,
                method: 'all_failed'
            };
        }
    }
  
    /**
     * Returns all images that matched with a specific user
     * @param {string} userId - User ID to find matches for
     * @returns {Promise<Array>} - Array of matched photos with confidence scores
     */
    static async getUserMatchedPhotos(userId) {
        try {
            console.log(`[PhotoService] Getting matched photos for user ${userId}`);
            const { supabase } = await import('../lib/supabaseClient');
            
            // Define minimum confidence threshold for display (97%)
            const MIN_DISPLAY_CONFIDENCE = 0.97;
            
            // First try: Get matches from photo_faces table
            const { data: matchData, error: matchError } = await supabase
                .from('photo_faces')
                .select('photo_id, confidence, created_at')
                .eq('user_id', userId);
                
            if (matchError) {
                console.warn(`[PhotoService] Database match query error:`, matchError);
                // Fall through to localStorage
            } else if (matchData && matchData.length > 0) {
                console.log(`[PhotoService] Found ${matchData.length} matches in database`);
                
                // Filter out low-confidence matches
                const highConfidenceMatches = matchData.filter(match => 
                    match.confidence >= MIN_DISPLAY_CONFIDENCE
                );
                
                console.log(`[PhotoService] Filtered to ${highConfidenceMatches.length} high-confidence matches (>=${MIN_DISPLAY_CONFIDENCE * 100}%)`);
                
                if (highConfidenceMatches.length === 0) {
                    console.log(`[PhotoService] No matches meet the confidence threshold of ${MIN_DISPLAY_CONFIDENCE * 100}%`);
                    return [];
                }
                
                // Fetch the actual photos
                const photoIds = highConfidenceMatches.map(match => match.photo_id);
                const { data: photos, error: photosError } = await supabase
                    .from('photos')
                    .select('*')
                    .in('id', photoIds);
                    
                if (photosError || !photos) {
                    console.warn(`[PhotoService] Error fetching matched photos:`, photosError);
                    // Fall through to localStorage
                } else {
                    // Combine photos with match data
                    const enrichedPhotos = photos.map(photo => {
                        const match = highConfidenceMatches.find(m => m.photo_id === photo.id);
                        return {
                            ...photo,
                            match_confidence: match?.confidence || null,
                            match_date: match?.created_at || null,
                            match_source: 'database'
                        };
                    });
                    
                    console.log(`[PhotoService] Returning ${enrichedPhotos.length} high-confidence matched photos from database`);
                    return enrichedPhotos;
                }
            }
            
            // Second try: Get matches from localStorage (also applying confidence filtering)
            try {
                const localStorageKey = `face_matches_${userId}`;
                const localMatchesJson = localStorage.getItem(localStorageKey);
                
                if (localMatchesJson) {
                    const localMatches = JSON.parse(localMatchesJson);
                    
                    if (localMatches && localMatches.length > 0) {
                        console.log(`[PhotoService] Found ${localMatches.length} matches in localStorage`);
                        
                        // Filter by confidence
                        const highConfidenceLocalMatches = localMatches.filter(match => {
                            const confidence = match.similarity || match.confidence || 0;
                            return confidence >= MIN_DISPLAY_CONFIDENCE;
                        });
                        
                        console.log(`[PhotoService] Filtered to ${highConfidenceLocalMatches.length} high-confidence localStorage matches`);
                        
                        if (highConfidenceLocalMatches.length === 0) {
                            console.log(`[PhotoService] No localStorage matches meet the confidence threshold`);
                            return [];
                        }
                        
                        // Fetch the actual photos
                        const photoIds = highConfidenceLocalMatches.map(match => match.photo_id).filter(Boolean);
                        
                        if (photoIds.length === 0) {
                            console.warn(`[PhotoService] No valid photo IDs in high-confidence localStorage matches`);
                            return [];
                        }
                        
                        const { data: photos, error: photosError } = await supabase
                            .from('photos')
                            .select('*')
                            .in('id', photoIds);
                            
                        if (photosError || !photos) {
                            console.warn(`[PhotoService] Error fetching localStorage matched photos:`, photosError);
                            return localMatches.map(match => ({
                                id: match.photo_id,
                                match_confidence: match.similarity || match.confidence || null,
                                match_date: match.created_at || new Date().toISOString(),
                                match_source: 'localStorage_only'
                            }));
                        }
                        
                        // Combine photos with match data
                        const enrichedPhotos = photos.map(photo => {
                            const match = highConfidenceLocalMatches.find(m => m.photo_id === photo.id);
                            return {
                                ...photo,
                                match_confidence: match?.similarity || match?.confidence || null,
                                match_date: match?.created_at || null,
                                match_source: 'localStorage'
                            };
                        });
                        
                        console.log(`[PhotoService] Returning ${enrichedPhotos.length} high-confidence matched photos from localStorage`);
                        return enrichedPhotos;
                    }
                }
            } catch (localError) {
                console.warn(`[PhotoService] Error processing localStorage matches:`, localError);
            }
            
            console.log(`[PhotoService] No matches found in database or localStorage`);
            return [];
        } catch (err) {
            console.error(`[PhotoService] Error getting user matched photos:`, err);
            return [];
        }
    }

    /**
     * Clears old face matches when a user updates their face data
     * Call this method whenever a user registers a new face
     * @param {string} userId - User ID whose matches should be cleared
     * @returns {Promise<boolean>} - Success or failure
     */
    static async clearOldFaceMatches(userId) {
        try {
            console.log(`[PhotoService] Clearing old face matches for user ${userId}`);
            const { supabase } = await import('../lib/supabaseClient');
            
            // 1. Clear database matches
            const { error: deleteError } = await supabase
                .from('photo_faces')
                .delete()
                .eq('user_id', userId);
                
            if (deleteError) {
                console.error(`[PhotoService] Error clearing database matches:`, deleteError);
                // Continue to localStorage clearing
            } else {
                console.log(`[PhotoService] Successfully cleared database matches for user ${userId}`);
            }
            
            // 2. Clear localStorage matches
            try {
                const localStorageKey = `face_matches_${userId}`;
                localStorage.removeItem(localStorageKey);
                console.log(`[PhotoService] Cleared localStorage matches for user ${userId}`);
            } catch (localError) {
                console.error(`[PhotoService] Error clearing localStorage matches:`, localError);
            }
            
            return true;
        } catch (err) {
            console.error(`[PhotoService] Error clearing old face matches:`, err);
            return false;
        }
    }
}