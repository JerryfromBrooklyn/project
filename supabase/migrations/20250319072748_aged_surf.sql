/*
  # Create face_index table and configure RLS policies

  1. New Tables
    - face_index
      - face_id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - attributes (jsonb)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on face_index table
    - Add policy for users to read their own face data
*/

-- Create face_index table
CREATE TABLE IF NOT EXISTS public.face_index (
  face_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  attributes jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE face_index ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own face data
CREATE POLICY "Users can read own face data"
ON public.face_index
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to manage their own face data
CREATE POLICY "Users can manage own face data"
ON public.face_index
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index on user_id for better query performance
CREATE INDEX face_index_user_id_idx ON public.face_index(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_face_index_updated_at
  BEFORE UPDATE ON face_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();