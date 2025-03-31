-- Add helper function to update matched_users array
-- This function handles stringification issues and array manipulations safely
CREATE OR REPLACE FUNCTION update_photo_matched_users(
  p_photo_id UUID,
  p_user_match JSONB,
  p_table_name TEXT DEFAULT 'photos'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_matched_users JSONB;
  v_user_id UUID;
  v_updated BOOLEAN := FALSE;
BEGIN
  -- Get user ID from match object
  v_user_id := (p_user_match->>'userId')::UUID;
  
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Invalid user ID in match object'
    );
  END IF;
  
  -- Handle multiple table options safely
  IF p_table_name = 'photos' THEN
    -- Get current matched_users array
    EXECUTE 'SELECT matched_users FROM photos WHERE id = $1'
    INTO v_matched_users
    USING p_photo_id;
  ELSIF p_table_name = 'simple_photos' THEN
    -- Get from simple_photos table
    EXECUTE 'SELECT matched_users FROM simple_photos WHERE id = $1'
    INTO v_matched_users
    USING p_photo_id;
  ELSE
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Invalid table name: ' || p_table_name
    );
  END IF;
  
  -- Initialize as empty array if null
  IF v_matched_users IS NULL THEN
    v_matched_users := '[]'::JSONB;
  END IF;
  
  -- Check if user already exists in matched_users
  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_matched_users) as match
    WHERE (match->>'userId')::UUID = v_user_id
       OR (match->>'user_id')::UUID = v_user_id
  ) THEN
    -- Add the new match to the array
    v_matched_users := v_matched_users || jsonb_build_array(p_user_match);
    
    -- Update the table
    IF p_table_name = 'photos' THEN
      UPDATE photos 
      SET 
        matched_users = v_matched_users,
        updated_at = NOW()
      WHERE id = p_photo_id;
    ELSE
      UPDATE simple_photos 
      SET 
        matched_users = v_matched_users,
        updated_at = NOW()
      WHERE id = p_photo_id;
    END IF;
    
    v_updated := TRUE;
  END IF;
  
  RETURN jsonb_build_object(
    'success', v_updated,
    'message', CASE WHEN v_updated THEN 'User match added successfully' ELSE 'User already in matched_users' END,
    'photo_id', p_photo_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'message', 'Error updating matched_users: ' || SQLERRM,
    'code', SQLSTATE,
    'photo_id', p_photo_id
  );
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION update_photo_matched_users TO authenticated;
GRANT EXECUTE ON FUNCTION update_photo_matched_users TO anon;
GRANT EXECUTE ON FUNCTION update_photo_matched_users TO service_role;

-- Add a version that can repair all photos for a user
CREATE OR REPLACE FUNCTION repair_user_matches(
  p_user_id UUID,
  p_face_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_photo_record RECORD;
  v_user_data RECORD;
  v_user_match JSONB;
BEGIN
  -- Get user details for the match
  SELECT u.id, u.email, COALESCE(u.full_name, u.email) as full_name, u.avatar_url
  INTO v_user_data
  FROM auth.users u
  WHERE u.id = p_user_id;
  
  IF v_user_data.id IS NULL THEN
    -- Try fallback to profiles
    SELECT p.id, p.email, COALESCE(p.full_name, p.email) as full_name, p.avatar_url
    INTO v_user_data
    FROM profiles p
    WHERE p.id = p_user_id;
  END IF;
  
  -- Build standard user match object
  v_user_match := jsonb_build_object(
    'userId', p_user_id,
    'faceId', p_face_id,
    'fullName', COALESCE(v_user_data.full_name, 'Unknown User'),
    'email', v_user_data.email,
    'avatarUrl', v_user_data.avatar_url,
    'similarity', 98,
    'confidence', 99
  );
  
  -- First repair photos table
  FOR v_photo_record IN
    SELECT p.id
    FROM photos p
    WHERE 
      -- Photos with face ID in the face_ids array
      (p.face_ids IS NOT NULL AND p.face_ids @> ARRAY[p_face_id])
      OR
      -- Photos with face ID in the faces array
      (p.faces IS NOT NULL AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(p.faces) face
        WHERE face->>'faceId' = p_face_id
      ))
      -- Only where the user is not already in matched_users
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(p.matched_users, '[]'::jsonb)) mu
        WHERE (mu->>'userId')::UUID = p_user_id OR (mu->>'user_id')::UUID = p_user_id
      )
  LOOP
    -- Update each photo
    PERFORM update_photo_matched_users(v_photo_record.id, v_user_match, 'photos');
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  -- Then repair simple_photos table
  FOR v_photo_record IN
    SELECT p.id
    FROM simple_photos p
    WHERE 
      -- Photos with face ID in the face_ids array
      (p.face_ids IS NOT NULL AND p.face_ids @> ARRAY[p_face_id])
      OR
      -- Photos with face ID in the faces array
      (p.faces IS NOT NULL AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(p.faces) face
        WHERE face->>'faceId' = p_face_id
      ))
      -- Only where the user is not already in matched_users
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(p.matched_users, '[]'::jsonb)) mu
        WHERE (mu->>'userId')::UUID = p_user_id OR (mu->>'user_id')::UUID = p_user_id
      )
  LOOP
    -- Update each photo
    PERFORM update_photo_matched_users(v_photo_record.id, v_user_match, 'simple_photos');
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'updated_count', v_updated_count,
    'user_id', p_user_id,
    'face_id', p_face_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'message', 'Error repairing user matches: ' || SQLERRM,
    'code', SQLSTATE,
    'user_id', p_user_id
  );
END;
$$;

-- Grant access to the repair function
GRANT EXECUTE ON FUNCTION repair_user_matches TO authenticated;
GRANT EXECUTE ON FUNCTION repair_user_matches TO service_role; 