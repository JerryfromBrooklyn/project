-- Fix face_matches table for photo matching

-- Drop the table if it exists with any issues
DROP TABLE IF EXISTS face_matches CASCADE;

-- Create face_matches table with proper structure
CREATE TABLE IF NOT EXISTS face_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    face_id TEXT NOT NULL,
    matched_face_id TEXT NOT NULL,
    similarity FLOAT,
    confidence FLOAT,
    user_id UUID REFERENCES auth.users(id),
    photo_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient lookup
CREATE INDEX IF NOT EXISTS face_matches_face_id_idx ON face_matches(face_id);
CREATE INDEX IF NOT EXISTS face_matches_matched_face_id_idx ON face_matches(matched_face_id);
CREATE INDEX IF NOT EXISTS face_matches_user_id_idx ON face_matches(user_id);
CREATE INDEX IF NOT EXISTS face_matches_photo_id_idx ON face_matches(photo_id);

-- Add RLS policies
ALTER TABLE face_matches ENABLE ROW LEVEL SECURITY;

-- Allow select for all authenticated users
CREATE POLICY face_matches_select_policy
    ON face_matches
    FOR SELECT
    USING (true);

-- Only allow insert/update by the user themselves or admins
CREATE POLICY face_matches_insert_policy
    ON face_matches
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY face_matches_update_policy
    ON face_matches
    FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create function to find matching photos by face ID
CREATE OR REPLACE FUNCTION find_matching_photos(
    p_face_id TEXT,
    p_similarity_threshold FLOAT DEFAULT 80.0
)
RETURNS TABLE (
    photo_id TEXT,
    similarity FLOAT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT
        photo_id,
        similarity
    FROM
        face_matches
    WHERE
        face_id = p_face_id
        AND similarity >= p_similarity_threshold
        AND photo_id IS NOT NULL
    ORDER BY
        similarity DESC;
$$;

-- Add timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_face_matches_timestamp
BEFORE UPDATE ON face_matches
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
