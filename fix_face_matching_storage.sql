-- Fix face matching storage in simple_photo_insert function

-- First, modify the simple_photo_insert function to include face_ids and matched_users
DROP FUNCTION IF EXISTS public.simple_photo_insert(UUID, UUID, TEXT, TEXT, BIGINT, TEXT);

CREATE OR REPLACE FUNCTION public.simple_photo_insert(
    p_id UUID,
    p_user_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_file_size BIGINT DEFAULT 0,
    p_file_type TEXT DEFAULT 'image/jpeg',
    p_faces JSONB DEFAULT NULL,
    p_face_ids TEXT[] DEFAULT NULL,
    p_matched_users JSONB DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Insert the record with all fields including face matching data
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
        face_ids,
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
        COALESCE(p_faces, '[]'::jsonb),
        COALESCE(p_face_ids, '{}'::TEXT[]),
        COALESCE(p_matched_users, '[]'::jsonb),
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.simple_photo_insert(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, TEXT[], JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, TEXT[], JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, JSONB, TEXT[], JSONB) TO service_role;

-- Add function to update face matching data after insert
CREATE OR REPLACE FUNCTION public.update_photo_face_matching(
    p_id UUID,
    p_faces JSONB DEFAULT NULL,
    p_face_ids TEXT[] DEFAULT NULL,
    p_matched_users JSONB DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.photos
    SET
        faces = COALESCE(p_faces, faces, '[]'::jsonb),
        face_ids = COALESCE(p_face_ids, face_ids, '{}'::TEXT[]),
        matched_users = COALESCE(p_matched_users, matched_users, '[]'::jsonb),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'photo_id', p_id
    );
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object(
            'success', false,
            'photo_id', p_id,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_photo_face_matching TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_face_matching TO anon;
GRANT EXECUTE ON FUNCTION public.update_photo_face_matching TO service_role;

-- Create a view that combines both tables to ensure the My Photos tab shows all photos
DROP VIEW IF EXISTS public.all_user_photos CASCADE;

CREATE OR REPLACE VIEW public.all_user_photos AS
-- First get photos directly uploaded by the user
SELECT 
    p.id,
    p.uploaded_by AS user_id,
    p.public_url,
    p.faces,
    p.face_ids,
    p.matched_users,
    p.created_at,
    'uploader' AS match_type,
    100 AS confidence
FROM 
    public.photos p
    
UNION ALL

-- Then get photos where user is in the matched_users JSON array
SELECT 
    p.id,
    (m.value->>'userId')::UUID AS user_id,
    p.public_url,
    p.faces,
    p.face_ids,
    p.matched_users,
    p.created_at,
    'matched' AS match_type,
    (m.value->>'confidence')::FLOAT AS confidence
FROM 
    public.photos p,
    jsonb_array_elements(p.matched_users) AS m
WHERE 
    p.matched_users IS NOT NULL
    AND jsonb_array_length(p.matched_users) > 0;

-- Create function to get all photos for a user
CREATE OR REPLACE FUNCTION public.get_all_user_photos(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    url TEXT,
    faces JSONB,
    face_ids TEXT[],
    matched_users JSONB,
    created_at TIMESTAMPTZ,
    match_type TEXT,
    confidence FLOAT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.public_url AS url,
        up.faces,
        up.face_ids,
        up.matched_users,
        up.created_at,
        up.match_type,
        up.confidence
    FROM 
        public.all_user_photos up
    WHERE 
        up.user_id = p_user_id
    ORDER BY 
        up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_user_photos TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_photos TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_user_photos TO service_role; 