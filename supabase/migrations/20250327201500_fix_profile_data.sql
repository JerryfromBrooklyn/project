-- Fix profile data for face matching
-- This migration ensures user data is available in the users table

-- First check if any user data is missing
DO $$
DECLARE
    user_count INT;
    profile_count INT;
BEGIN
    -- Count users in auth.users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Count users in public.users
    SELECT COUNT(*) INTO profile_count FROM public.users;
    
    RAISE NOTICE 'Found % users in auth.users and % profiles in public.users', user_count, profile_count;
    
    -- If we have fewer profiles than users, create the missing ones
    IF profile_count < user_count THEN
        RAISE NOTICE 'Creating missing user profiles...';
        
        -- Insert missing profiles
        INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
        SELECT 
            au.id, 
            au.email, 
            au.raw_user_meta_data->>'full_name',
            COALESCE(au.raw_user_meta_data->>'user_type', 'attendee'),
            au.created_at,
            NOW()
        FROM 
            auth.users au
        LEFT JOIN 
            public.users pu ON au.id = pu.id
        WHERE 
            pu.id IS NULL;
            
        -- Insert missing user_profiles if that table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
            INSERT INTO public.user_profiles (id, user_id, metadata, created_at, updated_at)
            SELECT 
                au.id,
                au.id,
                jsonb_build_object(
                    'full_name', au.raw_user_meta_data->>'full_name',
                    'avatar_url', au.raw_user_meta_data->>'avatar_url',
                    'user_type', COALESCE(au.raw_user_meta_data->>'user_type', 'attendee')
                ),
                au.created_at,
                NOW()
            FROM 
                auth.users au
            LEFT JOIN 
                public.user_profiles up ON au.id = up.id
            WHERE 
                up.id IS NULL;
        END IF;
    END IF;
END $$;

-- Ensure the face_data table is correctly set up
CREATE TABLE IF NOT EXISTS public.face_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT,
    face_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make sure all face_data entries have valid face_ids
UPDATE public.face_data
SET face_id = face_data->>'aws_face_id'
WHERE face_id IS NULL AND face_data->>'aws_face_id' IS NOT NULL;

-- Refresh all views with user data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_matched_photos' AND table_schema = 'public') THEN
        REFRESH VIEW public.user_matched_photos;
    END IF;
END $$;

-- Run the function to scan for face matches
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'scan_all_photos_for_face_matches' AND routine_schema = 'public') THEN
        PERFORM public.scan_all_photos_for_face_matches();
    END IF;
END $$; 