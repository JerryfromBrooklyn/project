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
import { PhotoEventBus } from '../utils/event-bus';

export const PhotoManager = ({ eventId, mode = 'upload', nativeShare = false }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [matchedCount, setMatchedCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMessage, setLoadingMessage] = useState('Loading photos...');
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const photosPerPage = 48; // 12 rows of 4 images
    const { user } = useAuth();

    const fetchPhotos = useCallback(async (forceRefresh = false) => {
        if (!user?.id) return;
    
        // If this is a force refresh, show loading state
        if (forceRefresh) {
            setLoading(true);
            setLoadingMessage('Refreshing photos...');
            setLoadingTimeout(false);
            console.log('[PhotoManager upload] Force refresh requested');
            
            // If this is a matched photos view, invalidate the cache
            if (mode === 'matches' && awsPhotoService.matchedPhotosCache) {
                const cacheKey = `matched_photos_${user.id}`;
                if (awsPhotoService.matchedPhotosCache.has(cacheKey)) {
                    console.log('[PhotoManager] Invalidating matched photos cache');
                    awsPhotoService.matchedPhotosCache.delete(cacheKey);
                }
            }
        }
        
        // Set up a loading timeout to handle prolonged requests
        const timeoutId = setTimeout(() => {
            if (loading) {
                setLoadingTimeout(true);
                setLoadingMessage(mode === 'matches' 
                    ? 'Still searching for all your matched photos. This might take a moment...' 
                    : 'Still loading your photos. This might take a moment...');
            }
        }, 5000); // Show enhanced message after 5 seconds
        
        try {
            console.log(`[PhotoManager ${mode}] Fetching photos for mode: ${mode}`);
            
            if (mode === 'upload') {
                setLoadingMessage('Loading your uploaded photos...');
                console.log('📥 [PhotoManager upload] Fetching UPLOADED photos...');
                const uploadedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'uploaded');
                console.log(`[PhotoManager upload] Successfully fetched ${uploadedPhotos.length} photos for current view.`);
                setPhotos(uploadedPhotos);
            } else if (mode === 'matches') {
                setLoadingMessage('Searching for photos with your face in them...');
                console.log('📥 [PhotoManager matches] Fetching MATCHED photos...');
                const matchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');
                console.log(`[PhotoManager matches] Successfully fetched ${matchedPhotos.length} photos for current view.`);
                setPhotos(matchedPhotos);
            }
            
            // Always fetch counts for both tabs
            console.log('[PhotoManager upload] Fetching counts...');
            
            // Optimize count fetching to avoid redundant calls
            const [uploadedPhotos, matchedPhotos] = await Promise.all([
                mode === 'upload' ? Promise.resolve(photos) : awsPhotoService.getVisiblePhotos(user.id, 'uploaded'),
                mode === 'matches' ? Promise.resolve(photos) : awsPhotoService.getVisiblePhotos(user.id, 'matched')
            ]);
            
            setUploadedCount(uploadedPhotos.length);
            setMatchedCount(matchedPhotos.length);
            console.log(`[PhotoManager ${mode}] Counts updated: Uploaded=${uploadedPhotos.length}, Matched=${matchedPhotos.length}`);
            
            setLoading(false);
            setLoadingTimeout(false);
            setError(null);
        } catch (err) {
            console.error(`[PhotoManager ${mode}] Error fetching photos:`, err);
            setError(`Failed to fetch photos: ${err.message}`);
            setLoading(false);
            setLoadingTimeout(false);
        } finally {
            // Clear timeout in all cases
            clearTimeout(timeoutId);
        }
    }, [user?.id, mode, photos]);

    const handlePhotoUpload = useCallback((forceRefresh = false) => {
        console.log(`[PhotoManager] Photo upload complete${forceRefresh ? ' (force refresh requested)' : ''}`);
        // Make sure to pass the force refresh flag to fetchPhotos
        fetchPhotos(forceRefresh);
    }, [fetchPhotos]);

    // Listen for face registration completion event
    useEffect(() => {
        if (!user?.id) return;
        
        console.log('[PhotoManager] Setting up face registration event listener');
        
        const handleFaceRegistration = (data) => {
            console.log('[PhotoManager] Face registration event received:', data);
            // Force refresh photos when face registration is complete
            fetchPhotos(true);
        };
        
        // Subscribe to the face registration event and store the unsubscribe function
        const unsubscribe = PhotoEventBus.on('face-registration-complete', handleFaceRegistration);
        
        // Cleanup subscription on unmount using the returned unsubscribe function
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            } else {
                // Fallback if the unsubscribe function isn't working
                PhotoEventBus.off('face-registration-complete', handleFaceRegistration);
            }
        };
    }, [user?.id, fetchPhotos]);

    useEffect(() => {
        if (!user?.id) return;
        console.log(`🔄 [PhotoManager ${mode}] Effect triggered: mode or user changed.`);
        fetchPhotos();
    }, [fetchPhotos]);

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

    const handleTrashSinglePhoto = async (photoId, e) => {
        if (e) e.stopPropagation();
        if (!user?.id || !photoId) return;
        
        try {
            console.log(`[PhotoManager] Moving photo ${photoId} to trash for user ${user.id}`);
            const result = await movePhotosToTrash(user.id, [photoId]);
            
            if (result.success) {
                // Remove the photo from the current view
                setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
                console.log(`[PhotoManager] Successfully moved photo ${photoId} to trash`);
            } else {
                setError(`Failed to move photo to trash: ${result.error || 'Unknown error'}`);
                console.error(`[PhotoManager] Error moving photo ${photoId} to trash:`, result.error);
            }
        } catch (err) {
            console.error(`[PhotoManager] Exception moving photo ${photoId} to trash:`, err);
            setError('Failed to move photo to trash. Please try again.');
        }
    };

    const handleShare = async (photoId, e) => {
        if (e) e.stopPropagation();
        if (!nativeShare) return; // Only try to share if nativeShare is true
    
        const photo = photos.find(p => p.id === photoId);
        if (!photo || !photo.url) {
            console.error('[PhotoManager] Cannot share photo - no URL found');
            return;
        }
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: photo.title || 'Shared Photo',
                    text: photo.description || 'Check out this photo',
                    url: photo.url
                });
                console.log('[PhotoManager] Photo shared successfully');
            } else {
                console.warn('[PhotoManager] Web Share API not supported');
                // Fallback: copy URL to clipboard
                await navigator.clipboard.writeText(photo.url);
                // Add some visual feedback
                alert('Photo URL copied to clipboard');
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

    // Pagination logic
    const totalPages = Math.ceil(photos.length / photosPerPage);
    
    const currentPhotos = useMemo(() => {
        const startIndex = (currentPage - 1) * photosPerPage;
        return photos.slice(startIndex, startIndex + photosPerPage);
    }, [photos, currentPage, photosPerPage]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <RefreshCw className="w-8 h-8 text-apple-gray-400 animate-spin" />
                <p className="text-apple-gray-500">{loadingMessage}</p>
                {loadingTimeout && (
                    <div className="max-w-md text-center mt-2">
                        <p className="text-sm text-apple-gray-400">
                            {mode === 'matches' 
                                ? "This might take a moment as we're processing all photos to find your matches."
                                : "Taking longer than expected. The server might be busy."}
                        </p>
                        <button 
                            onClick={() => fetchPhotos(true)}
                            className="mt-4 px-4 py-2 bg-apple-blue-500 text-white rounded-full text-sm hover:bg-apple-blue-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        );
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
                    onShare: handleShare,
                    columns: { default: 2, sm: 3, md: 4, lg: 4 }
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
