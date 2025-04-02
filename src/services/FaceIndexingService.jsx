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
import { IndexFacesCommand, SearchFacesByImageCommand, SearchFacesCommand, DetectFacesCommand, ListCollectionsCommand, DeleteCollectionCommand, CreateCollectionCommand, DescribeCollectionCommand, ListFacesCommand } from '@aws-sdk/client-rekognition';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { supabase } from '../lib/supabaseClient';
import { validateForTable } from '../utils/databaseValidator';
import { storeFaceId } from './FaceStorageService';
import { createPhotoRecord } from './database-utils';

export class FaceIndexingService {
    static async indexFace(imageBytes, userId) {
        try {
            console.group('[FACE-REG] Face Indexing Process');
            console.log('[FACE-REG] 🔍 Starting face indexing for user registration...');
            console.log('[FACE-REG] User ID:', userId);
            
            // Get collection stats to see what's already indexed
            const stats = await this.getCollectionStats();
            console.log(`[FACE-REG] Current collection has ${stats?.FaceCount || 'unknown'} indexed faces`);
            console.log(`[FACE-REG] Using collection ID: ${this.COLLECTION_ID}`);
            
            console.log('[FACE-REG] Step 1: Detecting faces in image...');
            const detectedFaces = await this.detectFacesWithRetry(imageBytes);
            if (!detectedFaces || detectedFaces.length === 0) {
                console.warn('[FACE-REG] ❌ No faces detected in image');
                console.groupEnd();
                return {
                    success: false,
                    error: 'No faces detected in image'
                };
            }
            if (detectedFaces.length > 1) {
                console.warn('[FACE-REG] ❌ Multiple faces detected in image');
                console.groupEnd();
                return {
                    success: false,
                    error: 'Only one face can be registered at a time'
                };
            }
            
            // Check if user already has a face ID in the database
            const { data: existingFaceData } = await supabase
                .from('face_data')
                .select('face_id')
                .eq('user_id', userId)
                .maybeSingle();
            
            let faceId;
            let attributes;
                
            if (existingFaceData && existingFaceData.face_id) {
                console.log('[FACE-REG] User already has a face ID registered:', existingFaceData.face_id);
                
                // CRITICAL FIX: If the existing face ID has auto_ or any other prefix, 
                // we need to reindex the face with the correct user ID as ExternalImageId
                if (existingFaceData.face_id.startsWith('auto_') || !existingFaceData.face_id.includes(userId)) {
                    console.log('[FACE-REG] ⚠️ Face ID has incorrect format. Re-indexing face with correct user ID format...');
                    
                    // Index this face in the collection with the correct user ID
                    const command = new IndexFacesCommand({
                        CollectionId: this.COLLECTION_ID,
                        Image: { Bytes: imageBytes },
                        ExternalImageId: userId, // IMPORTANT: Use userId directly as the ExternalImageId
                        DetectionAttributes: ['ALL'],
                        MaxFaces: 1,
                        QualityFilter: 'AUTO'
                    });
                    
                    console.log('[FACE-REG] Sending IndexFaces request to AWS with ExternalImageId:', userId);
                    const response = await rekognitionClient.send(command);
                    
                    if (!response.FaceRecords || response.FaceRecords.length === 0) {
                        console.warn('[FACE-REG] ❌ Failed to re-index face with correct ID format');
                        // Continue with existing face ID
                        faceId = existingFaceData.face_id;
                        attributes = detectedFaces[0];
                    } else {
                        // Use the newly indexed face
                        const faceRecord = response.FaceRecords[0];
                        faceId = faceRecord.Face?.FaceId;
                        attributes = faceRecord.FaceDetail;
                        console.log('[FACE-REG] ✅ Face re-indexed successfully with ID:', faceId);
                        console.log('[FACE-REG] ✅ Using user ID as ExternalImageId:', userId);
                        
                        // Update the database with the new face ID
                        await supabase
                            .from('face_data')
                            .update({ face_id: faceId })
                            .eq('user_id', userId);
                            
                        console.log('[FACE-REG] ✅ Updated face_data table with new face ID:', faceId);
                    }
                } else {
                    console.log('[FACE-REG] Using existing face ID but still performing historical matching');
                    faceId = existingFaceData.face_id;
                    attributes = detectedFaces[0]; // Use the detected face attributes
                }
            } else {
                // If no existing face ID, proceed with indexing a new face
                console.log('[FACE-REG] Step 2: Indexing new face in AWS Rekognition...');
                const command = new IndexFacesCommand({
                    CollectionId: this.COLLECTION_ID,
                    Image: { Bytes: imageBytes },
                    ExternalImageId: userId, // IMPORTANT: Use userId directly as the ExternalImageId
                    DetectionAttributes: ['ALL'],
                    MaxFaces: 1,
                    QualityFilter: 'AUTO'
                });
                
                console.log('[FACE-REG] Sending IndexFaces request to AWS with ExternalImageId:', userId);
                const response = await rekognitionClient.send(command);
                
                console.log('[FACE-REG] Raw AWS IndexFaces response:', JSON.stringify({
                    FaceRecords: response.FaceRecords?.map(record => ({
                        Face: {
                            FaceId: record.Face?.FaceId,
                            ExternalImageId: record.Face?.ExternalImageId,
                            Confidence: record.Face?.Confidence
                        },
                        FaceDetail: {
                            BoundingBox: record.FaceDetail?.BoundingBox,
                            Confidence: record.FaceDetail?.Confidence
                        }
                    })),
                    UnindexedFaces: response.UnindexedFaces
                }, null, 2));
                
                if (!response.FaceRecords || response.FaceRecords.length === 0) {
                    console.warn('[FACE-REG] ❌ No faces indexed');
                    console.groupEnd();
                    return {
                        success: false,
                        error: 'Failed to index face'
                    };
                }
                const faceRecord = response.FaceRecords[0];
                faceId = faceRecord.Face?.FaceId;
                attributes = faceRecord.FaceDetail;
                console.log('[FACE-REG] ✅ Face indexed successfully:', faceId);
                console.log('[FACE-REG] ✅ Using user ID as ExternalImageId:', userId);
                console.log('[FACE-REG] Face attributes:', attributes);
                
                // Save the indexed face data to our database immediately
                await this.saveFaceData(userId, faceId, attributes);
                
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
                            attributes: attributes,
                            image_path: filePath,
                            public_url: publicUrl
                        }
                    })
                        .eq('user_id', userId);
                }
            }
            
            // Always perform historical matching regardless of whether it's a new or existing face ID
            console.log('[FACE-REG] Step 3: Searching for historical matches...');
            console.log('[FACE-REG] Using face ID for historical matching:', faceId);
            
            try {
                // Get initial matches quickly (limited to 20)
                console.log('[FACE-MATCH-HISTORY] Fetching initial historical matches...');
                const initialMatches = await this.getInitialHistoricalMatches(faceId, userId);
                
                if (initialMatches.length > 0) {
                    console.log(`[FACE-MATCH-HISTORY] ✅ Found ${initialMatches.length} initial historical matches`);
                    console.log('[FACE-MATCH-HISTORY] First few matches:', initialMatches.slice(0, 3));
                } else {
                    console.log('[FACE-MATCH-HISTORY] No initial historical matches found');
                }
                
                // Start background processing for remaining matches
                console.log('[FACE-MATCH-HISTORY] Starting background processing for remaining matches...');
                this.processRemainingMatchesInBackground(faceId, userId);
                console.log('[FACE-MATCH-HISTORY] Background processing task queued successfully');
                
                console.groupEnd();
                return {
                    success: true,
                    faceId,
                    attributes,
                    initialMatches // Include initial matches in the response
                };
            } catch (historyError) {
                console.error('[FACE-MATCH-HISTORY] ❌ Error processing historical matches:', historyError);
                console.error('[FACE-MATCH-HISTORY] Error details:', historyError.stack);
                
                // Still return success since the face was indexed
                console.groupEnd();
                return {
                    success: true,
                    faceId,
                    attributes,
                    initialMatches: [],
                    historyError: historyError.message
                };
            }
        }
        catch (error) {
            console.error('[FACE-REG] ❌ Error indexing face:', error);
            console.error('[FACE-REG] Error stack:', error.stack);
            console.groupEnd();
            return {
                success: false,
                error: error.message || 'Failed to index face'
            };
        }
    }
    
    static async saveFaceData(userId, faceId, attributes) {
        // Implementation details...
    }

    static async startBackgroundProcessing() {
        // Implementation details...
            }

    static async processBackgroundTasks() {
        // Implementation details...
    }

    static async processFaceRegistration(task) {
        // Implementation details...
    }

    static async processPhotoMatching(task) {
        // Implementation details...
    }

    static addBackgroundTask(task) {
        // Implementation details...
    }

    static createCacheKey(imageBytes) {
        // Implementation details...
    }

    static async detectFacesWithRetry(imageBytes) {
        const MAX_ATTEMPTS = 3;
        const RETRY_DELAY_MS = 500;
        
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                console.log(`[FACE-REG] Attempt ${attempt} to detect faces...`);
                
                // Create a new DetectFacesCommand for each attempt
                const command = new DetectFacesCommand({
                    Image: { Bytes: imageBytes },
                    Attributes: ['ALL']
                });
                
                const response = await rekognitionClient.send(command);
                
                if (response.FaceDetails && response.FaceDetails.length > 0) {
                    console.log(`[FACE-REG] Successfully detected ${response.FaceDetails.length} faces`);
                    return response.FaceDetails;
                } else {
                    console.log(`[FACE-REG] No faces detected in attempt ${attempt}`);
                    
                    if (attempt < MAX_ATTEMPTS) {
                        console.log(`[FACE-REG] Waiting ${RETRY_DELAY_MS}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                }
            } catch (error) {
                console.error(`[FACE-REG] Error in face detection attempt ${attempt}:`, error);
                if (attempt < MAX_ATTEMPTS) {
                    console.log(`[FACE-REG] Waiting ${RETRY_DELAY_MS}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                }
            }
        }
        
        console.warn(`[FACE-REG] Failed to detect faces after ${MAX_ATTEMPTS} attempts`);
        return [];
    }

    static async initialize() {
        // Implementation details...
    }

    static async resetCollection() {
        // Implementation details...
    }

    static async forceResetCollection() {
        // Implementation details...
    }

    static async reindexAllFaces() {
        // Implementation details...
    }

    static async storeUnassociatedFace(faceId, photoId, externalImageId, attributes) {
        // Implementation details...
    }

    static async indexFacesInPhoto(photoId, faces) {
        // Implementation details...
    }

    static async getCollectionStats() {
        // Implementation details...
    }

    static async getInitialHistoricalMatches(faceId, userId, limit = 20) {
        // Implementation details...
    }

    static async findMatchingPhotosUsingRekognition(matchedFaceIds) {
        // Implementation details...
    }

    // Helper to update the unassociated_face record 
    static async updateUnassociatedFace(photoId, faceId, userId) {
        console.log(`[FACE-MATCH] 🔄 Updating unassociated_faces record...`);
        try {
            // NOTE: Your unassociated_faces table doesn't have a claimed_by column
            // So we'll update the attributes field instead to mark it as claimed
            
            // First get the current record
            const { data: currentRecord, error: getError } = await supabase
                .from('unassociated_faces')
                .select('attributes')
                .eq('photo_id', photoId)
                .eq('face_id', faceId)
                .single();
                
            if (getError) {
                console.warn(`[FACE-MATCH] ⚠️ Error retrieving unassociated_faces:`, getError);
                console.warn(`[FACE-MATCH] ⚠️ This is non-critical and won't affect user experience`);
                return;
            }
            
            // Update the attributes to include the claimed_by info
            let updatedAttributes = currentRecord?.attributes || {};
            if (typeof updatedAttributes !== 'object') {
                updatedAttributes = {};
            }
            
            // Add claimed_by information to the attributes
            updatedAttributes.claimed_by = userId;
            updatedAttributes.claimed_at = new Date().toISOString();
            
            // Update the record
            const { data: updateData, error: updateError } = await supabase
                .from('unassociated_faces')
                .update({ 
                    attributes: updatedAttributes,
                    updated_at: new Date().toISOString()
                })
                .eq('photo_id', photoId)
                .eq('face_id', faceId);
                
            if (updateError) {
                console.warn(`[FACE-MATCH] ⚠️ Error updating unassociated_faces:`, updateError);
                console.warn(`[FACE-MATCH] ⚠️ This is non-critical and won't affect user experience`);
            } else {
                console.log(`[FACE-MATCH] ✅ Successfully updated unassociated_faces record`);
            }
        } catch (unassociatedError) {
            // This is not critical, so just log warning and continue
            console.warn(`[FACE-MATCH] ⚠️ Error updating unassociated_faces:`, unassociatedError.message);
        }
    }
    
    // Helper to verify photo update in database
    static async verifyPhotoUpdate(photoId, userId) {
        console.log(`[FACE-MATCH] 🔍 Verifying final photo state...`);
        try {
            // Query 1: Direct photo select
            const { data: finalPhoto, error: finalError } = await supabase
                .from('photos')
                .select('matched_users, id')
                .eq('id', photoId)
                .single();
                
            if (finalError) {
                console.warn(`[FACE-MATCH] ⚠️ Could not verify final state:`, finalError);
                
                // Try a different approach with RLS bypass
                console.log(`[FACE-MATCH] 🔄 Trying alternative verification method...`);
                
                try {
                    // Try to use debug function to see the actual database state
                    const { data: debugData, error: debugError } = await supabase.rpc(
                        'debug_force_get_photo',
                        { photo_id: photoId }
                    );
                    
                    if (debugError) {
                        console.warn(`[FACE-MATCH] ⚠️ Alternative verification failed:`, debugError);
                    } else {
                        console.log(`[FACE-MATCH] ✅ Alternative verification succeeded`);
                        console.log(`[FACE-MATCH] 📋 ACTUAL PHOTO DATA:`, debugData);
                        
                        // Check if this user is included in the matches
                        const matchedUsers = debugData?.matched_users || [];
                        const isUserMatched = matchedUsers.some(m => m.userId === userId);
                        
                        if (!isUserMatched) {
                            // Last resort - attempt to fix
                            console.warn(`[FACE-MATCH] ⚠️ User match not found in database after update!`);
                            console.log(`[FACE-MATCH] 🔄 Attempting emergency fix...`);
                            
                            // Try to force the update one more time
                            const { error: fixError } = await supabase.rpc(
                                'debug_force_update_photo',
                                { 
                                    photo_id: photoId,
                                    user_id: userId
                                }
                            );
                            
                            if (fixError) {
                                console.error(`[FACE-MATCH] ❌ Emergency fix failed:`, fixError);
                            } else {
                                console.log(`[FACE-MATCH] ✅ Emergency fix applied`);
                                            }
                                        } else {
                            console.log(`[FACE-MATCH] ✅ User ${userId} confirmed as matched with photo ${photoId}`);
                                        }
                                    }
                } catch (debugError) {
                    console.warn(`[FACE-MATCH] ⚠️ Debug verification failed:`, debugError);
                                }
                            } else {
                console.log(`[FACE-MATCH] ✅ Successfully verified final state`);
                
                // Check if the user is actually in the matched_users array
                const matchedUsers = finalPhoto?.matched_users || [];
                const isUserMatched = matchedUsers.some(m => m.userId === userId);
                
                if (!isUserMatched) {
                    console.warn(`[FACE-MATCH] ⚠️ User match not found in database after update!`);
                    // The update technically succeeded but the user isn't in the matches
                    // This might indicate a data format issue
                    
                    console.log(`[FACE-MATCH] 🔄 Trying to fix missing user issue...`);
                    
                    // Try to use a debug function to force the update
                    try {
                        const { error: fixError } = await supabase.rpc(
                            'debug_force_update_photo',
                            { 
                                                    photo_id: photoId,
                                user_id: userId
                            }
                        );
                        
                        if (fixError) {
                            console.error(`[FACE-MATCH] ❌ Fix attempt failed:`, fixError);
                                        } else {
                            console.log(`[FACE-MATCH] ✅ Fix attempt succeeded`);
                        }
                    } catch (fixError) {
                        console.warn(`[FACE-MATCH] ⚠️ Fix attempt exception:`, fixError);
                    }
                            } else {
                    console.log(`[FACE-MATCH] ✅ User ${userId} confirmed as matched with photo ${photoId}`);
                }
            }
        } catch (verifyError) {
            console.warn(`[FACE-MATCH] ⚠️ Verification error:`, verifyError.message);
            // Non-critical error, so just continue
        }
    }

    static async processRemainingMatchesInBackground(faceId, userId) {
        // Implementation details...
    }

    static async processHistoricalMatching(task) {
        // Implementation details...
    }

    static async ensureCollectionExists() {
        // Implementation details...
    }

    static async getLinkedUserIds(userId) {
        try {
            console.group('[LINKED-ACCOUNTS] 🔍 Getting linked accounts for user ' + userId);
            
            // Check if this is a photo-face ID and extract the user ID if needed
            if (userId.startsWith('photo-') || userId.includes('-face-')) {
                const extractedId = this.extractUserIdFromPhotoFaceId(userId);
                if (extractedId !== userId) {
                    console.log(`[LINKED-ACCOUNTS] 🔄 Converting photo-face ID "${userId}" to user ID "${extractedId}"`);
                    userId = extractedId;
                }
            }
            
            // Validate userId is in UUID format
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidPattern.test(userId)) {
                console.warn(`[LINKED-ACCOUNTS] ⚠️ Invalid user ID format: ${userId}`);
                console.warn('[LINKED-ACCOUNTS] Returning empty linked accounts array');
                console.groupEnd();
                return [userId]; // Return original ID even if it's not valid
            }
            
            console.log('[LINKED-ACCOUNTS] Starting lookup in linked_accounts table');
            
            // Database diagnostic check - check if table exists
            try {
                const { data: tableInfo, error: schemaError } = await supabase
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_schema', 'public')
                    .eq('table_name', 'linked_accounts')
                    .single();
                    
                if (schemaError) {
                    console.warn('[LINKED-ACCOUNTS] ⚠️ Schema check error:', schemaError);
                } else {
                    console.log('[LINKED-ACCOUNTS] Table existence check:', tableInfo ? 'Table exists' : 'Table not found');
                }
            } catch (schemaCheckError) {
                console.warn('[LINKED-ACCOUNTS] ⚠️ Schema check exception:', schemaCheckError);
            }
            
            // Get all accounts linked to this user
            const { data: linkedAccounts, error, status, statusText } = await supabase
                .from('linked_accounts')
                .select('*')
                .or(`user_id.eq.${userId},linked_user_id.eq.${userId}`);
            
            console.log('[LINKED-ACCOUNTS] Query status:', status, statusText);
            
            if (error) {
                console.error('[LINKED-ACCOUNTS] ❌ Error fetching linked accounts:', error);
                console.error('[LINKED-ACCOUNTS] ❌ Error details:', JSON.stringify({
                    message: error.message,
                    code: error.code,
                    details: error.details
                }));
                
                // Try another approach using a stored procedure if available
                try {
                    console.log('[LINKED-ACCOUNTS] 🔄 Attempting fallback using RPC...');
                    const { data: rpcData, error: rpcError } = await supabase.rpc(
                        'get_linked_accounts',
                        { p_user_id: userId }
                    );
                    
                    if (rpcError) {
                        console.error('[LINKED-ACCOUNTS] ❌ RPC fallback failed:', rpcError);
                    } else if (rpcData && rpcData.length > 0) {
                        console.log('[LINKED-ACCOUNTS] ✅ RPC fallback succeeded:', rpcData.length);
                        console.groupEnd();
                        return [userId, ...rpcData.map(item => item.user_id)];
                    }
                } catch (rpcError) {
                    console.error('[LINKED-ACCOUNTS] ❌ RPC exception:', rpcError);
                }
                
                console.warn('[LINKED-ACCOUNTS] Returning only original user ID due to error');
                console.groupEnd();
                return [userId]; // Return just the original user ID if there's an error
            }
            
            if (!linkedAccounts || linkedAccounts.length === 0) {
                console.log('[LINKED-ACCOUNTS] ℹ️ No linked accounts found for user ' + userId);
                console.groupEnd();
                return [userId]; // No linked accounts
            }
            
            console.log(`[LINKED-ACCOUNTS] ✅ Found ${linkedAccounts.length} linked account records`);
            console.table(linkedAccounts.map(link => ({
                user_id: link.user_id,
                linked_user_id: link.linked_user_id,
                link_type: link.link_type || 'unknown',
                confidence: link.confidence || 'n/a',
                created_at: link.created_at
            })));
            
            // Extract all user IDs (both user_id and linked_user_id)
            const allLinkedIds = linkedAccounts.flatMap(link => {
                // For each link, get both IDs but filter out the user's own ID
                const ids = [link.user_id, link.linked_user_id];
                return ids.filter(id => id !== userId);
            });
            
            // Add the original user ID
            const result = [userId, ...allLinkedIds];
            
            // Remove duplicates by converting to Set and back
            const uniqueIds = [...new Set(result)];
            
            console.log(`[LINKED-ACCOUNTS] 📊 Final linked user IDs: ${uniqueIds.length} total accounts`);
            console.log('[LINKED-ACCOUNTS] IDs:', uniqueIds);
            console.groupEnd();
            
            return uniqueIds;
        } catch (error) {
            console.error('[LINKED-ACCOUNTS] ❌ Error processing linked accounts:', error);
            console.error('[LINKED-ACCOUNTS] Error stack:', error.stack);
            console.warn('[LINKED-ACCOUNTS] Returning only original user ID due to exception');
            console.groupEnd();
            return [userId]; // Return just the original user ID if there's an exception
        }
    }

    // Add a method to handle creating account links when faces match across different users
    static async createAccountLinkIfNeeded(userId1, userId2, similarity = 99.0) {
        try {
            console.group(`[LINK-ACCOUNTS] 🔄 Account Linking Process: ${userId1} <-> ${userId2}`);
            
            // Check for problematic account IDs - might be photo IDs instead of user IDs
            const isPhotoFaceID1 = userId1 && (userId1.includes('-face-') || userId1.startsWith('photo-'));
            const isPhotoFaceID2 = userId2 && (userId2.includes('-face-') || userId2.startsWith('photo-'));
            
            if (isPhotoFaceID1 || isPhotoFaceID2) {
                console.warn(`[LINK-ACCOUNTS] ⚠️ Detected possible photo/face ID format instead of user ID`);
                console.log(`[LINK-ACCOUNTS] ID1: "${userId1}" (${isPhotoFaceID1 ? 'Photo/Face ID format' : 'Appears valid'})`);
                console.log(`[LINK-ACCOUNTS] ID2: "${userId2}" (${isPhotoFaceID2 ? 'Photo/Face ID format' : 'Appears valid'})`);
                
                // Try to extract real user IDs if possible
                if (isPhotoFaceID1) {
                    const extractedId = this.extractUserIdFromPhotoFaceId(userId1);
                    if (extractedId && extractedId !== userId1) {
                        console.log(`[LINK-ACCOUNTS] 🔄 Converted ID1 from "${userId1}" to "${extractedId}"`);
                        userId1 = extractedId;
                    }
                }
                
                if (isPhotoFaceID2) {
                    const extractedId = this.extractUserIdFromPhotoFaceId(userId2);
                    if (extractedId && extractedId !== userId2) {
                        console.log(`[LINK-ACCOUNTS] 🔄 Converted ID2 from "${userId2}" to "${extractedId}"`);
                        userId2 = extractedId;
                    }
                }
            }
            
            // Validate both user IDs are in proper UUID format
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidPattern.test(userId1) || !uuidPattern.test(userId2)) {
                console.warn(`[LINK-ACCOUNTS] ⚠️ One or both IDs are not valid UUIDs after conversion`);
                console.log(`[LINK-ACCOUNTS] ID1: "${userId1}" (${uuidPattern.test(userId1) ? 'Valid UUID' : 'Invalid UUID'})`);
                console.log(`[LINK-ACCOUNTS] ID2: "${userId2}" (${uuidPattern.test(userId2) ? 'Valid UUID' : 'Invalid UUID'})`);
                console.log(`[LINK-ACCOUNTS] Cannot create account link with invalid IDs`);
                console.groupEnd();
                return false;
            }
            
            // Skip if the IDs are the same
            if (userId1 === userId2) {
                console.log(`[LINK-ACCOUNTS] ⚠️ Same user IDs provided (${userId1}), skipping link creation`);
                console.groupEnd();
                return false;
            }

            console.log(`[LINK-ACCOUNTS] 🔍 Checking for existing link between users ${userId1} and ${userId2}`);
            console.log(`[LINK-ACCOUNTS] Similarity score: ${similarity.toFixed(2)}%`);
            
            // Database diagnostic check - verify table exists
            try {
                const { data: tableInfo, error: schemaError } = await supabase
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_schema', 'public')
                    .eq('table_name', 'linked_accounts')
                    .single();
                    
                if (schemaError) {
                    console.warn('[LINK-ACCOUNTS] ⚠️ Schema check error:', schemaError);
                } else {
                    console.log('[LINK-ACCOUNTS] Table existence check:', tableInfo ? 'Table exists' : 'Table not found');
                    
                    // If table not found, try to create it
                    if (!tableInfo) {
                        console.warn('[LINK-ACCOUNTS] ⚠️ linked_accounts table not found. Attempting to create table...');
                        return await this.createLinkedAccountsTable(userId1, userId2, similarity);
                    }
                }
            } catch (schemaCheckError) {
                console.warn('[LINK-ACCOUNTS] ⚠️ Schema check exception:', schemaCheckError);
            }
            
            // Ensure userId1 and userId2 are ordered consistently to avoid duplicate links
            const [u1, u2] = [userId1, userId2].sort();
            console.log(`[LINK-ACCOUNTS] Using ordered IDs: ${u1} and ${u2}`);
            
            // Check if a link already exists
            const { data: existingLink, error: checkError, status, statusText } = await supabase
                .from('linked_accounts')
                .select('id, created_at, confidence')
                .eq('user_id', u1)
                .eq('linked_user_id', u2)
                .maybeSingle(); // Use maybeSingle to handle 0 or 1 result
                
            console.log('[LINK-ACCOUNTS] Query status:', status, statusText || 'No status text');
                
            if (checkError) {
                console.error(`[LINK-ACCOUNTS] ❌ Error checking for existing link:`, checkError);
                console.error(`[LINK-ACCOUNTS] Query failed with: ${checkError.message}`);
                console.error(`[LINK-ACCOUNTS] Error details:`, JSON.stringify({
                    code: checkError.code,
                    details: checkError.details,
                    hint: checkError.hint
                }));
                
                // Try to create a link using a stored procedure if available
                try {
                    console.log('[LINK-ACCOUNTS] 🔄 Attempting fallback using RPC...');
                    const { data: rpcData, error: rpcError } = await supabase.rpc(
                        'link_user_accounts',
                        { 
                            p_primary_user_id: u1,
                            p_secondary_user_id: u2
                        }
                    );
                    
                    if (rpcError) {
                        console.error('[LINK-ACCOUNTS] ❌ RPC fallback failed:', rpcError);
                    } else {
                        console.log('[LINK-ACCOUNTS] ✅ RPC fallback succeeded:', rpcData);
                        console.groupEnd();
                        return true;
                    }
                } catch (rpcError) {
                    console.error('[LINK-ACCOUNTS] ❌ RPC exception:', rpcError);
                }
                
                console.groupEnd();
                return false;
            }
            
            // Check if we have identity_group_id in the schema - old version vs new version
            let hasIdentityGroupField = false;
            try {
                const { data: tableColumns, error: columnError } = await supabase
                    .from('information_schema.columns')
                    .select('column_name')
                    .eq('table_schema', 'public')
                    .eq('table_name', 'linked_accounts')
                    .in('column_name', ['identity_group_id']);
                    
                if (!columnError && tableColumns) {
                    hasIdentityGroupField = tableColumns.length > 0;
                    console.log(`[LINK-ACCOUNTS] Table schema check: identity_group_id field ${hasIdentityGroupField ? 'exists' : 'not found'}`);
                }
            } catch (columnCheckError) {
                console.warn('[LINK-ACCOUNTS] ⚠️ Column check exception:', columnCheckError);
            }
            
            // If no link exists, create one
            if (!existingLink) {
                console.log(`[LINK-ACCOUNTS] ✨ No existing link found, creating new link between ${u1} and ${u2}`);
                
                // Creating different link data based on schema version
                let linkData;
                if (hasIdentityGroupField) {
                    // New schema with identity_group_id
                    const identityGroupId = crypto.randomUUID();
                    linkData = [
                        {
                            identity_group_id: identityGroupId,
                            user_id: u1,
                            created_at: new Date().toISOString()
                        },
                        {
                            identity_group_id: identityGroupId,
                            user_id: u2,
                            created_at: new Date().toISOString()
                        }
                    ];
                } else {
                    // Old schema with direct link
                    linkData = {
                        user_id: u1,
                        linked_user_id: u2,
                        link_type: 'automatic_face_match',
                        confidence: similarity,
                        created_at: new Date().toISOString()
                    };
                }
                
                console.log(`[LINK-ACCOUNTS] 📝 New link data:`, linkData);
                
                // Insert the link(s)
                let insertOperation;
                if (hasIdentityGroupField) {
                    insertOperation = supabase.from('linked_accounts').insert(linkData);
                } else {
                    insertOperation = supabase.from('linked_accounts').insert(linkData);
                }
                
                const { data: insertData, error: insertError, status: insertStatus, statusText: insertStatusText } = await insertOperation;
                console.log('[LINK-ACCOUNTS] Insert status:', insertStatus, insertStatusText || 'No status text');
                    
                if (insertError) {
                    console.error(`[LINK-ACCOUNTS] ❌ Error inserting new account link:`, insertError);
                    console.error(`[LINK-ACCOUNTS] Insert failed with: ${insertError.message}`);
                    console.error(`[LINK-ACCOUNTS] Error details:`, JSON.stringify({
                        code: insertError.code,
                        details: insertError.details,
                        hint: insertError.hint
                    }));
                    
                    // Try fallback to direct SQL if available
                    try {
                        console.log('[LINK-ACCOUNTS] 🔄 Attempting direct SQL fallback...');
                        
                        // Direct SQL through RPC needs implementing based on your schema
                        // Implementation would depend on your database configuration
                        
                        console.log('[LINK-ACCOUNTS] ⚠️ Direct SQL fallback not implemented');
                    } catch (sqlError) {
                        console.error('[LINK-ACCOUNTS] ❌ SQL fallback exception:', sqlError);
                    }
                    
                    console.groupEnd();
                    return false;
                } else {
                    console.log(`[LINK-ACCOUNTS] ✅ Successfully linked accounts ${u1} and ${u2}`);
                    console.log(`[LINK-ACCOUNTS] 🎯 Link created with ${similarity.toFixed(2)}% confidence`);
                    console.log(`[LINK-ACCOUNTS] Insert result:`, insertData);
                    console.groupEnd();
                    return true;
                }
            } else {
                console.log(`[LINK-ACCOUNTS] ℹ️ Link already exists between ${u1} and ${u2}`);
                console.log(`[LINK-ACCOUNTS] Existing link details:`, existingLink);
                
                // Check if we should update the confidence if new similarity is higher
                if (existingLink.confidence && similarity > existingLink.confidence) {
                    console.log(`[LINK-ACCOUNTS] 🔄 Updating link with higher confidence: ${existingLink.confidence}% -> ${similarity.toFixed(2)}%`);
                    
                    const { error: updateError, status: updateStatus, statusText: updateStatusText } = await supabase
                        .from('linked_accounts')
                        .update({ confidence: similarity })
                        .eq('id', existingLink.id);
                        
                    console.log('[LINK-ACCOUNTS] Update status:', updateStatus, updateStatusText || 'No status text');
                        
                    if (updateError) {
                        console.warn(`[LINK-ACCOUNTS] ⚠️ Failed to update confidence:`, updateError);
                    } else {
                        console.log(`[LINK-ACCOUNTS] ✅ Successfully updated link confidence`);
                    }
                }
                
                console.groupEnd();
                return true;
            }
        } catch (error) {
            console.error(`[LINK-ACCOUNTS] ❌ Error creating account link:`, error);
            console.error(`[LINK-ACCOUNTS] Error stack:`, error.stack);
            console.groupEnd();
            return false;
        }
    }
    
    // Extract a user ID from a photo/face ID format if possible
    static extractUserIdFromPhotoFaceId(photoFaceId) {
        try {
            // Check if it's a UUID - if so, it might already be a user ID
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidPattern.test(photoFaceId)) {
                return photoFaceId; // Already in UUID format
            }
            
            // Patterns for different ID formats
            // Pattern 1: photo-{uuid}-face-{number}
            const pattern1 = /photo-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-face-\d+/i;
            // Pattern 2: {uuid}-face-{number}
            const pattern2 = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-face-\d+/i;
            
            let match = photoFaceId.match(pattern1);
            if (match && match[1]) {
                return match[1]; // Return the UUID portion
            }
            
            match = photoFaceId.match(pattern2);
            if (match && match[1]) {
                return match[1]; // Return the UUID portion
            }
            
            // If no matches, return the original
            return photoFaceId;
        } catch (error) {
            console.error('[LINK-ACCOUNTS] Error extracting user ID:', error);
            return photoFaceId; // Return original on error
        }
    }
    
    // Create the linked_accounts table if it doesn't exist
    static async createLinkedAccountsTable(userId1, userId2, similarity) {
        try {
            console.group('[LINK-ACCOUNTS] 🛠️ Creating linked_accounts table');
            
            // Create the table
            const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.linked_accounts (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              linked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              link_type TEXT,
              confidence FLOAT,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              UNIQUE(user_id, linked_user_id)
            );`;
            
            // Execute the SQL through a stored procedure if available
            const { data: createResult, error: createError } = await supabase.rpc(
                'execute_sql',
                { sql_query: createTableSQL }
            );
            
            if (createError) {
                console.error('[LINK-ACCOUNTS] ❌ Error creating table:', createError);
                console.groupEnd();
                return false;
            }
            
            console.log('[LINK-ACCOUNTS] ✅ Table created successfully');
            
            // Now create the link
            const linkData = {
                user_id: userId1,
                linked_user_id: userId2,
                link_type: 'automatic_face_match',
                confidence: similarity,
                created_at: new Date().toISOString()
            };
            
            console.log('[LINK-ACCOUNTS] 📝 Creating initial link with:', linkData);
            
            const { data: insertData, error: insertError } = await supabase
                .from('linked_accounts')
                .insert(linkData);
                
            if (insertError) {
                console.error('[LINK-ACCOUNTS] ❌ Error creating initial link:', insertError);
                console.groupEnd();
                return false;
            }
            
            console.log('[LINK-ACCOUNTS] ✅ Initial link created successfully');
            console.groupEnd();
            return true;
        } catch (error) {
            console.error('[LINK-ACCOUNTS] ❌ Error in createLinkedAccountsTable:', error);
            console.groupEnd();
            return false;
        }
    }

    // Add static COLLECTION_ID for constants used in methods
    static COLLECTION_ID = COLLECTION_ID;
    static FACE_MATCH_THRESHOLD = FACE_MATCH_THRESHOLD;
    static backgroundTasks = [];
    static isProcessing = false;
    static BACKGROUND_INTERVAL = 60000; // 1 minute

    // Implementation of the searchFaces function to find face matches using AWS Rekognition
    static async searchFaces(imageBytes, photoId) {
        try {
            console.group('[FACE-MATCH] Face Search Process');
            console.log('[FACE-MATCH] 🔍 Starting face search process...');
            console.log('[FACE-MATCH] Photo ID:', photoId);
            console.log('[FACE-MATCH] Using collection ID:', this.COLLECTION_ID);
            
            // Get collection stats first
            const stats = await this.getCollectionStats();
            console.log(`[FACE-MATCH] Current collection has ${stats?.FaceCount || 'unknown'} indexed faces`);
            
            // Step 1: Detect faces in the image
            console.log('[FACE-MATCH] Step 1: Detecting faces in image...');
            let faceDetails;
            try {
                faceDetails = await this.detectFacesWithRetry(imageBytes);
                console.log('[FACE-MATCH] ✅ Detected', faceDetails.length, 'faces in image');
                if (faceDetails.length > 0) {
                    console.log('[FACE-MATCH] First face confidence:', faceDetails[0]?.Confidence);
                }
            } catch (detectError) {
                console.error('[FACE-MATCH] ❌ Face detection error:', detectError);
                console.groupEnd();
                return { matches: [], indexedFaces: [] };
            }
            
            if (faceDetails.length === 0) {
                console.log('[FACE-MATCH] No faces detected in image');
                console.groupEnd();
                return { matches: [], indexedFaces: [] };
            }
            
            // NEW STEP: Index all detected faces regardless of matching
            console.log('[FACE-MATCH] NEW Step: Indexing all detected faces for future matching...');
            const indexedFaces = [];
            
            for (let i = 0; i < faceDetails.length; i++) {
                try {
                    // Only index faces with good confidence
                    if (faceDetails[i].Confidence < 90) {
                        console.log(`[FACE-MATCH] Skipping face ${i+1} due to low confidence: ${faceDetails[i].Confidence}`);
                        continue;
                    }
                    
                    // Create a temporary external ID for this face
                    const tempExternalId = `photo-${photoId}-face-${i}`;
                    
                    // Index this face in the collection
                    const indexCommand = new IndexFacesCommand({
                        CollectionId: this.COLLECTION_ID,
                        Image: { Bytes: imageBytes },
                        ExternalImageId: tempExternalId,
                        DetectionAttributes: ['ALL'],
                        MaxFaces: 1,
                        QualityFilter: 'AUTO'
                    });
                    
                    console.log(`[FACE-MATCH] Indexing face ${i+1} with external ID: ${tempExternalId}`);
                    const indexResponse = await rekognitionClient.send(indexCommand);
                    
                    if (indexResponse.FaceRecords && indexResponse.FaceRecords.length > 0) {
                        const faceId = indexResponse.FaceRecords[0].Face.FaceId;
                        console.log(`[FACE-MATCH] ✅ Successfully indexed face ${i+1}: ${faceId}`);
                        
                        // Save the face ID and details
                        indexedFaces.push({
                            faceId: faceId,
                            confidence: faceDetails[i].Confidence,
                            boundingBox: faceDetails[i].BoundingBox,
                            externalId: tempExternalId
                        });
                        
                        // Store this unassociated face for future matching
                        await this.storeUnassociatedFace(
                            faceId, 
                            photoId, 
                            tempExternalId, 
                            faceDetails[i]
                        );
                    } else {
                        console.log(`[FACE-MATCH] ⚠️ Face ${i+1} was not indexed properly`);
                    }
                } catch (indexError) {
                    console.error(`[FACE-MATCH] ❌ Error indexing face ${i+1}:`, indexError);
                }
            }
            
            // Step 2: Search for matches in the collection using SearchFacesByImage API
            console.log('[FACE-MATCH] Step 2: Searching for face matches in collection...');
            console.log(`[FACE-MATCH] Using threshold: ${FACE_MATCH_THRESHOLD}%`);
            
            // Array to hold all direct matches from AWS Rekognition
            const allMatches = [];
            
            // Process each detected face
            for (let i = 0; i < faceDetails.length; i++) {
                try {
                    const command = new SearchFacesByImageCommand({
                        CollectionId: this.COLLECTION_ID,
                        Image: { Bytes: imageBytes },
                        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                        MaxFaces: 100  // Increased to get more potential matches
                    });
                    
                    console.log(`[FACE-MATCH] Sending SearchFacesByImage request for face ${i+1}...`);
                    const searchResponse = await rekognitionClient.send(command);
                    
                    // Log the raw response for debugging
                    console.log(`[AWS-DEBUG] SearchFacesByImage raw response:`, JSON.stringify({
                        SearchedFaceBoundingBox: searchResponse.SearchedFaceBoundingBox,
                        SearchedFaceConfidence: searchResponse.SearchedFaceConfidence,
                        FaceMatches: searchResponse.FaceMatches?.map(match => ({
                            Similarity: match.Similarity,
                            Face: {
                                FaceId: match.Face.FaceId,
                                ExternalImageId: match.Face.ExternalImageId,
                                Confidence: match.Face.Confidence
                            }
                        }))
                    }, null, 2));
                    
                    if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                        console.log(`[FACE-MATCH] Face ${i+1}: Found ${searchResponse.FaceMatches.length} matches`);
                        
                        // Check if any match has a direct user ID (not starting with photo-)
                        const directUserIdMatches = searchResponse.FaceMatches.filter(match => 
                            !match.Face.ExternalImageId.startsWith('photo-') && 
                            !match.Face.ExternalImageId.startsWith('auto_')
                        );
                        
                        console.log(`[FACE-MATCH] Found ${directUserIdMatches.length} direct user ID matches (not photo-face IDs)`);
                        
                        // Log each match with details
                        searchResponse.FaceMatches.forEach((match, idx) => {
                            const isDirectUserIdMatch = !match.Face.ExternalImageId.startsWith('photo-') && 
                                                       !match.Face.ExternalImageId.startsWith('auto_');
                                                       
                            console.log(`[FACE-MATCH] Match ${idx+1}: ID ${match.Face.ExternalImageId} ` + 
                                       `with similarity ${match.Similarity.toFixed(2)}% ` + 
                                       `(confidence: ${match.Face.Confidence.toFixed(2)}%)` +
                                       `${isDirectUserIdMatch ? ' - DIRECT USER ID MATCH!' : ''}`);
                        });
                        
                        // Prioritize direct user ID matches
                        if (directUserIdMatches.length > 0) {
                            console.log(`[FACE-MATCH] ✅ FOUND DIRECT USER ID MATCHES - these will be prioritized`);
                            
                            // Add direct user ID matches with higher priority
                            for (const match of directUserIdMatches) {
                                console.log(`[FACE-MATCH] ✅ Adding high-priority direct user ID match: ${match.Face.ExternalImageId}`);
                                
                                allMatches.push({
                                    userId: match.Face.ExternalImageId, // This is already a user ID
                                    faceId: match.Face.FaceId,
                                    originalExternalId: match.Face.ExternalImageId, // Keep original for reference
                                    similarity: match.Similarity + 1, // Add 1 point to boost priority
                                    confidence: match.Face.Confidence,
                                    isDirectUserIdMatch: true
                                });
                            }
                        }
                        
                        // Add all matches from AWS to our array
                        for (const match of searchResponse.FaceMatches) {
                            // Skip if this is already added as a direct user ID match
                            if (!match.Face.ExternalImageId.startsWith('photo-') && 
                                !match.Face.ExternalImageId.startsWith('auto_')) {
                                continue; // Already handled above
                            }
                            
                            // Extract valid user ID from photo-face ID format if needed
                            let userId = match.Face.ExternalImageId;
                            let extractedId = userId;
                            
                            // Check if this is a photo-face ID format and extract the real user ID if possible
                            if (userId.startsWith('photo-') || userId.includes('-face-')) {
                                extractedId = this.extractUserIdFromPhotoFaceId(userId);
                                console.log(`[FACE-MATCH] 🔄 Extracted user ID from "${userId}": "${extractedId}"`);
                                userId = extractedId;
                            }
                            
                            // Check if we have a valid UUID format now
                            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            if (uuidPattern.test(userId)) {
                                allMatches.push({
                                    userId: userId, // Extracted or original user ID
                                    faceId: match.Face.FaceId,
                                    originalExternalId: match.Face.ExternalImageId, // Keep original for reference
                                    similarity: match.Similarity,
                                    confidence: match.Face.Confidence,
                                    isDirectUserIdMatch: false
                                });
                            } else {
                                console.warn(`[FACE-MATCH] ⚠️ Skipping match with invalid user ID format: ${userId}`);
                            }
                        }
                    } else {
                        console.log(`[FACE-MATCH] Face ${i+1}: No matches found`);
                    }
                } catch (searchError) {
                    console.error(`[FACE-MATCH] ❌ Error searching for face ${i+1}:`, searchError);
                }
            }
            
            // Step 3: Process matches and remove duplicates
            console.log('[FACE-MATCH] Step 3: Processing matches...');
            const dedupedMatches = {};
            
            // Group matches by user ID and keep the highest confidence match
            allMatches.forEach(match => {
                const userId = match.userId;
                const existingMatch = dedupedMatches[userId];
                
                // Only replace if this match has higher similarity or is a direct user ID match
                const shouldReplace = !existingMatch || 
                                     match.similarity > existingMatch.similarity ||
                                     (match.isDirectUserIdMatch && !existingMatch.isDirectUserIdMatch);
                                     
                if (shouldReplace) {
                    console.log(`[FACE-MATCH] Match processed: User ${userId} with ${match.similarity.toFixed(2)}% similarity` +
                               `${match.isDirectUserIdMatch ? ' (DIRECT USER ID MATCH)' : ''}`);
                    dedupedMatches[userId] = match;
                }
            });
            
            // Convert back to array and filter by minimum threshold
            const results = Object.values(dedupedMatches).filter(match => {
                const passes = match.similarity >= FACE_MATCH_THRESHOLD;
                if (!passes) {
                    console.log(`[FACE-MATCH] Filtered out match for ${match.userId} with low similarity: ${match.similarity.toFixed(2)}%`);
                }
                return passes;
            });
            
            console.log(`[FACE-MATCH] ✅ Final results: ${results.length} valid matches above ${FACE_MATCH_THRESHOLD}% similarity threshold`);
            
            // After getting the results, fetch the user data for each match
            if (results.length > 0) {
                console.log('[FACE-MATCH] Fetching user data for matches...');
                
                // Filter out non-UUID user IDs
                const validUserIds = results.filter(result => {
                    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    return uuidPattern.test(result.userId);
                }).map(r => r.userId);
                
                console.log(`[FACE-MATCH] Found ${validUserIds.length} valid UUID user IDs out of ${results.length} matches`);
                
                if (validUserIds.length > 0) {
                    try {
                        console.log('[FACE-MATCH] Table used for user lookup: users');
                        
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select(`
                                id,
                                full_name,
                                avatar_url,
                                email
                            `)
                            .in('id', validUserIds);
                        
                        if (!userError && userData && userData.length > 0) {
                            console.log('[FACE-MATCH] User data fetched successfully:', userData);
                            
                            // Enhance results with user data
                            results.forEach(result => {
                                const userProfile = userData.find(u => u.id === result.userId);
                                if (userProfile) {
                                    result.fullName = userProfile.full_name || userProfile.email || 'Unknown User';
                                    result.avatarUrl = userProfile.avatar_url || null;
                                } else {
                                    result.fullName = 'Unknown User';
                                    result.avatarUrl = null;
                                }
                            });
                        } else {
                            // Try user_profiles as a fallback
                            console.warn('[FACE-MATCH] Failed to fetch user data from users table, trying user_profiles...');
                            
                            const { data: userProfilesData, error: profilesError } = await supabase
                                .from('user_profiles')
                                .select(`
                                    id,
                                    user_id,
                                    metadata
                                `)
                                .in('user_id', validUserIds);
                                
                            if (!profilesError && userProfilesData && userProfilesData.length > 0) {
                                console.log('[FACE-MATCH] User profiles data found:', userProfilesData);
                                
                                // Enhance results with user profile metadata
                                results.forEach(result => {
                                    const userProfile = userProfilesData.find(u => u.user_id === result.userId);
                                    if (userProfile && userProfile.metadata) {
                                        result.fullName = userProfile.metadata.full_name || 'Unknown User';
                                        result.avatarUrl = userProfile.metadata.avatar_url || null;
                                    } else {
                                        result.fullName = 'Unknown User';
                                        result.avatarUrl = null;
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.error('[FACE-MATCH] Error fetching user data:', error);
                    }
                }
            }
            
            // Return both matches and indexed faces
            const result = {
                matches: results || [],
                indexedFaces: indexedFaces || []
            };
            
            console.log(`[FACE-MATCH] Completed search with ${result.matches.length} matches and ${result.indexedFaces.length} indexed faces`);
            console.groupEnd();
            return result;
        }
        catch (error) {
            console.error('[FACE-MATCH] Error in searchFaces:', error);
            console.groupEnd();
            return { matches: [], indexedFaces: [] };
        }
    }

    // Implement the processFaces function to convert detected faces to user matches
    static async processFaces(photoId, faces, uploaderId) {
        try {
            console.group(`[FACE-PROCESS] Processing faces for photo ${photoId}`);
            console.log(`[FACE-PROCESS] Processing ${faces.length} detected faces`);
            console.log(`[FACE-PROCESS] Photo uploaded by: ${uploaderId || 'Unknown'}`);
            console.log(`[FACE-PROCESS] Using collection ID: ${this.COLLECTION_ID}`);
            
            if (!faces || faces.length === 0) {
                console.log('[FACE-PROCESS] No faces to process');
                console.groupEnd();
                return [];
            }
            
            // Try to match with the current user who uploaded the photo first
            let priorityUserId = null;
            
            if (uploaderId) {
                console.log(`[FACE-PROCESS] Prioritizing matching with uploader ID: ${uploaderId}`);
                priorityUserId = uploaderId;
                
                // Check if any face has the uploader's user ID as externalId
                const uploaderFace = faces.find(face => 
                    face.externalId === uploaderId || 
                    (face.externalId && this.extractUserIdFromPhotoFaceId(face.externalId) === uploaderId)
                );
                
                if (uploaderFace) {
                    console.log(`[FACE-PROCESS] ✅ Found face with uploader ID match: ${uploaderFace.externalId}`);
                    console.log(`[FACE-PROCESS] Priority processing this face with user ID ${uploaderId}`);
                    
                    try {
                        console.log(`[FACE-PROCESS] Adding uploader ${uploaderId} as match for face with ID ${uploaderFace.awsFaceId}`);
                        
                        const result = await this.addUserMatchToPhoto(photoId, uploaderId, uploaderFace.awsFaceId);
                        if (result) {
                            console.log(`[FACE-PROCESS] ✅ Successfully added uploader ${uploaderId} as match`);
                        } else {
                            console.error(`[FACE-PROCESS] ❌ Failed to add uploader as match`);
                        }
                    } catch (uploaderMatchError) {
                        console.error(`[FACE-PROCESS] ❌ Error matching uploader:`, uploaderMatchError);
                    }
                } else {
                    console.log(`[FACE-PROCESS] No face found with direct uploader ID match - will try normal processing`);
                    
                    // Try to force a direct match with the uploader's face collection entry
                    console.log(`[FACE-PROCESS] Attempting to lookup uploader's face data in face_data table`);
                    
                    try {
                        const { data: uploaderFaceData, error: faceError } = await supabase
                            .from('face_data')
                            .select('face_id')
                            .eq('user_id', uploaderId)
                            .maybeSingle();
                            
                        if (faceError) {
                            console.error(`[FACE-PROCESS] Error fetching uploader's face data:`, faceError);
                        } else if (uploaderFaceData && uploaderFaceData.face_id) {
                            console.log(`[FACE-PROCESS] Found uploader's face ID in database: ${uploaderFaceData.face_id}`);
                            
                            // Try to use the first face in the photo with the uploader's face ID
                            if (faces.length > 0) {
                                const firstFace = faces[0];
                                console.log(`[FACE-PROCESS] Attempting to match first face with uploader: ${uploaderId}`);
                                
                                const result = await this.addUserMatchToPhoto(photoId, uploaderId, firstFace.awsFaceId);
                                if (result) {
                                    console.log(`[FACE-PROCESS] ✅ Successfully added uploader ${uploaderId} as match for first face`);
                                } else {
                                    console.error(`[FACE-PROCESS] ❌ Failed to add uploader as match for first face`);
                                }
                            }
                        } else {
                            console.log(`[FACE-PROCESS] No face data found for uploader ${uploaderId}`);
                        }
                    } catch (faceDataError) {
                        console.error(`[FACE-PROCESS] Error checking uploader's face data:`, faceDataError);
                    }
                }
            }
            
            const processedFaces = [];
            
            for (let i = 0; i < faces.length; i++) {
                try {
                    const face = faces[i];
                    console.log(`[FACE-PROCESS] Processing face ${i+1} of ${faces.length}: ${JSON.stringify(face)}`);
                    
                    // Skip faces without AWS face ID
                    if (!face.awsFaceId) {
                        console.log(`[FACE-PROCESS] Face ${i+1} has no AWS face ID, skipping`);
                        continue;
                    }
                    
                    // Check if we already processed this face when prioritizing the uploader
                    if (priorityUserId && face.externalId && 
                        (face.externalId === priorityUserId || 
                         this.extractUserIdFromPhotoFaceId(face.externalId) === priorityUserId)) {
                        console.log(`[FACE-PROCESS] Skipping face ${i+1} as it was already processed for uploader`);
                        continue;
                    }
                    
                    // Check if this face has a user ID assigned
                    if (face.userId) {
                        // Extract real user ID from photo-face format if needed
                        let userId = face.userId;
                        if (userId.startsWith('photo-') || userId.includes('-face-') || userId.startsWith('auto_')) {
                            if (userId.startsWith('photo-') || userId.includes('-face-')) {
                                const extractedId = this.extractUserIdFromPhotoFaceId(userId);
                                console.log(`[FACE-PROCESS] 🔄 Extracted user ID from "${userId}": "${extractedId}"`);
                                userId = extractedId;
                            } else if (userId.startsWith('auto_')) {
                                const extractedId = userId.replace('auto_', '');
                                console.log(`[FACE-PROCESS] 🔄 Removed auto_ prefix: "${userId}" -> "${extractedId}"`);
                                userId = extractedId;
                            }
                        }
                        
                        // Check if the ID is valid UUID format
                        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (uuidPattern.test(userId)) {
                            // Add a user match to the photo
                            console.log(`[FACE-PROCESS] Adding user ${userId} as match for face ${i+1} with ID ${face.awsFaceId}`);
                            
                            const result = await this.addUserMatchToPhoto(photoId, userId, face.awsFaceId);
                            if (result) {
                                console.log(`[FACE-PROCESS] Successfully added user ${userId} as match for face ${i+1}`);
                                processedFaces.push({
                                    index: i,
                                    userId,
                                    faceId: face.awsFaceId,
                                    success: true
                                });
                            } else {
                                console.error(`[FACE-PROCESS] Failed to add user ${userId} as match for face ${i+1}`);
                                processedFaces.push({
                                    index: i,
                                    userId,
                                    faceId: face.awsFaceId,
                                    success: false,
                                    error: 'Failed to add user match to photo'
                                });
                            }
                        } else {
                            console.warn(`[FACE-PROCESS] Face ${i+1} has invalid user ID format: ${userId}`);
                            processedFaces.push({
                                index: i,
                                faceId: face.awsFaceId,
                                success: false,
                                error: 'Invalid user ID format'
                            });
                        }
                    } else if (face.externalId) {
                        // If we have an external ID (photo-face), try to extract the user ID
                        let userId = face.externalId;
                        if (userId.startsWith('photo-') || userId.includes('-face-') || userId.startsWith('auto_')) {
                            if (userId.startsWith('photo-') || userId.includes('-face-')) {
                                const extractedId = this.extractUserIdFromPhotoFaceId(userId);
                                console.log(`[FACE-PROCESS] 🔄 Extracted user ID from external ID "${userId}": "${extractedId}"`);
                                userId = extractedId;
                            } else if (userId.startsWith('auto_')) {
                                const extractedId = userId.replace('auto_', '');
                                console.log(`[FACE-PROCESS] 🔄 Removed auto_ prefix: "${userId}" -> "${extractedId}"`);
                                userId = extractedId;
                            }
                            
                            // Check if the extracted ID is valid UUID format
                            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            if (uuidPattern.test(userId)) {
                                // Add a user match to the photo
                                console.log(`[FACE-PROCESS] Adding extracted user ${userId} as match for face ${i+1} with ID ${face.awsFaceId}`);
                                
                                const result = await this.addUserMatchToPhoto(photoId, userId, face.awsFaceId);
                                if (result) {
                                    console.log(`[FACE-PROCESS] Successfully added extracted user ${userId} as match for face ${i+1}`);
                                    processedFaces.push({
                                        index: i,
                                        userId,
                                        faceId: face.awsFaceId,
                                        success: true
                                    });
                                } else {
                                    console.error(`[FACE-PROCESS] Failed to add extracted user ${userId} as match for face ${i+1}`);
                                    processedFaces.push({
                                        index: i,
                                        userId,
                                        faceId: face.awsFaceId,
                                        success: false,
                                        error: 'Failed to add user match to photo'
                                    });
                                }
                            } else {
                                console.warn(`[FACE-PROCESS] Face ${i+1} has invalid extracted user ID: ${userId}`);
                                processedFaces.push({
                                    index: i,
                                    faceId: face.awsFaceId,
                                    success: false,
                                    error: 'Invalid extracted user ID format'
                                });
                            }
                        } else {
                            console.warn(`[FACE-PROCESS] Face ${i+1} has external ID but not in photo-face format: ${userId}`);
                            processedFaces.push({
                                index: i,
                                faceId: face.awsFaceId,
                                success: false,
                                error: 'Non-photo-face external ID format'
                            });
                        }
                    } else {
                        console.log(`[FACE-PROCESS] Face ${i+1} has no user ID or external ID, skipping`);
                        processedFaces.push({
                            index: i,
                            faceId: face.awsFaceId,
                            success: false,
                            error: 'No user ID or external ID'
                        });
                    }
                } catch (faceError) {
                    console.error(`[FACE-PROCESS] Error processing face ${i+1}:`, faceError);
                    processedFaces.push({
                        index: i,
                        success: false,
                        error: faceError.message
                    });
                }
            }
            
            console.log(`[FACE-PROCESS] Completed processing ${processedFaces.length} faces`);
            console.groupEnd();
            return processedFaces;
        } catch (error) {
            console.error('[FACE-PROCESS] Error in processFaces:', error);
            console.groupEnd();
            return [];
        }
    }

    // Helper method to validate database records
    static async validateDatabaseRecord(photoId) {
        try {
            console.group(`[DB-VALIDATE] Validating database record for photo ${photoId}`);
            
            // Check if photo exists
            const { data: photo, error: photoError } = await supabase
                .from('photos')
                .select('id, matched_users')
                .eq('id', photoId)
                .single();
                
            if (photoError) {
                console.error(`[DB-VALIDATE] Photo not found:`, photoError);
                console.groupEnd();
                return { valid: false, error: photoError.message };
            }
            
            if (!photo) {
                console.error(`[DB-VALIDATE] Photo not found in database`);
                console.groupEnd();
                return { valid: false, error: 'Photo not found in database' };
            }
            
            console.log(`[DB-VALIDATE] Photo found in database:`, photo);
            
            // Check matched_users format
            const matchedUsers = photo.matched_users;
            
            if (!matchedUsers) {
                console.warn(`[DB-VALIDATE] Photo has no matched_users array`);
                console.groupEnd();
                return { 
                    valid: true, 
                    needsCorrection: true, 
                    issue: 'missing_matched_users',
                    photo
                };
            }
            
            if (!Array.isArray(matchedUsers)) {
                console.warn(`[DB-VALIDATE] matched_users is not an array:`, matchedUsers);
                console.groupEnd();
                return { 
                    valid: true, 
                    needsCorrection: true, 
                    issue: 'invalid_matched_users_format',
                    photo
                };
            }
            
            // Check for photoface format in userIds
            const invalidPhotoFaceIds = matchedUsers.filter(match => {
                const userId = match.userId;
                return userId && (userId.startsWith('photo-') || userId.includes('-face-'));
            });
            
            // Check for auto_ prefix format in userIds
            const invalidAutoPrefixIds = matchedUsers.filter(match => {
                const userId = match.userId;
                return userId && userId.startsWith('auto_');
            });
            
            const allInvalidIds = [...invalidPhotoFaceIds, ...invalidAutoPrefixIds];
            const uniqueInvalidIds = allInvalidIds.filter((match, index, self) => 
                index === self.findIndex(m => m.userId === match.userId)
            );
            
            if (uniqueInvalidIds.length > 0) {
                console.warn(`[DB-VALIDATE] Found ${uniqueInvalidIds.length} matches with invalid ID formats:`);
                console.warn(`[DB-VALIDATE] - ${invalidPhotoFaceIds.length} photo-face IDs`);
                console.warn(`[DB-VALIDATE] - ${invalidAutoPrefixIds.length} auto_ prefix IDs`);
                console.groupEnd();
                return { 
                    valid: true, 
                    needsCorrection: true, 
                    issue: 'invalid_id_formats',
                    invalidMatches: uniqueInvalidIds,
                    photo
                };
            }
            
            console.log(`[DB-VALIDATE] Photo record is valid`);
            console.groupEnd();
            return { valid: true, needsCorrection: false, photo };
        } catch (error) {
            console.error(`[DB-VALIDATE] Error validating database record:`, error);
            console.groupEnd();
            return { valid: false, error: error.message };
        }
    }

    // Helper method to correct database records
    static async correctDatabaseRecord(photoId, validationResult) {
        try {
            console.group(`[DB-CORRECT] Correcting database record for photo ${photoId}`);
            
            if (!validationResult.needsCorrection) {
                console.log(`[DB-CORRECT] No correction needed`);
                console.groupEnd();
                return { success: true, noChangesNeeded: true };
            }
            
            const photo = validationResult.photo;
            
            switch (validationResult.issue) {
                case 'missing_matched_users':
                    console.log(`[DB-CORRECT] Adding empty matched_users array`);
                    
                    const { error: missingError } = await supabase
                        .from('photos')
                        .update({ matched_users: [] })
                        .eq('id', photoId);
                        
                    if (missingError) {
                        console.error(`[DB-CORRECT] Error adding matched_users array:`, missingError);
                        console.groupEnd();
                        return { success: false, error: missingError.message };
                    }
                    
                    console.log(`[DB-CORRECT] Successfully added empty matched_users array`);
                    console.groupEnd();
                    return { success: true, correction: 'added_empty_array' };
                    
                case 'invalid_matched_users_format':
                    console.log(`[DB-CORRECT] Fixing invalid matched_users format`);
                    
                    let correctedMatches = [];
                    try {
                        // Try to convert string to array if it's a string
                        if (typeof photo.matched_users === 'string') {
                            correctedMatches = JSON.parse(photo.matched_users);
                        } else {
                            // Reset to empty array if can't be fixed
                            correctedMatches = [];
                        }
                    } catch (parseError) {
                        console.error(`[DB-CORRECT] Error parsing matched_users string:`, parseError);
                        correctedMatches = [];
                    }
                    
                    const { error: formatError } = await supabase
                        .from('photos')
                        .update({ matched_users: correctedMatches })
                        .eq('id', photoId);
                        
                    if (formatError) {
                        console.error(`[DB-CORRECT] Error fixing matched_users format:`, formatError);
                        console.groupEnd();
                        return { success: false, error: formatError.message };
                    }
                    
                    console.log(`[DB-CORRECT] Successfully fixed matched_users format`);
                    console.groupEnd();
                    return { success: true, correction: 'fixed_format' };
                    
                case 'invalid_id_formats':
                    console.log(`[DB-CORRECT] Fixing invalid ID formats in matched_users`);
                    
                    // Extract user IDs from photo-face IDs and auto_ IDs
                    const matchedUsers = photo.matched_users;
                    const correctedUsers = matchedUsers.map(match => {
                        const userId = match.userId;
                        if (userId && (userId.startsWith('photo-') || userId.includes('-face-') || userId.startsWith('auto_'))) {
                            let extractedId = userId;
                            
                            if (userId.startsWith('photo-') || userId.includes('-face-')) {
                                extractedId = this.extractUserIdFromPhotoFaceId(userId);
                                console.log(`[DB-CORRECT] Extracted user ID from photo-face ID "${userId}": "${extractedId}"`);
                            } else if (userId.startsWith('auto_')) {
                                // For auto_ prefix, we need to check face_data table to get the real user ID
                                console.log(`[DB-CORRECT] Found auto_ prefixed ID: ${userId}`);
                                
                                // Since we can't easily look up the user ID from auto_ in this method,
                                // We'll just remove the auto_ prefix if it contains a valid UUID
                                const uuidPattern = /auto_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
                                const uuidMatch = userId.match(uuidPattern);
                                
                                if (uuidMatch && uuidMatch[1]) {
                                    extractedId = uuidMatch[1];
                                    console.log(`[DB-CORRECT] Extracted UUID from auto_ ID: ${extractedId}`);
                                } else {
                                    extractedId = userId.replace('auto_', '');
                                    console.log(`[DB-CORRECT] Removed auto_ prefix: ${extractedId}`);
                                }
                            }
                            
                            return {
                                ...match,
                                userId: extractedId,
                                originalUserId: userId // Keep the original for reference
                            };
                        }
                        return match;
                    });
                    
                    const { error: idsError } = await supabase
                        .from('photos')
                        .update({ matched_users: correctedUsers })
                        .eq('id', photoId);
                        
                    if (idsError) {
                        console.error(`[DB-CORRECT] Error fixing invalid ID formats:`, idsError);
                        console.groupEnd();
                        return { success: false, error: idsError.message };
                    }
                    
                    console.log(`[DB-CORRECT] Successfully fixed invalid ID formats`);
                    console.groupEnd();
                    return { 
                        success: true, 
                        correction: 'fixed_invalid_id_formats',
                        correctedCount: validationResult.invalidMatches.length
                    };
                    
                default:
                    console.warn(`[DB-CORRECT] Unknown issue type: ${validationResult.issue}`);
                    console.groupEnd();
                    return { success: false, error: `Unknown issue type: ${validationResult.issue}` };
            }
        } catch (error) {
            console.error(`[DB-CORRECT] Error correcting database record:`, error);
            console.groupEnd();
            return { success: false, error: error.message };
        }
    }

    // Modify the addUserMatchToPhoto method to check for linked accounts
    static async addUserMatchToPhoto(photoId, userId, faceId) {
        try {
            console.group(`[FACE-MATCH] 🔄 Adding User Match to Photo`);
            console.log(`[FACE-MATCH] 📝 INPUT DATA: photoId=${photoId}, userId=${userId}, faceId=${faceId}`);
            
            // Validate and sanitize parameters
            if (!photoId || !userId || !faceId) {
                console.error(`[FACE-MATCH] ❌ MISSING REQUIRED PARAMETERS: photoId=${photoId}, userId=${userId}, faceId=${faceId}`);
                console.groupEnd();
                return false;
            }
            
            // Check if userId is in photo-face format and extract if needed
            if (userId.startsWith('photo-') || userId.includes('-face-')) {
                const extractedId = this.extractUserIdFromPhotoFaceId(userId);
                if (extractedId !== userId) {
                    console.log(`[FACE-MATCH] 🔄 Converted photo-face ID "${userId}" to user ID "${extractedId}"`);
                    userId = extractedId;
                }
            }
            
            // Validate userId is in proper UUID format
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidPattern.test(userId)) {
                console.error(`[FACE-MATCH] ❌ Invalid user ID format: ${userId}`);
                console.groupEnd();
                return false;
            }
            
            // Get all linked user IDs, including handling of photo-face IDs
            console.time('[FACE-MATCH] Get linked accounts time');
            const linkedUserIds = await this.getLinkedUserIds(userId);
            console.timeEnd('[FACE-MATCH] Get linked accounts time');
            console.log(`[FACE-MATCH] 📝 Including ${linkedUserIds.length} linked accounts:`, linkedUserIds);
            
            // Get user data for the match
            console.log(`[FACE-MATCH] 🔍 Fetching user data for ${userId}...`);
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
                  id,
                  full_name,
                  avatar_url,
                  email
                `)
                .eq('id', userId)
                .single();
                
            if (userError) {
                console.error(`[FACE-MATCH] ⚠️ ERROR FETCHING USER DATA:`, userError);
                console.error(`[FACE-MATCH] ⚠️ ERROR DETAILS: ${JSON.stringify({
                    message: userError.message,
                    code: userError.code,
                    details: userError.details || {}
                })}`);
                console.log(`[FACE-MATCH] 🔄 Attempting to continue with limited user information`);
            }
            
            let userDataToUse;
            if (!userData) {
                console.warn(`[FACE-MATCH] ⚠️ NO USER DATA FOUND for ID ${userId}, using placeholder values`);
                // Create placeholder user data to avoid null references
                userDataToUse = {
                    id: userId,
                    full_name: 'Unknown User',
                    avatar_url: null,
                    email: null
                };
            } else {
                console.log(`[FACE-MATCH] ✅ Found user data: ${userData.full_name || userData.email || userId}`);
                userDataToUse = userData;
            }
            
            // Get current photo data
            console.log(`[FACE-MATCH] 🔍 Fetching current photo data for ${photoId}...`);
            const { data: photo, error: photoError } = await supabase
                .from('photos')
                .select('matched_users, id, created_at')
                .eq('id', photoId)
                .single();
                
            let photoData;
            if (photoError) {
                console.error(`[FACE-MATCH] ⚠️ ERROR FETCHING PHOTO DATA:`, photoError);
                console.error(`[FACE-MATCH] ⚠️ ERROR DETAILS: ${JSON.stringify({
                    message: photoError.message,
                    code: photoError.code,
                    details: photoError.details || {}
                })}`);
                
                // RECOVERY: Create the photo record if it doesn't exist
                if (photoError.message.includes('not found') || photoError.code === 'PGRST116') {
                    console.log(`[FACE-MATCH] ⚠️ Photo not found in database - trying to create a minimum record`);
                    
                    try {
                        // Try to create a minimal photo record using our utility
                        console.log(`[FACE-MATCH] 🔄 Using database utility to create photo record`);
                        const result = await createPhotoRecord(photoId, []);
                        
                        if (!result.success) {
                            console.error(`[FACE-MATCH] ❌ DATABASE UTILITY FAILED:`, result.error);
                            console.error(`[FACE-MATCH] ❌ ERROR DETAILS: ${JSON.stringify({
                                message: result.error.message,
                                code: result.error.code,
                                details: result.error.details || {}
                            })}`);
                            console.groupEnd();
                            return false;
                        }
                        
                        console.log(`[FACE-MATCH] ✅ Created photo record successfully`);
                        console.log(`[FACE-MATCH] 📋 NEW PHOTO DATA: ${JSON.stringify(result.data)}`);
                        photoData = result.data;
                    } catch (recoveryError) {
                        console.error(`[FACE-MATCH] ❌ RECOVERY ATTEMPT FAILED:`, recoveryError);
                        console.error(`[FACE-MATCH] ❌ ERROR STACK:`, recoveryError.stack);
                        console.groupEnd();
                        return false;
                    }
                } else {
                    // Other database error
                    console.groupEnd();
                    return false;
                }
            } else {
                photoData = photo;
            }
            
            if (!photoData) {
                console.error(`[FACE-MATCH] ❌ CRITICAL ERROR: No photo data available after attempts to fetch/create`);
                console.groupEnd();
                return false;
            }
            
            console.log(`[FACE-MATCH] ✅ Working with photo data:`, JSON.stringify(photoData));
            
            // Validate and correct the matched_users array if necessary
            if (!photoData.matched_users) {
                console.log(`[FACE-MATCH] ⚠️ No matched_users array found, initializing empty array`);
                photoData.matched_users = [];
            } else if (!Array.isArray(photoData.matched_users)) {
                console.warn(`[FACE-MATCH] ⚠️ matched_users is not an array, converting...`);
                try {
                    // Try to parse it if it's a string
                    if (typeof photoData.matched_users === 'string') {
                        photoData.matched_users = JSON.parse(photoData.matched_users);
                    } else {
                        // Reset to empty array if not parseable
                        photoData.matched_users = [];
                    }
                } catch (parseError) {
                    console.error(`[FACE-MATCH] ❌ Error parsing matched_users:`, parseError);
                    photoData.matched_users = [];
                }
            }
            
            // Create new match object with rich metadata
            const newMatch = {
                userId,
                faceId,
                fullName: userDataToUse.full_name || userDataToUse.email || 'Unknown User',
                email: userDataToUse.email || null,
                avatarUrl: userDataToUse.avatar_url,
                confidence: 99.0, // High confidence since this is a direct face match
                similarity: 99.0,  // High similarity for the same reason
                matchedAt: new Date().toISOString(),
                matchType: 'direct' // Indicates this is a direct face match
            };
            
            console.log(`[FACE-MATCH] 📋 NEW MATCH OBJECT: ${JSON.stringify(newMatch)}`);
            
            // Update matched_users array
            const existingMatches = Array.isArray(photoData.matched_users) ? photoData.matched_users : [];
            console.log(`[FACE-MATCH] 📊 EXISTING MATCHES: ${existingMatches.length} items`);
            
            // Fix any existing matches with photo-face IDs
            const correctedMatches = existingMatches.map(match => {
                if (match.userId && (match.userId.startsWith('photo-') || match.userId.includes('-face-'))) {
                    const extractedId = this.extractUserIdFromPhotoFaceId(match.userId);
                    console.log(`[FACE-MATCH] 🔄 Correcting existing match ID from "${match.userId}" to "${extractedId}"`);
                    return {
                        ...match,
                        userId: extractedId,
                        originalUserId: match.userId // Keep original for reference
                    };
                }
                return match;
            });
            
            if (existingMatches.length > 0) {
                console.table(correctedMatches.map(match => ({
                    userId: match.userId,
                    fullName: match.fullName || 'n/a',
                    confidence: match.confidence || 'n/a',
                    matchDate: match.matchedAt ? new Date(match.matchedAt).toLocaleString() : 'n/a'
                })));
            }
            
            // Check if user or any linked user is already in matches
            const allUserIds = new Set(linkedUserIds);
            const existingMatchIndex = correctedMatches.findIndex(match => 
                allUserIds.has(match.userId) || 
                allUserIds.has(this.extractUserIdFromPhotoFaceId(match.userId))
            );
            
            if (existingMatchIndex >= 0) {
                const existingMatch = correctedMatches[existingMatchIndex];
                console.log(`[FACE-MATCH] ⚠️ User ${existingMatch.userId} (linked to ${userId}) already matched with photo ${photoId} (match #${existingMatchIndex + 1})`);
                console.log(`[FACE-MATCH] ℹ️ Not adding duplicate match for linked account`);
                
                // Update the existing match if it was originally in photo-face format
                if (existingMatches[existingMatchIndex].userId !== correctedMatches[existingMatchIndex].userId) {
                    console.log(`[FACE-MATCH] 🔄 Updating existing match with corrected user ID format`);
                    
                    // Create updated matches array with the correction
                    const updatedMatches = [...existingMatches];
                    updatedMatches[existingMatchIndex] = correctedMatches[existingMatchIndex];
                    
                    // Save the updated array with corrected IDs
                    const { error: updateError } = await supabase
                        .from('photos')
                        .update({ matched_users: updatedMatches })
                        .eq('id', photoId);
                        
                    if (updateError) {
                        console.error(`[FACE-MATCH] ❌ Failed to update existing match with corrected ID:`, updateError);
                    } else {
                        console.log(`[FACE-MATCH] ✅ Successfully updated existing match with corrected ID`);
                    }
                }
                
                console.groupEnd();
                return true; // Still return success since the user (or linked account) is already matched
            }
            
            // Add the new match to the array
            const updatedMatches = [...correctedMatches, newMatch];
            console.log(`[FACE-MATCH] 📊 UPDATED MATCHES: ${updatedMatches.length} items (${correctedMatches.length} existing + 1 new)`);
            
            // ATTEMPT #1 - Direct SQL via admin function
            console.time('[FACE-MATCH] Database update time');
            console.log(`[FACE-MATCH] 🔄 ATTEMPT #1: Using admin_update_photo_matches function...`);
            
            try {
                const { data: adminResult, error: adminError } = await supabase.rpc(
                    'admin_update_photo_matches',
                    { 
                        p_id: photoId,
                        p_matched_users: updatedMatches
                    }
                );
                
                if (adminError) {
                    console.error(`[FACE-MATCH] ❌ ADMIN FUNCTION FAILED:`, adminError);
                    console.error(`[FACE-MATCH] ❌ ERROR DETAILS: ${JSON.stringify({
                        message: adminError.message,
                        code: adminError.code,
                        details: adminError.details || {}
                    })}`);
                } else {
                    console.log(`[FACE-MATCH] ✅ ADMIN FUNCTION RESPONSE:`, JSON.stringify(adminResult));
                    
                    if (adminResult && adminResult.success === true) {
                        console.log(`[FACE-MATCH] ✅ ADMIN FUNCTION SUCCEEDED with action: ${adminResult.action}`);
                        
                        // Verify the update in the database
                        await this.verifyPhotoUpdate(photoId, userId);
                        
                        // Also update the unassociated_face record to mark it as claimed
                        await this.updateUnassociatedFace(photoId, faceId, userId);
                        
                        // Try to create account links for any other faces in the photo
                        try {
                            console.log(`[FACE-MATCH] 🔄 Creating account links for other faces in the photo...`);
                            this.createAccountLinksForPhoto(photoId, userId).catch(e => 
                                console.warn(`[FACE-MATCH] ⚠️ Non-critical error in background account linking:`, e.message)
                            );
                        } catch (linkError) {
                            console.warn(`[FACE-MATCH] ⚠️ Non-critical error initiating account linking:`, linkError.message);
                        }
                        
                        console.log(`[FACE-MATCH] ✅ Successfully added user ${userDataToUse.full_name || userId} as match to photo ${photoId}`);
                        console.log(`[FACE-MATCH] ✅ MATCH ADDITION COMPLETE`);
                        console.timeEnd('[FACE-MATCH] Database update time');
                        console.groupEnd();
                        return true;
                    } else {
                        console.error(`[FACE-MATCH] ❌ ADMIN FUNCTION RETURNED ERROR:`, adminResult);
                    }
                }
                
                // If we're here, the admin function failed - try the regular update methods
            } catch (adminFunctionError) {
                console.error(`[FACE-MATCH] ❌ EXCEPTION CALLING ADMIN FUNCTION:`, adminFunctionError);
            }
            
            // ATTEMPT #2 - Complete update
            console.log(`[FACE-MATCH] 🔄 ATTEMPT #2: Saving updated matches with full data...`);
            console.log(`[FACE-MATCH] 📋 UPDATE DATA: ${JSON.stringify({
                matched_users: updatedMatches,
                updated_at: new Date().toISOString(),
                last_matched_at: new Date().toISOString()
            })}`);
            
            const { error: updateError } = await supabase
                .from('photos')
                .update({ 
                    matched_users: updatedMatches,
                    updated_at: new Date().toISOString(),
                    last_matched_at: new Date().toISOString()
                })
                .eq('id', photoId);
                
            if (updateError) {
                console.error(`[FACE-MATCH] ❌ ERROR UPDATING PHOTO MATCHES:`, updateError);
                console.error(`[FACE-MATCH] ❌ ERROR DETAILS: ${JSON.stringify({
                    message: updateError.message,
                    code: updateError.code,
                    details: updateError.details || {}
                })}`);
                
                // ATTEMPT #3 - Try a minimal update if the full update fails
                console.log(`[FACE-MATCH] 🔄 ATTEMPT #3: Trying minimal update with just matched_users field...`);
                console.log(`[FACE-MATCH] 📋 MINIMAL UPDATE DATA: ${JSON.stringify({ matched_users: updatedMatches })}`);
                
                const { error: minimalUpdateError } = await supabase
                    .from('photos')
                    .update({ matched_users: updatedMatches })
                    .eq('id', photoId);
                    
                if (minimalUpdateError) {
                    console.error(`[FACE-MATCH] ❌ MINIMAL UPDATE FAILED:`, minimalUpdateError);
                    console.error(`[FACE-MATCH] ❌ ERROR DETAILS: ${JSON.stringify({
                        message: minimalUpdateError.message,
                        code: minimalUpdateError.code,
                        details: minimalUpdateError.details || {}
                    })}`);
                    
                    // ATTEMPT #4 - Try with string conversion
                    console.log(`[FACE-MATCH] 🔄 ATTEMPT #4: Trying with stringified matched_users...`);
                    
                    try {
                        const stringifiedMatches = JSON.stringify(updatedMatches);
                        console.log(`[FACE-MATCH] 📋 STRINGIFIED MATCHES: ${stringifiedMatches}`);
                        
                        const { error: stringUpdateError } = await supabase
                            .from('photos')
                            .update({ 
                                matched_users: stringifiedMatches
                            })
                            .eq('id', photoId);
                            
                        if (stringUpdateError) {
                            console.error(`[FACE-MATCH] ❌ STRING UPDATE FAILED:`, stringUpdateError);
                            
                            // ATTEMPT #5 - Last chance with empty array initialization first
                            console.log(`[FACE-MATCH] 🔄 FINAL ATTEMPT: Initializing with empty array first...`);
                            
                            try {
                                // First ensure the matched_users is at least an empty array
                                await supabase
                                    .from('photos')
                                    .update({ matched_users: [] })
                                    .eq('id', photoId);
                                    
                                // Wait a moment for the database to process
                                await new Promise(resolve => setTimeout(resolve, 500));
                                
                                // Then try to update again
                                const { error: finalError } = await supabase
                                    .from('photos')
                                    .update({ matched_users: updatedMatches })
                                    .eq('id', photoId);
                                    
                                if (finalError) {
                                    console.error(`[FACE-MATCH] ❌ FINAL UPDATE FAILED:`, finalError);
                                    console.error(`[FACE-MATCH] ❌ ALL UPDATE ATTEMPTS FAILED`);
                                    console.timeEnd('[FACE-MATCH] Database update time');
                                    console.groupEnd();
                                    return false;
                                } else {
                                    console.log(`[FACE-MATCH] ✅ FINAL UPDATE SUCCEEDED`);
                                    
                                    // Verify the update in the database
                                    await this.verifyPhotoUpdate(photoId, userId);
                                }
                            } catch (finalAttemptError) {
                                console.error(`[FACE-MATCH] ❌ FINAL ATTEMPT EXCEPTION:`, finalAttemptError);
                                console.timeEnd('[FACE-MATCH] Database update time');
                                console.groupEnd();
                                return false;
                            }
                        } else {
                            console.log(`[FACE-MATCH] ✅ STRING UPDATE SUCCEEDED`);
                            
                            // Verify the update in the database
                            await this.verifyPhotoUpdate(photoId, userId);
                        }
                    } catch (stringifyError) {
                        console.error(`[FACE-MATCH] ❌ ERROR STRINGIFYING MATCHES:`, stringifyError);
                        console.timeEnd('[FACE-MATCH] Database update time');
                        console.groupEnd();
                        return false;
                    }
                } else {
                    console.log(`[FACE-MATCH] ✅ MINIMAL UPDATE SUCCEEDED`);
                    
                    // Verify the update in the database
                    await this.verifyPhotoUpdate(photoId, userId);
                }
            } else {
                console.log(`[FACE-MATCH] ✅ UPDATE SUCCEEDED on first attempt`);
                
                // Verify the update in the database
                await this.verifyPhotoUpdate(photoId, userId);
            }
            
            console.log(`[FACE-MATCH] ✅ Successfully added user ${userDataToUse.full_name || userId} as match to photo ${photoId}`);
            
            // Also update the unassociated_face record to mark it as claimed
            await this.updateUnassociatedFace(photoId, faceId, userId);
            
            // Try to create account links for any other faces in the photo
            try {
                console.log(`[FACE-MATCH] 🔄 Creating account links for other faces in the photo...`);
                this.createAccountLinksForPhoto(photoId, userId).catch(e => 
                    console.warn(`[FACE-MATCH] ⚠️ Non-critical error in background account linking:`, e.message)
                );
            } catch (linkError) {
                console.warn(`[FACE-MATCH] ⚠️ Non-critical error initiating account linking:`, linkError.message);
            }
            
            console.log(`[FACE-MATCH] ✅ MATCH ADDITION COMPLETE`);
            console.timeEnd('[FACE-MATCH] Database update time');
            console.groupEnd();
            return true;
        } catch (error) {
            console.error(`[FACE-MATCH] ❌ UNEXPECTED ERROR in addUserMatchToPhoto:`, error);
            console.error(`[FACE-MATCH] ❌ ERROR MESSAGE: ${error.message}`);
            console.error(`[FACE-MATCH] ❌ ERROR STACK:`, error.stack);
            if (error.cause) console.error(`[FACE-MATCH] ❌ ERROR CAUSE:`, error.cause);
            console.timeEnd('[FACE-MATCH] Database update time');
            console.groupEnd();
            return false;
        }
    }

    // Helper method to create account links between users in the same photo
    static async createAccountLinksForPhoto(photoId, primaryUserId) {
        try {
            console.group(`[ACCOUNT-LINKS] Creating account links for photo ${photoId}`);
            console.log(`[ACCOUNT-LINKS] Primary user ID: ${primaryUserId}`);
            
            // Get photo data
            const { data: photo, error: photoError } = await supabase
                .from('photos')
                .select('matched_users, uploaded_by')
                .eq('id', photoId)
                .single();
                
            if (photoError) {
                console.error(`[ACCOUNT-LINKS] Error fetching photo:`, photoError);
                console.groupEnd();
                return false;
            }
            
            if (!photo || !photo.matched_users || !Array.isArray(photo.matched_users)) {
                console.log(`[ACCOUNT-LINKS] No valid matched_users array in photo`);
                console.groupEnd();
                return false;
            }
            
            // Get the actual user who uploaded the photo
            const uploadedBy = photo.uploaded_by || primaryUserId;
            console.log(`[ACCOUNT-LINKS] Photo uploaded by: ${uploadedBy}`);
            
            // Make sure the uploader is included in the account linking process
            if (uploadedBy !== primaryUserId) {
                console.log(`[ACCOUNT-LINKS] Adding uploader ${uploadedBy} to account linking process`);
                
                // Create a link between the primary user and the uploader
                await this.createAccountLinkIfNeeded(primaryUserId, uploadedBy, 99.0);
            }
            
            const matchedUsers = photo.matched_users;
            console.log(`[ACCOUNT-LINKS] Photo has ${matchedUsers.length} matched users`);
            
            if (matchedUsers.length < 2) {
                console.log(`[ACCOUNT-LINKS] Not enough users to create links (minimum 2 required)`);
                console.groupEnd();
                return false;
            }
            
            // Extract user IDs, correctly handling any in photo-face format
            const userIds = matchedUsers.map(match => {
                if (match.userId && (match.userId.startsWith('photo-') || match.userId.includes('-face-') || match.userId.startsWith('auto_'))) {
                    let extractedId = match.userId;
                    
                    if (match.userId.startsWith('photo-') || match.userId.includes('-face-')) {
                        extractedId = this.extractUserIdFromPhotoFaceId(match.userId);
                        console.log(`[ACCOUNT-LINKS] Extracted user ID from "${match.userId}": "${extractedId}"`);
                    } else if (match.userId.startsWith('auto_')) {
                        extractedId = match.userId.replace('auto_', '');
                        console.log(`[ACCOUNT-LINKS] Removed auto_ prefix: ${extractedId}`);
                    }
                    
                    return extractedId;
                }
                return match.userId;
            });
            
            // Add the primary user ID if not already in the list
            if (!userIds.includes(primaryUserId)) {
                console.log(`[ACCOUNT-LINKS] Adding primary user ${primaryUserId} to the user ID list`);
                userIds.push(primaryUserId);
            }
            
            // Add the uploader if not already in the list
            if (!userIds.includes(uploadedBy)) {
                console.log(`[ACCOUNT-LINKS] Adding uploader ${uploadedBy} to the user ID list`);
                userIds.push(uploadedBy);
            }
            
            console.log(`[ACCOUNT-LINKS] Extracted user IDs:`, userIds);
            
            // Filter out invalid IDs
            const validUserIds = userIds.filter(id => {
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                return id && uuidPattern.test(id);
            });
            
            console.log(`[ACCOUNT-LINKS] Valid user IDs:`, validUserIds);
            
            if (validUserIds.length < 2) {
                console.log(`[ACCOUNT-LINKS] Not enough valid user IDs to create links`);
                console.groupEnd();
                return false;
            }
            
            // Create links between all users in the photo
            let linkedCount = 0;
            const alreadyProcessed = new Set();
            
            // First, prioritize creating links from the primary user to others
            for (const userId of validUserIds) {
                // Skip if same user or already processed
                if (userId === primaryUserId) {
                    continue;
                }
                
                const linkKey = `${primaryUserId}-${userId}`;
                const reverseLinkKey = `${userId}-${primaryUserId}`;
                
                // Skip if already processed
                if (alreadyProcessed.has(linkKey) || alreadyProcessed.has(reverseLinkKey)) {
                    continue;
                }
                
                // Mark as processed
                alreadyProcessed.add(linkKey);
                alreadyProcessed.add(reverseLinkKey);
                
                console.log(`[ACCOUNT-LINKS] Creating high-priority link between primary user ${primaryUserId} and ${userId}`);
                const result = await this.createAccountLinkIfNeeded(primaryUserId, userId, 99.0); // Higher confidence for primary user
                
                if (result) {
                    console.log(`[ACCOUNT-LINKS] Successfully created link between primary user ${primaryUserId} and ${userId}`);
                    linkedCount++;
                } else {
                    console.log(`[ACCOUNT-LINKS] Failed to create link between primary user ${primaryUserId} and ${userId}`);
                }
            }
            
            // Then create links between all other users
            for (let i = 0; i < validUserIds.length; i++) {
                for (let j = i+1; j < validUserIds.length; j++) {
                    const user1 = validUserIds[i];
                    const user2 = validUserIds[j];
                    
                    // Skip if either user is the primary user (already handled above)
                    if (user1 === primaryUserId || user2 === primaryUserId) {
                        continue;
                    }
                    
                    // Skip if already processed or same user
                    if (user1 === user2 || alreadyProcessed.has(`${user1}-${user2}`) || alreadyProcessed.has(`${user2}-${user1}`)) {
                        continue;
                    }
                    
                    // Mark as processed
                    alreadyProcessed.add(`${user1}-${user2}`);
                    
                    console.log(`[ACCOUNT-LINKS] Creating link between ${user1} and ${user2}`);
                    const result = await this.createAccountLinkIfNeeded(user1, user2, 95.0); // 95% confidence for same-photo links
                    
                    if (result) {
                        console.log(`[ACCOUNT-LINKS] Successfully created link between ${user1} and ${user2}`);
                        linkedCount++;
                    } else {
                        console.log(`[ACCOUNT-LINKS] Failed to create link between ${user1} and ${user2}`);
                    }
                }
            }
            
            console.log(`[ACCOUNT-LINKS] Created ${linkedCount} account links`);
            console.groupEnd();
            return linkedCount > 0;
        } catch (error) {
            console.error(`[ACCOUNT-LINKS] Error creating account links:`, error);
            console.groupEnd();
            return false;
        }
    }
} 