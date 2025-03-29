-- Fix the simple_photo_insert function to match the expected parameter order
-- The application is calling the function with these parameters:
-- p_id, p_user_id, p_storage_path, p_public_url, p_file_size, p_file_type
-- But the function in the database has a different parameter list

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.simple_photo_insert;

-- Create the function with the correct parameter order
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

-- Make sure the RLS is disabled on photos table
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;

-- Grant execute permission on the function to all relevant roles
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO anon;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO service_role;

-- Create a compatibility function for any code that might be using the old signature
CREATE OR REPLACE FUNCTION public.simple_photo_insert(
    p_id UUID,
    p_path TEXT,
    p_url TEXT,
    p_user UUID,
    p_size BIGINT,
    p_type TEXT,
    p_event_id UUID DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Call the new function with remapped parameters
    RETURN public.simple_photo_insert(
        p_id,        -- p_id
        p_user,      -- p_user_id
        p_path,      -- p_storage_path
        p_url,       -- p_public_url
        p_size,      -- p_file_size
        p_type       -- p_file_type
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the compatibility function
GRANT EXECUTE ON FUNCTION public.simple_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert(UUID, TEXT, TEXT, UUID, BIGINT, TEXT, UUID) TO service_role; 