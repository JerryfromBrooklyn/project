import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, docClient, PHOTO_BUCKET, PHOTOS_TABLE } from '../lib/awsClient';
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
        try {
            // Generate ID for the file
            const fileId = uuidv4();
            const fileName = `${fileId}-${file.name}`;
            // Determine storage path - include userId if available from metadata
            const userId = metadata.uploadedBy || metadata.uploaded_by;
            const path = folderPath
                ? `${userId}/${folderPath}/${fileName}`
                : `${userId}/${fileName}`;
            progressCallback(20);
            // Upload to S3
            const uploadParams = {
                Bucket: PHOTO_BUCKET,
                Key: path,
                Body: file,
                ContentType: file.type
            };
            await s3Client.send(new PutObjectCommand(uploadParams));
            progressCallback(50);
            // Get public URL - using the S3 URL pattern
            const publicUrl = `https://${PHOTO_BUCKET}.s3.amazonaws.com/${path}`;
            // Process metadata with required fields and formats
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
                faces: metadata.faces || [],
                matched_users: metadata.matched_users || [],
                face_ids: metadata.face_ids || [],
                location: metadata.location || { lat: null, lng: null, name: null },
                venue: metadata.venue || { id: null, name: null },
                event_details: metadata.event_details || { date: null, name: null, type: null },
                tags: metadata.tags || [],
                folder_path: folderPath || null,
                title: metadata.title || file.name,
                description: metadata.description || ''
            };
            progressCallback(70);
            // Save to DynamoDB using docClient
            const putParams = {
                TableName: PHOTOS_TABLE,
                Item: photoMetadata // No need to marshall with docClient
            };
            await docClient.send(new PutCommand(putParams));
            progressCallback(100);
            return {
                success: true,
                photoId: fileId,
                photoMetadata
            };
        }
        catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    /**
     * Get user's storage usage
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Storage usage data
     */
    getUserStorageUsage: async (userId) => {
        try {
            // List objects in user's folder
            const listParams = {
                Bucket: PHOTO_BUCKET,
                Prefix: `${userId}/`
            };
            const response = await s3Client.send(new ListObjectsV2Command(listParams));
            // Calculate total size
            const totalSize = (response.Contents || []).reduce((total, obj) => total + (obj.Size || 0), 0);
            return {
                data: {
                    total_size: totalSize,
                    file_count: response.KeyCount || 0
                },
                error: null
            };
        }
        catch (error) {
            console.error('Error fetching storage usage:', error);
            return {
                data: null,
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
