import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { RekognitionClient, CompareFacesCommand } from "npm:@aws-sdk/client-rekognition";

// Define CORS headers for local development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin during development
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Serve the function
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const { photoId, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing request for photoId: ${photoId}, userId: ${userId}`);

    // 1. Get user's face image path
    const { data: faceData, error: faceError } = await supabase
      .from('face_data')
      .select('face_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (faceError || !faceData?.face_data?.image_path) {
      throw new Error(`No face data found: ${faceError?.message || 'Missing face image path'}`);
    }

    const facePath = faceData.face_data.image_path;
    console.log(`Found face image path: ${facePath}`);

    // 2. Get photo path
    const { data: photoData, error: photoError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (photoError || !photoData?.storage_path) {
      throw new Error(`No photo found: ${photoError?.message || 'Missing storage path'}`);
    }

    const photoPath = photoData.storage_path;
    console.log(`Found photo path: ${photoPath}`);

    // 3. Download face image
    const { data: faceImageData, error: faceDownloadError } = await supabase.storage
      .from('face-data')
      .download(facePath);

    if (faceDownloadError || !faceImageData) {
      throw new Error(`Failed to download face image: ${faceDownloadError?.message}`);
    }

    // 4. Download photo image
    const { data: photoImageData, error: photoDownloadError } = await supabase.storage
      .from('photos')
      .download(photoPath);

    if (photoDownloadError || !photoImageData) {
      throw new Error(`Failed to download photo: ${photoDownloadError?.message}`);
    }

    // Convert both to Uint8Array
    const faceArrayBuffer = await faceImageData.arrayBuffer();
    const faceBytes = new Uint8Array(faceArrayBuffer);

    const photoArrayBuffer = await photoImageData.arrayBuffer();
    const photoBytes = new Uint8Array(photoArrayBuffer);

    // Call AWS Rekognition 
    const rekognition = new RekognitionClient({ 
      region: 'us-east-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') ?? ''
      }
    });

    // Make the API call and return results
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: faceBytes },
      TargetImage: { Bytes: photoBytes },
      SimilarityThreshold: 70  // Minimum similarity threshold (0-100)
    });

    const response = await rekognition.send(command);

    // Get cross-account match count
    const { count: matchCount } = await supabase
      .from('photo_faces')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', photoId);

    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const bestMatch = response.FaceMatches[0];
      console.log(`Found match with similarity: ${bestMatch.Similarity}%`);

      // Store the match result in the database for future reference
      await supabase
        .from('photo_faces')
        .upsert({
          photo_id: photoId,
          user_id: userId,
          confidence: bestMatch.Similarity / 100,
          face_details: bestMatch.Face,
          matched_at: new Date().toISOString()
        }, { onConflict: 'photo_id,user_id' });

      return new Response(JSON.stringify({
        success: true,
        similarity: bestMatch.Similarity / 100,
        face_details: bestMatch.Face,
        match_count: matchCount || 1
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders // Add CORS headers to the response
        }
      });
    } else {
      console.log('No face matches found');
      return new Response(JSON.stringify({
        success: false,
        similarity: 0,
        message: 'No face matches found',
        match_count: matchCount || 0
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders // Add CORS headers to the response
        }
      });
    }
  } catch (error) {
    console.error('Edge function error:', error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders // Add CORS headers to the response
      }
    });
  }
}); 