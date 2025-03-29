-- Simple photo insert function that bypasses RLS
-- This should be run in the Supabase SQL Editor

-- First disable RLS on the photos table
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;

-- Now create a simple photo insert function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.simple_photo_insert(
    p_id UUID,
    p_user_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_file_size BIGINT DEFAULT 0,
    p_file_type TEXT DEFAULT 'image/jpeg'
)
RETURNS UUID 
SECURITY DEFINER  -- This makes the function run with the privileges of the creator (superuser)
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Insert the minimal record needed
    INSERT INTO public.photos (
        id,
        uploaded_by,
        user_id,
        storage_path,
        public_url,
        url,
        file_size,
        size,
        file_type,
        type,
        created_at
    ) VALUES (
        p_id,
        p_user_id,
        p_user_id,
        p_storage_path,
        p_public_url,
        p_public_url,
        p_file_size,
        p_file_size,
        p_file_type,
        p_file_type,
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

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO anon;
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO service_role; 