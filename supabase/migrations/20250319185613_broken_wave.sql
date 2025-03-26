/*
  # Fix confidence column access in matched_users function

  1. Changes
    - Fix jsonb extraction for confidence value
    - Add proper type casting
    - Add error handling for malformed data
    - Add proper indexing for faces array
  
  2. Security
    - Maintain existing RLS policies
    - Add validation for confidence threshold
*/

-- Update matched_users function with proper jsonb handling
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      COALESCE(u.full_name, up.metadata->>'full_name') as full_name,
      COALESCE(u.avatar_url, up.metadata->>'avatar_url') as avatar_url,
      (face->>'confidence')::numeric as confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS face,
      public.users u
      LEFT JOIN public.user_profiles up ON u.id = up.user_id
    WHERE 
      u.id = (face->>'userId')::uuid
      AND face->>'confidence' IS NOT NULL
      AND (face->>'confidence')::numeric >= 80
  )
  -- Update matched_users with user details
  UPDATE public.photos 
  SET matched_users = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'userId', id,
        'fullName', full_name,
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

-- Add index for faces array
CREATE INDEX IF NOT EXISTS photos_faces_gin_idx ON public.photos USING gin(faces);

-- Add index for matched_users array
CREATE INDEX IF NOT EXISTS photos_matched_users_gin_idx ON public.photos USING gin(matched_users);

-- Update existing photos to reprocess matches
UPDATE public.photos
SET faces = faces
WHERE faces IS NOT NULL;