-- Create an efficient stored procedure for face matching updates
-- This shifts the heavy processing to the database server to avoid API rate limiting

-- First, create a helper function to update photos with face IDs in batches
CREATE OR REPLACE FUNCTION public.update_photos_with_face_ids(
  p_face_ids TEXT[],
  p_user_id UUID,
  p_user_data JSONB,
  p_batch_size INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_total_count INTEGER := 0;
  v_batch_photos RECORD;
  v_photo_id UUID;
  v_photo_ids UUID[] := '{}';
  v_user_data JSONB;
  v_current_matches JSONB;
  v_updated_matches JSONB;
  v_batch_offset INTEGER := 0;
  v_batch_size INTEGER := LEAST(p_batch_size, 20); -- Cap batch size at 20
BEGIN
  -- Ensure we have valid user data
  IF p_user_data IS NULL OR p_user_data->>'userId' IS NULL THEN
    v_user_data := jsonb_build_object(
      'userId', p_user_id,
      'fullName', 'Unknown User',
      'confidence', 95
    );
  ELSE
    v_user_data := p_user_data;
  END IF;
  
  -- First, get all photo IDs that contain any of these face IDs
  -- but don't already have this user in matched_users
  -- Using safer text-based filtering to avoid issues with JSON containment operators
  WITH matching_photos AS (
    SELECT p.id
    FROM photos p
    WHERE 
      -- Photos with face ID in face_ids array using the && (array overlap) operator
      (p.face_ids && p_face_ids)
      -- Only where the user is not already in matched_users using text LIKE
      -- This is more reliable than JSON operators when the structure might vary
      AND NOT (p.matched_users::text LIKE '%"userId":"' || p_user_id || '"%')  
  )
  SELECT array_agg(id) INTO v_photo_ids
  FROM matching_photos;
  
  -- Get the total count of photos to process
  IF v_photo_ids IS NOT NULL THEN
    v_total_count := array_length(v_photo_ids, 1);
  ELSE
    v_total_count := 0;
  END IF;
  
  -- If no photos to process, return early
  IF v_photo_ids IS NULL OR array_length(v_photo_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'processed_count', 0,
      'total_count', 0,
      'message', 'No matching photos found'
    );
  END IF;
  
  -- Process photos in batches to avoid timeouts
  WHILE v_batch_offset < v_total_count LOOP
    -- Get next batch of photos
    FOR v_photo_id IN 
      SELECT unnest(v_photo_ids[v_batch_offset+1:LEAST(v_batch_offset+v_batch_size, v_total_count)])
    LOOP
      BEGIN
        -- Get current matched_users
        SELECT matched_users INTO v_current_matches
        FROM photos
        WHERE id = v_photo_id;
        
        -- Initialize as empty array if null
        IF v_current_matches IS NULL THEN
          v_current_matches := '[]'::JSONB;
        END IF;
        
        -- Double-check user not already in matched_users
        -- This is a safety check in case the filter above had issues
        IF NOT EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(v_current_matches) AS elem 
          WHERE elem->>'userId' = p_user_id::text
        ) THEN
          -- Add the new match to the array
          v_updated_matches := v_current_matches || jsonb_build_array(v_user_data);
          
          -- Update the photo
          UPDATE photos 
          SET 
            matched_users = v_updated_matches,
            updated_at = NOW()
          WHERE id = v_photo_id;
          
          v_processed_count := v_processed_count + 1;
        END IF;
        
        -- Add small delay to avoid overwhelming the system
        PERFORM pg_sleep(0.01);
      EXCEPTION WHEN OTHERS THEN
        -- Log error and continue with next photo
        RAISE NOTICE 'Error updating photo %: %', v_photo_id, SQLERRM;
      END;
    END LOOP;
    
    -- Move to next batch
    v_batch_offset := v_batch_offset + v_batch_size;
    
    -- Add small delay between batches to avoid long transactions
    PERFORM pg_sleep(0.1);
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