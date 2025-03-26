/*
  # Update photos table schema and storage configuration
  
  1. Changes
    - Add folder support with folder_path and folder_name columns
    - Increase file size limit to 100MB
    - Add support for RAW and DSLR formats
    - Set total storage quota to 10GB per user
    - Update storage policies with simpler quota check
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop existing policies on photos table
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'photos' 
    AND policyname = 'photos_view_own'
  ) THEN
    DROP POLICY "photos_view_own" ON public.photos;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'photos' 
    AND policyname = 'photos_insert_own'
  ) THEN
    DROP POLICY "photos_insert_own" ON public.photos;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'photos' 
    AND policyname = 'photos_delete_own'
  ) THEN
    DROP POLICY "photos_delete_own" ON public.photos;
  END IF;

  -- Drop existing policies on storage.objects
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'photos_storage_read'
  ) THEN
    DROP POLICY "photos_storage_read" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'photos_storage_insert'
  ) THEN
    DROP POLICY "photos_storage_insert" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'photos_storage_delete'
  ) THEN
    DROP POLICY "photos_storage_delete" ON storage.objects;
  END IF;
END $$;

-- Drop existing photos table if it exists
DROP TABLE IF EXISTS public.photos;

-- Create photos table with updated schema
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name text,
  folder_path text,
  faces jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  file_size bigint NOT NULL,
  file_type text NOT NULL
);

-- Add storage quota tracking
CREATE TABLE IF NOT EXISTS public.user_storage (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_size bigint DEFAULT 0,
  quota_limit bigint DEFAULT 10737418240, -- 10GB in bytes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;

-- Create policies with new names
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

CREATE POLICY "storage_view_own"
ON public.user_storage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX photos_event_id_idx ON public.photos(event_id);
CREATE INDEX photos_uploaded_by_idx ON public.photos(uploaded_by);
CREATE INDEX photos_faces_gin_idx ON public.photos USING gin(faces);
CREATE INDEX photos_folder_path_idx ON public.photos(folder_path);

-- Add trigger for updated_at
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

-- Configure bucket settings with increased limits and new formats
UPDATE storage.buckets 
SET avif_autodetection = false,
    file_size_limit = 104857600, -- 100MB
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/x-dcraw',        -- RAW format
      'image/x-canon-cr2',    -- Canon RAW
      'image/x-nikon-nef',    -- Nikon RAW
      'image/x-sony-arw',     -- Sony RAW
      'image/x-panasonic-rw2' -- Panasonic RAW
    ]
WHERE id = 'photos';

-- Create new storage policies
CREATE POLICY "photos_storage_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photos');

CREATE POLICY "photos_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1
    FROM public.user_storage
    WHERE user_id = auth.uid()
    AND total_size < quota_limit
  )
);

CREATE POLICY "photos_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create function to update storage quota
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_storage (user_id, total_size)
    VALUES (NEW.uploaded_by, NEW.file_size)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_size = user_storage.total_size + NEW.file_size,
      updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_storage
    SET total_size = total_size - OLD.file_size,
        updated_at = now()
    WHERE user_id = OLD.uploaded_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage quota updates
DROP TRIGGER IF EXISTS update_storage_quota ON public.photos;
CREATE TRIGGER update_storage_quota
  AFTER INSERT OR DELETE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_storage();