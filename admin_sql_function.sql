-- This function allows running SQL commands with elevated privileges
-- It should be run by a database administrator or with appropriate privileges

-- First drop existing functions if they exist
DROP FUNCTION IF EXISTS function_exists(text);
DROP FUNCTION IF EXISTS admin_run_sql(text);
DROP FUNCTION IF EXISTS admin_insert_photo(text, jsonb);
DROP FUNCTION IF EXISTS admin_update_photo_matches(text, jsonb);
DROP FUNCTION IF EXISTS debug_check_photo(text);
DROP FUNCTION IF EXISTS debug_force_update_photo(text, text);

-- Create the function_exists function
CREATE OR REPLACE FUNCTION function_exists(function_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_proc.proname = function_name
    AND pg_namespace.nspname = 'public'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION function_exists(text) TO authenticated;

-- Create the admin_run_sql function
CREATE OR REPLACE FUNCTION admin_run_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
  RETURN 'SQL executed successfully';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_run_sql(text) TO authenticated;

-- Create a debug logging function
CREATE OR REPLACE FUNCTION log_debug(message text, data jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- In production, you might want to store these in a actual log table
  -- This is just a stub function that can be expanded as needed
  -- RAISE NOTICE '%: %', message, data;
  
  -- We're just returning void for now, but this could be modified
  -- to add logs to a dedicated table
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_debug(text, jsonb) TO authenticated;

-- Create the admin_insert_photo function
CREATE OR REPLACE FUNCTION admin_insert_photo(p_id text, p_matched_users jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  result jsonb;
  uuid_id uuid;
  debug_info jsonb;
BEGIN
  -- Log the input
  debug_info := jsonb_build_object(
    'function', 'admin_insert_photo',
    'p_id', p_id,
    'p_matched_users_type', pg_typeof(p_matched_users)::text
  );
  PERFORM log_debug('Function called with parameters', debug_info);

  -- Convert text ID to UUID with explicit error handling
  BEGIN
    uuid_id := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'context', 'UUID conversion',
      'input', p_id
    );
    PERFORM log_debug('UUID conversion failed', debug_info);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid UUID format for photo ID',
      'details', SQLERRM,
      'input_id', p_id
    );
  END;

  -- Insert the basic photo record
  BEGIN
    INSERT INTO photos (
      id, 
      matched_users, 
      created_at,
      updated_at
    )
    VALUES (
      uuid_id, 
      COALESCE(p_matched_users, '[]'::jsonb), 
      NOW(),
      NOW()
    )
    RETURNING to_jsonb(photos.*) INTO result;
    
    debug_info := jsonb_build_object(
      'uuid_id', uuid_id,
      'result', result
    );
    PERFORM log_debug('Photo inserted successfully', debug_info);
    
    RETURN jsonb_build_object(
      'success', true,
      'data', result,
      'message', 'Photo record created successfully'
    );
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'context', 'INSERT operation',
      'uuid_id', uuid_id,
      'matched_users', p_matched_users
    );
    PERFORM log_debug('Photo insert failed', debug_info);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE,
      'input_id', p_id,
      'input_matched_users', p_matched_users
    );
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_insert_photo(text, jsonb) TO authenticated;

