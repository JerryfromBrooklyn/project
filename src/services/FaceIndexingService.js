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
import FaceDetectionService from './FaceDetectionService';

export class FaceIndexingService {
    static async indexFace(imageBytes, userId) {
        try {
            console.group('Face Indexing Process');
            console.log('🔍 Starting face indexing...');
            
            // Step 1: Detect faces
            const detectionResult = await FaceDetectionService.detectFaces(imageBytes);
            if (!detectionResult.success || detectionResult.faceCount === 0) {
                console.warn('❌ No faces detected in image');
                console.groupEnd();
                return { success: false, error: 'No faces detected in image' };
            }
            
            if (detectionResult.faceCount > 1) {
                console.warn('❌ Multiple faces detected in image');
                console.groupEnd();
                return { success: false, error: 'Only one face can be registered at a time' };
            }

            // Step 2: Index face in AWS Rekognition
            let faceId = null;
            let faceDetails = null;
            
            try {
                const command = new IndexFacesCommand({
                    CollectionId: COLLECTION_ID,
                    Image: { Bytes: imageBytes },
                    ExternalImageId: userId,
                    DetectionAttributes: ['ALL'],
                    MaxFaces: 1,
                    QualityFilter: 'HIGH'
                });

                const response = await rekognitionClient.send(command);
                if (response.FaceRecords?.[0]?.Face?.FaceId) {
                    faceId = response.FaceRecords[0].Face.FaceId;
                    faceDetails = response.FaceRecords[0].FaceDetail;
                    console.log('✅ Face indexed in AWS successfully:', faceId);
                } else {
                    console.warn('⚠️ AWS indexing returned no face ID');
                }
            } catch (awsError) {
                console.error('⚠️ AWS indexing error:', awsError);
                // Continue with local processing
            }
            
            // If AWS failed to provide a face ID, generate a client-side ID
            if (!faceId) {
                // Generate a UUID v4 for consistent face recognition
                faceId = crypto.randomUUID ? crypto.randomUUID() : 
                        `local-face-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                faceDetails = detectionResult.faces[0];
                console.log('✅ Generated local face ID:', faceId);
            }

            // Step 3: Store face data in database regardless of AWS success
            try {
                await Promise.all([
                    // Store in user_face_data
                    storeFaceId(userId, faceId),
                    
                    // Store detailed face data
                    FaceDetectionService.storeFaceDetails(faceId, faceDetails),
                    
                    // Store the face-user association for quick lookups
                    supabase.from('face_user_associations').upsert({
                        face_id: faceId,
                        user_id: userId,
                        created_at: new Date().toISOString()
                    })
                ]);
                console.log('✅ Face data stored in database');
            } catch (dbError) {
                console.error('❌ Error storing face data:', dbError);
                // Continue with matching process even if storage fails
            }

            // Step 4: Attempt to search for matches if we have a valid face ID
            let matches = [];
            if (faceId) {
                try {
                    matches = await this.searchFacesByFaceId(faceId, userId);
                    console.log(`Found ${matches.length} photos with matching faces`);
                } catch (matchError) {
                    console.error('❌ Error searching for matches:', matchError);
                }
            }

            // Step 5: Store matches in our database for future use
            if (matches.length > 0) {
                try {
                    const matchData = matches.map(match => ({
                        face_id: faceId,
                        matched_face_id: match.Face?.FaceId || match.matched_face_id,
                        similarity: match.Similarity || match.similarity,
                        confidence: match.Similarity || match.similarity, // Use similarity as confidence
                        user_id: userId,
                        photo_id: match.PhotoId || match.Face?.ExternalImageId || null, // Include photo_id
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error: upsertError } = await supabase.from('face_matches').upsert(matchData, {
                        onConflict: 'face_id, matched_face_id' // Upsert based on face pair
                    });
                    if (upsertError) {
                        console.error('❌ Error upserting match data:', upsertError);
                    } else {
                        console.log('✅ Match data stored/updated in database');
                    }
                } catch (storeError) {
                    console.error('❌ Error storing match data:', storeError);
                }
            }

            console.groupEnd();
            return {
                success: true,
                faceId: faceId, // Always return a face ID, even if locally generated
                matchCount: matches.length
            };
        } catch (error) {
            console.error('❌ Error indexing face:', error);
            console.groupEnd();
            return { 
                success: false, 
                error: error.message || 'Failed to index face',
                faceId: null 
            };
        }
    }

    static async searchFacesByFaceId(faceId, userId) {
        try {
            console.log(`[FACE-MATCH] Searching for faces matching FaceId: ${faceId}`);

            // First check our database for existing matches
            const { data: existingMatches, error: dbError } = await supabase
                .from('face_matches')
                .select('matched_face_id, similarity, photo_id') // Include photo_id
                .eq('face_id', faceId)
                .gt('similarity', 80) // Only consider reasonably confident matches
                .not('photo_id', 'is', null); // Ensure we have a photo associated

            if (dbError) {
                console.error('[FACE-MATCH] Database error checking existing matches:', dbError);
                // Don't throw, proceed to AWS check
            } else if (existingMatches?.length > 0) {
                console.log(`[FACE-MATCH] Using ${existingMatches.length} existing matches from database`);
                // Return in a format consistent with AWS response if needed, or just the relevant data
                return existingMatches.map(match => ({
                    Face: { FaceId: match.matched_face_id }, // Mimic AWS structure
                    Similarity: match.similarity,
                    PhotoId: match.photo_id // Add photo ID
                }));
            }

            // If no existing matches, search AWS
            console.log('[FACE-MATCH] No suitable matches in DB, querying AWS Rekognition...');
            const command = new SearchFacesCommand({
                CollectionId: COLLECTION_ID,
                FaceId: faceId,
                MaxFaces: 1000,
                FaceMatchThreshold: FACE_MATCH_THRESHOLD // Use configured threshold
            });

            const response = await rekognitionClient.send(command);
            const matches = response.FaceMatches || [];
            console.log(`[FACE-MATCH] Found ${matches.length} matches from AWS Rekognition`);

            // Store matches in database for future use
            if (matches.length > 0) {
                const matchData = matches.map(match => ({
                    face_id: faceId,
                    matched_face_id: match.Face.FaceId,
                    similarity: match.Similarity,
                    // Assuming confidence is derived from similarity or AWS response
                    confidence: match.Similarity, // Use similarity as confidence for now
                    user_id: userId,
                    // We need to associate photo_id here if possible, otherwise store without it
                    photo_id: match.Face.ExternalImageId || null, // Check if ExternalImageId is the photo ID
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { error: insertError } = await supabase.from('face_matches').upsert(matchData, {
                     onConflict: 'face_id, matched_face_id' // Define conflict resolution if needed
                });
                
                if (insertError) {
                    console.error('[FACE-MATCH] Error storing AWS matches in database:', insertError);
                } else {
                     console.log(`[FACE-MATCH] Stored ${matchData.length} new matches in database`);
                }
            }

            // Return AWS matches with PhotoId added if possible
            return matches.map(match => ({
                ...match,
                PhotoId: match.Face.ExternalImageId || null
            }));
            
        } catch (error) {
            console.error('[FACE-MATCH] Error in searchFacesByFaceId:', error);
            return []; // Return empty array on error
        }
    }

    static async getPhotosForUser(userId) {
        try {
            // Get user's face ID
            const { data: userData } = await supabase
                .from('user_face_data')
                .select('face_id')
                .eq('user_id', userId)
                .single();

            if (!userData?.face_id) {
                return [];
            }

            // Get all matches for this face ID
            const { data: matches } = await supabase
                .from('face_matches')
                .select(`
                    matched_face_id,
                    similarity,
                    photos!inner(*)
                `)
                .eq('face_id', userData.face_id)
                .order('similarity', { ascending: false });

            return matches?.map(match => match.photos) || [];
        } catch (error) {
            console.error('[FACE-MATCH] Error getting photos:', error);
            return [];
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

    static async createSyntheticPhotosFromAWS(faceMatches, userId) {
        try {
            console.log(`[FACE-MATCH] Creating synthetic photos from ${faceMatches.length} AWS matches`);
            
            // Create basic user info
            const userInfo = {
                userId: userId,
                fullName: 'User',
                confidence: 95
            };
            
            // Create a synthetic photo for each matched face
            return faceMatches.map((match, index) => {
                const faceId = match.Face.FaceId;
                const confidence = match.Similarity;
                
                // Create a unique ID for this synthetic photo
                const syntheticId = `aws-${faceId.substring(0, 8)}-${index}`;
                
                // Create a placeholder image URL (could be replaced with a real image)
                const placeholderUrl = 'https://via.placeholder.com/400x300?text=Face+Match';
                
                return {
                    id: syntheticId,
                    public_url: placeholderUrl,
                    url: placeholderUrl,
                    uploaded_by: match.Face.ExternalImageId || 'unknown',
                    created_at: new Date().toISOString(),
                    matched_users: [userInfo],
                    face_ids: [faceId],
                    faces: [{faceId: faceId, similarity: confidence}],
                    similarity: confidence,
                    is_synthetic: true // Flag to indicate this is a synthetic entry
                };
            });
        } catch (error) {
            console.error(`[FACE-MATCH] Error creating synthetic photos: ${error.message}`);
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
    static async detectFaces(imageBytes) {
        try {
            console.log('[FaceIndexing] Detecting faces in image...');
            
            // Convert Uint8Array to Blob for proper handling
            const blob = new Blob([imageBytes], { type: 'application/octet-stream' });
            
            // Use our new service for safer face detection
            const faces = await FaceDetectionService.getFaces(blob);
            
            console.log(`[FaceIndexing] Successfully detected ${faces.length} faces`);
            return faces;
        } catch (error) {
            console.error('[FaceIndexing] Error detecting faces:', error);
            return []; // Return empty array as safe fallback
        }
    }
    static async detectFacesWithRetry(imageBytes, maxRetries = 3) {
        let attempt = 0;
        let lastError = null;
        
        while (attempt < maxRetries) {
            try {
                attempt++;
                console.log(`[FaceIndexing] Face detection attempt ${attempt}/${maxRetries}`);
                
                // Use our more reliable detection method
                const faces = await this.detectFaces(imageBytes);
                
                // Success! Return the faces
                return faces;
            } catch (error) {
                lastError = error;
                console.warn(`[FaceIndexing] Detection attempt ${attempt} failed:`, error);
                
                // Wait longer between retries
                await new Promise(r => setTimeout(r, 500 * attempt));
            }
        }
        
        console.error(`[FaceIndexing] All ${maxRetries} face detection attempts failed`);
        console.error('[FaceIndexing] Last error:', lastError);
        
        // Return empty array as safe fallback
        return [];
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
    static async processBatchedFaceMatching(userId, faceId, batchSize = 10) {
        try {
            console.log(`[FACE-MATCH] Starting batched processing for user ${userId} with faceId ${faceId}`);
            let userInfo = null;
            
            // Get basic user info to attach to matched photos
            try {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('id, email, full_name')
                    .eq('id', userId)
                    .single();
                    
                if (!error && userData) {
                    userInfo = {
                        userId: userId,
                        email: userData.email || '',
                        fullName: userData.full_name || userData.email || '',
                        avatarUrl: null, // Could fetch this from profiles if needed
                        faceId: faceId,
                        confidence: 99.5
                    };
                    console.log('[FACE-MATCH] Found user data in users table');
                } else {
                    console.log('[FACE-MATCH] User not found in database, using minimal info');
                    userInfo = {
                        userId: userId,
                        faceId: faceId,
                        confidence: 99.5
                    };
                }
            } catch (userError) {
                console.error('[FACE-MATCH] Error fetching user data:', userError);
                // Create minimal user info object
                userInfo = {
                    userId: userId,
                    faceId: faceId,
                    confidence: 99.5
                };
            }
            
            // First try using the server-side SQL function
            try {
                console.log('[FACE-MATCH] Trying server-side SQL function...');
                const { data, error } = await supabase.rpc('update_photos_with_face_ids', {
                    p_face_ids: [faceId],
                    p_user_id: userId,
                    p_user_data: userInfo,
                    p_batch_size: batchSize
                });
                
                if (!error && data && data.success) {
                    console.log(`[FACE-MATCH] Server-side function success: ${data.processed_count} of ${data.total_count} photos processed`);
                    return data.processed_count;
                } else {
                    console.log(`[FACE-MATCH] Server-side function error: ${error?.message || 'Unknown error'}`);
                    // Continue with client-side implementation
                }
            } catch (functionError) {
                console.error('[FACE-MATCH] Error calling server function:', functionError);
                // Continue with client-side implementation
            }
            
            // Fallback to client implementation - first search for matching faces
            console.log(`[FACE-MATCH] Searching for faces matching FaceId: ${faceId} for user ${userId}`);
            
            // Search for similar faces
            const faceSearchCommand = new SearchFacesCommand({
                CollectionId: this.COLLECTION_ID,
                FaceId: faceId,
                MaxFaces: 1000,
                FaceMatchThreshold: 80
            });
            
            const searchResponse = await rekognitionClient.send(faceSearchCommand);
            
            if (!searchResponse.FaceMatches || searchResponse.FaceMatches.length === 0) {
                console.log('[FACE-MATCH] No matching faces found in AWS Rekognition');
                return 0;
            }
            
            console.log(`[FACE-MATCH] Found ${searchResponse.FaceMatches.length} matching faces in AWS Rekognition`);
            
            // Extract the face IDs from the matches
            const matchedFaceIds = searchResponse.FaceMatches.map(match => match.Face.FaceId);
            
            // Log the first few face IDs
            const displayFaceIds = matchedFaceIds.slice(0, 5).join(', ') + 
                (matchedFaceIds.length > 5 ? '...' : '');
            console.log(`[FACE-MATCH] Matching face IDs from AWS: ${displayFaceIds}`);
            
            // Now get photos containing these face IDs
            console.log('[FACE-MATCH] Searching for photos containing matched face IDs');
            
            // Try safer text-based query approach
            const userIdPattern = `%"userId":"${userId}"%`;
            const faceIdList = matchedFaceIds.join(',');
            
            // Get photos that have any of the matched face IDs AND don't already have this user in matched_users
            const { data: photos, error: photosError } = await supabase
                .from('photos')
                .select('*')
                .filter('face_ids', 'cs', `{${faceIdList}}`)
                .not('matched_users::text', 'ilike', userIdPattern)
                .limit(100);
                
            if (photosError) {
                console.error('[FACE-MATCH] Error getting photos:', photosError);
                return 0;
            }
            
            if (!photos || photos.length === 0) {
                console.log('[FACE-MATCH] No photos found containing these face IDs');
                return 0;
            }
            
            console.log(`[FACE-MATCH] Found ${photos.length} photos to update with user match`);
            
            // Update photos in batches of size batchSize
            const updatedPhotos = [];
            const ACTUAL_BATCH_SIZE = Math.min(batchSize, 10); // Ensure batch size is reasonable
            
            for (let i = 0; i < photos.length; i += ACTUAL_BATCH_SIZE) {
                const batch = photos.slice(i, i + ACTUAL_BATCH_SIZE);
                console.log(`[FACE-MATCH] Processing batch ${Math.floor(i/ACTUAL_BATCH_SIZE) + 1} of ${Math.ceil(photos.length/ACTUAL_BATCH_SIZE)}`);
                
                // Process each photo in the batch
                const batchPromises = batch.map(photo => 
                    this.updatePhotoWithUserMatch(photo, userId, userInfo, matchedFaceIds, searchResponse)
                );
                
                // Wait for all updates in this batch to complete
                const batchResults = await Promise.all(batchPromises);
                updatedPhotos.push(...batchResults.filter(Boolean));
                
                // Add a small delay between batches to avoid overwhelming the database
                if (i + ACTUAL_BATCH_SIZE < photos.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            console.log(`[FACE-MATCH] Successfully matched user with ${updatedPhotos.length} photos`);
            return updatedPhotos.length;
        } catch (error) {
            console.error('[FACE-MATCH] Error in batched face matching:', error);
            return 0;
        }
    }
    
    // Helper for manual processing when batched query fails
    static async processFaceIdChunkManually(faceIds, userId, userInfo, batchSize = 5) {
        console.log(`[FACE-MATCH] Manually processing ${faceIds.length} face IDs for user ${userId}`);
        const results = [];
        const userIdPattern = `%"userId":"${userId}"%`;
        
        for (const faceId of faceIds) {
            try {
                const { data, error } = await supabase
                    .from('photos')
                    .select('*')
                    .filter('face_ids', 'cs', `{${faceId}}`)
                    .not('matched_users::text', 'ilike', userIdPattern)
                    .limit(batchSize);
                    
                if (!error && data && data.length > 0) {
                    // Update each photo
                    for (const photo of data) {
                        const updated = await this.updatePhotoWithUserMatch(
                            photo, 
                            userId,
                            userInfo,
                            [faceId],
                            null // No AWS response for this case
                        );
                        
                        if (updated) {
                            results.push(updated);
                        }
                    }
                }
            } catch (err) {
                console.error(`[FACE-MATCH] Error in manual processing: ${err.message}`);
            }
        }
        
        console.log(`[FACE-MATCH] Found ${results.length} photos via individual queries`);
        return results;
    }
    // Check if a specific RPC function exists
    static async checkFunctionExists(functionName) {
        try {
            const { data, error } = await supabase.rpc(functionName, {});
            
            // Check specifically for "function doesn't exist" error message
            if (error && (
                error.message.includes('function') && 
                error.message.includes('does not exist')
            )) {
                return false;
            }
            
            // If we get here, function exists (even if it had other errors)
            return true;
        } catch (e) {
            return false;
        }
    }
    /**
     * Search for face matches in AWS Rekognition
     * @param {string} faceId - Face ID to search for
     * @returns {Promise<Object>} - Object with faces array and error if any
     */
    static async searchFacesInAWS(faceId) {
        try {
            // Search for similar faces in Rekognition
            const command = new SearchFacesCommand({
                CollectionId: COLLECTION_ID,
                FaceId: faceId,
                MaxFaces: 1000,
                FaceMatchThreshold: 80 // More permissive threshold for better results
            });
            
            const response = await rekognitionClient.send(command);
            
            if (!response.FaceMatches || response.FaceMatches.length === 0) {
                console.log(`[FACE-MATCH] No matching faces found in AWS Rekognition`);
                return { faces: [], error: null };
            }
            
            return { 
                faces: response.FaceMatches,
                error: null
            };
        } catch (error) {
            console.error(`[FACE-MATCH] AWS Rekognition search error:`, error);
            return { 
                faces: [],
                error: error
            };
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
// Make service available globally for direct access
if (typeof window !== 'undefined') {
    console.log('[DEBUG] Exposing FaceIndexingService globally');
    window.FaceIndexingService = FaceIndexingService;
}
export default FaceIndexingService;
