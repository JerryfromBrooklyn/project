/*
  # Fix photos table schema and search functionality

  1. Changes
    - Add search_vector column first before creating indexes
    - Fix column order and dependencies
    - Ensure proper trigger creation order
*/

-- Drop existing photos table if it exists
DROP TABLE IF EXISTS public.photos CASCADE;

-- Create photos table with correct column names
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name text,
  folder_path text,
  faces jsonb DEFAULT '[]',
  matched_users jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  title text,
  description text,
  location jsonb DEFAULT '{"lat": null, "lng": null, "name": null}',
  venue jsonb DEFAULT '{"id": null, "name": null}',
  tags text[] DEFAULT '{}',
  date_taken timestamptz,
  event_details jsonb DEFAULT '{"name": null, "date": null, "type": null}',
  search_vector tsvector
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "photos_view_own"
ON public.photos
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  faces @> format('[{"userId": "%s"}]', auth.uid())::jsonb
);

CREATE POLICY "photos_insert_own"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "photos_delete_own"
ON public.photos
FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION photos_search_update() RETURNS trigger AS $$
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

-- Create trigger for search vector updates
CREATE TRIGGER photos_search_update
  BEFORE INSERT OR UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION photos_search_update();

-- Create trigger for updated_at
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX photos_event_id_idx ON public.photos(event_id);
CREATE INDEX photos_uploaded_by_idx ON public.photos(uploaded_by);
CREATE INDEX photos_faces_gin_idx ON public.photos USING gin(faces);
CREATE INDEX photos_folder_path_idx ON public.photos(folder_path);
CREATE INDEX photos_matched_users_gin_idx ON public.photos USING gin(matched_users);
CREATE INDEX photos_date_taken_idx ON public.photos(date_taken);
CREATE INDEX photos_search_idx ON public.photos USING gin(search_vector);