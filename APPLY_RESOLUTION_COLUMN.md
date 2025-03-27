# Fix Photo Upload by Adding Resolution Column

Follow these steps to add the required `resolution` column to your photos table in Supabase.

## Step 1: Access Supabase SQL Editor

1. Log into your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project (`gmupwzjxirpkskolsuix`)
3. In the left sidebar, click "SQL Editor"

## Step 2: Run the SQL Script

1. Create a new SQL query
2. Copy and paste the following SQL code:

```sql
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
```

3. Click "Run" to execute the query

## Step 3: Verify the Column Was Added

Run this SQL query to verify the column exists:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'photos' 
AND column_name = 'resolution';
```

You should see one row with the column name "resolution" and data type "jsonb".

## Step 4: Test Photo Upload

Return to your application and try uploading a photo again. The error about the missing "resolution" column should be resolved. 