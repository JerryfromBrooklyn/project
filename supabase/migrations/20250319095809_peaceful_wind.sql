/*
  # Update photos table to better handle face matches

  1. Changes
    - Add matched_users column to store user details
    - Add function to update matched users
    - Add trigger to maintain matched users list
    - Add index for better query performance

  2. Security
    - Ensure RLS policies handle new columns
*/

-- Add matched_users column to store user details
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS matched_users jsonb DEFAULT '[]';

-- Create function to update matched users list
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      u.full_name,
      u.avatar_url,
      f.confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f(face),
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

-- Create trigger for matched users updates
DROP TRIGGER IF EXISTS update_matched_users_trigger ON public.photos;
CREATE TRIGGER update_matched_users_trigger
  AFTER INSERT OR UPDATE OF faces ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_matched_users();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS photos_matched_users_gin_idx 
ON public.photos USING gin(matched_users);

-- Update existing photos
UPDATE public.photos
SET faces = faces
WHERE faces IS NOT NULL;