import { supabase } from '../src/lib/supabaseClient';
import { rekognitionClient, COLLECTION_ID } from '../src/config/aws-config';
import { IndexFacesCommand } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

dotenv.config();

const BATCH_SIZE = 10;
const MAX_CONCURRENT = 3;

interface PhotoToMigrate {
  id: string;
  storage_path: string;
  has_faces: boolean;
}

async function migratePhotos() {
  console.log('Starting face migration process...');
  const { data: photos, error } = await supabase.rpc('get_photos_needing_face_indexing');
  
  if (error) {
    console.error('Error fetching photos to migrate:', error);
    return;
  }
  
  if (!photos?.length) {
    console.log('No photos found that need face indexing.');
    return;
  }
  
  console.log(`Found ${photos.length} photos to migrate`);
  
  // Process in batches
  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE);
    const promises: Promise<void>[] = [];
    
    for (const photo of batch) {
      promises.push(processPhoto(photo));
      
      // Limit concurrent processing
      if (promises.length >= MAX_CONCURRENT || i + promises.length >= photos.length) {
        console.log(`Processing batch ${i}-${i + promises.length} of ${photos.length} photos...`);
        await Promise.all(promises);
        promises.length = 0;
      }
    }
  }
  
  console.log('Migration completed successfully!');
}

async function processPhoto(photo: PhotoToMigrate): Promise<void> {
  try {
    console.log(`Processing photo ${photo.id}...`);
    
    // Download the photo
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('photos')
      .download(photo.storage_path);
      
    if (downloadError || !imageData) {
      console.error(`Error downloading photo ${photo.id}:`, downloadError);
      return;
    }
    
    // Convert to byte array
    const imageBytes = new Uint8Array(await imageData.arrayBuffer());
    
    // Use a temporary ID for indexing that includes the photo ID
    const tempPhotoIdPrefix = `photo_${photo.id}_`;
    
    // Index the faces
    const indexCommand = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      ExternalImageId: tempPhotoIdPrefix,
      DetectionAttributes: ['ALL'],
      MaxFaces: 10,
      QualityFilter: 'AUTO'
    });
    
    const indexResult = await rekognitionClient.send(indexCommand);
    
    if (!indexResult.FaceRecords?.length) {
      console.log(`No faces detected in photo ${photo.id}`);
      
      // Update the photo's face_ids to an empty array to mark it as processed
      await supabase.rpc('update_photo_face_ids', {
        photo_id: photo.id,
        new_face_ids: []
      });
      
      return;
    }
    
    console.log(`Indexed ${indexResult.FaceRecords.length} faces in photo ${photo.id}`);
    
    // Store the face IDs
    const faceIds: string[] = [];
    
    for (let i = 0; i < indexResult.FaceRecords.length; i++) {
      const faceRecord = indexResult.FaceRecords[i];
      const faceId = faceRecord.Face?.FaceId;
      
      if (faceId) {
        faceIds.push(faceId);
        
        // Store the unassociated face
        try {
          const { error: faceError } = await supabase
            .from('unassociated_faces')
            .insert({
              face_id: faceId,
              photo_id: photo.id,
              external_image_id: `${tempPhotoIdPrefix}${i}`,
              attributes: faceRecord.FaceDetail || {}
            });
            
          if (faceError) {
            console.error(`Error storing unassociated face for photo ${photo.id}:`, faceError);
          }
        } catch (faceStoreError) {
          console.error(`Error in storing unassociated face for photo ${photo.id}:`, faceStoreError);
        }
      }
    }
    
    // Update the photo's face_ids
    if (faceIds.length > 0) {
      await supabase.rpc('update_photo_face_ids', {
        photo_id: photo.id,
        new_face_ids: faceIds
      });
    }
    
    console.log(`Successfully processed photo ${photo.id} with ${faceIds.length} faces`);
  } catch (error) {
    console.error(`Error processing photo ${photo.id}:`, error);
  }
}

// Run the migration
migratePhotos()
  .then(() => {
    console.log('Face migration script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in migration script:', error);
    process.exit(1);
  }); 