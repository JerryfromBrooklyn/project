-- Migration for Enhanced Face Matching System
-- Creates tables and functions to support indexing all faces and historical matching

-- Create table for unassociated faces
CREATE TABLE IF NOT EXISTS unassociated_faces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  face_id TEXT NOT NULL,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  external_id TEXT,
  confidence FLOAT,
  attributes JSONB,
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  claimed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient queries in separate transactions
CREATE INDEX IF NOT EXISTS idx_unassociated_faces_face_id ON unassociated_faces(face_id);
CREATE INDEX IF NOT EXISTS idx_unassociated_faces_photo_id ON unassociated_faces(photo_id);

-- Create claimed_by index with a check to ensure the column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'unassociated_faces' AND column_name = 'claimed_by'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM pg_indexes 
      WHERE tablename = 'unassociated_faces' AND indexname = 'idx_unassociated_faces_claimed_by'
    ) THEN
      CREATE INDEX idx_unassociated_faces_claimed_by ON unassociated_faces(claimed_by);
    END IF;
  END IF;
END $$;

-- Add aws_face_ids column to photos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'aws_face_ids'
    ) THEN
        ALTER TABLE photos ADD COLUMN aws_face_ids TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create function to find photos by face ID
CREATE OR REPLACE FUNCTION find_photos_by_face_id(p_face_id TEXT)
RETURNS TABLE (
    photo_id UUID,
    face_id TEXT,
    confidence FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT uf.photo_id, uf.face_id, uf.confidence
    FROM unassociated_faces uf
    WHERE uf.face_id = p_face_id;
END;
$$;

-- Create function to claim unassociated faces
CREATE OR REPLACE FUNCTION claim_faces_for_user(p_user_id UUID, p_face_ids TEXT[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Update the unassociated_faces table to claim these faces
    UPDATE unassociated_faces
    SET claimed_by = p_user_id
    WHERE face_id = ANY(p_face_ids)
    AND claimed_by IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$;

-- Create function to find matching photos for a user
CREATE OR REPLACE FUNCTION find_matching_photos_for_user(p_user_id UUID)
RETURNS TABLE (
    photo_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT uf.photo_id
    FROM unassociated_faces uf
    WHERE uf.claimed_by = p_user_id;
END;
$$;

-- Set up appropriate permissions
DO $$ 
BEGIN
  -- Only enable RLS if it doesn't already exist
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE tablename = 'unassociated_faces'
  ) THEN
    -- Enable row level security
    ALTER TABLE unassociated_faces ENABLE ROW LEVEL SECURITY;

    -- Allow authenticated users to view all unassociated faces
    CREATE POLICY "Authenticated users can view unassociated faces" ON unassociated_faces
        FOR SELECT
        TO authenticated
        USING (true);

    -- Allow the service role to do everything
    CREATE POLICY "Service role can do everything" ON unassociated_faces
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');

    -- Allow users to update faces they have claimed
    CREATE POLICY "Users can update faces they have claimed" ON unassociated_faces
        FOR UPDATE
        TO authenticated
        USING (claimed_by = auth.uid())
        WITH CHECK (claimed_by = auth.uid());
  END IF;
END $$;

COMMENT ON TABLE unassociated_faces IS 'Stores faces detected in photos that have not yet been claimed by a user';
COMMENT ON FUNCTION find_photos_by_face_id IS 'Find photos containing a specific face ID';
COMMENT ON FUNCTION claim_faces_for_user IS 'Claim unassociated faces for a user';
COMMENT ON FUNCTION find_matching_photos_for_user IS 'Find photos matching a user based on claimed faces'; 