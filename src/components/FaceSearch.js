import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/FaceSearch.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { PhotoService } from '../services/PhotoService';
import { FaceIndexingService } from '../services/FaceIndexingService';
import { PhotoGrid } from './PhotoGrid';
import { supabase } from '../lib/supabaseClient';
export const FaceSearch = () => {
    const [searchImage, setSearchImage] = useState(null);
    const [searchResults, setSearchResults] = useState({
        photos: [],
        loading: false,
        error: null
    });
    const onDrop = useCallback(async (acceptedFiles) => {
        console.log('Files dropped:', acceptedFiles);
        if (acceptedFiles.length === 0) {
            console.log('No files accepted');
            return;
        }
        const file = acceptedFiles[0];
        console.log('Processing file:', file.name);
        setSearchImage(file);
        setSearchResults(prev => ({ ...prev, loading: true, error: null }));
        try {
            // Convert file to bytes
            const arrayBuffer = await file.arrayBuffer();
            const imageBytes = new Uint8Array(arrayBuffer);
            console.log('Searching for face matches...');
            const matches = await FaceIndexingService.searchFaces(imageBytes);
            console.log('Face matches found:', matches);
            if (matches.length === 0) {
                console.log('No matches found');
                setSearchResults({
                    photos: [],
                    loading: false,
                    error: 'No matching faces found in any photos'
                });
                return;
            }
            // Get photos for matched users
            console.log('Fetching photos for matched users...');
            const matchedUserIds = matches.map(match => match.userId);
            const { data: photos, error } = await supabase
                .from('photos')
                .select('*')
                .in('matched_users->userId', matchedUserIds);
            if (error)
                throw error;
            console.log('Found matching photos:', photos?.length || 0);
            const transformedPhotos = (photos || []).map(photo => ({
                id: photo.id,
                url: photo.public_url,
                eventId: photo.event_id,
                uploadedBy: photo.uploaded_by,
                created_at: photo.created_at,
                folderPath: photo.folder_path,
                folderName: photo.folder_name,
                fileSize: photo.file_size,
                fileType: photo.file_type,
                faces: photo.faces || [],
                title: photo.title,
                description: photo.description,
                location: photo.location,
                venue: photo.venue,
                tags: photo.tags,
                date_taken: photo.date_taken,
                event_details: photo.event_details,
                matched_users: photo.matched_users || []
            }));
            setSearchResults({
                photos: transformedPhotos,
                loading: false,
                error: null
            });
        }
        catch (error) {
            console.error('Error processing search:', error);
            setSearchResults({
                photos: [],
                loading: false,
                error: error.message || 'Failed to process search'
            });
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxFiles: 1,
        multiple: false
    });
    const handleClearResults = () => {
        console.log('Clearing search results');
        setSearchImage(null);
        setSearchResults({
            photos: [],
            loading: false,
            error: null
        });
    };
    const handleDownload = async (photoId) => {
        try {
            console.log('Downloading photo:', photoId);
            const url = await PhotoService.downloadPhoto(photoId);
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-${photoId}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error downloading photo:', error);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { ...getRootProps(), className: cn("p-8 border-2 border-dashed rounded-apple-xl text-center transition-colors duration-300", isDragActive
                    ? "border-apple-blue-500 bg-apple-blue-50"
                    : "border-apple-gray-200 bg-apple-gray-50", searchImage && "border-apple-green-500"), children: [_jsx("input", { ...getInputProps() }), searchImage ? (_jsxs("div", { className: "relative", children: [_jsx("img", { src: URL.createObjectURL(searchImage), alt: "Search", className: "max-h-64 mx-auto rounded-apple" }), _jsx("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    handleClearResults();
                                }, className: "absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors duration-300", children: _jsx(X, { className: "w-4 h-4 text-apple-gray-600" }) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center", children: _jsx(Search, { className: "w-8 h-8 text-apple-gray-500" }) }), _jsx("p", { className: "text-apple-gray-500 mb-2", children: isDragActive
                                    ? "Drop the photo here"
                                    : "Drag and drop a photo here, or click to select" }), _jsx("p", { className: "text-apple-gray-400 text-sm", children: "The photo will be used to find matches in the database" })] }))] }), _jsx(AnimatePresence, { mode: "wait", children: searchResults.loading ? (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "flex items-center justify-center py-12", children: _jsx(RefreshCw, { className: "w-8 h-8 text-apple-gray-400 animate-spin" }) })) : searchResults.error ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "bg-red-50 text-red-600 p-4 rounded-apple flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2" }), searchResults.error] })) : searchResults.photos.length > 0 ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h3", { className: "text-lg font-medium text-apple-gray-900", children: [searchResults.photos.length, " matching photos found"] }), _jsxs("button", { onClick: handleClearResults, className: "ios-button-secondary flex items-center", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Clear Results"] })] }), _jsx(PhotoGrid, { photos: searchResults.photos, onDownload: handleDownload })] })) : null })] }));
};
export default FaceSearch;
