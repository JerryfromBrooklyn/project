import React, { useState, useEffect } from 'react';
import PhotoCard from './ui/PhotoCard';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info } from 'lucide-react';
import SimplePhotoInfoModal from './SimplePhotoInfoModal.jsx';
import { cn } from '../utils/cn';
import { FaCheckSquare, FaSquare, FaTrash, FaShare, FaDownload } from 'react-icons/fa';

/**
 * Mobile-optimized photo grid component
 * Uses responsive grid layout with appropriate sizing for different devices
 */
const PhotoGrid = ({
  photos = [],
  onPhotoSelect,
  onPhotoAction,
  loading = false,
  columns = {
    default: 2,
    sm: 3,
    md: 4,
    lg: 5
  },
  onSelectPhoto,
  selectedPhotos,
  onDelete,
  onShare,
  onDownload
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading: loadingState, setLoading] = useState({});
  
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
  
  // Get actual number of columns based on screen size
  const getColumnCount = () => {
    const width = window.innerWidth;
    
    if (width >= 1280) return 4; // lg: 4 columns
    if (width >= 1024) return 4; // md: 4 columns
    if (width >= 768) return 3;  // sm: 3 columns
    return 2;                    // default: 2 columns
  };
  
  const columnCount = getColumnCount();
  
  // Handle photo actions from the card
  const handlePhotoAction = (action) => {
    if (onPhotoAction) {
      onPhotoAction(action);
    }
    
    // If action is 'view', also trigger select
    if (action.type === 'view' && onPhotoSelect) {
      onPhotoSelect(action.photo);
    }
  };
  
  const handleDownload = async (photo) => {
    if (onPhotoAction && onPhotoAction.onDownload) {
      try {
        setLoading({ ...loadingState, [photo.id]: true });
        await onPhotoAction.onDownload(photo.id);
      }
      catch (error) {
        console.error('Error downloading photo via prop function:', error);
      }
      finally {
        setLoading({ ...loadingState, [photo.id]: false });
      }
    } else {
      console.warn('No onDownload prop provided to PhotoGrid');
    }
  };
  
  // Render skeleton loaders when loading
  if (loading) {
    return (
      <div className={`grid grid-cols-${columnCount} gap-4`}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div 
            key={`skeleton-${idx}`}
            className="aspect-square rounded-lg bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  // If no photos, show message
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mb-4 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900">No photos found</h3>
        <p className="mt-2 text-gray-500">Upload some photos to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {photos.map((photo) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative aspect-square group"
        >
          {onSelectPhoto && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectPhoto(photo.id);
              }}
              className="absolute top-4 right-4 z-10 p-3 bg-white/80 rounded-full hover:bg-white transition-colors"
              aria-label={selectedPhotos.includes(photo.id) ? "Deselect photo" : "Select photo"}
            >
              {selectedPhotos.includes(photo.id) ? (
                <FaCheckSquare className="w-8 h-8 text-blue-500" />
              ) : (
                <FaSquare className="w-8 h-8 text-gray-400" />
              )}
            </button>
          )}
          
          <img
            src={photo.url}
            alt=""
            className="w-full h-full object-cover rounded-lg cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePhotoAction(photo);
            }}
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-end space-x-4">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(photo.id);
                  }}
                  className="p-3 bg-white/80 rounded-full hover:bg-white transition-colors"
                  aria-label="Delete photo"
                >
                  <FaTrash className="w-8 h-8 text-red-500" />
                </button>
              )}
              {onShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(photo.id);
                  }}
                  className="p-3 bg-white/80 rounded-full hover:bg-white transition-colors"
                  aria-label="Share photo"
                >
                  <FaShare className="w-8 h-8 text-blue-500" />
                </button>
              )}
              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photo);
                  }}
                  className="p-3 bg-white/80 rounded-full hover:bg-white transition-colors"
                  aria-label="Download photo"
                >
                  <FaDownload className="w-8 h-8 text-green-500" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PhotoGrid;
