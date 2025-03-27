-- Make Jerry@jerry.com an admin
BEGIN;

-- First, find Jerry's user ID from the auth.users table
DO $$
DECLARE
    jerry_user_id UUID;
    profile_exists BOOLEAN;
    correct_table_name TEXT;
BEGIN
    -- Get Jerry's user ID
    SELECT id INTO jerry_user_id
    FROM auth.users
    WHERE email = 'jerry@jerry.com';

    -- Make sure Jerry exists
    IF jerry_user_id IS NULL THEN
        RAISE EXCEPTION 'User jerry@jerry.com not found';
    END IF;

    -- Determine which table exists and has a role column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND table_schema = 'public') THEN
        correct_table_name := 'profiles';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role' AND table_schema = 'public') THEN
        correct_table_name := 'user_profiles';
    ELSE
        RAISE EXCEPTION 'No suitable profiles table found with role column';
    END IF;

    -- Execute the appropriate update based on the table name
    IF correct_table_name = 'profiles' THEN
        -- Check if a profile already exists
        SELECT EXISTS (SELECT 1 FROM profiles WHERE id = jerry_user_id) INTO profile_exists;
        
        IF profile_exists THEN
            -- Update the existing profile to have the admin role
            UPDATE profiles
            SET role = 'admin'
            WHERE id = jerry_user_id;
            
            RAISE NOTICE 'User jerry@jerry.com has been updated to admin role in profiles table';
        ELSE
            -- Create a new profile with admin role if one doesn't exist
            INSERT INTO profiles (id, role, created_at, updated_at)
            VALUES (jerry_user_id, 'admin', NOW(), NOW());
            
            RAISE NOTICE 'Created new profile for jerry@jerry.com with admin role in profiles table';
        END IF;
    ELSE -- using user_profiles
        -- Check if a profile already exists
        SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = jerry_user_id) INTO profile_exists;
        
        IF profile_exists THEN
            -- Update the existing profile to have the admin role
            UPDATE user_profiles
            SET role = 'admin'
            WHERE id = jerry_user_id;
            
            RAISE NOTICE 'User jerry@jerry.com has been updated to admin role in user_profiles table';
        ELSE
            -- Create a new profile with admin role if one doesn't exist
            INSERT INTO user_profiles (id, role, created_at, updated_at)
            VALUES (jerry_user_id, 'admin', NOW(), NOW());
            
            RAISE NOTICE 'Created new profile for jerry@jerry.com with admin role in user_profiles table';
        END IF;
    END IF;
END $$;

COMMIT; 