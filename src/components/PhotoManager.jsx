import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [trashLoading, setTrashLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [matchedCount, setMatchedCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 48; 
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
            } else {
                console.log(`📥 [PhotoManager ${mode}] Fetching UPLOADED photos...`);
                fetchedPhotos = await awsPhotoService.fetchUploadedPhotos(user.id);
            }
            
            const sortedPhotos = (fetchedPhotos || []).sort((a: any, b: any) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
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

        } catch (err: any) {
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

    const handlePhotoUpload = async (uploadedPhoto: any) => {
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
        
        const confirmTrash = window.confirm("Are you sure you want to move this photo to the trash?");
        if (!confirmTrash) return;

        setTrashLoading(true); 
        try {
            console.log(`[PhotoManager] Trashing single photo: ${photoId} for user: ${user.id}`);
            const result = await movePhotosToTrash(user.id, [photoId]);
            
            if (result.success) {
                console.log(`[PhotoManager] Successfully trashed photo: ${photoId}`);
                setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
                setSelectedPhotos(prev => prev.filter(id => id !== photoId)); 
            } else {
                setError(`Failed to move photo to trash: ${result.error || 'Unknown error'}`);
                console.error(`[PhotoManager] Error trashing photo ${photoId}:`, result.error);
            }
        } catch (err: any) {
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
    
    const toggleSelectAllOnPage = () => {
        if (!isSelecting) return;
        
        const currentPhotoIds = photos.map(p => p.id);
        const allVisibleSelected = currentPhotoIds.length > 0 && currentPhotoIds.every(id => selectedPhotos.includes(id));

        if (allVisibleSelected) {
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
                await fetchPhotosAndCounts(false);
            } else {
                setError(`Failed to move photos to trash: ${result.error || 'Unknown error'}`);
                console.error('[PhotoManager] Error trashing selected photos:', result.error);
            }
        } catch (err: any) {
            console.error('[PhotoManager] Exception trashing selected photos:', err);
            setError('An error occurred while moving photos to trash. Please try again.');
        } finally {
            setTrashLoading(false);
            setIsSelecting(false);
            setSelectedPhotos([]);
        }
    };
    
    const totalPages = Math.ceil(photos.length / photosPerPage);
    const currentPhotos = useMemo(() => {
        const indexOfLastPhoto = currentPage * photosPerPage;
        const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
        return photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
    }, [photos, currentPage, photosPerPage]);
    
    const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    };
    
    const handleShare = async (photoId: string) => {
        if (isSelecting) return;
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
    const downloadPhoto = (photo: any) => {
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
    
    const photoGridContent = (
        loading && photos.length === 0 ? (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        ) : error ? (
            <div className="my-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <p>{error}</p>
                <Button 
                    variant="link"
                    className="mt-2 text-sm p-0 h-auto text-red-600 hover:text-red-800"
                    onClick={() => fetchPhotosAndCounts(true)}
                    disabled={isSelecting}
                >
                    Try again
                </Button>
            </div>
        ) : photos.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    {mode === 'upload' ? "No photos uploaded" : "No photos matched"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {mode === 'upload' ? "Get started by uploading some photos." : "No photos matched your face yet."}
                </p>
            </div>
        ) : (
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
                totalPages > 1 && (
                    _jsx("div", { className: "mt-8 flex justify-center", children: 
                        _jsxs("nav", { className: "flex items-center space-x-1", children: [
                            _jsx(Button, { 
                                variant: "outline",
                                size: "icon_sm",
                                onClick: () => handlePageChange(currentPage - 1),
                                disabled: currentPage === 1 || isSelecting,
                                "aria-label": "Previous page",
                                children: _jsx(ChevronLeft, { size: 18 })
                            }),
                             _jsx("span", { className: "text-sm px-2 text-gray-600", children: 
                                 `Page ${currentPage} of ${totalPages}`
                             }), 
                            _jsx(Button, { 
                                variant: "outline",
                                size: "icon_sm",
                                onClick: () => handlePageChange(currentPage + 1),
                                disabled: currentPage === totalPages || isSelecting,
                                "aria-label": "Next page",
                                children: _jsx(ChevronRight, { size: 18 })
                            })
                        ]})
                    })
                )
            ]})
        )
    );

    return (_jsxs("div", { className: "space-y-4", children: [
        _jsxs("div", { className: "flex justify-between items-center flex-wrap gap-2", children: [
             _jsxs("div", { children: [
                 _jsxs("h3", { className: "text-lg font-semibold mb-1", children: [
                     isSelecting ? `${selectedPhotos.length} Selected` : 
                     (mode === 'upload' ? "My Uploads" : "Matched Photos")
                 ]}),
                 !isSelecting && (
                     _jsxs("div", { className: "flex items-center space-x-4 text-xs text-gray-500", children: [
                        _jsxs("span", { className: "flex items-center", children: [
                            _jsx(Upload, { size: 14, className:"mr-1"}), 
                            `${uploadedCount} Uploaded`
                        ]}),
                        _jsxs("span", { className: "flex items-center", children: [
                            _jsx(ImageIcon, { size: 14, className:"mr-1"}), 
                            `${matchedCount} Matched`
                        ]})
                    ]})
                 )
            ]}),
            _jsxs("div", { className: "flex items-center space-x-2", children: [ 
                 {!isSelecting ? (
                    _jsx(Button, { 
                        variant: "outline", 
                        size: "sm", 
                        onClick: () => fetchPhotosAndCounts(true), 
                        disabled: loading, 
                        children: _jsxs("span", { className: "flex items-center", children: [
                            _jsx(RefreshCw, { size: 16, className: `mr-1.5 ${loading ? 'animate-spin' : ''}` }), 
                            "Refresh"
                        ]})
                    })
                 ) : (
                     <Button 
                       variant="destructive_outline" 
                       size="sm"
                       onClick={handleToggleSelectionMode}
                     >
                       Cancel
                     </Button>
                 )},
                 {photos.length > 0 && !isSelecting && (
                     _jsx(Button, { 
                         variant: "primary_outline", 
                         size: "sm", 
                         onClick={handleToggleSelectionMode},
                         children: "Select"
                     })
                 )}
            ]})
        ]}), 
        
        mode === 'upload' && (_jsx(PhotoUploader, { 
            eventId: eventId, 
            onUploadComplete: handlePhotoUpload, 
            onError: (err: any) => setError(err.message || 'Upload failed') 
        })), 

        <AnimatePresence>
         {isSelecting && selectedPhotos.length > 0 && (
          <motion.div 
             initial={{ opacity: 0, height: 0 }} 
             animate={{ opacity: 1, height: 'auto' }} 
             exit={{ opacity: 0, height: 0 }}
             transition={{ duration: 0.2 }}
             className="p-2 sm:p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between overflow-hidden sticky top-0 z-10" 
           >
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleSelectAllOnPage}
              className="text-blue-600 hover:text-blue-700 px-2 sm:px-3"
              aria-label={currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect all on page' : 'Select all on page'}
            >
               {currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? (
                 _jsx(CheckSquare, { className: "mr-1.5 h-4 w-4" })
               ) : (
                 _jsx(Square, { className: "mr-1.5 h-4 w-4" })
               )}
              {currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect All' : 'Select All'}
             </Button>
           
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button 
                variant="ghost" 
                size="icon_sm" 
                onClick={handleTrashSelected} 
                disabled={trashLoading} 
                className="text-red-600 hover:text-red-700"
                aria-label="Move selected photos to trash"
                title="Move to Trash"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
       </AnimatePresence>,

        _jsx(motion.div, { 
            initial={{ opacity: 0, y: 10 }}, 
            animate={{ opacity: 1, y: 0 }}, 
            transition={{ duration: 0.3, delay: 0.1 }},
            children: photoGridContent 
        })
    ] }));
}; 