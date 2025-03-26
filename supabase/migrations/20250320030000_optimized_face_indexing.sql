-- Create a table to store face IDs for registered users
CREATE TABLE IF NOT EXISTS public.face_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE (user_id, face_id)
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS face_data_user_id_idx ON public.face_data (user_id);
-- Create index on face_id
CREATE INDEX IF NOT EXISTS face_data_face_id_idx ON public.face_data (face_id);

-- Add face_ids column to photos table
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS face_ids TEXT[] DEFAULT '{}';

-- Add RLS policies for face_data
ALTER TABLE public.face_data ENABLE ROW LEVEL SECURITY;

-- Users can read all face data (needed for matching)
CREATE POLICY "Users can read all face data" 
  ON public.face_data 
  FOR SELECT 
  USING (true);

-- Users can only create face data for themselves
CREATE POLICY "Users can create their own face data" 
  ON public.face_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own face data
CREATE POLICY "Users can update their own face data" 
  ON public.face_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own face data
CREATE POLICY "Users can delete their own face data" 
  ON public.face_data 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a table to store unassociated faces
CREATE TABLE IF NOT EXISTS public.unassociated_faces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  face_id TEXT NOT NULL,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  external_image_id TEXT NOT NULL,
  attributes JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (face_id)
);

-- Create index on photo_id
CREATE INDEX IF NOT EXISTS unassociated_faces_photo_id_idx ON public.unassociated_faces (photo_id);
-- Create index on face_id
CREATE INDEX IF NOT EXISTS unassociated_faces_face_id_idx ON public.unassociated_faces (face_id);

-- Add RLS policies for unassociated_faces
ALTER TABLE public.unassociated_faces ENABLE ROW LEVEL SECURITY;

-- All users can read unassociated faces
CREATE POLICY "All users can read unassociated faces"
  ON public.unassociated_faces
  FOR SELECT
  USING (true);

-- Only authenticated users can create unassociated faces
CREATE POLICY "Authenticated users can create unassociated faces"
  ON public.unassociated_faces
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can delete unassociated faces if they own the photo
CREATE POLICY "Users can delete unassociated faces for their photos"
  ON public.unassociated_faces
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE public.photos.id = photo_id
      AND public.photos.uploaded_by = auth.uid()
    )
  );

-- Add faceId column to faces JSONB items if it doesn't exist
-- Note: This is a reminder to update any TypeScript interfaces to include the faceId property
COMMENT ON TABLE public.photos IS 'Table storing photo metadata including faces with faceId property';

-- Create functions for real-time updates
CREATE OR REPLACE FUNCTION public.handle_new_face_match()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new face match is found, notify clients
  PERFORM pg_notify(
    'face_match',
    json_build_object(
      'user_id', NEW.user_id,
      'face_id', NEW.face_id,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for real-time updates when new face data is created
CREATE TRIGGER on_face_data_created
  AFTER INSERT ON public.face_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_face_match();

-- The face_ids column is now added at the beginning of the script 