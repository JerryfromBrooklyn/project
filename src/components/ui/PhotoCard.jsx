import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, Share2, Trash2, Edit } from 'lucide-react';
import ImageViewer from './ImageViewer';
import { cacheBustedImage } from '../../utils/cacheBuster';

/**
 * PhotoCard component optimized for both desktop and mobile
 * - Mobile optimized with touch-friendly targets
 * - Uses native share dialog on mobile devices for downloading
 * - Enhanced image viewing with ImageViewer component
 */
const PhotoCard = ({ 
  photo, 
  onAction,
  showActions = true,
  className = ''
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Update mobile status on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle opening the image viewer
  const handleViewImage = (e) => {
    e.stopPropagation();
    setShowViewer(true);
  };
  
  // Handle action button clicks - enhanced for mobile
  const handleAction = (action, e) => {
    if (e) e.stopPropagation();
    
    // Special handling for mobile download
    if (action === 'download' && isMobile && navigator.share && photo?.url) {
      // On mobile with share API, use native sharing for downloads
      handleShareForDownload();
      return;
    }
    
    // Forward action to parent component
    if (onAction) {
      onAction({ 
        type: action, 
        photo 
      });
    }
    
    // Direct download action for desktop
    if (action === 'download' && photo?.url && !isMobile) {
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = photo.name || 'photo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Special share function for downloading on mobile
  const handleShareForDownload = async () => {
    if (!photo?.url || !navigator.share) return;
    
    try {
      // Prepare share data with download context
      const shareData = {
        title: photo.name || 'Save Image',
        text: 'Save this image to your device',
        url: photo.url
      };
      
      // If we have access to the original file or blob, share that directly
      // This is better for saving to device on mobile
      if (photo.blob || photo.file) {
        try {
          const imageBlob = photo.blob || photo.file;
          const file = new File([imageBlob], 
            photo.name || 'image.jpg', 
            { type: imageBlob.type || 'image/jpeg' }
          );
          
          // Include file in share data for better saving
          shareData.files = [file];
        } catch (err) {
          console.warn('Failed to share as file, falling back to URL', err);
        }
      }
      
      await navigator.share(shareData);
    } catch (error) {
      // Ignore AbortError which happens when user cancels
      if (error.name !== 'AbortError') {
        console.error('Error sharing for download:', error);
      }
    }
  };
  
  // Handle standard share action
  const handleShare = (e) => {
    if (e) e.stopPropagation();
    
    if (navigator.share && photo?.url) {
      navigator.share({
        title: photo.name || 'Shared Photo',
        text: photo.description || 'Check out this photo',
        url: photo.url
      }).catch(err => {
        // Ignore AbortError which happens when user cancels
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      });
      
      if (onAction) {
        onAction({ type: 'share', photo });
      }
    }
  };
  
  return (
    <>
      <motion.div 
        className={`relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all ${className}`}
        whileHover={{ scale: isMobile ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Main card with image */}
        <div 
          className="relative cursor-pointer aspect-square bg-gray-100"
          onClick={handleViewImage}
        >
          <img 
            src={photo?.thumbnailUrl ? cacheBustedImage(photo.thumbnailUrl) : cacheBustedImage(photo?.url)}
            alt={photo?.name || 'Photo'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Info overlay on hover/tap - different behavior for mobile */}
          <motion.div 
            className={`
              absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-between p-3
              ${isMobile ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
              transition-opacity duration-200
            `}
          >
            {/* Title area shown only when needed */}
            {photo?.name && (
              <div className="bg-black bg-opacity-50 p-2 rounded">
                <h3 className="text-white font-medium truncate">{photo.name}</h3>
              </div>
            )}
            
            {/* Action buttons - always visible on mobile, otherwise on hover */}
            {showActions && (
              <div className="mt-auto flex justify-end gap-2">
                <button
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                  onClick={handleViewImage}
                  aria-label="View photo"
                  style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
                >
                  <Eye size={20} />
                </button>
                
                {/* Show Download on desktop, or on mobile without Share API */}
                {(!navigator.share || !isMobile) && (
                  <button
                    className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                    onClick={(e) => handleAction('download', e)}
                    aria-label="Download photo"
                    style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
                  >
                    <Download size={20} />
                  </button>
                )}
                
                {/* Show Share if API is available */}
                {navigator.share && (
                  <button
                    className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                    onClick={handleShare}
                    aria-label="Share photo"
                    style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
                  >
                    <Share2 size={20} />
                  </button>
                )}
                
                <button
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                  onClick={(e) => handleAction('edit', e)}
                  aria-label="Edit photo"
                  style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
                >
                  <Edit size={20} />
                </button>
                
                <button
                  className="p-2 rounded-full bg-red-500 bg-opacity-70 text-white hover:bg-opacity-90 transition-all"
                  onClick={(e) => handleAction('delete', e)}
                  aria-label="Delete photo"
                  style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Optional metadata below image */}
        {photo?.date && (
          <div className="p-3 bg-white">
            <p className="text-sm text-gray-500">{new Date(photo.date).toLocaleDateString()}</p>
            {photo?.location && (
              <p className="text-xs text-gray-400 truncate mt-1">{photo.location}</p>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Image viewer modal - separate from the card */}
      {showViewer && (
        <ImageViewer
          image={photo}
          onClose={() => setShowViewer(false)}
          onAction={(action) => {
            if (onAction) onAction(action);
          }}
        />
      )}
    </>
  );
};

export default PhotoCard; 