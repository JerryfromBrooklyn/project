import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, docClient, rekognitionClient, PHOTO_BUCKET, PHOTOS_TABLE, COLLECTION_ID, AWS_REGION, FACE_DATA_BUCKET } from '../lib/awsClient';
import { IndexFacesCommand, CompareFacesCommand, SearchFacesCommand, SearchFacesByImageCommand, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
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
    // Cache for matched photos to avoid repeated scans
    matchedPhotosCache: new Map(),
    /**
     * Upload a photo with metadata to S3 and DynamoDB
     * @param {File} file - The file to upload
     * @param {Object} metadata - Additional metadata like event details
     * @param {Function} progressCallback - Callback for upload progress
     * @param {boolean} analyzeWithAI - Whether to analyze the photo with AI
     * @returns {Promise<Object>} The uploaded photo data
     */
    uploadPhoto: async (file, eventId, folderPath, metadata = {}, progressCallback = (progress) => {}) => {
        try {
            // Generate a unique ID for this upload operation for better log tracking
            const uploadId = Math.random().toString(36).substring(2, 8);
            console.log(`🚀 [Upload ${uploadId}] Starting upload for ${file.name}`);
            
            // IMPROVED EVENT DATA DEBUGGING
            console.log(`📋 [Upload ${uploadId}] EVENT DATA RECEIVED:`, {
                // Flat properties
                eventName: metadata?.eventName,
                venueName: metadata?.venueName,
                promoterName: metadata?.promoterName,
                date: metadata?.date,
                
                // Nested structures
                eventDetailsName: metadata?.event_details?.name,
                venueDetailsName: metadata?.venue?.name,
                eventDetailsPromoter: metadata?.event_details?.promoter,
                eventDetailsDate: metadata?.event_details?.date
            });
            
            // Initialize progress callback
            progressCallback(10);
            
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
            let allDetectedFaces = []; // Store details for all detected faces
            try {
                console.log(`   Using global Rekognition Client: ${!!rekognitionClient}`); 
                console.log(`   IndexFacesCommand available: ${!!IndexFacesCommand}`); 
                console.log(`   Action: Indexing faces from image bytes`); 
                
                if (!fileUint8Array) {
                    throw new Error("File buffer (Uint8Array) is missing");
                }

                // 1. Index the face(s) in the uploaded image to get face details
                const indexParams = {
                    CollectionId: COLLECTION_ID || 'shmong-faces',
                    Image: {
                        Bytes: fileUint8Array,
                    },
                    DetectionAttributes: ["ALL"], // Request ALL attributes
                    ExternalImageId: `photo_${fileId}`, // Tag indexed face(s) with photo ID
                    MaxFaces: 10, // Index up to 10 faces
                    QualityFilter: "AUTO"
                };
                
                console.log(`   Executing IndexFacesCommand with ExternalImageId: ${indexParams.ExternalImageId}, MaxFaces: ${indexParams.MaxFaces}`);
                const indexFacesCommand = new IndexFacesCommand(indexParams);
                const indexFacesResponse = await rekognitionClient.send(indexFacesCommand);
                console.log(`   IndexFacesCommand Response: ${indexFacesResponse ? 'Success' : 'Undefined'}`);
                
                if (indexFacesResponse && indexFacesResponse.FaceRecords && indexFacesResponse.FaceRecords.length > 0) {
                    console.log(`   ✅ Successfully indexed ${indexFacesResponse.FaceRecords.length} face(s)`);
                    allDetectedFaces = indexFacesResponse.FaceRecords.map(record => ({ 
                            faceId: record.Face.FaceId,
                            boundingBox: record.Face.BoundingBox,
                       confidence: record.Face.Confidence,
                       attributes: record.FaceDetail 
                    }));
                    photoMetadata.faces = allDetectedFaces; 
                    photoMetadata.face_ids = allDetectedFaces.map(f => f.faceId);
                    console.log(`   ✏️ DATABASE WRITE: Storing ${allDetectedFaces.length} faces in metadata. Face IDs: ${photoMetadata.face_ids.join(', ')}`);
                } else {
                    console.log(`   ⚠️ No faces indexed in the image.`);
                    photoMetadata.faces = [];
                    photoMetadata.face_ids = [];
                }

                // 2. CORRECTED APPROACH: Search for matches using SearchFacesByImageCommand
                console.log(`   Finding user face matches using SearchFacesByImageCommand...`);
                photoMetadata.matched_users = []; // Reset matches array
                const uniqueMatchedUserIds = new Set(); // Track added user IDs to avoid duplicates

                // IMPORTANT: According to docs section 3.2, we need to search by image, not by FaceID
                const searchByImageParams = {
                    CollectionId: COLLECTION_ID || 'shmong-faces',
                    Image: {
                        Bytes: fileUint8Array
                    },
                    MaxFaces: 1000, // Set to high value to get all possible matches (doc says 89+ expected)
                    FaceMatchThreshold: 80 // Lower threshold to 80% to get more potential matches
                };
                
                console.log(`   Executing SearchFacesByImageCommand (Threshold: ${searchByImageParams.FaceMatchThreshold}%, MaxFaces: ${searchByImageParams.MaxFaces})`);
                const searchByImageCommand = new SearchFacesByImageCommand(searchByImageParams);
                const searchByImageResponse = await rekognitionClient.send(searchByImageCommand);
                
                if (searchByImageResponse.FaceMatches && searchByImageResponse.FaceMatches.length > 0) {
                    console.log(`   ✅ Found ${searchByImageResponse.FaceMatches.length} potential matches via SearchFacesByImageCommand (Similarity >= ${searchByImageParams.FaceMatchThreshold}%)`);
                    
                    // Process each match, look for only those with user_ prefix
                    for (const match of searchByImageResponse.FaceMatches) {
                        const matchedFaceId = match.Face?.FaceId;
                        const matchedExternalId = match.Face?.ExternalImageId;
                        const similarity = match.Similarity;
                        
                        console.log(`      -> Processing match: Matched Face ID: ${matchedFaceId}, External ID: ${matchedExternalId}, Similarity: ${similarity?.toFixed(2)}%`);
                        
                        if (!matchedFaceId || !matchedExternalId || similarity === undefined) {
                            console.log(`         SKIP: Invalid match data.`);
                                        continue;
                                    }

                        // We only want matches with user_ prefix
                        if (!matchedExternalId.startsWith('user_')) {
                            console.log(`         SKIP: External ID (${matchedExternalId}) is not a user registration face.`);
                                            continue;
                                        }
                                        
                        // Extract the user ID from the External ID
                        const potentialUserId = matchedExternalId.substring(5);
                        console.log(`         User Face Detected. Extracted User ID: ${potentialUserId}`);
                        
                        // Add user to list if not already added
                        if (!uniqueMatchedUserIds.has(potentialUserId)) {
                                            photoMetadata.matched_users.push({
                                userId: potentialUserId,
                                faceId: matchedFaceId, // The user's registered face ID that matched
                                similarity: similarity,
                                                matchedAt: new Date().toISOString()
                                            });
                            uniqueMatchedUserIds.add(potentialUserId); // Add to set to prevent duplicates
                            console.log(`         ✏️ DATABASE WRITE: Match added for user ${potentialUserId} (Similarity: ${similarity.toFixed(2)}%).`);
                                        } else {
                            console.log(`         SKIP: User ${potentialUserId} already added to matched list (duplicate).`);
                        }
                    }
                } else {
                    console.log(`   ℹ️ No face matches found via SearchFacesByImageCommand with threshold >= ${searchByImageParams.FaceMatchThreshold}%.`);
                }
                
                console.log(`   Completed search for all face matches. Total unique user matches found: ${photoMetadata.matched_users.length}`);

            } catch (rekognitionError) {
                console.error(`   ❌ Rekognition error during face processing: ${rekognitionError.message}`);
                console.error(rekognitionError);
                photoMetadata.faces = photoMetadata.faces || [];
                photoMetadata.face_ids = photoMetadata.face_ids || [];
                photoMetadata.matched_users = photoMetadata.matched_users || [];
            }
            console.groupEnd(); // End Face Indexing & Comparison group

            // --- Image Analysis with DetectLabels ---
            console.groupCollapsed(`🔄 [Upload ${uploadId}] Running Rekognition Image Analysis...`);
            try {
                console.log(`   Using global Rekognition Client: ${!!rekognitionClient}`);
                console.log(`   DetectLabelsCommand available: ${!!DetectLabelsCommand}`);
                console.log(`   Action: Analyzing image content with DetectLabels`);
                
                if (!fileUint8Array) {
                    throw new Error("File buffer (Uint8Array) is missing");
                }
                
                // Set up parameters for DetectLabels
                const detectLabelsParams = {
                    Image: {
                        Bytes: fileUint8Array,
                    },
                    MaxLabels: 40,
                    MinConfidence: 80,
                    Features: ["GENERAL_LABELS", "IMAGE_PROPERTIES"],
                    Settings: {
                        ImageProperties: {
                            MaxDominantColors: 5,
                            Foreground: {
                                MaxDominantColors: 5
                            },
                            Background: {
                                MaxDominantColors: 5
                            }
                        }
                    }
                };
                
                console.log(`   Executing DetectLabelsCommand with MaxLabels: ${detectLabelsParams.MaxLabels}, MinConfidence: ${detectLabelsParams.MinConfidence}`);
                
                const detectLabelsCommand = new DetectLabelsCommand(detectLabelsParams);
                const detectLabelsResponse = await rekognitionClient.send(detectLabelsCommand);
                
                console.log(`   DetectLabelsCommand Response: ${detectLabelsResponse ? 'Success' : 'Undefined'}`);
                
                if (detectLabelsResponse) {
                    // Process labels
                    if (detectLabelsResponse.Labels && detectLabelsResponse.Labels.length > 0) {
                        console.log(`   ✅ Successfully detected ${detectLabelsResponse.Labels.length} labels (Confidence >= ${detectLabelsParams.MinConfidence}%)`);
                        
                        // Store all labels passing the confidence threshold
                        photoMetadata.imageLabels = JSON.stringify(detectLabelsResponse.Labels);
                        console.log(`   ✏️ DATABASE WRITE: Storing all ${detectLabelsResponse.Labels.length} image labels.`);
                        
                        // Extract top labels (names only) for quick access (using a higher threshold for top labels, e.g., 85)
                        const topLabels = detectLabelsResponse.Labels
                            .filter(label => label.Confidence > 85) // Keep threshold for topLabels higher for relevance
                            .slice(0, 10)
                            .map(label => label.Name);
                            
                        photoMetadata.topLabels = JSON.stringify(topLabels);
                        console.log(`   ✏️ DATABASE WRITE: Top labels stored: ${topLabels.join(', ')}`);
                    } else {
                        console.log(`   ⚠️ No labels detected meeting the confidence threshold (${detectLabelsParams.MinConfidence}%).`);
                    }
                    
                    // Process image properties
                    if (detectLabelsResponse.ImageProperties) {
                        console.log(`   ✅ Successfully extracted image properties`);
                        
                        // Store full image properties
                        photoMetadata.imageProperties = JSON.stringify(detectLabelsResponse.ImageProperties);
                        console.log(`   ✏️ DATABASE WRITE: Storing complete image properties.`);
                        
                        // --- Extract Dominant Colors --- 
                        // Overall Dominant Colors
                        if (detectLabelsResponse.ImageProperties.DominantColors) {
                            const overallColors = detectLabelsResponse.ImageProperties.DominantColors
                                .slice(0, 5) // Limit to top 5
                                .map(color => color.HexCode);
                            photoMetadata.dominantColors = JSON.stringify(overallColors);
                            console.log(`   ✏️ DATABASE WRITE: Overall dominant colors stored: ${overallColors.join(', ')}`);
                        }
                        
                        // Foreground Dominant Colors
                        if (detectLabelsResponse.ImageProperties.Foreground?.DominantColors) {
                           const foregroundColors = detectLabelsResponse.ImageProperties.Foreground.DominantColors
                                .slice(0, 5) // Limit to top 5
                                .map(color => color.HexCode);
                            photoMetadata.foregroundColors = JSON.stringify(foregroundColors);
                            console.log(`   ✏️ DATABASE WRITE: Foreground colors stored: ${foregroundColors.join(', ')}`);
                        }
                        
                        // Background Dominant Colors
                        if (detectLabelsResponse.ImageProperties.Background?.DominantColors) {
                           const backgroundColors = detectLabelsResponse.ImageProperties.Background.DominantColors
                                .slice(0, 5) // Limit to top 5
                                .map(color => color.HexCode);
                            photoMetadata.backgroundColors = JSON.stringify(backgroundColors);
                            console.log(`   ✏️ DATABASE WRITE: Background colors stored: ${backgroundColors.join(', ')}`);
                        }
                        
                        // Look for skin tones in people photos
                        let skinToneDetected = false;
                        try {
                            // Check if this is a photo with people
                            const hasPerson = detectLabelsResponse.Labels.some(label => 
                                label.Name === "Person" && label.Confidence > 90);
                            
                            if (hasPerson && detectLabelsResponse.ImageProperties.Foreground?.DominantColors) {
                                // For people photos, the top foreground colors often include skin tones
                                const potentialSkinTones = detectLabelsResponse.ImageProperties.Foreground.DominantColors
                                    .slice(0, 3); // First 3 colors are most likely to include skin tone
                                
                                // Store potential skin tones for later analysis
                                if (potentialSkinTones.length > 0) {
                                    photoMetadata.skinTones = JSON.stringify(potentialSkinTones.map(color => ({
                                        hexCode: color.HexCode,
                                        confidence: color.Confidence
                                    })));
                                    skinToneDetected = true;
                                    console.log(`   ✏️ DATABASE WRITE: Storing potential skin tones: ${potentialSkinTones.map(c => c.HexCode).join(', ')}`);
                                }
                            }
                        } catch (skinToneError) {
                            console.error(`   Error detecting skin tones: ${skinToneError.message}`);
                        }
                        
                        // Extract image quality metrics (Values are 0-100)
                        const quality = {
                            brightness: detectLabelsResponse.ImageProperties.Quality?.Brightness,
                            sharpness: detectLabelsResponse.ImageProperties.Quality?.Sharpness,
                            contrast: detectLabelsResponse.ImageProperties.Quality?.Contrast
                        };
                        
                        // Store quality metrics if any are defined
                        if (quality.brightness !== undefined || quality.sharpness !== undefined || quality.contrast !== undefined) {
                          photoMetadata.imageQuality = JSON.stringify(quality);
                          console.log(`   ✏️ DATABASE WRITE: Image quality metrics stored: Brightness=${quality.brightness?.toFixed(2)}, Sharpness=${quality.sharpness?.toFixed(2)}, Contrast=${quality.contrast?.toFixed(2)}`);
                                        } else {
                          console.log(`   Image quality metrics not available.`);
                        }
                    } else {
                      console.log(`   Image properties not available in DetectLabels response.`);
                    }
                }
            } catch (analysisError) {
                console.error(`   ❌ Image analysis error: ${analysisError.message}`);
                console.error(analysisError);
            }
            console.groupEnd();
            
            // --- Save to DynamoDB ---
            console.log(`✏️ [Upload ${uploadId}] DATABASE WRITE: Saving final metadata to DynamoDB table ${PHOTOS_TABLE}...`);
            console.log('   ✏️ RECEIVED METADATA:', JSON.stringify(metadata, null, 2));
            
            // Ensure we have both nested and flat metadata for maximum compatibility
            // This handles different code patterns across the app
            
            // 1. Handle event details
            console.log(`   ✏️ Processing event details...`);
            if (metadata.event_details && metadata.event_details.name) {
                // If we have nested structure, make sure flat properties also exist
                photoMetadata.eventName = metadata.event_details.name;
                photoMetadata.date = metadata.event_details.date || metadata.date || new Date().toISOString();
                photoMetadata.promoterName = metadata.event_details.promoter || metadata.promoterName || '';
                console.log(`   ✏️ NESTED->FLAT: Copying event data from nested structure: name=${metadata.event_details.name}, date=${metadata.event_details.date}, promoter=${metadata.event_details.promoter}`);
            } else if (metadata.eventName) {
                // If only flat properties exist, ensure the nested structure exists too
                if (!photoMetadata.event_details) {
                    photoMetadata.event_details = {};
                }
                photoMetadata.event_details.name = metadata.eventName;
                photoMetadata.event_details.date = metadata.date || new Date().toISOString();
                photoMetadata.event_details.promoter = metadata.promoterName || '';
                photoMetadata.event_details.type = null;
                console.log(`   ✏️ FLAT->NESTED: Copying event data to nested structure: name=${metadata.eventName}, date=${metadata.date}, promoter=${metadata.promoterName}`);
            }
            
            // 2. Handle venue data
            console.log(`   ✏️ Processing venue details...`);
            if (metadata.venue && metadata.venue.name) {
                photoMetadata.venueName = metadata.venue.name;
                console.log(`   ✏️ NESTED->FLAT: Copying venue name from nested structure: ${metadata.venue.name}`);
            } else if (metadata.venueName) {
                if (!photoMetadata.venue) {
                    photoMetadata.venue = {};
                }
                photoMetadata.venue.name = metadata.venueName;
                photoMetadata.venue.id = null;
                console.log(`   ✏️ FLAT->NESTED: Copying venue name to nested structure: ${metadata.venueName}`);
            }
            
            // 3. Handle external album link
            if (metadata.externalAlbumLink) {
                photoMetadata.externalAlbumLink = metadata.externalAlbumLink;
                console.log(`   ✏️ COPIED: External album link: ${metadata.externalAlbumLink}`);
            }
            
            // Print flat and nested structures for debugging
            console.log(`   ✏️ EVENT DATA WRITE: Storing event details in both formats:`, {
                flat: {
                    eventName: photoMetadata.eventName,
                    venueName: photoMetadata.venueName,
                    promoterName: photoMetadata.promoterName,
                    date: photoMetadata.date
                },
                nested: {
                    event_details: photoMetadata.event_details,
                    venue: photoMetadata.venue
                }
            });
            
            console.log(`   ✏️ Final metadata includes: ${Object.keys(photoMetadata).length} fields to be stored`);
            
            // Manually marshal the data for the base client
            let marshalledItem;
            try {
                console.log(`   Final matched_users before marshalling: ${photoMetadata.matched_users.length} entries`); 
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
            console.log(`✏️ [Upload ${uploadId}] DATABASE WRITE SUCCESSFUL: Photo metadata saved to DynamoDB table ${PHOTOS_TABLE}!`);
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
     * Fetch photos where the user's face is matched
     * @param {string} userId - The user ID
     * @returns {Promise<Array>} - Array of matched photos
     */
    fetchMatchedPhotos: async (userId) => {
        console.log(`📥 [PhotoService] Fetching matched photos for user: ${userId}`);
        if (!userId) {
            console.error('[PhotoService] Cannot fetch matched photos without userId');
            return [];
        }
        
        try {
            // Check cache first
            const cacheKey = `matched_photos_${userId}`;
            const cacheData = awsPhotoService.matchedPhotosCache.get(cacheKey);
            
            // Check if cache exists AND is not expired (cache should be invalidated if it's older than 30 seconds after a face registration)
            const now = new Date();
            const isCacheValid = cacheData && 
                (now.getTime() - cacheData.timestamp < 30000) && // Increased from 10 to 30 seconds
                cacheData.items && 
                cacheData.items.length > 0;
                
            if (isCacheValid) {
                console.log(`[PhotoService] Using cached data for ${userId} (${cacheData.items.length} photos). Cache created at ${new Date(cacheData.timestamp).toISOString()}`);
                return cacheData.items;
            }
            
            // If no valid cache, proceed with fetching fresh data
            console.log(`[PhotoService] Cache invalid or expired for ${userId}, fetching fresh data`);
            
            // Get user's registered face IDs from FaceStorageService
            const faceData = await getFaceDataForUser(userId);
            if (!faceData || !faceData.faceId) {
                console.log(`[PhotoService] User ${userId} has no registered face IDs`);
                return [];
            }
            
            console.log(`[PhotoService] User ${userId} has registered face IDs: ['${faceData.faceId}']`);
            
            // Use the GSI to find photos where this user is in matched_users
            console.log(`[PhotoService] Querying matched_users index for ${userId}...`);
            
            let matchedPhotos = [];
            try {
                // First, try to use the GSI for efficient query
                const queryParams = {
                    TableName: PHOTOS_TABLE,
                    IndexName: 'MatchedUsersIndex',
                    KeyConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues: {
                        ':userId': userId
                    }
                };
                
                console.log(`[PhotoService] Querying GSI with params: ${JSON.stringify(queryParams)}`);
                const queryResponse = await docClient.send(new QueryCommand(queryParams));
                matchedPhotos = queryResponse.Items || [];
                console.log(`[PhotoService] GSI query found ${matchedPhotos.length} photos with user ${userId} in matched_users`);
            } catch (gsiError) {
                console.error(`[PhotoService] Error querying GSI, falling back to scan: ${gsiError.message}`);
                
                // Fallback to scan if GSI query fails
                const scanParams = {
                    TableName: PHOTOS_TABLE
                };
                
                // Scan all photos and filter client-side
                const scanResults = [];
                let items;
                let scannedCount = 0;
                
                do {
                    items = await docClient.send(new ScanCommand(scanParams));
                    scannedCount += items.ScannedCount || 0;
                    
                    items.Items.forEach((item) => {
                        if (item.matched_users) {
                            let matchedUsers = item.matched_users;
                            
                            // Parse matched_users if it's a string
                            if (typeof matchedUsers === 'string') {
                                try { 
                                    matchedUsers = JSON.parse(matchedUsers); 
                                } catch(e) { 
                                    console.log(`[PhotoService] Invalid JSON in matched_users for photo ${item.id}`);
                                    return;
                                }
                            }
                            
                            // Look for this user in the matched_users array
                            if (Array.isArray(matchedUsers)) {
                                for (const match of matchedUsers) {
                                    // Check for matches in various formats
                                    if (typeof match === 'string' && match === userId) {
                                        scanResults.push(item);
                                        return;
                                    } else if (typeof match === 'object' && match !== null) {
                                        const matchUserId = match.userId || match.user_id;
                                        if (matchUserId === userId) {
                                            scanResults.push(item);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Check historical matches if there's face data available
                        if (faceData && faceData.historicalMatches && Array.isArray(faceData.historicalMatches)) {
                            if (faceData.historicalMatches.some(match => match.id === item.id)) {
                                scanResults.push(item);
                            }
                        }
                    });
                    
                    scanParams.ExclusiveStartKey = items.LastEvaluatedKey;
                } while (typeof items.LastEvaluatedKey !== 'undefined');
                
                console.log(`[PhotoService] Scanned ${scannedCount} total photos.`);
                console.log(`[PhotoService] Found ${scanResults.length} matched photos for user ${userId}.`);
                
                matchedPhotos = scanResults;
            }
            
            // Apply visibility filter
            const visibleMatchedPhotos = await filterPhotosByVisibility(userId, matchedPhotos, 'VISIBLE');
            
            // Sort by creation date (newest first)
            const sortedVisiblePhotos = visibleMatchedPhotos.sort((a, b) => {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });
            
            // Store in cache with timestamp
            awsPhotoService.matchedPhotosCache.set(cacheKey, {
                items: sortedVisiblePhotos,
                timestamp: now.getTime()
            });
            
            console.log(`[PhotoService] Returning ${sortedVisiblePhotos.length} visible matched photos for user ${userId}.`);
            return sortedVisiblePhotos;
        } catch (error) {
            console.error(`[PhotoService] Error fetching matched photos: ${error}`);
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
    },
    /**
     * Fetch photos where the user's face is matched - convenience method for getVisiblePhotos that ensures fresh data on each call
     * @param {string} userId - The user ID
     * @returns {Promise<Array>} - Array of matched photos
     */
    fetchPhotos: async (userId) => {
        console.log(`📥 [PhotoService] Fetching matched photos (with cache validation) for user: ${userId}`);
        if (!userId) {
            console.error('[PhotoService] Cannot fetch matched photos without userId');
            return [];
        }
        
        try {
            // Check if cache exists and when it was last updated
            const cacheKey = `matched_photos_${userId}`;
            const cacheData = awsPhotoService.matchedPhotosCache.get(cacheKey);
            const now = new Date().getTime();
            
            // Only clear cache if it's older than 5 minutes (300000ms)
            const cacheMaxAge = 300000; // 5 minutes in milliseconds
            
            if (cacheData && cacheData.timestamp && (now - cacheData.timestamp > cacheMaxAge)) {
                console.log(`[PhotoService] Cache for user ${userId} is older than 5 minutes, clearing for refresh`);
                awsPhotoService.matchedPhotosCache.delete(cacheKey);
            } else if (cacheData && cacheData.timestamp) {
                console.log(`[PhotoService] Cache for user ${userId} is still valid (${Math.round((now - cacheData.timestamp)/1000)}s old)`);
            }
            
            // Call the fetchMatchedPhotos method which will now use the cache if it exists
            return await awsPhotoService.fetchMatchedPhotos(userId);
        } catch (error) {
            console.error(`[PhotoService] Error in fetchPhotos: ${error}`);
            return [];
        }
    }
};
export default awsPhotoService;
