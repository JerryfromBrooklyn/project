/**
 * Version API endpoint to provide version information
 * Used for client-side version checking and cache busting
 */

// Read package.json to get version
import packageJson from '../../package.json';

// Cache control headers to prevent caching of version info
const CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Handler for version API requests
 * @param {Request} req - The request object
 * @returns {Response} The response with version info
 */
export async function GET(req) {
  const version = packageJson.version || '1.0.0';
  const buildTimestamp = process.env.VITE_BUILD_TIMESTAMP || Date.now().toString();
  
  // Add current timestamp for ultra-fresh response
  const timestamp = Date.now();
  
  return new Response(
    JSON.stringify({
      version,
      buildTimestamp,
      timestamp,
      environment: process.env.NODE_ENV || 'development'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CACHE_HEADERS
      }
    }
  );
}

/**
 * Handler for API routes
 * @param {Request} req - The request object
 * @returns {Response} The response object
 */
export default async function handler(req) {
  if (req.method === 'GET') {
    return GET(req);
  }
  
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...CACHE_HEADERS
      }
    }
  );
} 