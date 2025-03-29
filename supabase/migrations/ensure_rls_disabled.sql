-- =========================================================
-- CRITICAL SECURITY NOTICE - DO NOT MODIFY UNLESS AUTHORIZED
-- =========================================================
-- 
-- This script ensures Row Level Security (RLS) remains disabled
-- on all tables during development. Run this after any schema changes
-- or when creating new tables to ensure consistent behavior.
--
-- TO BE USED ONLY DURING PRE-BETA DEVELOPMENT
-- 
-- =========================================================

-- Disable RLS on all existing tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  RAISE NOTICE 'Disabling RLS on all public tables...';
  
  FOR table_record IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_record.tablename);
    RAISE NOTICE 'Disabled RLS on table %', table_record.tablename;
  END LOOP;
  
  RAISE NOTICE 'RLS disabled on all tables. DO NOT ENABLE until project completion.';
END;
$$;

-- Create a helper function to automatically disable RLS on new tables
CREATE OR REPLACE FUNCTION public.disable_rls_on_new_table()
RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
  LOOP
    -- Extract schema and table name
    DECLARE
      schema_name text := split_part(obj.object_identity, '.', 1);
      table_name text := split_part(obj.object_identity, '.', 2);
    BEGIN
      -- Only apply to public schema tables
      IF schema_name = 'public' THEN
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Automatically disabled RLS on new table: %', table_name;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger to disable RLS on newly created tables
DROP EVENT TRIGGER IF EXISTS disable_rls_on_table_creation;
CREATE EVENT TRIGGER disable_rls_on_table_creation
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE PROCEDURE public.disable_rls_on_new_table();

-- Record this action for tracking
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- Log this operation
INSERT INTO public.security_audit_log (action, details)
VALUES (
  'disable_rls', 
  jsonb_build_object(
    'message', 'RLS disabled on all public tables', 
    'executor', current_user,
    'timestamp', NOW()
  )
);

RAISE NOTICE 'Security settings updated. RLS is now disabled on all tables.';
RAISE NOTICE 'WARNING: Do not enable RLS until explicitly instructed at project completion.'; 