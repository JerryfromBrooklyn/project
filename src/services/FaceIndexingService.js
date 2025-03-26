import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { IndexFacesCommand, SearchFacesByImageCommand, SearchFacesCommand, DetectFacesCommand, ListCollectionsCommand, DeleteCollectionCommand, CreateCollectionCommand } from '@aws-sdk/client-rekognition';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { supabase } from '../lib/supabaseClient';
import { validateForTable } from '../utils/databaseValidator';

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
    // Store face ID in database in the correct format
    static async saveFaceData(userId, faceId, attributes) {
        try {
            // First check if the user already has face data
            const { data: existingData, error: fetchError } = await supabase
                .from('face_data')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            if (fetchError)
                throw fetchError;
            
            // Make sure faceId is defined - generate a fallback if needed
            const validFaceId = faceId || `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            console.log(`Using face ID: ${validFaceId} for user ${userId}`);
            
            // Prepare the face data object
            const faceDataObj = {
                aws_face_id: validFaceId,
                attributes: attributes || {},
                updated_at: new Date().toISOString()
            };
            
            if (existingData) {
                // Validate update data
                const updateData = validateForTable('face_data', {
                    user_id: userId,
                    face_id: validFaceId,  // Use the validated face ID
                    face_data: {
                        ...existingData.face_data,
                        aws_face_id: validFaceId,
                        attributes: attributes || existingData.face_data.attributes
                    },
                    updated_at: new Date().toISOString()
                });
                
                // Update existing record
                const { error } = await supabase
                    .from('face_data')
                    .update(updateData)
                    .eq('id', existingData.id);
                if (error)
                    throw error;
            }
            else {
                // Validate insert data
                const insertData = validateForTable('face_data', {
                    user_id: userId,
                    face_id: validFaceId,  // Use the validated face ID
                    face_data: {
                        aws_face_id: validFaceId,
                        attributes: attributes || {}
                    }
                });
                
                console.log('Inserting face data:', JSON.stringify(insertData, null, 2));
                
                // Create new record
                const { error } = await supabase
                    .from('face_data')
                    .insert(insertData);
                if (error)
                    throw error;
            }
            console.log(`Face data saved to database: User ${userId}, Face ID ${validFaceId}`);
        }
        catch (error) {
            console.error('Error saving face data:', error);
            throw error;
        }
    }
    static async searchFacesByFaceId(faceId, userId) {
        try {
            console.log(`Searching for faces matching FaceId: ${faceId}`);
            // Use SearchFaces API (which is more efficient than SearchFacesByImage)
            const command = new SearchFacesCommand({
                CollectionId: this.COLLECTION_ID,
                FaceId: faceId,
                FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                MaxFaces: 1000 // Set high to get all possible matches in one call
            });
            const response = await rekognitionClient.send(command);
            if (!response.FaceMatches?.length) {
                console.log('No matching faces found');
                return [];
            }
            console.log(`Found ${response.FaceMatches.length} matching faces in AWS collection`);
            // Get the matched face IDs from AWS
            const matchedFaceIds = response.FaceMatches.map(match => match.Face?.FaceId || '').filter(id => !!id);
            console.log(`Matching face IDs: ${matchedFaceIds.slice(0, 5).join(', ')}${matchedFaceIds.length > 5 ? ' (and more)' : ''}`);
            // First, let's fetch all the photos from the database and manually filter them
            // This is a more robust approach than using the filter operator which might be incompatible with the data structure
            console.log('Fetching all photos to check for matches...');
            const { data: allPhotos, error: photosError } = await supabase
                .from('photos')
                .select('id, faces, matched_users, face_ids');
            if (photosError) {
                console.error('Error fetching photos:', photosError);
                return [];
            }
            if (!allPhotos?.length) {
                console.log('No photos found in database');
                return [];
            }
            console.log(`Fetched ${allPhotos.length} photos from database. Checking for matches...`);
            // Log the structure of the first photo to help debug
            if (allPhotos.length > 0) {
                console.log('First photo structure:', JSON.stringify(allPhotos[0], null, 2));
            }
            // Find photos that have matching face IDs in various possible fields
            const matchingPhotos = allPhotos.filter(photo => {
                // Check if any face in the faces array matches the AWS face IDs
                if (Array.isArray(photo.faces)) {
                    const hasFaceMatch = photo.faces.some(face => face.faceId && matchedFaceIds.includes(face.faceId));
                    if (hasFaceMatch)
                        return true;
                }
                // Check face_ids if available
                if (Array.isArray(photo.face_ids)) {
                    const hasFaceIdMatch = photo.face_ids.some(id => matchedFaceIds.includes(id));
                    if (hasFaceIdMatch)
                        return true;
                }
                return false;
            });
            // If we didn't find matches in the photos table, check the unassociated_faces table
            if (matchingPhotos.length === 0) {
                console.log('No matches found in photos table, checking unassociated_faces table...');
                try {
                    const { data: unassociatedFaces, error: unassociatedError } = await supabase
                        .from('unassociated_faces')
                        .select('photo_id')
                        .in('face_id', matchedFaceIds);
                    if (unassociatedError) {
                        console.error('Error checking unassociated_faces:', unassociatedError);
                    }
                    else if (unassociatedFaces && unassociatedFaces.length > 0) {
                        console.log(`Found ${unassociatedFaces.length} matches in unassociated_faces table`);
                        // Get the unique photo IDs
                        const photoIds = [...new Set(unassociatedFaces.map(face => face.photo_id))];
                        // Fetch these photos
                        const { data: additionalPhotos, error: additionalError } = await supabase
                            .from('photos')
                            .select('id, faces, matched_users, face_ids')
                            .in('id', photoIds);
                        if (additionalError) {
                            console.error('Error fetching additional photos:', additionalError);
                        }
                        else if (additionalPhotos && additionalPhotos.length > 0) {
                            console.log(`Fetched ${additionalPhotos.length} additional photos`);
                            matchingPhotos.push(...additionalPhotos);
                        }
                    }
                }
                catch (error) {
                    console.error('Error querying unassociated_faces:', error);
                }
            }
            if (!matchingPhotos.length) {
                console.log('No photos found with matching face IDs after manual filtering');
                return [];
            }
            console.log(`Found ${matchingPhotos.length} photos with matching face IDs`);
            // For each photo, check if the user is already matched
            const photosToUpdate = matchingPhotos.filter(photo => {
                if (!Array.isArray(photo.matched_users))
                    return true; // If no matched_users, definitely need to update
                return !photo.matched_users.some((match) => match.userId === userId);
            });
            if (photosToUpdate.length === 0) {
                console.log('User already matched with all photos');
                return [];
            }
            console.log(`Found ${photosToUpdate.length} photos to update with new match`);
            // Get user data for the match
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
          id,
          full_name,
          avatar_url,
          user_profiles (
            metadata
          )
        `)
                .eq('id', userId)
                .single();
            if (userError || !userData) {
                console.log('User data not found:', userError);
                return [];
            }
            // Update each photo with the new match
            const updatedPhotoIds = [];
            for (const photo of photosToUpdate) {
                // Find a matching face to get the confidence score
                let confidence = FACE_MATCH_THRESHOLD; // Default confidence threshold
                // Try to find confidence from faces array
                if (Array.isArray(photo.faces)) {
                    const matchingFace = photo.faces.find(face => face.faceId && matchedFaceIds.includes(face.faceId));
                    if (matchingFace && matchingFace.confidence) {
                        confidence = matchingFace.confidence;
                    }
                }
                // Create the new match object
                const newMatch = {
                    userId,
                    fullName: userData.full_name || userData?.user_profiles?.[0]?.metadata?.full_name || 'Unknown User',
                    avatarUrl: userData.avatar_url || userData?.user_profiles?.[0]?.metadata?.avatar_url,
                    confidence
                };
                // Update the photo
                const existingMatches = Array.isArray(photo.matched_users) ? photo.matched_users : [];
                const updatedMatches = [...existingMatches, newMatch];
                console.log(`Updating photo ${photo.id} with matched user ${userId}, confidence: ${confidence}`);
                const { error: updateError } = await supabase
                    .from('photos')
                    .update({ matched_users: updatedMatches })
                    .eq('id', photo.id);
                if (!updateError) {
                    updatedPhotoIds.push(photo.id);
                    console.log(`Successfully updated photo ${photo.id} with new user match`);
                }
                else {
                    console.error(`Error updating photo ${photo.id}:`, updateError);
                }
            }
            return updatedPhotoIds;
        }
        catch (error) {
            console.error('Error searching faces by FaceId:', error);
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
        return Array.from(imageBytes.slice(0, 1000))
            .reduce((acc, byte) => acc + byte, 0)
            .toString(36);
    }
    static async searchFaces(imageBytes) {
        try {
            console.group('Face Search Process');
            console.log('🔍 Starting face search process...');
            // Create cache key before expensive operations
            const cacheKey = this.createCacheKey(imageBytes);
            console.log('Generated cache key:', cacheKey);
            // Check cache first
            const cached = this.matchCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
                console.log('🔄 Returning cached face matches:', cached.result);
                console.groupEnd();
                return cached.result;
            }
            const detectedFaces = await this.detectFacesWithRetry(imageBytes);
            if (!detectedFaces || detectedFaces.length === 0) {
                console.warn('❌ No faces detected in image during search');
                console.groupEnd();
                // Cache empty result to avoid repeated processing of images without faces
                this.matchCache.set(cacheKey, {
                    result: [],
                    timestamp: Date.now()
                });
                return [];
            }
            console.log(`✅ Detected ${detectedFaces.length} faces in image`);
            console.log('Face details:', detectedFaces);
            console.log('Step 2: Searching for face matches in collection...');
            const command = new SearchFacesByImageCommand({
                CollectionId: this.COLLECTION_ID,
                Image: { Bytes: imageBytes },
                MaxFaces: 5, // Limit to 5 faces to reduce cost
                FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                QualityFilter: 'AUTO' // Use AUTO instead of NONE for better performance/cost ratio
            });
            const response = await rekognitionClient.send(command);
            if (!response.FaceMatches?.length) {
                console.warn('❌ No face matches found in collection');
                // Cache empty result
                this.matchCache.set(cacheKey, {
                    result: [],
                    timestamp: Date.now()
                });
                console.groupEnd();
                return [];
            }
            console.log(`✅ Found ${response.FaceMatches.length} potential matches`);
            console.log('Raw matches:', response.FaceMatches);
            console.log('Step 3: Processing matches...');
            const results = response.FaceMatches
                .map(match => {
                const result = {
                    userId: match.Face?.ExternalImageId || '',
                    confidence: match.Similarity || 0,
                    faceId: match.Face?.FaceId || ''
                };
                console.log(`Match processed: User ${result.userId} with ${result.confidence.toFixed(2)}% confidence`);
                return result;
            })
                .filter(result => {
                const passes = result.confidence >= FACE_MATCH_THRESHOLD;
                if (!passes) {
                    console.log(`Match filtered out: ${result.confidence.toFixed(2)}% < ${FACE_MATCH_THRESHOLD}% threshold`);
                }
                return passes;
            });
            console.log(`✅ Final results: ${results.length} valid matches above ${FACE_MATCH_THRESHOLD}% threshold`);
            console.log('Processed results:', results);
            // Cache for 30 minutes to reduce API calls
            this.matchCache.set(cacheKey, {
                result: results,
                timestamp: Date.now()
            });
            console.log('Cache updated with new results');
            console.groupEnd();
            return results;
        }
        catch (error) {
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
