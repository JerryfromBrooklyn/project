import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, docClient, rekognitionClient, PHOTO_BUCKET, PHOTOS_TABLE, COLLECTION_ID, AWS_REGION, FACE_DATA_BUCKET } from '../lib/awsClient';
import { IndexFacesCommand, CompareFacesCommand, SearchFacesCommand } from '@aws-sdk/client-rekognition';
import { getFaceDataForUser } from './FaceStorageService';
import { marshall } from '@aws-sdk/util-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
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
    uploadPhoto: async (file, eventId, folderPath, metadata = {}, progressCallback = () => { }) => {
        const uploadId = uuidv4().substring(0, 8);
        let rekognitionCallCount = 0; // Initialize Rekognition call counter
        console.groupCollapsed(`📸 [Upload ${uploadId}] Starting upload for: ${file.name}`);
        console.log(`   File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Target Folder: ${folderPath || 'root'}`);
        console.log(`   Event ID: ${eventId || 'N/A'}`);
        console.log(`   Provided Metadata:`, metadata);
        console.groupEnd();

        try {
            const fileId = uuidv4();
            const fileName = `${fileId}-${file.name}`;
            const userId = metadata.uploadedBy || metadata.uploaded_by;
            const path = folderPath
                ? `photos/${userId}/${folderPath}/${fileName}` // Standardized photos path
                : `photos/${userId}/${fileName}`;
            
            console.log(`🔄 [Upload ${uploadId}] Generated Photo ID: ${fileId}`);
            console.log(`🔄 [Upload ${uploadId}] S3 Storage Path: ${path}`);
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

            const photoMetadata = {
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
                description: metadata.description || ''
            };
            console.log(`📝 [Upload ${uploadId}] Prepared initial metadata for DynamoDB.`);
            progressCallback(60);

            // --- Rekognition Face Indexing & Comparison --- 
            console.groupCollapsed(`�� [Upload ${uploadId}] Running Rekognition Face Indexing & Comparison...`);
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
                rekognitionCallCount++; 
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
                                FaceId: detectedFaceId,  // Search with the detected face ID
                                MaxFaces: 10, 
                                FaceMatchThreshold: 70.0, // Reduced from 90.0 to allow more potential matches
                            };
                            
                            console.log(`      Using SearchFaces to find matches for the detected face instead of direct comparison`);
                            console.log(`      This avoids CORS errors and S3 permission issues`);
                            
                            rekognitionCallCount++;
                            const searchResponse = await rekognitionClient.send(new SearchFacesCommand(searchParams));
                            
                            if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                                let uploaderFound = false;
                                
                                // Log all matches and their similarity scores for debugging
                                console.log(`      Found ${searchResponse.FaceMatches.length} face matches:`);
                                searchResponse.FaceMatches.forEach((match, idx) => {
                                  console.log(`        Match #${idx+1}: Face ID: ${match.Face.FaceId}, External ID: ${match.Face.ExternalImageId}, Similarity: ${match.Similarity.toFixed(2)}%`);
                                });
                                
                                for (const match of searchResponse.FaceMatches) {
                                    const matchedExternalId = match.Face.ExternalImageId;
                                    const matchedFaceId = match.Face.FaceId;
                                    let similarity = match.Similarity;
                                    
                                    // Skip exact self-matches (same face ID with 100% similarity or matching photo ID)
                                    if ((matchedFaceId === detectedFaceId || `photo_${fileId}` === matchedExternalId) && similarity >= 99.9) {
                                        console.log(`      ⚠️ Skipping self-match: FaceId=${matchedFaceId}, ExternalId=${matchedExternalId}`);
                                        continue;
                                    }

                                    // We're looking for a match with the user's registered face ID, not the ExternalImageId
                                    if (matchedFaceId === registeredFaceId) {
                                        console.log(`      ✅ Uploader face match found! Similarity: ${similarity.toFixed(2)}%`);
                                        
                                        // Skip suspiciously perfect matches 
                                        if (similarity === 100) {
                                            console.log(`      ⚠️ Skipping suspicious perfect 100% match with uploader`);
                                            continue;
                                        }
                                        
                                        // More permissive threshold for user recognition (70%)
                                        if (similarity >= 70) {
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
                                }
                                
                                if (!uploaderFound) {
                                    console.log(`      ❌ Uploader face not found among matches.`);
                                }
                            } else {
                                console.log(`      ❌ No matches found for the detected face.`);
                            }
                        } catch (compareError) {
                            console.error(`      ⚠️ Error comparing faces:`, compareError);
                            // Continue with the upload even if face comparison fails
                        }
                    } else {
                        console.log(`   Uploader ${userId} is not registered, skipping comparison.`);
                    }
                } // end if(detectedFaceId)

                // If faces were detected, check if they match any registered users
                if (photoMetadata.face_ids && photoMetadata.face_ids.length > 0) {
                    console.log(`   🔄 Checking if detected faces match any registered users...`);
                    
                    // Get all registered user face IDs from shmong-face-data table
                    for (const detectedFaceId of photoMetadata.face_ids) {
                        try {
                            // Search for this face ID in our face collection
                            const searchParams = {
                                CollectionId: COLLECTION_ID,
                                FaceId: detectedFaceId,
                                MaxFaces: 10,
                                FaceMatchThreshold: 80.0  // Using 80% threshold for matching against other users
                            };
                            
                            const searchResponse = await rekognitionClient.send(new SearchFacesCommand(searchParams));
                            
                            if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                                console.log(`   ✅ Found ${searchResponse.FaceMatches.length} potential matching users for face ${detectedFaceId}`);
                                console.log(`   Similarity score breakdown:`);
                                searchResponse.FaceMatches.forEach((match, idx) => {
                                  console.log(`      Match #${idx+1}: ID: ${match.Face.ExternalImageId}, Similarity: ${match.Similarity.toFixed(2)}%`);
                                });
                                
                                // Process each match
                                for (const match of searchResponse.FaceMatches) {
                                    const matchedExternalId = match.Face.ExternalImageId;
                                    const matchedFaceId = match.Face.FaceId;
                                    let similarity = match.Similarity;
                                    
                                    // Skip exact self-matches (same face ID with 100% similarity or matching photo ID)
                                    if ((matchedFaceId === detectedFaceId || `photo_${fileId}` === matchedExternalId) && similarity >= 99.9) {
                                        console.log(`      ⚠️ Skipping self-match: FaceId=${matchedFaceId}, ExternalId=${matchedExternalId}`);
                                        continue;
                                    }
                                    
                                    // Skip matches with user registration faces (they have user_ prefix)
                                    if (matchedExternalId && matchedExternalId.startsWith('user_')) {
                                        console.log(`      ⚠️ Skipping match with user registration face: ${matchedExternalId}`);
                                        continue;
                                    }
                                    
                                    // Reject suspicious 100% matches as these are likely duplicates or errors
                                    if (similarity === 100) {
                                        console.log(`      ⚠️ Rejecting suspicious perfect 100% match for ID: ${matchedExternalId}`);
                                        continue;
                                    }
                                    
                                    // If the external ID looks like a UUID, it's likely a user ID (not a photo ID)
                                    if (matchedExternalId && matchedExternalId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                                        // Verify this is a real user ID, not a photo ID
                                        // We need to check if this ID exists in our known user database
                                        // Known photo IDs shouldn't be treated as users

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
                                            if (similarity < 80) {
                                                console.log(`      ⚠️ Skipping match with ${actualUserId} due to low similarity (${similarity.toFixed(2)}%)`);
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
                                            console.log(`      ℹ️ Matched with photo: ${matchedExternalId}`);
                                            continue;
                                        }
                                    }
                                }
                            } else {
                                console.log(`   ℹ️ No matching users found for face ${detectedFaceId}`);
                            }
                        } catch (searchError) {
                            console.error(`   ❌ Error searching for matching faces:`, searchError);
                            // Continue processing other faces
                        }
                    }
                }

            } catch (rekognitionError) { 
                console.error(`   ❌ Rekognition IndexFaces failed:`, rekognitionError);
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
            
            console.log(`🎉 [Upload ${uploadId}] SUCCESS! Photo upload & indexing complete.`);
            console.log(`   Photo ID: ${fileId}`);
            console.log(`   S3 URL: ${publicUrl}`);
            console.log(`   Detected Faces Indexed: ${photoMetadata.face_ids.length}`);
            // Matched users is now 0 because we don't do it here
            console.log(`   Matched Users (During Upload): ${photoMetadata.matched_users.length}`); 
            console.log(`   📞 AWS Rekognition Calls Made: ${rekognitionCallCount}`);

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
            const userFaceIds = faceData ? [faceData.faceId] : [];
            
            console.log(`[PhotoService] User ${userId} has registered face IDs:`, userFaceIds);
            
            // 2. Scan the table to find all photos
            console.log(`[PhotoService] Scanning ${PHOTOS_TABLE} to find matches for ${userId}...`);
            const scanCommand = new ScanCommand({ TableName: PHOTOS_TABLE });
            const response = await docClient.send(scanCommand);

            if (!response.Items || response.Items.length === 0) {
                console.log(`[PhotoService] No photos found in scan.`);
                return [];
            }

            console.log(`[PhotoService] Scanned ${response.Items.length} total photos.`);
            
            // 3. Find matches in two ways:
            // a) Photos where the user ID is in matched_users (direct)
            // b) Photos where the user's face matches (reverse)
            const matchedPhotos = [];
            
            for (const photo of response.Items) {
                let isMatch = false;
                let matchReason = '';
                
                // Case 1: Check if this photo has current user in matched_users
                if (photo.matched_users) {
                    let matchedUsers = photo.matched_users;
                    if (typeof matchedUsers === 'string') {
                        try {
                            matchedUsers = JSON.parse(matchedUsers);
                        } catch (e) {
                            console.log(`[PhotoService] Invalid JSON in matched_users for photo ${photo.id}`);
                        }
                    }
                    
                    if (Array.isArray(matchedUsers)) {
                        // Check for matches in different formats
                        for (const match of matchedUsers) {
                            // Direct string match
                            if (typeof match === 'string' && match === userId) {
                                isMatch = true;
                                matchReason = 'string-match';
                                break;
                            }
                            
                            // Object match with userId field
                            if (typeof match === 'object' && match !== null) {
                                const matchUserId = match.userId || match.user_id || '';
                                if (matchUserId === userId) {
                                    isMatch = true;
                                    matchReason = 'object-userId-match';
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Case 3: Check for reverse matches - if photo contains faces that match user's face IDs
                if (!isMatch && userFaceIds.length > 0 && photo.faces) {
                    let faces = photo.faces;
                    
                    // If matches exist and photo's face is in our list
                    if (Array.isArray(faces)) {
                        for (const face of faces) {
                            const faceId = typeof face === 'object' ? face.faceId : face;
                            if (faceId && userFaceIds.includes(faceId)) {
                                isMatch = true;
                                matchReason = 'face-match';
                                break;
                            }
                        }
                    }
                }
                
                // Case 4: Check if matched through historical matches in your face data
                if (!isMatch && faceData && faceData.historicalMatches && Array.isArray(faceData.historicalMatches)) {
                    const matchingHistorical = faceData.historicalMatches.find(match => match.id === photo.id);
                    if (matchingHistorical) {
                        isMatch = true;
                        matchReason = 'historical-match';
                    }
                }
                
                if (isMatch) {
                    console.log(`[PhotoService] Found match for user ${userId} in photo ${photo.id} - Reason: ${matchReason}`);
                    matchedPhotos.push(photo);
                }
            }
            
            console.log(`[PhotoService] Found ${matchedPhotos.length} matched photos for user ${userId}.`);
            return matchedPhotos;
        } catch (error) {
            console.error('Error fetching matched photos:', error);
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
            
            console.log(`[PhotoService] Found ${response.Items?.length || 0} photos uploaded by user ${userId}.`);
            return response.Items || [];
        } catch (error) {
            console.error('Error fetching uploaded photos:', error);
            return [];
        }
    }
};
export default awsPhotoService;
