import { supabase } from '../lib/supabaseClient';
import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { DetectFacesCommand, IndexFacesCommand } from '@aws-sdk/client-rekognition';
import { v4 as uuidv4 } from 'uuid';
import { FaceIndexingService } from './FaceIndexingService';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { 
  Face, 
  MatchedUser, 
  Location, 
  Venue, 
  EventDetails,
  PhotoMetadata
} from '../types';

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  photoId?: string;
  photoMetadata?: PhotoMetadata;
}

export interface BatchUpdateData {
  location?: Location;
  venue?: Venue;
  tags?: string[];
  date_taken?: string;
  event_details?: EventDetails;
}

export class PhotoService {
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000; // 1 second

  static async uploadPhoto(
    file: File, 
    eventId?: string, 
    folderPath?: string,
    metadata?: Partial<PhotoMetadata>
  ): Promise<PhotoUploadResult> {
    try {
      const photoId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const filePath = folderPath 
        ? `photos/${folderPath}/${photoId}.${fileExt}`
        : `photos/${photoId}.${fileExt}`;

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not found');

      // Check storage quota
      const { data: storageData, error: storageError } = await this.getUserStorageUsage(userId);
      if (storageError) throw storageError;
      if (!storageData) throw new Error('Could not get storage data');

      if (storageData.total_size + file.size > storageData.quota_limit) {
        throw new Error('Storage quota exceeded');
      }

      // Upload to Supabase Storage with retries
      let uploadError;
      for (let i = 0; i < this.MAX_RETRIES; i++) {
        try {
          const { error } = await supabase.storage
            .from('photos')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (!error) {
            uploadError = null;
            break;
          }
          uploadError = error;
        } catch (error) {
          uploadError = error;
        }
        
        if (i < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (i + 1)));
        }
      }

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Create a record in the photos table with minimal fields first
      // This avoids issues with missing columns or data type mismatches
      const minimalPhotoData = {
        id: photoId,
        storage_path: filePath,
        public_url: publicUrl,
        uploaded_by: userId
      };

      console.log('Inserting minimal photo record with data:', JSON.stringify(minimalPhotoData));

      // First try inserting with minimal fields
      const { error: minimalInsertError } = await supabase
        .from('photos')
        .insert(minimalPhotoData);

      if (minimalInsertError) {
        console.error('Error inserting minimal photo record:', minimalInsertError);
        
        // Fallback: try different column names for URL fields
        const alternativePhotoData = {
          id: photoId,
          path: filePath,
          url: publicUrl,
          uploaded_by: userId,
          storage_path: filePath  // Add this required field to prevent the NOT NULL constraint violation
        };
        
        console.log('Trying alternative photo data:', JSON.stringify(alternativePhotoData));
        
        const { error: alternativeInsertError } = await supabase
          .from('photos')
          .insert(alternativePhotoData);
          
        if (alternativeInsertError) {
          console.error('Error inserting alternative photo record:', alternativeInsertError);
          // Try to delete the uploaded file if the record creation fails
          await supabase.storage.from('photos').remove([filePath]);
          throw alternativeInsertError;
        }
      }

      console.log('Photo record created successfully');

