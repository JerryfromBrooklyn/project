import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';

export const PhotoManager = ({ eventId, mode = 'upload', nativeShare = false }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [matchedCount, setMatchedCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 48; // 12 rows of 4 images
    const { user } = useAuth();

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

    const handlePhotoUpload = async (photoId) => {
        await fetchPhotosAndCounts();
    };

    const handlePhotoDelete = async (photoId) => {
        try {
            // Use userVisibilityService to move the photo to trash instead of deleting it
            const result = await movePhotosToTrash(user.id, [photoId]);
            if (result.success) {
                setPhotos(photos.filter(p => p.id !== photoId));
            }
            else {
                throw new Error('Failed to move photo to trash');
            }
        }
        catch (err) {
            console.error('Error moving photo to trash:', err);
            setError('Failed to move photo to trash. Please try again.');
        }
    };

    const handleTrashSinglePhoto = async (photoId, event) => {
        event.stopPropagation(); // Prevent card selection/other actions
        if (!user?.id || !photoId) return;

        const confirmTrash = window.confirm("Are you sure you want to move this photo to the trash?");
        if (!confirmTrash) return;

        try {
            console.log(`[PhotoManager] Trashing single photo: ${photoId} for user: ${user.id}`);
            const result = await movePhotosToTrash(user.id, [photoId]);
            
            if (result.success) {
                console.log(`[PhotoManager] Successfully trashed photo: ${photoId}`);
                // Optimistic UI update + refetch counts
                setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
                fetchPhotosAndCounts(false); // Refetch quietly
            } else {
                setError(`Failed to move photo to trash: ${result.error}`);
                console.error(`[PhotoManager] Error trashing photo ${photoId}:`, result.error);
            }
        } catch (err) {
            console.error(`[PhotoManager] Exception trashing photo ${photoId}:`, err);
            setError('Failed to move photo to trash. Please try again later.');
        }
    };

    const handleShare = async (photoId) => {
        if (!photoId) return;
        
        try {
            // Find the photo in our current photos array
            const photo = photos.find(p => p.id === photoId);
            if (!photo || !photo.url) {
                console.error('[PhotoManager] Cannot share photo: No URL found');
                return;
            }
            
            console.log('[PhotoManager] Sharing photo:', photo.url);
            
            // Use the Web Share API if available (modern browsers/mobile)
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
                    // Fallback to download if sharing fails
                    downloadPhoto(photo);
                }
            } else {
                // Fallback for browsers without Web Share API
                downloadPhoto(photo);
            }
        } catch (err) {
            console.error('[PhotoManager] Error sharing photo:', err);
        }
    };
    
    const downloadPhoto = (photo) => {
        // Create a temporary anchor element for downloading
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = `photo-${photo.id}.jpg`;
        
        // iOS Safari specific handling (open in new tab)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            window.open(photo.url, '_blank');
        } else {
            // Standard download approach for other browsers
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Pagination logic (using photos directly)
    const totalPages = Math.ceil(photos.length / photosPerPage);
    const currentPhotos = useMemo(() => {
        const indexOfLastPhoto = currentPage * photosPerPage;
        const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
        return photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
    }, [photos, currentPage, photosPerPage]);

    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(RefreshCw, { className: "w-8 h-8 text-apple-gray-400 animate-spin" }) }));
    }
    return (_jsxs("div", { children: [error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2" }), error] })), mode === 'upload' && (_jsx(PhotoUploader, { eventId: eventId, onUploadComplete: handlePhotoUpload, onError: (error) => setError(error) })), _jsxs("div", { className: "photo-manager-header mb-4 p-4 bg-gray-50 rounded-lg border", children: [
        _jsxs("h3", { className: "text-lg font-semibold mb-2", children: [mode === 'upload' ? "My Uploads" : "Matched Photos"]}),
        _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: [
            mode === 'upload' && _jsxs("span", { className: "flex items-center", children: [
                _jsx(Upload, { size: 16, className:"mr-1"}), 
                `Uploaded: ${uploadedCount}`
            ]}),
            mode === 'matches' && _jsxs("span", { className: "flex items-center", children: [
                _jsx(ImageIcon, { size: 16, className:"mr-1"}), 
                `Matched: ${matchedCount}`
            ]})
        ]})
    ]}), _jsx("hr", { className: "mb-6"}), _jsx(motion.div, { 
        initial: { opacity: 0, y: 20 }, 
        animate: { opacity: 1, y: 0 }, 
        children: currentPhotos.length > 0 ? (
            _jsxs("div", { children: [
                _jsx(PhotoGrid, { 
                    photos: currentPhotos, 
                    onDelete: mode === 'upload' ? handlePhotoDelete : undefined,
                    onTrash: handleTrashSinglePhoto,
                    onShare: handleShare 
                }),
                // Pagination controls (use photos.length for total count)
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
            _jsx("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: _jsx("p", { className: "text-apple-gray-500", children: mode === 'upload'
                                ? "No photos uploaded yet"
                                : "No photos found with your face" }) })) })] }));
};
