-- Disable RLS and remove policies from face_matches
ALTER TABLE face_matches DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS face_matches_select_policy ON face_matches;
DROP POLICY IF EXISTS face_matches_insert_policy ON face_matches;
DROP POLICY IF EXISTS face_matches_update_policy ON face_matches;

-- Disable RLS and remove policies from face_details
ALTER TABLE face_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS face_details_insert_policy ON face_details;
DROP POLICY IF EXISTS face_details_update_policy ON face_details;
DROP POLICY IF EXISTS face_details_select_policy ON face_details; -- Assuming a select policy might exist
