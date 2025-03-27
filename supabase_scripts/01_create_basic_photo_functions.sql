-- Function to update basic photo details with proper error handling
CREATE OR REPLACE FUNCTION public.update_photo_basic_details(
    p_id UUID,              -- Photo ID
    p_title TEXT,           -- Photo title
    p_date_taken DATE,      -- Date the photo was taken
    p_event_details JSONB,  -- Event details JSON
    p_venue JSONB,          -- Venue information JSON
    p_location JSONB,       -- Location data JSON
    p_event_id UUID DEFAULT NULL  -- Optional event ID
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
            title = COALESCE(p_title, title),
            date_taken = COALESCE(p_date_taken, date_taken),
            event_details = COALESCE(p_event_details, event_details),
            venue = COALESCE(p_venue, venue),
            location = COALESCE(p_location, location),
            event_id = COALESCE(p_event_id, event_id),
            updated_at = NOW()
        WHERE id = p_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Photo updated successfully',
            'photo_id', p_id
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error updating photo: ' || SQLERRM,
            'code', SQLSTATE
        );
    END;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_photo_basic_details(UUID, TEXT, DATE, JSONB, JSONB, JSONB, UUID) TO authenticated; 