import React, { createContext } from 'react';
import { usePhotos } from './hooks/usePhotos';

// Create photos context
export const PhotosContext = createContext(null);

/**
 * Provider component for photos context
 * This allows any component in the app to access photos state and methods
 */
export const PhotosProvider = ({ children }) => {
  const photosState = usePhotos();
  
  return (
    <PhotosContext.Provider value={photosState}>
      {children}
    </PhotosContext.Provider>
  );
};

export default PhotosProvider; 