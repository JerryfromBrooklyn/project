import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info, Image as ImageIcon, Eye, Check } from 'lucide-react';
import SimplePhotoInfoModal from './SimplePhotoInfoModal.jsx';
import { cn } from '../utils/cn';

/**
 * Modern, responsive photo grid component with enhanced UX
 */
export const PhotoGrid = ({
  photos = [],
  onPhotoSelect,
  onPhotoAction,
  loading = false,
  error = null,
  columns = {
    default: 2,
    sm: 3,
    md: 4,
    lg: 5
  },
  selectable = false,
  selectedPhotos = [],
  onSelectPhoto = null
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loadingState, setLoadingState] = useState({});
  const [errorState, setErrorState] = useState(null);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Set error state if provided as prop
  useEffect(() => {
    if (error) {
      setErrorState(error);
    }
  }, [error]);
  
  // Get actual number of columns based on screen size
  const getColumnCount = () => {
    const width = window.innerWidth;
    
    if (width >= 1280 && columns.lg) return columns.lg;
    if (width >= 1024 && columns.md) return columns.md;
    if (width >= 768 && columns.sm) return columns.sm;
    return columns.default || 2;
  };
  
  // Handle photo click to view details
  const handlePhotoClick = (photo) => {
    if (selectable) {
      if (onSelectPhoto) {
        onSelectPhoto(photo.id);
      }
    } else {
      setSelectedPhoto(photo);
      
      if (onPhotoSelect) {
        onPhotoSelect(photo);
      }
    }
  };
  
  // Handle photo action (download, trash, etc.)
  const handlePhotoAction = (photo, action) => {
    if (onPhotoAction) {
      onPhotoAction({ 
        type: action, 
        photo: photo 
      });
    }
    
    // If action is 'view', also open modal
    if (action === 'view') {
      setSelectedPhoto(photo);
    }
  };
  
  // Handle download action with loading state
  const handleDownload = async (photo) => {
    try {
      setLoadingState(prev => ({ ...prev, [photo.id]: true }));
      
      if (onPhotoAction) {
        await onPhotoAction({ 
          type: 'download', 
          photo: photo 
        });
      } else {
        // Fallback if no handler provided
        const link = document.createElement('a');
        link.href = photo.url || photo.imageUrl;
        link.download = `photo-${photo.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
      setErrorState('Failed to download photo');
    } finally {
      setLoadingState(prev => ({ ...prev, [photo.id]: false }));
      }
  };

  // Close the info modal
  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };
  
  // Clear error message
  const clearError = () => {
    setErrorState(null);
  };
  
  // Determine grid class based on column count
  const getGridClass = () => {
    return cn("grid gap-4", {
      'grid-cols-1': columns.default === 1,
      'grid-cols-2': columns.default === 2,
      'grid-cols-3': columns.default === 3,
      'grid-cols-4': columns.default === 4,
      'grid-cols-5': columns.default === 5,
      'sm:grid-cols-2': columns.sm === 2,
      'sm:grid-cols-3': columns.sm === 3,
      'sm:grid-cols-4': columns.sm === 4,
      'sm:grid-cols-5': columns.sm === 5,
      'md:grid-cols-2': columns.md === 2,
      'md:grid-cols-3': columns.md === 3,
      'md:grid-cols-4': columns.md === 4,
      'md:grid-cols-5': columns.md === 5,
      'lg:grid-cols-2': columns.lg === 2,
      'lg:grid-cols-3': columns.lg === 3,
      'lg:grid-cols-4': columns.lg === 4,
      'lg:grid-cols-5': columns.lg === 5,
    });
  };
  
  // Render skeleton loaders when loading
  if (loading) {
    return (
      <div className={getGridClass()}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div 
            key={`skeleton-${idx}`}
            className="bg-gray-100 rounded-xl overflow-hidden"
          >
            <div className="aspect-square animate-pulse bg-gray-200"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Show error message
  if (errorState) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 text-red-700 rounded-xl p-4 flex items-start mt-2"
      >
        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">{errorState}</p>
          <button 
            onClick={clearError}
            className="text-sm text-red-600 hover:text-red-800 font-medium mt-2"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    );
  }
  
  // If no photos, show empty state
  if (photos.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl shadow-sm"
      >
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-4">
          <ImageIcon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-1">No photos found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Upload some photos to get started. Your photos will appear here once they've been processed.
        </p>
      </motion.div>
    );
  }
  
  return (
    <>
      <div className={getGridClass()}>
        {photos.map((photo, index) => {
          const isSelected = selectable && selectedPhotos.includes(photo.id);
          const matchCount = (photo.matched_users?.length || photo.faces?.length || 0);
          
          return (
            <motion.div
              key={photo.id || `photo-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={cn(
                "group relative bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-200",
                isSelected ? "ring-2 ring-indigo-500" : "hover:shadow-md",
                selectable ? "cursor-pointer" : ""
              )}
              onClick={() => handlePhotoClick(photo)}
            >
              {/* Selection indicator */}
              {selectable && (
                <div className={cn(
                  "absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected 
                    ? "bg-indigo-500 border-indigo-500 text-white" 
                    : "border-white bg-white/70 text-transparent"
                )}>
                  {isSelected && <Check className="w-4 h-4" />}
                </div>
              )}
              
              {/* Photo thumbnail */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={photo.url || photo.imageUrl}
                  alt={photo.title || 'Photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300?text=Photo+Not+Available';
                  }}
                />
              </div>
              
              {/* Face/match count badge */}
              {matchCount > 0 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-500/80 backdrop-blur-sm text-white rounded-full flex items-center text-xs shadow-sm">
                  <Users className="w-3 h-3 mr-1" />
                  {matchCount}
                </div>
              )}
              
              {/* Title and date */}
              <div className="p-3">
                <p className="font-medium text-gray-900 truncate">
                  {photo.title || 'Untitled Photo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(photo.created_at || photo.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
              
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <div className="flex justify-end gap-1 mb-10 md:mb-16">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoAction(photo, 'info');
                    }}
                    className="p-1.5 md:p-2 bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-indigo-600 transition-colors"
                    aria-label="Photo info"
                  >
                    <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(photo);
                    }}
                    disabled={loadingState[photo.id]}
                    className="p-1.5 md:p-2 bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    aria-label="Download photo"
                  >
                    {loadingState[photo.id] ? (
                      <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoAction(photo, 'trash');
                    }}
                    className="p-1.5 md:p-2 bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                    aria-label="Move to trash"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
                
                {/* View button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoAction(photo, 'view');
                  }}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-white/90 hover:bg-white rounded-lg text-gray-800 transition-colors flex items-center justify-center font-medium text-xs md:text-sm"
                >
                  <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  View Photo
                </button>
              </div>
            </motion.div>
          );
        })}
    </div>
      
      {/* Photo info modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <SimplePhotoInfoModal 
            photo={selectedPhoto} 
            onClose={handleCloseModal} 
          />
        )}
      </AnimatePresence>
    </>
  );
};
