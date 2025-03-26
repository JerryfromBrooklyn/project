-- Simplified database schema without RLS policies or ownership permissions
-- This migration drops all existing tables and recreates them with simplified permissions

-- Drop existing tables if they exist to start with a clean slate
DROP TABLE IF EXISTS public.photo_faces CASCADE;
DROP TABLE IF EXISTS public.face_data CASCADE;
DROP TABLE IF EXISTS public.unassociated_faces CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_storage CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP VIEW IF EXISTS public.face_migration_progress;
DROP MATERIALIZED VIEW IF EXISTS public.mv_user_matched_photos;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::JSONB,
    settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user storage table
CREATE TABLE IF NOT EXISTS public.user_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_size BIGINT DEFAULT 0,
    quota_limit BIGINT DEFAULT 10737418240, -- 10GB default
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create face_data table
CREATE TABLE IF NOT EXISTS public.face_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT NOT NULL,
    face_data JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, face_id)
);

-- Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NULL,
    storage_path TEXT,
    public_url TEXT NOT NULL,
    folder_path TEXT,
    folder_name TEXT,
    file_size BIGINT DEFAULT 0,
    file_type TEXT DEFAULT 'image/jpeg',
    faces JSONB DEFAULT '[]'::JSONB,
    matched_users JSONB DEFAULT '[]'::JSONB,
    face_ids TEXT[] DEFAULT '{}',
    title TEXT,
    description TEXT,
    location JSONB DEFAULT '{"lat": null, "lng": null, "name": null}'::JSONB,
    venue JSONB DEFAULT '{"id": null, "name": null}'::JSONB,
    tags TEXT[] DEFAULT '{}',
    date_taken TIMESTAMPTZ,
    event_details JSONB DEFAULT '{"name": null, "date": null, "type": null}'::JSONB,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unassociated_faces table
CREATE TABLE IF NOT EXISTS public.unassociated_faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    face_id TEXT NOT NULL,
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    external_image_id TEXT NOT NULL,
    attributes JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (face_id)
);

-- Create photo_faces junction table
CREATE TABLE IF NOT EXISTS public.photo_faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confidence FLOAT NOT NULL,
    face_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_face_data_user_id ON public.face_data(user_id);
CREATE INDEX IF NOT EXISTS idx_face_data_face_id ON public.face_data(face_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON public.photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_faces ON public.photos USING GIN (faces);
CREATE INDEX IF NOT EXISTS idx_photos_matched_users ON public.photos USING GIN (matched_users);
CREATE INDEX IF NOT EXISTS idx_photos_storage_path ON public.photos(storage_path);
CREATE INDEX IF NOT EXISTS idx_photos_folder_path ON public.photos(folder_path);
CREATE INDEX IF NOT EXISTS idx_photos_date_taken ON public.photos(date_taken);
CREATE INDEX IF NOT EXISTS idx_unassociated_faces_photo_id ON public.unassociated_faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_unassociated_faces_face_id ON public.unassociated_faces(face_id);
CREATE INDEX IF NOT EXISTS idx_photo_faces_photo_id ON public.photo_faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_faces_user_id ON public.photo_faces(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_storage_updated_at
    BEFORE UPDATE ON public.user_storage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_face_data_updated_at
    BEFORE UPDATE ON public.face_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unassociated_faces_updated_at
    BEFORE UPDATE ON public.unassociated_faces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle face registration (simplified)
CREATE OR REPLACE FUNCTION handle_face_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if this is a new record or if the face_id has changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.face_id != NEW.face_id) THEN
        -- Delete old face data if exists
        DELETE FROM face_data WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for face registration
CREATE TRIGGER on_face_registration
    BEFORE INSERT OR UPDATE ON face_data
    FOR EACH ROW
    EXECUTE FUNCTION handle_face_registration();

-- Create function to handle face matching (simplified)
CREATE OR REPLACE FUNCTION handle_face_matching()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if this is a new record or if the confidence has changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.confidence != NEW.confidence) THEN
        -- Delete old matches for this user in this photo
        DELETE FROM photo_faces 
        WHERE photo_id = NEW.photo_id AND user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for face matching
CREATE TRIGGER on_face_matching
    BEFORE INSERT OR UPDATE ON photo_faces
    FOR EACH ROW
    EXECUTE FUNCTION handle_face_matching();

