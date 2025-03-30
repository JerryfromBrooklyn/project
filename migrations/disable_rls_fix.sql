-- EMERGENCY FIX: Disable RLS that was accidentally enabled
-- As per the warning in FaceIndexingService.js, RLS must remain disabled

-- First make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-data', 'user-data', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Create a temporary unrestricted policy that allows all operations
DROP POLICY IF EXISTS "Users can only access their own files" ON storage.objects;
CREATE POLICY "Allow all operations" 
ON storage.objects
FOR ALL
USING (true)
WITH CHECK (true);

-- Then disable RLS completely as per project requirements
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 