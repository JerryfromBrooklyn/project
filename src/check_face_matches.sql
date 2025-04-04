-- Query to check if there are historical matches for the user's face
-- This will help diagnose why matches aren't appearing in the dashboard

-- 1. Check user_faces table to see if the user has a registered face
SELECT 
  user_id, 
  face_id, 
  created_at 
FROM 
  public.user_faces
ORDER BY 
  created_at DESC
LIMIT 10;

-- 2. Check face_data table to see if face attributes are stored
SELECT 
  user_id, 
  face_id, 
  created_at,
  updated_at,
  CASE 
    WHEN attributes IS NOT NULL THEN 'Has attributes'
    WHEN face_data IS NOT NULL THEN 'Has face_data'
    ELSE 'No data'
  END as data_status
FROM 
  public.face_data
ORDER BY 
  updated_at DESC
LIMIT 10;

-- 3. Check if the user has any matches in the system
SELECT 
  pf.photo_id, 
  pf.user_id, 
  pf.confidence, 
  pf.face_id,
  pf.created_at,
  p.public_url as photo_url
FROM 
  public.photo_faces pf
JOIN
  public.photos p ON pf.photo_id = p.id
ORDER BY 
  pf.created_at DESC
LIMIT 10;

-- 4. Check photos table to see if there are any photos with detected faces
SELECT 
  id, 
  uploaded_by,
  jsonb_array_length(faces) as face_count,
  jsonb_array_length(matched_users) as matched_user_count,
  array_length(face_ids, 1) as face_id_count,
  created_at
FROM 
  public.photos
WHERE 
  jsonb_array_length(faces) > 0 OR
  jsonb_array_length(matched_users) > 0 OR
  array_length(face_ids, 1) > 0
ORDER BY 
  created_at DESC
LIMIT 10;

-- 5. Check unassociated_faces table for potential matches
SELECT 
  face_id, 
  photo_id,
  external_image_id,
  created_at
FROM 
  public.unassociated_faces
ORDER BY 
  created_at DESC
LIMIT 10;

-- 6. Check if any users have face_id column populated in users table
SELECT 
  id, 
  email,
  face_id,
  CASE 
    WHEN face_attributes IS NOT NULL THEN 'Has attributes'
    ELSE 'No attributes'
  END as face_attributes_status,
  face_updated_at
FROM 
  public.users
WHERE 
  face_id IS NOT NULL
ORDER BY 
  face_updated_at DESC
LIMIT 10; 