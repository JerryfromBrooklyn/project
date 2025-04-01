-- Face Matching System Database Schema
-- This schema follows the requirements specified in RULES/TECHNICAL REQUIREMENTS.txt
-- No RLS policies are implemented as specified in the requirements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Stores user account information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Face Data Table
-- Stores user face IDs (one per user during registration)
CREATE TABLE IF NOT EXISTS public.face_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  face_id TEXT NOT NULL,
  aws_data JSONB DEFAULT '{}'::JSONB,  -- Store full AWS response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS face_data_user_id_idx ON public.face_data(user_id);
-- Create index on face_id for efficient searches
CREATE INDEX IF NOT EXISTS face_data_face_id_idx ON public.face_data(face_id);

-- 3. Photos Table
-- Stores uploaded photos with match data
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  matched_users JSONB DEFAULT '[]'::JSONB,  -- Array of users matched to faces in this photo
  face_matches JSONB DEFAULT '[]'::JSONB,   -- Raw AWS response data for analytics
  faces JSONB DEFAULT '[]'::JSONB,          -- Detected faces information
  face_ids TEXT[] DEFAULT '{}',             -- Array of face IDs detected in this photo
  metadata JSONB DEFAULT '{}'::JSONB,       -- Additional photo metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indices for photos table
CREATE INDEX IF NOT EXISTS photos_user_id_idx ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON public.photos(created_at);
CREATE INDEX IF NOT EXISTS photos_face_ids_idx ON public.photos USING GIN(face_ids);

-- 4. Face Match Analytics Table
-- Stores detailed match data for analysis
CREATE TABLE IF NOT EXISTS public.face_match_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  face_id TEXT NOT NULL,
  similarity FLOAT,
  confidence FLOAT,
  raw_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indices for face_match_analytics table
CREATE INDEX IF NOT EXISTS face_match_analytics_photo_id_idx ON public.face_match_analytics(photo_id);
CREATE INDEX IF NOT EXISTS face_match_analytics_user_id_idx ON public.face_match_analytics(user_id);
CREATE INDEX IF NOT EXISTS face_match_analytics_face_id_idx ON public.face_match_analytics(face_id);

-- 5. User Matches Table
-- Quick lookup table for user dashboard
CREATE TABLE IF NOT EXISTS public.user_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  similarity FLOAT,
  confidence FLOAT,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, photo_id)
);

-- Create indices for user_matches table
CREATE INDEX IF NOT EXISTS user_matches_user_id_idx ON public.user_matches(user_id);
CREATE INDEX IF NOT EXISTS user_matches_photo_id_idx ON public.user_matches(photo_id);
CREATE INDEX IF NOT EXISTS user_matches_matched_at_idx ON public.user_matches(matched_at);

-- 6. Face Collection Status Table
-- Tracks the status of the AWS Rekognition Face Collection
CREATE TABLE IF NOT EXISTS public.face_collection_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id TEXT NOT NULL,
  status TEXT NOT NULL,
  face_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure NO ROW LEVEL SECURITY as per requirements
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_match_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_collection_status DISABLE ROW LEVEL SECURITY;

-- Add some helpful comments
COMMENT ON TABLE public.face_data IS 'Stores face IDs for registered users. Each user should have only one face indexed.';
COMMENT ON TABLE public.photos IS 'Stores uploaded photos with face matches from registered users.';
COMMENT ON TABLE public.user_matches IS 'Quick lookup table for the user dashboard to show matched photos.';
COMMENT ON TABLE public.face_match_analytics IS 'Stores detailed analytics data about face matches for analysis.'; 