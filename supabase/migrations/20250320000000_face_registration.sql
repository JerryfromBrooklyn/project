-- Create face_data table
CREATE TABLE IF NOT EXISTS face_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT NOT NULL,
    face_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create photos table with proper JSONB columns
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    faces JSONB DEFAULT '[]'::jsonb,
    matched_users JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_face_data_user_id ON face_data(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_faces ON photos USING GIN (faces);
CREATE INDEX IF NOT EXISTS idx_photos_matched_users ON photos USING GIN (matched_users);

-- Enable RLS
ALTER TABLE face_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own face data"
    ON face_data FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own face data"
    ON face_data FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all photos"
    ON photos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can upload their own photos"
    ON photos FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own photos"
    ON photos FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploaded_by)
    WITH CHECK (auth.uid() = uploaded_by);

-- Create function to update matched_users
CREATE OR REPLACE FUNCTION update_photo_matches()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure matched_users is always an array
    IF NEW.matched_users IS NULL THEN
        NEW.matched_users = '[]'::jsonb;
    END IF;
    
    -- Ensure faces is always an array
    IF NEW.faces IS NULL THEN
        NEW.faces = '[]'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure JSONB arrays
CREATE TRIGGER ensure_jsonb_arrays
    BEFORE INSERT OR UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_matches(); 