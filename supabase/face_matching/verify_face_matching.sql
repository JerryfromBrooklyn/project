-- Face Matching Verification Script

-- Display database schema version
SELECT current_setting('server_version');

-- Check if the photo_faces table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'photo_faces'
);

-- Check if the face_data table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'face_data'
);

-- Check for registered faces in face_data
SELECT 
    COUNT(*) as total_registered_faces,
    COUNT(DISTINCT user_id) as unique_users_with_faces
FROM face_data;

-- Check for photos with faces
SELECT 
    COUNT(*) as total_photos,
    COUNT(*) FILTER (WHERE jsonb_array_length(faces) > 0) as photos_with_faces,
    COUNT(*) FILTER (WHERE array_length(face_ids, 1) > 0) as photos_with_face_ids,
    COUNT(*) FILTER (WHERE jsonb_array_length(matched_users) > 0) as photos_with_matched_users
FROM photos;

-- Check photo_faces junction table
SELECT 
    COUNT(*) as total_matches,
    COUNT(DISTINCT photo_id) as unique_photos,
    COUNT(DISTINCT user_id) as unique_users
FROM photo_faces;

-- View sample entries in photo_faces if any exist
SELECT * FROM photo_faces LIMIT 5;

-- View the update_photo_face_ids_adapter function definition
SELECT 
    pg_get_functiondef(oid) 
FROM 
    pg_proc 
WHERE 
    proname = 'update_photo_face_ids_adapter' 
    AND pg_function_is_visible(oid);

-- Check function execution permissions
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM 
    information_schema.routine_privileges
WHERE 
    routine_name LIKE '%face%';

-- Check if there are any photos with faces but no matches
WITH PhotoStats AS (
    SELECT 
        id,
        COALESCE(jsonb_array_length(faces), 0) as face_count,
        COALESCE(jsonb_array_length(matched_users), 0) as match_count,
        EXISTS (
            SELECT 1 FROM photo_faces pf WHERE pf.photo_id = p.id
        ) as has_photo_faces
    FROM 
        photos p
    WHERE 
        jsonb_array_length(faces) > 0
)
SELECT 
    COUNT(*) as photos_with_faces_but_no_matches
FROM 
    PhotoStats
WHERE 
    face_count > 0 
    AND match_count = 0
    AND has_photo_faces = false;

-- List all photos with faces but no matches (limited to 10)
WITH PhotoStats AS (
    SELECT 
        id,
        COALESCE(jsonb_array_length(faces), 0) as face_count,
        COALESCE(jsonb_array_length(matched_users), 0) as match_count,
        EXISTS (
            SELECT 1 FROM photo_faces pf WHERE pf.photo_id = p.id
        ) as has_photo_faces
    FROM 
        photos p
    WHERE 
        jsonb_array_length(faces) > 0
)
SELECT 
    p.id,
    p.title,
    p.created_at,
    s.face_count,
    s.match_count,
    s.has_photo_faces
FROM 
    PhotoStats s
JOIN 
    photos p ON s.id = p.id
WHERE 
    s.face_count > 0 
    AND s.match_count = 0
    AND s.has_photo_faces = false
ORDER BY 
    p.created_at DESC
LIMIT 10; 