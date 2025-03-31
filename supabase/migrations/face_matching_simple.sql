-- Simple photo matching function that avoids complex dependencies
-- This is a more basic approach that should work in most environments

-- Create a function to update photos with matched users in batches
CREATE OR REPLACE FUNCTION public.update_photos_with_face_ids(
  p_face_ids TEXT[],
  p_user_id UUID,
  p_user_data JSONB,
  p_batch_size INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_total_count INTEGER := 0;
  v_photo_record RECORD;
  v_updated_matches JSONB;
  v_current_user_check TEXT;
BEGIN
  -- Set a default user data if none provided
  IF p_user_data IS NULL OR p_user_data->>'userId' IS NULL THEN
    p_user_data := jsonb_build_object(
      'userId', p_user_id,
      'fullName', 'Unknown User',
      'confidence', 95
    );
  END IF;
  
  -- Convert the user ID to text for LIKE checks
  v_current_user_check := '"userId":"' || p_user_id || '"';
  
  -- Count total photos first
  SELECT COUNT(*) INTO v_total_count
  FROM photos
  WHERE 
    -- Photos with any face ID in the array
    face_ids && p_face_ids
    -- Only where the user is not already in matched_users
    AND NOT (matched_users::text LIKE '%' || v_current_user_check || '%');
    
  -- Process in small batches
  FOR v_photo_record IN
    SELECT 
      id, 
      COALESCE(matched_users, '[]'::jsonb) as matched_users
    FROM photos
    WHERE 
      face_ids && p_face_ids
      AND NOT (matched_users::text LIKE '%' || v_current_user_check || '%')
    LIMIT 100 -- Retrieve a limited amount to prevent overload
  LOOP
    BEGIN
      -- Double-check that user is not already in matched_users
      IF NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(v_photo_record.matched_users) as mu
        WHERE (mu->>'userId')::UUID = p_user_id
      ) THEN
        -- Add user to matched_users
        v_updated_matches := v_photo_record.matched_users || jsonb_build_array(p_user_data);
        
        -- Update photo
        UPDATE photos
        SET 
          matched_users = v_updated_matches,
          updated_at = now()
        WHERE id = v_photo_record.id;
        
        v_processed_count := v_processed_count + 1;
      END IF;
      
      -- Small delay to avoid overwhelming the database
      PERFORM pg_sleep(0.01);
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next photo
      RAISE NOTICE 'Error updating photo %: %', v_photo_record.id, SQLERRM;
    END;
    
    -- Break into smaller batches if limit reached
    IF v_processed_count >= p_batch_size THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'processed_count', v_processed_count,
    'total_count', v_total_count,
    'message', 'Successfully processed photos'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'processed_count', v_processed_count,
    'total_count', v_total_count,
    'message', 'Error processing face matching: ' || SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_photos_with_face_ids TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photos_with_face_ids TO anon;
GRANT EXECUTE ON FUNCTION public.update_photos_with_face_ids TO service_role;

-- Create function to get photos that match a specific user
CREATE OR REPLACE FUNCTION public.get_user_matched_photos(
  p_user_id UUID
)
RETURNS SETOF photos
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM photos p
  WHERE 
    -- Using text search for JSON which is more reliable
    p.matched_users::text LIKE '%"userId":"' || p_user_id || '"%'
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_matched_photos TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_matched_photos TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_matched_photos TO service_role; 