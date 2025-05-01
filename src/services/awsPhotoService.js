import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, docClient, rekognitionClient, PHOTO_BUCKET, PHOTOS_TABLE, COLLECTION_ID, AWS_REGION, FACE_DATA_BUCKET } from '../lib/awsClient';
import { IndexFacesCommand, CompareFacesCommand, SearchFacesCommand, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import { getFaceDataForUser } from './FaceStorageService';
import { marshall } from '@aws-sdk/util-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { filterPhotosByVisibility } from './userVisibilityService';
import axios from 'axios';
import { API_URL } from '../config';
/**
 * Service for handling photo operations with AWS S3 and DynamoDB
 */
export const awsPhotoService = {
    /**
     * Upload a photo with metadata to S3 and DynamoDB
     * @param {File} file - The file to upload
     * @param {Object} metadata - Additional metadata like event details
     * @param {Function} progressCallback - Callback for upload progress
     * @param {boolean} analyzeWithAI - Whether to analyze the photo with AI
     * @returns {Promise<Object>} The uploaded photo data
     */
    uploadPhoto: async (file, eventId, folderPath, metadata = {}, progressCallback = (progress) => {}) => {
        const uploadId = Math.random().toString(36).substring(7); // For debugging logs
        try {
            console.group(`🚀 [Upload ${uploadId}] Starting upload for ${file.name}`);
            console.log(`📤 [Upload ${uploadId}] Starting S3 process...`);
            console.log(`   File: ${file.name} (${file.size} bytes)`);
            
            console.log('   Event ID:', eventId);
            console.log('   Folder Path:', folderPath);
            console.log('   Metadata:', JSON.stringify(metadata, null, 2));
            
            // Get user ID from metadata or localStorage
            let userId = metadata?.user_id || metadata?.uploaded_by || metadata?.uploadedBy;
            console.log(`   User ID from metadata: ${userId}`);
            
            // If userId is not in metadata, try to get it from localStorage
            if (!userId) {
                try {
                    // Try to get the user from authUser in localStorage
                    const userStr = localStorage.getItem('authUser');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user && user.id) {
                            userId = user.id;
                            console.log(`   User ID from localStorage authUser: ${userId}`);
                        } else {
                            console.warn(`   Invalid user object in localStorage authUser: ${userStr}`);
                        }
                    } else {
                        // Try the aws_auth_session as a fallback
                        const sessionStr = localStorage.getItem('aws_auth_session');
                        if (sessionStr) {
                            console.log(`   Found aws_auth_session, attempting to get current user...`);
                            // This is an async operation but we're inside an async function, so we can await
                            const { getCurrentUser } = await import('./awsAuthService');
                            const currentUser = await getCurrentUser();
                            if (currentUser && currentUser.id) {
                                userId = currentUser.id;
                                console.log(`   User ID from AWS auth service: ${userId}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`   Error retrieving user from storage:`, error);
                }
            }
            
            // Use 'unknown' as fallback if userId is still not found
            if (!userId) {
                console.warn(`⚠️ No user ID found in metadata or localStorage. Using 'unknown' as default.`);
                userId = 'unknown';
            }
            
            // Generate UUID for the file
            const fileId = uuidv4();
            
            // Clean up folder path (remove dots and ensure no leading/trailing slashes)
            let cleanFolderPath = '';
            if (folderPath && folderPath !== '.') {
                cleanFolderPath = folderPath.replace(/^\.\/|\/\.\/|\/\.$|\.$/, '');
                // Remove leading and trailing slashes
                cleanFolderPath = cleanFolderPath.replace(/^\/+|\/+$/g, '');
                if (cleanFolderPath) {
                    cleanFolderPath = `${cleanFolderPath}/`;
                }
            }
            
            // File path with userId (which now has a fallback)
            const fileName = `${fileId}_${file.name}`;
            const path = cleanFolderPath 
                ? `photos/${userId}/${cleanFolderPath}${fileName}` // Folder path included
                : `photos/${userId}/${fileName}`; // No folder path
                
            console.log(`   Generated S3 path: ${path}`);
            console.log(`   Generated photo ID: ${fileId}`);
            progressCallback(20);

            console.log(`⬆️ [Upload ${uploadId}] Reading file into buffer...`);
            const fileArrayBuffer = await file.arrayBuffer(); // Read file as ArrayBuffer
            const fileUint8Array = new Uint8Array(fileArrayBuffer); // Convert to Uint8Array
            console.log(`   File Uint8Array Size: ${fileUint8Array.byteLength} bytes`); // Log Uint8Array size

            console.log(`⬆️ [Upload ${uploadId}] Uploading to S3 Bucket: ${PHOTO_BUCKET}`);
            const uploadParams = {
                Bucket: PHOTO_BUCKET,
                Key: path,
                Body: fileArrayBuffer, // S3 can handle ArrayBuffer for upload
                ContentType: file.type
            };
            await s3Client.send(new PutObjectCommand(uploadParams));
            console.log(`✅ [Upload ${uploadId}] S3 Upload successful.`);
            progressCallback(50);

            const publicUrl = `https://${PHOTO_BUCKET}.s3.amazonaws.com/${path}`;
            console.log(`🔗 [Upload ${uploadId}] Generated Public URL: ${publicUrl}`);

            let photoMetadata = {
                id: fileId,
                user_id: userId,
                storage_path: path,
                url: publicUrl,
                public_url: publicUrl,
                uploaded_by: userId,
                uploadedBy: userId,
                file_size: file.size,
                fileSize: file.size,
                file_type: file.type,
                fileType: file.type,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                faces: [],
                matched_users: [],
                face_ids: [],
                location: metadata.location || { lat: null, lng: null, name: null },
                venue: metadata.venue || { id: null, name: null },
                event_details: metadata.event_details || { date: null, name: null, type: null },
                tags: metadata.tags || [],
                folder_path: folderPath || null,
                title: metadata.title || file.name,
                description: metadata.description || '',
                externalAlbumLink: metadata.externalAlbumLink || null
            };
            console.log(`📝 [Upload ${uploadId}] Prepared initial metadata for DynamoDB.`);
            progressCallback(60);

            // Add consistency check for user ID fields
            const ensureUserIdConsistency = (metadata) => {
              if (!metadata) return metadata;
              
              // Make sure these fields are all consistently set with the same value
              const userId = metadata.user_id || metadata.userId || metadata.uploadedBy || metadata.uploaded_by;
              
              if (userId) {
                metadata.user_id = userId;
                metadata.userId = userId;
                metadata.uploadedBy = userId;
                metadata.uploaded_by = userId;
                
                console.log(`[PhotoService] Ensuring consistent user ID fields for upload: ${userId}`);
              }
              
              return metadata;
            };
            
            // Apply to initial metadata preparation
            photoMetadata = ensureUserIdConsistency(photoMetadata);

            // --- Rekognition Face Indexing & Comparison --- 
            console.groupCollapsed(`🔄 [Upload ${uploadId}] Running Rekognition Face Indexing & Comparison...`);
            let detectedFaceId = null; // Store detected face ID
            try {
                console.log(`   Using global Rekognition Client: ${!!rekognitionClient}`); 
                console.log(`   IndexFacesCommand available: ${!!IndexFacesCommand}`); 
                console.log(`   Action: Indexing faces from image bytes`); 
                
                if (!fileUint8Array) {
                    throw new Error("File buffer (Uint8Array) is missing");
                }

                const indexParams = {
                    CollectionId: COLLECTION_ID || 'shmong-faces',
                    Image: { Bytes: fileUint8Array },
                    ExternalImageId: `photo_${fileId}`, // Add prefix to identify this as a photo face, not a user
                    MaxFaces: 10, 
                    DetectionAttributes: ['DEFAULT'] 
                };
                console.log(`   IndexFaces Params Prepared (Bytes omitted):`, { ...indexParams, Image: { Bytes: `Uint8Array length: ${fileUint8Array.byteLength}` } }); 
                console.log(`   Sending IndexFaces command...`);
                const indexResponse = await rekognitionClient.send(new IndexFacesCommand(indexParams)); 
                console.log(`   Rekognition IndexFaces response received successfully.`);
                
                if (indexResponse.FaceRecords && indexResponse.FaceRecords.length > 0) {
                    console.log(`   ✅ Detected and Indexed ${indexResponse.FaceRecords.length} faces.`);
                    // Store basic face info
                    photoMetadata.faces = indexResponse.FaceRecords.map(record => {
                        console.log(`      👤 Indexed Face ID: ${record.Face.FaceId} (Linked to Photo ${fileId})`); 
                        return {
                            faceId: record.Face.FaceId,
                            boundingBox: record.Face.BoundingBox,
                            confidence: record.Face.Confidence
                        };
                    });
                    photoMetadata.face_ids = indexResponse.FaceRecords.map(r => r.Face.FaceId);
                    detectedFaceId = photoMetadata.face_ids[0]; // Get the ID of the first detected face
                } else {
                    console.log(`   ⚠️ No faces detected/indexed in the photo.`);
                }

                // Compare the detected face with this user's registered face if available
                if (detectedFaceId) {
                    console.log(`   🔄 Comparing detected face with registered uploader...`);
                    const uploaderFaceData = await getFaceDataForUser(userId); 
                    if (uploaderFaceData && uploaderFaceData.faceId) {
                        const registeredFaceId = uploaderFaceData.faceId;
                        console.log(`      Comparing PhotoFaceID: ${detectedFaceId} with RegisteredFaceID: ${registeredFaceId}`);
                        try {
                            // Use SearchFaces to find matches for the detected face instead of direct comparison
                            const searchParams = {
                                CollectionId: COLLECTION_ID,
                                FaceId: detectedFaceId,
                                MaxFaces: 1000, // Increased from 50 to 1000
                                FaceMatchThreshold: 95.0
                            };
                            
                            const searchResponse = await rekognitionClient.send(new SearchFacesCommand(searchParams));
                            
                            if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                                let uploaderFound = false;
                                
                                console.log(`      Found ${searchResponse.FaceMatches.length} face matches for ${detectedFaceId}:`); 
                                searchResponse.FaceMatches.forEach((match, idx) => {
                                  console.log(`        Match #${idx+1}: Face ID: ${match.Face.FaceId}, External ID: ${match.Face.ExternalImageId}, Similarity: ${match.Similarity.toFixed(2)}%`);
                                });
                                
                                // Process each match
                                for (const match of searchResponse.FaceMatches) {
                                    const matchedExternalId = match.Face.ExternalImageId;
                                    const matchedFaceId = match.Face.FaceId;
                                    let similarity = match.Similarity;
                                    
                                    // Skip exact self-matches (same face ID or matching photo ID)
                                    if ((matchedFaceId === detectedFaceId || `photo_${fileId}` === matchedExternalId) && similarity >= 99.9) {
                                        console.log(`      ⚠️ Skipping self-match: FaceId=${matchedFaceId}, ExternalId=${matchedExternalId}`);
                                        continue;
                                    }

                                    // Method 1: Check for direct face ID match (rarely works because of how Rekognition works)
                                    if (matchedFaceId === registeredFaceId) {
                                        console.log(`      ✅ Exact uploader face match found! Similarity: ${similarity.toFixed(2)}%`);
                                        
                                        // More permissive threshold for user recognition (99%)
                                        if (similarity >= 99) {
                                            // Add the uploader to matched_users
                                            console.log(`         -> Adding Uploader (${userId}) to matched_users list.`);
                                            photoMetadata.matched_users.push({
                                                userId: userId,
                                                faceId: registeredFaceId,
                                                similarity: parseFloat(similarity.toFixed(4)), // Store with 4 decimal places
                                                matchedAt: new Date().toISOString()
                                            });
                                            uploaderFound = true;
                                        } else {
                                            console.log(`      ⚠️ Match below confidence threshold (${similarity.toFixed(2)}%)`);
                                        }
                                        break;
                                    }
                                    
                                    // Method 2: Check for user ID in external image ID (more reliable)
                                    if (matchedExternalId && matchedExternalId === `user_${userId}`) {
                                        console.log(`      ✅ Uploader match found by ExternalImageId! Similarity: ${similarity.toFixed(2)}%`);
                                        
                                        // More permissive threshold for user recognition (99%)
                                        if (similarity >= 99) {
                                            // Add the uploader to matched_users
                                            console.log(`         -> Adding Uploader (${userId}) to matched_users list via ExternalImageId.`);
                                            photoMetadata.matched_users.push({
                                                userId: userId,
                                                faceId: matchedFaceId, // Use the matched face ID
                                                similarity: parseFloat(similarity.toFixed(4)), // Store with 4 decimal places
                                                matchedAt: new Date().toISOString()
                                            });
                                            uploaderFound = true;
                                        } else {
                                            console.log(`      ⚠️ Match below confidence threshold (${similarity.toFixed(2)}%)`);
                                        }
                                        break;
                                    }
                                }
                                
                                if (!uploaderFound) {
                                    console.log(`      ❌ Uploader face (${registeredFaceId}) not found among matches for ${detectedFaceId}.`); 
                                }
                            } else {
                                console.log(`      ❌ No matches found for the detected face ${detectedFaceId}.`); 
                            }
                        } catch (compareError) {
                            console.error(`      ⚠️ Error comparing faces for ${detectedFaceId}:`, compareError); 
                            // Continue with the upload even if face comparison fails
                        }
                    } else {
                        console.log(`   Uploader ${userId} is not registered, skipping comparison.`);
                    }
                } // end if(detectedFaceId)

                // If faces were detected, check if they match any registered users
                if (photoMetadata.face_ids && photoMetadata.face_ids.length > 0) {
                    console.log(`   🔄 Checking if ${photoMetadata.face_ids.length} detected faces match any registered users...`);
                    
                    // Get all registered user face IDs from shmong-face-data table
                    for (const detectedFaceId of photoMetadata.face_ids) {
                        console.log(`      Processing detected face: ${detectedFaceId}`);
                        try {
                            // Search for this face ID in our face collection
                            const searchParams = {
                                CollectionId: COLLECTION_ID,
                                FaceId: detectedFaceId,
                                MaxFaces: 1000, // Increased from 50 to 1000
                                FaceMatchThreshold: 95.0
                            };
                            
                            const searchResponse = await rekognitionClient.send(new SearchFacesCommand(searchParams));
                            
                            if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                                console.log(`      ✅ Found ${searchResponse.FaceMatches.length} potential matches for face ${detectedFaceId}`);
                                searchResponse.FaceMatches.forEach((match, idx) => {
                                  console.log(`        Match #${idx+1}: Face ID: ${match.Face.FaceId}, External ID: ${match.Face.ExternalImageId}, Similarity: ${match.Similarity.toFixed(2)}%`);
                                });
                                
                                // Process each match
                                for (const match of searchResponse.FaceMatches) {
                                    const matchedExternalId = match.Face.ExternalImageId;
                                    const matchedFaceId = match.Face.FaceId;
                                    let similarity = match.Similarity;
                                    
                                    // Skip exact self-matches (same face ID with 100% similarity or matching photo ID)
                                    if ((matchedFaceId === detectedFaceId || `photo_${fileId}` === matchedExternalId) && similarity >= 99.9) {
                                        console.log(`      ⚠️ Skipping true self-match: FaceId=${matchedFaceId}, ExternalId=${matchedExternalId}`);
                                        continue;
                                    }
                                    
                                    // Skip matches with user registration faces (they have user_ prefix)
                                    if (matchedExternalId && matchedExternalId.startsWith('user_')) {
                                        // Only skip the uploading user's registration face
                                        const userIdFromExternalId = matchedExternalId.substring(5); // Remove 'user_' prefix
                                        if (userIdFromExternalId === userId) {
                                            console.log(`      ⚠️ Skipping match with uploader's registration face: ${matchedExternalId}`);
                                            continue;
                                        }
                                        // Allow matches with other users' registration faces
                                        console.log(`      ✅ Allowing match with other user's registration face: ${matchedExternalId}`);
                                    }
                                    
                                    // Skip if the matched FaceId is the exact same as the one we are searching with
                                    if (matchedFaceId === detectedFaceId) {
                                        console.log(`      ⚠️ Skipping exact self-match for FaceId: ${detectedFaceId}`);
                                        continue;
                                    }
                                    
                                    // If the external ID looks like a user ID (user_ prefix), process it
                                    // Check if this is a user registration face (with user_ prefix)
                                    if (matchedExternalId.startsWith('user_')) {
                                        // Extract the actual user ID by removing the prefix
                                        const actualUserId = matchedExternalId.substring(5);
                                        console.log(`      👤 Matched with user registration face: ${actualUserId}`);
                                        
                                        // Skip if this is the current user's ID
                                        if (actualUserId === userId) {
                                            console.log(`      ⚠️ Skipping self-match with user ${userId}`);
                                            continue;
                                        }
                                        
                                        console.log(`      👤 Matched with user ${actualUserId} (${similarity.toFixed(2)}% similarity)`);
                                        
                                        // Validate that this is a realistic match by checking similarity
                                        if (similarity < 99) { // Check against 99% threshold (previously 98%)
                                            console.log(`      ⚠️ Skipping match with ${actualUserId} due to similarity (${similarity.toFixed(2)}%) being below threshold (99%)`);
                                            continue;
                                        }
                                        
                                        // Add this user to matched_users if not already there
                                        const existingMatch = photoMetadata.matched_users.find(m => 
                                            (m.userId && m.userId === actualUserId) || 
                                            (m.user_id && m.user_id === actualUserId) ||
                                            (typeof m === 'string' && m === actualUserId)
                                        );
                                        
                                        if (!existingMatch) {
                                            // Always use the same object structure for consistency
                                            const matchEntry = {
                                                userId: actualUserId,
                                                faceId: matchedFaceId,
                                                similarity: parseFloat(similarity.toFixed(4)), // Store with 4 decimal places
                                                matchedAt: new Date().toISOString()
                                            };
                                            photoMetadata.matched_users.push(matchEntry);
                                            console.log(`      ✅ Added ${actualUserId} to matched_users list with similarity ${matchEntry.similarity}%`);
                                        } else {
                                            console.log(`      ⚠️ User ${actualUserId} already in matched_users list`);
                                        }
                                        continue;
                                    }
                                    
                                    // This is a photo ID (with photo_ prefix)
                                    if (matchedExternalId.startsWith('photo_')) {
                                        console.log(`      ℹ️ Matched with photo: ${matchedExternalId} (Skipping as it's not a user registration face)`);
                                        continue;
                                    }
                                }
                            } else {
                                console.log(`      ℹ️ No matching users found for face ${detectedFaceId}`);
                            }
                        } catch (searchError) {
                            console.error(`      ❌ Error searching for matching faces:`, searchError);
                            // Continue processing other faces
                        }
                    }
                }

            } catch (rekognitionError) { 
                console.error(`  ❌❌❌ CRITICAL ERROR during Rekognition processing:`, rekognitionError);
                console.error(`  ❌❌❌ Matching process aborted for Photo ID: ${fileId}. Metadata will be saved without matches.`);
                // Decide if we still save metadata even if Rekognition fails?
                // For now, we continue and save metadata without face info.
            }
            console.groupEnd(); // End Rekognition group
            progressCallback(90); // Assuming indexing takes bulk of time

            // Save metadata (including faces/face_ids if successful, empty matched_users)
            console.log(`💾 [Upload ${uploadId}] Saving final metadata to DynamoDB Table: ${PHOTOS_TABLE}`);
            console.log(`   Final photoMetadata object (before marshall):`, JSON.stringify(photoMetadata, null, 2)); 
            
            // Manually marshal the data for the base client
            let marshalledItem;
            try {
                console.log(`   Final matched_users before marshalling:`, JSON.stringify(photoMetadata.matched_users)); 
                marshalledItem = marshall(photoMetadata, {
                    convertEmptyValues: true, // Convert empty strings/sets to NULL
                    removeUndefinedValues: true, // Remove keys with undefined values
                    convertClassInstanceToMap: true // Convert class instances to maps
                });
                console.log('   Successfully marshalled data for DynamoDB.');
            } catch (marshallError) {
                console.error('   ❌ Marshalling failed:', marshallError);
                throw new Error('Failed to prepare data for DynamoDB'); // Fail fast if marshalling breaks
            }

            const putParams = {
                TableName: PHOTOS_TABLE,
                Item: marshalledItem 
            };
            console.log('   PutItem Params (Marshalled): ', JSON.stringify(putParams));
            
            // Use the base dynamoClient, not docClient
            const { dynamoClient } = await import('../lib/awsClient'); 
            await dynamoClient.send(new PutItemCommand(putParams));
            console.log(`✅ [Upload ${uploadId}] DynamoDB save successful (using base client).`);
            progressCallback(100);
            
            // In the PhotoUploader component, we already set visibility
            // But let's ensure we're setting it here as well
            try {
                console.log(`   Setting photo visibility to VISIBLE for user ${userId} and photo ${fileId}`);
                const { updatePhotoVisibility } = await import('./userVisibilityService');
                await updatePhotoVisibility(userId, [fileId], 'VISIBLE');
                console.log(`   ✅ Successfully set photo visibility to VISIBLE`);
            } catch (visibilityError) {
                console.error(`   ❌ Error setting photo visibility:`, visibilityError);
                // Continue even if this fails - the photo is still uploaded
            }

            console.log(`🎉 [Upload ${uploadId}] SUCCESS! Photo upload & indexing complete.`);
            console.log(`   Photo ID: ${fileId}`);
            console.log(`   S3 URL: ${publicUrl}`);
            console.log(`   Detected Faces Indexed: ${photoMetadata.face_ids.length}`);
            // Add more detailed logging about matched users
            if (photoMetadata.matched_users && photoMetadata.matched_users.length > 0) {
                console.log(`   Matched Users (${photoMetadata.matched_users.length}):`);
                photoMetadata.matched_users.forEach((match, idx) => {
                    console.log(`     [${idx+1}] User: ${match.userId}, Similarity: ${match.similarity}%, FaceId: ${match.faceId}`);
                });
            } else {
                console.log(`   No face matches found during upload.`);
            }

            // Apply again before final DynamoDB save to ensure consistency
            console.log('[PhotoService] Final consistency check for user ID fields before DynamoDB save');
            photoMetadata = ensureUserIdConsistency(photoMetadata);
            
            console.log(`[PhotoService] Photo assigned to user: ${photoMetadata.user_id} (uploaded_by: ${photoMetadata.uploaded_by})`);

            return {
                success: true,
                photoId: fileId,
                photoMetadata,
                s3Url: publicUrl, 
                externalId: fileId 
            };
        } catch (error) {
            console.error(`❌ [Upload ${uploadId}] Upload process failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    /**
     * Fetch photos WHERE THE CURRENT USER IS MATCHED from DynamoDB
     * @param {string} userId - The ID of the user viewing their matches
     * @returns {Promise<PhotoMetadata[]>} Array of photo metadata where the user is matched
     */
    fetchPhotos: async (userId) => {
        console.log(`📥 [PhotoService] Fetching matched photos for user: ${userId}`);
        if (!userId) {
            console.error('[PhotoService] Cannot fetch matched photos without userId');
            return [];
        }
        try {
            // 1. Get the user's registered face IDs first
            const faceData = await getFaceDataForUser(userId);
            const userFaceIds = faceData?.faceId ? [faceData.faceId] : [];
            console.log(`[PhotoService] User ${userId} has registered face IDs:`, userFaceIds);
            
            // 2. Scan all photos in the database
            console.log(`[PhotoService] Scanning ${PHOTOS_TABLE} to find matches for ${userId}...`);
            
            let allPhotos = [];
            let lastEvaluatedKey;
            
            do {
                const scanParams = {
                    TableName: PHOTOS_TABLE,
                    ExclusiveStartKey: lastEvaluatedKey
                };
                
                const response = await docClient.send(new ScanCommand(scanParams));
                
                if (!response.Items || response.Items.length === 0) {
                    console.log(`[PhotoService] No photos found in scan.`);
                    break;
                }
                
                allPhotos = [...allPhotos, ...response.Items];
                lastEvaluatedKey = response.LastEvaluatedKey;
                
            } while (lastEvaluatedKey);
            
            console.log(`[PhotoService] Scanned ${allPhotos.length} total photos.`);

            // 3. Filter for photos where this user is matched
            const matchedPhotos = allPhotos.filter(photo => {
                // a. Check direct matches in the matched_users array
                if (photo.matched_users) {
                    let matchedUsers = photo.matched_users;
                    
                    // Parse matched_users if it's a string
                    if (typeof matchedUsers === 'string') {
                        try { 
                            matchedUsers = JSON.parse(matchedUsers); 
                        } catch(e) { 
                            console.log(`[PhotoService] Invalid JSON in matched_users for photo ${photo.id}`);
                            return false;
                        }
                    }
                    
                    // Handle different data structures for matched_users
                    if (Array.isArray(matchedUsers)) {
                        for (const match of matchedUsers) {
                            // Check for matches in various formats
                            if (typeof match === 'string' && match === userId) {
                                console.log(`[PhotoService] Found match for user ${userId} in photo ${photo.id} - Reason: direct string match in matched_users`);
                                return true;
                            } else if (typeof match === 'object' && match !== null) {
                                const matchUserId = match.userId || match.user_id;
                                if (matchUserId === userId) {
                                    console.log(`[PhotoService] Found match for user ${userId} in photo ${photo.id} - Reason: direct object match in matched_users`);
                                    return true;
                                }
                            }
                        }
                    }
                }
                
                // b. Check historical matches from face data
                if (faceData && faceData.historicalMatches && Array.isArray(faceData.historicalMatches)) {
                    // Only match with items that have "photo" matchType or have valid image URLs
                    const validPhotoMatches = faceData.historicalMatches.filter(match => 
                        (match.matchType === 'photo' || match.imageUrl) && 
                        match.id === photo.id
                    );
                    
                    if (validPhotoMatches.length > 0) {
                        console.log(`[PhotoService] Found match for user ${userId} in photo ${photo.id} - Reason: historical match`);
                        return true;
                    }
                }
                
                return false;
            });
            
            console.log(`[PhotoService] Found ${matchedPhotos.length} potentially matched photos for user ${userId} (before visibility filter).`);
            
            // 4. Apply visibility filter
            const visibleMatchedPhotos = await filterPhotosByVisibility(userId, matchedPhotos, 'VISIBLE');
            
            // 5. Sort by creation date (newest first)
            const sortedVisiblePhotos = visibleMatchedPhotos.sort((a, b) => {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });
            
            console.log(`[PhotoService] Returning ${sortedVisiblePhotos.length} matched photos visible to user ${userId}.`);
            return sortedVisiblePhotos;
        } catch (error) {
            console.error('[PhotoService] Error fetching matched photos:', error);
            return [];
        }
    },
    /**
     * Get a photo by ID
     * @param {string} photoId - Photo ID
     * @returns {Promise<PhotoMetadata|null>} Photo metadata
     */
    getPhotoById: async (photoId) => {
        try {
            const getParams = {
                TableName: PHOTOS_TABLE,
                Key: {
                    id: photoId // No need to specify { S: photoId } with docClient
                }
            };
            const response = await docClient.send(new GetCommand(getParams));
            if (!response.Item) {
                return null;
            }
            return response.Item; // Item is already unmarshalled
        }
        catch (error) {
            console.error('Error getting photo:', error);
            return null;
        }
    },
    /**
     * Delete a photo from S3 and DynamoDB
     * @param {string} photoId - Photo ID
     * @returns {Promise<boolean>} Success status
     */
    deletePhoto: async (photoId) => {
        try {
            // First get the photo details to get the S3 path
            const photo = await awsPhotoService.getPhotoById(photoId);
            if (!photo) {
                return false;
            }
            // Delete from S3
            const deleteS3Params = {
                Bucket: PHOTO_BUCKET,
                Key: photo.storage_path
            };
            await s3Client.send(new DeleteObjectCommand(deleteS3Params));
            // Delete from DynamoDB using docClient
            const deleteDBParams = {
                TableName: PHOTOS_TABLE,
                Key: {
                    id: photoId // No need to specify { S: photoId } with docClient
                }
            };
            await docClient.send(new DeleteCommand(deleteDBParams));
            return true;
        }
        catch (error) {
            console.error('Error deleting photo:', error);
            return false;
        }
    },
    /**
     * Rename a folder
     * @param {string} oldPath - Old folder path
     * @param {string} newName - New folder name
     * @returns {Promise<boolean>} Success status
     */
    renameFolder: async (oldPath, newName) => {
        // This is more complex in S3 as it requires copying and deleting objects
        // For now, we'll just update the folder path in DynamoDB metadata
        try {
            // Scan for all photos with the old folder path using docClient
            const scanParams = {
                TableName: PHOTOS_TABLE,
                FilterExpression: 'begins_with(folder_path, :oldPath)',
                ExpressionAttributeValues: {
                    ':oldPath': oldPath // No need to specify { S: oldPath } with docClient
                }
            };
            const response = await docClient.send(new ScanCommand(scanParams));
            if (!response.Items || response.Items.length === 0) {
                return true; // No photos to update
            }
            // Update each photo's folder_path
            for (const photo of response.Items) {
                const newPath = photo.folder_path?.replace(oldPath, newName);
                // Update in DynamoDB using docClient
                await docClient.send(new PutCommand({
                    TableName: PHOTOS_TABLE,
                    Item: {
                        ...photo,
                        folder_path: newPath
                    }
                }));
            }
            return true;
        }
        catch (error) {
            console.error('Error renaming folder:', error);
            return false;
        }
    },
    /**
     * Fetch photos UPLOADED BY a specific user from DynamoDB
     * @param {string} userId - The ID of the user whose uploads to fetch
     * @returns {Promise<PhotoMetadata[]>} Array of photo metadata uploaded by the user
     */
    fetchUploadedPhotos: async (userId) => {
        console.log(`📥 [PhotoService] Fetching photos uploaded by user: ${userId}`);
        if (!userId) {
            console.error('[PhotoService] Cannot fetch uploaded photos without userId');
            return [];
        }
        try {
            // Query DynamoDB using the UserIdIndex GSI
            const queryParams = {
                TableName: PHOTOS_TABLE,
                IndexName: 'UserIdIndex', 
                KeyConditionExpression: 'user_id = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId 
                },
                ScanIndexForward: false // Optional: Sort by upload time descending
            };
            const response = await docClient.send(new QueryCommand(queryParams));
            
            const items = response.Items || [];
            console.log(`[PhotoService] Found ${items.length} photos uploaded by user ${userId} (before visibility filter).`);
            
            // Apply client-side filtering for visibility
            const visibleItems = await filterPhotosByVisibility(userId, items, 'VISIBLE');
            console.log(`[PhotoService] Returning ${visibleItems.length} visible photos uploaded by user ${userId}.`);

            return visibleItems; // Return only visible items
        } catch (error) {
            console.error('Error fetching uploaded photos:', error);
            return [];
        }
    },
    /**
     * Fetch photos filtered by visibility status
     * @param {string} userId - User ID
     * @param {string} type - Photo type ('uploaded', 'matched', or 'all')
     * @param {string} visibilityStatus - Visibility status ('VISIBLE', 'TRASH', 'HIDDEN')
     * @returns {Promise<Array>} Filtered photos
     */
    fetchPhotosByVisibility: async (userId, type = 'all', visibilityStatus = 'VISIBLE') => {
        console.log(`[awsPhotoService] fetchPhotosByVisibility called for user: ${userId}, type: ${type}, visibility: ${visibilityStatus}`);
        if (!userId) {
            console.error('[awsPhotoService] Cannot fetch photos without userId');
            return [];
        }
        try {
            // --- Refactored Logic --- 
            // Always Scan all potentially relevant items first, then filter client-side for visibility.
            // This is more reliable than DynamoDB FilterExpressions on nested maps, especially for TRASH/HIDDEN.
            
            let command;
            const params = {
                TableName: PHOTOS_TABLE,
                Limit: 100, // Limit items per page to reduce strain on DynamoDB
            };

            console.log(`[awsPhotoService] Determining base fetch command based on type: ${type}`);
            if (type === 'uploaded') {
                // More efficient Query if we only need photos uploaded by the user
                console.log(`[awsPhotoService] Using Query on UserIdIndex for uploaded photos.`);
                params.IndexName = 'UserIdIndex';
                params.KeyConditionExpression = 'user_id = :userId';
                params.ExpressionAttributeValues = { ':userId': userId };
                command = new QueryCommand(params);
            } else {
                // Scan needed for 'matched' or 'all' types, or if type is unknown.
                console.log(`[awsPhotoService] Using Scan for type '${type}'.`);
                command = new ScanCommand(params);
            }

            // Execute the command with pagination
            let allItems = [];
            let lastEvaluatedKey;
            console.log(`[awsPhotoService] Executing ${command.constructor.name}...`);
            
            let pageCount = 0;
            const MAX_PAGES = 20; // Safety limit to prevent infinite loops
            
            do {
                if (lastEvaluatedKey) {
                    params.ExclusiveStartKey = lastEvaluatedKey;
                }
                pageCount++;
                console.log(`[awsPhotoService] Fetching page ${pageCount} of items...`);
                
                const response = await docClient.send(command);
                const pageItems = response.Items || [];
                console.log(`[awsPhotoService] Page ${pageCount} returned ${pageItems.length} items`);
                
                allItems = allItems.concat(pageItems);
                lastEvaluatedKey = response.LastEvaluatedKey;
                
                if (lastEvaluatedKey) {
                    console.log(`[awsPhotoService] More items available, continuing with pagination (key: ${JSON.stringify(lastEvaluatedKey).substring(0, 50)}...)`);
                }
                
                // Safety check to prevent infinite loops
                if (pageCount >= MAX_PAGES) {
                    console.warn(`[awsPhotoService] Reached maximum page limit (${MAX_PAGES}). Breaking to prevent infinite loop.`);
                    break;
                }
            } while (lastEvaluatedKey);
            
            console.log(`[awsPhotoService] Fetched ${allItems.length} total items before any filtering.`);

            // Filter based on type ('matched') if needed, ONLY if we did a full Scan initially
            let typeFilteredItems = allItems;
            if (command instanceof ScanCommand && type === 'matched') {
                console.log(`[awsPhotoService] Performing client-side filtering for type 'matched'.`);
                const faceData = await getFaceDataForUser(userId);
                const userFaceIds = faceData ? [faceData.faceId] : [];
                
                typeFilteredItems = allItems.filter(item => {
                    // Check direct match in matched_users
                    if (item.matched_users) {
                         let matchedUsers = item.matched_users;
                        if (typeof matchedUsers === 'string') try { matchedUsers = JSON.parse(matchedUsers); } catch(e){ console.error(`Error parsing matched_users for photo ${item.id}`, e); }
                        if (Array.isArray(matchedUsers)) {
                            if (matchedUsers.some(match => (typeof match === 'string' && match === userId) || (typeof match === 'object' && match !== null && (match.userId || match.user_id) === userId))) {
                                return true; 
                            }
                        }
                    }
                    // Check reverse face match
                    if (userFaceIds.length > 0 && item.faces) {
                        let faces = item.faces;
                        if (Array.isArray(faces)) {
                            if (faces.some(face => face && userFaceIds.includes(typeof face === 'object' ? face.faceId : face))) {
                                return true;
                            }
                        }
                    }
                     // Check historical match
                     if (faceData && faceData.historicalMatches && Array.isArray(faceData.historicalMatches)) {
                        if (faceData.historicalMatches.some(match => match.id === item.id)) {
                            return true;
                        }
                    }
                    return false; // Not a match
                });
                 console.log(`[awsPhotoService] Found ${typeFilteredItems.length} photos after filtering for type: ${type}.`);
            } else {
                 console.log(`[awsPhotoService] Skipping type filtering as command was ${command.constructor.name} or type was not 'matched'.`);
            }

            // Final filtering based on the desired visibility status
            console.log(`[awsPhotoService] Performing final client-side filtering for status: ${visibilityStatus}`);
            console.log(`[awsPhotoService] Getting visibility map for user: ${userId}`);
            
            // Get visibility map directly before filtering
            const { visibilityMap, success } = await getPhotoVisibilityMap(userId);
            if (!success) {
                console.error(`[awsPhotoService] Failed to get visibility map for user ${userId}`);
                return [];
            }
            
            console.log(`[awsPhotoService] Visibility map contains ${Object.keys(visibilityMap).length} entries`);
            
            if (visibilityStatus === 'TRASH') {
                // Debug: log all trash items in the visibility map
                const trashItems = Object.entries(visibilityMap)
                    .filter(([_, status]) => status === 'TRASH')
                    .map(([photoId]) => photoId);
                console.log(`[awsPhotoService] Visibility map has ${trashItems.length} items with TRASH status: ${JSON.stringify(trashItems)}`);
            }
            
            const finalFilteredPhotos = await filterPhotosByVisibility(userId, typeFilteredItems, visibilityStatus);
            console.log(`[awsPhotoService] Returning ${finalFilteredPhotos.length} photos after final visibility filtering for status: ${visibilityStatus}`);
            
            if (finalFilteredPhotos.length > 0) {
                console.log(`[awsPhotoService] Sample photo IDs in results: ${finalFilteredPhotos.slice(0, 3).map(p => p.id).join(', ')}${finalFilteredPhotos.length > 3 ? '...' : ''}`);
            } else {
                console.log(`[awsPhotoService] No photos found with visibility status: ${visibilityStatus}`);
            }

            return finalFilteredPhotos;
        } catch (error) {
            console.error(`[awsPhotoService] Error in fetchPhotosByVisibility (user: ${userId}, type: ${type}, status: ${visibilityStatus}):`, error);
            return [];
        }
    },
    /**
     * Get visible photos (default view)
     * @param {string} userId - User ID
     * @param {string} type - Photo type
     * @returns {Promise<Array>} Visible photos
     */
    getVisiblePhotos: async (userId, type = 'all') => {
        console.log(`[awsPhotoService] getVisiblePhotos called for user: ${userId}, type: ${type}`);
        try {
            if (type === 'trashed') {
                // Directly fetch photos with TRASH visibility status
                return await awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'TRASH');
            } else if (type === 'uploaded') {
                // Use the new fetchUploadedPhotosOnly method instead
                return await awsPhotoService.fetchUploadedPhotosOnly(userId);
            } else if (type === 'matched') {
                // fetchPhotos already returns VISIBLE, sorted matched photos
                return await awsPhotoService.fetchPhotos(userId);
            } else { // type === 'all'
                // Fetch both (they are already filtered for VISIBLE and sorted)
                const [uploaded, matched] = await Promise.all([
                    awsPhotoService.fetchUploadedPhotosOnly(userId),
                    awsPhotoService.fetchPhotos(userId)
                ]);
                
                // Combine and de-duplicate
                const allVisiblePhotosMap = new Map();
                uploaded.forEach(p => allVisiblePhotosMap.set(p.id, p));
                matched.forEach(p => allVisiblePhotosMap.set(p.id, p)); // Overwrites duplicates from uploaded if any
                
                const combinedPhotos = Array.from(allVisiblePhotosMap.values());
                
                // Re-sort the combined list by date
                const sortedCombined = combinedPhotos.sort((a, b) => 
                    new Date(b.created_at || 0) - new Date(a.created_at || 0)
                );
                console.log(`[awsPhotoService] Returning ${sortedCombined.length} combined visible photos for type 'all'.`);
                return sortedCombined;
            }
        } catch (error) {
             console.error(`[awsPhotoService] Error in getVisiblePhotos for type '${type}':`, error);
             return []; // Return empty array on error
        }
    },
    /**
     * Get photos in trash bin
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Trashed photos
     */
    getTrashedPhotos: async (userId) => {
        console.log(`[awsPhotoService] getTrashedPhotos called for user: ${userId}`);
        if (!userId) {
            console.error('[awsPhotoService] Cannot fetch trashed photos without userId');
            return [];
        }
        
        try {
            // Step 1: Get the visibility map to find photos with TRASH status
            const { getPhotoVisibilityMap } = await import('./userVisibilityService');
            const { visibilityMap, success } = await getPhotoVisibilityMap(userId);
            
            if (!success) {
                console.error('[awsPhotoService] Failed to get visibility map');
                return [];
            }
            
            // Step 2: Filter for TRASH items
            const trashItemIds = Object.entries(visibilityMap)
                .filter(([_, status]) => status === 'TRASH')
                .map(([photoId]) => photoId);
            
            console.log(`[awsPhotoService] Found ${trashItemIds.length} items with TRASH status in visibility map`);
            
            if (trashItemIds.length === 0) {
                console.log('[awsPhotoService] No trash items found, returning empty array');
                return [];
            }
            
            // Step 3: Directly fetch the photos using their IDs
            let allPhotos = [];
            
            // Process in batches of 10 for better performance
            for (let i = 0; i < trashItemIds.length; i += 10) {
                const batch = trashItemIds.slice(i, i + 10);
                console.log(`[awsPhotoService] Fetching batch ${Math.floor(i/10) + 1} of ${Math.ceil(trashItemIds.length/10)}`);
                
                const photoPromises = batch.map(photoId => 
                    awsPhotoService.getPhotoById(photoId)
                );
                
                const batchResults = await Promise.all(photoPromises);
                const validPhotos = batchResults.filter(Boolean); // Remove null results
                allPhotos = [...allPhotos, ...validPhotos];
            }
            
            console.log(`[awsPhotoService] Successfully fetched ${allPhotos.length} trashed photos`);
            return allPhotos;
        } catch (error) {
            console.error('[awsPhotoService] Error in getTrashedPhotos:', error);
            return [];
        }
    },
    /**
     * Get permanently hidden photos
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Hidden photos
     */
    getHiddenPhotos: async (userId) => {
        return awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'HIDDEN');
    },
    /**
     * Get user's storage usage
     * @param {string} userId - The user ID
     * @returns {Promise<object>} - Result object with total_size in bytes
     */
    getUserStorageUsage: async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/users/${userId}/storage`);
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error getting storage usage:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get storage usage'
            };
        }
    },
    /**
     * Move a photo to trash (soft delete)
     * @param {string} photoId - The photo ID to trash
     * @returns {Promise<object>} - Result object with success and optional error
     */
    trashPhoto: async (photoId) => {
        try {
            const response = await axios.post(`${API_URL}/photos/${photoId}/trash`);
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Error moving photo to trash:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to move photo to trash'
            };
        }
    },
    /**
     * Restore a photo from trash
     * @param {string} photoId - The photo ID to restore
     * @returns {Promise<object>} - Result object with success and optional error
     */
    restorePhoto: async (photoId) => {
        try {
            const response = await axios.post(`${API_URL}/photos/${photoId}/restore`);
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Error restoring photo from trash:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to restore photo'
            };
        }
    },
    /**
     * Permanently delete a photo
     * @param {string} photoId - The photo ID to delete
     * @returns {Promise<object>} - Result object with success and optional error
     */
    deletePhoto: async (photoId) => {
        try {
            const response = await axios.delete(`${API_URL}/photos/${photoId}`);
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Error deleting photo:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete photo'
            };
        }
    },
    /**
     * Moves a photo to trash for a specific user
     * @param {string} photoId - The ID of the photo to move to trash
     * @returns {Promise<{success: boolean, error?: string}>} Result of the operation
     */
    moveToTrash: async (photoId) => {
        try {
            // We'll use the existing trashPhoto method which already implements this functionality
            return await awsPhotoService.trashPhoto(photoId);
        } catch (error) {
            console.error("Error moving photo to trash:", error);
            return { 
                success: false, 
                error: error.message || "Failed to move photo to trash" 
            };
        }
    },
    /**
     * Fetch only user's uploaded photos
     * @param {string} userId - The ID of the user whose uploads to fetch
     * @returns {Promise<PhotoMetadata[]>} Array of photo metadata uploaded by the user
     */
    fetchUploadedPhotosOnly: async (userId) => {
        console.log(`📥 [PhotoService] Fetching only photos uploaded by user: ${userId}`);
        if (!userId) {
            console.error('[PhotoService] Cannot fetch uploaded photos without userId');
            return [];
        }
        try {
            // When querying for uploaded photos, check both user_id and uploaded_by fields
            console.log(`📥 [PhotoService] Fetching only photos uploaded by user: ${userId}`);
            
            const filterExpressions = [];
            const expressionAttributeValues = {};
            
            // Check for user_id match
            filterExpressions.push('user_id = :userId');
            expressionAttributeValues[':userId'] = userId;
            
            // Check for uploaded_by match (as a fallback)
            filterExpressions.push('uploaded_by = :uploadedBy');
            expressionAttributeValues[':uploadedBy'] = userId;
            
            // Create filter expression with OR condition
            const filterExpression = filterExpressions.join(' OR ');
            
            console.log(`[PhotoService] Using filter expression: ${filterExpression}`);
            
            const params = {
                TableName: PHOTOS_TABLE,
                FilterExpression: filterExpression,
                ExpressionAttributeValues: expressionAttributeValues
            };
            
            try {
                const scanResults = [];
                let items;
                
                do {
                    items = await docClient.send(new ScanCommand(params));
                    items.Items.forEach((item) => scanResults.push(item));
                    params.ExclusiveStartKey = items.LastEvaluatedKey;
                } while (typeof items.LastEvaluatedKey !== 'undefined');
                
                console.log(`[PhotoService] Found ${scanResults.length} photos uploaded by user ${userId}.`);
                
                // Apply visibility filter
                const visibleUploadedPhotos = await filterPhotosByVisibility(userId, scanResults, 'VISIBLE');
                
                // Sort by creation date (newest first)
                const sortedVisiblePhotos = visibleUploadedPhotos.sort((a, b) => {
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                });
                
                console.log(`[PhotoService] Returning ${sortedVisiblePhotos.length} visible uploaded photos for user ${userId}.`);
                return sortedVisiblePhotos;
            } catch (error) {
                console.error('[PhotoService] Error fetching uploaded photos:', error);
                return [];
            }
        } catch (error) {
            console.error('[PhotoService] Error fetching uploaded photos:', error);
            return [];
        }
    }
};
export default awsPhotoService;
