-- These seeds are for testing purposes only
-- This file will be executed when running 'supabase db reset'

-- Create test users if they don't exist yet (will be ignored on remote DB, only for local dev)
DO $$
DECLARE
    test_user_1_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2_id UUID := '22222222-2222-2222-2222-222222222222';
    test_user_3_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Only attempt to create users if we're in a local dev environment
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'auth') THEN
        -- Create test user 1 if it doesn't exist
        INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
        VALUES (
            test_user_1_id,
            'test1@example.com',
            now(),
            jsonb_build_object('full_name', 'Test User 1')
        )
        ON CONFLICT (id) DO NOTHING;

        -- Create test user 2 if it doesn't exist
        INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
        VALUES (
            test_user_2_id,
            'test2@example.com',
            now(),
            jsonb_build_object('full_name', 'Test User 2')
        )
        ON CONFLICT (id) DO NOTHING;

        -- Create test user 3 if it doesn't exist
        INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
        VALUES (
            test_user_3_id,
            'test3@example.com',
            now(),
            jsonb_build_object('full_name', 'Test User 3')
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Insert test data for linked accounts
DO $$
DECLARE
    test_user_1_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2_id UUID := '22222222-2222-2222-2222-222222222222';
    test_user_3_id UUID := '33333333-3333-3333-3333-333333333333';
    test_identity_group_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Create a test identity group with users 1 and 2 linked
    INSERT INTO public.linked_accounts (identity_group_id, user_id)
    VALUES 
        (test_identity_group_id, test_user_1_id),
        (test_identity_group_id, test_user_2_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Note: User 3 is intentionally left unlinked for testing purposes
END $$;

-- Insert test photos 
DO $$
DECLARE
    test_user_1_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2_id UUID := '22222222-2222-2222-2222-222222222222';
    test_user_3_id UUID := '33333333-3333-3333-3333-333333333333';
    
    test_photo_1_id UUID := '55555555-5555-5555-5555-555555555555';
    test_photo_2_id UUID := '66666666-6666-6666-6666-666666666666';
    test_photo_3_id UUID := '77777777-7777-7777-7777-777777777777';
    
    -- Create matched users arrays for testing
    user1_match jsonb := jsonb_build_object(
        'userId', test_user_1_id::text,
        'fullName', 'Test User 1',
        'confidence', 99.9,
        'matchType', 'test'
    );
    
    user2_match jsonb := jsonb_build_object(
        'userId', test_user_2_id::text,
        'fullName', 'Test User 2',
        'confidence', 99.8,
        'matchType', 'test'
    );
    
    user3_match jsonb := jsonb_build_object(
        'userId', test_user_3_id::text,
        'fullName', 'Test User 3',
        'confidence', 99.7,
        'matchType', 'test'
    );
BEGIN
    -- Only run if photos table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'photos' AND schemaname = 'public') THEN
        -- Photo 1: Matched with users 1 and 2 (linked accounts)
        INSERT INTO public.photos (
            id, 
            uploaded_by, 
            matched_users,
            storage_path,
            public_url,
            created_at
        )
        VALUES (
            test_photo_1_id,
            test_user_1_id,
            jsonb_build_array(user1_match, user2_match),
            'test/photo1.jpg',
            'https://example.com/photos/test/photo1.jpg',
            now()
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Photo 2: Matched with user 1 only
        INSERT INTO public.photos (
            id, 
            uploaded_by, 
            matched_users,
            storage_path,
            public_url,
            created_at
        )
        VALUES (
            test_photo_2_id,
            test_user_2_id,
            jsonb_build_array(user1_match),
            'test/photo2.jpg',
            'https://example.com/photos/test/photo2.jpg',
            now()
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Photo 3: Matched with user 3 only (unlinked account)
        INSERT INTO public.photos (
            id, 
            uploaded_by, 
            matched_users,
            storage_path,
            public_url,
            created_at
        )
        VALUES (
            test_photo_3_id,
            test_user_3_id,
            jsonb_build_array(user3_match),
            'test/photo3.jpg',
            'https://example.com/photos/test/photo3.jpg',
            now()
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$; 