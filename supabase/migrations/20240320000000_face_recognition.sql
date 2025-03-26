-- Create face_data table
CREATE TABLE IF NOT EXISTS face_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT NOT NULL,
    face_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create photo_faces junction table for face matches
CREATE TABLE IF NOT EXISTS photo_faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confidence FLOAT NOT NULL,
    face_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(photo_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_face_data_user_id ON face_data(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photo_faces_photo_id ON photo_faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_faces_user_id ON photo_faces(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_face_data_updated_at ON face_data;
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
DROP TRIGGER IF EXISTS on_face_registration ON face_data;
DROP TRIGGER IF EXISTS on_face_matching ON photo_faces;

-- Create triggers for updated_at
CREATE TRIGGER update_face_data_updated_at
    BEFORE UPDATE ON face_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle face registration
CREATE OR REPLACE FUNCTION handle_face_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if this is a new record or if the face_id has changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.face_id != NEW.face_id) THEN
        -- Delete old face data if exists
        DELETE FROM face_data WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for face registration
CREATE TRIGGER on_face_registration
    BEFORE INSERT OR UPDATE ON face_data
    FOR EACH ROW
    EXECUTE FUNCTION handle_face_registration();

-- Create function to handle face matching
CREATE OR REPLACE FUNCTION handle_face_matching()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if this is a new record or if the confidence has changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.confidence != NEW.confidence) THEN
        -- Delete old matches for this user in this photo
        DELETE FROM photo_faces 
        WHERE photo_id = NEW.photo_id AND user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for face matching
CREATE TRIGGER on_face_matching
    BEFORE INSERT OR UPDATE ON photo_faces
    FOR EACH ROW
    EXECUTE FUNCTION handle_face_matching(); 