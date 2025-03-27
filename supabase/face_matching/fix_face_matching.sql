-- Fix face matching functionality
-- This script applies the necessary fixes to make face matching work correctly

-- 1. Make sure face_data table has correct structure
ALTER TABLE face_data 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Make sure photo_faces table exists and has the right structure
CREATE TABLE IF NOT EXISTS photo_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  confidence FLOAT DEFAULT 0,
  face_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Add face_id column if it doesn't exist
ALTER TABLE photo_faces
  ADD COLUMN IF NOT EXISTS face_id TEXT;

-- 3. Fix the function that handles face matches
CREATE OR REPLACE FUNCTION handle_face_matching()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a new record or if the confidence has changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.confidence != NEW.confidence) THEN
    -- Update the photos table to include this face match
    UPDATE photos 
    SET 
      face_ids = array_append(COALESCE(face_ids, '{}'::text[]), NEW.face_id),
      matched_users = COALESCE(matched_users, '[]'::jsonb) || 
        jsonb_build_object(
          'userId', NEW.user_id,
          'fullName', (SELECT email FROM auth.users WHERE id = NEW.user_id),
          'confidence', NEW.confidence
        )::jsonb
    WHERE id = NEW.photo_id;
    
    -- Delete old matches for this user in this photo if they exist
    DELETE FROM photo_faces 
    WHERE photo_id = NEW.photo_id AND user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_face_matching ON photo_faces;
CREATE TRIGGER on_face_matching
  BEFORE INSERT OR UPDATE ON photo_faces
  FOR EACH ROW
  EXECUTE FUNCTION handle_face_matching();

-- 4. Create a function to close the loop between face_data and photo uploads
CREATE OR REPLACE FUNCTION match_face_to_photos()
RETURNS TRIGGER AS $$
DECLARE
  v_photo_record RECORD;
  v_match_confidence FLOAT;
  v_face_id TEXT;
BEGIN
  -- Get the face_id from the inserted face data
  v_face_id := NEW.face_id;
  
  -- Set a default matching confidence threshold (can be adjusted)
  v_match_confidence := 90.0;
  
  -- Scan photos for matching faces
  FOR v_photo_record IN 
    SELECT p.id, p.faces
    FROM photos p
    WHERE 
      p.faces IS NOT NULL AND 
      jsonb_array_length(p.faces) > 0
  LOOP
    -- Check each face in the photo
    FOR v_face IN SELECT jsonb_array_elements(v_photo_record.faces)
    LOOP
      IF v_face->>'faceId' = v_face_id THEN
        -- Create a photo_faces entry for this match
        INSERT INTO photo_faces (
          photo_id, 
          user_id, 
          confidence,
          face_id
        ) VALUES (
          v_photo_record.id,
          NEW.user_id,
          v_match_confidence,
          v_face_id
        )
        ON CONFLICT (photo_id, user_id) 
        DO UPDATE SET 
          confidence = v_match_confidence,
          face_id = v_face_id;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Update the user's record to show the face is verified
  UPDATE face_data
  SET is_verified = true
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to match faces when new face data is inserted
DROP TRIGGER IF EXISTS match_face_on_registration ON face_data;
CREATE TRIGGER match_face_on_registration
  AFTER INSERT ON face_data
  FOR EACH ROW
  EXECUTE FUNCTION match_face_to_photos();

-- 5. Create a function that processes uploads with face data
CREATE OR REPLACE FUNCTION process_photo_faces()
RETURNS TRIGGER AS $$
DECLARE
  v_user_record RECORD;
  v_face JSONB;
  v_face_id TEXT;
  v_confidence FLOAT;
BEGIN
  -- Only process if there are faces in the photo
  IF NEW.faces IS NOT NULL AND jsonb_array_length(NEW.faces) > 0 THEN
    -- For each face in the array
    FOR v_face IN SELECT jsonb_array_elements(NEW.faces)
    LOOP
      -- Get the face_id from the face object
      v_face_id := v_face->>'faceId';
      
      IF v_face_id IS NOT NULL THEN
        -- Default confidence if not specified
        v_confidence := COALESCE((v_face->>'confidence')::float, 95.0);
        
        -- Check if this face is registered to any user
        FOR v_user_record IN
          SELECT user_id 
          FROM face_data 
          WHERE face_id = v_face_id
        LOOP
          -- Create a photo_faces entry for this match
          INSERT INTO photo_faces (
            photo_id, 
            user_id, 
            confidence,
            face_id
          ) VALUES (
            NEW.id,
            v_user_record.user_id,
            v_confidence,
            v_face_id
          )
          ON CONFLICT (photo_id, user_id) 
          DO UPDATE SET 
            confidence = v_confidence,
            face_id = v_face_id;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to handle face matching on photo upload
DROP TRIGGER IF EXISTS process_photo_faces_trigger ON photos;
CREATE TRIGGER process_photo_faces_trigger
  AFTER INSERT OR UPDATE OF faces ON photos
  FOR EACH ROW
  EXECUTE FUNCTION process_photo_faces();

-- 6. Create a better view for user matched photos
DROP VIEW IF EXISTS user_matched_photos;
CREATE VIEW user_matched_photos AS
SELECT 
  p.*,
  pf.user_id as matched_user_id,
  pf.confidence as match_confidence,
  pf.face_id as matched_face_id,
  u.email as user_email
FROM 
  photos p
JOIN 
  photo_faces pf ON p.id = pf.photo_id
JOIN 
  auth.users u ON pf.user_id = u.id;

-- 7. Create a function to manually trigger a face match scan
CREATE OR REPLACE FUNCTION scan_all_photos_for_face_matches()
RETURNS INTEGER AS $$
DECLARE
  v_counter INTEGER := 0;
  v_face_record RECORD;
  v_photo_record RECORD;
  v_face JSONB;
  v_match_confidence FLOAT := 90.0;
BEGIN
  -- For each registered face
  FOR v_face_record IN 
    SELECT fd.user_id, fd.face_id
    FROM face_data fd
  LOOP
    -- Scan all photos
    FOR v_photo_record IN 
      SELECT p.id, p.faces
      FROM photos p
      WHERE 
        p.faces IS NOT NULL AND 
        jsonb_array_length(p.faces) > 0
    LOOP
      -- Check each face in the photo
      FOR v_face IN SELECT jsonb_array_elements(v_photo_record.faces)
      LOOP
        -- Check if this face matches the registered face
        IF v_face->>'faceId' = v_face_record.face_id THEN
          -- Create a photo_faces entry for this match if it doesn't exist
          INSERT INTO photo_faces (
            photo_id, 
            user_id, 
            confidence,
            face_id
          ) VALUES (
            v_photo_record.id,
            v_face_record.user_id,
            v_match_confidence,
            v_face_record.face_id
          )
          ON CONFLICT (photo_id, user_id) 
          DO NOTHING;
          
          v_counter := v_counter + 1;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN v_counter;
END;
$$ LANGUAGE plpgsql;

-- 8. Run a scan on existing photos to find matches
SELECT scan_all_photos_for_face_matches(); 