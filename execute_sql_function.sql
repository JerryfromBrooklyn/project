-- Create a function to execute raw SQL with admin privileges
-- WARNING: This can be a security risk if not used carefully!
-- Only use for specific, controlled scenarios

CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the query for auditing purposes
  RAISE NOTICE 'Executing SQL: %', sql_query;
  
  -- Execute the SQL statement
  EXECUTE sql_query;
END;
$$;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;

-- IMPORTANT: A safer alternative would be to create specific functions
-- for each operation you need, rather than this general-purpose one. 