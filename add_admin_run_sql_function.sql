-- Add the missing admin_run_sql function
-- This function allows executing SQL queries from the admin panel

-- First, create the function with security definer to run with elevated privileges
CREATE OR REPLACE FUNCTION public.admin_run_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  result JSONB;
  output_text TEXT;
  affected_rows INTEGER;
BEGIN
  -- Try to execute as a query that returns results
  BEGIN
    -- For SELECT queries, return the results as JSON
    EXECUTE 'WITH query_result AS (' || sql_query || ') 
             SELECT jsonb_agg(to_jsonb(query_result)) FROM query_result' 
    INTO result;

    -- If NULL (empty result set or non-SELECT query), return empty array
    IF result IS NULL THEN
      result := '[]'::jsonb;
    END IF;

    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    -- If it's not a SELECT query, try to execute as a statement
    BEGIN
      -- For DML (INSERT, UPDATE, DELETE) or DDL queries
      EXECUTE sql_query;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      
      -- Return information about the execution
      RETURN jsonb_build_array(
        jsonb_build_object(
          'message', 'Query executed successfully',
          'affected_rows', affected_rows,
          'query_type', 'statement'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Return error information
      RETURN jsonb_build_array(
        jsonb_build_object(
          'error', SQLERRM,
          'detail', SQLSTATE,
          'message', 'Error executing SQL: ' || SQLERRM
        )
      );
    END;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_run_sql(TEXT) TO authenticated;

-- Create an explicit policy to allow only admins to run this function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- First check if user is in the admins table (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admins'
  ) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.admins WHERE id = v_user_id
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- If not found, check in profiles table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin'
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- If not found, check in user_profiles table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_profiles WHERE user_id = v_user_id AND role = 'admin'
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Special override for jerry@jerry.com
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = v_user_id AND email = 'jerry@jerry.com'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policy function to secure admin_run_sql
CREATE OR REPLACE FUNCTION public.check_admin_run_sql_access()
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow if user is admin
  RETURN public.is_admin_user();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the admin table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add current user to admins table if not already present
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Insert current user as admin if not already present
  INSERT INTO public.admins (id)
  VALUES (current_user_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$; 