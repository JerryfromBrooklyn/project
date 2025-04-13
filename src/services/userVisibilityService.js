import { BatchWriteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient, docClient } from "../lib/awsClient";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

// Table name for visibility tracking
const USER_VISIBILITY_TABLE = "shmong-user-photo-visibility";

/**
 * Update visibility status for photos in a user's view
 * @param {string} userId - User ID
 * @param {string[]} photoIds - Array of photo IDs
 * @param {string} status - Visibility status ('VISIBLE', 'TRASH', 'HIDDEN')
 * @returns {Promise<object>} Result of operation
 */
export const updatePhotoVisibility = async (userId, photoIds, status) => {
  try {
    if (!userId) {
      console.error('[updatePhotoVisibility] Error: User ID is required');
      throw new Error("User ID is required");
    }
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      console.error('[updatePhotoVisibility] Error: Photo IDs array is empty or invalid', photoIds);
      throw new Error("Photo IDs array is required");
    }
    
    const validStatuses = ["VISIBLE", "TRASH", "HIDDEN"];
    if (!validStatuses.includes(status)) {
      console.error(`[updatePhotoVisibility] Error: Invalid status: ${status}`);
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    }
    
    console.log(`[updatePhotoVisibility] Updating visibility for ${photoIds.length} photos for user ${userId} to: ${status}`);
    console.log(`[updatePhotoVisibility] Photo IDs: ${JSON.stringify(photoIds)}`);
    
    // Create batch write requests (25 items max per batch)
    const now = new Date().toISOString();
    const chunks = [];
    
    // Split into chunks of 25 (DynamoDB batch limit)
    for (let i = 0; i < photoIds.length; i += 25) {
      const chunk = photoIds.slice(i, i + 25);
      
      const batchItems = chunk.map(photoId => ({
        PutRequest: {
          Item: {
            userId: { S: userId },
            photoId: { S: photoId },
            status: { S: status },
            updatedAt: { S: now }
          }
        }
      }));
      
      chunks.push(batchItems);
    }
    
    // Process all batches
    console.log(`[updatePhotoVisibility] Processing ${chunks.length} batch(es) of requests`);
    
    const results = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          console.log(`[updatePhotoVisibility] Sending batch ${index + 1}/${chunks.length} with ${chunk.length} items`);
          const result = await dynamoClient.send(
            new BatchWriteItemCommand({
              RequestItems: {
                [USER_VISIBILITY_TABLE]: chunk
              }
            })
          );
          console.log(`[updatePhotoVisibility] Batch ${index + 1} sent successfully`);
          return result;
        } catch (batchError) {
          console.error(`[updatePhotoVisibility] Error processing batch ${index + 1}:`, batchError);
          throw batchError; // Re-throw to be caught by the outer try-catch
        }
      })
    );
    
    // Check if any unprocessed items
    const unprocessedItems = results
      .filter(result => result.UnprocessedItems && 
              result.UnprocessedItems[USER_VISIBILITY_TABLE] &&
              result.UnprocessedItems[USER_VISIBILITY_TABLE].length > 0)
      .flatMap(result => result.UnprocessedItems[USER_VISIBILITY_TABLE]);
      
    if (unprocessedItems.length > 0) {
      console.warn(`[updatePhotoVisibility] Warning: ${unprocessedItems.length} items were not processed`);
    }
    
    // Verify the updates were applied successfully
    const verificationResults = await verifyPhotoVisibility(userId, photoIds, status);
    
    return {
      success: true,
      totalUpdated: photoIds.length - unprocessedItems.length,
      message: `Successfully updated visibility for ${photoIds.length - unprocessedItems.length} photos`,
      verificationResults
    };
  } catch (error) {
    console.error("[updatePhotoVisibility] Error updating photo visibility:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify that photo visibility was correctly set
 * @param {string} userId - User ID
 * @param {string[]} photoIds - Array of photo IDs
 * @param {string} expectedStatus - Expected visibility status
 * @returns {Promise<object>} Verification results
 */
export const verifyPhotoVisibility = async (userId, photoIds, expectedStatus) => {
  try {
    if (!userId || !photoIds || photoIds.length === 0) {
      return { success: false, message: "Missing parameters for verification" };
    }
    
    console.log(`[verifyPhotoVisibility] Verifying visibility status for ${photoIds.length} photos`);
    
    // Sample up to 5 photos to verify (to avoid overloading with large batches)
    const sampleSize = Math.min(photoIds.length, 5);
    const samplePhotoIds = photoIds.slice(0, sampleSize);
    
    // Get the visibility map
    const { visibilityMap, success } = await getPhotoVisibilityMap(userId);
    
    if (!success) {
      return { success: false, message: "Failed to get visibility map for verification" };
    }
    
    // Check each sampled photo
    const results = samplePhotoIds.map(photoId => {
      const actualStatus = visibilityMap[photoId] || "VISIBLE"; // Default is VISIBLE
      const isCorrect = actualStatus === expectedStatus;
      
      return {
        photoId,
        expected: expectedStatus,
        actual: actualStatus,
        isCorrect
      };
    });
    
    const allCorrect = results.every(result => result.isCorrect);
    
    console.log(`[verifyPhotoVisibility] Verification ${allCorrect ? 'successful' : 'failed'} for sample of ${sampleSize} photos`);
    
    return {
      success: allCorrect,
      results,
      message: allCorrect 
        ? "All sampled photos have correct visibility status" 
        : "Some photos have incorrect visibility status"
    };
  } catch (error) {
    console.error("[verifyPhotoVisibility] Error verifying photo visibility:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Move photos to trash bin for a user
 * @param {string} userId - User ID
 * @param {string[]} photoIds - Array of photo IDs
 * @returns {Promise<object>} Operation result
 */
export const movePhotosToTrash = async (userId, photoIds) => {
  return updatePhotoVisibility(userId, photoIds, "TRASH");
};

/**
 * Restore photos from trash to visible
 * @param {string} userId - User ID
 * @param {string[]} photoIds - Array of photo IDs
 * @returns {Promise<object>} Operation result
 */
export const restorePhotosFromTrash = async (userId, photoIds) => {
  return updatePhotoVisibility(userId, photoIds, "VISIBLE");
};

/**
 * Permanently hide photos (they won't appear in any user views)
 * @param {string} userId - User ID
 * @param {string[]} photoIds - Array of photo IDs
 * @returns {Promise<object>} Operation result
 */
export const permanentlyHidePhotos = async (userId, photoIds) => {
  return updatePhotoVisibility(userId, photoIds, "HIDDEN");
};

/**
 * Get photo visibility status for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Map of photoId -> visibility status
 */
export const getPhotoVisibilityMap = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required");
    
    const params = {
      TableName: USER_VISIBILITY_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId }
      }
    };
    
    const result = await dynamoClient.send(new QueryCommand(params));
    
    // Create a map of photoId -> status
    const visibilityMap = {};
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach(item => {
        visibilityMap[item.photoId.S] = item.status.S;
      });
    }
    
    return {
      success: true,
      visibilityMap
    };
  } catch (error) {
    console.error("Error getting photo visibility:", error);
    return {
      success: false,
      error: error.message,
      visibilityMap: {}
    };
  }
};

