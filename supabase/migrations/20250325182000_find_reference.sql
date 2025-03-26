-- Check triggers, functions, and views for references to u.full_name

-- Check function definitions
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
  n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND pg_get_functiondef(p.oid) LIKE '%u.full_name%';

-- Check trigger definitions
SELECT 
  tgname as trigger_name, 
  relname as table_name,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE pg_get_triggerdef(t.oid) LIKE '%u.full_name%';

-- Check view definitions
SELECT 
  n.nspname as schema,
  c.relname as view_name,
  pg_get_viewdef(c.oid) as definition
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
  c.relkind = 'v' 
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND pg_get_viewdef(c.oid) LIKE '%u.full_name%';

-- Check for the update_matched_users function specifically
SELECT 
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
  n.nspname = 'public'
  AND p.proname = 'update_matched_users'; 