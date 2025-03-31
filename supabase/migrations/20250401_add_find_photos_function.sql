-- Migration to add function for efficiently finding photos with face IDs
-- This optimizes the face matching process by using a single efficient database query

-- Function to find photos containing any of the provided face IDs
CREATE OR REPLACE FUNCTION find_photos_with_face_ids(face_id_list TEXT[])
RETURNS SETOF JSONB AS $$
DECLARE
    v_photo RECORD;
    v_result JSONB;
BEGIN
    -- First try photos table
    FOR v_photo IN
        SELECT 
            id, 
            faces, 
            face_ids, 
            matched_users,
            'photos' AS source_table
        FROM 
            photos
        WHERE
            -- Check in face_ids array column
            (face_ids IS NOT NULL AND face_ids && face_id_list)
            OR
            -- Check in faces JSONB array for faceId property
            (
                faces IS NOT NULL AND 
                EXISTS (
                    SELECT 1 
                    FROM jsonb_array_elements(faces) AS face 
                    WHERE face->>'faceId' IN (SELECT unnest(face_id_list))
                )
            )
    LOOP
        v_result := jsonb_build_object(
            'id', v_photo.id,
            'faces', v_photo.faces,
            'face_ids', v_photo.face_ids,
            'matched_users', v_photo.matched_users,
            'source_table', v_photo.source_table
        );
        
        RETURN NEXT v_result;
    END LOOP;
    
    -- Then try simple_photos table if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'simple_photos'
    ) THEN
        FOR v_photo IN
            SELECT 
                id, 
                faces, 
                face_ids, 
                matched_users,
                'simple_photos' AS source_table
            FROM 
                simple_photos
            WHERE
                -- Check in face_ids array column
                (face_ids IS NOT NULL AND face_ids && face_id_list)
                OR
                -- Check in faces JSONB array for faceId property
                (
                    faces IS NOT NULL AND 
                    EXISTS (
                        SELECT 1 
                        FROM jsonb_array_elements(faces) AS face 
                        WHERE face->>'faceId' IN (SELECT unnest(face_id_list))
                    )
                )
        LOOP
            v_result := jsonb_build_object(
                'id', v_photo.id,
                'faces', v_photo.faces,
                'face_ids', v_photo.face_ids,
                'matched_users', v_photo.matched_users,
                'source_table', v_photo.source_table
            );
            
            RETURN NEXT v_result;
        END LOOP;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create appropriate indexes to optimize the face ID lookups
DO $$
BEGIN
    -- Add index on face_ids array for photos table
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'photos' AND indexname = 'idx_photos_face_ids'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_photos_face_ids ON photos USING GIN (face_ids);
    END IF;
    
    -- Add index on face_ids array for simple_photos table if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'simple_photos'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'simple_photos' AND indexname = 'idx_simple_photos_face_ids'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_simple_photos_face_ids ON simple_photos USING GIN (face_ids);
    END IF;
    
    -- Add index for JSONB path lookup if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'photos' AND indexname = 'idx_photos_faces_faceid'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_photos_faces_faceid ON photos USING GIN ((faces->'faceId'));
    END IF;
    
    -- Add index for simple_photos JSONB path lookup if table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'simple_photos'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'simple_photos' AND indexname = 'idx_simple_photos_faces_faceid'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_simple_photos_faces_faceid ON simple_photos USING GIN ((faces->'faceId'));
    END IF;
END $$; 