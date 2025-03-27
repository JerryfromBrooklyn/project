-- Drop all triggers on the photos table to start clean
DROP TRIGGER IF EXISTS update_matched_users_trigger ON public.photos;
DROP TRIGGER IF EXISTS photos_search_update ON public.photos;
DROP TRIGGER IF EXISTS update_photos_updated_at ON public.photos;
DROP TRIGGER IF EXISTS update_storage_quota ON public.photos;
DROP TRIGGER IF EXISTS ensure_jsonb_arrays ON public.photos;

-- Fix the update_matched_users function
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match - without using u.full_name
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      u.email as display_name, -- Use email instead of full_name
      NULL as avatar_url,
      (f->>'confidence')::float as confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f,
      auth.users u
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

-- Simplified photo insert function
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

-- Carefully re-create only the essential triggers
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Only re-enable the search vector update if it's needed
CREATE OR REPLACE FUNCTION photos_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce((NEW.location->>'name')::text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce((NEW.venue->>'name')::text, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photos_search_update
  BEFORE INSERT OR UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION photos_search_update(); 