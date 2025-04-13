/**
 * Utility functions for setting cache control headers
 * These are primarily for server-side usage but can be used as a reference
 * for configuring your web server cache settings
 */

/**
 * Default cache control headers for static assets with content hashing
 * These can be long-lived because we use content hashing for cache busting
 */
export const STATIC_ASSET_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Surrogate-Control': 'public, max-age=31536000',
  'X-Content-Type-Options': 'nosniff'
};

/**
 * Cache control headers for HTML documents
 * These should be relatively short-lived to ensure users get updated content
 */
export const HTML_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Surrogate-Control': 'public, max-age=0, must-revalidate'
};

/**
 * Cache control headers for API responses that should never be cached
 */
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Cache control headers for API responses that can be cached for a short time
 */
export const SHORT_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60',
  'Surrogate-Control': 'public, max-age=60'
};

/**
 * Helper to generate cache control headers for a specific time
 * @param {number} maxAgeSeconds - The maximum age in seconds
 * @param {boolean} isPublic - Whether the resource is publicly cacheable
 * @returns {Object} - The cache control headers
 */
export const getCacheControlHeaders = (maxAgeSeconds, isPublic = true) => {
  return {
    'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${maxAgeSeconds}`,
    'Surrogate-Control': `${isPublic ? 'public' : 'private'}, max-age=${maxAgeSeconds}`
  };
};

/**
 * Helper to set the Vary header for responses
 * Vary is important for responses that vary based on request headers
 * @param {Object} headers - Existing headers object
 * @param {string[]} varyOn - Array of headers to vary on
 * @returns {Object} - The updated headers object
 */
export const setVaryHeader = (headers, varyOn = ['Accept', 'Accept-Encoding']) => {
  return {
    ...headers,
    'Vary': varyOn.join(', ')
  };
};

// Enhanced cache control utility
import { BUILD_TIMESTAMP } from './build-info';

/**
 * Sets cache control headers for API responses
 * @param {Response} response - The fetch response object
 * @returns {Response} The modified response
 */
export const setCacheControlHeaders = (response) => {
  // Force no caching for development
  if (import.meta.env.DEV) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
  } else {
    // For production, use more nuanced caching with versioning
    response.headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    response.headers.set('ETag', `"${BUILD_TIMESTAMP}"`);
  }
  return response;
};

/**
 * Adds cache busting version to URL
 * @param {string} url - The URL to add cache busting to
 * @returns {string} - The URL with cache busting parameter
 */
export const addVersionToUrl = (url) => {
  if (!url) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${BUILD_TIMESTAMP}`;
};

/**
 * Creates fetch options with cache busting headers
 * @param {Object} options - Original fetch options
 * @returns {Object} - Modified fetch options
 */
export const createNoCacheOptions = (options = {}) => {
  const newOptions = { ...options };
  newOptions.headers = {
    ...newOptions.headers,
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-App-Version': BUILD_TIMESTAMP,
  };
  return newOptions;
};

/**
 * Enhanced fetch with cache busting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const fetchWithCacheBusting = async (url, options = {}) => {
  const bustUrl = addVersionToUrl(url);
  const noCacheOptions = createNoCacheOptions(options);
  
  return fetch(bustUrl, noCacheOptions);
};

export default {
  STATIC_ASSET_HEADERS,
  HTML_HEADERS,
  NO_CACHE_HEADERS,
  SHORT_CACHE_HEADERS,
  getCacheControlHeaders,
  setVaryHeader,
  setCacheControlHeaders,
  addVersionToUrl,
  createNoCacheOptions,
  fetchWithCacheBusting
}; 