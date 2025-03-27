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

    static async uploadPhoto(file, eventId, folderPath, metadata) {
        try {
            console.log('[DEBUG] Starting photo upload process...');
            
            // Generate a unique ID for this photo
            const photoId = uuidv4();
            console.log('[DEBUG] Created photoId:', photoId);
            
            // Determine storage path
            const userId = (await supabase.auth.getUser()).data.user?.id;
            const path = `${userId}/${photoId}-${file.name}`;
            console.log('[DEBUG] Storage path:', path);
            
            // Step 1: Upload the file to storage
            const { data: fileData, error: uploadError } = await supabase.storage
                .from('photos')
                .upload(path, file, { upsert: true });
                
            if (uploadError) {
                console.error('[DEBUG] Upload error:', uploadError);
                throw new Error(`Error uploading file: ${uploadError.message}`);
            }
            
            // Step 2: Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('photos')
                .getPublicUrl(path);
            
            // Step 3: Get file metadata for EXIF processing
            const arrayBuffer = await file.arrayBuffer();
            const imageBytes = new Uint8Array(arrayBuffer);
            
            // Process image data to extract date, etc.
            let creationDate = new Date().toISOString().split('T')[0]; // Default to today's date
            let locationData = null;
            let resolutionWidth = null;
            let resolutionHeight = null;
            
            try {
                // Try to extract EXIF data
                // ... existing code for EXIF extraction ...
            } catch (exifError) {
                console.warn('[DEBUG] EXIF extraction error:', exifError);
            }
            
            // Step 4: Process faces
            let faces = [];
            
            try {
                console.log('[DEBUG] Calling detectFaces method...');
                const detectedFaces = await this.detectFaces(imageBytes, photoId);
                console.log('[DEBUG] Detected faces result:', detectedFaces.length, 'faces found');
                
                // Transform the faces for storage
                faces = detectedFaces.map((face, index) => {
                    // Generate a local face ID if we don't have an AWS one
                    const localFaceId = `local-${photoId.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                    
                    // Extract face attributes for storage
                    const faceAttributes = {};
                    if (face.AgeRange) {
                        faceAttributes.age = { 
                            low: face.AgeRange.Low, 
                            high: face.AgeRange.High 
                        };
                    }
                    
                    if (face.Gender) {
                        faceAttributes.gender = { 
                            value: face.Gender.Value, 
                            confidence: face.Gender.Confidence 
                        };
                    }
                    
                    if (face.Smile) {
                        faceAttributes.smile = { 
                            value: face.Smile.Value, 
                            confidence: face.Smile.Confidence 
                        };
                    }
                    
                    if (face.Emotions && face.Emotions.length > 0) {
                        faceAttributes.emotions = face.Emotions.map(emotion => ({
                            type: emotion.Type,
                            confidence: emotion.Confidence
                        }));
                    }
                    
                    return {
                        faceId: localFaceId,
                        confidence: face.Confidence || 99,
                        boundingBox: face.BoundingBox || null,
                        attributes: faceAttributes,
                        overallConfidence: face.Confidence || 99
                    };
                });
                
                console.log('[DEBUG] Processed face attributes:', JSON.stringify(faces));
            } catch (faceError) {
                console.error('[DEBUG] Face detection error:', faceError);
            }
            
            // Step 5: Index faces and find matches
            let face_ids = [];
            let matched_users = []; // Initialize matched_users here, outside the try-catch block
            
            if (faces.length > 0) {
                console.log(`[DEBUG] Indexing ${faces.length} faces for future matching...`);
                
                // Extract local face IDs for storage and indexing
                face_ids = faces.map(face => face.faceId);
                console.log('[DEBUG] Added face_ids to metadata:', face_ids);
                
                // Step 6: Search for matches using the face IDs
                console.log('[DEBUG] Searching for face matches in registered users...');
                
                try {
                    const matchResults = await FaceIndexingService.searchFaces(imageBytes, photoId);
                    console.log('[DEBUG] Found', matchResults.length, 'matching users!', matchResults);
                    
                    // Filter out matches with confidence below threshold and transform to our format
                    const highConfidenceMatches = matchResults.filter(
                        match => match.confidence >= FACE_MATCH_THRESHOLD
                    );
                    
                    console.log('[DEBUG]', highConfidenceMatches.length, 'valid matches to save to database');
                    
                    // Create the matched_users array with user information for storage
                    matched_users = highConfidenceMatches.map(match => ({
                        userId: match.userId,
                        fullName: match.fullName || 'Unknown User',
                        avatarUrl: match.avatarUrl || null,
                        confidence: match.confidence
                    }));
                    
                    console.log('[DEBUG] Added matched_users to metadata:', matched_users);
                    
                    // Index the faces in AWS Rekognition
                    try {
                        await FaceIndexingService.indexFacesInPhoto(photoId, faces);
                    } catch (indexError) {
                        console.error('[DEBUG] Error indexing faces in AWS:', indexError);
                    }
                } catch (matchError) {
                    console.error('[DEBUG] Error finding face matches:', matchError);
                }
            }
            
            // Step 7: Prepare all metadata for database storage
            const photoRecord = {
                id: photoId,
                user_id: userId,
                title: file.name,
                storage_path: path,
                url: publicUrl,
                size: file.size,
                type: file.type,
                faces: faces,
                face_ids: face_ids,
                matched_users: matched_users, // Now matched_users is always defined
                date_taken: metadata?.date_taken || creationDate,
                event_id: eventId || null,
                event_details: metadata?.event_details || null,
                venue: metadata?.venue || null,
                location: metadata?.location || locationData,
                created_at: new Date().toISOString()
                // Remove resolution from the main insert to prevent errors if column doesn't exist
            };
            
            // Add resolution data conditionally in a separate object
            const resolutionData = resolutionWidth && resolutionHeight ? {
                resolution: { width: resolutionWidth, height: resolutionHeight }
            } : {};
            
            console.log('[DEBUG] Uploading photo to database:', photoId);
            
            // Step 8: Insert into database
            try {
                // First attempt: insert the main data without resolution
                const { data, error } = await supabase
                    .from('photos')
                    .insert(photoRecord);
                    
                if (error) {
                    console.error('[DEBUG] Database insert error:', error);
                    throw new Error(`Error creating photo record: ${error.message}`);
                }
                
                // If we have resolution data, try to update it separately
                if (resolutionWidth && resolutionHeight) {
                    try {
                        const { error: resolutionError } = await supabase
                            .from('photos')
                            .update(resolutionData)
                            .eq('id', photoId);
                            
                        if (resolutionError) {
                            console.warn('[DEBUG] Could not update resolution data:', resolutionError.message);
                            // Don't throw here, just log a warning since the main photo was created successfully
                        }
                    } catch (resolutionUpdateError) {
                        console.warn('[DEBUG] Error updating resolution:', resolutionUpdateError);
                    }
                }
                
                console.log('[DEBUG] Photo uploaded successfully:', photoId);
                
                // Return the complete photo record
                return {
                    success: true,
                    photoId,
                    url: publicUrl,
                    photoData: { ...photoRecord, ...resolutionData }
                };
            } catch (error) {
                console.error('[DEBUG] Database insert error:', error);
                throw error;
            }
        } catch (error) {
            console.error('[DEBUG] Photo upload critical error:', error);
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
    static async detectFaces(imageBytes) {
        try {
            let retries = 0;
            let response;
            let error;
            
            console.log('[DEBUG] Starting face detection with AWS Rekognition...');
            
            while (retries < this.MAX_RETRIES) {
                try {
                    console.log(`[DEBUG] Face detection attempt ${retries + 1}/${this.MAX_RETRIES}`);
                    const command = new DetectFacesCommand({
                        Image: { Bytes: imageBytes },
                        Attributes: ['ALL']
                    });
                    
                    response = await rekognitionClient.send(command);
                    
                    if (response && response.FaceDetails) {
                        console.log(`[DEBUG] AWS face detection successful - found ${response.FaceDetails.length} faces`);
                        return response.FaceDetails || [];
                    } else {
                        console.log('[DEBUG] AWS returned empty response');
                        return [];
                    }
                }
                catch (err) {
                    console.error(`[ERROR] AWS face detection error (attempt ${retries + 1})`, err);
                    error = err;
                    retries++;
                    if (retries < this.MAX_RETRIES) {
                        const delay = this.RETRY_DELAY * retries;
                        console.log(`[DEBUG] Retrying face detection in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            console.error('[ERROR] All face detection attempts failed');
            return []; // Return empty array instead of throwing
        }
        catch (error) {
            console.error('[ERROR] Fatal error in face detection:', error);
            return []; // Return empty array to allow photo upload to continue
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
}


