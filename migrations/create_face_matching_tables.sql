-- Create face_matches table to store all face similarity relationships
CREATE TABLE IF NOT EXISTS public.face_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    face_id TEXT NOT NULL,
    matched_face_id TEXT NOT NULL,
    similarity FLOAT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(face_id, matched_face_id)
);

-- Create face_user_associations table for quick lookups
CREATE TABLE IF NOT EXISTS public.face_user_associations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    face_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, face_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_face_matches_face_id ON public.face_matches(face_id);
CREATE INDEX IF NOT EXISTS idx_face_matches_matched_face_id ON public.face_matches(matched_face_id);
CREATE INDEX IF NOT EXISTS idx_face_matches_user_id ON public.face_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_face_user_assoc_face_id ON public.face_user_associations(face_id);
CREATE INDEX IF NOT EXISTS idx_face_user_assoc_user_id ON public.face_user_associations(user_id);

-- Add RLS policies
ALTER TABLE public.face_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_user_associations ENABLE ROW LEVEL SECURITY;

-- Face matches policies
CREATE POLICY "Users can read their own face matches"
    ON public.face_matches
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own face matches"
    ON public.face_matches
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Face user associations policies
CREATE POLICY "Users can read face associations"
    ON public.face_user_associations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own face associations"
    ON public.face_user_associations
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_face_matches_updated_at
    BEFORE UPDATE ON public.face_matches
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_face_user_assoc_updated_at
    BEFORE UPDATE ON public.face_user_associations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 