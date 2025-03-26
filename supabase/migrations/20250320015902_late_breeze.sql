/*
  # Create face_data table and configure RLS policies

  1. New Tables
    - `face_data` table for storing facial recognition data
    - Includes fields for user association and face data

  2. Security
    - Enable RLS on face_data table
    - Add policies for authenticated users
*/

-- Create face_data table
CREATE TABLE IF NOT EXISTS public.face_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  face_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE face_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own face data"
ON public.face_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own face data"
ON public.face_data
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS face_data_user_id_idx ON public.face_data(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_face_data_updated_at
  BEFORE UPDATE ON face_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle face indexing
CREATE OR REPLACE FUNCTION handle_face_indexing()
RETURNS trigger AS $$
BEGIN
  -- Delete any existing face data for this user
  DELETE FROM public.face_data WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger to handle face indexing
CREATE TRIGGER handle_face_indexing
  BEFORE INSERT ON face_data
  FOR EACH ROW
  EXECUTE FUNCTION handle_face_indexing();