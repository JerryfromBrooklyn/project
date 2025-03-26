-- Fix the "column u.full_name does not exist" error by adding the missing column

-- Check if the users table exists, and if it doesn't have a full_name column, add it
DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'full_name'
    ) THEN
        -- Add the column
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
        
        -- Populate it from existing data if possible
        UPDATE public.users u
        SET full_name = u.metadata->>'full_name'
        WHERE u.metadata->>'full_name' IS NOT NULL;
        
        -- Also try to populate from user_profiles if available
        UPDATE public.users u
        SET full_name = p.metadata->>'full_name'
        FROM public.user_profiles p
        WHERE u.id = p.user_id 
        AND p.metadata->>'full_name' IS NOT NULL
        AND u.full_name IS NULL;
    END IF;
END $$; 