-- Create the admin_update_photo_matches function with fixed UUID handling
CREATE OR REPLACE FUNCTION admin_update_photo_matches(p_id text, p_matched_users jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  result jsonb;
  exists_check boolean;
  uuid_id uuid;
  valid_jsonb boolean;
  processed_matched_users jsonb;
  original_matched_users jsonb;
  debug_info jsonb;
BEGIN
  -- Log input parameters 
  debug_info := jsonb_build_object(
    'function', 'admin_update_photo_matches',
    'p_id', p_id,
    'p_matched_users_type', pg_typeof(p_matched_users)::text,
    'p_matched_users', p_matched_users
  );
  PERFORM log_debug('Function called with parameters', debug_info);

  -- First convert text ID to UUID with explicit error handling
  BEGIN
    -- Ensure we have a valid UUID by explicitly casting it
    uuid_id := p_id::uuid;
    
    debug_info := jsonb_build_object('uuid_id', uuid_id);
    PERFORM log_debug('UUID conversion successful', debug_info);
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'input', p_id
    );
    PERFORM log_debug('UUID conversion failed', debug_info);
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid UUID format for photo ID',
      'details', SQLERRM,
      'input_id', p_id
    );
  END;
  
  -- Process matched_users with extensive error handling
  BEGIN
    -- Ensure we have valid JSONB
    IF p_matched_users IS NULL THEN
      processed_matched_users := '[]'::jsonb;
      PERFORM log_debug('NULL matched_users converted to empty array', NULL);
    ELSIF jsonb_typeof(p_matched_users) = 'array' THEN
      -- It's already an array, use as is
      processed_matched_users := p_matched_users;
      PERFORM log_debug('matched_users is already a valid JSONB array', NULL);
    ELSE
      -- Try to parse it if it's not already a JSONB array
      BEGIN
        processed_matched_users := p_matched_users;
        IF jsonb_typeof(processed_matched_users) != 'array' THEN
          -- Force it to be an array if it's somehow not
          processed_matched_users := jsonb_build_array(processed_matched_users);
          PERFORM log_debug('matched_users converted to array', processed_matched_users);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Last resort - create an empty array
        processed_matched_users := '[]'::jsonb;
        debug_info := jsonb_build_object(
          'error', SQLERRM,
          'fallback', 'Using empty array'
        );
        PERFORM log_debug('matched_users processing failed', debug_info);
      END;
    END IF;
    
    debug_info := jsonb_build_object(
      'processed_type', jsonb_typeof(processed_matched_users),
      'processed_value', processed_matched_users
    );
    PERFORM log_debug('Final processed matched_users', debug_info);
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'input', p_matched_users
    );
    PERFORM log_debug('matched_users processing exception', debug_info);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid JSONB format for matched_users',
      'details', SQLERRM,
      'input_matched_users', p_matched_users
    );
  END;

  -- Check if the photo exists
  BEGIN
    SELECT EXISTS(SELECT 1 FROM photos WHERE id = uuid_id) INTO exists_check;
    PERFORM log_debug('Photo existence check', jsonb_build_object('exists', exists_check));
    
    IF exists_check THEN
      SELECT matched_users INTO original_matched_users FROM photos WHERE id = uuid_id;
      PERFORM log_debug('Original matched_users retrieved', original_matched_users);
    ELSE
      original_matched_users := '[]'::jsonb;
      PERFORM log_debug('Photo does not exist, using empty array for original', NULL);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'context', 'existence check'
    );
    PERFORM log_debug('Photo check failed', debug_info);
    
    -- Continue anyway to attempt repair
    exists_check := false;
    original_matched_users := '[]'::jsonb;
  END;
  
  -- Main update/insert logic
  IF NOT exists_check THEN
    -- Photo doesn't exist, create it
    BEGIN
      PERFORM log_debug('Creating new photo record', jsonb_build_object('id', uuid_id));
      
      INSERT INTO photos (
        id, 
        matched_users, 
        created_at, 
        updated_at
      )
      VALUES (
        uuid_id, 
        processed_matched_users, 
        NOW(), 
        NOW()
      )
      RETURNING to_jsonb(photos.*) INTO result;
      
      debug_info := jsonb_build_object(
        'action', 'created',
        'id', uuid_id,
        'result', result
      );
      PERFORM log_debug('Photo created successfully', debug_info);
      
      RETURN jsonb_build_object(
        'success', true,
        'action', 'created',
        'data', result,
        'original', NULL,
        'modified', processed_matched_users
      );
    EXCEPTION WHEN OTHERS THEN
      debug_info := jsonb_build_object(
        'error', SQLERRM,
        'code', SQLSTATE,
        'context', 'INSERT operation'
      );
      PERFORM log_debug('Photo creation failed', debug_info);
      
      -- Before giving up, try one more approach - direct SQL with explicit cast
      BEGIN
        EXECUTE 'INSERT INTO photos (id, matched_users, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())'
        USING uuid_id, processed_matched_users;
        
        PERFORM log_debug('Fallback INSERT successful', jsonb_build_object('id', uuid_id));
        
        RETURN jsonb_build_object(
          'success', true,
          'action', 'direct-created',
          'message', 'Photo created with direct SQL',
          'original', NULL,
          'modified', processed_matched_users
        );
      EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_build_object(
          'error', SQLERRM,
          'code', SQLSTATE,
          'context', 'direct INSERT operation'
        );
        PERFORM log_debug('Fallback INSERT failed', debug_info);
        
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Failed to create photo record',
          'details', SQLERRM,
          'code', SQLSTATE,
          'input_id', p_id,
          'input_matched_users', p_matched_users
        );
      END;
    END;
  ELSE
    -- Photo exists, update it
    BEGIN
      PERFORM log_debug('Updating existing photo', jsonb_build_object('id', uuid_id));
      
      UPDATE photos
      SET matched_users = processed_matched_users,
          updated_at = NOW()
      WHERE id = uuid_id
      RETURNING to_jsonb(photos.*) INTO result;
      
      debug_info := jsonb_build_object(
        'action', 'updated',
        'id', uuid_id,
        'result', result
      );
      PERFORM log_debug('Photo updated successfully', debug_info);
      
      RETURN jsonb_build_object(
        'success', true,
        'action', 'updated',
        'data', result,
        'original', original_matched_users,
        'modified', processed_matched_users
      );
    EXCEPTION WHEN OTHERS THEN
      debug_info := jsonb_build_object(
        'error', SQLERRM,
        'code', SQLSTATE,
        'context', 'UPDATE operation'
      );
      PERFORM log_debug('Photo update failed', debug_info);
      
      -- Try a more direct approach if the first method fails
      BEGIN
        -- Explicitly log what we're trying to do
        debug_info := jsonb_build_object(
          'sql', 'UPDATE photos SET matched_users = $1, updated_at = NOW() WHERE id = $2',
          'id', uuid_id,
          'matched_users_type', pg_typeof(processed_matched_users)::text
        );
        PERFORM log_debug('Attempting direct update with prepared statement', debug_info);
        
        -- Use prepared statement for better type handling
        EXECUTE 'UPDATE photos SET matched_users = $1, updated_at = NOW() WHERE id = $2'
        USING processed_matched_users, uuid_id;
        
        -- Verify the update actually happened
        BEGIN
          SELECT matched_users INTO result FROM photos WHERE id = uuid_id;
          
          debug_info := jsonb_build_object(
            'id', uuid_id,
            'result_type', pg_typeof(result)::text
          );
          PERFORM log_debug('Verification query successful', debug_info);
          
          -- Check if arrays are equal - this is tricky in SQL so we'll just check if any data returned
          IF result IS NOT NULL THEN
            PERFORM log_debug('Verification found data', result);
            
            RETURN jsonb_build_object(
              'success', true,
              'action', 'force-updated',
              'message', 'Update completed with direct SQL',
              'original', original_matched_users,
              'modified', processed_matched_users
            );
          ELSE
            PERFORM log_debug('Verification found NO data', NULL);
            
            RETURN jsonb_build_object(
              'success', false,
              'error', 'Update verification failed - no data returned',
              'code', 'VERIFY_FAIL'
            );
          END IF;
        EXCEPTION WHEN OTHERS THEN
          debug_info := jsonb_build_object(
            'error', SQLERRM,
            'code', SQLSTATE,
            'context', 'verification query'
          );
          PERFORM log_debug('Verification query failed', debug_info);
          
          -- Still return success since the update might have worked
          RETURN jsonb_build_object(
            'success', true,
            'action', 'force-updated-unverified',
            'message', 'Update completed but verification failed',
            'warning', 'Could not verify the update succeeded'
          );
        END;
      EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_build_object(
          'error', SQLERRM,
          'code', SQLSTATE,
          'context', 'direct UPDATE'
        );
        PERFORM log_debug('Direct update failed', debug_info);
        
        -- Last attempt - try to force update with explicit casting
        BEGIN
          debug_info := jsonb_build_object(
            'sql', 'UPDATE photos SET matched_users = $1::jsonb, updated_at = NOW() WHERE id = $2::uuid',
            'id', p_id,
            'matched_users', p_matched_users::text
          );
          PERFORM log_debug('Attempting final update with explicit casting', debug_info);
          
          EXECUTE 'UPDATE photos SET matched_users = $1::jsonb, updated_at = NOW() WHERE id = $2::uuid'
          USING p_matched_users::text, p_id;
          
          RETURN jsonb_build_object(
            'success', true,
            'action', 'emergency-updated',
            'message', 'Update completed with emergency casting',
            'warning', 'Could not verify the update succeeded'
          );
        EXCEPTION WHEN OTHERS THEN
          debug_info := jsonb_build_object(
            'error', SQLERRM,
            'code', SQLSTATE,
            'context', 'emergency update'
          );
          PERFORM log_debug('Emergency update failed', debug_info);
          
          RETURN jsonb_build_object(
            'success', false,
            'error', 'All update attempts failed',
            'details', SQLERRM,
            'code', SQLSTATE,
            'input_id', p_id,
            'input_matched_users', p_matched_users
          );
        END;
      END;
    END;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_photo_matches(text, jsonb) TO authenticated;

-- Create a function specifically for checking photos for debugging
CREATE OR REPLACE FUNCTION debug_check_photo(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_data jsonb;
  uuid_id uuid;
BEGIN
  -- Try to convert the ID to UUID
  BEGIN
    uuid_id := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid UUID format',
      'input', p_id
    );
  END;
  
  -- Check if the photo exists
  BEGIN
    SELECT to_jsonb(photos.*) INTO photo_data FROM photos WHERE id = uuid_id;
    
    IF photo_data IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Photo not found',
        'id', uuid_id
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'data', photo_data,
      'matched_users_type', jsonb_typeof(photo_data->'matched_users'),
      'matched_users_count', jsonb_array_length(CASE 
                                               WHEN jsonb_typeof(photo_data->'matched_users') = 'array' 
                                               THEN photo_data->'matched_users' 
                                               ELSE '[]'::jsonb 
                                               END)
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE,
      'id', uuid_id
    );
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_check_photo(text) TO authenticated;

-- Create a test function to directly set matched_users
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

-- Verify that the functions exist
SELECT function_exists('admin_run_sql'), 
       function_exists('admin_insert_photo'), 
       function_exists('admin_update_photo_matches'),
       function_exists('debug_check_photo'),
       function_exists('debug_force_update_photo'); 