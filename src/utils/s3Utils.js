/**
 * Utility functions for S3 operations
 */

// Constants
const S3_BUCKET_NAME = 'shmong';
const S3_REGION = 'us-east-1';
const CLOUDFRONT_DOMAIN = 'd3hl8q20rgtlyy.cloudfront.net';

/**
 * Generates a proper S3 URL for an object
 * @param {string} key - The S3 object key
 * @returns {string} The full S3 URL
 */
export const generateS3Url = (key) => {
  if (!key) return null;
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;
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
  
  // If it's already an S3 URL, return it as is
  if (url.includes(`${S3_BUCKET_NAME}.s3.`)) {
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
  
  const basePath = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/`;
  if (s3Url.startsWith(basePath)) {
    return s3Url.substring(basePath.length);
  }
  
  return null;
};

export default {
  generateS3Url,
  convertCloudFrontToS3Url,
  normalizeToS3Url,
  extractKeyFromS3Url
}; 