-- Create a reset_face_collection function
-- This function will be called by the admin UI to initiate a face collection reset
-- The actual reset logic runs server-side in a background task

-- Create log table for tracking face collection resets
CREATE TABLE IF NOT EXISTS face_collection_resets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('requested', 'processing', 'completed', 'failed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE face_collection_resets IS 'Track reset requests for the AWS Rekognition face collection';
COMMENT ON COLUMN face_collection_resets.status IS 'Status of reset: requested, processing, completed, failed';

-- Function to initiate a reset
CREATE OR REPLACE FUNCTION reset_face_collection()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_reset_id INTEGER;
  v_user_role TEXT;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Authentication required'
    );
  END IF;
  
  -- Check if user has admin role
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  
  IF v_user_role IS NULL OR v_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Admin privileges required'
    );
  END IF;
  
  -- Create a new reset record
  INSERT INTO face_collection_resets (user_id, status, message)
  VALUES (v_user_id, 'requested', 'Reset requested. AWS Rekognition face collection reset will begin shortly.')
  RETURNING id INTO v_reset_id;
  
  -- Notify the system about the reset request
  -- This will be picked up by a serverless function that actually performs the reset
  PERFORM pg_notify(
    'face_collection_resets',
    json_build_object(
      'reset_id', v_reset_id,
      'user_id', v_user_id
    )::text
  );
  
  -- Return success
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Face collection reset initiated. This may take a few minutes to complete.',
    'reset_id', v_reset_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'message', 'Error initiating face collection reset: ' || SQLERRM
  );
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION reset_face_collection() IS 'Initiates a reset of the AWS Rekognition face collection. Requires admin role.';

-- Create a function to update the status of a reset
CREATE OR REPLACE FUNCTION update_face_collection_reset_status(
  p_reset_id INTEGER,
  p_status TEXT,
  p_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE face_collection_resets
  SET 
    status = p_status,
    message = p_message,
    updated_at = NOW()
  WHERE id = p_reset_id;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION update_face_collection_reset_status(INTEGER, TEXT, TEXT) IS 'Updates the status of a face collection reset';

-- Create a view for face collection reset status that can be queried by admins
CREATE OR REPLACE VIEW face_collection_reset_status AS
SELECT 
  r.id,
  r.status,
  r.message,
  r.created_at,
  r.updated_at,
  p.full_name as requested_by
FROM 
  face_collection_resets r
JOIN 
  profiles p ON r.user_id = p.id
ORDER BY 
  r.created_at DESC;

-- Allow admins to query the reset status
CREATE POLICY "Allow admins to view face_collection_reset_status"
  ON face_collection_reset_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS for face_collection_resets table
ALTER TABLE face_collection_resets ENABLE ROW LEVEL SECURITY;

-- Only admins can view reset records
CREATE POLICY "Allow admins to view reset records"
  ON face_collection_resets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create a function to check reset status
CREATE OR REPLACE FUNCTION get_face_collection_reset_status(p_reset_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_reset_record RECORD;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Authentication required'
    );
  END IF;
  
  -- Check if user has admin role
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  
  IF v_user_role IS NULL OR v_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Admin privileges required'
    );
  END IF;
  
  -- Get the reset record
  SELECT * INTO v_reset_record
  FROM face_collection_resets
  WHERE id = p_reset_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Reset record not found'
    );
  END IF;
  
  -- Return the status
  RETURN json_build_object(
    'success', TRUE,
    'reset_id', v_reset_record.id,
    'status', v_reset_record.status,
    'message', v_reset_record.message,
    'created_at', v_reset_record.created_at,
    'updated_at', v_reset_record.updated_at
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'message', 'Error retrieving reset status: ' || SQLERRM
  );
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION get_face_collection_reset_status(INTEGER) IS 'Get the status of a face collection reset. Requires admin role.'; 