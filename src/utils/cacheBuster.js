/**
 * Simple cache busting utility
 */

// Import build information from static file
import { APP_VERSION, BUILD_TIMESTAMP } from './build-info';

/**
 * Adds a cache-busting query parameter to a URL
 * @param {string} url - The URL to add cache busting to
 * @param {boolean} [useTimestamp=false] - Whether to use timestamp instead of version
 * @returns {string} - The URL with cache busting parameter
 */
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

/**
 * Adds cache busting to image src
 */
export function cacheBustedImage(src) {
  return addCacheBuster(src);
}

/**
 * Adds cache busting to asset URL
 */
export function cacheBustedAsset(src) {
  return addCacheBuster(src);
}

/**
 * Force-reloads a page, clearing the cache
 */
export const forceReload = () => {
  window.location.reload(true);
};

/**
 * Checks if a new version is available and offers to reload
 * @param {string} currentVersion - The current app version
 * @param {string} newVersion - The new app version from server
 * @returns {boolean} - Whether a new version is available
 */
export const checkForNewVersion = (currentVersion, newVersion) => {
  if (currentVersion && newVersion && currentVersion !== newVersion) {
    if (confirm('A new version is available. Reload to update?')) {
      forceReload();
    }
    return true;
  }
  return false;
};

// Log version info
console.log(`[Cache] Using version: ${APP_VERSION}, build: ${BUILD_TIMESTAMP}`);

export default {
  addCacheBuster,
  cacheBustedImage,
  cacheBustedAsset,
  forceReload,
  checkForNewVersion,
  VERSION: APP_VERSION,
  TIMESTAMP: BUILD_TIMESTAMP
}; 