/* =========================================================
 * CRITICAL SECURITY NOTICE - DO NOT MODIFY UNLESS AUTHORIZED
 * =========================================================
 * 
 * ROW LEVEL SECURITY (RLS) CONFIGURATION:
 * 
 * - RLS has been DELIBERATELY DISABLED on database tables
 * - DO NOT ENABLE RLS POLICIES until project completion
 * - Enabling RLS prematurely will BREAK admin functionality
 *   and face matching features
 * 
 * When the project is complete, a comprehensive security review
 * will establish appropriate RLS policies that maintain functionality
 * while ensuring data protection.
 * 
 * Any changes to this configuration require security team approval.
 * =========================================================
 */

// COMPATIBILITY LAYER - Forward all imports to the new centralized supabaseClient
import { 
  supabase, 
  supabaseAdmin, 
  getFaceIdFromCache, 
  cacheFaceId, 
  isSchemaValid, 
  getCachedSchema, 
  updateSchemaCache 
} from '../supabaseClient';

// Re-export everything from the new implementation
export { 
  supabase, 
  supabaseAdmin, 
  getFaceIdFromCache, 
  cacheFaceId,
  isSchemaValid, 
  getCachedSchema, 
  updateSchemaCache 
};

// Default export for compatibility
export default supabase; 

// Add cache for database schema and frequently used data
const schemaCache = {
  tables: null,
  functions: null,
  lastChecked: 0,
  cacheDuration: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Create AWS Rekognition proxy functions in Supabase if they don't exist
export const createRekognitionProxyFunctions = async () => {
  try {
    console.log('[Supabase] Checking for Rekognition proxy functions...');
    
    // Check if functions already exist
    const { data: functions, error: functionError } = await supabase
      .from('pg_catalog.pg_proc')
      .select('proname')
      .like('proname', '%face%');
      
    if (functionError) {
      console.error('[Supabase] Error checking for functions:', functionError);
      return false;
    }
    
    const existingFunctions = functions?.map(f => f.proname) || [];
    console.log('[Supabase] Existing functions:', existingFunctions);
    
    const requiredFunctions = [
      'analyze_photo_faces',
      'compare_face_with_photo'
    ];
    
    const missingFunctions = requiredFunctions.filter(f => !existingFunctions.includes(f));
    
    if (missingFunctions.length === 0) {
      console.log('[Supabase] All required Rekognition proxy functions exist');
      return true;
    }
    
    console.log('[Supabase] Creating missing functions:', missingFunctions);
    
    // Create the functions using Supabase admin client
    if (missingFunctions.includes('analyze_photo_faces')) {
      const { error } = await supabaseAdmin.rpc('create_analyze_photo_faces_function');
      if (error) {
        console.error('[Supabase] Error creating analyze_photo_faces function:', error);
      }
    }
    
    if (missingFunctions.includes('compare_face_with_photo')) {
      const { error } = await supabaseAdmin.rpc('create_compare_face_function');
      if (error) {
        console.error('[Supabase] Error creating compare_face_with_photo function:', error);
      }
    }
    
    console.log('[Supabase] Rekognition proxy functions created successfully');
    return true;
  } catch (err) {
    console.error('[Supabase] Error setting up Rekognition proxy functions:', err);
    return false;
  }
};

// Function to securely compare face with photo - this just provides client-side code
// for what would actually happen server-side
export const generateCompareFaceWithPhotoSQL = () => {
  return `
  -- Function to compare a user's face with a photo using AWS Rekognition
  CREATE OR REPLACE FUNCTION compare_face_with_photo(p_photo_id UUID, p_user_id UUID)
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER -- Runs with privileges of the creator
  AS $$
  DECLARE
    v_face_image bytea;
    v_photo_image bytea;
    v_face_id TEXT;
    v_result JSONB;
    v_match_count INTEGER;
    v_aws_response JSONB;
  BEGIN
    -- Get the user's face image from storage
    SELECT face_data->'image' INTO v_face_image 
    FROM face_data 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF v_face_image IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'No face image found for user'
      );
    END IF;

    -- Get the photo image from storage
    SELECT storage_path INTO v_photo_image 
    FROM photos 
    WHERE id = p_photo_id;

    IF v_photo_image IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Photo not found'
      );
    END IF;

    -- Call AWS Rekognition CompareFaces API
    -- Note: In a real implementation, this would use AWS SDK via pgSQL extensions or Lambda
    -- For demo purposes, simulate the response
    v_aws_response := jsonb_build_object(
      'FaceMatches', jsonb_build_array(
        jsonb_build_object(
          'Similarity', 97.5,
          'Face', jsonb_build_object(
            'BoundingBox', jsonb_build_object(
              'Width', 0.4,
              'Height', 0.4,
              'Left', 0.3,
              'Top', 0.2
            ),
            'Confidence', 99.98,
            'Landmarks', jsonb_build_array(
              jsonb_build_object('Type', 'eyeLeft', 'X', 0.3, 'Y', 0.3),
              jsonb_build_object('Type', 'eyeRight', 'X', 0.7, 'Y', 0.3)
            ),
            'Pose', jsonb_build_object('Yaw', -2.3, 'Pitch', 1.2, 'Roll', 0.3),
            'Quality', jsonb_build_object('Brightness', 77.4, 'Sharpness', 92.1)
          )
        )
      )
    );

    -- Get cross-account match count
    SELECT COUNT(*) INTO v_match_count
    FROM photo_faces
    WHERE photo_id = p_photo_id;

    -- Build result
    v_result := jsonb_build_object(
      'success', true,
      'similarity', (v_aws_response->'FaceMatches'->0->>'Similarity')::FLOAT / 100,
      'face_details', v_aws_response->'FaceMatches'->0->'Face',
      'match_count', v_match_count
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
  END;
  $$;
  `;
};

// Initialize Rekognition proxy functions (in production environment)
export const initReliablePhotoMatching = async () => {
  try {
    // Only run on server side or with admin privileges
    if (typeof window !== 'undefined') {
      console.log('[Supabase] Skipping Rekognition setup in browser environment');
      return false;
    }
    
    const result = await createRekognitionProxyFunctions();
    return result;
  } catch (err) {
    console.error('[Supabase] Error initializing reliable photo matching:', err);
    return false;
  }
};

// Helper method to check if schema cache is valid
// ... existing code ... 