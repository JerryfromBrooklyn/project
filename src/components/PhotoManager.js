import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Filter, ChevronDown, Calendar, MapPin, Tag, Clock, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { awsPhotoService } from '../services/awsPhotoService';
export const PhotoManager = ({ eventId, mode = 'upload' }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        dateRange: {
            start: '',
            end: ''
        },
        location: {
            lat: 0,
            lng: 0,
            name: ''
        },
        tags: [],
        timeRange: {
            start: '',
            end: ''
        }
    });
    const { user } = useAuth();
    useEffect(() => {
        if (!user)
            return;
        console.log('🔄 [PhotoManager] Setting up AWS photo polling...');
        // Fetch photos immediately on mount
        fetchPhotos();
        // Set up polling for AWS DynamoDB/S3 data
        const pollingInterval = setInterval(() => {
            fetchPhotos();
        }, 30000); // Poll every 30 seconds
        return () => {
            console.log('🔄 [PhotoManager] Cleaning up AWS photo polling');
            clearInterval(pollingInterval);
        };
    }, [user?.id]); // Only depend on user ID, not the entire user object or mode
    const fetchPhotos = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!user)
                return;
            console.log('📥 [PhotoManager] Fetching photos from AWS DynamoDB...');
            // Get photos from DynamoDB via awsPhotoService
            const fetchedPhotos = await awsPhotoService.fetchPhotos(user.id);
            // Apply filters if needed
            let filteredPhotos = [...fetchedPhotos];
            // Apply date range filter
            if (filters.dateRange.start) {
                filteredPhotos = filteredPhotos.filter(photo => photo.date_taken && new Date(photo.date_taken) >= new Date(filters.dateRange.start));
            }
            if (filters.dateRange.end) {
                filteredPhotos = filteredPhotos.filter(photo => photo.date_taken && new Date(photo.date_taken) <= new Date(filters.dateRange.end));
            }
            // Apply location filter
            if (filters.location.name) {
                filteredPhotos = filteredPhotos.filter(photo => photo.location?.name?.toLowerCase().includes(filters.location.name.toLowerCase()));
            }
            // Apply tags filter
            if (filters.tags.length > 0) {
                filteredPhotos = filteredPhotos.filter(photo => {
                    if (!photo.tags || !Array.isArray(photo.tags))
                        return false;
                    return filters.tags.every(tag => photo.tags.includes(tag));
                });
            }
            // Apply search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredPhotos = filteredPhotos.filter(photo => {
                    const searchableFields = [
                        photo.title,
                        photo.description,
                        photo.location?.name,
                        photo.venue?.name,
                        ...(photo.tags || [])
                    ].filter(Boolean);
                    return searchableFields.some(field => field && field.toLowerCase().includes(query));
                });
            }
            setPhotos(filteredPhotos);
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
    const clearFilters = () => {
        setFilters({
            dateRange: {
                start: '',
                end: ''
            },
            location: {
                lat: 0,
                lng: 0,
                name: ''
            },
            tags: [],
            timeRange: {
                start: '',
                end: ''
            }
        });
        setSearchQuery('');
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(RefreshCw, { className: "w-8 h-8 text-apple-gray-400 animate-spin" }) }));
    }
    return (_jsxs("div", { children: [error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2" }), error] })), mode === 'upload' && (_jsx(PhotoUploader, { eventId: eventId, onUploadComplete: handlePhotoUpload, onError: (error) => setError(error) })), _jsxs("div", { className: "mt-8 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "relative flex-1 max-w-lg", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search photos...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 ios-input", "aria-label": "Search photos", title: "Search photos by title, description, location or tags" })] }), _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: cn("ios-button-secondary ml-4 flex items-center", showFilters && "bg-apple-blue-500 text-white hover:bg-apple-blue-600"), children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Filters", _jsx(ChevronDown, { className: cn("w-4 h-4 ml-2 transition-transform duration-200", showFilters && "transform rotate-180") })] })] }), _jsx(AnimatePresence, { children: showFilters && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, className: "overflow-hidden", children: _jsxs("div", { className: "p-4 bg-white rounded-apple-xl border border-apple-gray-200 mb-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Date Range"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "date", value: filters.dateRange.start, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    dateRange: { ...filters.dateRange, start: e.target.value }
                                                                }), className: "ios-input", "aria-label": "Start date", title: "Filter start date" }), _jsx("input", { type: "date", value: filters.dateRange.end, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    dateRange: { ...filters.dateRange, end: e.target.value }
                                                                }), className: "ios-input", "aria-label": "End date", title: "Filter end date" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(MapPin, { className: "w-4 h-4 mr-2" }), "Location"] }), _jsx(GoogleMaps, { location: filters.location, onLocationChange: (location) => setFilters({
                                                            ...filters,
                                                            location
                                                        }), height: "200px", className: "rounded-apple overflow-hidden" })] }), _jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Tag, { className: "w-4 h-4 mr-2" }), "Tags"] }), _jsx("input", { type: "text", placeholder: "Add tags...", onKeyDown: (e) => {
                                                            if (e.key === 'Enter' && e.currentTarget.value) {
                                                                setFilters({
                                                                    ...filters,
                                                                    tags: [...filters.tags, e.currentTarget.value]
                                                                });
                                                                e.currentTarget.value = '';
                                                            }
                                                        }, className: "ios-input", "aria-label": "Add tags", title: "Type a tag and press Enter to add it" }), filters.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: filters.tags.map((tag, index) => (_jsxs("span", { className: "bg-apple-blue-100 text-apple-blue-700 px-2 py-1 rounded-full text-sm flex items-center", children: [tag, _jsx("button", { onClick: () => setFilters({
                                                                        ...filters,
                                                                        tags: filters.tags.filter((_, i) => i !== index)
                                                                    }), className: "ml-1 hover:text-apple-blue-900", children: "\u00D7" })] }, index))) }))] }), _jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), "Time Range"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "time", value: filters.timeRange.start, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    timeRange: { ...filters.timeRange, start: e.target.value }
                                                                }), className: "ios-input", "aria-label": "Start time", title: "Filter start time" }), _jsx("input", { type: "time", value: filters.timeRange.end, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    timeRange: { ...filters.timeRange, end: e.target.value }
                                                                }), className: "ios-input", "aria-label": "End time", title: "Filter end time" })] })] })] }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx("button", { onClick: clearFilters, className: "ios-button-secondary", children: "Clear Filters" }) })] }) })) })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, children: photos.length > 0 ? (_jsx(PhotoGrid, { photos: photos, onDelete: mode === 'upload' ? handlePhotoDelete : undefined, onShare: handleShare })) : (_jsx("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: _jsx("p", { className: "text-apple-gray-500", children: mode === 'upload'
                            ? "No photos uploaded yet"
                            : "No photos found with your face" }) })) })] }));
};
