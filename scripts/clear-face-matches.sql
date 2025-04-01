-- Script to clear all face matches from the database
-- Run this in the Supabase SQL Editor

-- Delete all records from the photo_faces table
DELETE FROM public.photo_faces;

-- Report completion
SELECT 'All face matches have been cleared from the database.' AS message; 