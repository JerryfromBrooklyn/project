-- Fix for "array_agg is an aggregate function" error

-- First, add the full_name column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Fix the update_matched_users function
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      COALESCE(u.full_name, p.metadata->>'full_name', u.email, 'Unknown User') as display_name,
      COALESCE(u.avatar_url, p.metadata->>'avatar_url') as avatar_url,
      (f->>'confidence')::float as confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f,
      auth.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
    WHERE 
      u.id = (f->>'userId')::uuid
  )
  -- Update matched_users with user details
  UPDATE public.photos 
  SET matched_users = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'userId', id,
        'fullName', display_name,
        'avatarUrl', avatar_url,
        'confidence', confidence
      )
    )
    FROM matched_details
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a minimal photo insert function that doesn't use array_agg
CREATE OR REPLACE FUNCTION public.basic_photo_insert(
  p_id UUID,
  p_path TEXT,
  p_url TEXT,
  p_user UUID,
  p_size BIGINT,
  p_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple direct insert with minimal fields and no complex conversions
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
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.basic_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT) TO authenticated; 