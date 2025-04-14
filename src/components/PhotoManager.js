import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Trash2, CheckSquare, Square } from 'lucide-react';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';
import { Button } from './ui/Button';
import { FaCheckSquare, FaSquare } from 'react-icons/fa';

export const PhotoManager = ({ eventId, mode = 'upload', nativeShare = false }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trashLoading, setTrashLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [matchedCount, setMatchedCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 48; // 12 rows of 4 images
    const { user } = useAuth();
    
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);

    const fetchPhotosAndCounts = useCallback(async (showLoading = true) => {
        if (!user?.id) {
            console.log(`[PhotoManager ${mode}] No user ID, skipping fetch.`);
            if(showLoading) setLoading(false);
            setPhotos([]);
            setUploadedCount(0);
            setMatchedCount(0);
            return;
        }
        
        if (showLoading) {
            setLoading(true);
        }
        setError(null);
        
        try {
            console.log(`[PhotoManager ${mode}] Fetching photos for mode: ${mode}`);
            let fetchedPhotos = [];
            if (mode === 'matches') {
                console.log(`📥 [PhotoManager ${mode}] Fetching MATCHED photos...`);
                fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');
            } else { // Assume 'upload' mode
                console.log(`📥 [PhotoManager ${mode}] Fetching UPLOADED photos...`);
                fetchedPhotos = await awsPhotoService.fetchUploadedPhotos(user.id);
            }
            
            const sortedPhotos = (fetchedPhotos || []).sort((a, b) => 
                new Date(b.created_at || 0) - new Date(a.created_at || 0)
            );

            setPhotos(sortedPhotos);
            console.log(`[PhotoManager ${mode}] Successfully fetched ${sortedPhotos.length} photos for current view.`);

            console.log(`[PhotoManager ${mode}] Fetching counts...`);
            const [uploadedResult, matchedResult] = await Promise.all([
                awsPhotoService.fetchUploadedPhotos(user.id).catch(err => { 
                    console.error("[PhotoManager] Error fetching uploaded count:", err); 
                    return [];
                }),
                awsPhotoService.getVisiblePhotos(user.id, 'matched').catch(err => { 
                    console.error("[PhotoManager] Error fetching matched count:", err); 
                    return [];
                })
            ]);
            
            setUploadedCount(uploadedResult.length);
            setMatchedCount(matchedResult.length);
            console.log(`[PhotoManager ${mode}] Counts updated: Uploaded=${uploadedResult.length}, Matched=${matchedResult.length}`);

        } catch (err) {
            console.error(`[PhotoManager ${mode}] Error fetching photos/counts:`, err);
            setError(err.message || 'An error occurred while fetching data');
            setPhotos([]);
            setUploadedCount(0);
            setMatchedCount(0);
        } finally {
            if(showLoading) setLoading(false);
        }
    }, [user?.id, mode]); 

    useEffect(() => {
        if (!user?.id) return;
        console.log(`🔄 [PhotoManager ${mode}] Effect triggered: mode or user changed.`);
        fetchPhotosAndCounts();
    }, [fetchPhotosAndCounts]);

    const handlePhotoUpload = async (uploadedPhoto) => {
        console.log('[PhotoManager] Upload complete, refetching photos and counts.');
        await fetchPhotosAndCounts(false);
    };

    const handleToggleSelectionMode = () => {
        setIsSelecting(!isSelecting);
        setSelectedPhotos([]);
    };

    const handleTrashSinglePhoto = async (photo: any, event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (isSelecting || !user?.id || !photo?.id) return;
        const photoId = photo.id;

        setTrashLoading(true);
        try {
            console.log(`[PhotoManager] Trashing single photo: ${photoId} for user: ${user.id}`);
            const result = await movePhotosToTrash(user.id, [photoId]);
            
            if (result.success) {
                console.log(`[PhotoManager] Successfully trashed photo: ${photoId}`);
                setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
                setSelectedPhotos(prev => prev.filter(id => id !== photoId));
                fetchPhotosAndCounts(false);
            } else {
                setError(`Failed to move photo to trash: ${result.error}`);
                console.error(`[PhotoManager] Error trashing photo ${photoId}:`, result.error);
            }
        } catch (err) {
            console.error(`[PhotoManager] Exception trashing photo ${photoId}:`, err);
            setError('Failed to move photo to trash. Please try again later.');
        } finally {
            setTrashLoading(false);
        }
    };
    
    const handleSelectPhoto = (photoId: string) => {
        if (!isSelecting) return;
        
        setSelectedPhotos(prev =>
            prev.includes(photoId)
                ? prev.filter(id => id !== photoId)
                : [...prev, photoId]
        );
    };

    const handleShare = async (photoId) => {
        if (!photoId) return;
        
        try {
            const photo = photos.find(p => p.id === photoId);
            if (!photo || !photo.url) {
                console.error('[PhotoManager] Cannot share photo: No URL found');
                return;
            }
            
            console.log('[PhotoManager] Sharing photo:', photo.url);
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: photo.title || 'Shared Photo',
                        text: photo.description || 'Check out this photo!',
                        url: photo.url
                    });
                    console.log('[PhotoManager] Photo shared successfully via Web Share API');
                } catch (err) {
                    console.warn('[PhotoManager] Error using Web Share API:', err);
                    downloadPhoto(photo);
                }
            } else {
                downloadPhoto(photo);
            }
        } catch (err) {
            console.error('[PhotoManager] Error sharing photo:', err);
        }
    };
    
    const downloadPhoto = (photo) => {
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = `photo-${photo.id}.jpg`;
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            window.open(photo.url, '_blank');
        } else {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const totalPages = Math.ceil(photos.length / photosPerPage);
    const currentPhotos = useMemo(() => {
        const indexOfLastPhoto = currentPage * photosPerPage;
        const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
        return photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
    }, [photos, currentPage, photosPerPage]);

    const toggleSelectAll = () => {
        if (!isSelecting) return;
        
        const currentPhotoIds = currentPhotos.map(p => p.id);
        const allSelectedOnPage = currentPhotoIds.length > 0 && currentPhotoIds.every(id => selectedPhotos.includes(id));

        if (allSelectedOnPage) {
            setSelectedPhotos(prev => prev.filter(id => !currentPhotoIds.includes(id)));
        } else {
            setSelectedPhotos(prev => [...new Set([...prev, ...currentPhotoIds])]);
        }
    };

    const handleTrashSelected = async () => {
        if (!isSelecting || !selectedPhotos.length || !user?.id) return;

        const confirmTrash = window.confirm(`Are you sure you want to move ${selectedPhotos.length} selected photo(s) to the trash?`);
        if (!confirmTrash) return;

        setTrashLoading(true);
        try {
            console.log(`[PhotoManager] Trashing ${selectedPhotos.length} photos for user: ${user.id}`);
            const result = await movePhotosToTrash(user.id, selectedPhotos);
            if (result.success) {
                console.log(`[PhotoManager] Successfully trashed selected photos.`);
                const selectedSet = new Set(selectedPhotos);
                setPhotos(prevPhotos => prevPhotos.filter(p => !selectedSet.has(p.id)));
                setSelectedPhotos([]);
                fetchPhotosAndCounts(false);
            } else {
                setError(`Failed to move photos to trash: ${result.error}`);
                console.error('[PhotoManager] Error trashing selected photos:', result.error);
            }
        } catch (err) {
            console.error('[PhotoManager] Exception trashing selected photos:', err);
            setError('An error occurred while moving photos to trash. Please try again.');
        } finally {
            setTrashLoading(false);
            setIsSelecting(false);
            setSelectedPhotos([]);
        }
    };

    // Helper variable for the content inside motion.div
    const photoGridContent = currentPhotos.length > 0 ? (
        _jsxs("div", { children: [
            _jsx(PhotoGrid, { 
                photos: currentPhotos, 
                onTrash: handleTrashSinglePhoto, 
                selectedPhotos: selectedPhotos,
                onSelectPhoto: handleSelectPhoto, 
                isSelecting: isSelecting,
                onPhotoClick: (photo) => {
                   if (!isSelecting) {
                      console.log('Photo clicked (not selecting):', photo.id);
                   }
                 },
                onShare: handleShare, 
            }), 
            photos.length > photosPerPage && (
                _jsx("div", { className: "mt-8 flex justify-center", children: 
                    _jsxs("nav", { className: "flex items-center", children: [
                        _jsx("button", { 
                            onClick: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
                            disabled: currentPage === 1,
                            className: "p-2 mr-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed",
                            children: _jsx(ChevronLeft, { size: 18 })
                        }),
                        _jsx("div", { className: "flex space-x-1", children:
                            [...Array(totalPages)].map((_, i) => (
                                _jsx("button", {
                                    onClick: () => setCurrentPage(i + 1),
                                    className: `px-3 py-1 rounded-md ${
                                        currentPage === i + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`,
                                    children: i + 1
                                }, i)
                            ))
                        }),
                        _jsx("button", { 
                            onClick: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
                            disabled: currentPage === totalPages,
                            className: "p-2 ml-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed",
                            children: _jsx(ChevronRight, { size: 18 })
                        })
                    ]})
                })
            )
        ]})
    ) : (
        _jsx("div", { className: "text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200", children: 
            _jsx("p", { className: "text-gray-500", children: mode === 'upload'
                            ? "You haven't uploaded any photos yet."
                            : "No photos found with your face." })
         })
     ); 

    if (loading && photos.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(RefreshCw, { className: "w-8 h-8 text-apple-gray-400 animate-spin" }) }));
    }
    return (_jsxs("div", { children: [
        error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center border border-red-200", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2 flex-shrink-0" }), _jsx("span", { children: error })] })), 
        mode === 'upload' && (_jsx(PhotoUploader, { eventId: eventId, onUploadComplete: handlePhotoUpload, onError: (error) => setError(error) })), 
        
        _jsxs("div", { className: "photo-manager-header mb-4 p-4 bg-gray-50 rounded-lg border flex justify-between items-center", children: [
            _jsxs("div", { children: [
                 _jsxs("h3", { className: "text-lg font-semibold mb-1", children: [mode === 'upload' ? "My Uploads" : "Matched Photos"]}),
                 _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: [
                    _jsxs("span", { className: "flex items-center", children: [
                        _jsx(Upload, { size: 16, className:"mr-1"}), 
                        `Total Uploaded: ${uploadedCount}`
                    ]}),
                    _jsxs("span", { className: "flex items-center", children: [
                        _jsx(ImageIcon, { size: 16, className:"mr-1"}), 
                        `Total Matched: ${matchedCount}`
                    ]})
                ]})
            ]}),
            _jsx(Button, { 
                variant: "outline", 
                size: "sm", 
                onClick: () => fetchPhotosAndCounts(true), 
                disabled: loading || isSelecting,
                children: _jsxs("span", { className: "flex items-center", children: [
                    _jsx(RefreshCw, { size: 16, className: `mr-1 ${loading ? 'animate-spin' : ''}` }), 
                    "Refresh"
                ]})
            })
        ]}), 
        
        <AnimatePresence>
        {isSelecting && selectedPhotos.length > 0 && (
          <motion.div 
             initial={{ opacity: 0, y: -10 }} 
             animate={{ opacity: 1, y: 0 }} 
             exit={{ opacity: 0, y: -10 }}
             className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between sticky top-0 z-10 shadow"
           >
            <div className="flex items-center space-x-3">
              <Button, { 
                variant: "ghost",
                size: "sm",
                onClick: toggleSelectAll,
                "aria-label": currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) 
                              ? 'Deselect all visible' 
                              : 'Select all visible',
                children: [
                   currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? (
                     _jsx(CheckSquare, { className: "mr-2 h-4 w-4" })
                   ) : (
                     _jsx(Square, { className: "mr-2 h-4 w-4" })
                   ), 
                  currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect All' : 'Select All'
                ]
               }>,
              _jsx("span", { className: "text-sm font-medium text-blue-700", children: `${selectedPhotos.length} selected` })
            ]}), 
            _jsx("div", { className: "flex space-x-2", children: 
              _jsxs(Button, { 
                variant: "destructive",
                size: "sm",
                onClick: handleTrashSelected, 
                disabled: trashLoading, 
                "aria-label": "Move selected photos to trash",
                children: [
                  _jsx(Trash2, { className: "mr-2 h-4 w-4" }), 
                  trashLoading ? "Moving..." : "Move to Trash"
                ]
              })
            })
          </motion.div>
        )}
       </AnimatePresence>,

        _jsx(motion.div, { 
            initial: { opacity: 0, y: 20 }, 
            animate: { opacity: 1, y: 0 }, 
            children: photoGridContent 
        })
    ] }));
};
