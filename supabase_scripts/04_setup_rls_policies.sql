-- Update RLS policies to ensure proper access control
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies to ensure clean setup
DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON public.photos;

-- Create comprehensive policies
CREATE POLICY "Users can view their own photos"
ON public.photos FOR SELECT
TO authenticated
USING (
    auth.uid() = uploaded_by OR 
    auth.uid() IN (SELECT id FROM public.admins)
);

CREATE POLICY "Users can update their own photos"
ON public.photos FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can view all photos"
ON public.photos FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.admins));

CREATE POLICY "Admins can update all photos"
ON public.photos FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.admins))
WITH CHECK (auth.uid() IN (SELECT id FROM public.admins)); 