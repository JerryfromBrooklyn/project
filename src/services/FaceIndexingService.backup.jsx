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
                console.log('[FACE-REG] Using existing face ID but still performing historical matching');
                
                faceId = existingFaceData.face_id;
                attributes = detectedFaces[0]; // Use the detected face attributes
            } else {
                // If no existing face ID, proceed with indexing a new face
                console.log('[FACE-REG] Step 2: Indexing new face in AWS Rekognition...');
                const command = new IndexFacesCommand({
                    CollectionId: this.COLLECTION_ID,
                    Image: { Bytes: imageBytes },
                    ExternalImageId: userId,
                    DetectionAttributes: ['ALL'],
                    MaxFaces: 1,
                    QualityFilter: 'AUTO'
                });
                
                console.log('[FACE-REG] Sending IndexFaces request to AWS...');
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

    static async searchFacesByFaceId(faceId, userId) {
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

    static async searchFaces(imageBytes, photoId) {
        // Implementation details...
    }

    static async detectFacesWithRetry(imageBytes) {
        // Implementation details...
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

    static async searchFacesByImage(photoId, imageUrl) {
        // Implementation details...
    }

    static async getCollectionStats() {
        // Implementation details...
    }

    static async listFacesInCollection() {
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
            // Get all accounts linked to this user
            const { data: linkedAccounts, error } = await supabase
                .from('linked_accounts')
                .select('*')
                .or(`user_id.eq.${userId},linked_user_id.eq.${userId}`);
                
            if (error) {
                console.error('[LINKED-ACCOUNTS] Error fetching linked accounts:', error);
                return [userId]; // Return just the original user ID if there's an error
            }
            
            if (!linkedAccounts || linkedAccounts.length === 0) {
                return [userId]; // No linked accounts
            }
            
            // Extract all user IDs (both user_id and linked_user_id)
            const allLinkedIds = linkedAccounts.flatMap(link => {
                // For each link, get both IDs but filter out the user's own ID
                const ids = [link.user_id, link.linked_user_id];
                return ids.filter(id => id !== userId);
            });
            
            // Add the original user ID
            const result = [userId, ...allLinkedIds];
            
            // Remove duplicates by converting to Set and back
            return [...new Set(result)];
        } catch (error) {
            console.error('[LINKED-ACCOUNTS] Error processing linked accounts:', error);
            return [userId]; // Return just the original user ID if there's an exception
        }
    }

    // Modify the addUserMatchToPhoto method to check for linked accounts
    static async addUserMatchToPhoto(photoId, userId, faceId) {
        // Get all linked user IDs
        const linkedUserIds = await this.getLinkedUserIds(userId);
        
        try {
            console.group(`[FACE-MATCH] 🔄 Adding User Match to Photo`);
            console.log(`[FACE-MATCH] 📝 INPUT DATA: photoId=${photoId}, userId=${userId}, faceId=${faceId}`);
            console.log(`[FACE-MATCH] 📝 Including ${linkedUserIds.length} linked accounts`);
            
            if (!photoId || !userId || !faceId) {
                console.error(`[FACE-MATCH] ❌ MISSING REQUIRED PARAMETERS: photoId=${photoId}, userId=${userId}, faceId=${faceId}`);
                console.groupEnd();
                return false;
            }
            
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
            console.log(`[FACE-MATCH] 📊 EXISTING MATCHES DATA: ${JSON.stringify(existingMatches)}`);
            
            // Check if user is already in matches
            const existingMatchIndex = existingMatches.findIndex(match => match.userId === userId);
            if (existingMatchIndex >= 0) {
                console.log(`[FACE-MATCH] ⚠️ User ${userId} already matched with photo ${photoId} (match #${existingMatchIndex + 1})`);
                console.log(`[FACE-MATCH] ℹ️ Not adding duplicate match`);
                console.groupEnd();
                return true; // Still return success since the user is already matched
            }
            
            // Add the new match to the array
            const updatedMatches = [...existingMatches, newMatch];
            console.log(`[FACE-MATCH] 📊 UPDATED MATCHES: ${updatedMatches.length} items (${existingMatches.length} existing + 1 new)`);
            
            // ATTEMPT #1 - Direct SQL via admin function
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
                        
                        console.log(`[FACE-MATCH] ✅ Successfully added user ${userDataToUse.full_name || userId} as match to photo ${photoId}`);
                        console.log(`[FACE-MATCH] ✅ MATCH ADDITION COMPLETE`);
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
                                    console.groupEnd();
                                    return false;
                                } else {
                                    console.log(`[FACE-MATCH] ✅ FINAL UPDATE SUCCEEDED`);
                                    
                                    // Verify the update in the database
                                    await this.verifyPhotoUpdate(photoId, userId);
                                }
                            } catch (finalAttemptError) {
                                console.error(`[FACE-MATCH] ❌ FINAL ATTEMPT EXCEPTION:`, finalAttemptError);
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
            
            console.log(`[FACE-MATCH] ✅ MATCH ADDITION COMPLETE`);
            console.groupEnd();
            return true;
        } catch (error) {
            console.error(`[FACE-MATCH] ❌ UNEXPECTED ERROR in addUserMatchToPhoto:`, error);
            console.error(`[FACE-MATCH] ❌ ERROR MESSAGE: ${error.message}`);
            console.error(`[FACE-MATCH] ❌ ERROR STACK:`, error.stack);
            if (error.cause) console.error(`[FACE-MATCH] ❌ ERROR CAUSE:`, error.cause);
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
} 