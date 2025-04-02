-- Create a debug function to force update a photo with a specific user match
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
  
  -- Force update with raw SQL
  BEGIN
    EXECUTE 'UPDATE photos SET matched_users = $1, updated_at = NOW() WHERE id = $2'
    USING jsonb_build_array(match_obj), uuid_id;
    
    -- Verify it worked
    SELECT to_jsonb(photos.*) INTO result FROM photos WHERE id = uuid_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Force update successful',
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

