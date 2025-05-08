import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, memo, useRef, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertCircle } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import SimplePhotoInfoModal from './SimplePhotoInfoModal.jsx';
import { cn } from '../utils/cn';
import { FixedSizeGrid } from 'react-window';

// Helper function to ensure image URLs are valid
const sanitizeImageUrl = (photo) => {
    if (!photo || !photo.url) return '';
    
    // If it's already an S3 URL, return it
    if (photo.url.includes('.s3.amazonaws.com/')) {
        return photo.url;
    }
    
    // Replace temporary provider URLs with proper S3 URLs
    if (photo.url.includes('localhost:3020') || 
        photo.url.includes('/companion/') || 
        photo.url.includes('/dropbox/') || 
        photo.url.includes('/drive/')) {
        
        console.log(`[PhotoGrid] Detected temporary URL: ${photo.url}`);
        
        // Check if we have storage_path to construct a proper S3 URL
        if (photo.storage_path) {
            // Assume standard bucket if not specified
            const bucketName = photo.bucket_name || 'shmong-photos';
            const s3Url = `https://${bucketName}.s3.amazonaws.com/${photo.storage_path}`;
            
            console.log(`[PhotoGrid] Fixing temporary URL by replacing with: ${s3Url}`);
            return s3Url;
        }
    }
    
    // Return the original URL if we couldn't transform it
    return photo.url;
};

