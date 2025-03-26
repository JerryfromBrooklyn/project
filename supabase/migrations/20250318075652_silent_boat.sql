/*
  # Fix RLS policies for users table

  1. Security
    - Enable RLS on users table
    - Add policy for users to manage their own data
    - Add policy for users to insert their own data during signup
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own data
CREATE POLICY "Users can manage their own data"
ON public.users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow users to insert their own data during signup
CREATE POLICY "Users can insert their own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);