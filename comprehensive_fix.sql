-- =========================================================
-- COMPREHENSIVE DATABASE FIX FOR PHOTO UPLOAD AND MATCHING
-- =========================================================
-- This script addresses multiple issues:
-- 1. Ensures RLS is disabled on all tables
-- 2. Fixes the photo upload functions with SECURITY DEFINER
-- 3. Ensures all required columns exist in the photos table
-- 4. Creates a view to unify simple_photos and photos tables
-- 5. Creates efficient indexes for face matching
-- =========================================================

-- Step 1: Ensure RLS is disabled on all relevant tables
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.face_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unassociated_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photo_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.simple_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Ensure all required columns exist in the photos table
DO $$
BEGIN
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Copy data from uploaded_by to user_id
        UPDATE public.photos SET user_id = uploaded_by WHERE user_id IS NULL AND uploaded_by IS NOT NULL;
    END IF;
    
    -- Add url if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'url'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN url TEXT;
        UPDATE public.photos SET url = public_url WHERE url IS NULL AND public_url IS NOT NULL;
    END IF;
    
    -- Add size if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'size'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN size BIGINT;
        UPDATE public.photos SET size = file_size WHERE size IS NULL AND file_size IS NOT NULL;
    END IF;
    
    -- Add type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN type TEXT;
        UPDATE public.photos SET type = file_type WHERE type IS NULL AND file_type IS NOT NULL;
    END IF;
    
    -- Add path if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'path'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN path TEXT;
        UPDATE public.photos SET path = storage_path WHERE path IS NULL AND storage_path IS NOT NULL;
    END IF;
END $$;

