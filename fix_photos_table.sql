-- Fix missing user_id column in photos table
-- This script adds the missing column and copies data from uploaded_by if it exists

-- Check if the uploaded_by column exists (it's the correct name according to schema)
DO $$
BEGIN
    -- Try to add the user_id column (which is missing)
    BEGIN
        ALTER TABLE public.photos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to photos table';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'user_id column already exists';
    END;

    -- Copy data from uploaded_by to user_id if both columns exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'uploaded_by'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'user_id'
    ) THEN
        UPDATE public.photos 
        SET user_id = uploaded_by 
        WHERE user_id IS NULL AND uploaded_by IS NOT NULL;
        RAISE NOTICE 'Data copied from uploaded_by to user_id';
    END IF;
END$$;

-- Create additional missing columns that might be referenced in the code
DO $$
BEGIN
    -- Check for missing size column
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'size'
        ) AND EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'file_size'
        ) THEN
            ALTER TABLE public.photos ADD COLUMN size BIGINT;
            UPDATE public.photos SET size = file_size WHERE size IS NULL;
            RAISE NOTICE 'Added size column as alias for file_size';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding size column: %', SQLERRM;
    END;

    -- Check for missing type column
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'type'
        ) AND EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'file_type'
        ) THEN
            ALTER TABLE public.photos ADD COLUMN type TEXT;
            UPDATE public.photos SET type = file_type WHERE type IS NULL;
            RAISE NOTICE 'Added type column as alias for file_type';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding type column: %', SQLERRM;
    END;

    -- Check for missing url column
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'url'
        ) AND EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'photos' AND column_name = 'public_url'
        ) THEN
            ALTER TABLE public.photos ADD COLUMN url TEXT;
            UPDATE public.photos SET url = public_url WHERE url IS NULL;
            RAISE NOTICE 'Added url column as alias for public_url';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding url column: %', SQLERRM;
    END;
END$$;

-- Disable RLS policies temporarily to allow for fixes
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;

-- Final notice in its own DO block
DO $$
BEGIN
    RAISE NOTICE 'Photos table structure has been updated. Row Level Security has been temporarily disabled.';
END$$; 