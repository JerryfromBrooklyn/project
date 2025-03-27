# Photo Upload Fix Instructions

## Problem Summary
The photo upload process is failing because of two main issues:

1. Missing PostgreSQL functions:
   - `update_photo_basic_details` - 404 Not Found error
   - `update_photo_face_ids` - 404 Not Found error (the function exists but has the wrong signature)

2. Permission issues:
   - Direct updates to the photos table are failing with "permission denied for table users" error

## Solution

We've created comprehensive SQL functions that address both issues:

1. The SQL script (`fix_photo_metadata_functions.sql`) contains:
   - Correctly defined functions with the exact signatures expected by the frontend
   - Proper security contexts (SECURITY DEFINER) to bypass RLS
   - Comprehensive error handling
   - RLS policies to ensure proper access control
   - Helper views to avoid direct users table access

2. The functions are designed to:
   - Validate photo existence and user permissions
   - Update photo metadata securely
   - Update face data without encountering permission issues
   - Return detailed status information for debugging

## How to Apply the Fix

### Option 1: Using Supabase Studio (Recommended)

1. Log in to your Supabase project at https://app.supabase.com
2. Go to the "SQL Editor" tab
3. Create a new query
4. Copy the entire contents from the `fix_photo_metadata_functions.sql` file
5. Execute the SQL script
6. Verify that the functions have been created by checking the "Database" > "Functions" section

### Option 2: Using Local Supabase CLI

If you have the Supabase CLI configured:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Apply the SQL file directly
supabase db execute --file fix_photo_metadata_functions.sql
```

## Verification

After applying the fix:

1. Try uploading a photo through the application
2. Check the browser console for any errors
3. Verify that the photo metadata and face data are correctly saved in the database

## What If It Doesn't Work?

If you still encounter issues:

1. Check the browser console for specific error messages
2. Verify that the functions exist in your database (through Supabase Studio)
3. Try executing the function directly in SQL Editor to test:

```sql
SELECT update_photo_basic_details(
  '00000000-0000-0000-0000-000000000000', -- replace with a real photo ID
  'Test Title',
  '2023-01-01',
  '{}',
  '{}',
  '{}',
  NULL
);
```

4. Check if any errors are returned by the function 