# Cache Busting Setup - Windows Version

This README explains how to set up and use cache busting in this project on Windows.

## Quick Start

1. Run the setup script:
   ```
   .\setup-windows.bat
   ```

2. Build the project:
   ```
   .\build-win.bat
   ```

3. Deploy with proper cache headers:
   ```
   .\deploy-win.bat
   ```

## What This Does

The cache busting system works by:

1. Generating a unique timestamp each time you build
2. Adding content hashing to all static assets (JS, CSS, images)
3. Setting proper cache headers when deploying to S3:
   - HTML files: `max-age=0, must-revalidate` (never cached)
   - Asset files: `max-age=31536000, immutable` (cached for 1 year)

## Troubleshooting

If you experience any issues:

1. Kill all Node.js processes:
   ```
   taskkill /F /IM node.exe
   ```

2. Clear the Vite cache:
   ```
   rmdir /s /q .vite
   ```

3. Run setup again:
   ```
   .\setup-windows.bat
   ```

## Directory Structure

- `scripts/generate-timestamp.js` - Creates build-info.js with timestamp
- `src/utils/build-info.js` - Contains build timestamp and version
- `src/utils/cacheBuster.js` - Utility for adding cache busting to URLs
- `src/components/CacheBustedImage.jsx` - Component for cache-busted images

## Testing Cache Busting

To verify cache busting is working:

1. Build your project: `.\build-win.bat`
2. Check the `dist/assets` directory - files should have hashes in filenames
3. Preview locally: `npm run preview`
4. View source on the page - asset URLs should contain hashes
5. Use your browser's Network tab to verify cache headers

## Manual Cache Clearing

For development, you can force a hard refresh (Ctrl+F5) or disable cache in Chrome DevTools (Network tab -> "Disable cache" checkbox). 