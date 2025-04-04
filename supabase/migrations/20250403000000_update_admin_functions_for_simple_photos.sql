-- Update the debug_force_update_photo function to check both photos and simple_photos tables
CREATE OR REPLACE FUNCTION debug_force_update_photo(p_id text, user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uuid_id uuid;
  uuid_user_id uuid;
  match_obj jsonb;
  result jsonb;
  photo_exists boolean;
  simple_photo_exists boolean;
BEGIN
  -- Convert IDs to UUID
  BEGIN
    uuid_id := p_id::uuid;
    uuid_user_id := user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid UUID format',
      'photo_id', p_id,
      'user_id', user_id
    );
  END;
  
  -- Create a minimal match object
  match_obj := jsonb_build_object(
    'userId', user_id,
    'fullName', 'Debug User',
    'matchedAt', now()::text,
    'confidence', 99.9,
    'matchType', 'debug'
  );
  
  -- Check if the photo exists in photos table
  SELECT EXISTS (SELECT 1 FROM photos WHERE id = uuid_id) INTO photo_exists;
  
  -- Check if the photo exists in simple_photos table
  SELECT EXISTS (SELECT 1 FROM simple_photos WHERE id = uuid_id) INTO simple_photo_exists;
  
  -- Update the appropriate table
  BEGIN
    IF photo_exists THEN
      -- Update photos table
      EXECUTE 'UPDATE photos SET matched_users = $1, updated_at = NOW() WHERE id = $2'
      USING jsonb_build_array(match_obj), uuid_id;
      
      -- Verify it worked
      SELECT to_jsonb(photos.*) INTO result FROM photos WHERE id = uuid_id;
    ELSIF simple_photo_exists THEN
      -- Update simple_photos table
      EXECUTE 'UPDATE simple_photos SET matched_users = $1, updated_at = NOW() WHERE id = $2'
      USING jsonb_build_array(match_obj), uuid_id;
      
      -- Verify it worked
      SELECT to_jsonb(simple_photos.*) INTO result FROM simple_photos WHERE id = uuid_id;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Photo not found in any table',
        'photo_id', p_id
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Force update successful',
      'table_used', CASE WHEN photo_exists THEN 'photos' ELSE 'simple_photos' END,
      'data', result
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
  END;
END;
$$;

-- Create an enhanced version of admin_update_photo_matches that accepts a table parameter
CREATE OR REPLACE FUNCTION admin_update_photo_matches(
  p_id text,
  p_user_id text,
  p_face_id text,
  p_confidence float,
  p_user_name text,
  p_table text DEFAULT 'photos'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uuid_id uuid;
  uuid_user_id uuid;
  match_obj jsonb;
  result jsonb;
  existing_matches jsonb;
  valid_table boolean;
BEGIN
  -- Validate table parameter
  IF p_table NOT IN ('photos', 'simple_photos') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid table name. Must be "photos" or "simple_photos"',
      'provided', p_table
    );
  END IF;
  
  -- Convert IDs to UUID
  BEGIN
    uuid_id := p_id::uuid;
    uuid_user_id := p_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid UUID format',
      'photo_id', p_id,
      'user_id', p_user_id
    );
  END;
  
  -- Check if the photo exists in the specified table
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1)', p_table)
  INTO valid_table
  USING uuid_id;
  
  IF NOT valid_table THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Photo not found in specified table',
      'photo_id', p_id,
      'table', p_table
    );
  END IF;
  
  -- Get existing matched_users from the specified table
  EXECUTE format('SELECT matched_users FROM %I WHERE id = $1', p_table)
  INTO existing_matches
  USING uuid_id;
  
  -- Create the match object
  match_obj := jsonb_build_object(
    'userId', p_user_id,
    'faceId', p_face_id,
    'fullName', p_user_name,
    'confidence', p_confidence,
    'matchedAt', now()::text
  );
  
  -- Prepare the updated matched_users array
  IF existing_matches IS NULL THEN
    existing_matches := '[]'::jsonb;
  END IF;
  
  -- Check if user is already in matches
  IF NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(existing_matches) AS match 
    WHERE match->>'userId' = p_user_id
  ) THEN
    -- Append new match only if user isn't already matched
    existing_matches := existing_matches || jsonb_build_array(match_obj);
  END IF;
  
  -- Update the specified table
  BEGIN
    EXECUTE format('UPDATE %I SET matched_users = $1, updated_at = NOW() WHERE id = $2', p_table)
    USING existing_matches, uuid_id;
    
    -- Verify it worked
    EXECUTE format('SELECT to_jsonb(%I.*) FROM %I WHERE id = $1', p_table, p_table)
    INTO result
    USING uuid_id;
    
    -- Also add to user_matches table for tracking
    INSERT INTO user_matches (user_id, photo_id, face_id, confidence, matched_at, source_table) 
    VALUES (uuid_user_id, uuid_id, p_face_id, p_confidence, now(), p_table)
    ON CONFLICT (user_id, photo_id) DO UPDATE 
    SET confidence = p_confidence, matched_at = now(), source_table = p_table;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Photo matches updated successfully',
      'table', p_table,
      'data', result
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_force_update_photo(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_photo_matches(text, text, text, float, text, text) TO authenticated;

-- Update user_matches table to include source_table column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_matches' 
    AND column_name = 'source_table'
  ) THEN
    ALTER TABLE public.user_matches ADD COLUMN source_table text DEFAULT 'photos';
  END IF;
END
$$; 