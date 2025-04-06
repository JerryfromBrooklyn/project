/**
 * Utility functions for S3 operations
 */

// Constants
const S3_BUCKET_NAME = 'shmong';
const S3_REGION = 'us-east-1';
const CLOUDFRONT_DOMAIN = 'd3hl8q20rgtlyy.cloudfront.net';

/**
 * Generates a proper S3 URL for an object - tries both region-specific and 
 * region-agnostic formats to improve compatibility
 * 
 * @param {string} key - The S3 object key
 * @returns {Array<string>} An array of possible URLs in priority order
 */
export const generateS3UrlVariants = (key) => {
  if (!key) return [];
  
  return [
    // Format 1: Simple format without region (most compatible)
    `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
    
    // Format 2: Region-specific format
    `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`,
    
    // Format 3: Legacy region-in-domain format
    `https://s3.${S3_REGION}.amazonaws.com/${S3_BUCKET_NAME}/${key}`,
    
    // Format 4: Direct region endpoint
    `https://s3-${S3_REGION}.amazonaws.com/${S3_BUCKET_NAME}/${key}`
  ];
};

/**
 * Generates a proper S3 URL for an object
 * @param {string} key - The S3 object key
 * @returns {string} The full S3 URL
 */
export const generateS3Url = (key) => {
  if (!key) return null;
  
  // Use the simple format which is more reliable for public access
  return `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

/**
 * Converts a CloudFront URL to an S3 URL
 * @param {string} cloudFrontUrl - The CloudFront URL
 * @returns {string} The corresponding S3 URL
 */
export const convertCloudFrontToS3Url = (cloudFrontUrl) => {
  if (!cloudFrontUrl) return null;
  if (!cloudFrontUrl.includes(CLOUDFRONT_DOMAIN)) return cloudFrontUrl;
  
  const path = cloudFrontUrl.replace(`https://${CLOUDFRONT_DOMAIN}/`, '');
  return generateS3Url(path);
};

/**
 * Normalizes a URL to ensure it's an S3 URL
 * @param {string} url - The URL to normalize (CloudFront or S3)
 * @returns {string} The normalized S3 URL
 */
export const normalizeToS3Url = (url) => {
  if (!url) return null;
  
  // If it's already an S3 URL in any format, convert to the correct format
  if (url.includes(`.s3.`) && url.includes(S3_BUCKET_NAME)) {
    const pattern = new RegExp(`https://${S3_BUCKET_NAME}\\.s3\\..*amazonaws\\.com/(.*)`);
    const match = url.match(pattern);
    if (match && match[1]) {
      return generateS3Url(match[1]);
    }
    return url;
  }
  
  // If it's a CloudFront URL, convert it
  if (url.includes(CLOUDFRONT_DOMAIN)) {
    return convertCloudFrontToS3Url(url);
  }
  
  // Otherwise, return as is
  return url;
};

/**
 * Extracts the key from an S3 URL
 * @param {string} s3Url - The S3 URL
 * @returns {string} The extracted key
 */
export const extractKeyFromS3Url = (s3Url) => {
  if (!s3Url) return null;
  
  // Try various URL patterns to extract the key
  
  // Pattern 1: Simple format (no region)
  let basePath = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/`;
  if (s3Url.startsWith(basePath)) {
    return s3Url.substring(basePath.length);
  }
  
  // Pattern 2: Region-specific format
  basePath = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/`;
  if (s3Url.startsWith(basePath)) {
    return s3Url.substring(basePath.length);
  }
  
  // Pattern 3: Legacy region-in-domain format
  basePath = `https://s3.${S3_REGION}.amazonaws.com/${S3_BUCKET_NAME}/`;
  if (s3Url.startsWith(basePath)) {
    return s3Url.substring(basePath.length);
  }
  
  // Pattern 4: Direct region endpoint
  basePath = `https://s3-${S3_REGION}.amazonaws.com/${S3_BUCKET_NAME}/`;
  if (s3Url.startsWith(basePath)) {
    return s3Url.substring(basePath.length);
  }
  
  return null;
};

/**
 * Attempts to detect the correct working URL for an S3 object by checking multiple format variants
 * @param {string} key - The S3 object key
 * @returns {Promise<string|null>} The working URL or null if none found
 */
export const findWorkingS3Url = async (key) => {
  if (!key) return null;
  
  const variants = generateS3UrlVariants(key);
  
  for (const url of variants) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
    } catch (err) {
      console.log('[S3Utils] URL check failed:', url);
    }
  }
  
  return null; // No working URL found
};

export default {
  generateS3Url,
  generateS3UrlVariants,
  convertCloudFrontToS3Url,
  normalizeToS3Url,
  extractKeyFromS3Url,
  findWorkingS3Url
}; 