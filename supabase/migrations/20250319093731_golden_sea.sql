/*
  # Add metadata fields to photos table
  
  1. Changes
    - Add title, description fields
    - Add location data with lat/lng and name
    - Add venue reference
    - Add tags array
    - Add dateTaken timestamp
    - Add eventDetails JSON field
*/

-- Add new columns to photos table
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS location jsonb DEFAULT '{"lat": null, "lng": null, "name": null}',
ADD COLUMN IF NOT EXISTS venue jsonb DEFAULT '{"id": null, "name": null}',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS date_taken timestamptz,
ADD COLUMN IF NOT EXISTS event_details jsonb DEFAULT '{"name": null, "date": null, "type": null}';

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS photos_title_idx ON public.photos USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS photos_tags_idx ON public.photos USING gin(tags);
CREATE INDEX IF NOT EXISTS photos_location_idx ON public.photos USING gin(location);
CREATE INDEX IF NOT EXISTS photos_venue_idx ON public.photos USING gin(venue);
CREATE INDEX IF NOT EXISTS photos_date_taken_idx ON public.photos(date_taken);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "photos_view_own" ON public.photos;
CREATE POLICY "photos_view_own"
ON public.photos
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  faces @> format('[{"userId": "%s"}]', auth.uid())::jsonb
);

DROP POLICY IF EXISTS "photos_update_own" ON public.photos;
CREATE POLICY "photos_update_own"
ON public.photos
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

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

-- Add search vector column and index
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS photos_search_idx ON public.photos USING gin(search_vector);

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS photos_search_update ON public.photos;
CREATE TRIGGER photos_search_update
  BEFORE INSERT OR UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION photos_search_update();

-- Update existing rows
UPDATE public.photos SET
  title = COALESCE(title, storage_path),
  date_taken = COALESCE(date_taken, created_at)
WHERE title IS NULL OR date_taken IS NULL;