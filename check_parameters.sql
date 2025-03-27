-- Check the function parameters that basic_photo_insert expects
SELECT 
    p.proname as function_name,
    p.pronargs as num_args,
    string_agg(t.typname, ', ' ORDER BY paramno) as param_types
FROM 
    pg_proc p
    JOIN pg_type r ON p.prorettype = r.oid
    LEFT JOIN pg_type t ON t.oid = ANY(p.proargtypes)
WHERE 
    p.proname = 'basic_photo_insert'
GROUP BY 
    p.proname, p.pronargs;

-- Show the function definition in case we need to inspect it further
SELECT pg_get_functiondef('basic_photo_insert'::regproc); 