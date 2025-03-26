/*
  # Fix photo schema to match TypeScript interface
  
  1. Changes
    - Add new columns with correct names
    - Update search vector function
    - Create proper indexes
    - Ensure data consistency
*/

-- Drop old columns if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' 
    AND column_name = 'moderation_labels'
  ) THEN
    ALTER TABLE public.photos DROP COLUMN moderation_labels;
  END IF;
END $$;

-- Add new columns with correct names
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS labels jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS celebrities jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "moderationLabels" jsonb DEFAULT '[]';

-- Update search vector function to use new column names
CREATE OR REPLACE FUNCTION photos_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce((NEW.location->>'name')::text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce((NEW.venue->>'name')::text, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D') ||
    setweight(to_tsvector('english', coalesce(
      array_to_string(
        array(
          SELECT jsonb_array_elements_text(NEW.labels->'name')
        ), ' '
      ), ''
    )), 'D') ||
    setweight(to_tsvector('english', coalesce(
      array_to_string(
        array(
          SELECT jsonb_array_elements_text(NEW.celebrities->'name')
        ), ' '
      ), ''
    )), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old indexes if they exist
DROP INDEX IF EXISTS photos_labels_gin_idx;
DROP INDEX IF EXISTS photos_celebrities_gin_idx;
DROP INDEX IF EXISTS photos_moderation_labels_gin_idx;

-- Create new indexes
CREATE INDEX photos_labels_gin_idx ON public.photos USING gin(labels);
CREATE INDEX photos_celebrities_gin_idx ON public.photos USING gin(celebrities);
CREATE INDEX photos_moderationLabels_gin_idx ON public.photos USING gin("moderationLabels");

-- Initialize columns with empty arrays
UPDATE public.photos SET
  labels = COALESCE(labels, '[]'::jsonb),
  celebrities = COALESCE(celebrities, '[]'::jsonb),
  "moderationLabels" = COALESCE("moderationLabels", '[]'::jsonb);

-- Ensure RLS policies are updated
DROP POLICY IF EXISTS "photos_view_own" ON public.photos;
CREATE POLICY "photos_view_own"
ON public.photos
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  faces @> format('[{"userId": "%s"}]', auth.uid())::jsonb
);

-- Add trigger for search vector updates if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'photos_search_update'
  ) THEN
    CREATE TRIGGER photos_search_update
      BEFORE INSERT OR UPDATE ON photos
      FOR EACH ROW
      EXECUTE FUNCTION photos_search_update();
  END IF;
END $$;