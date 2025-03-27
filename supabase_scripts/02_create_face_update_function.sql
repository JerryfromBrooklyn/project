-- Function to update photo face IDs with proper error handling
CREATE OR REPLACE FUNCTION public.update_photo_face_ids(
    p_id UUID,              -- Photo ID
    p_face_ids TEXT[],      -- Array of face IDs
    p_faces JSONB           -- Face detection data
)
RETURNS JSONB                 -- Returns status information
LANGUAGE plpgsql
SECURITY DEFINER              -- Run as function owner to bypass RLS
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
    v_photo_exists BOOLEAN;
    v_has_permissions BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate photo exists
    SELECT EXISTS(
        SELECT 1 FROM public.photos WHERE id = p_id
    ) INTO v_photo_exists;
    
    IF NOT v_photo_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Photo not found',
            'code', 'NOT_FOUND'
        );
    END IF;
    
    -- Check if user has permission (either uploaded the photo or is admin)
    SELECT EXISTS(
        SELECT 1 
        FROM public.photos 
        WHERE id = p_id AND (uploaded_by = v_user_id OR v_user_id IN (SELECT id FROM public.admins))
    ) INTO v_has_permissions;
    
    IF NOT v_has_permissions THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Permission denied',
            'code', 'PERMISSION_DENIED'
        );
    END IF;
    
    -- Update the photo with error handling
    BEGIN
        UPDATE public.photos 
        SET 
            face_ids = COALESCE(p_face_ids, face_ids),
            faces = COALESCE(p_faces, faces),
            updated_at = NOW()
        WHERE id = p_id;
        
        -- Process matched users if the faces data exists
        IF p_faces IS NOT NULL AND jsonb_array_length(p_faces) > 0 THEN
            -- This section intentionally avoids accessing the users table directly
            -- to prevent the permission errors
            -- Using a more conservative approach that works within the permissions model
            
            -- Extract user IDs from the faces JSON
            WITH matched_details AS (
                SELECT DISTINCT 
                    (f->>'userId')::UUID as user_id,
                    (f->>'confidence')::FLOAT as confidence
                FROM 
                    jsonb_array_elements(p_faces) AS f
                WHERE 
                    f->>'userId' IS NOT NULL
            )
            -- Update matched_users with user details
            UPDATE public.photos 
            SET matched_users = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', md.user_id,
                        'confidence', md.confidence
                    )
                )
                FROM matched_details md
            )
            WHERE id = p_id;
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Photo face data updated successfully',
            'photo_id', p_id
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error updating photo face data: ' || SQLERRM,
            'code', SQLSTATE
        );
    END;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_photo_face_ids(UUID, TEXT[], JSONB) TO authenticated; 