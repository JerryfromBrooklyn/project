-- COMPREHENSIVE FUNCTION FIXES
-- This script addresses all function parameter issues and ensures proper face matching

-- Begin transaction to ensure all changes are applied atomically
BEGIN;

--------------------------------------------------
-- 1. FIX FUNCTION PARAMETER AMBIGUITY ISSUES
--------------------------------------------------

-- Drop the overloaded functions that are causing ambiguity
DROP FUNCTION IF EXISTS public.update_photo_basic_details(date, jsonb, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.update_photo_basic_details(date, jsonb, uuid, uuid, jsonb, text, jsonb);

-- Update the original function to handle default parameters properly
CREATE OR REPLACE FUNCTION public.update_photo_basic_details(
    p_id UUID,
    p_title TEXT,
    p_date_taken DATE,
    p_event_details JSONB,
    p_venue JSONB,
    p_location JSONB DEFAULT NULL,
    p_event_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
    v_photo_exists BOOLEAN;
    v_has_permissions BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate photo exists
    SELECT EXISTS(
        SELECT 1 FROM public.photos WHERE id = p_id
    ) INTO v_photo_exists;
    
    IF NOT v_photo_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Photo not found',
            'code', 'NOT_FOUND'
        );
    END IF;
    
    -- Check if user has permission (either uploaded the photo or is admin)
    SELECT EXISTS(
        SELECT 1 
        FROM public.photos 
        WHERE id = p_id AND (uploaded_by = v_user_id OR v_user_id IN (SELECT id FROM public.admins))
    ) INTO v_has_permissions;
    
    IF NOT v_has_permissions THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Permission denied',
            'code', 'PERMISSION_DENIED'
        );
    END IF;
    
    -- Update the photo with error handling
    BEGIN
        UPDATE public.photos 
        SET 
            title = COALESCE(p_title, title),
            date_taken = COALESCE(p_date_taken, date_taken),
            event_details = COALESCE(p_event_details, event_details),
            venue = COALESCE(p_venue, venue),
            location = COALESCE(p_location, location),
            event_id = COALESCE(p_event_id, event_id),
            updated_at = NOW()
        WHERE id = p_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Photo updated successfully',
            'photo_id', p_id
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error updating photo: ' || SQLERRM,
            'code', SQLSTATE
        );
    END;
END;
$$;

-- Create an adapter function with the parameter order expected by the frontend
CREATE OR REPLACE FUNCTION public.update_photo_details_adapter(
  p_date_taken DATE,
  p_event_details JSONB,
  p_id UUID,
  p_title TEXT,
  p_venue JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the original function with explicit casting to avoid ambiguity
  RETURN public.update_photo_basic_details(
    p_id,
    p_title,
    p_date_taken,
    p_event_details,
    p_venue,
    NULL::JSONB,  -- p_location
    NULL::UUID    -- p_event_id
  );
END;
$$;

-- Create another adapter for the signature from the error hint
CREATE OR REPLACE FUNCTION public.update_photo_details_adapter2(
  p_date_taken DATE,
  p_event_details JSONB,
  p_event_id UUID,
  p_id UUID,
  p_location JSONB,
  p_title TEXT,
  p_venue JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the original function with explicit casting to avoid ambiguity
  RETURN public.update_photo_basic_details(
    p_id,
    p_title,
    p_date_taken,
    p_event_details,
    p_venue,
    p_location,
    p_event_id
  );
END;
$$;

--------------------------------------------------
-- 2. CREATE FACE MATCHING ADAPTER FUNCTIONS
--------------------------------------------------

-- Create an adapter function for update_photo_face_ids
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

-- Create a helper function to process face matches for a specific photo ID
CREATE OR REPLACE FUNCTION public.process_photo_faces_for_id(p_photo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_face JSONB;
  v_face_id TEXT;
  v_confidence FLOAT;
  v_photo_record RECORD;
BEGIN
  -- Get the photo record
  SELECT * INTO v_photo_record FROM public.photos WHERE id = p_photo_id;
  
  -- Only process if there are faces in the photo
  IF v_photo_record.faces IS NOT NULL AND jsonb_array_length(v_photo_record.faces) > 0 THEN
    -- For each face in the array
    FOR v_face IN SELECT jsonb_array_elements(v_photo_record.faces)
    LOOP
      -- Get the face_id from the face object
      v_face_id := v_face->>'faceId';
      
      IF v_face_id IS NOT NULL THEN
        -- Default confidence if not specified
        v_confidence := COALESCE((v_face->>'confidence')::float, 95.0);
        
        -- Check if this face is registered to any user
        FOR v_user_record IN
          SELECT user_id 
          FROM face_data 
          WHERE face_id = v_face_id
        LOOP
          -- Create a photo_faces entry for this match
          INSERT INTO photo_faces (
            photo_id, 
            user_id, 
            confidence,
            face_id
          ) VALUES (
            p_photo_id,
            v_user_record.user_id,
            v_confidence,
            v_face_id
          )
          ON CONFLICT (photo_id, user_id) 
          DO UPDATE SET 
            confidence = v_confidence,
            face_id = v_face_id;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END;
$$;

--------------------------------------------------
-- 3. GRANT EXECUTE PERMISSIONS
--------------------------------------------------

-- Grant appropriate permissions to allow function execution
GRANT EXECUTE ON FUNCTION public.update_photo_basic_details(UUID, TEXT, DATE, JSONB, JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_details_adapter(DATE, JSONB, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_details_adapter2(DATE, JSONB, UUID, UUID, JSONB, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_face_ids_adapter(UUID, TEXT[], JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_photo_faces_for_id(UUID) TO authenticated;

--------------------------------------------------
-- 4. REPROCESS EXISTING PHOTOS
--------------------------------------------------

-- Run a scan on existing photos to ensure face matching is up to date
DO $$
DECLARE
  v_photo_record RECORD;
  v_counter INTEGER := 0;
BEGIN
  -- Process all photos with faces
  FOR v_photo_record IN 
    SELECT id
    FROM photos
    WHERE faces IS NOT NULL AND jsonb_array_length(faces) > 0
  LOOP
    -- Process face matches for this photo
    PERFORM process_photo_faces_for_id(v_photo_record.id);
    v_counter := v_counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Processed % photos for face matching', v_counter;
END;
$$;

-- Commit all changes
COMMIT; 