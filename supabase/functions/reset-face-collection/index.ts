import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  RekognitionClient,
  IndexFacesCommand, 
  DeleteCollectionCommand, 
  CreateCollectionCommand 
} from 'https://esm.sh/@aws-sdk/client-rekognition@3.360.0'

// Create a single Supabase client for interacting with your database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// AWS Rekognition configuration
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID') || ''
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''
const COLLECTION_ID = Deno.env.get('AWS_REKOGNITION_COLLECTION_ID') || 'shmong-faces'

// Create rekognition client
const rekognitionClient = new RekognitionClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
})

// Helper function to convert ArrayBuffer to Uint8Array for AWS SDK
const arrayBufferToUint8Array = (buffer: ArrayBuffer): Uint8Array => {
  return new Uint8Array(buffer);
};

// Helper function to update reset status
async function updateResetStatus(resetId: number, status: string, message: string) {
  try {
    return await supabase.rpc('update_face_collection_reset_status', {
      p_reset_id: resetId,
      p_status: status,
      p_message: message
    });
  } catch (error) {
    console.error('Error updating reset status:', error);
    // Continue execution despite error
  }
}

// Main function to reset the face collection
async function resetFaceCollection(resetId: number) {
  try {
    // Update status to processing
    await updateResetStatus(resetId, 'processing', 'Starting face collection reset...');
    
    // Step 1: Delete the existing collection if it exists
    try {
      await updateResetStatus(resetId, 'processing', 'Deleting existing face collection...');
      await rekognitionClient.send(new DeleteCollectionCommand({
        CollectionId: COLLECTION_ID
      }));
      await updateResetStatus(resetId, 'processing', 'Existing face collection deleted');
    } catch (deleteError: any) {
      // If collection doesn't exist, that's fine - continue
      await updateResetStatus(resetId, 'processing', `No existing collection found or already deleted: ${deleteError.message || 'Unknown error'}`);
    }
    
    // Step 2: Create a new collection
    try {
      await updateResetStatus(resetId, 'processing', 'Creating new face collection...');
      await rekognitionClient.send(new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
        Tags: {
          Environment: 'production',
          Application: 'shmong',
          RepairedAt: new Date().toISOString()
        }
      }));
      await updateResetStatus(resetId, 'processing', 'New face collection created');
    } catch (createError: any) {
      await updateResetStatus(resetId, 'failed', `Error creating face collection: ${createError.message || 'Unknown error'}`);
      return { success: false, message: `Error creating face collection: ${createError.message || 'Unknown error'}` };
    }
    
    // Step 3: Get all face data from the database
    await updateResetStatus(resetId, 'processing', 'Fetching user face data...');
    const { data: faceData, error: faceDataError } = await supabase
      .from('face_data')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (faceDataError) {
      await updateResetStatus(resetId, 'failed', `Error fetching face data: ${faceDataError.message}`);
      return { success: false, message: `Error fetching face data: ${faceDataError.message}` };
    }
    
    if (!faceData || faceData.length === 0) {
      await updateResetStatus(resetId, 'completed', 'No face data found to reindex. Collection has been reset.');
      return { success: true, message: 'No face data found to reindex. Collection has been reset.' };
    }
    
    // Step 4: Reindex each face with the correct user ID
    await updateResetStatus(resetId, 'processing', `Reindexing ${faceData.length} user faces...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const face of faceData) {
      try {
        if (!face.user_id) {
          console.log(`Skipping face record ${face.id} - missing user_id`);
          continue;
        }
        
        // Get the face image from storage
        if (!face.face_data?.image_path) {
          console.log(`No image path found for user ${face.user_id}, skipping...`);
          continue;
        }
        
        const { data: imageData, error: imageError } = await supabase.storage
          .from('face-data')
          .download(face.face_data.image_path);
          
        if (imageError || !imageData) {
          console.log(`Could not download face image for user ${face.user_id}: ${imageError?.message || 'No data'}`);
          continue;
        }
        
        // Convert to ArrayBuffer then Uint8Array
        const arrayBuffer = await imageData.arrayBuffer();
        const imageBytes = arrayBufferToUint8Array(arrayBuffer);
        
        // Index face with proper external ID (user UUID)
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
          console.log(`No face indexed for user ${face.user_id}`);
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
          console.log(`Error updating face record for user ${face.user_id}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`Successfully re-indexed face for user ${face.user_id} with face ID ${faceId}`);
          successCount++;
        }
      } catch (faceError: any) {
        console.error(`Error processing face for user ${face.user_id}:`, faceError);
        errorCount++;
      }
      
      // Update progress periodically
      if ((successCount + errorCount) % 5 === 0 || (successCount + errorCount) === faceData.length) {
        await updateResetStatus(
          resetId, 
          'processing', 
          `Progress: ${successCount + errorCount}/${faceData.length} faces processed (${successCount} successful, ${errorCount} errors)`
        );
      }
    }
    
    // Step 5: Update final status
    const finalMessage = `Face collection reset complete. ${successCount} faces successfully reindexed, ${errorCount} errors.`;
    await updateResetStatus(resetId, 'completed', finalMessage);
    
    return { 
      success: true, 
      message: finalMessage,
      stats: {
        totalFaces: faceData.length,
        successCount,
        errorCount
      }
    };
  } catch (error: any) {
    console.error('Error in resetFaceCollection:', error);
    await updateResetStatus(resetId, 'failed', `Error resetting face collection: ${error.message || 'Unknown error'}`);
    return { success: false, message: `Error resetting face collection: ${error.message || 'Unknown error'}` };
  }
}

serve(async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Get request details
    const requestBody = await req.json();
    const { reset_id, direct_call, user_id } = requestBody;
    
    // Handle direct calls (skipping database checks)
    if (direct_call === true) {
      console.log('Direct call detected - bypassing database checks');
      
      // Create a temporary reset ID if one wasn't provided
      const tempResetId = reset_id || Date.now();
      
      // Run the collection reset
      const result = await resetFaceCollection(tempResetId);
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
    
    // Normal flow with authentication
    
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authorization header missing' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user information
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
    
    // Automatic admin access for jerry@jerry.com
    if (user.email === 'jerry@jerry.com') {
      console.log('Special user detected - granting automatic admin access');
      const result = await resetFaceCollection(reset_id);
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, message: 'Admin privileges required' }),
        { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
    
    // Run the reset operation
    const result = await resetFaceCollection(reset_id);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Error: ${error.message || 'Unknown error'}` }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
}); 