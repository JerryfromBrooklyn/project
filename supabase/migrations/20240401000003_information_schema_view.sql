-- Create a view to expose the information_schema tables in a safer way
CREATE OR REPLACE VIEW public.information_schema_tables AS
SELECT 
    table_schema,
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public';

-- Grant permissions on the view
GRANT SELECT ON public.information_schema_tables TO authenticated;
GRANT SELECT ON public.information_schema_tables TO anon;
GRANT SELECT ON public.information_schema_tables TO service_role; 