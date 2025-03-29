-- This script fixes the metadata for existing photos
-- Run this in the Supabase SQL Editor

-- First, let's update any NULL values in the simple_photos table
UPDATE public.simple_photos
SET 
  faces = COALESCE(faces, '[]'::jsonb),
  matched_users = COALESCE(matched_users, '[]'::jsonb),
  face_ids = COALESCE(face_ids, '{}'::text[]),
  location = COALESCE(location, jsonb_build_object('lat', null, 'lng', null, 'name', null)),
  venue = COALESCE(venue, jsonb_build_object('id', null, 'name', null)),
  event_details = COALESCE(event_details, jsonb_build_object('date', null, 'name', null, 'type', null)),
  tags = COALESCE(tags, '{}'::text[]);

-- Create a function to ensure any newly added photo has the required fields
CREATE OR REPLACE FUNCTION public.ensure_photo_metadata()
RETURNS trigger AS $$
BEGIN
  -- Ensure all required fields exist with default values if missing
  NEW.faces = COALESCE(NEW.faces, '[]'::jsonb);
  NEW.matched_users = COALESCE(NEW.matched_users, '[]'::jsonb);
  NEW.face_ids = COALESCE(NEW.face_ids, '{}'::text[]);
  NEW.location = COALESCE(NEW.location, jsonb_build_object('lat', null, 'lng', null, 'name', null));
  NEW.venue = COALESCE(NEW.venue, jsonb_build_object('id', null, 'name', null));
  NEW.event_details = COALESCE(NEW.event_details, jsonb_build_object('date', null, 'name', null, 'type', null));
  NEW.tags = COALESCE(NEW.tags, '{}'::text[]);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on simple_photos table
DROP TRIGGER IF EXISTS ensure_simple_photos_metadata ON public.simple_photos;
CREATE TRIGGER ensure_simple_photos_metadata
BEFORE INSERT OR UPDATE ON public.simple_photos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_photo_metadata();

-- Create trigger on photos table
DROP TRIGGER IF EXISTS ensure_photos_metadata ON public.photos;
CREATE TRIGGER ensure_photos_metadata
BEFORE INSERT OR UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_photo_metadata();

-- Create a more permissive RPC function that can be used by anyone
CREATE OR REPLACE FUNCTION public.simple_photo_insert_with_metadata(
    p_id UUID,
    p_user_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_file_size BIGINT DEFAULT 0,
    p_file_type TEXT DEFAULT 'image/jpeg',
    p_faces JSONB DEFAULT '[]'::jsonb,
    p_matched_users JSONB DEFAULT '[]'::jsonb,
    p_location JSONB DEFAULT NULL,
    p_venue JSONB DEFAULT NULL,
    p_event_details JSONB DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}'::text[]
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Insert with all fields including metadata
    INSERT INTO public.simple_photos (
        id,
        uploaded_by,
        storage_path,
        public_url,
        file_size,
        file_type,
        faces,
        matched_users,
        location,
        venue,
        event_details,
        tags,
        created_at
    ) VALUES (
        p_id,
        p_user_id,
        p_storage_path,
        p_public_url,
        p_file_size,
        p_file_type,
        COALESCE(p_faces, '[]'::jsonb),
        COALESCE(p_matched_users, '[]'::jsonb),
        COALESCE(p_location, jsonb_build_object('lat', null, 'lng', null, 'name', null)),
        COALESCE(p_venue, jsonb_build_object('id', null, 'name', null)),
        COALESCE(p_event_details, jsonb_build_object('date', null, 'name', null, 'type', null)),
        COALESCE(p_tags, '{}'::text[]),
        now()
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error in simple_photo_insert_with_metadata: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the new function
GRANT EXECUTE ON FUNCTION public.simple_photo_insert_with_metadata(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert_with_metadata(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert_with_metadata(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT[]) TO service_role;

-- Verify the changes
SELECT
  COUNT(*) AS total_photos,
  COUNT(*) FILTER (WHERE faces IS NOT NULL) AS photos_with_faces,
  COUNT(*) FILTER (WHERE matched_users IS NOT NULL) AS photos_with_matched_users,
  COUNT(*) FILTER (WHERE location IS NOT NULL) AS photos_with_location,
  COUNT(*) FILTER (WHERE event_details IS NOT NULL) AS photos_with_event_details
FROM public.simple_photos; 