-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS update_matched_users_trigger ON public.photos;

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

-- Recreate the trigger
CREATE TRIGGER update_matched_users_trigger
  AFTER INSERT OR UPDATE OF faces ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_matched_users(); 