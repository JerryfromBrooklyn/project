/*
  # Fix face_index table and add proper indexes

  1. Changes
    - Drop and recreate face_index table with proper schema
    - Add indexes for better query performance
    - Update RLS policies
*/

-- Drop existing face_index table
DROP TABLE IF EXISTS public.face_index CASCADE;

-- Create face_index table with proper schema
CREATE TABLE public.face_index (
  face_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  external_image_id text NOT NULL,
  attributes jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT face_index_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE face_index ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX face_index_user_id_idx ON public.face_index(user_id);
CREATE INDEX face_index_external_image_id_idx ON public.face_index(external_image_id);
CREATE INDEX face_index_attributes_gin_idx ON public.face_index USING gin(attributes);

-- Create RLS policies
CREATE POLICY "Users can read own face data"
ON public.face_index
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own face data"
ON public.face_index
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_face_index_updated_at
  BEFORE UPDATE ON face_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();