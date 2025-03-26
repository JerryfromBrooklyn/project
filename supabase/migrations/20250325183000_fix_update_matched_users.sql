-- Fix the update_matched_users function to not rely on u.full_name

-- Create a fixed version of the function
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match using proper fields
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      COALESCE(u.full_name, up.metadata->>'full_name', u.email, 'Unknown User') as display_name,
      COALESCE(u.avatar_url, up.metadata->>'avatar_url') as avatar_url,
      f.confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f(face),
      auth.users u
      LEFT JOIN public.user_profiles up ON u.id = up.user_id
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