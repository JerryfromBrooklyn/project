/*
  # Fix RLS policies for users table

  1. Security
    - Enable RLS on users table
    - Add policy for users to manage their own data
    - Add policy for public read access
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create policy to allow users to manage their own data
CREATE POLICY "Users can manage their own data"
ON public.users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow public read access to user profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users
FOR SELECT
TO public
USING (true);