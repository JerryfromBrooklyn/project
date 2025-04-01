-- Add the missing 'key' column to user_storage table
-- Make it part of a composite primary key with user_id for upsert to work

-- Drop primary key if it exists without 'key'
ALTER TABLE user_storage DROP CONSTRAINT IF EXISTS user_storage_pkey;

-- Add the 'key' column if it doesn't exist
ALTER TABLE user_storage ADD COLUMN IF NOT EXISTS key TEXT;

-- Ensure 'key' column is not null if making it part of PK
-- You might need to populate existing rows first if any exist with null key
-- UPDATE user_storage SET key = 'default_key' WHERE key IS NULL;
ALTER TABLE user_storage ALTER COLUMN key SET NOT NULL;

-- Create the composite primary key
ALTER TABLE user_storage ADD PRIMARY KEY (user_id, key);

-- Add updated_at trigger if not present
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
