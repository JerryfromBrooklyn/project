-- This migration ensures the face_ids column exists
-- before any queries that depend on it run

-- Double-check that face_ids column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'face_ids'
  ) THEN
    ALTER TABLE public.photos ADD COLUMN face_ids TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added face_ids column to photos table';
  ELSE
    RAISE NOTICE 'face_ids column already exists in photos table';
  END IF;
END $$; 