-- Step 3: Create or replace the improved simple_photo_insert function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.simple_photo_insert(
    p_id UUID,
    p_user_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_file_size BIGINT DEFAULT 0,
    p_file_type TEXT DEFAULT 'image/jpeg'
)
RETURNS UUID 
SECURITY DEFINER  -- This makes the function run with elevated privileges
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Insert the record with minimal fields
    INSERT INTO public.photos (
        id,
        uploaded_by,
        user_id,
        storage_path,
        path,
        public_url,
        url,
        file_size,
        size,
        file_type,
        type,
        faces,
        matched_users,
        created_at
    ) VALUES (
        p_id,
        p_user_id,
        p_user_id,
        p_storage_path,
        p_storage_path,
        p_public_url,
        p_public_url,
        p_file_size,
        p_file_size,
        p_file_type,
        p_file_type,
        '[]'::jsonb,
        '[]'::jsonb,
        now()
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error in simple_photo_insert: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create or replace the direct_photo_insert function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.direct_photo_insert(
    p_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_uploaded_by UUID,
    p_file_size BIGINT,
    p_file_type TEXT,
    p_event_id UUID DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_photo_id UUID;
BEGIN
  -- Direct insert with absolutely minimal columns
  INSERT INTO public.photos (
    id,
    storage_path,
    path,
    public_url,
    url,
    uploaded_by,
    user_id,
    file_size,
    size,
    file_type,
    type,
    event_id,
    faces,
    matched_users,
    face_ids,
    tags,
    created_at,
    updated_at
  )
  VALUES (
    p_id,
    p_storage_path,
    p_storage_path,
    p_public_url,
    p_public_url,
    p_uploaded_by,
    p_uploaded_by,
    p_file_size,
    p_file_size,
    p_file_type,
    p_file_type,
    p_event_id,
    '[]'::JSONB,
    '[]'::JSONB,
    '{}'::TEXT[],
    '{}'::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO v_photo_id;
  
  RETURN v_photo_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create or replace the all_photos view to unify both tables
DROP VIEW IF EXISTS public.all_photos CASCADE;
CREATE OR REPLACE VIEW public.all_photos AS
SELECT 
    p.id,
    p.uploaded_by,
    p.user_id,
    p.storage_path,
    p.public_url,
    p.url,
    p.folder_path,
    p.folder_name,
    p.file_size,
    p.size,
    p.file_type,
    p.type,
    p.event_id,
    p.faces,
    p.matched_users,
    p.face_ids,
    p.title,
    p.description,
    p.location,
    p.venue,
    p.tags,
    p.date_taken,
    p.event_details,
    p.created_at,
    p.updated_at,
    p.resolution,
    'regular' AS photo_type
FROM 
    public.photos p
UNION ALL
SELECT 
    sp.id,
    sp.uploaded_by,
    sp.uploaded_by AS user_id,
    sp.storage_path,
    sp.public_url,
    sp.public_url AS url,
    NULL AS folder_path,
    NULL AS folder_name,
    sp.file_size,
    sp.file_size AS size,
    sp.file_type,
    sp.file_type AS type,
    sp.event_id,
    '[]'::jsonb AS faces,
    '[]'::jsonb AS matched_users,
    NULL AS face_ids,
    NULL AS title,
    NULL AS description,
    NULL AS location,
    NULL AS venue,
    NULL AS tags,
    NULL AS date_taken,
    NULL AS event_details,
    sp.created_at,
    sp.updated_at,
    NULL AS resolution,
    'simple' AS photo_type
FROM 
    public.simple_photos sp;

-- Step 6: Create a materialized view for efficient face matching
DROP MATERIALIZED VIEW IF EXISTS public.mv_user_matched_photos CASCADE;
CREATE MATERIALIZED VIEW public.mv_user_matched_photos AS
SELECT 
    p.id AS photo_id,
    p.public_url,
    p.created_at,
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    CASE 
        WHEN p.uploaded_by = u.id THEN 100.0
        ELSE COALESCE(
            (SELECT MAX(confidence)
             FROM jsonb_array_elements(p.matched_users) AS mu
             WHERE (mu->>'userId')::UUID = u.id),
            95.0)
    END AS confidence
FROM 
    public.photos p
CROSS JOIN 
    public.users u
WHERE 
    -- User uploaded the photo
    p.uploaded_by = u.id
    OR
    -- User is in the matched_users array
    (p.matched_users IS NOT NULL AND 
     EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(p.matched_users) AS mu
        WHERE (mu->>'userId')::UUID = u.id
     ))
    OR
    -- User is in photo_faces join table
    EXISTS (
        SELECT 1 
        FROM photo_faces pf
        WHERE pf.photo_id = p.id AND pf.user_id = u.id
    )
WITH DATA;

-- Add indexes to the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_user_matched_photos_user_id ON public.mv_user_matched_photos (user_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_matched_photos_photo_id ON public.mv_user_matched_photos (photo_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_matched_photos_created_at ON public.mv_user_matched_photos (created_at DESC);

-- Step 7: Create a trigger to keep the materialized view updated
CREATE OR REPLACE FUNCTION public.refresh_user_matched_photos_trigger()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_matched_photos;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for photos table
DROP TRIGGER IF EXISTS refresh_matches_after_photo_update ON public.photos;
CREATE TRIGGER refresh_matches_after_photo_update
AFTER UPDATE OF matched_users, faces, face_ids
ON public.photos
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_user_matched_photos_trigger();

DROP TRIGGER IF EXISTS refresh_matches_after_photo_insert ON public.photos;
CREATE TRIGGER refresh_matches_after_photo_insert
AFTER INSERT
ON public.photos
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_user_matched_photos_trigger();

-- Create triggers for photo_faces table
DROP TRIGGER IF EXISTS refresh_matches_after_photo_faces_update ON public.photo_faces;
CREATE TRIGGER refresh_matches_after_photo_faces_update
AFTER INSERT OR UPDATE OR DELETE
ON public.photo_faces
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_user_matched_photos_trigger();

-- Step 8: Add grant permission to the security definer functions
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO anon;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO service_role;

GRANT EXECUTE ON FUNCTION public.direct_photo_insert TO authenticated;
GRANT EXECUTE ON FUNCTION public.direct_photo_insert TO anon;
GRANT EXECUTE ON FUNCTION public.direct_photo_insert TO service_role;

-- Step 9: Create an admin account if none exists (useful for first-time setup)
DO $$
DECLARE
    v_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_admin_count FROM public.admins;
    
    IF v_admin_count = 0 THEN
        -- Insert at least one admin user from an existing user
        INSERT INTO public.admins (id)
        SELECT id FROM auth.users LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Step 10: Create function to fix existing photos by updating matched_users
CREATE OR REPLACE FUNCTION public.fix_photo_matches()
RETURNS TABLE(photo_id UUID, users_matched INTEGER) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_photo RECORD;
    v_user_record RECORD;
    v_face_id TEXT;
    v_match_count INTEGER;
    v_matched_users JSONB;
BEGIN
    -- Process all photos with faces but potentially missing matches
    FOR v_photo IN 
        SELECT 
            p.id,
            p.faces,
            p.face_ids,
            p.matched_users
        FROM 
            public.photos p
        WHERE 
            (p.faces IS NOT NULL AND jsonb_array_length(p.faces) > 0)
            OR
            (p.face_ids IS NOT NULL AND array_length(p.face_ids, 1) > 0)
    LOOP
        -- Start with existing matched_users or empty array
        v_matched_users := COALESCE(v_photo.matched_users, '[]'::jsonb);
        v_match_count := 0;
        
        -- Process face_ids array
        IF v_photo.face_ids IS NOT NULL AND array_length(v_photo.face_ids, 1) > 0 THEN
            FOREACH v_face_id IN ARRAY v_photo.face_ids
            LOOP
                -- Find users with this face_id
                FOR v_user_record IN
                    SELECT 
                        fd.user_id,
                        u.full_name,
                        u.avatar_url
                    FROM 
                        face_data fd
                    JOIN
                        users u ON fd.user_id = u.id
                    WHERE 
                        fd.face_id = v_face_id
                LOOP
                    -- Check if user is already in matched_users
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM jsonb_array_elements(v_matched_users) as mu
                        WHERE (mu->>'userId')::UUID = v_user_record.user_id
                    ) THEN
                        -- Add user to matched_users
                        v_matched_users := v_matched_users || jsonb_build_object(
                            'userId', v_user_record.user_id,
                            'fullName', COALESCE(v_user_record.full_name, 'Unknown User'),
                            'avatarUrl', v_user_record.avatar_url,
                            'confidence', 95.0
                        );
                        v_match_count := v_match_count + 1;
                    END IF;
                END LOOP;
            END LOOP;
        END IF;
        
        -- Process faces jsonb array
        IF v_photo.faces IS NOT NULL AND jsonb_array_length(v_photo.faces) > 0 THEN
            FOR i IN 0..jsonb_array_length(v_photo.faces)-1
            LOOP
                v_face_id := jsonb_extract_path_text(v_photo.faces, i, 'faceId');
                
                IF v_face_id IS NOT NULL THEN
                    -- Find users with this face_id
                    FOR v_user_record IN
                        SELECT 
                            fd.user_id,
                            u.full_name,
                            u.avatar_url
                        FROM 
                            face_data fd
                        JOIN
                            users u ON fd.user_id = u.id
                        WHERE 
                            fd.face_id = v_face_id
                    LOOP
                        -- Check if user is already in matched_users
                        IF NOT EXISTS (
                            SELECT 1 
                            FROM jsonb_array_elements(v_matched_users) as mu
                            WHERE (mu->>'userId')::UUID = v_user_record.user_id
                        ) THEN
                            -- Add user to matched_users
                            v_matched_users := v_matched_users || jsonb_build_object(
                                'userId', v_user_record.user_id,
                                'fullName', COALESCE(v_user_record.full_name, 'Unknown User'),
                                'avatarUrl', v_user_record.avatar_url,
                                'confidence', 95.0
                            );
                            v_match_count := v_match_count + 1;
                        END IF;
                    END LOOP;
                END IF;
            END LOOP;
        END IF;
        
        -- Update the photo if we found new matches
        IF v_match_count > 0 THEN
            UPDATE public.photos
            SET matched_users = v_matched_users,
                updated_at = NOW()
            WHERE id = v_photo.id;
            
            -- Also ensure photo_faces entries exist
            FOR v_user_record IN
                SELECT 
                    (mu->>'userId')::UUID as user_id,
                    (mu->>'confidence')::FLOAT as confidence
                FROM 
                    jsonb_array_elements(v_matched_users) as mu
            LOOP
                -- Create photo_faces entry if not exists
                INSERT INTO photo_faces (
                    photo_id,
                    user_id,
                    confidence,
                    face_id
                ) VALUES (
                    v_photo.id,
                    v_user_record.user_id,
                    v_user_record.confidence,
                    'auto-fix'  -- Marker to show this was fixed by this function
                )
                ON CONFLICT (photo_id, user_id) DO NOTHING;
            END LOOP;
            
            -- Return this photo in the results
            photo_id := v_photo.id;
            users_matched := v_match_count;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run the fix function to update existing photos
SELECT * FROM public.fix_photo_matches();

-- Final step: Refresh the materialized view with the latest data
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_matched_photos; 