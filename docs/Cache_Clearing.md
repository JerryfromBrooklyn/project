# Cache Clearing and Cache Busting

This document contains all information related to cache clearing and cache busting mechanisms used in the project.

## Overview

The application implements several layers of cache busting to ensure users always receive the latest content:

1. **Build-time cache busting** - Timestamp generated during build process
2. **Asset cache busting** - Automatic query parameters for static assets
3. **Image cache busting** - Special handling for dynamically loaded images
4. **Deployment cache invalidation** - CloudFront cache clearing during deployment
5. **Version checking** - Client-side version comparison with server

## Cache Busting Implementation

### 1. Build Timestamp Generation

During the build process, a timestamp is automatically generated and embedded in the application:

```javascript
// From scripts/generate-timestamp.js
const now = new Date();
const timestamp = 
  now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, '0') +
  now.getDate().toString().padStart(2, '0') +
  now.getHours().toString().padStart(2, '0') +
  now.getMinutes().toString().padStart(2, '0') +
  now.getSeconds().toString().padStart(2, '0');

// Create build-info.js file with the generated timestamp
const buildInfoPath = path.join(__dirname, '..', 'src', 'utils', 'build-info.js');
const buildInfoContent = `// Auto-generated timestamp
export const BUILD_TIMESTAMP = "${timestamp}";
export const APP_VERSION = "1.0.0";
`;
```

This timestamp is then used throughout the application for cache busting.

### 2. Cache Busting Utilities

The application includes dedicated utilities for cache busting in `src/utils/cacheBuster.js`:

```javascript
import { APP_VERSION, BUILD_TIMESTAMP } from './build-info';

// Add cache-busting query parameter to URLs
export function addCacheBuster(url, useTimestamp = false) {
  if (!url) return url;
  
  // Skip for external URLs 
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  const bustValue = useTimestamp ? Date.now() : BUILD_TIMESTAMP;
  
  return `${url}${separator}v=${bustValue}`;
}

// Specific function for image sources
export function cacheBustedImage(src) {
  return addCacheBuster(src);
}

// Specific function for other assets
export function cacheBustedAsset(src) {
  return addCacheBuster(src);
}
```

### 3. Force Reload Mechanism

The application can force a complete reload to clear the browser cache:

```javascript
export const forceReload = () => {
  window.location.reload(true);
};
```

### 4. Version Checking

The application includes version checking to detect updates:

```javascript
// From src/utils/version.js
export const checkForNewVersion = (currentVersion, newVersion) => {
  if (currentVersion && newVersion && currentVersion !== newVersion) {
    if (confirm('A new version is available. Reload to update?')) {
      forceReload();
    }
    return true;
  }
  return false;
};

export const checkForUpdates = async () => {
  if (!shouldCheckVersion()) return;
  
  const latestVersion = await fetchLatestVersion();
  if (latestVersion) {
    checkForNewVersion(APP_VERSION, latestVersion);
    saveCurrentVersion();
  }
};
```

## Development Environment Cache Busting

### For Windows PowerShell

Windows PowerShell doesn't support the `&&` operator for command chaining like Unix-based systems. Use the following sequence of commands for complete cache busting:

```powershell
# Step 1: Kill any running Node processes
taskkill /F /IM node.exe

# Step 2: Clean the npm cache
npm cache clean --force

# Step 3: Remove Vite cache directories
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .vite*
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue node_modules\.vite

# Step 4: Start the development server with fresh timestamp
npm run dev
```

For convenience, you can create a script in package.json:

```json
"scripts": {
  "dev:clean-win": "powershell -Command \"taskkill /F /IM node.exe; npm cache clean --force; Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .vite*; Remove-Item -Force -Recurse -ErrorAction SilentlyContinue node_modules\\.vite; npm run dev\""
}
```

Then run:
```
npm run dev:clean-win
```

### For Unix-based Systems (macOS/Linux)

Unix-based systems can use the `&&` operator to chain commands:

```bash
# Kill any running Node processes, clean caches, and start development server
killall node && npm cache clean --force && rm -rf .vite* node_modules/.vite && npm run dev
```

Add to package.json:

```json
"scripts": {
  "dev:clean": "killall node || true && npm cache clean --force && rm -rf .vite* node_modules/.vite && npm run dev"
}
```

Then run:
```
npm run dev:clean
```

Note: The `|| true` after `killall node` ensures the script continues even if no node processes are running.

## Browser Cache Clearing

To manually clear browser cache:

1. **Chrome/Edge**:
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or open DevTools (`F12`), right-click the reload button, and select "Empty Cache and Hard Reload"

2. **Firefox**:
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or hold `Shift` while clicking the reload button

3. **Safari**:
   - Press `Option+Cmd+E` to empty the cache
   - Then press `Cmd+R` to reload

## Cache-Optimized Production Deployment

### Preparation for Deployment

Before deploying to production, ensure a fresh build:

```powershell
# Windows PowerShell
npm cache clean --force
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .vite*
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue node_modules\.vite
npm run build
```

or

```bash
# Unix-based systems
npm cache clean --force && rm -rf .vite* node_modules/.vite && npm run build
```

### HTML Files (No Cache)

HTML files are configured with cache headers that prevent caching, ensuring users always get the latest version:

```bash
aws s3 sync dist/ s3://shmong --delete --exclude "*" --include "*.html" \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html; charset=utf-8"
```

### Asset Files (Long Cache)

Static assets (JS, CSS, images) use aggressive caching for performance, with the cache busting query parameters ensuring users get updated versions when needed:

```bash
aws s3 sync dist/assets/ s3://shmong/assets --delete \
  --cache-control "public, max-age=31536000, immutable"
```

## CloudFront Cache Invalidation

After deployment, the CloudFront CDN cache is invalidated to ensure the new content is served:

```bash
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*"
```

For Windows PowerShell, create a deployment script in package.json:

```json
"scripts": {
  "deploy:win": "powershell -Command \"npm cache clean --force; Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .vite*; npm run build && npm run s3-sync:win && npm run invalidate-cf\"",
  "s3-sync:win": "powershell -Command \"aws s3 sync dist/ s3://shmong --delete --exclude '*' --include '*.html' --cache-control 'public, max-age=0, must-revalidate' --content-type 'text/html; charset=utf-8' && aws s3 sync dist/assets/ s3://shmong/assets --delete --cache-control 'public, max-age=31536000, immutable'\""
}
```

## Troubleshooting Cache Issues

If you encounter unexpected behavior related to caching:

1. **Check for Port Conflicts**: If many Vite development servers are running in the background, you might see messages like "Port 5173 is in use, trying another one...". Use `taskkill /F /IM node.exe` (Windows) or `killall node` (Unix) to close all Node processes.

2. **Vite Cache Issues**: If Vite generates warnings about dependencies or shows incorrect behavior, remove the Vite cache with:
   ```
   Remove-Item -Force -Recurse -ErrorAction SilentlyContinue .vite*
   Remove-Item -Force -Recurse -ErrorAction SilentlyContinue node_modules\.vite
   ```

3. **Browser Hard Refresh**: Use a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to bypass browser cache.

4. **Service Worker Issues**: If using service workers, you might need to unregister them through browser DevTools > Application > Service Workers.

## Component Usage

The `cacheBustedImage` function is used in components like `PhotoCard` and `ImageViewer` to ensure images are not cached when they've been updated:

```jsx
import { cacheBustedImage } from '../../utils/cacheBuster';

// Usage in component
<img 
  src={cacheBustedImage(photo?.url)}
  alt={photo?.name || 'Photo'}
/>
``` 