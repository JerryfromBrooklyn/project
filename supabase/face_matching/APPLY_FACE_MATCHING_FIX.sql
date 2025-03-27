-- Face Matching Fix Deployment Script
-- This script fixes the issue where photos with faces aren't being matched to registered users

-- Begin transaction to ensure all changes are applied atomically
BEGIN;

-- 1. Update the update_photo_face_ids_adapter function to handle matched_users
CREATE OR REPLACE FUNCTION public.update_photo_face_ids_adapter(
  p_id UUID,
  p_face_ids TEXT[],
  p_faces JSONB,
  p_matched_users JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
  v_match JSONB;
  v_confidence FLOAT;
BEGIN
  -- Update the photo record
  UPDATE public.photos
  SET 
    face_ids = p_face_ids,
    faces = p_faces,
    matched_users = p_matched_users,
    updated_at = NOW()
  WHERE id = p_id;
  
  -- Process face matching if we have face data
  IF p_faces IS NOT NULL AND jsonb_array_length(p_faces) > 0 THEN
    -- Call the face matching function to process face data
    PERFORM process_photo_faces_for_id(p_id);
    
    -- Also process any directly matched users from AWS face recognition
    IF p_matched_users IS NOT NULL AND jsonb_array_length(p_matched_users) > 0 THEN
      -- For each matched user, create an entry in photo_faces
      FOR i IN 0..jsonb_array_length(p_matched_users) - 1 LOOP
        v_match := jsonb_array_element(p_matched_users, i);
        v_user_id := (v_match->>'userId')::UUID;
        v_confidence := COALESCE((v_match->>'confidence')::FLOAT, 95.0);
        
        IF v_user_id IS NOT NULL THEN
          -- Insert directly into photo_faces
          INSERT INTO photo_faces (
            photo_id,
            user_id,
            confidence,
            face_id
          ) VALUES (
            p_id,
            v_user_id,
            v_confidence,
            'matched-by-aws'  -- Special marker to show this was matched by AWS
          )
          ON CONFLICT (photo_id, user_id) 
          DO UPDATE SET 
            confidence = v_confidence,
            updated_at = NOW();
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Photo face data updated successfully',
    'photo_id', p_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Error updating photo face data: ' || SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_photo_face_ids_adapter(UUID, TEXT[], JSONB, JSONB) TO authenticated;

-- 3. Create a function to help reprocess existing photos with faces
CREATE OR REPLACE FUNCTION public.reprocess_photos_for_face_matching()
RETURNS TABLE (
  photo_id UUID,
  success BOOLEAN,
  matched_users_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo RECORD;
  v_match_count INTEGER;
BEGIN
  -- Find photos with faces but no matches in photo_faces
  FOR v_photo IN 
    SELECT 
      p.id
    FROM
      public.photos p
    WHERE
      jsonb_array_length(p.faces) > 0
      AND NOT EXISTS (SELECT 1 FROM photo_faces pf WHERE pf.photo_id = p.id)
  LOOP
    BEGIN
      -- Call the process_photo_faces_for_id function for each photo
      PERFORM process_photo_faces_for_id(v_photo.id);
      
      -- Count how many matches were created
      SELECT COUNT(*) INTO v_match_count
      FROM photo_faces
      WHERE photo_id = v_photo.id;
      
      -- Return the results
      photo_id := v_photo.id;
      success := TRUE;
      matched_users_count := v_match_count;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Return the error
      photo_id := v_photo.id;
      success := FALSE;
      matched_users_count := 0;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- 4. Grant execute permission for the reprocessing function
GRANT EXECUTE ON FUNCTION public.reprocess_photos_for_face_matching() TO authenticated;

-- 5. Process any existing photos to find matches
DO $$
DECLARE
  v_processed INTEGER := 0;
  v_matched INTEGER := 0;
  v_photo RECORD;
BEGIN
  -- Find photos with faces but no matches in photo_faces
  FOR v_photo IN 
    SELECT 
      p.id
    FROM
      public.photos p
    WHERE
      jsonb_array_length(p.faces) > 0
      AND NOT EXISTS (SELECT 1 FROM photo_faces pf WHERE pf.photo_id = p.id)
    LIMIT 100 -- Process in smaller batches to avoid timeouts
  LOOP
    BEGIN
      -- Call the process_photo_faces_for_id function for each photo
      PERFORM process_photo_faces_for_id(v_photo.id);
      v_processed := v_processed + 1;
      
      -- Check if any matches were created
      IF EXISTS (SELECT 1 FROM photo_faces WHERE photo_id = v_photo.id) THEN
        v_matched := v_matched + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue
      RAISE NOTICE 'Error processing photo %: %', v_photo.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Processed % photos, found matches in % photos', v_processed, v_matched;
END;
$$;

COMMIT;

-- Instructions on next steps:
/*
FACE MATCHING FIX APPLIED SUCCESSFULLY

To verify the fix:
1. Run the SQL queries in verify_face_matching.sql to check current database state
2. Upload a new photo with faces
3. Check the browser console logs for face detection and matching
4. Verify the photo matches registered users correctly

To process more existing photos:
1. Run the reprocess_photos_for_face_matching() function
2. Example: SELECT * FROM reprocess_photos_for_face_matching() LIMIT 100;
3. Run this multiple times to process photos in batches

Remember to update the PhotoService.js file with the face matching changes:
1. Add searchFaces call after indexFacesInPhoto
2. Update matched_users in metadata
3. Pass matched_users to update_photo_face_ids_adapter RPC call
4. Include matched_users in direct database update fallback
*/ 