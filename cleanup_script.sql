-- First drop views that depend on tables we want to remove
DROP VIEW IF EXISTS all_photos CASCADE;
DROP VIEW IF EXISTS user_matched_photos CASCADE;
DROP VIEW IF EXISTS all_user_photos CASCADE;
DROP VIEW IF EXISTS face_collection_reset_status CASCADE;

-- Now drop tables with dependencies that aren't being used
DROP TABLE IF EXISTS photo_faces CASCADE;
DROP TABLE IF EXISTS unassociated_faces CASCADE;
DROP TABLE IF EXISTS face_match_analytics CASCADE;
DROP TABLE IF EXISTS user_matches CASCADE;
DROP TABLE IF EXISTS face_collection_resets CASCADE;

-- Drop the empty photos table that's causing issues
DROP TABLE IF EXISTS photos CASCADE;

-- Additional cleanup for other unused tables
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS face_collection_status CASCADE;
DROP TABLE IF EXISTS user_faces CASCADE;
DROP TABLE IF EXISTS system_repair_log CASCADE;
DROP TABLE IF EXISTS linked_accounts CASCADE; 