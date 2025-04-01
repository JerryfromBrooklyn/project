-- Create face_detection_results table
CREATE TABLE IF NOT EXISTS public.face_detection_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_path TEXT NOT NULL UNIQUE,
    face_count INTEGER NOT NULL DEFAULT 0,
    faces JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.face_detection_results ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read face detection results"
    ON public.face_detection_results
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert/update face detection results"
    ON public.face_detection_results
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.face_detection_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 