export const PhotoGrid = memo(({ photos, onDelete, onShare, onTrash }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const gridContainerRef = useRef(null);
    const parentRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Detect if user is on mobile device and update window size
    useEffect(() => {
        const checkMobileAndSize = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        
        checkMobileAndSize();
        window.addEventListener('resize', checkMobileAndSize);
        
        return () => window.removeEventListener('resize', checkMobileAndSize);
    }, []);

    // Measure container width after render
    useLayoutEffect(() => {
        if (parentRef.current) {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    setContainerWidth(entry.contentRect.width);
                }
            });
            
            resizeObserver.observe(parentRef.current);
            return () => resizeObserver.disconnect();
        }
    }, []);

    // Function to open the photo modal
    const handlePhotoClick = (photo) => {
        console.log("PhotoGrid: Opening photo modal for:", photo.id);
        setSelectedPhoto(photo);
    };

    // Function to handle modal close
    const handleCloseModal = () => {
        console.log("PhotoGrid: Closing photo modal");
        setSelectedPhoto(null);
    };

    if (photos.length === 0) {
        return (_jsxs("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-apple-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-apple-gray-500 font-medium", children: "No photos found" }), _jsx("p", { className: "text-apple-gray-400 text-sm mt-1", children: photos.length === 0 ? "No photos have been uploaded yet" : "No matches found in any photos" })] }));
    }

    // Calculate grid dimensions based on screen size
    const columnCount = isMobile ? 2 : windowSize.width < 1024 ? 3 : 4;
    const actualWidth = containerWidth || windowSize.width;
    const cellWidth = actualWidth / columnCount;
    const cellHeight = cellWidth; // Square cells for photos

    // Number of rows based on photos length
    const rowCount = Math.ceil(photos.length / columnCount);
    
    // Calculate total height instead of using a fixed height with scrolling
    const totalHeight = rowCount * cellHeight;

    // Function to render each cell in the virtual grid
    const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= photos.length) return null;
        
        const photo = photos[index];
        
        // Sanitize the URL to ensure it's an S3 URL, not a temporary provider URL
        const sanitizedUrl = sanitizeImageUrl(photo);
        
        const motionProps = { 
            layout: true, 
            initial: { opacity: 0, scale: 0.9 }, 
            animate: { opacity: 1, scale: 1 }, 
            exit: { opacity: 0, scale: 0.9 }, 
            className: "relative group", 
        };
        
        return _jsx("div", {
            style: {
                ...style,
                padding: '8px'
            },
            children: _jsxs(motion.div, {
                key: photo.id,
                ...motionProps,
                onClick: () => {
                    console.log("PhotoGrid: Parent div clicked for photo:", photo.id);
                    handlePhotoClick(photo);
                },
                style: { cursor: 'pointer', position: 'relative', zIndex: 1 },
                role: "button",
                tabIndex: 0,
                "aria-label": `View photo ${photo.title || photo.id}`,
                children: [
                    _jsx("div", {
                        className: cn(
                            "aspect-square rounded-apple-xl overflow-hidden shadow-md",
                            "active:opacity-90 active:scale-95 transition-all duration-150", // iOS-style tap feedback
                            isMobile ? "touch-manipulation" : "" // Optimization for touch devices
                        ),
                        onClick: (e) => {
                            // Ensure the click event is handled and not just propagated
                            e.stopPropagation(); 
                            console.log("PhotoGrid: Image container clicked for photo:", photo.id);
                            handlePhotoClick(photo);
                        },
                        onTouchStart: (e) => {
                            // Adds active state for touch devices (iOS style)
                            e.currentTarget.classList.add("scale-[0.98]", "opacity-80");
                        },
                        onTouchEnd: (e) => {
                            // Removes active state
                            e.currentTarget.classList.remove("scale-[0.98]", "opacity-80");
                        },
                        onTouchCancel: (e) => {
                            // Removes active state if touch is canceled
                            e.currentTarget.classList.remove("scale-[0.98]", "opacity-80");
                        },
                        role: "button",
                        tabIndex: 0,
                        "aria-label": `View photo ${photo.title || photo.id}`,
                        style: { cursor: 'pointer', position: 'relative', zIndex: 2 },
                        children: _jsx(LazyLoadImage, {
                            alt: photo.title || `Photo ${photo.id}`,
                            src: sanitizedUrl,
                            effect: "blur",
                            threshold: 200,
                            className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                            draggable: false,
                            placeholderSrc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
                            style: { pointerEvents: 'none' },
                            visibleByDefault: false,
                            delayMethod: "throttle",
                            delayTime: 300,
                            wrapperClassName: "w-full h-full"
                        })
                    }),
                    photo.faces && _jsxs("div", {
                        className: cn("absolute top-2 right-2 px-2 py-1 rounded-full text-sm flex items-center gap-1", "bg-indigo-500/85 text-white backdrop-blur-sm shadow-md"),
                        style: { zIndex: 3 },
                        children: [
                            _jsx(Users, { className: "w-4 h-4 text-indigo-100" }),
                            (() => {
                                // Get matched users count correctly regardless of format
                                let matchCount = 0;
                                
                                if (photo.matched_users_list && Array.isArray(photo.matched_users_list)) {
                                    // Use the dedicated list field if available
                                    matchCount = photo.matched_users_list.length;
                                } else if (typeof photo.matched_users === 'string') {
                                    // Handle comma-separated string format
                                    matchCount = photo.matched_users ? photo.matched_users.split(',').filter(Boolean).length : 0;
                                } else if (Array.isArray(photo.matched_users)) {
                                    // Handle array format
                                    matchCount = photo.matched_users.length;
                                } else if (photo.faces && Array.isArray(photo.faces)) {
                                    // Fallback to face count if no matches
                                    matchCount = 0;
                                }
                                
                                return matchCount > 0 
                                    ? `${matchCount} ${matchCount === 1 ? "Match" : "Matches"}` 
                                    : `${photo.faces.length} ${photo.faces.length === 1 ? "Face" : "Faces"}`;
                            })()
                        ]
                    }),
                    _jsx("div", {
                        className: cn(
                            "absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-apple-xl",
                            "opacity-0 group-hover:opacity-100 group-active:opacity-100", // Show on hover and active (touch)
                            "transition-opacity duration-200"
                        ),
                        style: { zIndex: 1, pointerEvents: 'none' } // Ensure overlay doesn't interfere with clicks
                    })
                ]
            })
        });
    }, [columnCount, handlePhotoClick, isMobile, photos]);

    return _jsxs(_Fragment, { children: [
        _jsx("div", {
            ref: parentRef,
            className: "w-full", 
            children: _jsx("div", {
                ref: gridContainerRef,
                className: "w-full",
                style: { height: totalHeight, position: 'relative' },
                children: containerWidth > 0 && _jsx(FixedSizeGrid, {
                    className: "virtualized-photo-grid",
                    columnCount: columnCount,
                    columnWidth: cellWidth,
                    rowCount: rowCount,
                    rowHeight: cellHeight,
                    width: containerWidth,
                    height: totalHeight,
                    style: { overflow: 'visible' }, // Important! Removes internal scrollbars
                    children: Cell
                })
            })
        }),
        _jsx(AnimatePresence, { 
            children: selectedPhoto && (
                _jsx(SimplePhotoInfoModal, { 
                    photo: selectedPhoto, 
                    onClose: handleCloseModal
                })
            ) 
        })
    ]});
});

// Add display name for better debugging
PhotoGrid.displayName = 'PhotoGrid';
