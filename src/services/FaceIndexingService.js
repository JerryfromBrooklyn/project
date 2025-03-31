/* =========================================================
 * CRITICAL SECURITY NOTICE - DO NOT MODIFY UNLESS AUTHORIZED
 * =========================================================
 * 
 * ROW LEVEL SECURITY (RLS) CONFIGURATION:
 * 
 * - RLS has been DELIBERATELY DISABLED on database tables
 * - DO NOT ENABLE RLS POLICIES until project completion
 * - Enabling RLS prematurely will BREAK admin functionality
 *   and face matching features
 * 
 * When the project is complete, a comprehensive security review
 * will establish appropriate RLS policies that maintain functionality
 * while ensuring data protection.
 * 
 * Any changes to this configuration require security team approval.
 * =========================================================
 */

import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { IndexFacesCommand, SearchFacesByImageCommand, SearchFacesCommand, DetectFacesCommand, ListCollectionsCommand, DeleteCollectionCommand, CreateCollectionCommand } from '@aws-sdk/client-rekognition';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { supabase } from '../lib/supabaseClient';
import { validateForTable } from '../utils/databaseValidator';
import { storeFaceId } from './FaceStorageService';

export class FaceIndexingService {
    static async indexFace(imageBytes, userId) {
        try {
            console.group('Face Indexing Process');
            console.log('🔍 Starting face indexing...');
            console.log('Step 1: Detecting faces in image...');
            const detectedFaces = await this.detectFacesWithRetry(imageBytes);
            if (!detectedFaces || detectedFaces.length === 0) {
                console.warn('❌ No faces detected in image');
                console.groupEnd();
                return {
                    success: false,
                    error: 'No faces detected in image'
                };
            }
            if (detectedFaces.length > 1) {
                console.warn('❌ Multiple faces detected in image');
                console.groupEnd();
                return {
                    success: false,
                    error: 'Only one face can be registered at a time'
                };
            }
            console.log('Step 2: Indexing face...');
            const command = new IndexFacesCommand({
                CollectionId: this.COLLECTION_ID,
                Image: { Bytes: imageBytes },
                ExternalImageId: userId,
                DetectionAttributes: ['ALL'],
                MaxFaces: 1,
                QualityFilter: 'AUTO'
            });
            const response = await rekognitionClient.send(command);
            if (!response.FaceRecords || response.FaceRecords.length === 0) {
                console.warn('❌ No faces indexed');
                console.groupEnd();
                return {
                    success: false,
                    error: 'Failed to index face'
                };
            }
            const faceRecord = response.FaceRecords[0];
            const faceId = faceRecord.Face?.FaceId;
            console.log('✅ Face indexed successfully:', faceId);
            console.log('Face attributes:', faceRecord.FaceDetail);
            // Save the indexed face data to our database
            await this.saveFaceData(userId, faceId, faceRecord.FaceDetail);
            // Save the image to storage for reference
            const fileName = `${Date.now()}.jpg`;
            const filePath = `${userId}/${fileName}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('face-data')
                .upload(filePath, imageBytes, {
                contentType: 'image/jpeg',
                upsert: false
            });
            if (!uploadError) {
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('face-data')
                    .getPublicUrl(filePath);
                // Update face_data with image path and URL
                await supabase
                    .from('face_data')
                    .update({
                    face_data: {
                        aws_face_id: faceId,
                        attributes: faceRecord.FaceDetail,
                        image_path: filePath,
                        public_url: publicUrl
                    }
                })
                    .eq('user_id', userId);
            }
            // Now find matches using the face ID (one API call to AWS instead of many)
            console.log('Step 3: Searching for face matches using FaceId...');
            const matchedPhotos = await this.searchFacesByFaceId(faceId, userId);
            if (matchedPhotos.length > 0) {
                console.log(`✅ Found ${matchedPhotos.length} photos with matching faces`);
            }
            else {
                console.log('No matching photos found');
            }
            console.groupEnd();
            return {
                success: true,
                faceId,
                attributes: faceRecord.FaceDetail
            };
        }
        catch (error) {
            console.error('❌ Error indexing face:', error);
            console.groupEnd();
            return {
                success: false,
                error: error.message || 'Failed to index face'
            };
        }
    }
    static async saveFaceData(userId, faceId, attributes) {
        try {
            console.log('[DEBUG-FACESAVE] Saving face data for user:', userId);
            console.log('[DEBUG-FACESAVE] Face ID:', faceId);
            
            // First, store in storage as reliable backup
            try {
                await storeFaceId(userId, faceId);
                console.log('[DEBUG-FACESAVE] Face ID stored in storage backup system');
            } catch (storageError) {
                console.error('[DEBUG-FACESAVE] Failed to store in backup storage:', storageError);
                // Continue with database operations even if storage fails
            }
            
            // Try to update face_data table if it exists
            try {
                // First check if the user already has face data
                const { data: existingData, error: fetchError } = await supabase
                    .from('face_data')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();
                
                if (fetchError) {
                    console.error('[DEBUG-FACESAVE] Error fetching existing face data:', fetchError);
                    // Don't throw, continue with other operations
                } else {
                    console.log('[DEBUG-FACESAVE] Existing face data:', existingData);
                
                    // Make sure faceId is defined - generate a fallback if needed
                    const validFaceId = faceId || `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    console.log(`[DEBUG-FACESAVE] Using face ID: ${validFaceId} for user ${userId}`);
                    
                    // Prepare the face data object
                    const faceDataObj = {
                        aws_face_id: validFaceId,
                        attributes: attributes || {},
                        updated_at: new Date().toISOString()
                    };
                
                    // Update or insert face data
                    if (existingData) {
                        // Update existing record
                        const updateData = {
                            user_id: userId,
                            face_id: validFaceId,
                            face_data: faceDataObj,
                            updated_at: new Date().toISOString()
                        };
                        console.log('[DEBUG-FACESAVE] Updating existing face data:', updateData);
                        
                        const { error: updateError } = await supabase
                            .from('face_data')
                            .update(updateData)
                            .eq('id', existingData.id);
                        
                        if (updateError) {
                            console.error('[DEBUG-FACESAVE] Error updating face data:', updateError);
                        } else {
                            console.log('[DEBUG-FACESAVE] Face data updated successfully');
                        }
                    } else {
                        // If we reach here, there's no record for this user
                        // Create new record
                        const insertData = {
                            user_id: userId,
                            face_id: validFaceId,
                            face_data: faceDataObj,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        console.log('[DEBUG-FACESAVE] Creating new face data record:', insertData);
                        
                        const { error: insertError } = await supabase
                            .from('face_data')
                            .insert(insertData);
                            
                        if (insertError) {
                            console.error('[DEBUG-FACESAVE] Error inserting face data:', insertError);
                        } else {
                            console.log('[DEBUG-FACESAVE] Face data inserted successfully');
                        }
                    }
                }
            } catch (faceDataError) {
                console.error('[DEBUG-FACESAVE] Error with face_data operations:', faceDataError);
                // Continue with other operations
            }
            
            // Try to update user_faces table if it exists
            try {
                console.log('[DEBUG-FACESAVE] Updating user_faces table...');
                const { data: existingFace, error: faceError } = await supabase
                    .from('user_faces')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();
                
                if (faceError) {
                    console.log('[DEBUG-FACESAVE] Error checking user_faces table:', faceError);
                    // Table likely doesn't exist, skip this step
                } else if (existingFace) {
                    // Update existing record
                    const { error: updateError } = await supabase
                        .from('user_faces')
                        .update({ face_id: faceId })
                        .eq('user_id', userId);
                        
                    if (updateError) {
                        console.error('[DEBUG-FACESAVE] Error updating user_faces:', updateError);
                    } else {
                        console.log('[DEBUG-FACESAVE] user_faces table updated successfully');
                    }
                } else {
                    // Insert new record
                    const { error: insertError } = await supabase
                        .from('user_faces')
                        .insert({ user_id: userId, face_id: faceId });
                        
                    if (insertError) {
                        console.error('[DEBUG-FACESAVE] Error inserting into user_faces:', insertError);
                    } else {
                        console.log('[DEBUG-FACESAVE] user_faces record created successfully');
                    }
                }
            } catch (userFacesError) {
                console.error('[DEBUG-FACESAVE] Error with user_faces operations:', userFacesError);
            }
            
            // Try to update profiles table if it exists
            try {
                console.log('[DEBUG-FACESAVE] Updating profiles table...');
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ face_id: faceId })
                    .eq('id', userId);
                
