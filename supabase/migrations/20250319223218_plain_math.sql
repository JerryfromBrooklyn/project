/*
  # Add image analysis fields to photos table
  
  1. Changes
    - Add labels, celebrities, and moderation labels columns
    - Update indexes for new columns
    - Add trigger to maintain search vector
*/

-- Add new columns for image analysis
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS labels jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS celebrities jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS moderation_labels jsonb DEFAULT '[]';

-- Update search vector function to include new fields
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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS photos_labels_gin_idx ON public.photos USING gin(labels);
CREATE INDEX IF NOT EXISTS photos_celebrities_gin_idx ON public.photos USING gin(celebrities);
CREATE INDEX IF NOT EXISTS photos_moderation_labels_gin_idx ON public.photos USING gin(moderation_labels);

-- Update existing photos to initialize new columns
UPDATE public.photos SET
  labels = '[]'::jsonb,
  celebrities = '[]'::jsonb,
  moderation_labels = '[]'::jsonb
WHERE labels IS NULL
   OR celebrities IS NULL
   OR moderation_labels IS NULL;