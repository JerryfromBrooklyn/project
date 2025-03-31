-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_matched_photos_for_user(UUID);
DROP FUNCTION IF EXISTS public.get_all_user_photos(UUID);
DROP FUNCTION IF EXISTS public.update_photo_matched_users(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.list_functions();

-- Create function to get photos matching a user's face
CREATE OR REPLACE FUNCTION public.get_matched_photos_for_user(
  user_id_param UUID
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
    -- Check matched_users contains the user ID using text pattern matching
    -- Which is more reliable than the containment operators
    p.matched_users::text ILIKE '%"userId":"' || user_id_param || '"%' OR
    p.matched_users::text ILIKE '%"user_id":"' || user_id_param || '"%';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_matched_photos_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_matched_photos_for_user TO anon;
GRANT EXECUTE ON FUNCTION public.get_matched_photos_for_user TO service_role;

-- Function to get all user photos (both uploaded and matched)
CREATE OR REPLACE FUNCTION public.get_all_user_photos(
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  url TEXT,
  public_url TEXT,
  uploaded_by UUID,
  storage_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  faces JSONB,
  face_ids TEXT[],
  matched_users JSONB,
  source_table TEXT,
  is_matched BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First get uploaded photos
  RETURN QUERY
  SELECT 
    p.id,
    p.created_at,
    p.updated_at,
    p.url,
    p.public_url,
    p.uploaded_by,
    p.storage_path,
    p.file_name,
    p.file_size,
    p.file_type,
    p.faces,
    p.face_ids,
    p.matched_users,
    'photos'::TEXT as source_table,
    FALSE as is_matched
  FROM photos p
  WHERE p.uploaded_by = user_id_param

  UNION ALL

  -- Then get matched photos (excluding those already returned)
  SELECT 
    p.id,
    p.created_at,
    p.updated_at,
    p.url,
    p.public_url,
    p.uploaded_by,
    p.storage_path,
    p.file_name,
    p.file_size,
    p.file_type,
    p.faces,
    p.face_ids,
    p.matched_users,
    'photos'::TEXT as source_table,
    TRUE as is_matched
  FROM photos p
  WHERE 
    (p.matched_users::text ILIKE '%"userId":"' || user_id_param || '"%' OR
    p.matched_users::text ILIKE '%"user_id":"' || user_id_param || '"%')
    AND p.uploaded_by <> user_id_param

  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_user_photos TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_photos TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_user_photos TO service_role;

-- Function to update a photo's matched_users array
CREATE OR REPLACE FUNCTION public.update_photo_matched_users(
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
  v_updated_users JSONB;
  v_result JSONB;
BEGIN
  -- Get the current matched_users
  IF p_table_name = 'photos' THEN
    SELECT matched_users INTO v_matched_users FROM photos WHERE id = p_photo_id;
  ELSIF p_table_name = 'simple_photos' THEN 
    SELECT matched_users INTO v_matched_users FROM simple_photos WHERE id = p_photo_id;
  ELSE
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  
  -- Initialize matched_users if NULL
  IF v_matched_users IS NULL THEN
    v_matched_users = '[]'::JSONB;
  END IF;
  
  -- Check if user is already in matched_users
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_matched_users) as u
    WHERE (u->>'userId' = p_user_match->>'userId') OR (u->>'user_id' = p_user_match->>'userId')
  ) THEN
    -- Add the new user match to the array
    v_updated_users = v_matched_users || jsonb_build_array(p_user_match);
    
    -- Update the photo
    IF p_table_name = 'photos' THEN
      UPDATE photos 
      SET 
        matched_users = v_updated_users,
        updated_at = NOW()
      WHERE id = p_photo_id;
    ELSIF p_table_name = 'simple_photos' THEN
      UPDATE simple_photos 
      SET 
        matched_users = v_updated_users,
        updated_at = NOW()
      WHERE id = p_photo_id;
    END IF;
    
    v_result = jsonb_build_object(
      'success', true,
      'message', 'User match added successfully',
      'user_id', p_user_match->>'userId',
      'photo_id', p_photo_id
    );
  ELSE
    v_result = jsonb_build_object(
      'success', true,
      'message', 'User already in matched users',
      'user_id', p_user_match->>'userId',
      'photo_id', p_photo_id
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_photo_matched_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_matched_users TO anon;
GRANT EXECUTE ON FUNCTION public.update_photo_matched_users TO service_role;

-- Function to list available functions
CREATE OR REPLACE FUNCTION public.list_functions()
RETURNS TABLE (
  function_name TEXT,
  return_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT, 
    pg_catalog.pg_get_function_result(p.oid)::TEXT
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY p.proname;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.list_functions TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_functions TO anon;
GRANT EXECUTE ON FUNCTION public.list_functions TO service_role; 