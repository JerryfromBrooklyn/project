-- Migration to fix face registration issues

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.rpc_register_face;
DROP FUNCTION IF EXISTS public.register_face;
DROP FUNCTION IF EXISTS public.auto_generate_face_id;

-- Function to generate face IDs
CREATE OR REPLACE FUNCTION public.auto_generate_face_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'face_' || replace(gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

-- Create face registration function
CREATE OR REPLACE FUNCTION public.register_face(
  p_user_id UUID,
  p_face_id TEXT DEFAULT NULL,
  p_face_data JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_face_id TEXT;
  v_result JSONB;
BEGIN
  -- Generate face_id if not provided
  IF p_face_id IS NULL OR p_face_id = '' THEN
    v_face_id := public.auto_generate_face_id();
  ELSE
    v_face_id := p_face_id;
  END IF;

  RAISE NOTICE 'Registering face with ID: % for user %', v_face_id, p_user_id;
  
  -- Delete existing face data for this user (optional)
  DELETE FROM public.face_data WHERE user_id = p_user_id;
  
  -- Insert new face data
  BEGIN
    INSERT INTO public.face_data (user_id, face_id, face_data, metadata)
    VALUES (p_user_id, v_face_id, p_face_data, p_metadata)
    RETURNING jsonb_build_object(
      'id', id,
      'user_id', user_id,
      'face_id', face_id,
      'created_at', created_at
    ) INTO v_result;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Face registered successfully',
      'data', v_result
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error registering face: ' || SQLERRM,
      'error_code', SQLSTATE,
      'details', jsonb_build_object(
        'user_id', p_user_id,
        'face_id', v_face_id
      )
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Create RPC endpoint
CREATE OR REPLACE FUNCTION public.rpc_register_face(
  face_id TEXT DEFAULT NULL,
  face_data JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_face_id TEXT;
BEGIN
  -- Get current user's ID
  v_user_id := auth.uid();
  
  -- If face_id is NULL or empty, generate one
  IF face_id IS NULL OR face_id = '' THEN
    v_face_id := public.auto_generate_face_id();
  ELSE
    v_face_id := face_id;
  END IF;
  
  RAISE NOTICE 'RPC register face for user % with face ID %', v_user_id, v_face_id;
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated',
      'error_code', 'AUTH001'
    );
  END IF;
  
  -- Directly insert into face_data without using register_face function
  -- This is more reliable in some cases
  BEGIN
    DELETE FROM public.face_data WHERE user_id = v_user_id;
    
    INSERT INTO public.face_data (user_id, face_id, face_data, metadata)
    VALUES (v_user_id, v_face_id, face_data, metadata);
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Face registered successfully',
      'data', jsonb_build_object(
        'user_id', v_user_id,
        'face_id', v_face_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error registering face: ' || SQLERRM,
      'error_code', SQLSTATE,
      'details', jsonb_build_object(
        'user_id', v_user_id,
        'face_id', v_face_id
      )
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to ensure face_id is never null
CREATE OR REPLACE FUNCTION ensure_face_id_not_null()
RETURNS TRIGGER AS $$
BEGIN
  -- If face_id is null, generate a new one
  IF NEW.face_id IS NULL OR NEW.face_id = '' THEN
    NEW.face_id := 'auto_' || replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to face_data table
DROP TRIGGER IF EXISTS ensure_face_id_before_insert ON face_data;
CREATE TRIGGER ensure_face_id_before_insert
  BEFORE INSERT ON face_data
  FOR EACH ROW
  EXECUTE FUNCTION ensure_face_id_not_null();
