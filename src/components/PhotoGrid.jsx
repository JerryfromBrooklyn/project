import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info, Image as ImageIcon, Eye, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import SimplePhotoInfoModal from './SimplePhotoInfoModal.jsx';

/**
 * A responsive photo grid component
 */
export const PhotoGrid = ({ 
  photos = [], 
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
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect if user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle photo selection
  const handlePhotoClick = (photo) => {
    if (selectable && onSelectPhoto) {
      onSelectPhoto(photo.id);
    } else {
      // Directly open the modal when clicking on a photo
      console.log("PhotoGrid.jsx: Opening photo modal for:", photo.id);
      setSelectedPhoto(photo);
      
      // Also call external handler if provided
      if (onPhotoAction) {
        onPhotoAction({ type: 'view', photo });
      }
    }
  };
  
  // Close the modal
  const handleCloseModal = () => {
    console.log("PhotoGrid.jsx: Closing photo modal");
    setSelectedPhoto(null);
  };
  
  // Handle image load error
  const handleImageError = (photoId) => {
    setImageErrors(prev => ({
      ...prev,
      [photoId]: true
    }));
  };
  
  // Determine grid columns based on screen size
  const getGridClasses = () => {
    return cn(
      "grid gap-4",
      `grid-cols-${columns.default}`,
      columns.sm && `sm:grid-cols-${columns.sm}`,
      columns.md && `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`
    );
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }
  
  // Show empty state
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-gray-50 rounded-xl">
        <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No photos found</p>
        <p className="text-gray-500 text-sm mt-1">Upload photos or check back later</p>
      </div>
    );
  }
  
  // Calculate if image has face matches
  const getMatchCount = (photo) => {
    return photo.matched_users?.length || 
           photo.faces?.length || 
           photo.facesCount || 
           photo.matchedUsersCount || 
           0;
  };
  
  return (
    <>
      <div className={getGridClasses()}>
        {photos.map((photo, index) => {
          const isSelected = selectable && selectedPhotos.includes(photo.id);
          const matchCount = getMatchCount(photo);
          
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
                selectable ? "cursor-pointer" : "cursor-pointer"
              )}
              onClick={() => {
                console.log("PhotoGrid.jsx: Container clicked for photo:", photo.id || index);
                handlePhotoClick(photo);
              }}
              style={{ position: 'relative', zIndex: 1 }}
              role="button"
              tabIndex={0}
              aria-label={`View photo ${photo.title || 'image'}`}
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
              
              {/* Photo thumbnail - optimized for touch */}
              <div 
                className={cn(
                  "aspect-square bg-gray-100",
                  "active:opacity-90 active:scale-95 transition-all duration-150", // iOS-style tap feedback
                  isMobile ? "touch-manipulation" : "" // Optimization for touch devices
                )}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  console.log("PhotoGrid.jsx: Image div clicked for photo:", photo.id || index);
                  handlePhotoClick(photo);
                }}
                onTouchStart={(e) => {
                  // Adds active state for touch devices (iOS style)
                  e.currentTarget.classList.add("scale-[0.98]", "opacity-80");
                }}
                onTouchEnd={(e) => {
                  // Removes active state
                  e.currentTarget.classList.remove("scale-[0.98]", "opacity-80");
                }}
                onTouchCancel={(e) => {
                  // Removes active state if touch is canceled
                  e.currentTarget.classList.remove("scale-[0.98]", "opacity-80");
                }}
                role="button"
                tabIndex={0}
                aria-label={`View photo ${photo.title || 'image'}`}
                style={{ position: 'relative', zIndex: 2 }}
              >
                <img
                  src={photo.url || photo.imageUrl}
                  alt={photo.title || 'Photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false} // Prevent drag on mobile
                  style={{ pointerEvents: 'none' }} // Ensure clicks go to parent div
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300?text=Photo+Not+Available';
                    handleImageError(photo.id);
                  }}
                />
              </div>
              
              {/* Face/match count badge */}
              {matchCount > 0 && (
                <div 
                  className="absolute top-2 right-2 px-2 py-1 bg-indigo-500/80 backdrop-blur-sm text-white rounded-full flex items-center text-xs shadow-sm"
                  style={{ zIndex: 3 }}
                >
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
              
              {/* Hover/active overlay with subtle highlight effect */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent",
                "opacity-0 group-hover:opacity-100 group-active:opacity-100", // Show on hover and active (touch)
                "transition-opacity duration-200 rounded-xl"
              )}
              style={{ zIndex: 1, pointerEvents: 'none' }} // Ensure overlay doesn't block clicks
              >
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
