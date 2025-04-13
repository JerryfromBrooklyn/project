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
    if (!userId) throw new Error("User ID is required");
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      throw new Error("Photo IDs array is required");
    }
    
    const validStatuses = ["VISIBLE", "TRASH", "HIDDEN"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    }
    
    console.log(`Updating visibility for ${photoIds.length} photos for user ${userId} to: ${status}`);
    
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
    const results = await Promise.all(
      chunks.map(chunk => 
        dynamoClient.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [USER_VISIBILITY_TABLE]: chunk
            }
          })
        )
      )
    );
    
    // Check if any unprocessed items
    const unprocessedItems = results
      .filter(result => result.UnprocessedItems && 
              result.UnprocessedItems[USER_VISIBILITY_TABLE] &&
              result.UnprocessedItems[USER_VISIBILITY_TABLE].length > 0)
      .flatMap(result => result.UnprocessedItems[USER_VISIBILITY_TABLE]);
      
    if (unprocessedItems.length > 0) {
      console.warn(`Some items were not processed: ${unprocessedItems.length}`);
    }
    
    return {
      success: true,
      totalUpdated: photoIds.length - unprocessedItems.length,
      message: `Successfully updated visibility for ${photoIds.length - unprocessedItems.length} photos`
    };
  } catch (error) {
    console.error("Error updating photo visibility:", error);
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