# Shmong App

A React application with TypeScript and TailwindCSS for face recognition and management.

## 🚨 SECURITY NOTICE 🚨

For development purposes, **Row Level Security (RLS) has been deliberately disabled** on all database tables. 
DO NOT enable RLS until explicitly instructed to do so. See [SECURITY_POLICY.md](./SECURITY_POLICY.md) for details.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AWS Account with Rekognition access
- Supabase Account

## Setup Instructions

1. Clone the repository:
```bash
git clone <your-repository-url>
cd shmong-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your actual environment variables in `.env`

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

- `/src` - Source code
- `/public` - Static assets
- `/scripts` - Utility scripts
- `/supabase` - Supabase configuration and migrations

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_AWS_REGION` - AWS region for Rekognition
- `VITE_AWS_ACCESS_KEY_ID` - AWS access key ID
- `VITE_AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `VITE_AWS_COLLECTION_ID` - AWS Rekognition collection ID
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password

## Face Matching Database Fix

If you're experiencing issues with face matching or photos not appearing properly, follow these steps to fix the database:

### Option 1: Use the Web Migration Tool (Easiest)

1. Open the file `apply_migrations.html` in your browser
2. Enter your Supabase service role key
3. Click "Test Connection" to verify the connection works
4. Click "Apply Migrations" to fix the database

The web tool will apply all the necessary SQL functions to make face matching work properly.

### Option 2: Run the Migration Script

If you prefer using the command line:

1. Set your Supabase service role key as an environment variable:
   ```
   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Run the migration script:
   ```
   node apply_migrations.js
   ```

### Option 3: Manual SQL Migration

If you prefer to run the SQL directly in the Supabase SQL editor:

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of these files:
   - `supabase/migrations/20240401000001_face_matching_functions.sql`
   - `supabase/migrations/20240401000002_face_collection_reset.sql`
4. Execute the SQL

## What this fixes:

- Fixes the "My Photos" tab to properly show uploaded photos
- Fixes the "Photos with Me" tab to show photos where your face was matched
- Adds proper database functions for face matching

After applying the migration, restart your application. 