# Face Detection Edge Function Deployment Guide

This guide will help you deploy the face detection edge function to your Supabase project to fix the face detection issues.

## Step 1: Login to Supabase CLI

First, you need to log in to the Supabase CLI:

```bash
npx supabase login
```

This will prompt you for your access token. You can find this in the Supabase dashboard:

1. Go to https://app.supabase.io/
2. Click on your avatar in the top right
3. Select "Access Token"
4. Copy the token
5. Paste it when prompted by the CLI

## Step 2: Deploy the Function

Deploy the face detection function:

```bash
npx supabase functions deploy detect-faces
```

## Step 3: Set Environment Variables

You need to set the following environment variables for the function:

1. Go to your Supabase dashboard: https://app.supabase.io/
2. Select your project
3. Go to Settings > API
4. Find your API URL and Service Role Key
5. Then go to Functions > detect-faces
6. Add the following environment variables:

```
SUPABASE_URL=https://gmupwzjxirpkskolsuix.supabase.co (replace with your URL)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

## Step 4: Test the Function

You can test the function using the Supabase dashboard:

1. Go to Functions > detect-faces
2. Click on "Test function"
3. Enter a test payload like:
   ```json
   {
     "storagePath": "photos/your-user-id/your-photo.jpg"
   }
   ```
4. Click "Run"

## Manual Deployment Alternative

If the CLI deployment doesn't work, you can manually create and deploy the function:

1. Go to your Supabase dashboard
2. Go to Functions
3. Click "Create a new function"
4. Name it "detect-faces"
5. Copy the code from `supabase/functions/detect-faces/index.ts` into the editor
6. Set the environment variables as described in Step 3
7. Click "Deploy"

## Updating the Frontend

Now that you've deployed the function, the frontend will automatically use it through the `FaceDetectionService.js` file that was added to your project.

## Database Schema Updates

Besides the edge function, you also need to apply these database changes:

### Information Schema View

Run the following SQL in your Supabase SQL Editor:

```sql
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
```

This creates a safe view that allows your application to check if tables exist without needing direct access to the information_schema.

## Checking Your App

Once you've applied all the fixes:

1. Make sure the `detect-faces` edge function is deployed
2. Make sure the information schema view is created
3. Deploy your updated frontend code
4. Test the app by:
   - Navigating to the "My Photos" tab
   - Uploading a new photo
   - Checking the "Photos with Me" tab

If you still encounter issues, check the browser console (F12) for errors and look for specific error messages. 