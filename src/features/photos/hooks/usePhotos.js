import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import photoService from '../services/photoService';
import { PhotosContext } from '../PhotosProvider';

/**
 * Hook for managing photos
 * @returns {Object} Photos state and methods
 */
export const usePhotos = () => {
  // Try to get state from context first (if available)
  const context = useContext(PhotosContext);
  if (context) {
    return context;
  }
  
  // If no context is available, create local state
  // This is used by the PhotosProvider itself
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  /**
   * Fetch photos from all sources
   */
  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching photos for user:', user.id);
      
      const fetchedPhotos = await photoService.fetchPhotos();
      setPhotos(fetchedPhotos);
      
      console.log(`Retrieved ${fetchedPhotos.length} photos`);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to fetch photos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Upload a photo
   * @param {File} file - The file to upload
   * @param {Object} metadata - Additional photo metadata
   * @param {Function} progressCallback - Callback for upload progress
   * @returns {Promise<Object>} The uploaded photo data
   */
  const uploadPhoto = async (file, metadata = {}, progressCallback = () => {}) => {
    if (!user) throw new Error('User must be authenticated to upload photos');
    
    try {
      setError(null);
      
      const uploadedPhoto = await photoService.uploadPhoto(file, metadata, progressCallback);
      
      // Refresh the photo list or add the new photo to state
      await fetchPhotos();
      
      return uploadedPhoto;
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo. Please try again.');
      throw err;
    }
  };

  /**
   * Delete a photo
   * @param {string} photoId - ID of the photo to delete
   * @returns {Promise<boolean>} Success status
   */
  const deletePhoto = async (photoId) => {
    if (!user) return false;
    
    try {
      setError(null);
      
      const success = await photoService.deletePhoto(photoId);
      
      if (success) {
        // Update local state
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        
        // If the selected photo is deleted, clear it
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(null);
        }
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
      return false;
    }
  };

  /**
   * Select a photo for detailed view
   * @param {Object|string} photo - Photo object or photo ID
   */
  const selectPhoto = async (photo) => {
    try {
      // If we received an ID string instead of a photo object
      if (typeof photo === 'string') {
        const photoData = await photoService.getPhotoById(photo);
        setSelectedPhoto(photoData);
        return;
      }
      
      // If we received a photo object
      setSelectedPhoto(photo);
    } catch (err) {
      console.error('Error selecting photo:', err);
      setError('Failed to load photo details.');
    }
  };

  /**
   * Clear the selected photo
   */
  const clearSelectedPhoto = () => {
    setSelectedPhoto(null);
  };

  // Fetch photos when the component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, fetchPhotos]);

  return {
    photos,
    loading,
    error,
    selectedPhoto,
    fetchPhotos,
    uploadPhoto,
    deletePhoto,
    selectPhoto,
    clearSelectedPhoto
  };
};

export default usePhotos; 