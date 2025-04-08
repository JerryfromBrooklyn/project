/**
 * Utility to fix S3 URLs in the database on application startup
 */
import { getCredentials } from '../lib/awsClient';
import { normalizeToS3Url } from './s3Utils';
import { verifyS3ImageAccess } from './fixFaceImages';

/**
 * Verifies and fixes face image URLs in the database
 * @param {string} userId - The user ID to fix URLs for (optional)
 * @returns {Promise<Object>} - Results of the fix operation
 */
export const verifyAndFixUrls = async (userId = null) => {
  // Import dynamically to avoid circular dependencies
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { ScanCommand, UpdateItemCommand, QueryCommand } = await import('@aws-sdk/client-dynamodb');
  
  try {
    console.log('🔧 [S3UrlFixer] Starting URL verification and fix process');
    
    // Create a DynamoDB client
    const credentials = getCredentials();
    // Using docClient from awsClient import instead({
      region: 'us-east-1',
      credentials
    });
    
    // Get face data records to check
    let records = [];
    
    if (userId) {
      // Query for a specific user if provided
      console.log(`🔍 [S3UrlFixer] Fetching face data for user: ${userId}`);
      const queryParams = {
        TableName: 'shmong-face-data',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        }
      };
      
      const queryResult = await dynamoClient.send(new QueryCommand(queryParams));
      records = queryResult.Items || [];
    } else {
      // Scan for all records if no user ID provided
      console.log(`🔍 [S3UrlFixer] Scanning all face data records`);
      const scanParams = {
        TableName: 'shmong-face-data',
        FilterExpression: 'attribute_exists(public_url)',
        Limit: 100 // Keep this reasonably limited to avoid overloading the database
      };
      
      const scanResult = await dynamoClient.send(new ScanCommand(scanParams));
      records = scanResult.Items || [];
    }
    
    console.log(`📊 [S3UrlFixer] Found ${records.length} records to check`);
    
    // Stats counters
    const results = {
      total: records.length,
      checked: 0,
      fixed: 0,
      alreadyCorrect: 0,
      errors: 0,
      fixedUrls: []
    };
    
    // Process each record
    for (const record of records) {
      if (!record.public_url || !record.public_url.S) {
        continue;
      }
      
      results.checked++;
      const originalUrl = record.public_url.S;
      const userId = record.userId.S;
      const faceId = record.faceId?.S;
      
      try {
        // Normalize the URL
        const normalizedUrl = normalizeToS3Url(originalUrl);
        
        // Check if URL needs fixing
        if (normalizedUrl !== originalUrl) {
          console.log(`🔄 [S3UrlFixer] URL format changed for user ${userId}`);
          console.log(`   Original: ${originalUrl}`);
          console.log(`   Normalized: ${normalizedUrl}`);
          
          // Verify if the normalized URL is accessible
          const isAccessible = await verifyS3ImageAccess(normalizedUrl);
          
          if (isAccessible) {
            // Update the URL in the database
            const updateParams = {
              TableName: 'shmong-face-data',
              Key: {
                userId: { S: userId },
                faceId: { S: faceId }
              },
              UpdateExpression: 'SET public_url = :url',
              ExpressionAttributeValues: {
                ':url': { S: normalizedUrl }
              }
            };
            
            await dynamoClient.send(new UpdateItemCommand(updateParams));
            console.log(`✅ [S3UrlFixer] Successfully updated URL for user ${userId}`);
            
            results.fixed++;
            results.fixedUrls.push({
              userId,
              faceId,
              oldUrl: originalUrl,
              newUrl: normalizedUrl
            });
          } else {
            console.warn(`⚠️ [S3UrlFixer] Normalized URL is not accessible for user ${userId}`);
            results.errors++;
          }
        } else {
          // URL is already in the correct format
          console.log(`✅ [S3UrlFixer] URL already in correct format for user ${userId}`);
          results.alreadyCorrect++;
        }
      } catch (error) {
        console.error(`❌ [S3UrlFixer] Error processing URL for user ${userId}:`, error);
        results.errors++;
      }
    }
    
    console.log(`📊 [S3UrlFixer] Results:`, results);
    return results;
  } catch (error) {
    console.error(`❌ [S3UrlFixer] Error verifying and fixing URLs:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Attach the URL fixer to the window object for debugging
 */
export const attachFixerToWindow = () => {
  if (typeof window !== 'undefined') {
    window.s3UrlFixer = {
      verifyAndFixUrls
    };
    console.log('🔧 [S3UrlFixer] URL fixer attached to window.s3UrlFixer');
    console.log('🔧 Use window.s3UrlFixer.verifyAndFixUrls() to fix all URLs');
    console.log('🔧 Or window.s3UrlFixer.verifyAndFixUrls("userId") to fix URLs for a specific user');
  }
};

// Auto-attach to window in browser environment
if (typeof window !== 'undefined') {
  attachFixerToWindow();
}

export default {
  verifyAndFixUrls,
  attachFixerToWindow
}; 
