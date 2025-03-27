-- Run a full scan to match all faces and photos
SELECT scan_all_photos_for_face_matches();

-- Force an update on all photos to trigger the face matching process
UPDATE photos 
SET updated_at = NOW()
WHERE faces IS NOT NULL AND jsonb_array_length(faces) > 0;

-- Check for face matches to verify the process worked
SELECT 
  p.id as photo_id,
  pf.user_id as user_id,
  pf.face_id as face_id,
  pf.confidence as confidence,
  u.email as user_email
FROM 
  photos p
JOIN 
  photo_faces pf ON p.id = pf.photo_id
JOIN 
  auth.users u ON pf.user_id = u.id
LIMIT 100; 