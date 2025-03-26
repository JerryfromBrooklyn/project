-- Fix photo upload issue with column u.full_name does not exist error
-- This simplifies the insert process to avoid any problematic references

-- Drop any functions that might be causing the issue
DROP FUNCTION IF EXISTS public.insert_minimal_photo(UUID, TEXT, TEXT, UUID, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.insert_photo(JSONB);

-- Create a super simple direct insert function with no table joins or references
CREATE OR REPLACE FUNCTION public.direct_photo_insert(
  p_id UUID,
  p_storage_path TEXT,
  p_public_url TEXT,
  p_uploaded_by UUID,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_event_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_photo_id UUID;
BEGIN
  -- Direct insert with absolutely minimal columns
  INSERT INTO public.photos (
    id,
    storage_path,
    public_url,
    uploaded_by,
    file_size,
    file_type,
    event_id,
    faces,
    matched_users,
    face_ids,
    tags,
    created_at,
    updated_at
  )
  VALUES (
    p_id,
    p_storage_path,
    p_public_url,
    p_uploaded_by,
    p_file_size,
    p_file_type,
    p_event_id,
    '[]'::JSONB,
    '[]'::JSONB,
    '{}'::TEXT[],
    '{}'::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO v_photo_id;
  
  RETURN v_photo_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.direct_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT, UUID) TO authenticated;

-- Create an even simpler raw SQL function that directly inserts using a statement
CREATE OR REPLACE FUNCTION public.raw_photo_insert(
  p_id UUID,
  p_storage_path TEXT,
  p_public_url TEXT,
  p_uploaded_by UUID,
  p_file_size BIGINT,
  p_file_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Execute direct SQL without any joins or references
  EXECUTE format('
    INSERT INTO photos (
      id, storage_path, public_url, uploaded_by, file_size, file_type, 
      faces, matched_users, created_at, updated_at
    ) VALUES (
      %L, %L, %L, %L, %L, %L, 
      %L::jsonb, %L::jsonb, NOW(), NOW()
    )',
    p_id, p_storage_path, p_public_url, p_uploaded_by, p_file_size, p_file_type,
    '[]', '[]'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.raw_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT) TO authenticated; 