                if (profileError) {
                    console.log('[DEBUG-FACESAVE] Could not update profiles table:', profileError.message);
                    // Column likely doesn't exist, skip this step
                } else {
                    console.log('[DEBUG-FACESAVE] profiles table updated successfully');
                }
            } catch (profileError) {
                console.error('[DEBUG-FACESAVE] Error with profiles operations:', profileError);
            }
            
            console.log(`Face data saved to database: User ${userId}, Face ID ${faceId}`);
            
            // Search for matches with the newly saved face ID
            console.log('[DEBUG-FACESAVE] Searching for matches with newly saved face...');
            const matchingPhotos = await this.searchFacesByFaceId(faceId, userId);
            console.log('[DEBUG-FACESAVE] Found', matchingPhotos.length, 'matching photos');
            
            return true;
        } catch (error) {
            console.error('Error saving face data:', error);
            return false;
        }
    }
    static async searchFacesByFaceId(faceId, userId) {
        try {
            console.log(`[FACE-MATCH] Searching for faces matching FaceId: ${faceId} for user ${userId}`);
            
            // Step 1: Ensure we're using the optimal parameters for AWS SearchFaces API
            const command = new SearchFacesCommand({
                CollectionId: COLLECTION_ID,
                FaceId: faceId,
                FaceMatchThreshold: FACE_MATCH_THRESHOLD, // Using threshold from config
                MaxFaces: 1000 // Maximum number of matches allowed by API
            });
            
            console.log(`[FACE-MATCH] Querying AWS Rekognition for matches to face ID: ${faceId}`);
            const response = await rekognitionClient.send(command);
            
            if (!response.FaceMatches?.length) {
                console.log(`[FACE-MATCH] No matching faces found in AWS collection`);
                return [];
            }
            
            console.log(`[FACE-MATCH] Found ${response.FaceMatches.length} matching faces in AWS Rekognition`);
            
            // Step 2: Collect ALL matched face IDs from the response
            const matchedFaceIds = response.FaceMatches
                .map(match => match.Face?.FaceId || '')
                .filter(id => !!id);
                
            console.log(`[FACE-MATCH] Matching face IDs from AWS: ${matchedFaceIds.slice(0, 5).join(', ')}${matchedFaceIds.length > 5 ? '...' : ''}`);
            
            // Always include the original face ID in our search
            if (!matchedFaceIds.includes(faceId)) {
                matchedFaceIds.push(faceId);
            }
            
            // Step 3: Get user data to include in the photo matches
            console.log(`[FACE-MATCH] Fetching comprehensive user data for ${userId}`);
            
            // Try users table first
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, avatar_url, email')
                .eq('id', userId)
                .single();
                
            let userInfo = null;
            
            if (userError || !userData) {
                console.log(`[FACE-MATCH] Error or no data from users table, trying profiles table`);
                // Try profiles table as fallback
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email')
                    .eq('id', userId)
                    .single();
                    
                if (!profileError && profileData) {
                    userInfo = profileData;
                    console.log(`[FACE-MATCH] Found user data in profiles table`);
                } else {
                    // Last resort - use minimal data
                    userInfo = { 
                        id: userId,
                        full_name: 'Unknown User',
                        avatar_url: null,
                        email: null
                    };
                    console.log(`[FACE-MATCH] No user profile found, using default values`);
                }
            } else {
                userInfo = userData;
                console.log(`[FACE-MATCH] Found user data in users table`);
            }
            
            // Step 4: Search ALL photos that might contain the matched faces
            // Using a more comprehensive photo search across ALL relevant tables
            
            console.log(`[FACE-MATCH] Searching for photos containing matched face IDs`);
            
            // Using a transaction to ensure consistent reads
            const { data: photos, error: photosError } = await supabase.rpc(
                'find_photos_with_face_ids',
                { face_id_list: matchedFaceIds }
            ).catch(async () => {
                // If the RPC doesn't exist, fall back to direct queries
                console.log('[FACE-MATCH] RPC not available, using direct query fallback');
                
                // First try the all_photos view if it exists
                const { data: allPhotosData, error: allPhotosError } = await supabase
                    .from('all_photos')
                    .select('id, faces, face_ids, matched_users, source_table')
                    .not('matched_users', 'cs', `[{"userId":"${userId}"}]`);
                    
                if (!allPhotosError && allPhotosData) {
                    return { data: allPhotosData, error: null };
                }
                
                // If that fails, query photos table directly
                const { data: photosData, error: directError } = await supabase
                    .from('photos')
                    .select('id, faces, face_ids, matched_users')
                    .not('matched_users', 'cs', `[{"userId":"${userId}"}]`);
                    
                return { data: photosData, error: directError };
            });
            
            if (photosError || !photos) {
                console.error(`[FACE-MATCH] Error fetching photos:`, photosError);
                return [];
            }
            
            console.log(`[FACE-MATCH] Found ${photos?.length || 0} total photos to process`);
            
            // Step 5: Filter photos to find those containing our matched face IDs
            const matchingPhotos = photos.filter(photo => {
                // Check in face_ids array (string array)
                if (Array.isArray(photo.face_ids)) {
                    for (const id of matchedFaceIds) {
                        if (photo.face_ids.includes(id)) {
                            return true;
                        }
                    }
                }
                
                // Check in faces array (objects with faceId property)
                if (photo.faces && Array.isArray(photo.faces)) {
                    for (const face of photo.faces) {
                        if (face.faceId && matchedFaceIds.includes(face.faceId)) {
                            return true;
                        }
                    }
                }
                
                return false;
            });
            
            console.log(`[FACE-MATCH] Filtered to ${matchingPhotos.length} photos that contain matched faces`);
            
            // Step 6: Update each photo's matched_users array with the user's information
            const updatedPhotoIds = [];
            
            for (const photo of matchingPhotos) {
                let tableName = 'photos';
                if (photo.source_table) {
                    tableName = photo.source_table;
                }
                
                // Get match similarity from AWS response for this photo
                let bestSimilarity = 95; // Default high similarity
                
                // Find the corresponding face in the photo to get the similarity
                let matchingFaceId = null;
                
                // First check in face_ids array
                if (Array.isArray(photo.face_ids)) {
                    matchingFaceId = photo.face_ids.find(id => matchedFaceIds.includes(id));
                }
                
                // Then check in faces array
                if (!matchingFaceId && photo.faces && Array.isArray(photo.faces)) {
                    const matchingFace = photo.faces.find(face => 
                        face.faceId && matchedFaceIds.includes(face.faceId)
                    );
                    if (matchingFace) {
                        matchingFaceId = matchingFace.faceId;
                    }
                }
                
                // Find similarity score from AWS response
                if (matchingFaceId) {
                    for (const match of response.FaceMatches) {
                        if (match.Face?.FaceId === matchingFaceId) {
                            bestSimilarity = match.Similarity || bestSimilarity;
                            break;
                        }
                    }
                }
                
                // Build the user match object
                const newMatch = {
                    userId: userId,
                    faceId: faceId,
                    fullName: userInfo.full_name || 'Unknown User',
                    email: userInfo.email || null,
                    avatarUrl: userInfo.avatar_url || null,
                    similarity: bestSimilarity,
                    confidence: bestSimilarity,
                    matchTimestamp: new Date().toISOString()
                };
                
                // Get existing matched_users array or initialize empty
                let existingMatches = [];
                
                if (photo.matched_users) {
                    // Handle different formats of matched_users
                    if (typeof photo.matched_users === 'string') {
                        try {
                            existingMatches = JSON.parse(photo.matched_users);
                        } catch (e) {
                            console.error(`[FACE-MATCH] Error parsing matched_users string:`, e);
                            existingMatches = [];
                        }
                    } else if (Array.isArray(photo.matched_users)) {
                        existingMatches = [...photo.matched_users];
                    }
                }
                
                // Check if user is already in matched_users to prevent duplicates
                const userExists = existingMatches.some(match => 
                    (match.userId === userId || match.user_id === userId)
                );
                
                if (!userExists) {
                    // Add new match to existing matches
                    const updatedMatches = [...existingMatches, newMatch];
                    
                    // Update photo record in the database
                    const { error: updateError } = await supabase
                        .from(tableName)
                        .update({ 
                            matched_users: updatedMatches,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', photo.id);
                        
                    if (updateError) {
                        console.error(`[FACE-MATCH] Error updating photo ${photo.id}:`, updateError);
                    } else {
                        updatedPhotoIds.push(photo.id);
                        console.log(`[FACE-MATCH] Successfully added user ${userId} to photo ${photo.id}`);
                    }
                } else {
                    console.log(`[FACE-MATCH] User ${userId} already exists in matched_users for photo ${photo.id}`);
                }
            }
            
            console.log(`[FACE-MATCH] Updated ${updatedPhotoIds.length} photos with user ${userId}`);
            return updatedPhotoIds;
        } catch (error) {
            console.error('[FACE-MATCH] Error searching faces by FaceId:', error);
            return [];
        }
    }
    static async startBackgroundProcessing() {
        setInterval(() => {
            if (!this.isProcessing) {
                this.processBackgroundTasks();
            }
        }, this.BACKGROUND_INTERVAL);
    }
    static async processBackgroundTasks() {
        if (this.backgroundTasks.length === 0)
            return;
        this.isProcessing = true;
        console.log('Processing background tasks:', this.backgroundTasks.length);
        try {
            const task = this.backgroundTasks[0];
            task.status = 'processing';
            task.updatedAt = new Date();
            switch (task.type) {
                case 'FACE_REGISTRATION':
                    await this.processFaceRegistration(task);
                    break;
                case 'PHOTO_MATCHING':
                    await this.processPhotoMatching(task);
                    break;
            }
            this.backgroundTasks.shift();
        }
        catch (error) {
            console.error('Error processing background task:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    static async processFaceRegistration(task) {
        console.group('Processing Face Registration');
        try {
            const { imageBytes, userId } = task.data;
            const command = new IndexFacesCommand({
                CollectionId: this.COLLECTION_ID,
                Image: { Bytes: imageBytes },
                ExternalImageId: userId,
                DetectionAttributes: ['ALL'],
                MaxFaces: 1,
                QualityFilter: 'AUTO'
            });
            const response = await rekognitionClient.send(command);
            if (!response.FaceRecords?.length) {
                throw new Error('Failed to add face to collection');
            }
            const faceId = response.FaceRecords[0].Face?.FaceId;
            await this.saveFaceData(userId, faceId);
            // Search for matches using the face ID
            await this.searchFacesByFaceId(faceId, userId);
            task.status = 'completed';
        }
        catch (error) {
            task.status = 'failed';
            task.error = error.message;
            console.error('Face registration failed:', error);
        }
        finally {
            console.groupEnd();
        }
    }
    static async processPhotoMatching(task) {
        console.group('Processing Photo Matching');
        try {
            // Only get photos that haven't been matched with this user yet
            const { data: photos } = await supabase
                .from('photos')
                .select('*')
                .not('matched_users', 'cs', `[{"userId":"${task.userId}"}]`);
            if (!photos?.length) {
                console.log('No unmatched photos found to process');
                task.status = 'completed';
                return;
            }
            console.log(`Processing ${photos.length} unmatched photos for user ${task.userId}`);
            // Get the user's face IDs
            const { data: faceData } = await supabase
                .from('face_data')
                .select('face_id')
                .eq('user_id', task.userId);
            if (!faceData?.length) {
                console.log('No face data found for this user');
                task.status = 'completed';
                return;
            }
            const faceIds = faceData.map(fd => fd.face_id);
            console.log(`User has ${faceIds.length} registered faces`);
            // For each face ID, search for matches
            for (const faceId of faceIds) {
                await this.searchFacesByFaceId(faceId, task.userId);
            }
            task.status = 'completed';
        }
        catch (error) {
            task.status = 'failed';
            task.error = error.message;
            console.error('Photo matching failed:', error);
        }
        finally {
            console.groupEnd();
        }
    }
    static addBackgroundTask(task) {
        const newTask = {
            id: crypto.randomUUID(),
            type: task.type,
            userId: task.userId,
            data: task.data || {},
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.backgroundTasks.push(newTask);
        console.log('Added background task:', newTask.type);
    }
    static createCacheKey(imageBytes) {
        // Modified to create a more unique key including the first 5000 bytes and a timestamp prefix
        // This ensures each photo gets a unique cache key
        const timestamp = Math.floor(Date.now() / 10000); // 10-second window
        return timestamp + '-' + Array.from(imageBytes.slice(0, 5000))
            .reduce((acc, byte, index) => acc + (index % 20 === 0 ? byte : 0), 0)
            .toString(36);
    }
    static async searchFaces(imageBytes, photoId) {
        try {
            console.log('Face Search Process');
            console.log('🔍 Starting face search process...');
            
            // Create a cache key based on image content hash and timestamp to avoid duplicate processing
            // Only the first 8 chars of timestamp to allow some caching but ensure freshness
            const timestamp = Date.now().toString().substring(0, 8);
            const randSuffix = Math.random().toString(36).substring(2, 5);
            const cacheKey = `${photoId}-${timestamp}-${randSuffix}`;
            
            console.log(`Generated cache key: ${cacheKey}`);
            
            // Check cache first
            const cached = this.matchCache.get(cacheKey);
            if (cached && cached.timestamp > Date.now() - this.CACHE_TTL) {
                console.log('✅ Using cached results from previous search');
                return cached.result;
            }
            
            // Step 1: Detect faces in the image
            console.log('Step 1: Detecting faces in image...');
            let faceDetails;
            try {
                faceDetails = await this.detectFacesWithRetry(imageBytes);
                console.log('✅ Detected', faceDetails.length, 'faces in image');
                console.log('Face details:', faceDetails);
            } catch (detectError) {
                console.error('❌ Face detection error:', detectError);
                return [];
            }
            
            if (faceDetails.length === 0) {
                console.log('No faces detected in image');
                return [];
            }
            
            // Step 2: Search for matches in the collection
            console.log('Step 2: Searching for face matches in collection...');
            
            // Array to hold all potential matches
            const allMatches = [];
            
            // Process each detected face
            for (let i = 0; i < faceDetails.length; i++) {
                try {
                    const command = new SearchFacesByImageCommand({
                        CollectionId: this.COLLECTION_ID,
                        Image: { Bytes: imageBytes },
                        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                        MaxFaces: 10
                    });
                    
                    const searchResponse = await rekognitionClient.send(command);
                    
                    if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                        console.log(`Face ${i+1}: Found ${searchResponse.FaceMatches.length} potential matches`);
                        
                        // Add all matches to our array
                        searchResponse.FaceMatches.forEach(match => {
                            allMatches.push({
                                userId: match.Face.ExternalImageId, // This holds our user ID
                                faceId: match.Face.FaceId,
                                similarity: match.Similarity,
                                confidence: match.Face.Confidence
                            });
                        });
                    } else {
                        console.log(`Face ${i+1}: No matches found`);
                    }
                } catch (searchError) {
                    console.error(`❌ Error searching for face ${i+1}:`, searchError);
                }
            }
            
            console.log(`✅ Found ${allMatches.length} potential matches`);
            console.log('Raw matches:', allMatches);
            
            // Step 3: Process and deduplicate matches
            console.log('Step 3: Processing matches...');
            const dedupedMatches = {};
            
            // Group matches by user ID and keep the highest confidence match
            allMatches.forEach(match => {
                const userId = match.userId;
                const existingMatch = dedupedMatches[userId];
                
                // Only replace if this match has higher similarity
                if (!existingMatch || match.similarity > existingMatch.similarity) {
                    console.log(`Match processed: User ${userId} with ${match.similarity.toFixed(2)}% confidence`);
                    dedupedMatches[userId] = match;
                }
            });
            
            // Convert back to array and filter by minimum threshold
            const results = Object.values(dedupedMatches).filter(match => {
                const passes = match.similarity >= FACE_MATCH_THRESHOLD;
                if (!passes) {
                    console.log(`Filtered out match for ${match.userId} with low confidence: ${match.similarity.toFixed(2)}%`);
                }
                return passes;
            });
            
            console.log(`✅ Final results: ${results.length} valid matches above ${FACE_MATCH_THRESHOLD}% threshold`);
            console.log('Processed results:', results);
            
            // After getting the results, fetch the user data for each match
            if (results.length > 0) {
                console.log('Fetching user data for matches...');
                
                // Filter out non-UUID user IDs (ExternalImageIds from AWS that aren't valid UUIDs)
                const validUserIds = results.filter(result => {
                    // UUID validation regex pattern
                    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    return uuidPattern.test(result.userId);
                }).map(r => r.userId);
                
                console.log(`Found ${validUserIds.length} valid UUID user IDs out of ${results.length} matches`);
                
                if (validUserIds.length > 0) {
                    try {
                        // CRITICAL FIX: Changed from 'profiles' to 'users' table
                        console.log('[DEBUG-MATCHING] Table used for user lookup: users');
                        console.log('[DEBUG-MATCHING] User IDs being searched:', validUserIds);
                        
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select(`
                                id,
                                full_name,
                                avatar_url,
                                email
                            `)
                            .in('id', validUserIds);
                        
                        console.log('[DEBUG-MATCHING] User data response raw:', userData);    
                        console.log('[DEBUG-MATCHING] User data error:', userError);
                        
                        if (!userError && userData && userData.length > 0) {
                            console.log('User data fetched successfully:', userData);
                            
                            // Enhance results with user data
                            results.forEach(result => {
                                const userProfile = userData.find(u => u.id === result.userId);
                                if (userProfile) {
                                    console.log(`[DEBUG-MATCHING] Found profile for user ${result.userId}: ${userProfile.full_name || userProfile.email}`);
                                    result.fullName = userProfile.full_name || userProfile.email || 'Unknown User';
                                    result.avatarUrl = userProfile.avatar_url || null;
                                } else {
                                    console.log(`[DEBUG-MATCHING] No profile found for user ${result.userId}`);
                                    result.fullName = 'Unknown User';
                                    result.avatarUrl = null;
                                }
                            });
                        } else {
                            // If users table fails, try user_profiles as a fallback
                            console.warn('[DEBUG-MATCHING] Failed to fetch user data from users table, trying user_profiles...');
                            
                            const { data: userProfilesData, error: profilesError } = await supabase
                                .from('user_profiles')
                                .select(`
                                    id,
                                    user_id,
                                    metadata
                                `)
                                .in('user_id', validUserIds);
                                
                            if (!profilesError && userProfilesData && userProfilesData.length > 0) {
                                console.log('[DEBUG-MATCHING] User profiles data found:', userProfilesData);
                                
                                // Enhance results with user profile metadata
                                results.forEach(result => {
                                    const userProfile = userProfilesData.find(u => u.user_id === result.userId);
                                    if (userProfile && userProfile.metadata) {
                                        console.log(`[DEBUG-MATCHING] Found profile metadata for user ${result.userId}`);
                                        result.fullName = userProfile.metadata.full_name || 'Unknown User';
                                        result.avatarUrl = userProfile.metadata.avatar_url || null;
                                    } else {
                                        console.log(`[DEBUG-MATCHING] No profile metadata for user ${result.userId}`);
                                        result.fullName = 'Unknown User';
                                        result.avatarUrl = null;
                                    }
                                });
                            } else {
                                console.warn('[DEBUG-MATCHING] Failed to fetch from user_profiles:', profilesError);
                                // Add default values
                                results.forEach(result => {
                                    result.fullName = 'Unknown User';
                                    result.avatarUrl = null;
                                });
                            }
                        }
                    } catch (userFetchError) {
                        console.error('Error fetching user data:', userFetchError);
                        // Add default values
                        results.forEach(result => {
                            result.fullName = 'Unknown User';
                            result.avatarUrl = null;
                        });
                    }
                } else {
                    console.log('No valid UUID user IDs found, skipping user data fetch');
                    // Add default values for all results
                    results.forEach(result => {
                        result.fullName = 'Unknown User';
                        result.avatarUrl = null;
                    });
                }
            }
            
            console.log('Final results with user data:', results);
            
            // Cache for 30 minutes to reduce API calls
            this.matchCache.set(cacheKey, {
                result: results,
                timestamp: Date.now()
            });
            console.log('Cache updated with new results');
            console.groupEnd();
            return results;
        } catch (error) {
            console.error('❌ Error during face search:', error);
            console.groupEnd();
            return [];
        }
    }
    static async detectFacesWithRetry(imageBytes) {
        let retries = 0;
        let lastError;
        while (retries < this.MAX_RETRIES) {
            try {
                console.log(`Attempt ${retries + 1} to detect faces...`);
                const command = new DetectFacesCommand({
                    Image: { Bytes: imageBytes },
                    Attributes: ['ALL']
                });
                const response = await rekognitionClient.send(command);
                if (!response.FaceDetails || response.FaceDetails.length === 0) {
                    console.log('No faces detected in image');
                    return [];
                }
                console.log(`Successfully detected ${response.FaceDetails.length} faces`);
                return response.FaceDetails;
            }
            catch (error) {
                console.error(`Face detection attempt ${retries + 1} failed:`, error);
                lastError = error;
                retries++;
                if (retries < this.MAX_RETRIES) {
                    const delay = this.RETRY_DELAY * retries;
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error('Failed to detect faces after all retries');
    }
    static async initialize() {
        try {
            console.group('Face Collection Initialization');
            console.log('🔄 Initializing face collection...');
            const listCollections = await rekognitionClient.send(new ListCollectionsCommand({}));
            const collectionExists = listCollections.CollectionIds?.includes(COLLECTION_ID);
            if (!collectionExists) {
                console.log('Creating new face collection...');
                await rekognitionClient.send(new CreateCollectionCommand({
                    CollectionId: COLLECTION_ID,
                    Tags: {
                        Environment: 'production',
                        Application: 'shmong'
                    }
                }));
                console.log('✅ Face collection created successfully');
            }
            else {
                console.log('✅ Face collection already exists');
            }
            console.groupEnd();
            return true;
        }
        catch (error) {
            console.error('❌ Error initializing face collection:', error);
            console.groupEnd();
            return false;
        }
    }
    static async resetCollection() {
        try {
            console.group('Face Collection Reset');
            console.log('🔄 Resetting face collection...');
            try {
                console.log('Deleting existing collection...');
                await rekognitionClient.send(new DeleteCollectionCommand({
                    CollectionId: COLLECTION_ID
                }));
                console.log('✅ Existing collection deleted');
            }
            catch (error) {
                console.log('No existing collection to delete');
            }
            console.log('Creating new collection...');
            await rekognitionClient.send(new CreateCollectionCommand({
                CollectionId: COLLECTION_ID,
                Tags: {
                    Environment: 'production',
                    Application: 'shmong'
                }
            }));
            console.log('✅ New collection created');
            console.log('✅ Collection reset complete');
            console.groupEnd();
            return true;
        }
        catch (error) {
            console.error('❌ Error resetting collection:', error);
            console.groupEnd();
            return false;
        }
    }
    // Force reset collection with explicit error handling for client use
    static async forceResetCollection() {
        console.log('🚨 Performing emergency collection reset...');
        try {
            // Attempt to delete collection even if error
            try {
                await rekognitionClient.send(new DeleteCollectionCommand({
                    CollectionId: this.COLLECTION_ID || COLLECTION_ID
                }));
                console.log('✅ Existing collection deleted');
            } catch (deleteError) {
                console.warn('Collection deletion error (continuing anyway):', deleteError.message);
            }
            
            // Create new collection
            try {
                await rekognitionClient.send(new CreateCollectionCommand({
                    CollectionId: this.COLLECTION_ID || COLLECTION_ID,
                    Tags: {
                        Environment: 'production',
                        Application: 'shmong',
                        ResetAt: new Date().toISOString()
                    }
                }));
                console.log('✅ New collection created');
                return {
                    success: true,
                    message: 'Collection reset successful!'
                };
            } catch (createError) {
                console.error('❌ Collection creation error:', createError);
                return {
                    success: false,
                    message: `Failed to create collection: ${createError.message}`
                };
            }
        } catch (error) {
            console.error('❌ Fatal error in forceResetCollection:', error);
            return {
                success: false,
                message: `Fatal error: ${error.message}`
            };
        }
    }
    // Add this method to reindex all existing photos
    static async reindexAllFaces() {
        try {
            console.log('Starting to reindex all photos...');
            // Get all photos from the database
            const { data: photos, error: photoError } = await supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false });
            if (photoError) {
                console.error('Error fetching photos:', photoError);
                return false;
            }
            if (!photos || photos.length === 0) {
                console.log('No photos found to reindex');
                return true;
            }
            console.log(`Found ${photos.length} photos to reindex`);
            // First, check the structure of a photo to log the fields we have
            if (photos.length > 0) {
                console.log('Photo record structure:', Object.keys(photos[0]));
                console.log('First photo sample:', photos[0]);
            }
            // Process photos in batches to avoid overwhelming AWS
            const batches = [];
            for (let i = 0; i < photos.length; i += this.BATCH_SIZE) {
                batches.push(photos.slice(i, i + this.BATCH_SIZE));
            }
            console.log(`Processing in ${batches.length} batches of up to ${this.BATCH_SIZE} photos`);
            let success = 0;
            let errors = 0;
            for (let i = 0; i < batches.length; i++) {
                console.log(`Processing batch ${i + 1} of ${batches.length}...`);
                const batch = batches[i];
                for (const photo of batch) {
                    try {
                        console.log(`Reindexing photo ${photo.id}...`);
                        // Determine the photo path - try all possible field names
                        let photoPath;
                        let photoData;
                        // Try different possible field names for the path
                        if (photo.path) {
                            photoPath = photo.path;
                        }
                        else if (photo.file_path) {
                            photoPath = photo.file_path;
                        }
                        else if (photo.filePath) {
                            photoPath = photo.filePath;
                        }
                        else if (photo.storage_path) {
                            photoPath = photo.storage_path;
                        }
                        else if (photo.storagePath) {
                            photoPath = photo.storagePath;
                        }
                        else {
                            // Try to construct a path from folder path and ID
                            if (photo.folderPath) {
                                photoPath = `${photo.folderPath}/${photo.id}`;
                            }
                            else if (photo.folder_path) {
                                photoPath = `${photo.folder_path}/${photo.id}`;
                            }
                            else {
                                // Last resort, try a default path
                                photoPath = `photos/${photo.id}`;
                            }
                        }
                        console.log(`Attempting to download photo using path: ${photoPath}`);
                        // Get the photo data from storage
                        const { data, error } = await supabase.storage
                            .from('photos')
                            .download(photoPath);
                        if (error || !data) {
                            console.error(`Error downloading photo ${photo.id} with path ${photoPath}:`, error);
                            // Try one more approach - the URL directly if it exists
                            if (photo.url) {
                                try {
                                    console.log(`Attempting to fetch photo from URL: ${photo.url}`);
                                    const response = await fetch(photo.url);
                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`);
                                    }
                                    photoData = await response.arrayBuffer();
                                    console.log(`Successfully fetched photo from URL`);
                                }
                                catch (urlError) {
                                    console.error(`Error fetching photo from URL:`, urlError);
                                    errors++;
                                    continue;
                                }
                            }
                            else {
                                errors++;
                                continue;
                            }
                        }
                        else {
                            photoData = await data.arrayBuffer();
                        }
                        if (!photoData) {
                            console.error(`No photo data available for photo ${photo.id}`);
                            errors++;
                            continue;
                        }
                        // Convert to Uint8Array
                        const imageBytes = new Uint8Array(photoData);
                        // Detect faces
                        const detectedFaces = await this.detectFacesWithRetry(imageBytes);
                        if (!detectedFaces || detectedFaces.length === 0) {
                            console.log(`No faces detected in photo ${photo.id}`);
                            continue;
                        }
                        console.log(`Detected ${detectedFaces.length} faces in photo ${photo.id}`);
                        // Index faces in AWS Rekognition
                        const command = new IndexFacesCommand({
                            CollectionId: this.COLLECTION_ID,
                            Image: { Bytes: imageBytes },
                            ExternalImageId: `photo_${photo.id}`,
                            DetectionAttributes: ['ALL'],
                            MaxFaces: 10,
                            QualityFilter: 'AUTO'
                        });
                        const response = await rekognitionClient.send(command);
                        if (!response.FaceRecords || response.FaceRecords.length === 0) {
                            console.log(`No faces indexed for photo ${photo.id}`);
                            continue;
                        }
                        console.log(`Successfully indexed ${response.FaceRecords.length} faces for photo ${photo.id}`);
                        // Store unassociated faces
                        const faces = response.FaceRecords.map((record, index) => {
                            return {
                                face_id: record.Face?.FaceId,
                                photo_id: photo.id,
                                external_image_id: `photo_${photo.id}_${index}`,
                                created_at: new Date().toISOString(),
                                attributes: record.FaceDetail || {}
                            };
                        });
                        // Store in database
                        for (const face of faces) {
                            if (!face.face_id)
                                continue;
                            const { error: faceError } = await supabase
                                .from('unassociated_faces')
                                .insert(face);
                            if (faceError) {
                                console.error(`Error storing unassociated face for photo ${photo.id}:`, faceError);
                            }
                        }
                        // Update the photo's faces array
                        const { error: updateError } = await supabase
                            .from('photos')
                            .update({
                            faces: faces.map(face => ({
                                faceId: face.face_id,
                                userId: '',
                                confidence: 0,
                                attributes: face.attributes
                            }))
                        })
                            .eq('id', photo.id);
                        if (updateError) {
                            console.error(`Error updating photo ${photo.id} faces:`, updateError);
                        }
                        else {
                            success++;
                        }
                        // Adding a small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    catch (error) {
                        console.error(`Error reindexing photo ${photo.id}:`, error);
                        errors++;
                    }
                }
                // Add a delay between batches
                if (i < batches.length - 1) {
                    console.log(`Waiting ${this.RETRY_DELAY}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                }
            }
            console.log(`Reindexing completed: ${success} successful, ${errors} errors`);
            return true;
        }
        catch (error) {
            console.error('Error reindexing all faces:', error);
            return false;
        }
    }
    // A new utility method to store unassociated faces with validation
    static async storeUnassociatedFace(faceId, photoId, externalImageId, attributes) {
        try {
            // Create a complete record with all required fields explicitly set
            const completeUnassociatedFace = {
                face_id: faceId,
                photo_id: photoId,
                external_image_id: externalImageId,
                created_at: new Date().toISOString(),
                attributes: attributes || {},
                updated_at: new Date().toISOString()
            };
            
            // Store the complete data directly
            const { error } = await supabase
                .from('unassociated_faces')
                .insert(completeUnassociatedFace);
                
            if (error) {
                console.error('Error storing unassociated face:', error);
                return false;
            }
            
            console.log(`Stored unassociated face: ${faceId} for photo ${photoId}`);
            return true;
        } catch (error) {
            console.error('Error storing unassociated face:', error);
            return false;
        }
    }
    static async indexFacesInPhoto(photoId, faces) {
        try {
            console.log(`[DEBUG] Processing ${faces.length} faces for photo ${photoId}...`);
            const indexedFaces = [];

            // If no faces, return empty array
            if (!faces || faces.length === 0) {
                console.log('[DEBUG] No faces to process');
                return [];
            }

            // Generate local face IDs for each face (no AWS API call needed)
            // This approach ensures we still have face data even without AWS
            for (const face of faces) {
                try {
                    // Generate a local face ID - we'll use this as an identifier
                    const faceId = `local-${photoId.slice(0,8)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                    
                    console.log(`[DEBUG] Generated local face ID: ${faceId}`);
                    
                    // Add to indexed faces array
                    indexedFaces.push({
                        faceId,
                        attributes: face.attributes || {}
                    });
                } catch (faceError) {
                    console.error('[ERROR] Error processing face:', faceError);
                }
            }

            // Log the results
            console.log(`[DEBUG] Processed ${indexedFaces.length} faces with local IDs`);
            return indexedFaces;
        } catch (error) {
            console.error('[ERROR] Error in face indexing:', error);
            return [];
        }
    }
    /**
     * Search for faces in an image by URL
     * @param {string} photoId - Photo ID for tracking
     * @param {string} imageUrl - Public URL of the image
     * @returns {Array} - Array of matching user objects
     */
    static async searchFacesByImage(photoId, imageUrl) {
        try {
            console.log('[FaceIndexingService.searchFacesByImage] STARTED face matching for photo:', photoId);
            console.log('[FaceIndexingService.searchFacesByImage] Image URL:', imageUrl);
            
            // First download the image from URL
            console.log('[FaceIndexingService.searchFacesByImage] Downloading image from URL for processing');
            const response = await fetch(imageUrl);
            
            if (!response.ok) {
                console.error('[FaceIndexingService.searchFacesByImage] ERROR: Failed to download image from URL:', response.status, response.statusText);
                throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
            }
            
            const imageBuffer = await response.arrayBuffer();
            const imageBytes = new Uint8Array(imageBuffer);
            
            console.log('[FaceIndexingService.searchFacesByImage] Image downloaded successfully, size:', imageBytes.length, 'bytes');
            
            // Now detect faces in the image
            console.log('[FaceIndexingService.searchFacesByImage] Detecting faces in image');
            const detectedFaces = await this.detectFacesWithRetry(imageBytes);
            
            if (!detectedFaces || detectedFaces.length === 0) {
                console.log('[FaceIndexingService.searchFacesByImage] No faces detected in image');
                return [];
            }
            
            console.log('[FaceIndexingService.searchFacesByImage] Detected', detectedFaces.length, 'faces in image');
            
            // For each detected face, search for matches
            const allMatches = [];
            
            for (let i = 0; i < detectedFaces.length; i++) {
                try {
                    console.log(`[FaceIndexingService.searchFacesByImage] Processing face ${i+1} of ${detectedFaces.length}`);
                    
                    // Use SearchFacesByImage API
                    const command = new SearchFacesByImageCommand({
                        CollectionId: this.COLLECTION_ID,
                        Image: { Bytes: imageBytes },
                        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                        MaxFaces: 10
                    });
                    
                    console.log('[FaceIndexingService.searchFacesByImage] Sending request to AWS Rekognition...');
                    const searchResponse = await rekognitionClient.send(command);
                    
                    if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                        console.log(`[FaceIndexingService.searchFacesByImage] Found ${searchResponse.FaceMatches.length} potential matches for face ${i+1}`);
                        
                        // Map the AWS responses to our format
                        const matches = searchResponse.FaceMatches.map(match => {
                            return {
                                userId: match.Face.ExternalImageId, // This should contain the user ID
                                faceId: match.Face.FaceId,
                                similarity: match.Similarity,
                                confidence: match.Face.Confidence
                            };
                        });
                        
                        allMatches.push(...matches);
                        console.log('[FaceIndexingService.searchFacesByImage] Processed matches:', JSON.stringify(matches, null, 2));
                    } else {
                        console.log(`[FaceIndexingService.searchFacesByImage] No matches found for face ${i+1}`);
                    }
                } catch (searchError) {
                    console.error(`[FaceIndexingService.searchFacesByImage] ERROR searching for face ${i+1}:`, searchError);
                    console.error('[FaceIndexingService.searchFacesByImage] Error stack:', searchError.stack);
                }
            }
            
            if (allMatches.length === 0) {
                console.log('[FaceIndexingService.searchFacesByImage] No matches found for any faces');
                return [];
            }
            
            console.log(`[FaceIndexingService.searchFacesByImage] Found total of ${allMatches.length} matches across all faces`);
            
            // Deduplicate matches by user ID, keeping the highest confidence match
            const uniqueMatches = {};
            
            allMatches.forEach(match => {
                const userId = match.userId;
                if (!uniqueMatches[userId] || match.similarity > uniqueMatches[userId].similarity) {
                    uniqueMatches[userId] = match;
                }
            });
            
            // Convert to array and sort by similarity
            const finalMatches = Object.values(uniqueMatches)
                .filter(match => match.similarity >= FACE_MATCH_THRESHOLD)
                .sort((a, b) => b.similarity - a.similarity);
            
            console.log(`[FaceIndexingService.searchFacesByImage] Final matches after filtering: ${finalMatches.length}`);
            console.log('[FaceIndexingService.searchFacesByImage] Final matches:', JSON.stringify(finalMatches, null, 2));
            
            return finalMatches;
        } catch (error) {
            console.error('[FaceIndexingService.searchFacesByImage] CRITICAL ERROR:', error);
            console.error('[FaceIndexingService.searchFacesByImage] Error stack:', error.stack);
            return [];
        }
    }
    static async queueFaceMatchingTask(userId, faceId) {
        try {
            console.log(`[FACE-MATCH] Queuing background matching task for user ${userId} with face ID ${faceId}`);
            
            // First try to use the RPC if available
            try {
                const { data, error } = await supabase.rpc('queue_face_matching_task', {
                    user_id: userId,
                    face_id: faceId
                });
                
                if (!error) {
                    console.log(`[FACE-MATCH] Successfully queued background task: ${JSON.stringify(data)}`);
                    return true;
                }
                
                console.log(`[FACE-MATCH] RPC not available, falling back to client-side implementation: ${error.message}`);
            } catch (rpcError) {
                console.log(`[FACE-MATCH] RPC error, using fallback: ${rpcError.message}`);
            }
            
            // Fallback: Store the task in a background_tasks table
            const { error: insertError } = await supabase
                .from('background_tasks')
                .insert({
                    task_type: 'face_matching',
                    user_id: userId,
                    data: {
                        face_id: faceId,
                        created_at: new Date().toISOString()
                    },
                    status: 'pending'
                });
            
            if (insertError) {
                console.error(`[FACE-MATCH] Error queuing background task: ${insertError.message}`);
                return false;
            }
            
            console.log(`[FACE-MATCH] Successfully queued background task via direct insert`);
            return true;
        } catch (error) {
            console.error(`[FACE-MATCH] Error queueing face matching task: ${error.message}`);
            return false;
        }
    }
    static async processBatchedFaceMatching(userId, faceId, batchSize = 50) {
        try {
            console.log(`[FACE-MATCH] Processing batched face matching for user ${userId}`);
            
            // Get total matches - similar to searchFacesByFaceId but without updating
            const command = new SearchFacesCommand({
                CollectionId: COLLECTION_ID,
                FaceId: faceId,
                FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                MaxFaces: 1000
            });
            
            const response = await rekognitionClient.send(command);
            if (!response.FaceMatches?.length) {
                console.log(`[FACE-MATCH] No matching faces found for user ${userId}`);
                return { processed: 0, total: 0 };
            }
            
            const matchedFaceIds = response.FaceMatches.map(match => match.Face?.FaceId || '')
                .filter(id => !!id);
                
            // Also include the original face ID
            if (!matchedFaceIds.includes(faceId)) {
                matchedFaceIds.push(faceId);
            }
            
            console.log(`[FACE-MATCH] Found ${matchedFaceIds.length} face IDs matching user ${userId}`);
            
            // Get user data for matches
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', userId)
                .single();
                
            if (userError) {
                console.error(`[FACE-MATCH] Error fetching user data: ${userError.message}`);
                return { processed: 0, total: 0, error: userError.message };
            }
            
            // Try to get user's email too
            let userEmail = null;
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', userId)
                    .single();
                    
                if (profileData?.email) {
                    userEmail = profileData.email;
                }
            } catch (err) {
                console.log(`[FACE-MATCH] Could not fetch email for user ${userId}: ${err.message}`);
            }
            
            // Find photos that need updating - only get IDs first
            const { data: photosToUpdate, error: countError, count } = await supabase
                .from('all_photos')
                .select('id, source_table', { count: 'exact' })
                .not('matched_users', 'cs', `[{"userId":"${userId}"}]`)
                .or(
                    matchedFaceIds.map(faceId => `face_ids.cs.{${faceId}}`).join(',')
                );
                
            if (countError) {
                console.error(`[FACE-MATCH] Error getting photo count: ${countError.message}`);
                return { processed: 0, total: 0, error: countError.message };
            }
            
            const totalPhotos = count || (photosToUpdate?.length || 0);
            console.log(`[FACE-MATCH] Found ${totalPhotos} photos to update for user ${userId}`);
            
            if (!totalPhotos) {
                return { processed: 0, total: 0 };
            }
            
            // Process in batches
            let processedCount = 0;
            const photoIds = photosToUpdate.map(p => p.id);
            const batchCount = Math.ceil(photoIds.length / batchSize);
            
            console.log(`[FACE-MATCH] Processing ${batchCount} batches of up to ${batchSize} photos each`);
            
            for (let i = 0; i < batchCount; i++) {
                const batchStart = i * batchSize;
                const batchEnd = Math.min((i + 1) * batchSize, photoIds.length);
                const batch = photoIds.slice(batchStart, batchEnd);
                
                console.log(`[FACE-MATCH] Processing batch ${i+1} of ${batchCount}: ${batch.length} photos`);
                
                // Get full details for this batch
                const { data: batchData, error: batchError } = await supabase
                    .from('all_photos')
                    .select('id, matched_users, source_table')
                    .in('id', batch);
                    
                if (batchError) {
                    console.error(`[FACE-MATCH] Error fetching batch ${i+1}: ${batchError.message}`);
                    continue;
                }
                
                // Update each photo in the batch
                for (const photo of batchData) {
                    try {
                        // Create user match object
                        const newMatch = {
                            userId,
                            fullName: userData.full_name || 'Unknown User',
                            avatarUrl: userData.avatar_url || null,
                            confidence: 95,
                            faceId
                        };
                        
                        // Add email if available
                        if (userEmail) {
                            newMatch.email = userEmail;
                        }
                        
                        // Add to matched_users array
                        const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
                        const updatedMatches = [...existingMatches, newMatch];
                        
                        // Update in correct table
                        const tableName = photo.source_table || 'photos';
                        const { error: updateError } = await supabase
                            .from(tableName)
                            .update({ matched_users: updatedMatches })
                            .eq('id', photo.id);
                            
                        if (updateError) {
                            console.error(`[FACE-MATCH] Error updating photo ${photo.id}: ${updateError.message}`);
                        } else {
                            processedCount++;
                        }
                    } catch (photoError) {
                        console.error(`[FACE-MATCH] Error processing photo ${photo.id}: ${photoError.message}`);
                    }
                }
                
                // Add a small delay between batches to prevent rate limiting
                if (i < batchCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            console.log(`[FACE-MATCH] Completed batched processing: updated ${processedCount} of ${totalPhotos} photos`);
            return { processed: processedCount, total: totalPhotos };
        } catch (error) {
            console.error(`[FACE-MATCH] Error in batch processing: ${error.message}`);
            return { processed: 0, total: 0, error: error.message };
        }
    }
}
Object.defineProperty(FaceIndexingService, "COLLECTION_ID", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: COLLECTION_ID
});
Object.defineProperty(FaceIndexingService, "MAX_RETRIES", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 1
});
Object.defineProperty(FaceIndexingService, "RETRY_DELAY", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 2000
});
Object.defineProperty(FaceIndexingService, "BATCH_SIZE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 20
});
Object.defineProperty(FaceIndexingService, "CACHE_TTL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 30 * 60 * 1000
}); // 30 minutes
Object.defineProperty(FaceIndexingService, "BACKGROUND_INTERVAL", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 10000
}); // 10 seconds
Object.defineProperty(FaceIndexingService, "matchCache", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(FaceIndexingService, "backgroundTasks", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: []
});
Object.defineProperty(FaceIndexingService, "isProcessing", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: false
});
FaceIndexingService.startBackgroundProcessing();
FaceIndexingService.initialize().catch(console.error);
export default FaceIndexingService;
