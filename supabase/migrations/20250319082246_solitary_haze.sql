/*
  # Set up photos table and storage

  1. New Tables
    - `photos` table for storing photo metadata and face detection results
    - Includes fields for storage path, public URL, event association, and face data

  2. Security
    - Enable RLS on photos table
    - Add policies for authenticated users
    - Set up storage bucket for photos

  3. Changes
    - Create photos table with necessary fields
    - Add indexes for performance
    - Set up RLS policies
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view photos they appear in" ON public.photos;
DROP POLICY IF EXISTS "Users can upload photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "photos_user_insert" ON storage.objects;
DROP POLICY IF EXISTS "photos_user_delete" ON storage.objects;

-- Create photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  faces jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies with new names to avoid conflicts
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

-- Create indexes
CREATE INDEX IF NOT EXISTS photos_event_id_idx ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS photos_uploaded_by_idx ON public.photos(uploaded_by);
CREATE INDEX IF NOT EXISTS photos_faces_gin_idx ON public.photos USING gin(faces);

-- Add trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_photos_updated_at'
  ) THEN
    CREATE TRIGGER update_photos_updated_at
      BEFORE UPDATE ON photos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT DO NOTHING;

-- Configure bucket settings
UPDATE storage.buckets 
SET avif_autodetection = false,
    file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'photos';

-- Create new storage policies with unique names
CREATE POLICY "photos_storage_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photos');

CREATE POLICY "photos_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "photos_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);