import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info, CheckCircle2, Circle } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import SimplePhotoInfoModal from './SimplePhotoInfoModal.jsx';
import { cn } from '../utils/cn';

export const PhotoGrid = ({ photos, onDelete, onShare, onDownload, onTrash, selectedPhotos, onSelectPhoto, isSelecting, onPhotoClick }) => {
<<<<<<< HEAD
    const [selectedPhotoInfo, setSelectedPhotoInfo] = useState(null);
=======
    const [selectedPhoto, setSelectedPhoto] = useState(null);
>>>>>>> aae08b973963c9dedd5bb277aab51f8adf61505c
    const [loading, setLoading] = useState({});
    const [sharing, setSharing] = useState({});

    const handleDownload = async (photo) => {
        if (onDownload) {
            try {
                setLoading({ ...loading, [photo.id]: true });
                await onDownload(photo.id);
            }
            catch (error) {
                console.error('Error downloading photo:', error);
            }
            finally {
                setLoading({ ...loading, [photo.id]: false });
            }
            return;
        }
        try {
            setLoading({ ...loading, [photo.id]: true });
            const url = await PhotoService.downloadPhoto(photo.id);
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-${photo.id}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error downloading photo:', error);
        }
        finally {
            setLoading({ ...loading, [photo.id]: false });
        }
    };

    const handleShare = async (photo, e) => {
        e.stopPropagation();
        if (!onShare) return;
        
        try {
            setSharing({ ...sharing, [photo.id]: true });
            await onShare(photo.id);
        } catch (error) {
            console.error('Error sharing photo:', error);
        } finally {
            setSharing({ ...sharing, [photo.id]: false });
        }
    };

    if (!photos || photos.length === 0) {
        return (_jsxs("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-apple-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-apple-gray-500 font-medium", children: "No photos found" }), _jsx("p", { className: "text-apple-gray-400 text-sm mt-1", children: photos.length === 0 ? "No photos have been uploaded yet" : "No matches found in any photos" })] }));
    }

    return (_jsxs(_Fragment, { children: [
        _jsx("div", {
            className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5",
            children: photos.map((photo) => {
                const isSelected = selectedPhotos?.includes(photo.id);
                const motionProps = {
                    layout: true,
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9 },
                    transition: { duration: 0.2, ease: "easeInOut" },
                    className: cn(
                        "relative group aspect-square rounded-apple-lg overflow-hidden shadow-md transition-all duration-200 ease-in-out",
                        !isSelecting && "hover:scale-[1.02]",
                        isSelecting ? "cursor-pointer" : ""
                    ),
                };

                return _jsx(motion.div, {
                    ...motionProps,
                    onClick: () => {
<<<<<<< HEAD
                        if (onSelectPhoto) {
                            onSelectPhoto(photo.id);
=======
                        if (isSelecting) {
                            onSelectPhoto && onSelectPhoto(photo.id);
>>>>>>> aae08b973963c9dedd5bb277aab51f8adf61505c
                        } else {
                            onPhotoClick && onPhotoClick(photo);
                        }
                    },
                    children: _jsxs("div", {
                      className: "w-full h-full",
                      children: [
                          isSelecting && (
                            _jsx("div", {
                              className: cn(
                                "absolute top-2 left-2 z-10 p-1 rounded-full transition-all duration-200",
                                "bg-black/40 backdrop-blur-sm",
                                isSelected ? "text-white bg-blue-500" : "text-gray-200 hover:bg-black/60"
                              ),
                              onClick: (e) => {
                                  e.stopPropagation();
                                  onSelectPhoto && onSelectPhoto(photo.id);
                              },
                              children: isSelected ? _jsx(CheckCircle2, { className: "w-4 h-4 sm:w-5 sm:h-5" }) : _jsx(Circle, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                            })
                          ),
                           _jsx("div", {
                              className: "w-full h-full",
                              children: _jsx("img", {
                                  src: photo.url,
                                  alt: photo.title || `Photo ${photo.id}`,
                                  className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              })
                           }),
                          photo.faces && (_jsxs("div", {
                            className: cn("absolute top-2 right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs sm:text-sm flex items-center gap-1", "bg-indigo-500/85 text-white backdrop-blur-sm shadow-md"),
                            children: [
                                _jsx(Users, { className: "w-4 h-4 text-indigo-100" }), 
                                photo.matched_users?.length > 0 
                                    ? `${photo.matched_users.length} ${photo.matched_users.length === 1 ? "Match" : "Matches"}` 
                                    : `${photo.faces.length} ${photo.faces.length === 1 ? "Face" : "Faces"}`
                            ]
                        })),
                          _jsx("div", {
                             onClick: (e) => e.stopPropagation(), 
                              className: cn(
                                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-apple-lg transition-opacity duration-300", 
                                isSelecting ? "opacity-0" : "opacity-0 group-hover:opacity-100" 
                              ),
                              children: _jsxs("div", {
                                 className: "absolute bottom-3 left-2 right-2 flex justify-between items-center", 
                                 children: [
                                      _jsxs("div", {
                                          className: "flex space-x-2",
                                          children: [
                                              _jsx("button", {
                                                  onClick: (e) => { e.stopPropagation(); handleDownload(photo); }, 
                                                  className: "p-2.5 sm:p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-300 shadow-lg",
                                                  disabled: loading[photo.id],
                                                  "aria-label": "Download photo",
                                                  title: "Download",
                                                  children: _jsx(Download, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                                              }),
                                              onShare && (_jsx("button", {
                                                  onClick: (e) => handleShare(photo, e),
                                                 className: "p-2.5 sm:p-3 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors duration-300 shadow-lg",
                                                  disabled: sharing[photo.id],
                                                  "aria-label": "Share photo",
                                                  title: "Share",
                                                  children: _jsx(Share2, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                                              }))
                                          ]
                                      }),
                                      _jsxs("div", {
                                          className: "flex space-x-2",
                                          children: [
                                              _jsx("button", {
                                                  onClick: (e) => { e.stopPropagation(); setSelectedPhotoInfo(photo); }, 
                                                  className: "p-2.5 sm:p-3 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-300 shadow-lg",
                                                  "aria-label": "View photo details",
                                                  title: "Info",
                                                  children: _jsx(Info, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                                              }),
                                              onTrash && (
<<<<<<< HEAD
                                                  _jsx("button", { 
                                                      onClick: (e) => { e.stopPropagation(); onTrash(photo, e); }, 
                                                      className: "p-2.5 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-300 shadow-lg",
=======
                                                  _jsx("button", {
                                                      onClick: (e) => { e.stopPropagation(); onTrash(photo, e); },
                                                     className: "p-2 sm:p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-300 shadow-lg",
>>>>>>> aae08b973963c9dedd5bb277aab51f8adf61505c
                                                      "aria-label": "Move photo to trash",
                                                      title: "Move to Trash",
                                                      children: _jsx(Trash2, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                                                  })
                                              ),
                                              !onTrash && onDelete && (
                                                   _jsx("button", {
                                                       onClick: (e) => {e.stopPropagation(); onDelete(photo.id);},
                                                      className: "p-2.5 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-300 shadow-lg",
                                                       "aria-label": "Delete photo",
                                                       title: "Delete",
                                                       children: _jsx(Trash2, { className: "w-4 h-4 sm:w-5 sm:h-5" })
                                                   })
                                              )
                                          ]
                                      })
                                  ]
                              })
                          })
                      ]
                  })
                }, photo.id);
            })
        }),
        _jsx(AnimatePresence, { children: selectedPhotoInfo && (_jsx(SimplePhotoInfoModal, { photo: selectedPhotoInfo, onClose: () => setSelectedPhotoInfo(null) })) })
    ] }));
};
