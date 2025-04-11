import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Image, Upload } from 'lucide-react';
import { cn } from '../utils/cn';
import { awsPhotoService } from '../services/awsPhotoService';

export const PhotoManager = ({ eventId, mode = 'upload' }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 48; // 12 rows of 4 images
    
    const { user } = useAuth();
    
    useEffect(() => {
        if (!user)
            return;
        console.log(`🔄 [PhotoManager ${mode}] Setting up AWS photo polling...`);
        
        let initialFetchTimeoutId = null;

        // Fetch photos immediately on mount for all modes
        fetchPhotos(); // Fetch immediately for all modes
        
        // Set up polling 
        const pollingInterval = setInterval(() => {
            console.log(`   Polling interval triggered for mode: ${mode}`);
            fetchPhotos();
        }, 30000); // Poll every 30 seconds
        
        return () => {
            console.log(`🔄 [PhotoManager ${mode}] Cleaning up AWS photo polling`);
            if (initialFetchTimeoutId) {
                clearTimeout(initialFetchTimeoutId);
            }
            clearInterval(pollingInterval);
        };
    // Depend on user.id AND mode, so fetch runs when mode changes
    }, [user?.id, mode]);
    
    const fetchPhotos = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!user)
                return;
            let fetchedPhotos = [];
            if (mode === 'matches') {
                console.log(`📥 [PhotoManager ${mode}] Fetching MATCHED photos from AWS DynamoDB...`);
                fetchedPhotos = await awsPhotoService.fetchPhotos(user.id);
            } else {
                console.log(`📥 [PhotoManager ${mode}] Fetching UPLOADED photos from AWS DynamoDB...`);
                fetchedPhotos = await awsPhotoService.fetchUploadedPhotos(user.id);
            }
            
            setPhotos(fetchedPhotos);
        }
        catch (err) {
            console.error('Error fetching photos:', err);
            setError('Failed to load photos. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    
    const handlePhotoUpload = async (photoId) => {
        await fetchPhotos();
    };
    
    const handlePhotoDelete = async (photoId) => {
        try {
            // Use AWS S3/DynamoDB to delete the photo
            const success = await awsPhotoService.deletePhoto(photoId);
            if (success) {
                setPhotos(photos.filter(p => p.id !== photoId));
            }
            else {
                throw new Error('Failed to delete photo');
            }
        }
        catch (err) {
            console.error('Error deleting photo:', err);
            setError('Failed to delete photo. Please try again.');
        }
    };
    
    const handleShare = async (photoId) => {
        console.log('Share photo:', photoId);
    };
    
    // Render photo counter banner in Apple style
    const renderPhotoCounter = () => {
        return (
            <div className="bg-white rounded-apple-xl shadow-sm border border-apple-gray-100 py-4 px-6 mb-6">
                <div className="flex items-center">
                    {mode === 'matches' ? (
                        <>
                            <div className="w-10 h-10 rounded-full bg-apple-blue-100 flex items-center justify-center mr-4">
                                <Image className="w-5 h-5 text-apple-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-apple-gray-900">My Photos</h2>
                                <p className="text-sm text-apple-gray-500">
                                    You've matched with <span className="font-medium text-apple-blue-600">{photos.length}</span> {photos.length === 1 ? 'photo' : 'photos'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-apple-green-100 flex items-center justify-center mr-4">
                                <Upload className="w-5 h-5 text-apple-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-apple-gray-900">Uploaded Photos</h2>
                                <p className="text-sm text-apple-gray-500">
                                    You've uploaded <span className="font-medium text-apple-green-600">{photos.length}</span> {photos.length === 1 ? 'photo' : 'photos'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };
    
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(RefreshCw, { className: "w-8 h-8 text-apple-gray-400 animate-spin" }) }));
    }
    
    return (
        <div>
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}
            
            {mode === 'upload' && (
                <PhotoUploader 
                    eventId={eventId} 
                    onUploadComplete={handlePhotoUpload} 
                    onError={(error) => setError(error)} 
                />
            )}
            
            {/* Photo counter */}
            {renderPhotoCounter()}
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
            >
                {photos.length > 0 ? (
                    <div>
                        <PhotoGrid
                            photos={photos.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage)}
                            onDelete={mode === 'upload' ? handlePhotoDelete : undefined}
                            onShare={handleShare}
                        />
                        
                        {/* Pagination controls */}
                        {photos.length > photosPerPage && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 mr-2 rounded-apple border border-apple-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    
                                    <div className="flex space-x-1">
                                        {[...Array(Math.ceil(photos.length / photosPerPage))].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn(
                                                    "px-3 py-1 rounded-apple text-sm font-medium",
                                                    currentPage === i + 1
                                                        ? "bg-apple-blue-500 text-white"
                                                        : "bg-apple-gray-100 text-apple-gray-700 hover:bg-apple-gray-200"
                                                )}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(photos.length / photosPerPage)))}
                                        disabled={currentPage === Math.ceil(photos.length / photosPerPage)}
                                        className="p-2 ml-2 rounded-apple border border-apple-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200">
                        <p className="text-apple-gray-500">
                            {mode === 'upload'
                                ? "No photos uploaded yet"
                                : "No photos found with your face"}
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
