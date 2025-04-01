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
import { supabaseAdmin } from '../lib/supabaseAdmin'; // Use admin client for backend tasks

export class FaceIndexingService {
    static COLLECTION_ID = COLLECTION_ID; // Assuming COLLECTION_ID is defined in aws-config
    static USER_FACES_COLLECTION_ID = 'user-faces'; // Assuming this is your collection for registered user faces
    static MAX_RETRIES = 1;
    static RETRY_DELAY = 2000;

    /**
     * Registration: Detects, indexes face, and stores user-face link.
     */
    static async indexFace(imageBytes, userId, faceAttributesFromPrecheck = null) {
        try {
            console.group('Face Indexing Process for Registration');
            console.log(`User ID: ${userId}`);

            let faceDetails = faceAttributesFromPrecheck;

            // 1. Detect Faces (if not already done in pre-check)
            if (!faceDetails) {
                 console.log('Step 1: Detecting faces in image (no pre-check details provided)...');
                 const detectedFaces = await this.detectFacesWithRetry(imageBytes);
                 if (!detectedFaces || detectedFaces.length === 0) throw new Error('No faces detected');
                 if (detectedFaces.length > 1) throw new Error('Only one face allowed for registration');
                 faceDetails = detectedFaces[0];
                 // Optional: Add quality check here based on faceDetails.Confidence/Quality
            } else {
                console.log('Using pre-detected face details:', JSON.stringify(faceDetails));
            }

            console.log('Step 2: Indexing face into USER collection...');
            const command = new IndexFacesCommand({
                CollectionId: this.USER_FACES_COLLECTION_ID, // Use the USER collection
                Image: { Bytes: imageBytes },
                ExternalImageId: userId, // Store userId as ExternalImageId
                DetectionAttributes: ['ALL'],
                MaxFaces: 1,
                QualityFilter: 'AUTO'
            });
            const response = await rekognitionClient.send(command);
            if (!response.FaceRecords || response.FaceRecords.length === 0) {
                throw new Error('Failed to index face in AWS Collection');
            }

            const faceRecord = response.FaceRecords[0];
            const faceId = faceRecord.Face?.FaceId;
            if (!faceId) throw new Error('AWS did not return a FaceId');

            console.log('✅ Face indexed successfully in USER collection:', faceId);

            // 3. Store Face Data & User Link
            console.log('Step 3: Storing face data link in database...');
            const stored = await storeFaceId(userId, faceId); // Uses upsert
            if (!stored) {
                 console.warn('Failed to store face ID relation in DB, but continuing...');
            }
            
            // 4. Store face attributes in face_data table
            console.log('Step 4: Updating face attributes in database...');
            console.log('Face details to store:', JSON.stringify(faceDetails || faceRecord.FaceDetail));
            
            const timestamp = new Date().toISOString();
            const imagePath = `${userId}/${timestamp}.jpg`; // Should match what FaceRegistration.jsx uses
            
            // Get the most recent face_data record
            const { data: existingData, error: fetchError } = await supabase
                .from('face_data')
                .select('face_data')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
                
            if (fetchError) {
                console.warn('Failed to fetch existing face data, will create new record:', fetchError);
            }
            
            // Combine existing data with new attributes
            const existingFaceData = existingData?.face_data || {};
            console.log('Existing face_data:', JSON.stringify(existingFaceData));
            
            const faceData = {
                ...existingFaceData,
                face_id: faceId,
                image_path: existingFaceData.image_path || imagePath,
                attributes: faceDetails || faceRecord.FaceDetail,
                updated_at: timestamp
            };
            
            console.log('New face_data to store:', JSON.stringify(faceData));
            
            // First, delete any existing records for this user (if needed)
            if (existingData) {
                const { error: deleteError } = await supabase
                    .from('face_data')
                    .delete()
                    .eq('user_id', userId);
                    
                if (deleteError) {
                    console.warn('Failed to delete existing face data record:', deleteError);
                    // Continue anyway
                }
            }
            
            // Insert a new record with updated data
            const { error: updateError } = await supabase
                .from('face_data')
                .insert({
                    user_id: userId,
                    face_id: faceId,
                    face_data: faceData,
                    updated_at: timestamp
                });
                
            if (updateError) {
                console.warn('Failed to update face attributes in database:', updateError);
            } else {
                console.log('✅ Face attributes successfully stored in database');
            }

            console.groupEnd();
            return {
                success: true,
                faceId,
                attributes: faceRecord.FaceDetail // Return details from IndexFaces response
            };
        } catch (error) {
            console.error('❌ Error in indexFace (Registration):', error);
            console.groupEnd();
            return {
                success: false,
                error: error.message || 'Failed to index face'
            };
        }
    }

