// src/services/PhotoService.js
import awsPhotoService from './awsPhotoService';
import { filterPhotosByVisibility } from './userVisibilityService';

/**
 * Get user photos with visibility filtering applied
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object with success flag and photos array
 */
export const getUserPhotos = async (userId) => {
  try {
    // First fetch all photos (uploaded by user or matched with user) that are VISIBLE only
    const allPhotos = await awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'VISIBLE');
    
    console.log(`[PhotoService] getUserPhotos: Fetched ${allPhotos.length} VISIBLE photos for user ${userId}`);
    
    return {
      success: true,
      photos: allPhotos
    };
  } catch (error) {
    console.error('Error in getUserPhotos:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch photos',
      photos: []
    };
  }
};

/**
 * Get photos in trash bin
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object with success flag and photos array
 */
export const getTrashedPhotos = async (userId) => {
  try {
    // Explicitly fetch only TRASH photos
    const trashedPhotos = await awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'TRASH');
    
    console.log(`[PhotoService] getTrashedPhotos: Fetched ${trashedPhotos.length} TRASHED photos for user ${userId}`);
    
    return {
      success: true,
      photos: trashedPhotos
    };
  } catch (error) {
    console.error('Error in getTrashedPhotos:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trashed photos',
      photos: []
    };
  }
};

/**
 * Get permanently hidden photos
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object with success flag and photos array
 */
export const getHiddenPhotos = async (userId) => {
  try {
    // Explicitly fetch only HIDDEN photos
    const hiddenPhotos = await awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'HIDDEN');
    
    console.log(`[PhotoService] getHiddenPhotos: Fetched ${hiddenPhotos.length} HIDDEN photos for user ${userId}`);
    
    return {
      success: true,
      photos: hiddenPhotos
    };
  } catch (error) {
    console.error('Error in getHiddenPhotos:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch hidden photos',
      photos: []
    };
  }
};

/**
 * Download a photo
 * @param {string} photoId - The ID of the photo to download
 * @returns {Promise<string>} The URL of the photo
 */
const downloadPhoto = async (photoId) => {
  try {
    // For now, just returning a placeholder implementation
    // In a real scenario, this might generate a pre-signed URL or fetch the direct URL
    console.log(`Requested download of photo ${photoId}`);
    // Get the photo details first to get the URL
    const photo = await awsPhotoService.getPhotoById(photoId);
    return photo?.url || '';
  } catch (error) {
    console.error(`Error downloading photo ${photoId}:`, error);
    throw new Error(`Could not download photo ${photoId}`);
  }
};

// Create and export the PhotoService object that PhotoGrid.js expects
export const PhotoService = {
  downloadPhoto
};

export default {
  getUserPhotos,
  getTrashedPhotos,
  getHiddenPhotos,
  PhotoService
}; 