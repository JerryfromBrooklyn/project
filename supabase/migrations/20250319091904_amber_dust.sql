/*
  # Fix RLS policies for user_storage table

  1. Changes
    - Drop existing RLS policies
    - Create new policies for storage management
    - Add policy for initial storage record creation
  
  2. Security
    - Users can only view and manage their own storage data
    - Allow authenticated users to create their initial storage record
*/

-- Drop existing policies
DROP POLICY IF EXISTS "storage_view_own" ON public.user_storage;
DROP POLICY IF EXISTS "storage_insert_own" ON public.user_storage;
DROP POLICY IF EXISTS "storage_update_own" ON public.user_storage;

-- Enable RLS
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own storage data
CREATE POLICY "storage_view_own"
ON public.user_storage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy to allow users to create their initial storage record
CREATE POLICY "storage_insert_own"
ON public.user_storage
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own storage data
CREATE POLICY "storage_update_own"
ON public.user_storage
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create trigger to automatically create storage record for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_storage (user_id, total_size, quota_limit)
  VALUES (NEW.id, 0, 10737418240)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert storage records for existing users
INSERT INTO public.user_storage (user_id, total_size, quota_limit)
SELECT id, 0, 10737418240
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;