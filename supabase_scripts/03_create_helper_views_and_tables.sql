-- Create a helper view to avoid direct users table access
CREATE OR REPLACE VIEW public.user_display_data AS
SELECT 
    id,
    email,
    email as display_name,
    avatar_url
FROM auth.users;

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