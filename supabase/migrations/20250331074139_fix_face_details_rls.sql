-- Drop existing insert/update policies if they exist
DROP POLICY IF EXISTS face_details_insert_policy ON face_details;
DROP POLICY IF EXISTS face_details_update_policy ON face_details;

-- Allow authenticated users to insert their own face details
CREATE POLICY face_details_insert_policy
    ON face_details
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Simplest policy for now, allows any authenticated insert

-- Allow authenticated users to update their own face details (if needed later)
-- CREATE POLICY face_details_update_policy
--     ON face_details
--     FOR UPDATE
--     TO authenticated
--     USING (auth.uid() = (SELECT user_id FROM face_user_associations WHERE face_id = face_details.face_id LIMIT 1));
--     WITH CHECK (auth.uid() = (SELECT user_id FROM face_user_associations WHERE face_id = face_details.face_id LIMIT 1));

-- Ensure RLS is enabled
ALTER TABLE face_details ENABLE ROW LEVEL SECURITY;
