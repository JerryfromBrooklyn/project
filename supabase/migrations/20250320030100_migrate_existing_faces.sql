-- Script to migrate existing face data to the new format
-- This will convert the existing system to the optimized one

-- Migrate existing photos with faces by re-indexing them
-- Note: This is a placeholder that will be executed through application code
-- because we need to download the images and call AWS Rekognition
-- which can't be done directly from SQL

-- Create functions that will be used by the application to migrate data
CREATE OR REPLACE FUNCTION public.get_photos_needing_face_indexing()
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  has_faces BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.storage_path, 
    (CASE WHEN jsonb_array_length(COALESCE(p.faces, '[]'::jsonb)) > 0 THEN true ELSE false END) as has_faces
  FROM 
    public.photos p
  WHERE 
    p.face_ids IS NULL OR p.face_ids = '{}' OR array_length(p.face_ids, 1) IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update face_ids for a photo
CREATE OR REPLACE FUNCTION public.update_photo_face_ids(
  photo_id UUID,
  new_face_ids TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.photos
  SET face_ids = new_face_ids
  WHERE id = photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to show the migration progress
CREATE OR REPLACE VIEW public.face_migration_progress AS
SELECT
  COUNT(*) AS total_photos,
  COUNT(CASE WHEN p.face_ids IS NOT NULL AND array_length(p.face_ids, 1) > 0 THEN 1 END) AS migrated_photos,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(CASE WHEN p.face_ids IS NOT NULL AND array_length(p.face_ids, 1) > 0 THEN 1 END)::float / COUNT(*)::float * 100) 
    ELSE 0 
  END AS percent_complete
FROM
  public.photos p;

-- Track registered faces that are already indexed
CREATE OR REPLACE FUNCTION public.track_registered_faces()
RETURNS VOID AS $$
DECLARE
  total_faces INTEGER := 0;
  processed_faces INTEGER := 0;
  user_record RECORD;
  face_json JSONB;
  face_index INTEGER;
BEGIN
  -- For each user that might have a face indexed
  FOR user_record IN 
    SELECT DISTINCT f->>'userId' AS user_id 
    FROM public.photos, 
         jsonb_array_elements(COALESCE(faces, '[]'::jsonb)) AS f 
    WHERE f->>'userId' IS NOT NULL AND f->>'userId' != ''
  LOOP
    -- For any faces that have a user associated but no entry in face_data
    FOR face_json, face_index IN 
      SELECT f, ordinality - 1
      FROM (
        SELECT p.id, p.faces, jsonb_array_elements(COALESCE(p.faces, '[]'::jsonb)) WITH ORDINALITY AS f
        FROM public.photos p
        WHERE p.faces IS NOT NULL AND jsonb_array_length(p.faces) > 0
      ) AS subq
      WHERE f->>'userId' = user_record.user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.face_data fd
        WHERE fd.user_id = user_record.user_id::uuid
      )
    LOOP
      total_faces := total_faces + 1;
      
      -- If the face has a faceId field, add it to face_data
      IF face_json->>'faceId' IS NOT NULL AND face_json->>'faceId' != '' THEN
        BEGIN
          INSERT INTO public.face_data (user_id, face_id)
          VALUES (user_record.user_id::uuid, face_json->>'faceId')
          ON CONFLICT (user_id, face_id) DO NOTHING;
          
          processed_faces := processed_faces + 1;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error tracking face: %', SQLERRM;
        END;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Face tracking complete: % of % faces processed', processed_faces, total_faces;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the tracking function
SELECT public.track_registered_faces(); 