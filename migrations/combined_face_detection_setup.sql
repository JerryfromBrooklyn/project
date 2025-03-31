-- First, drop dependent views
DROP VIEW IF EXISTS users_with_faces CASCADE;

-- Function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(table_name text, policy_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = policy_name
    );
END;
$$ LANGUAGE plpgsql;

-- Create the updated_at timestamp handler if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop redundant tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS face_data CASCADE;
DROP TABLE IF EXISTS user_faces CASCADE;
DROP TABLE IF EXISTS face_matches CASCADE;

-- Create optimized face_matches table
CREATE TABLE public.face_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_face_id TEXT NOT NULL,
    matched_face_id TEXT NOT NULL,
    similarity FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_face_id, matched_face_id)
);

-- Now add indexes after table is created
CREATE INDEX idx_face_matches_source ON face_matches(source_face_id);
CREATE INDEX idx_face_matches_matched ON face_matches(matched_face_id);
CREATE INDEX idx_face_matches_composite ON face_matches(source_face_id, matched_face_id);

-- Drop existing user_face_data to ensure clean state
DROP TABLE IF EXISTS user_face_data CASCADE;

-- Create user-face associations table
CREATE TABLE public.user_face_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(face_id)
);

-- Add indexes after table is created
CREATE INDEX idx_user_face_user_id ON user_face_data(user_id);
CREATE INDEX idx_user_face_face_id ON user_face_data(face_id);

-- Enable RLS
ALTER TABLE public.face_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_face_data ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ BEGIN
    -- Policies for face_matches
    IF NOT policy_exists('face_matches', 'Users can read face matches') THEN
        CREATE POLICY "Users can read face matches"
            ON public.face_matches
            FOR SELECT
            TO authenticated
            USING (EXISTS (
                SELECT 1 FROM user_face_data
                WHERE user_id = auth.uid()
                AND (face_id = face_matches.source_face_id OR face_id = face_matches.matched_face_id)
            ));
    END IF;

    -- Policies for user_face_data
    IF NOT policy_exists('user_face_data', 'Users can read their own face data') THEN
        CREATE POLICY "Users can read their own face data"
            ON public.user_face_data
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    IF NOT policy_exists('user_face_data', 'Users can insert their own face data') THEN
        CREATE POLICY "Users can insert their own face data"
            ON public.user_face_data
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_user_face_data_updated_at ON public.user_face_data;
CREATE TRIGGER set_user_face_data_updated_at
    BEFORE UPDATE ON public.user_face_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Recreate the users_with_faces view with new schema
CREATE OR REPLACE VIEW users_with_faces AS
SELECT 
    u.id as user_id,
    u.email,
    ufd.face_id,
    ufd.created_at as face_registered_at
FROM auth.users u
LEFT JOIN user_face_data ufd ON u.id = ufd.user_id;

-- 2. Create optimized face_detection_results table
CREATE TABLE IF NOT EXISTS public.face_detection_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_path TEXT NOT NULL UNIQUE,
    face_count INTEGER NOT NULL DEFAULT 0,
    face_ids TEXT[] DEFAULT '{}',
    confidence_scores FLOAT[] DEFAULT '{}',
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.face_detection_results ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ BEGIN
    IF NOT policy_exists('face_detection_results', 'Allow authenticated users to read face detection results') THEN
        CREATE POLICY "Allow authenticated users to read face detection results"
            ON public.face_detection_results
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT policy_exists('face_detection_results', 'Allow service role to manage face detection results') THEN
        CREATE POLICY "Allow service role to manage face detection results"
            ON public.face_detection_results
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS set_updated_at ON public.face_detection_results;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.face_detection_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Create face_details table for storing detailed face data
CREATE TABLE IF NOT EXISTS public.face_details (
    face_id TEXT PRIMARY KEY,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.face_details ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ BEGIN
    IF NOT policy_exists('face_details', 'Allow authenticated users to read face details') THEN
        CREATE POLICY "Allow authenticated users to read face details"
            ON public.face_details
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT policy_exists('face_details', 'Allow service role to manage face details') THEN
        CREATE POLICY "Allow service role to manage face details"
            ON public.face_details
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS set_updated_at ON public.face_details;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.face_details
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create metrics table for monitoring
CREATE TABLE IF NOT EXISTS public.face_detection_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    operation TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    duration_ms INTEGER NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.face_detection_metrics ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ BEGIN
    IF NOT policy_exists('face_detection_metrics', 'Allow service role to manage metrics') THEN
        CREATE POLICY "Allow service role to manage metrics"
            ON public.face_detection_metrics
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create cleanup function for old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_face_detection_results()
RETURNS void AS $$
BEGIN
    DELETE FROM public.face_detection_results
    WHERE last_accessed < NOW() - INTERVAL '30 days';
    
    DELETE FROM public.face_details
    WHERE last_accessed < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql; 