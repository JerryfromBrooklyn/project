-- Migration to add resolution column to photos table
-- This fixes the error: "Could not find the 'resolution' column of 'photos' in the schema cache"

-- Check if the column already exists before adding it
DO $$ 
BEGIN
    -- Add resolution column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'photos' 
        AND column_name = 'resolution'
    ) THEN
        -- Add resolution as JSONB type to store width and height
        ALTER TABLE public.photos 
        ADD COLUMN resolution JSONB DEFAULT '{"width": null, "height": null}';
        
        -- Log the change
        RAISE NOTICE 'Added resolution column to photos table';
    ELSE
        RAISE NOTICE 'Resolution column already exists in photos table';
    END IF;
END $$; 