import { supabase } from '../src/lib/supabaseClient.js';
import { rekognitionClient, COLLECTION_ID } from '../src/config/aws-config.js';
import { IndexFacesCommand, DeleteCollectionCommand, CreateCollectionCommand } from '@aws-sdk/client-rekognition';

/**
 * This script fixes the AWS Rekognition collection by:
 * 1. Retrieving all user face data from the database
 * 2. Deleting the existing AWS Rekognition collection 
 * 3. Creating a new collection
 * 4. Re-indexing all user faces with proper external IDs (user UUIDs)
 */
async function fixFaceCollection() {
  try {
    console.log('🔧 Starting face collection repair...');
    
    // Step 1: Get all user face data from the database
    console.log('📊 Fetching user face data from database...');
    const { data: faceData, error: faceDataError } = await supabase
      .from('face_data')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (faceDataError) {
      throw new Error(`Error fetching face data: ${faceDataError.message}`);
    }
    
    if (!faceData || faceData.length === 0) {
      console.log('⚠️ No face data found in the database. Collection will be reset but no faces will be indexed.');
    } else {
      console.log(`✅ Found ${faceData.length} face records in the database.`);
    }
    
    // Step 2: Delete the existing collection
    console.log(`🗑️ Deleting existing collection: ${COLLECTION_ID}...`);
    try {
      await rekognitionClient.send(new DeleteCollectionCommand({
        CollectionId: COLLECTION_ID
      }));
      console.log('✅ Existing collection deleted');
    } catch (deleteError) {
      // If collection doesn't exist, that's fine, we'll create a new one
      console.log('ℹ️ No existing collection to delete or error deleting:', deleteError.message);
    }
    
    // Step 3: Create a new collection
    console.log(`🆕 Creating new collection: ${COLLECTION_ID}...`);
    try {
      await rekognitionClient.send(new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
        Tags: {
          Environment: 'production',
          Application: 'shmong',
          RepairedAt: new Date().toISOString()
        }
      }));
      console.log('✅ New collection created');
    } catch (createError) {
      throw new Error(`Error creating collection: ${createError.message}`);
    }
    
    // Step 4: Re-index all user faces with correct external IDs
    if (faceData && faceData.length > 0) {
      console.log('🔄 Re-indexing user faces...');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const face of faceData) {
        try {
          if (!face.user_id) {
            console.log(`⚠️ Skipping face record ${face.id} - missing user_id`);
            continue;
          }
          
          // Get the face image from storage
          console.log(`📷 Processing face for user ${face.user_id}...`);
          
          // Check if face_data contains image path info
          if (!face.face_data?.image_path) {
            console.log(`⚠️ No image path found for user ${face.user_id}, skipping...`);
            continue;
          }
          
          const { data: imageData, error: imageError } = await supabase.storage
            .from('face-data')
            .download(face.face_data.image_path);
            
          if (imageError || !imageData) {
            console.log(`⚠️ Could not download face image for user ${face.user_id}: ${imageError?.message || 'No data'}`);
            continue;
          }
          
          // Convert to ArrayBuffer then Uint8Array
          const arrayBuffer = await imageData.arrayBuffer();
          const imageBytes = new Uint8Array(arrayBuffer);
          
          // Index face with proper external ID (user UUID)
          console.log(`🔍 Indexing face for user ${face.user_id}...`);
          const command = new IndexFacesCommand({
            CollectionId: COLLECTION_ID,
            Image: { Bytes: imageBytes },
            ExternalImageId: face.user_id,  // This is the key - using the actual user ID
            DetectionAttributes: ['ALL'],
            MaxFaces: 1,
            QualityFilter: 'AUTO'
          });
          
          const response = await rekognitionClient.send(command);
          
          if (!response.FaceRecords || response.FaceRecords.length === 0) {
            console.log(`⚠️ No face indexed for user ${face.user_id}`);
            errorCount++;
            continue;
          }
          
          const faceId = response.FaceRecords[0].Face?.FaceId;
          
          // Update the face_data record with the new AWS face ID
          const { error: updateError } = await supabase
            .from('face_data')
            .update({
              face_id: faceId,
              face_data: {
                ...face.face_data,
                aws_face_id: faceId,
                repaired_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', face.id);
            
          if (updateError) {
            console.log(`⚠️ Error updating face record for user ${face.user_id}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`✅ Successfully re-indexed face for user ${face.user_id} with face ID ${faceId}`);
            successCount++;
          }
          
        } catch (faceError) {
          console.error(`❌ Error processing face for user ${face.user_id}:`, faceError);
          errorCount++;
        }
      }
      
      console.log(`📊 Re-indexing summary: ${successCount} successful, ${errorCount} errors`);
    }
    
    console.log('✅ Face collection repair completed!');
    
    // Return success
    return {
      success: true,
      message: `Face collection repaired. ${faceData?.length || 0} faces processed.`
    };
    
  } catch (error) {
    console.error('❌ Error fixing face collection:', error);
    return {
      success: false,
      message: `Error fixing face collection: ${error.message}`
    };
  }
}

// Run the script directly if not being imported
if (typeof require !== 'undefined' && require.main === module) {
  fixFaceCollection()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else if (typeof import.meta !== 'undefined' && import.meta.url === import.meta.main) {
  // For ES modules
  fixFaceCollection()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { fixFaceCollection }; 