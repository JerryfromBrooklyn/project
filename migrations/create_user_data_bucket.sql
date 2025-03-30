-- Migration to create the user-data storage bucket for face ID storage
-- The actual bucket creation happens in JavaScript code using the Supabase Storage API
-- This migration adds RLS policies to ensure proper security

-- First create storage schema if it doesn't exist (some installations don't have it)
CREATE SCHEMA IF NOT EXISTS storage;

-- Create a policy to allow users to read only their own files
BEGIN;
  -- Add bucket if it doesn't exist (this is just a placeholder, actual creation happens in JS)
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('user-data', 'user-data', FALSE)
  ON CONFLICT (id) DO NOTHING;

  -- RLS policy to allow users to only access their own files
  CREATE POLICY "Users can only access their own files"
  ON storage.objects
  FOR ALL
  USING (
    -- Extract user_id from path which is in format: user_id/file.json
    -- Note: This assumes the path format is userId/filename
    (bucket_id = 'user-data' AND auth.uid()::text = SPLIT_PART(name, '/', 1))
  );

  -- Make sure RLS is enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
END; 