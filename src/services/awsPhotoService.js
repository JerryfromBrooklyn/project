import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, docClient, rekognitionClient, PHOTO_BUCKET, PHOTOS_TABLE, COLLECTION_ID, AWS_REGION } from '../lib/awsClient';
import { IndexFacesCommand, SearchFacesCommand } from '@aws-sdk/client-rekognition';
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
                faces: [], // Will be populated after Rekognition
                matched_users: [], // Will be populated after Rekognition
                face_ids: [], // Will be populated after Rekognition
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

            // --- Rekognition Face Detection & Indexing --- 
            console.groupCollapsed(`🧠 [Upload ${uploadId}] Running Rekognition...`);
            console.log(`   Entering Rekognition processing block...`); 
            try {
                // Use the globally imported client
                console.log(`   Using global Rekognition Client: ${!!rekognitionClient}`); 
                console.log(`   IndexFacesCommand available: ${!!IndexFacesCommand}`); // Verify command exists
                console.log(`   Action: Indexing faces using image bytes`); // Log new action
                
                // Ensure fileBuffer is available from the S3 upload part
                if (!fileArrayBuffer) {
                    throw new Error("File buffer is missing, cannot send bytes to Rekognition.");
                }

                const indexParams = {
                    CollectionId: COLLECTION_ID || 'shmong-faces',
                    Image: {
                        Bytes: fileUint8Array // *** Use Uint8Array for Rekognition ***
                    },
                    ExternalImageId: fileId, 
                    MaxFaces: 10
                };
                // Note: Logging the full buffer in params will flood the console, so skip it.
                console.log(`   IndexFaces Params Prepared (Bytes omitted for brevity):`, { ...indexParams, Image: { Bytes: `Uint8Array length: ${fileUint8Array.byteLength}` } }); 
                console.log(`   Sending IndexFaces command with image bytes...`);
                const indexResponse = await rekognitionClient.send(new IndexFacesCommand(indexParams)); // Use global client
                console.log(`   Rekognition IndexFaces response received successfully.`);
                
                if (indexResponse.FaceRecords && indexResponse.FaceRecords.length > 0) {
                   console.log(`   ✅ Detected ${indexResponse.FaceRecords.length} faces.`);
                    photoMetadata.faces = indexResponse.FaceRecords.map(record => {
                        console.groupCollapsed(`      👤 Face ID: ${record.Face.FaceId}`);
                        console.log(`         Confidence: ${record.Face.Confidence?.toFixed(2)}%`);
                        console.log(`         Bounding Box:`, record.Face.BoundingBox);
                        console.log(`         Attributes:`, record.FaceDetail);
                        console.groupEnd();
                        return {
                            faceId: record.Face.FaceId,
                            boundingBox: record.Face.BoundingBox,
                            confidence: record.Face.Confidence,
                            attributes: record.FaceDetail
                        };
                    });
                    photoMetadata.face_ids = indexResponse.FaceRecords.map(r => r.Face.FaceId);
                    
                    // --- Future Matching --- 
                    console.groupCollapsed(`   🔄 Searching for matches against registered users...`);
                    for (const faceRecord of indexResponse.FaceRecords) {
                        const detectedFaceId = faceRecord.Face.FaceId;
                        console.log(`      Searching for matches for detected Face ID: ${detectedFaceId}`);
                        try {
                            const searchParams = {
                                CollectionId: COLLECTION_ID || 'shmong-faces', 
                                FaceId: detectedFaceId,
                                MaxFaces: 5, 
                                FaceMatchThreshold: 85 
                            };
                            const searchResponse = await rekognitionClient.send(new SearchFacesCommand(searchParams));
                            
                            if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                                console.log(`      ✅ Found ${searchResponse.FaceMatches.length} potential user matches.`);
                                for (const match of searchResponse.FaceMatches) {
                                    const matchedUserId = match.Face.ExternalImageId;
                                    const matchedFaceId = match.Face.FaceId;
                                    const similarity = match.Similarity;
                                    
                                    if (matchedFaceId === detectedFaceId) continue; 
                                    
                                    if (!photoMetadata.matched_users.some(u => u.userId === matchedUserId)) {
                                        console.log(`         -> Matched User ID: ${matchedUserId} (Similarity: ${similarity.toFixed(2)}%)`);
                                        photoMetadata.matched_users.push({
                                            userId: matchedUserId,
                                            faceId: matchedFaceId, 
                                            similarity: similarity
                                        });
                                    }
                                }
                            } else {
                                console.log(`      ❌ No registered users matched this detected face.`);
                            }
                        } catch (searchError) {
                            console.error(`      ⚠️ Error searching for matches for Face ID ${detectedFaceId}:`, searchError);
                        }
                    }
                    console.groupEnd(); 
                    
                } else {
                    console.log(`   ⚠️ No faces detected/indexed in the photo.`);
                }
                // --- End of IndexFaces Code ---

            } catch (rekognitionError) {
                console.error(`   ❌ Rekognition processing failed inside the 'try' block:`);
                console.error('Full Error Object:', rekognitionError);
                if (rekognitionError.name) console.error(`      Error Name: ${rekognitionError.name}`);
                if (rekognitionError.message) console.error(`      Error Message: ${rekognitionError.message}`);
                if (rekognitionError.$metadata) console.error(`      Error Metadata:`, rekognitionError.$metadata);
            }
            console.groupEnd(); // End Rekognition group
            progressCallback(90);

            console.log(`💾 [Upload ${uploadId}] Saving final metadata to DynamoDB Table: ${PHOTOS_TABLE}`);
            const putParams = {
                TableName: PHOTOS_TABLE,
                Item: photoMetadata 
            };
            await docClient.send(new PutCommand(putParams));
            console.log(`✅ [Upload ${uploadId}] DynamoDB save successful.`);
            progressCallback(100);
            
            console.log(`🎉 [Upload ${uploadId}] SUCCESS! Photo upload and processing complete.`);
            console.log(`   Photo ID: ${fileId}`);
            console.log(`   S3 URL: ${publicUrl}`);
            console.log(`   Detected Faces: ${photoMetadata.faces.length}`);
            console.log(`   Matched Users: ${photoMetadata.matched_users.length}`);

            return {
                success: true,
                photoId: fileId,
                photoMetadata,
                s3Url: publicUrl, // Add S3 URL to the final result
                externalId: fileId // Add External ID (photo ID) to the final result
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
     * Fetch photos for a user from DynamoDB
     * @param {string} userId - User ID
     * @returns {Promise<PhotoMetadata[]>} Array of photo metadata
     */
    fetchPhotos: async (userId) => {
        try {
            // Query DynamoDB for user's photos using docClient
            const queryParams = {
                TableName: PHOTOS_TABLE,
                IndexName: 'UserIdIndex', // Using the GSI we confirmed exists
                KeyConditionExpression: 'user_id = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId // No need to specify { S: userId } with docClient
                }
            };
            const response = await docClient.send(new QueryCommand(queryParams));
            if (!response.Items || response.Items.length === 0) {
                return [];
            }
            // Items are already unmarshalled with docClient
            return response.Items;
        }
        catch (error) {
            console.error('Error fetching photos:', error);
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
    }
};
export default awsPhotoService;
