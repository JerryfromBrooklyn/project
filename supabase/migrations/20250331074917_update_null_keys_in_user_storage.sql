-- Step 1: Ensure the 'key' column exists, allowing NULLs initially
ALTER TABLE user_storage ADD COLUMN IF NOT EXISTS key TEXT;

-- Step 2: Update existing rows where 'key' IS currently NULL
-- Assign a default key, assuming these rows were for storing face_id
UPDATE user_storage
SET key = 'face_id'
WHERE key IS NULL;

-- Step 3: Make the 'key' column NOT NULL
-- This should now succeed as we updated NULL values
ALTER TABLE user_storage ALTER COLUMN key SET NOT NULL;

-- Step 4: Re-drop and re-create the primary key to ensure it includes 'key'
ALTER TABLE user_storage DROP CONSTRAINT IF EXISTS user_storage_pkey;
-- Ensure user_id column is also NOT NULL if it's part of the PK
ALTER TABLE user_storage ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_storage ADD PRIMARY KEY (user_id, key);

-- Step 5: Ensure the updated_at trigger exists (from previous migration)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_storage_timestamp ON user_storage;
CREATE TRIGGER update_user_storage_timestamp
BEFORE UPDATE ON user_storage
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
