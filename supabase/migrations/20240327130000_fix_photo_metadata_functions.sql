-- Fix photo metadata update functions
-- These functions fix issues with photo uploads and metadata updates

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

-- Create a helper view to avoid direct users table access
CREATE OR REPLACE VIEW public.user_display_data AS
SELECT 
    id,
    email,
    COALESCE(full_name, email) as display_name,
    avatar_url
FROM auth.users;

-- Grant appropriate permissions to allow function execution
GRANT EXECUTE ON FUNCTION public.update_photo_basic_details(UUID, TEXT, DATE, JSONB, JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_photo_face_ids(UUID, TEXT[], JSONB) TO authenticated;

-- Create or replace the admin check function for permission validation
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    );
END;
$$;

-- Create admins table if it doesn't exist (for admin checks)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update RLS policies to ensure proper access control
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies to ensure clean setup
DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON public.photos;

-- Create comprehensive policies
CREATE POLICY "Users can view their own photos"
ON public.photos FOR SELECT
TO authenticated
USING (
    auth.uid() = uploaded_by OR 
    auth.uid() IN (SELECT id FROM public.admins)
);

CREATE POLICY "Users can update their own photos"
ON public.photos FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can view all photos"
ON public.photos FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.admins));

CREATE POLICY "Admins can update all photos"
ON public.photos FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.admins))
WITH CHECK (auth.uid() IN (SELECT id FROM public.admins));
