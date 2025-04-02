-- Function to check if another function exists (useful for debugging)
CREATE OR REPLACE FUNCTION function_exists(function_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = function_name
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION function_exists(text) TO authenticated;

