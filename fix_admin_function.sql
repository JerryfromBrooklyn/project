-- Fix the admin_create_photo function to use only columns that exist
DROP FUNCTION IF EXISTS public.admin_create_photo;

CREATE OR REPLACE FUNCTION admin_create_photo(
    p_id UUID,
    p_uploaded_by UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_faces JSONB DEFAULT '[]',
    p_matched_users JSONB DEFAULT '[]',
    p_file_size BIGINT DEFAULT 0,
    p_file_type TEXT DEFAULT 'image/jpeg'
) RETURNS VOID 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        faces, 
        matched_users
    ) VALUES (
        p_id, 
        p_uploaded_by,
        p_uploaded_by, 
        p_storage_path,
        p_public_url,
        p_public_url, 
        p_file_size,
        p_file_size,
        p_file_type,
        p_file_type,
        p_faces, 
        p_matched_users
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the admin function
GRANT EXECUTE ON FUNCTION admin_create_photo TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_photo TO anon;
GRANT EXECUTE ON FUNCTION admin_create_photo TO service_role;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.face_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unassociated_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photo_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Make the user admin
UPDATE public.users
SET role = 'admin'
WHERE id = '3594c5c0-676d-4732-89be-ed7372696853'; 