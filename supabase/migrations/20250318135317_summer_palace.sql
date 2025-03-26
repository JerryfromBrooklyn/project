/*
  # Configure face-data storage bucket and policies

  1. Storage Configuration
    - Create face-data bucket
    - Set bucket configuration for file types and limits
  
  2. Security
    - Enable RLS on storage.objects
    - Drop existing policies to avoid conflicts
    - Create new policies for face data access
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own face data" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own face data" ON storage.objects;

-- Create or update face-data bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-data', 'face-data', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Configure bucket settings
UPDATE storage.buckets 
SET avif_autodetection = false,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'face-data';

-- Enable RLS on storage.objects if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "face_data_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'face-data');

CREATE POLICY "face_data_user_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'face-data' 
  AND auth.uid()::text = SPLIT_PART(name, '/', 1)
);

CREATE POLICY "face_data_user_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-data' 
  AND auth.uid()::text = SPLIT_PART(name, '/', 1)
);