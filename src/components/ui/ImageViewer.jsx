import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced image viewer with touch/mobile support
 * Features:
 * - Pinch zoom and pan gestures
 * - Backdrop blur for visual separation
 * - Touch-friendly controls (44x44px)
 * - Swipe to dismiss
 */
const ImageViewer = ({ 
  image, 
  alt = '', 
  onClose, 
  onAction = () => {}
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Track if we're currently panning
  const [isPanning, setIsPanning] = useState(false);
  
  // Track tap count for double-tap to zoom
  const tapTimeoutRef = useRef(null);
  const tapCount = useRef(0);

  // Reset transforms
  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle touch start/end for double-tap zoom
  const handleTouchStart = (e) => {
    tapCount.current += 1;
    
    clearTimeout(tapTimeoutRef.current);
    
    tapTimeoutRef.current = setTimeout(() => {
      tapCount.current = 0;
    }, 300);
    
    // Double tap to zoom
    if (tapCount.current === 2) {
      tapCount.current = 0;
      if (scale === 1) {
        setScale(2);
      } else {
        resetTransform();
      }
    }
  };
  
  // Pan handler for touch devices
  const handlePan = (e) => {
    if (scale > 1 && !isPanning) {
      setIsPanning(true);
    }
    
    if (isPanning) {
      e.preventDefault();
      const newX = position.x + e.movementX;
      const newY = position.y + e.movementY;
      
      setPosition({ x: newX, y: newY });
    }
  };
  
  // Touch pan handler
  const handleTouchMove = (e) => {
    if (scale === 1 || e.touches.length !== 1) return;
    
    if (!isPanning) {
      setIsPanning(true);
      return;
    }
    
    // Get current and previous touch positions
    const touch = e.touches[0];
    const prevTouch = e.target.prevTouch || { clientX: touch.clientX, clientY: touch.clientY };
    
    // Calculate movement
    const deltaX = touch.clientX - prevTouch.clientX;
    const deltaY = touch.clientY - prevTouch.clientY;
    
    // Update position
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    // Store current touch as previous for next move
    e.target.prevTouch = { clientX: touch.clientX, clientY: touch.clientY };
  };
  
  // Touch end handler
  const handleTouchEnd = () => {
    setIsPanning(false);
    if (imageRef.current) {
      imageRef.current.prevTouch = null;
    }
  };
  
  // Allow pinch zoom using wheel event
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Determine zoom direction based on wheel delta
    const delta = -Math.sign(e.deltaY) * 0.1;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    
    setScale(newScale);
  };
  
  // Download image handler - update to use native share API
  const handleDownload = () => {
    // Check if Web Share API is available (iOS, Android, modern browsers)
    if (navigator.share && navigator.canShare) {
      // Try to share using native share API
      fetch(image.src || image.url || '')
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], image.name || 'photo.jpg', { type: blob.type });
          
          if (navigator.canShare({ files: [file] })) {
            navigator.share({
              title: image.name || 'Photo',
              files: [file]
            }).catch(error => {
              console.log('Error sharing:', error);
              // Fall back to traditional download if sharing fails
              downloadWithLink();
            });
          } else {
            // Share API available but can't share files
            downloadWithLink();
          }
        })
        .catch(error => {
          console.log('Error fetching image:', error);
          downloadWithLink();
        });
    } else {
      // Web Share API not available, use traditional download
      downloadWithLink();
    }
    
    onAction('download');
  };
  
  // Traditional download fallback
  const downloadWithLink = () => {
    const link = document.createElement('a');
    link.href = image.src || image.url || '';
    link.download = image.name || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden touch-none">
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Main container */}
        <div 
          className="absolute inset-0 flex items-center justify-center p-4"
          ref={containerRef}
        >
          {/* Image container with gesture support */}
          <motion.div
            className="relative overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image with transform */}
            <div 
              className="overflow-hidden touch-pan-y"
              onMouseDown={() => setIsPanning(true)}
              onMouseMove={handlePan}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <img
                ref={imageRef}
                src={image.src || image.url || ''}
                alt={alt || image.alt || image.name || 'Image'}
                className="object-contain max-h-[80vh] max-w-full transform"
                style={{ 
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  transition: isPanning ? 'none' : 'transform 0.3s'
                }}
                draggable="false"
              />
            </div>
            
            {/* Action buttons - mobile touch friendly */}
            <div className="absolute top-4 right-4 flex space-x-2">
              {/* Close button */}
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Close image viewer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Download button */}
              <button
                onClick={handleDownload}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Download image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              
              {/* Reset zoom button (only shown when zoomed) */}
              {scale !== 1 && (
                <button
                  onClick={resetTransform}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Reset zoom"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Bottom controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="px-4 py-2 bg-black/50 rounded-full text-white text-sm">
                {scale !== 1 ? `${Math.round(scale * 100)}%` : 'Pinch or double-tap to zoom'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ImageViewer; 