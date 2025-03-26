-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS public.face_data CASCADE;
DROP TABLE IF EXISTS public.face_index CASCADE;

-- Create face_data table with proper constraints
CREATE TABLE public.face_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  face_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT face_data_user_id_key UNIQUE (user_id)
);

-- Create face_index table with proper constraints
CREATE TABLE public.face_index (
  face_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  external_image_id text NOT NULL,
  attributes jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT face_index_user_id_key UNIQUE (user_id),
  CONSTRAINT face_index_external_image_id_key UNIQUE (external_image_id)
);

-- Enable RLS
ALTER TABLE face_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_index ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX face_data_user_id_idx ON public.face_data(user_id);
CREATE INDEX face_index_user_id_idx ON public.face_index(user_id);
CREATE INDEX face_index_external_image_id_idx ON public.face_index(external_image_id);
CREATE INDEX face_index_attributes_gin_idx ON public.face_index USING gin(attributes);

-- Create RLS policies
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

CREATE POLICY "Users can read own face index"
ON public.face_index
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own face index"
ON public.face_index
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create sync function
CREATE OR REPLACE FUNCTION sync_face_data()
RETURNS trigger AS $$
BEGIN
  -- Delete any existing face data and index for this user
  DELETE FROM public.face_data WHERE user_id = NEW.user_id;
  DELETE FROM public.face_index WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers
CREATE TRIGGER sync_face_data_trigger
  BEFORE INSERT ON face_data
  FOR EACH ROW
  EXECUTE FUNCTION sync_face_data();

CREATE TRIGGER update_face_data_updated_at
  BEFORE UPDATE ON face_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_face_index_updated_at
  BEFORE UPDATE ON face_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();