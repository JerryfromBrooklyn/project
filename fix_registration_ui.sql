-- ================================
-- Fix for Face Registration UI
-- ================================

-- Make sure the log_face_registration_attempt function is working properly
CREATE OR REPLACE FUNCTION log_face_registration_attempt(
  p_user_id UUID,
  p_face_id TEXT,
  p_face_data JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_existing_record RECORD;
  v_new_record_id UUID;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User ID does not exist',
      'code', 'USER_NOT_FOUND'
    );
  END IF;
  
  -- Check if face_id is provided
  IF p_face_id IS NULL OR p_face_id = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'face_id cannot be empty',
      'code', 'MISSING_FACE_ID'
    );
  END IF;
  
  -- Check for existing face registration for this user
  SELECT * INTO v_existing_record
  FROM face_data
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF FOUND THEN
    -- Update existing record instead of creating a new one
    UPDATE face_data
    SET 
      face_id = p_face_id,
      face_data = p_face_data,
      updated_at = NOW()
    WHERE id = v_existing_record.id
    RETURNING id INTO v_new_record_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Face data updated successfully',
      'face_id', p_face_id,
      'record_id', v_new_record_id,
      'code', 'UPDATED'
    );
  ELSE
    -- Create new record
    INSERT INTO face_data (user_id, face_id, face_data)
    VALUES (p_user_id, p_face_id, p_face_data)
    RETURNING id INTO v_new_record_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Face data registered successfully',
      'face_id', p_face_id,
      'record_id', v_new_record_id,
      'code', 'CREATED'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'code', 'DATABASE_ERROR'
    );
END;
$$ LANGUAGE plpgsql; 