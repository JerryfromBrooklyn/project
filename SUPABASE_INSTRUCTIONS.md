# Fix Admin "One-Click Super Fix" Functionality

Follow these steps to fix the "One-Click Super Fix" functionality in your admin panel:

## Step 1: Access Supabase SQL Editor

1. Log into your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project (`gmupwzjxirpkskolsuix`)
3. In the left sidebar, click "SQL Editor"

## Step 2: Run the SQL Script

1. Create a new SQL query
2. Copy and paste the entire content from the `add_admin_run_sql_function.sql` file
3. Click "Run" to execute the query

## Step 3: Verify the Function Was Created

Run this SQL query to verify the function exists:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'admin_run_sql' 
AND routine_schema = 'public';
```

You should see one row with the function name.

## Step 4: Test Admin Functionality

1. Return to your application
2. Go to the Admin panel
3. Try the "Make Me Admin & Fix Everything" button again

If everything was set up correctly, the "One-Click Super Fix" should now work without the 404 error.

## Troubleshooting

If you still encounter issues:

1. Check the browser console for any errors
2. Make sure you have admin privileges in the system
3. If needed, run this SQL to explicitly make your user an admin:

```sql
-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO public.admins (id)
VALUES ('YOUR_USER_ID')
ON CONFLICT (id) DO NOTHING;
```

You can find your user ID by running:

```sql
SELECT id FROM auth.users WHERE email = 'your.email@example.com';
``` 