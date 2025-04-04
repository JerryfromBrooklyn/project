-- SQL function to update user face attributes with admin privileges
-- This function bypasses Row Level Security to ensure face attributes are always saved

-- Function to update user face attributes
CREATE OR REPLACE FUNCTION admin_update_user_face_attributes(
  p_user_id UUID,
  p_face_id TEXT,
  p_attributes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with definer's permissions (admin)
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'code', 'USER_NOT_FOUND'
    );
  END IF;

  -- Try to update the users table first
  BEGIN
    UPDATE public.users
    SET 
      face_id = p_face_id,
      face_attributes = p_attributes,
      face_updated_at = NOW()
    WHERE id = p_user_id
    RETURNING jsonb_build_object(
      'id', id,
      'face_id', face_id,
      'face_updated_at', face_updated_at
    ) INTO result;
    
    -- If no rows were affected but no error was raised, the user might exist in auth.users but not in public.users
    IF result IS NULL THEN
      -- Insert into public.users if not exists
      INSERT INTO public.users (id, face_id, face_attributes, face_updated_at)
      VALUES (p_user_id, p_face_id, p_attributes, NOW())
      ON CONFLICT (id) DO UPDATE
      SET 
        face_id = p_face_id,
        face_attributes = p_attributes,
        face_updated_at = NOW()
      RETURNING jsonb_build_object(
        'id', id,
        'face_id', face_id,
        'face_updated_at', face_updated_at
      ) INTO result;
    END IF;
    
    -- Also update or insert into face_data table to ensure consistency
    INSERT INTO public.face_data (user_id, face_id, attributes, updated_at)
    VALUES (p_user_id, p_face_id, p_attributes, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET
      face_id = p_face_id,
      attributes = p_attributes,
      updated_at = NOW();
    
    RETURN jsonb_build_object(
      'success', true,
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

-- Function to check if a user's face attributes exist
CREATE OR REPLACE FUNCTION admin_check_user_face_attributes(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data JSONB;
  face_data JSONB;
BEGIN
  -- Get user data from users table
  SELECT jsonb_build_object(
    'has_user_record', true,
    'face_id', face_id,
    'face_attributes', face_attributes,
    'face_updated_at', face_updated_at
  ) INTO user_data
  FROM public.users
  WHERE id = p_user_id;
  
  -- If user doesn't exist in public.users
  IF user_data IS NULL THEN
    user_data := jsonb_build_object(
      'has_user_record', false
    );
  END IF;
  
  -- Check face_data table
  SELECT jsonb_build_object(
    'has_face_data', true,
    'face_id', face_id,
    'attributes', attributes,
    'updated_at', updated_at
  ) INTO face_data
  FROM public.face_data
  WHERE user_id = p_user_id;
  
  -- If no face data
  IF face_data IS NULL THEN
    face_data := jsonb_build_object(
      'has_face_data', false
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_data', user_data,
    'face_data', face_data
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Add this to the function_exists helper if it doesn't exist
CREATE OR REPLACE FUNCTION function_exists(function_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = function_name
  );
END;
$$; 