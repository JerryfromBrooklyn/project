-- Migration to update existing simple_photos entries with default values for required fields
-- Run this in the Supabase SQL Editor

-- Update faces column with empty array if NULL
UPDATE public.simple_photos
SET faces = '[]'::jsonb
WHERE faces IS NULL;

-- Update matched_users column with empty array if NULL
UPDATE public.simple_photos
SET matched_users = '[]'::jsonb
WHERE matched_users IS NULL;

-- Update face_ids column with empty array if NULL
UPDATE public.simple_photos
SET face_ids = '{}'::text[]
WHERE face_ids IS NULL;

-- Update location column with default structure if NULL
UPDATE public.simple_photos
SET location = jsonb_build_object('lat', null, 'lng', null, 'name', null)
WHERE location IS NULL;

-- Update venue column with default structure if NULL
UPDATE public.simple_photos
SET venue = jsonb_build_object('id', null, 'name', null)
WHERE venue IS NULL;

-- Update event_details column with default structure if NULL
UPDATE public.simple_photos
SET event_details = jsonb_build_object('date', null, 'name', null, 'type', null)
WHERE event_details IS NULL;

-- Update tags column with empty array if NULL
UPDATE public.simple_photos
SET tags = '{}'::text[]
WHERE tags IS NULL;

-- Add a check to verify records are correctly updated
SELECT
  COUNT(*) AS total_photos,
  COUNT(*) FILTER (WHERE faces IS NOT NULL) AS photos_with_faces,
  COUNT(*) FILTER (WHERE matched_users IS NOT NULL) AS photos_with_matched_users,
  COUNT(*) FILTER (WHERE location IS NOT NULL) AS photos_with_location,
  COUNT(*) FILTER (WHERE event_details IS NOT NULL) AS photos_with_event_details
FROM public.simple_photos; 