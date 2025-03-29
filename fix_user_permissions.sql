-- Fix the permission issues with the users table

-- First, make sure RLS is disabled on the users table
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;

-- Create a secure function to get user info without direct table access
CREATE OR REPLACE FUNCTION public.get_user_info(p_user_ids UUID[])
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    username TEXT
) 
SECURITY DEFINER  -- Run with elevated privileges
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name,
        u.avatar_url,
        u.email,
        u.username
    FROM 
        public.users u
    WHERE 
        u.id = ANY(p_user_ids);
    
    -- If no results, try the profiles table as a fallback
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.full_name,
            p.avatar_url,
            p.email,
            p.username
        FROM 
            public.profiles p
        WHERE 
            p.id = ANY(p_user_ids);
    END IF;
    
    -- If still no results and we have permission to access auth.users, try that
    IF NOT FOUND THEN
        BEGIN
            RETURN QUERY
            SELECT 
                au.id,
                au.raw_user_meta_data->>'full_name' as full_name,
                au.raw_user_meta_data->>'avatar_url' as avatar_url,
                au.email,
                au.raw_user_meta_data->>'preferred_username' as username
            FROM 
                auth.users au
            WHERE 
                au.id = ANY(p_user_ids);
        EXCEPTION
            WHEN OTHERS THEN
                -- Silently fail if we don't have permission to access auth.users
                NULL;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to all relevant roles
GRANT EXECUTE ON FUNCTION public.get_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_info TO service_role;

-- Create a view for basic user access that can be used more easily
CREATE OR REPLACE VIEW public.user_basic_info AS
SELECT 
    id,
    full_name,
    avatar_url,
    email,
    username
FROM 
    public.users;

-- Grant access to the view
GRANT SELECT ON public.user_basic_info TO authenticated;
GRANT SELECT ON public.user_basic_info TO anon;
GRANT SELECT ON public.user_basic_info TO service_role;

-- Create a function to get a single user by ID
CREATE OR REPLACE FUNCTION public.get_user_by_id(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    username TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.get_user_info(ARRAY[p_user_id]);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_id TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_id TO service_role; 