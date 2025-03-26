/*
  # Fix user signup database handling

  1. Changes
    - Drop existing triggers and functions with proper CASCADE
    - Create improved user handling function
    - Add trigger for new user creation
    - Ensure proper table creation order
  
  2. Security
    - Maintain RLS policies
    - Ensure proper user data initialization
*/

-- Drop existing trigger with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop existing function with CASCADE
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop existing trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;

-- Drop existing function for updated_at if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Ensure users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'attendee',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create improved user handling function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create users entry
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'attendee')
  );

  -- Create storage quota entry
  INSERT INTO public.user_storage (
    user_id,
    total_size,
    quota_limit
  ) VALUES (
    NEW.id,
    0,
    10737418240
  );

  RETURN NEW;
END;
$$ language plpgsql;

-- Add updated_at trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create new trigger for auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can view public profiles"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);