/*
  # Create face-data storage bucket and policies

  1. Storage
    - Create face-data bucket for storing facial recognition images
    - Add policies for authenticated users to manage their own face data
    - Set appropriate file size limits and mime types
*/

-- Create face-data bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-data', 'face-data', false)
ON CONFLICT DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets 
SET avif_autodetection = false,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'face-data';

-- Create policy to allow users to read their own face data
CREATE POLICY "Users can read own face data"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'face-data' 
  AND auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Create policy to allow users to upload their own face data
CREATE POLICY "Users can upload own face data"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'face-data' 
  AND auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Create policy to allow users to delete their own face data
CREATE POLICY "Users can delete own face data"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-data' 
  AND auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;