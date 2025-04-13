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

## Cache-Optimized Deployment

The deployment process includes optimized cache settings for different file types:

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

## Scripts and Commands

### Cache Busting During Development

To start development with a fresh timestamp:

```bash
npm run dev
```

This runs:
```bash
node scripts/generate-timestamp.js && vite
```

### Build with Cache Busting

To build with cache busting:

```bash
npm run build
```

This runs:
```bash
node scripts/generate-timestamp.js && vite build
```

### Deploying with Cache Optimization

To deploy with optimized cache settings:

```bash
npm run deploy:cache
```

This runs:
```bash
npm run build && npm run s3-sync:cache && npm run invalidate-cf
```

Or for Windows:

```bash
npm run deploy:win
```

### Clear Browser Cache

To clear browser cache during debugging, users can:

1. Press Ctrl+F5 or Cmd+Shift+R
2. In Chrome DevTools:
   - Open DevTools (F12)
   - Right-click the reload button
   - Select "Empty Cache and Hard Reload"

## Manual Cache Invalidation

To manually invalidate the CloudFront cache:

```bash
npm run invalidate-cf
```

Or directly with AWS CLI:

```bash
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*"
```

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