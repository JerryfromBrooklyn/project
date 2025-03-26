import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Filter, ChevronDown, Calendar, MapPin, Tag, Clock, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
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
        console.log('Setting up realtime subscription for photo matches...');
        const subscription = supabase
            .channel('photo-matches')
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'photos',
            filter: mode === 'matches' ?
                `matched_users::jsonb @> '[{"userId": "${user.id}"}]'` :
                `uploaded_by=eq.${user.id}`
        }, (payload) => {
            console.log('Received realtime update:', payload);
            fetchPhotos();
        })
            .subscribe();
        return () => {
            console.log('Cleaning up realtime subscription');
            subscription.unsubscribe();
        };
    }, [user, mode]);
    const fetchPhotos = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!user)
                return;
            console.log('Fetching photos...');
            let query = supabase
                .from('photos')
                .select('*');
            if (filters.dateRange.start) {
                query = query.gte('date_taken', filters.dateRange.start);
            }
            if (filters.dateRange.end) {
                query = query.lte('date_taken', filters.dateRange.end);
            }
            if (filters.location.name) {
                query = query.textSearch('location->>name', filters.location.name);
            }
            if (filters.tags.length > 0) {
                query = query.contains('tags', filters.tags);
            }
            if (searchQuery) {
                query = query.textSearch('search_vector', searchQuery);
            }
            if (mode === 'upload') {
                console.log('Fetching uploaded photos');
                query = query.eq('uploaded_by', user.id);
            }
            else {
                console.log('Fetching matched photos');
                query = query.filter('matched_users', 'cs', `[{"userId": "${user.id}"}]`);
            }
            query = query.order('created_at', { ascending: false });
            const { data: fetchedPhotos, error } = await query;
            if (error)
                throw error;
            console.log(`Fetched ${fetchedPhotos?.length || 0} photos`);
            const transformedPhotos = (fetchedPhotos || []).map(photo => ({
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
            setPhotos(transformedPhotos);
        }
        catch (err) {
            console.error('Error fetching photos:', err);
            setError('Failed to load photos. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (user) {
            fetchPhotos();
        }
    }, [user, eventId, mode, filters, searchQuery]);
    const handlePhotoUpload = async (photoId) => {
        await fetchPhotos();
    };
    const handlePhotoDelete = async (photoId) => {
        try {
            await PhotoService.deletePhoto(photoId);
            setPhotos(photos.filter(p => p.id !== photoId));
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
    return (_jsxs("div", { children: [error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2" }), error] })), mode === 'upload' && (_jsx(PhotoUploader, { eventId: eventId, onUploadComplete: handlePhotoUpload, onError: (error) => setError(error) })), _jsxs("div", { className: "mt-8 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "relative flex-1 max-w-lg", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search photos...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 ios-input" })] }), _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: cn("ios-button-secondary ml-4 flex items-center", showFilters && "bg-apple-blue-500 text-white hover:bg-apple-blue-600"), children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Filters", _jsx(ChevronDown, { className: cn("w-4 h-4 ml-2 transition-transform duration-200", showFilters && "transform rotate-180") })] })] }), _jsx(AnimatePresence, { children: showFilters && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, className: "overflow-hidden", children: _jsxs("div", { className: "p-4 bg-white rounded-apple-xl border border-apple-gray-200 mb-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Date Range"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "date", value: filters.dateRange.start, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    dateRange: { ...filters.dateRange, start: e.target.value }
                                                                }), className: "ios-input" }), _jsx("input", { type: "date", value: filters.dateRange.end, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    dateRange: { ...filters.dateRange, end: e.target.value }
                                                                }), className: "ios-input" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(MapPin, { className: "w-4 h-4 mr-2" }), "Location"] }), _jsx(GoogleMaps, { location: filters.location, onLocationChange: (location) => setFilters({
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
                                                        }, className: "ios-input" }), filters.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: filters.tags.map((tag, index) => (_jsxs("span", { className: "bg-apple-blue-100 text-apple-blue-700 px-2 py-1 rounded-full text-sm flex items-center", children: [tag, _jsx("button", { onClick: () => setFilters({
                                                                        ...filters,
                                                                        tags: filters.tags.filter((_, i) => i !== index)
                                                                    }), className: "ml-1 hover:text-apple-blue-900", children: "\u00D7" })] }, index))) }))] }), _jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), "Time Range"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "time", value: filters.timeRange.start, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    timeRange: { ...filters.timeRange, start: e.target.value }
                                                                }), className: "ios-input" }), _jsx("input", { type: "time", value: filters.timeRange.end, onChange: (e) => setFilters({
                                                                    ...filters,
                                                                    timeRange: { ...filters.timeRange, end: e.target.value }
                                                                }), className: "ios-input" })] })] })] }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx("button", { onClick: clearFilters, className: "ios-button-secondary", children: "Clear Filters" }) })] }) })) })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, children: photos.length > 0 ? (_jsx(PhotoGrid, { photos: photos, onDelete: mode === 'upload' ? handlePhotoDelete : undefined, onShare: handleShare })) : (_jsx("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: _jsx("p", { className: "text-apple-gray-500", children: mode === 'upload'
                            ? "No photos uploaded yet"
                            : "No photos found with your face" }) })) })] }));
};
