-- Create a simple photos table without triggers
CREATE TABLE IF NOT EXISTS simple_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  public_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE simple_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own simple photos"
ON simple_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view their own simple photos"
ON simple_photos FOR SELECT
TO authenticated
USING (auth.uid() = uploaded_by);

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