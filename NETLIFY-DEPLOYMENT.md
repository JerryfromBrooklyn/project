# Netlify Deployment Guide

This guide walks you through deploying your face recognition application to Netlify.

## Prerequisites

1. Create a Netlify account at [netlify.com](https://www.netlify.com/)
2. Install the Netlify CLI (optional but recommended):
   ```
   npm install -g netlify-cli
   ```

## Step 1: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

## Step 2: Test Your Build Locally

Before deploying, test that your build works:

```bash
npm run build
npm run preview
```

Verify that everything works correctly in the preview.

## Step 3: Deploy to Netlify

### Option A: Using Netlify CLI (Recommended)

1. Login to Netlify:
   ```bash
   netlify login
   ```

2. Initialize your project (if not already done):
   ```bash
   netlify init
   ```
   - When prompted, select "Create & configure a new site"
   - Choose your team
   - Enter a site name or leave blank for a random name

3. Set up your environment variables:
   ```bash
   netlify env:set VITE_SUPABASE_URL "https://gmupwzjxirpkskolsuix.supabase.co"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
   netlify env:set VITE_SUPABASE_SERVICE_KEY "your-service-key"
   ```

4. Deploy your site:
   ```bash
   npm run netlify:deploy:prod
   ```

### Option B: Using Netlify Web Interface

1. Go to [app.netlify.com](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub/GitLab/Bitbucket account
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Advanced" and add your environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_SUPABASE_SERVICE_KEY`: Your Supabase service key
7. Click "Deploy site"

## Step 4: Configure Domain (Optional)

1. In your site dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions to set up your domain

## Step 5: Enable HTTPS

Netlify enables HTTPS by default. Verify this is working correctly in your site settings.

## Troubleshooting

### Issue: Build Fails

If your build fails, check:
1. Look at the build logs for specific errors
2. Make sure all dependencies are correctly installed
3. Verify that your environment variables are set correctly

### Issue: Application Errors After Deployment

1. Check browser console for errors
2. Verify that all environment variables are set correctly
3. Try a local build to see if the issue occurs locally

### Issue: API Calls Failing

1. Check CORS settings in your Supabase dashboard
2. Verify that you're using the correct API keys
3. Make sure your Supabase rules allow the necessary operations

## Continuous Deployment

Netlify automatically rebuilds your site when you push changes to your repository. To disable this:

1. Go to Site Settings > Build & Deploy > Continuous Deployment
2. Toggle "Stop builds" or configure build settings as needed

---

For more help, visit [Netlify Support](https://www.netlify.com/support/) or check the [Netlify Documentation](https://docs.netlify.com/). 