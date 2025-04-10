import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info } from 'lucide-react';
import SimplePhotoInfoModal from './SimplePhotoInfoModal';
import { cn } from '../utils/cn';

export const PhotoGrid = ({ photos, onDelete, onShare, onDownload }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [loading, setLoading] = useState({});

    const handleDownload = async (photo) => {
        if (onDownload) {
            try {
                setLoading({ ...loading, [photo.id]: true });
                await onDownload(photo.id);
            }
            catch (error) {
                console.error('Error downloading photo via prop function:', error);
            }
            finally {
                setLoading({ ...loading, [photo.id]: false });
            }
        } else {
             console.warn('No onDownload prop provided to PhotoGrid');
        }
    };

    if (photos.length === 0) {
        return (_jsxs("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-apple-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-apple-gray-500 font-medium", children: "No photos found" }), _jsx("p", { className: "text-apple-gray-400 text-sm mt-1", children: photos.length === 0 ? "No photos have been uploaded yet" : "No matches found in any photos" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: photos.map((photo, index) => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "relative group", children: [_jsx("div", { className: "aspect-square rounded-apple-xl overflow-hidden", children: _jsx("img", { src: photo.url, alt: photo.title || `Photo ${photo.id}`, className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" }) }), 
                            // Only show a badge for photos with faces detected
                            (() => {
                                // Helper to safely get array length, handling different data structures
                                const getFaceCount = (photo) => {
                                    // Check if photo.faces exists
                                    if (!photo.faces) return 0;
                                    
                                    // If it's an array, return its length
                                    if (Array.isArray(photo.faces)) {
                                        return photo.faces.length;
                                    }
                                    
                                    // If it's an object with a length property
                                    if (typeof photo.faces === 'object' && photo.faces.length !== undefined) {
                                        return photo.faces.length;
                                    }

                                    // Fall back to face_ids if available
                                    if (Array.isArray(photo.face_ids)) {
                                        return photo.face_ids.length;
                                    }
                                    
                                    // If it's an object but we can count its keys
                                    if (typeof photo.faces === 'object') {
                                        return Object.keys(photo.faces).length;
                                    }
                                    
                                    // Default fallback
                                    return 0;
                                };
                                
                                // Get the face count
                                const faceCount = getFaceCount(photo);
                                
                                // Get the match count
                                const matchCount = photo.matched_users && Array.isArray(photo.matched_users) 
                                    ? photo.matched_users.length 
                                    : 0;
                                
                                // Only render badge if there are faces or matches
                                return (faceCount > 0 || matchCount > 0) && (
                                    <div className={cn(
                                        "absolute top-2 right-2 px-2 py-1 rounded-full text-sm flex items-center gap-1", 
                                        "bg-apple-blue-500/80 text-white backdrop-blur-sm"
                                    )}>
                                        <Users className="w-4 h-4" />
                                        {matchCount > 0
                                            ? `${matchCount} ${matchCount === 1 ? "Match" : "Matches"}`
                                            : `${faceCount} ${faceCount === 1 ? "Face" : "Faces"}`
                                        }
                                    </div>
                                );
                            })()}
                            _jsx("div", { className: "absolute inset-0 bg-black/50 rounded-apple-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: _jsxs("div", { className: "absolute bottom-0 inset-x-0 p-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleDownload(photo), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", disabled: loading[photo.id], "aria-label": "Download photo", children: _jsx(Download, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => setSelectedPhoto(photo), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", "aria-label": "View photo details", children: _jsx(Info, { className: "w-5 h-5" }) })] }), onDelete && (_jsx("button", { onClick: () => onDelete(photo.id), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", "aria-label": "Delete photo", children: _jsx(Trash2, { className: "w-5 h-5" }) }))] }) })] }, `${photo.id}-${index}`))) }), _jsx(AnimatePresence, { children: selectedPhoto && (_jsx(SimplePhotoInfoModal, { photo: selectedPhoto, onClose: () => setSelectedPhoto(null) })) })] }));
};
