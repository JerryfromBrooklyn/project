import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, DownloadCloud, Share2 } from 'lucide-react';
import { cacheBustedImage } from '../../utils/cacheBuster';

/**
 * Enhanced ImageViewer component with mobile optimization
 * - Touch gestures support (pinch zoom, pan)
 * - Improved mobile controls
 * - Native share integration for downloads on mobile
 */
const ImageViewer = ({ 
  image, 
  onClose, 
  onAction,
  initialZoom = 1 
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [shareApiAvailable, setShareApiAvailable] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const lastTouchDistance = useRef(null);
  
  // Check for mobile device and share API on mount
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    setShareApiAvailable(!!navigator.share);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(initialZoom);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [image, initialZoom]);
  
  // Zoom in/out functions
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  
  // Rotate image
  const rotateImage = () => setRotation(prev => (prev + 90) % 360);
  
  // Handle downloads - use native share on mobile when available
  const handleDownload = () => {
    // Use share for downloads on mobile
    if (isMobile && shareApiAvailable) {
      handleShare();
      return;
    }
    
    // Traditional download for desktop
    if (image?.url) {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.name || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onAction) {
        onAction({ type: 'download', photo: image });
      }
    }
  };
  
  // Enhanced share function for mobile downloads
  const handleShare = async () => {
    if (!image?.url || !navigator.share) return;
    
    try {
      // Prepare share data with context based on what we have
      const shareData = {
        title: image.name || 'Save Image',
        text: image.matchedUser 
          ? `Image with matched user: ${image.matchedUser.name || 'Unknown'}`
          : 'Save this image to your device',
        url: image.url
      };
      
      // If we have access to the original file or blob, share that directly
      // This is better for saving on mobile devices
      if (image.blob || image.file) {
        try {
          const imageBlob = image.blob || image.file;
          const file = new File([imageBlob], 
            image.name || 'image.jpg', 
            { type: imageBlob.type || 'image/jpeg' }
          );
          shareData.files = [file];
        } catch (err) {
          console.warn('Failed to share as file, falling back to URL', err);
        }
      }
      
      await navigator.share(shareData);
      
      if (onAction) {
        onAction({ type: 'share', photo: image });
      }
    } catch (error) {
      // Ignore AbortError which happens when user cancels
      if (error.name !== 'AbortError') {
        console.error('Error sharing image:', error);
      }
    }
  };
  
  // Mouse and touch handlers for dragging
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Touch handlers for pinch zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
    }
  };
  
  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent browser gestures
    
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastTouchDistance.current) {
        const delta = distance - lastTouchDistance.current;
        const newZoom = zoom + (delta * 0.01);
        setZoom(Math.max(0.5, Math.min(3, newZoom)));
      }
      
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Pan/drag when zoomed in
      const touch = e.touches[0];
      if (isDragging) {
        const el = containerRef.current;
        if (!el) return;
        
        const rect = el.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        // Calculate movement relative to previous position
        setPosition(prev => ({
          x: offsetX - rect.width / 2,
          y: offsetY - rect.height / 2
        }));
      }
    }
  };
  
  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    setIsDragging(false);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white"
          onClick={onClose}
          aria-label="Close viewer"
          style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
        >
          <X size={24} />
        </button>
        
        {/* Image container with touch/mouse events */}
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
        >
          <motion.img
            ref={imageRef}
            src={cacheBustedImage(image?.url)}
            alt={image?.name || 'Image'}
            style={{
              transform: `
                translate(${position.x}px, ${position.y}px) 
                scale(${zoom}) 
                rotate(${rotation}deg)
              `,
              cursor: zoom > 1 ? 'grab' : 'default',
              touchAction: 'none',
              maxHeight: '90vh',
              maxWidth: '90vw',
              objectFit: 'contain',
            }}
            draggable="false"
          />
          
          {/* Image metadata if available */}
          {(image?.name || image?.matchedUser) && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center">
              <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg">
                {image?.name && (
                  <h3 className="text-white text-lg">{image.name}</h3>
                )}
                {image?.matchedUser && (
                  <p className="text-white text-sm mt-1">
                    Matched: {image.matchedUser.name || 'Unknown'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Controls overlay */}
        <div className={`
          absolute bottom-4 left-0 right-0 
          flex justify-center items-center 
          gap-4 px-4
        `}>
          <div className="bg-black bg-opacity-70 rounded-full p-1 flex gap-2">
            <button
              className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20"
              onClick={(e) => { e.stopPropagation(); zoomIn(); }}
              aria-label="Zoom in"
              style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
            >
              <ZoomIn size={isMobile ? 24 : 20} />
            </button>
            
            <button
              className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20"
              onClick={(e) => { e.stopPropagation(); zoomOut(); }}
              aria-label="Zoom out"
              style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
            >
              <ZoomOut size={isMobile ? 24 : 20} />
            </button>
            
            <button
              className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20"
              onClick={(e) => { e.stopPropagation(); rotateImage(); }}
              aria-label="Rotate image"
              style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
            >
              <RotateCw size={isMobile ? 24 : 20} />
            </button>
            
            {/* Show different buttons based on mobile and Share API availability */}
            {(shareApiAvailable && isMobile) ? (
              <button
                className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20"
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                aria-label="Share image"
                style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
              >
                <Share2 size={isMobile ? 24 : 20} />
              </button>
            ) : (
              <button
                className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20"
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                aria-label="Download image"
                style={{ minWidth: '44px', minHeight: '44px' }} // Mobile touch target
              >
                <DownloadCloud size={isMobile ? 24 : 20} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageViewer; 