      // Process faces in the photo
      const arrayBuffer = await file.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);
      
      console.log('[DEBUG] Starting face processing for photo:', photoId);
      console.log('[DEBUG] Processing faces in uploaded photo...');
      
      // First detect faces
      const detectedFaces = await this.detectFaces(imageBytes);
      console.log('[DEBUG] Detected faces:', detectedFaces.length);
      
      // Initialize faces array with detected face attributes
      const faces: Face[] = detectedFaces.map(face => ({
        userId: '', // Will be populated if matched
        confidence: 0, // Will be populated if matched
        attributes: {
          age: {
            low: face.AgeRange?.Low || 0,
            high: face.AgeRange?.High || 0
          },
          smile: {
            value: face.Smile?.Value || false,
            confidence: face.Smile?.Confidence || 0
          },
          eyeglasses: {
            value: face.Eyeglasses?.Value || false,
            confidence: face.Eyeglasses?.Confidence || 0
          },
          sunglasses: {
            value: face.Sunglasses?.Value || false,
            confidence: face.Sunglasses?.Confidence || 0
          },
          gender: {
            value: face.Gender?.Value || '',
            confidence: face.Gender?.Confidence || 0
          },
          eyesOpen: {
            value: face.EyesOpen?.Value || false,
            confidence: face.EyesOpen?.Confidence || 0
          },
          mouthOpen: {
            value: face.MouthOpen?.Value || false,
            confidence: face.MouthOpen?.Confidence || 0
          },
          quality: {
            brightness: face.Quality?.Brightness || 0,
            sharpness: face.Quality?.Sharpness || 0
          },
          emotions: face.Emotions?.map(emotion => ({
            type: emotion.Type,
            confidence: emotion.Confidence
          })) || [],
          landmarks: face.Landmarks,
          pose: face.Pose,
          beard: {
            value: face.Beard?.Value || false,
            confidence: face.Beard?.Confidence || 0
          },
          mustache: {
            value: face.Mustache?.Value || false,
            confidence: face.Mustache?.Confidence || 0
          },
          overallConfidence: face.Confidence
        }
      }));
      
      let matched_users: MatchedUser[] = [];
      
      if (faces.length > 0) {
        console.log(`[DEBUG] Indexing ${faces.length} faces for future matching...`);
        
        // Index these faces in AWS Rekognition and store their FaceIDs
        try {
          // Create a safe external ID that doesn't use underscores or other special chars
          const externalImageId = `p${photoId.replace(/-/g, '')}`;
          
          console.log('[DEBUG] Sending IndexFacesCommand to AWS with external ID:', externalImageId);
          
          const indexCommand = new IndexFacesCommand({
            CollectionId: COLLECTION_ID,
            Image: { Bytes: imageBytes },
            ExternalImageId: externalImageId,
            DetectionAttributes: ['ALL'],
            MaxFaces: 10,
            QualityFilter: 'AUTO'
          });
          
          const indexResult = await rekognitionClient.send(indexCommand);
          
          if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
            console.log(`[DEBUG] Successfully indexed ${indexResult.FaceRecords.length} faces in AWS`);
            
            // Store the face IDs for later use
            const faceIds: string[] = [];
            
            // Store these as unassociated faces in our database
            for (let i = 0; i < indexResult.FaceRecords.length; i++) {
              const faceRecord = indexResult.FaceRecords[i];
              const faceId = faceRecord.Face?.FaceId;
              
              if (faceId) {
                faceIds.push(faceId);
                
                try {
                  // Store the unassociated face with reference to the new photo
                  const unassociatedFace = {
                    face_id: faceId,
                    photo_id: photoId,
                    external_image_id: `${externalImageId}${i}`,
                    created_at: new Date().toISOString(),
                    attributes: faceRecord.FaceDetail || {}
                  };
                  
                  const { error: faceError } = await supabase
                    .from('unassociated_faces')
                    .insert(unassociatedFace);
                    
                  if (faceError) {
                    console.error('Error storing unassociated face:', faceError);
                  } else {
                    console.log(`Stored unassociated face: ${faceId} for photo ${photoId}`);
                    
                    // If we have face data, update the faces array
                    if (faces[i]) {
                      faces[i].faceId = faceId;
                    }
                  }
                } catch (faceStoreError) {
                  console.error('Error in storing unassociated face:', faceStoreError);
                }
              }
            }
            
            // Also update the face_ids array column if it exists
            if (faceIds.length > 0) {
              const { error: faceIdsError } = await supabase
                .from('photos')
                .update({ face_ids: faceIds })
                .eq('id', photoId);
                
              if (faceIdsError) {
                console.log('Note: Could not update face_ids column, it may not exist:', faceIdsError);
              }
            }
          }
          
          // Immediately search for matching users
          console.log('[DEBUG] Searching for face matches...');
          const matches = await FaceIndexingService.searchFaces(imageBytes);
          console.log('[DEBUG] Face matches returned:', matches ? matches.length : 0);
          
          // Filter matches by confidence threshold
          const highConfidenceMatches = matches.filter(match => match.confidence >= FACE_MATCH_THRESHOLD);
          console.log('High confidence matches:', highConfidenceMatches);

          if (highConfidenceMatches.length > 0) {
            // Update query to handle potential non-UUID formats in userId
            const userIds = highConfidenceMatches.map(match => match.userId)
              .filter(id => !id.startsWith('photo_') && !id.startsWith('p'))
              .filter(id => id && id.length > 10); // Basic validation
            
            if (userIds.length > 0) {
              console.log('Querying for user details with IDs:', userIds);
              
              // Get user details for matches
              const { data: matchedUsersData, error: userError } = await supabase
                .from('users')
                .select(`
                  id,
                  full_name,
                  avatar_url,
                  user_profiles (
                    metadata
                  )
                `)
                .in('id', userIds);

              if (userError) {
                console.error('Error fetching matched users:', userError);
              } else if (matchedUsersData && matchedUsersData.length > 0) {
                console.log('Matched users data:', matchedUsersData);
                
                // Update faces array with matched user IDs and confidence scores
                // and build matched_users array for database storage
                matched_users = highConfidenceMatches
                  .filter(match => !match.userId.startsWith('photo_') && !match.userId.startsWith('p'))
                  .filter(match => match.userId && match.userId.length > 10)
                  .map(match => {
                    const userData = matchedUsersData.find(u => u.id === match.userId);
                    if (!userData) return null;
                  
                    // Find face index for this match
                    const faceIndex = faces.findIndex(face => face.faceId === match.faceId);
                    if (faceIndex !== -1) {
                      faces[faceIndex].userId = match.userId;
                      faces[faceIndex].confidence = match.confidence;
                    }
                  
                    // Create matched_users entry  
                    return {
                      userId: match.userId,
                      fullName: userData.full_name || userData?.user_profiles?.[0]?.metadata?.full_name || 'Unknown User',
                      avatarUrl: userData.avatar_url || userData?.user_profiles?.[0]?.metadata?.avatar_url,
                      confidence: match.confidence
                    };
                  })
                  .filter(Boolean) as MatchedUser[]; // Remove null entries
              }
            }
          }
        } catch (indexError) {
          console.error('Error indexing faces:', indexError);
        }
      }
      
      // Now that we have all the data, update the photo record with the full details
      const updateData: any = {
        faces: faces.length > 0 ? faces : [],
        matched_users: matched_users.length > 0 ? matched_users : []
      };
      
      // Add optional fields that might exist in the schema
      if (metadata?.title) updateData.title = metadata.title || file.name;
      if (metadata?.description !== undefined) updateData.description = metadata.description || '';
      if (metadata?.location) updateData.location = metadata.location;
      if (metadata?.venue) updateData.venue = metadata.venue;
      if (metadata?.tags) updateData.tags = metadata.tags;
      if (metadata?.date_taken) updateData.date_taken = metadata.date_taken;
      if (metadata?.event_details) updateData.event_details = metadata.event_details;
      if (eventId) updateData.event_id = eventId;
      if (folderPath) {
        updateData.folder_path = folderPath;
        updateData.folder_name = folderPath.split('/').pop();
      }
      
      updateData.file_size = file.size;
      updateData.file_type = file.type;
      
      // For debugging - show detailed information about the update data
      console.log('Updating photo with full details:', {
        title: updateData.title,
        event_details: updateData.event_details,
        venue: updateData.venue,
        location: updateData.location, 
        date_taken: updateData.date_taken,
        file_size: updateData.file_size,
        file_type: updateData.file_type
      });
      
      // Update the photo record with faces and matched users
      const { error: updateError } = await supabase
        .from('photos')
        .update(updateData)
        .eq('id', photoId);

      if (updateError) {
        console.error('Error updating photo with full details:', updateError);
      }

      // Return success with photo details
      return {
        success: true,
        url: publicUrl,
        photoId,
        photoMetadata: {
          id: photoId,
          url: publicUrl,
          eventId,
          uploadedBy: userId,
          created_at: new Date().toISOString(),
          fileSize: file.size,
          fileType: file.type,
          faces,
          matched_users,
          folderPath,
          title: metadata?.title || file.name,
          description: metadata?.description || '',
          location: metadata?.location || null,
          venue: metadata?.venue || null,
          tags: metadata?.tags || [],
          date_taken: metadata?.date_taken || new Date().toISOString(),
          event_details: metadata?.event_details || null
        }
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to upload photo'
      };
    }
  }

  static async updatePhotoMetadata(photoId: string, metadata: Partial<PhotoMetadata>): Promise<boolean> {
    try {
      let retries = 0;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          const { error: updateError } = await supabase
            .from('photos')
            .update({
              title: metadata.title,
              description: metadata.description,
              location: metadata.location,
              venue: metadata.venue,
              tags: metadata.tags,
              date_taken: metadata.date_taken,
              event_details: metadata.event_details
            })
            .eq('id', photoId);

          if (!updateError) {
            return true;
          }
          error = updateError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      throw error;
    } catch (error) {
      console.error('Error updating photo metadata:', error);
      return false;
    }
  }

  static async batchUpdatePhotos(photoIds: string[], data: BatchUpdateData): Promise<boolean> {
    try {
      let retries = 0;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          const { error: updateError } = await supabase
            .from('photos')
            .update({
              location: data.location,
              venue: data.venue,
              tags: data.tags,
              date_taken: data.date_taken,
              event_details: data.event_details
            })
            .in('id', photoIds);

          if (!updateError) {
            return true;
          }
          error = updateError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      throw error;
    } catch (error) {
      console.error('Error batch updating photos:', error);
      return false;
    }
  }

  static async renameFolder(oldPath: string, newName: string): Promise<boolean> {
    try {
      let retries = 0;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          const { error: updateError } = await supabase
            .from('photos')
            .update({ 
              folder_name: newName,
              folder_path: oldPath.split('/').slice(0, -1).concat(newName).join('/')
            })
            .eq('folder_path', oldPath);

          if (!updateError) {
            return true;
          }
          error = updateError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      throw error;
    } catch (error) {
      console.error('Error renaming folder:', error);
      return false;
    }
  }

  static async getUserStorageUsage(userId: string): Promise<{ data?: { total_size: number; quota_limit: number }, error?: Error }> {
    try {
      // First check if user has a storage record
      const { data: existingData, error: checkError } = await supabase
        .from('user_storage')
        .select('total_size, quota_limit')
        .eq('user_id', userId)
        .maybeSingle();

      // If no record exists, create one with ON CONFLICT handling
      if (!existingData) {
        const { data: newData, error: insertError } = await supabase
          .from('user_storage')
          .upsert([{
            user_id: userId,
            total_size: 0,
            quota_limit: 10737418240 // 10GB in bytes
          }])
          .select('total_size, quota_limit')
          .single();

        if (insertError) throw insertError;
        return { data: newData };
      }

      return { data: existingData };
    } catch (error) {
      console.error('Error getting/creating storage usage:', error);
      return { error: error as Error };
    }
  }

  static async detectFaces(imageBytes: Uint8Array) {
    try {
      let retries = 0;
      let response;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          console.log('[DEBUG] Sending DetectFacesCommand to AWS...');
          const command = new DetectFacesCommand({
            Image: { Bytes: imageBytes },
            Attributes: ['ALL']
          });
          response = await rekognitionClient.send(command);
          console.log('[DEBUG] AWS DetectFaces response received');
          return response.FaceDetails || [];
        } catch (err) {
          error = err;
          console.error('[ERROR] AWS DetectFaces failed:', err);
          retries++;
          if (retries < this.MAX_RETRIES) {
            const delay = this.RETRY_DELAY * retries;
            console.log(`[DEBUG] Retrying face detection in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw error;
    } catch (error) {
      console.error('Error detecting faces:', error);
      // Return empty array instead of throwing to allow upload to continue
      return [];
    }
  }

  static async getPhotosForEvent(eventId: string): Promise<PhotoMetadata[]> {
    try {
      let retries = 0;
      let data;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          const { data: response, error: queryError } = await supabase
            .from('photos')
            .select(`
              *,
              users (
                id,
                full_name,
                avatar_url,
                user_profiles (
                  metadata
                )
              )
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

          if (!queryError) {
            data = response;
            break;
          }
          error = queryError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      if (error) throw error;

      return (data || []).map(photo => ({
        id: photo.id,
        url: photo.public_url,
        eventId: photo.event_id,
        uploadedBy: photo.uploaded_by,
        created_at: photo.created_at,
        folderPath: photo.folder_path,
        folderName: photo.folder_name,
        fileSize: photo.file_size,
        fileType: photo.file_type,
        faces: photo.faces || [],
        title: photo.title,
        description: photo.description,
        location: photo.location,
        venue: photo.venue,
        tags: photo.tags,
        date_taken: photo.date_taken,
        event_details: photo.event_details,
        matched_users: photo.matched_users || []
      }));
    } catch (error) {
      console.error('Error fetching event photos:', error);
      throw error;
    }
  }

  static async getPhotosForUser(userId: string): Promise<PhotoMetadata[]> {
    try {
      let retries = 0;
      let data;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          const { data: response, error: queryError } = await supabase
            .from('photos')
            .select(`
              *,
              users (
                id,
                full_name,
                avatar_url,
                user_profiles (
                  metadata
                )
              )
            `)
            .or(`uploaded_by.eq.${userId},faces->0->>userId.eq.${userId}`)
            .order('created_at', { ascending: false });

          if (!queryError) {
            data = response;
            break;
          }
          error = queryError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      if (error) throw error;

      return (data || []).map(photo => ({
        id: photo.id,
        url: photo.public_url,
        eventId: photo.event_id,
        uploadedBy: photo.uploaded_by,
        created_at: photo.created_at,
        folderPath: photo.folder_path,
        folderName: photo.folder_name,
        fileSize: photo.file_size,
        fileType: photo.file_type,
        faces: photo.faces || [],
        title: photo.title,
        description: photo.description,
        location: photo.location,
        venue: photo.venue,
        tags: photo.tags,
        date_taken: photo.date_taken,
        event_details: photo.event_details,
        matched_users: photo.matched_users || []
      }));
    } catch (error) {
      console.error('Error fetching user photos:', error);
      throw error;
    }
  }

  static async updatePhotoPermissions(photoId: string, permissions: { userId: string; access: 'view' | 'download' }[]) {
    try {
      let retries = 0;
      let error;

      while (retries < this.MAX_RETRIES) {
        try {
          const { error: updateError } = await supabase
            .from('photo_permissions')
            .upsert(
              permissions.map(p => ({
                photo_id: photoId,
                user_id: p.userId,
                access_level: p.access
              }))
            );

          if (!updateError) {
            return;
          }
          error = updateError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      throw error;
    } catch (error) {
      console.error('Error updating photo permissions:', error);
      throw error;
    }
  }

  static async deletePhoto(photoId: string) {
    try {
      // Get photo details
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('storage_path, file_size')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

      let retries = 0;
      let error;

      // Delete from storage with retries
      while (retries < this.MAX_RETRIES) {
        try {
          const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([photo.storage_path]);

          if (!storageError) {
            error = null;
            break;
          }
          error = storageError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      if (error) throw error;

      // Delete metadata with retries
      retries = 0;
      while (retries < this.MAX_RETRIES) {
        try {
          const { error: dbError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photoId);

          if (!dbError) {
            return;
          }
          error = dbError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      throw error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  static async downloadPhoto(photoId: string): Promise<string> {
    try {
      let retries = 0;
      let data;
      let error;

      // Get photo path
      while (retries < this.MAX_RETRIES) {
        try {
          const { data: photo, error: fetchError } = await supabase
            .from('photos')
            .select('storage_path')
            .eq('id', photoId)
            .single();

          if (!fetchError) {
            data = photo;
            break;
          }
          error = fetchError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      if (error) throw error;

      // Download photo with retries
      retries = 0;
      let downloadedData;
      while (retries < this.MAX_RETRIES) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('photos')
            .download(data.storage_path);

          if (!downloadError) {
            downloadedData = fileData;
            break;
          }
          error = downloadError;
        } catch (err) {
          error = err;
        }

        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }

      if (error) throw error;

      return URL.createObjectURL(downloadedData);
    } catch (error) {
      console.error('Error downloading photo:', error);
      throw error;
    }
  }
}
