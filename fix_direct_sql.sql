-- PERMISSION FIXES - RUN THIS IN THE SUPABASE SQL DASHBOARD

-- 1. Disable Row Level Security on all tables
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.face_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unassociated_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photo_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Make sure user is admin
UPDATE public.users
SET role = 'admin'
WHERE id = '3594c5c0-676d-4732-89be-ed7372696853';

-- 3. Create the admin function with the correct columns
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

-- 4. Grant permissions to the function
GRANT EXECUTE ON FUNCTION admin_create_photo TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_photo TO anon;
GRANT EXECUTE ON FUNCTION admin_create_photo TO service_role;

-- 5. Add any missing columns if they don't exist
DO $$
BEGIN
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
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
END $$; 