    /**
     * Photo Upload: Detects faces, searches for matches against registered users,
     * and stores user-photo links.
     */
    static async processPhotoUpload(photoId, imageBytes) {
        try {
            console.group(`Face Matching Process for Photo Upload: ${photoId}`);

            // 1. Detect Faces in the uploaded photo
            console.log('Step 1: Detecting faces in uploaded photo...');
            const detectedFaces = await this.detectFacesWithRetry(imageBytes);
            if (!detectedFaces || detectedFaces.length === 0) {
                console.log('No faces detected in this photo. Nothing to match.');
                console.groupEnd();
                return { success: true, matchesFound: 0 };
            }
            console.log(`Detected ${detectedFaces.length} faces.`);

            // 2. Search for matches using the IMAGE against the USER collection
            console.log(`Step 2: Searching for matches against ${this.USER_FACES_COLLECTION_ID} collection...`);
            const searchCommand = new SearchFacesByImageCommand({
                CollectionId: this.USER_FACES_COLLECTION_ID, // Search against registered USERS
                Image: { Bytes: imageBytes },
                FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                MaxFaces: 10 // Max registered users to match per face detected in the photo
            });
            const searchResponse = await rekognitionClient.send(searchCommand);

            if (!searchResponse.FaceMatches || searchResponse.FaceMatches.length === 0) {
                console.log('No registered users matched faces in this photo.');
            console.groupEnd();
                return { success: true, matchesFound: 0 };
            }
            console.log(`Found ${searchResponse.FaceMatches.length} potential face matches.`);

            // 3. Process and Store Matches
            console.log('Step 3: Processing and storing matches...');
            const matchesToStore = [];
            for (const match of searchResponse.FaceMatches) {
                const matchedFace = match.Face;
                const similarity = match.Similarity;

                if (matchedFace && similarity && similarity >= FACE_MATCH_THRESHOLD) {
                    const matchedUserId = matchedFace.ExternalImageId; // UserID stored here
                    const matchedFaceId = matchedFace.FaceId; // The FaceId of the registered user

                    if (matchedUserId) {
                        console.log(`  -> Match found: User ${matchedUserId} (Face: ${matchedFaceId}) with Similarity: ${similarity.toFixed(2)}%`);
                        matchesToStore.push({
                            photo_id: photoId,
                            user_id: matchedUserId,
                            similarity: similarity,
                            matched_face_id: matchedFaceId, // Store the matched user's face_id
                            // detected_face_id: ??? // Need to link which face in the photo triggered this match if possible
                            created_at: new Date().toISOString()
                        });
                    } else {
                         console.warn(`  -> Match found with similarity ${similarity.toFixed(2)}% but missing ExternalImageId (UserID) for FaceId: ${matchedFaceId}`);
                    }
                } else {
                    console.log(`  -> Match ignored: Similarity ${similarity?.toFixed(2)}% below threshold or missing data.`);
                }
            }

            if (matchesToStore.length > 0) {
                 // Use Admin client for direct DB access from backend context
                 const { error: insertError } = await supabaseAdmin
                    .from('photo_faces') // Use the photo_faces junction table
                    .upsert(matchesToStore, { 
                         onConflict: 'photo_id, user_id', // Prevent duplicates for same photo/user
                         ignoreDuplicates: false
                    });

                 if (insertError) {
                    console.error('❌ Error storing matches in photo_faces:', insertError);
                    // Decide if this should be a critical failure
                                } else {
                    console.log(`✅ Successfully stored ${matchesToStore.length} matches in photo_faces.`);
                    }
                } else {
                 console.log('No matches met the threshold or had valid data to store.');
            }

            console.groupEnd();
            return { success: true, matchesFound: matchesToStore.length };

        } catch (error) {
            console.error(`❌ Error in processPhotoUpload for Photo ${photoId}:`, error);
            console.groupEnd();
            return { success: false, error: error.message, matchesFound: 0 };
        }
    }

    // --- Helper Functions (Keep detectFacesWithRetry, initialize, resetCollection etc.) ---

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
    
    // ... other static methods like initialize, resetCollection ...

    // --- REMOVED/DEPRECATED FUNCTIONS ---
    // static async searchFacesByFaceId(...) - Logic moved or replaced by search by image
    // static async searchFaces(...) - Replaced by processPhotoUpload
    // static async saveFaceData(...) - Simplified/merged with indexFace & storeFaceId
    // static async processFaceRegistration(...) - Logic merged into indexFace
    // static async processPhotoMatching(...) - Logic merged into processPhotoUpload
    // static addBackgroundTask(...) - If background tasks aren't used
    // static createCacheKey(...) - If caching isn't implemented here
    // static searchFacesByImage(...) - Old version replaced by processPhotoUpload
}

// Add back required static properties if they were outside the class
FaceIndexingService.COLLECTION_ID = COLLECTION_ID;
FaceIndexingService.USER_FACES_COLLECTION_ID = 'user-faces';
FaceIndexingService.MAX_RETRIES = 1;
FaceIndexingService.RETRY_DELAY = 2000;
