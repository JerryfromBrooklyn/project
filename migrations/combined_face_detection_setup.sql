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

-- 1. Create user_face_data table
CREATE TABLE IF NOT EXISTS public.user_face_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_face_data ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ BEGIN
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

    IF NOT policy_exists('user_face_data', 'Users can update their own face data') THEN
        CREATE POLICY "Users can update their own face data"
            ON public.user_face_data
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS set_updated_at ON public.user_face_data;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_face_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

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