-- Drop function if it exists already
DROP FUNCTION IF EXISTS public.reset_face_collection();

-- Create function to reset face collection
CREATE OR REPLACE FUNCTION public.reset_face_collection()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Delete all face_data entries
  DELETE FROM face_data;
  
  -- Reset face collection status
  UPDATE system_settings
  SET value = jsonb_build_object(
    'collection_exists', false,
    'last_reset', NOW(),
    'status', 'reset',
    'face_count', 0
  )
  WHERE key = 'face_collection_status';
  
  -- If no row exists, insert one
  IF NOT FOUND THEN
    INSERT INTO system_settings (key, value)
    VALUES (
      'face_collection_status',
      jsonb_build_object(
        'collection_exists', false,
        'last_reset', NOW(),
        'status', 'reset',
        'face_count', 0
      )
    );
  END IF;
  
  v_result = jsonb_build_object(
    'success', true,
    'message', 'Face collection reset successfully',
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reset_face_collection TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_face_collection TO service_role;

-- Create function to verify if a photo exists in any table
DROP FUNCTION IF EXISTS public.verify_photo_exists(UUID);

CREATE OR REPLACE FUNCTION public.verify_photo_exists(
  p_photo_id UUID
)
RETURNS TABLE (
  id UUID,
  source_table TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check photos table
  IF EXISTS (SELECT 1 FROM photos WHERE id = p_photo_id) THEN
    RETURN QUERY
    SELECT p_photo_id, 'photos'::TEXT
    FROM photos
    WHERE id = p_photo_id;
    RETURN;
  END IF;
  
  -- Check simple_photos table
  IF EXISTS (SELECT 1 FROM simple_photos WHERE id = p_photo_id) THEN
    RETURN QUERY
    SELECT p_photo_id, 'simple_photos'::TEXT
    FROM simple_photos
    WHERE id = p_photo_id;
    RETURN;
  END IF;
  
  -- No match found
  RETURN QUERY
  SELECT p_photo_id, 'none'::TEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_photo_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_photo_exists TO anon;
GRANT EXECUTE ON FUNCTION public.verify_photo_exists TO service_role;

-- Create complete photo insert function to handle both tables
DROP FUNCTION IF EXISTS public.complete_photo_insert(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, TEXT[], JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.complete_photo_insert(
  p_id UUID,
  p_user_id UUID,
  p_storage_path TEXT,
  p_public_url TEXT,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_faces JSONB DEFAULT '[]'::JSONB,
  p_face_ids TEXT[] DEFAULT '{}'::TEXT[],
  p_matched_users JSONB DEFAULT '[]'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_error TEXT;
  v_success BOOLEAN := false;
BEGIN
  -- Try to insert into photos table first
  BEGIN
    INSERT INTO photos (
      id,
      uploaded_by,
      storage_path,
      public_url,
      url,
      file_size,
      file_type,
      faces,
      face_ids,
      matched_users,
      title,
      location,
      venue,
      tags,
      event_details,
      date_taken
    )
    VALUES (
      p_id,
      p_user_id,
      p_storage_path,
      p_public_url,
      p_public_url,
      p_file_size,
      p_file_type,
      p_faces,
      p_face_ids,
      p_matched_users,
      p_metadata->>'title',
      p_metadata->'location',
      p_metadata->'venue',
      p_metadata->'tags',
      p_metadata->'event_details',
      (p_metadata->>'date_taken')::TIMESTAMPTZ
    );
    
    v_success := true;
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Photo inserted into photos table',
      'table', 'photos',
      'photo_id', p_id
    );
    
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    
    -- Fall back to simple_photos table
    BEGIN
      INSERT INTO simple_photos (
        id,
        uploaded_by,
        storage_path,
        public_url,
        file_size,
        file_type,
        faces,
        face_ids,
        matched_users,
        title,
        location,
        venue,
        tags,
        event_details,
        date_taken
      )
      VALUES (
        p_id,
        p_user_id,
        p_storage_path,
        p_public_url,
        p_file_size,
        p_file_type,
        p_faces,
        p_face_ids,
        p_matched_users,
        p_metadata->>'title',
        p_metadata->'location',
        p_metadata->'venue',
        p_metadata->'tags',
        p_metadata->'event_details',
        (p_metadata->>'date_taken')::TIMESTAMPTZ
      );
      
      v_success := true;
      v_result := jsonb_build_object(
        'success', true,
        'message', 'Photo inserted into simple_photos table (fallback)',
        'table', 'simple_photos',
        'photo_id', p_id,
        'original_error', v_error
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_result := jsonb_build_object(
        'success', false,
        'message', 'Failed to insert photo into any table',
        'photos_error', v_error,
        'simple_photos_error', SQLERRM,
        'photo_id', p_id
      );
    END;
  END;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.complete_photo_insert TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_photo_insert TO anon;
GRANT EXECUTE ON FUNCTION public.complete_photo_insert TO service_role; 