/**
 * Filter photos by visibility status for a user
 * @param {string} userId - User ID
 * @param {Array} photos - Array of photo objects
 * @param {string} status - Visibility status to filter by ('VISIBLE', 'TRASH', 'HIDDEN')
 * @returns {Promise<Array>} Filtered photos
 */
export const filterPhotosByVisibility = async (userId, photos, status = "VISIBLE") => {
  try {
    if (!photos || photos.length === 0) return [];
    
    console.log(`[filterPhotosByVisibility] Starting for user ${userId}, status: ${status}, with ${photos.length} photos`);
    
    // Get visibility map for this user
    const { visibilityMap, success } = await getPhotoVisibilityMap(userId);
    
    if (!success) {
      console.error("[filterPhotosByVisibility] Failed to get visibility map");
      return [];
    }
    
    // Filter photos by status (default is VISIBLE if no record exists)
    const filtered = photos.filter(photo => {
      if (!photo.id) {
        console.warn('[filterPhotosByVisibility] Photo missing ID:', photo);
        return false;
      }
      
      const photoStatus = visibilityMap[photo.id] || "VISIBLE";
      return photoStatus === status;
    });
    
    console.log(`[filterPhotosByVisibility] Filtered to ${filtered.length} photos with status '${status}'`);
    return filtered;
  } catch (error) {
    console.error("Error filtering photos by visibility:", error);
    return [];
  }
}; 