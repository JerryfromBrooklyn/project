import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertCircle } from 'lucide-react';
import SimplePhotoInfoModal from './SimplePhotoInfoModal.jsx';
import { cn } from '../utils/cn';

export const PhotoGrid = ({ photos, onDelete, onShare, onTrash }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect if user is on mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
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

    return (_jsxs(_Fragment, { children: [
        _jsx("div", { 
            className: "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4", 
            children: photos.map((photo) => {
                const motionProps = { 
                    layout: true, 
                    initial: { opacity: 0, scale: 0.9 }, 
                    animate: { opacity: 1, scale: 1 }, 
                    exit: { opacity: 0, scale: 0.9 }, 
                    className: "relative group", 
                };
                
                return _jsxs(motion.div, { 
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
                            children: _jsx("img", { 
                                src: photo.url, 
                                alt: photo.title || `Photo ${photo.id}`, 
                                className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                                draggable: false, // Prevent drag on mobile
                                loading: "lazy",
                                style: { pointerEvents: 'none' } // Ensure clicks go to parent div
                            })
                        }),
                        photo.faces && (_jsxs("div", { 
                            className: cn("absolute top-2 right-2 px-2 py-1 rounded-full text-sm flex items-center gap-1", "bg-indigo-500/85 text-white backdrop-blur-sm shadow-md"), 
                            style: { zIndex: 3 },
                            children: [
                                _jsx(Users, { className: "w-4 h-4 text-indigo-100" }), 
                                photo.matched_users?.length > 0 
                                    ? `${photo.matched_users.length} ${photo.matched_users.length === 1 ? "Match" : "Matches"}` 
                                    : `${photo.faces.length} ${photo.faces.length === 1 ? "Face" : "Faces"}`
                            ]
                        })),
                        _jsx("div", { 
                            className: cn(
                                "absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-apple-xl",
                                "opacity-0 group-hover:opacity-100 group-active:opacity-100", // Show on hover and active (touch)
                                "transition-opacity duration-200"
                            ),
                            style: { zIndex: 1, pointerEvents: 'none' } // Ensure overlay doesn't interfere with clicks
                        })
                    ]
                });
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
    ] }));
};
