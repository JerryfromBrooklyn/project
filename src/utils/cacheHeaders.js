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

export default {
  STATIC_ASSET_HEADERS,
  HTML_HEADERS,
  NO_CACHE_HEADERS,
  SHORT_CACHE_HEADERS,
  getCacheControlHeaders,
  setVaryHeader
}; 