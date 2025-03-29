-- Create a reliable photo verification function that queries both tables
-- This will help fix the 406 Not Acceptable errors when verifying photos

CREATE OR REPLACE FUNCTION public.verify_photo_exists(p_photo_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    photo_data JSONB := NULL;
    photo_exists BOOLEAN := FALSE;
    source_table TEXT := '';
BEGIN
    -- Try photos table first
    SELECT EXISTS(
        SELECT 1 FROM public.photos WHERE id = p_photo_id
    ) INTO photo_exists;
    
    IF photo_exists THEN
        source_table := 'photos';
        SELECT
            jsonb_build_object(
                'id', p.id,
                'uploaded_by', p.uploaded_by,
                'user_id', p.user_id,
                'storage_path', p.storage_path,
                'public_url', p.public_url,
                'url', p.url,
                'file_size', p.file_size,
                'file_type', p.file_type,
                'faces', p.faces,
                'matched_users', p.matched_users,
                'face_ids', p.face_ids,
                'location', p.location,
                'venue', p.venue,
                'event_details', p.event_details,
                'tags', p.tags,
                'title', p.title,
                'date_taken', p.date_taken,
                'created_at', p.created_at,
                'source_table', source_table
            )
        INTO photo_data
        FROM public.photos p
        WHERE p.id = p_photo_id;
        
        RETURN photo_data;
    END IF;
    
    -- If not in photos, try simple_photos
    SELECT EXISTS(
        SELECT 1 FROM public.simple_photos WHERE id = p_photo_id
    ) INTO photo_exists;
    
    IF photo_exists THEN
        source_table := 'simple_photos';
        SELECT
            jsonb_build_object(
                'id', s.id,
                'uploaded_by', s.uploaded_by,
                'user_id', s.uploaded_by,
                'storage_path', s.storage_path,
                'public_url', s.public_url,
                'url', s.public_url,
                'file_size', s.file_size,
                'file_type', s.file_type,
                'faces', s.faces,
                'matched_users', s.matched_users,
                'face_ids', s.face_ids,
                'location', s.location,
                'venue', s.venue,
                'event_details', s.event_details,
                'tags', s.tags,
                'title', s.title,
                'date_taken', s.date_taken,
                'created_at', s.created_at,
                'source_table', source_table
            )
        INTO photo_data
        FROM public.simple_photos s
        WHERE s.id = p_photo_id;
        
        RETURN photo_data;
    END IF;
    
    -- If photo not found in either table
    RETURN jsonb_build_object(
        'id', p_photo_id,
        'exists', FALSE,
        'source_table', 'none'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_photo_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_photo_exists TO anon;
GRANT EXECUTE ON FUNCTION public.verify_photo_exists TO service_role; 