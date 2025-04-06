/**
 * Utility to fix S3 face image URL issues
 */
import { normalizeToS3Url } from './s3Utils';

/**
 * Verifies if an S3 URL is accessible
 * @param {string} url - S3 URL to check
 * @returns {Promise<boolean>} - Whether the URL is accessible
 */
export const verifyS3ImageAccess = async (url) => {
  if (!url) return false;
  
  try {
    console.log(`🔍 [S3Utils] Verifying URL accessibility: ${url}`);
    const normalizedUrl = normalizeToS3Url(url);
    
    // Try to access the URL with a HEAD request
    const response = await fetch(normalizedUrl, { 
      method: 'HEAD',
      cache: 'no-store'
    });
    
    const isAccessible = response.ok;
    console.log(`${isAccessible ? '✅' : '❌'} [S3Utils] URL ${normalizedUrl} is ${isAccessible ? 'accessible' : 'NOT accessible'}`);
    
    return isAccessible;
  } catch (error) {
    console.error(`❌ [S3Utils] Error verifying URL accessibility:`, error);
    return false;
  }
};

/**
 * Fixes broken S3 image paths and updates in DynamoDB
 * @param {string} userId - User ID to fix images for
 * @returns {Promise<{success: boolean, fixed: number, failed: number}>}
 */
export const fixFaceImageUrls = async (userId) => {
  try {
    console.log(`🔧 [S3Utils] Starting face image URL fix for user: ${userId}`);
    
    // Import dynamically to avoid circular dependencies
    const { getFaceData, updateFaceData } = await import('../services/database-utils.js');
    
    // Get the current face data
    const faceData = await getFaceData(userId);
    
    if (!faceData.success || !faceData.data) {
      console.error(`❌ [S3Utils] Unable to fetch face data for user: ${userId}`);
      return { success: false, fixed: 0, failed: 1, error: 'Unable to fetch face data' };
    }
    
    // Check if there is an image URL
    let imageUrl = faceData.data.public_url;
    
    if (!imageUrl) {
      console.warn(`⚠️ [S3Utils] No image URL found for user: ${userId}`);
      return { success: false, fixed: 0, failed: 1, error: 'No image URL found' };
    }
    
    console.log(`🔍 [S3Utils] Found image URL: ${imageUrl}`);
    
    // Normalize the URL to ensure it's in the correct format
    const normalizedUrl = normalizeToS3Url(imageUrl);
    
    if (normalizedUrl !== imageUrl) {
      console.log(`🔄 [S3Utils] Normalized URL from ${imageUrl} to ${normalizedUrl}`);
      
      // Check if the normalized URL is accessible
      const isAccessible = await verifyS3ImageAccess(normalizedUrl);
      
      if (isAccessible) {
        // Update the URL in DynamoDB
        const updateResult = await updateFaceData(userId, { public_url: normalizedUrl });
        
        if (updateResult.success) {
          console.log(`✅ [S3Utils] Successfully updated face image URL for user: ${userId}`);
          return { success: true, fixed: 1, failed: 0, oldUrl: imageUrl, newUrl: normalizedUrl };
        } else {
          console.error(`❌ [S3Utils] Failed to update face image URL:`, updateResult.error);
          return { success: false, fixed: 0, failed: 1, error: 'Failed to update URL in database' };
        }
      } else {
        console.error(`❌ [S3Utils] Normalized URL is not accessible: ${normalizedUrl}`);
        
        // Check if current URL is accessible
        const currentUrlAccessible = await verifyS3ImageAccess(imageUrl);
        
        if (currentUrlAccessible) {
          console.log(`✅ [S3Utils] Current URL is accessible. Not updating.`);
          return { success: true, fixed: 0, failed: 0, message: 'Current URL is accessible' };
        }
        
        return { success: false, fixed: 0, failed: 1, error: 'Normalized URL is not accessible' };
      }
    } else {
      // Verify if the URL is accessible
      const isAccessible = await verifyS3ImageAccess(imageUrl);
      
      if (isAccessible) {
        console.log(`✅ [S3Utils] URL is already in correct format and accessible: ${imageUrl}`);
        return { success: true, fixed: 0, failed: 0, message: 'URL already correct' };
      } else {
        console.error(`❌ [S3Utils] URL is in correct format but not accessible: ${imageUrl}`);
        return { 
          success: false, 
          fixed: 0, 
          failed: 1, 
          error: 'URL is in correct format but not accessible',
          bucketSettings: `
Please check your S3 bucket settings:
1. Disable "Block public access" settings for the bucket
2. Add a bucket policy allowing public read access:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::shmong/*"
    }
  ]
}
3. Configure CORS settings for the bucket:
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]`
        };
      }
    }
    
  } catch (error) {
    console.error(`❌ [S3Utils] Error fixing face image URLs:`, error);
    return { success: false, fixed: 0, failed: 1, error: error.message };
  }
};

/**
 * Debug utility to attach to global window object
 */
export const attachFixerToWindow = () => {
  if (typeof window !== 'undefined') {
    console.log('🔧 [S3Utils] Attaching face image fixer utilities to window.faceFixer');
    window.faceFixer = {
      fixFaceImageUrls,
      verifyS3ImageAccess,
      normalizeToS3Url
    };
    
    console.log('🔧 [S3Utils] Use window.faceFixer.fixFaceImageUrls(userId) to fix broken face images');
  }
};

// Auto-attach to window in browser environment
if (typeof window !== 'undefined') {
  attachFixerToWindow();
}

export default {
  fixFaceImageUrls,
  verifyS3ImageAccess,
  normalizeToS3Url,
  attachFixerToWindow
}; 