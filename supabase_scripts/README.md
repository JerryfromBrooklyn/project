# Supabase SQL Scripts for Photo Upload Fix

This directory contains SQL scripts to fix the photo upload and metadata update functionality.

## Order of Execution

Please execute these scripts in the following order:

1. `01_create_basic_photo_functions.sql` - Creates the function for updating basic photo details
2. `02_create_face_update_function.sql` - Creates the function for updating photo face IDs and data
3. `03_create_helper_views_and_tables.sql` - Creates helper views and tables
4. `04_setup_rls_policies.sql` - Sets up Row Level Security policies

## How to Apply These Scripts

### Using Supabase Studio (Recommended)

1. Log in to your Supabase project at https://app.supabase.com
2. Go to the "SQL Editor" tab
3. Create a new query
4. Copy the contents of each script in the order listed above
5. Execute each script individually
6. Check for any errors after each execution

### Verification

After applying all scripts, you can verify the installation by:

1. Checking the "Database" > "Functions" section for the new functions
2. Trying to upload a photo through the application
3. Checking that metadata and face data are correctly saved

## Troubleshooting

If you encounter any issues:

1. Check the browser console for specific error messages
2. Verify that the functions exist in your database (through Supabase Studio)
3. Test the functions directly in SQL Editor:

```sql
SELECT update_photo_basic_details(
  'some-photo-id-uuid',  -- replace with a real photo ID
  'Test Title',
  '2023-01-01',
  '{}',
  '{}',
  '{}',
  NULL
);
```

4. Make sure Row Level Security is properly configured 