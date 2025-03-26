# Database Migration Instructions

This document provides instructions for migrating to the new simplified database schema that removes RLS policies and ownership permission requirements.

## Overview

The new schema maintains all the functionality of the previous schema but eliminates issues related to:
- Row Level Security (RLS) policies
- Ownership permissions
- Materialized views refreshing

The main changes are:
- Replaced materialized views with regular views
- Removed all RLS policies
- Removed `SECURITY DEFINER` from functions
- Consolidated schema into a single migration file

## Migration Steps

### 1. Backup Your Data

Before proceeding, make sure to backup your Supabase database:

```bash
# Using the Supabase CLI
supabase db dump -f backup.sql
```

Or use the Supabase dashboard to create a database backup.

### 2. Apply the New Schema

There are two approaches to apply the new schema:

#### Option A: Clean Install (Recommended for Development/Testing)

This will drop all existing tables and recreate them with the new schema:

1. Copy the `supabase/migrations/simplified_schema.sql` file to your Supabase project
2. Run the migration:

```bash
# Using the Supabase CLI
supabase migration up
```

#### Option B: In-Place Migration (For Production)

This approach keeps your existing data:

1. First, disable all RLS policies:

```sql
-- Run this in the SQL editor
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unassociated_faces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
```

2. Drop the problematic materialized view:

```sql
DROP MATERIALIZED VIEW IF EXISTS public.mv_user_matched_photos;
```

3. Create the new regular view:

```sql
CREATE OR REPLACE VIEW public.user_matched_photos AS
SELECT 
  p.*,
  jsonb_array_elements(p.matched_users)->>'userId' as matched_user_id
FROM 
  public.photos p
WHERE 
  jsonb_array_length(p.matched_users) > 0;
```

4. Modify the functions to remove SECURITY DEFINER:

```sql
-- For each function with SECURITY DEFINER, recreate without it
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

-- Repeat for other functions
```

### 3. Update Your Code (If Needed)

Replace any references to the materialized view `mv_user_matched_photos` with the new view `user_matched_photos`.

If your code previously relied on RLS policies for security, you should implement application-level security checks since the database no longer enforces these policies.

### 4. Verify the Migration

After migration, verify that:

1. All data is accessible
2. Face detection and matching still works
3. Photo uploads and storage calculations function correctly
4. User profiles and permissions are maintained

## Troubleshooting

If you encounter issues after migration:

1. Check the Supabase logs for database errors
2. Verify column names and types match your application's expectations
3. Ensure all functions are accessible to your application user
4. If using Option B (in-place migration), ensure all old triggers and constraints are properly updated

## Rollback Plan

If you need to rollback:

1. Restore from the backup created in step 1
2. If using Supabase migrations, rollback to previous migration version:

```bash
# Using the Supabase CLI
supabase migration down
``` 