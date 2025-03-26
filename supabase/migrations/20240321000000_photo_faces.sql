-- Create photo_faces table
CREATE TABLE IF NOT EXISTS photo_faces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    face_id UUID REFERENCES face_data(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, face_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photo_faces_photo_id ON photo_faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_faces_face_id ON photo_faces(face_id);
CREATE INDEX IF NOT EXISTS idx_photo_faces_user_id ON photo_faces(user_id);

-- Migrate existing data from photos.matched_users JSONB array
INSERT INTO photo_faces (photo_id, face_id, user_id, confidence)
SELECT 
    p.id as photo_id,
    f.id as face_id,
    (m->>'user_id')::UUID as user_id,
    (m->>'confidence')::FLOAT as confidence
FROM photos p
CROSS JOIN LATERAL jsonb_array_elements(p.matched_users) as m
JOIN face_data f ON f.id = (m->>'face_id')::UUID
WHERE p.matched_users IS NOT NULL;

-- Add RLS policies
ALTER TABLE photo_faces ENABLE ROW LEVEL SECURITY;

-- Policy for inserting photo_faces
CREATE POLICY "Users can insert their own photo_faces"
ON photo_faces FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for selecting photo_faces
CREATE POLICY "Users can view their own photo_faces"
ON photo_faces FOR SELECT
USING (auth.uid() = user_id);

-- Policy for updating photo_faces
CREATE POLICY "Users can update their own photo_faces"
ON photo_faces FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting photo_faces
CREATE POLICY "Users can delete their own photo_faces"
ON photo_faces FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_photo_faces_updated_at
    BEFORE UPDATE ON photo_faces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 