-- Create function to update matched users (simplified)
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      u.full_name,
      u.avatar_url,
      f.confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f(face),
      auth.users u
    WHERE 
      u.id = (f->>'userId')::uuid
  )
  -- Update matched_users with user details
  UPDATE public.photos 
  SET matched_users = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'userId', id,
        'fullName', full_name,
        'avatarUrl', avatar_url,
        'confidence', confidence
      )
    )
    FROM matched_details
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for matched users updates
CREATE TRIGGER update_matched_users_trigger
  AFTER INSERT OR UPDATE OF faces ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_matched_users();

-- Create function to update search vector
CREATE OR REPLACE FUNCTION photos_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce((NEW.location->>'name')::text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce((NEW.venue->>'name')::text, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
CREATE TRIGGER photos_search_update
  BEFORE INSERT OR UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION photos_search_update();

-- Create function to update storage usage (simplified)
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_storage (user_id, total_size)
    VALUES (NEW.uploaded_by, NEW.file_size)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_size = user_storage.total_size + NEW.file_size,
      updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_storage
    SET total_size = total_size - OLD.file_size,
        updated_at = now()
    WHERE user_id = OLD.uploaded_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create storage trigger
CREATE TRIGGER update_storage_quota
  AFTER INSERT OR DELETE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_storage();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create users entry
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'attendee')
  );

  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    user_id,
    metadata,
    settings
  ) VALUES (
    NEW.id,
    NEW.id,
    jsonb_build_object(
      'full_name', NEW.raw_user_meta_data->>'full_name',
      'avatar_url', NEW.raw_user_meta_data->>'avatar_url',
      'user_type', COALESCE(NEW.raw_user_meta_data->>'user_type', 'attendee')
    ),
    '{}'::jsonb
  );

  -- Create storage quota entry
  INSERT INTO public.user_storage (
    user_id,
    total_size,
    quota_limit
  ) VALUES (
    NEW.id,
    0,
    10737418240
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to get photos needing face indexing (public version without security definer)
CREATE OR REPLACE FUNCTION public.get_photos_needing_face_indexing()
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  has_faces BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.storage_path, 
    (CASE WHEN jsonb_array_length(COALESCE(p.faces, '[]'::jsonb)) > 0 THEN true ELSE false END) as has_faces
  FROM 
    public.photos p
  WHERE 
    p.face_ids IS NULL OR p.face_ids = '{}' OR array_length(p.face_ids, 1) IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update face_ids for a photo (public version without security definer)
CREATE OR REPLACE FUNCTION public.update_photo_face_ids(
  photo_id UUID,
  new_face_ids TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.photos
  SET face_ids = new_face_ids
  WHERE id = photo_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view to show all photos with their matched users
-- This replaces the materialized view that was causing issues
CREATE OR REPLACE VIEW public.user_matched_photos AS
SELECT 
  p.*,
  jsonb_array_elements(p.matched_users)->>'userId' as matched_user_id
FROM 
  public.photos p
WHERE 
  jsonb_array_length(p.matched_users) > 0;

-- Function for executing SQL (simplified without security concerns)
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;

-- Create function for real-time updates when a new face match is found
CREATE OR REPLACE FUNCTION public.handle_new_face_match()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new face match is found, notify clients
  PERFORM pg_notify(
    'face_match',
    json_build_object(
      'user_id', NEW.user_id,
      'face_id', NEW.face_id,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time updates when new face data is created
CREATE TRIGGER on_face_data_created
  AFTER INSERT ON public.face_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_face_match();

-- Create function to log face registration attempt
CREATE OR REPLACE FUNCTION log_face_registration_attempt(
  p_user_id UUID,
  p_face_id TEXT,
  p_face_data JSONB DEFAULT '{}'::JSONB
) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN 'Error: User ID does not exist';
  END IF;
  
  -- Check if face_id is provided
  IF p_face_id IS NULL OR p_face_id = '' THEN
    RETURN 'Error: face_id cannot be empty';
  END IF;
  
  -- Check if a record with this user_id and face_id already exists
  IF EXISTS (SELECT 1 FROM face_data WHERE user_id = p_user_id AND face_id = p_face_id) THEN
    RETURN 'Error: Entry with this user_id and face_id already exists';
  END IF;
  
  -- Try to insert
  BEGIN
    INSERT INTO face_data (user_id, face_id, face_data)
    VALUES (p_user_id, p_face_id, p_face_data);
    RETURN 'Success: Face data registered';
  EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Migration to fix face registration issues

-- First, ensure the face_data table structure is correct
ALTER TABLE IF EXISTS public.face_data ALTER COLUMN face_id SET NOT NULL;
ALTER TABLE IF EXISTS public.face_data ALTER COLUMN face_data SET DEFAULT '{}'::JSONB;

-- Complete the log_face_registration_attempt function if it was incomplete
DROP FUNCTION IF EXISTS log_face_registration_attempt;
CREATE OR REPLACE FUNCTION log_face_registration_attempt(
  p_user_id UUID,
  p_face_id TEXT,
  p_face_data JSONB DEFAULT '{}'::JSONB
) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN 'Error: User ID does not exist';
  END IF;
  
  -- Check if face_id is provided
  IF p_face_id IS NULL OR p_face_id = '' THEN
    RETURN 'Error: face_id cannot be empty';
  END IF;
  
  -- Check if a record with this user_id and face_id already exists
  IF EXISTS (SELECT 1 FROM face_data WHERE user_id = p_user_id AND face_id = p_face_id) THEN
    RETURN 'Error: Entry with this user_id and face_id already exists';
  END IF;
  
  -- Try to insert
  BEGIN
    INSERT INTO face_data (user_id, face_id, face_data)
    VALUES (p_user_id, p_face_id, p_face_data);
    RETURN 'Success: Face data registered';
  EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Add a helper function to auto-generate face_id if needed
CREATE OR REPLACE FUNCTION auto_generate_face_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'face_' || gen_random_uuid()::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create a safer face registration function 
CREATE OR REPLACE FUNCTION register_face(
  p_user_id UUID,
  p_face_id TEXT DEFAULT NULL,
  p_face_data JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_face_id TEXT;
  v_result JSONB;
BEGIN
  -- Generate face_id if not provided
  IF p_face_id IS NULL OR p_face_id = '' THEN
    v_face_id := auto_generate_face_id();
  ELSE
    v_face_id := p_face_id;
  END IF;
  
  -- Delete existing face data for this user
  DELETE FROM face_data WHERE user_id = p_user_id;
  
  -- Insert new face data
  BEGIN
    INSERT INTO face_data (user_id, face_id, face_data, metadata)
    VALUES (p_user_id, v_face_id, p_face_data, p_metadata)
    RETURNING jsonb_build_object(
      'id', id,
      'user_id', user_id,
      'face_id', face_id,
      'created_at', created_at
    ) INTO v_result;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Face registered successfully',
      'data', v_result
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error registering face: ' || SQLERRM,
      'error_code', SQLSTATE
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Create an RPC endpoint for safe face registration
DROP FUNCTION IF EXISTS public.rpc_register_face;
CREATE OR REPLACE FUNCTION public.rpc_register_face(
  face_id TEXT DEFAULT NULL,
  face_data JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user's ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated',
      'error_code', 'AUTH001'
    );
  END IF;
  
  -- Use the register_face function
  RETURN register_face(v_user_id, face_id, face_data, metadata);
END;
$$ LANGUAGE plpgsql;

-- Create view to show users with registered faces
CREATE OR REPLACE VIEW public.users_with_faces AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.avatar_url,
  fd.face_id,
  fd.created_at as face_registered_at
FROM
  public.users u
  LEFT JOIN public.face_data fd ON u.id = fd.user_id;

-- Update debugging function to help with troubleshooting
CREATE OR REPLACE FUNCTION debug_face_registration(
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user's ID if not provided
  IF p_user_id IS NULL THEN
    v_user_id := auth.uid();
  ELSE
    v_user_id := p_user_id;
  END IF;
  
  -- Gather diagnostic information
  SELECT jsonb_build_object(
    'user_exists', EXISTS(SELECT 1 FROM auth.users WHERE id = v_user_id),
    'face_data_exists', EXISTS(SELECT 1 FROM public.face_data WHERE user_id = v_user_id),
    'face_count', (SELECT COUNT(*) FROM public.face_data WHERE user_id = v_user_id),
    'latest_face', (
      SELECT jsonb_build_object(
        'id', id,
        'face_id', face_id,
        'created_at', created_at
      )
      FROM public.face_data
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql; 