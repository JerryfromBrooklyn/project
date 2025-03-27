-- First drop the existing function
DROP FUNCTION IF EXISTS public.basic_photo_insert(uuid,text,text,uuid,bigint,text);

-- Simplified photo insert function with UUID return type
CREATE OR REPLACE FUNCTION public.basic_photo_insert(
  p_id UUID,
  p_path TEXT,
  p_url TEXT,
  p_user UUID,
  p_size BIGINT,
  p_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo_id UUID;
BEGIN
  -- Simple direct insert with minimal fields
  INSERT INTO public.photos (
    id, 
    storage_path, 
    public_url, 
    uploaded_by, 
    file_size, 
    file_type, 
    faces, 
    matched_users,
    created_at, 
    updated_at
  ) VALUES (
    p_id, 
    p_path, 
    p_url, 
    p_user, 
    p_size, 
    p_type, 
    '[]'::jsonb, 
    '[]'::jsonb,
    NOW(), 
    NOW()
  )
  RETURNING id INTO v_photo_id;

  -- Try to update storage usage but ignore errors
  BEGIN
    INSERT INTO user_storage (user_id, total_size, quota_limit)
    VALUES (p_user, p_size, 10737418240)  -- 10GB default quota
    ON CONFLICT (user_id) DO UPDATE
    SET total_size = user_storage.total_size + p_size;
  EXCEPTION
    WHEN OTHERS THEN
      -- Just continue if storage update fails
      NULL;
  END;

  RETURN v_photo_id;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.basic_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT) TO authenticated; 