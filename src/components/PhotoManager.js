import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Filter, ChevronDown, Calendar, MapPin, Tag, Clock, Search, Wrench, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
export const PhotoManager = ({ eventId, mode = 'upload' }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [repairStatus, setRepairStatus] = useState(null);
    const [repairLoading, setRepairLoading] = useState(false);
    const [resetId, setResetId] = useState(null);
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

    // Check if user is admin
    useEffect(() => {
        if (!user) return;
        
        const checkAdminStatus = async () => {
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                    
                if (!profileError && profile && profile.role === 'admin') {
                    setIsAdmin(true);
                }
            } catch (err) {
                console.error('Error checking admin status:', err);
            }
        };
        
        checkAdminStatus();
    }, [user]);
    
    // Set up polling for reset status updates
    useEffect(() => {
        let interval = null;
        
        if (resetId && repairStatus?.status === 'running') {
            // Start polling
            interval = setInterval(() => {
                checkResetStatus(resetId);
            }, 5000); // Poll every 5 seconds
        }
        
        return () => {
            // Clean up on unmount
            if (interval) clearInterval(interval);
        };
    }, [resetId, repairStatus?.status]);
    
    // Function to check the status of a face collection reset
    const checkResetStatus = async (id) => {
        try {
            const { data, error: statusError } = await supabase.rpc('get_face_collection_reset_status', {
                p_reset_id: id
            });
            
            if (statusError) {
                throw new Error(`Error checking reset status: ${statusError.message}`);
            }
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            // Update the UI with the current status
            setRepairStatus({
                status: getStatusType(data.status),
                message: data.message
            });
            
            // If status is completed or failed, stop polling
            if (data.status === 'completed' || data.status === 'failed') {
                setRepairLoading(false);
            }
        } catch (err) {
            console.error('Error checking reset status:', err);
            // Don't set error state here to avoid interrupting the process
        }
    };
    
    // Helper to convert database status to UI status
    const getStatusType = (dbStatus) => {
        switch (dbStatus) {
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            case 'requested':
            case 'processing':
            default:
                return 'running';
        }
    };
    
    // Function to repair the face collection
    const handleRepairFaceCollection = async () => {
        try {
            if (!isAdmin) {
                setError('Admin privileges required to repair face collection');
                return;
            }
            
            setRepairLoading(true);
            setRepairStatus({
                status: 'running',
                message: 'Initiating face collection repair...'
            });
            
            // Call the PostgreSQL function via RPC
            const { data, error: rpcError } = await supabase.rpc('reset_face_collection');
            
            if (rpcError) {
                throw new Error(`Error: ${rpcError.message}`);
            }
            
            if (data && data.success) {
                setResetId(data.reset_id);
                setRepairStatus({
                    status: 'running',
                    message: data.message || 'Face collection reset initiated. Waiting for update...'
                });
                
                // Check status immediately
                if (data.reset_id) {
                    setTimeout(() => {
                        checkResetStatus(data.reset_id);
                    }, 2000);
                }
            } else {
                setRepairStatus({
                    status: 'error',
                    message: (data && data.message) || 'Failed to initiate face collection repair'
                });
                setRepairLoading(false);
            }
        } catch (err) {
            console.error('Error repairing face collection:', err);
            setError('Error repairing face collection: ' + err.message);
            setRepairStatus({
                status: 'error',
                message: 'Failed to repair face collection: ' + err.message
            });
            setRepairLoading(false);
        }
    };

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
    
    // Check for status of recent resets on component mount for admins
    useEffect(() => {
        if (isAdmin) {
            // Check for recent reset requests
            const checkRecentResets = async () => {
                try {
                    const { data, error } = await supabase
                        .from('face_collection_reset_status')
                        .select('*')
                        .limit(1)
                        .order('created_at', { ascending: false });
                        
                    if (error) throw error;
                    
                    if (data && data.length > 0) {
                        const latestReset = data[0];
                        
                        // If there's a recent reset that's still in progress, show its status
                        if (latestReset.status === 'requested' || latestReset.status === 'processing') {
                            setResetId(latestReset.id);
                            setRepairStatus({
                                status: 'running',
                                message: latestReset.message || 'Face collection reset in progress...'
                            });
                            setRepairLoading(true);
                        }
                    }
                } catch (err) {
                    console.error('Error checking recent resets:', err);
                }
            };
            
            checkRecentResets();
        }
    }, [isAdmin]);

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
                console.log(`Looking for photos matching user ID: ${user.id}`);
                const jsonPayload = JSON.stringify([{ userId: user.id }]);
                console.log('Using filter payload:', jsonPayload);
                query = query.filter('matched_users', 'cs', jsonPayload);
            }
            query = query.order('created_at', { ascending: false });
            const { data: fetchedPhotos, error } = await query;
            if (error)
                throw error;
            console.log(`Fetched ${fetchedPhotos?.length || 0} photos`);
            if (fetchedPhotos && fetchedPhotos.length > 0) {
                console.log('First photo structure:', fetchedPhotos[0]);
            }
            const transformedPhotos = (fetchedPhotos || []).map(photo => {
                return {
                    id: photo.id,
                    url: photo.url || photo.public_url,
                    eventId: photo.event_id || photo.eventId,
                    uploadedBy: photo.uploaded_by || photo.uploadedBy,
                    created_at: photo.created_at || photo.createdAt || new Date().toISOString(),
                    updated_at: photo.updated_at || photo.updatedAt,
                    folderPath: photo.folder_path || photo.folderPath,
                    folderName: photo.folder_name || photo.folderName,
                    fileSize: photo.file_size || photo.fileSize,
                    fileType: photo.file_type || photo.fileType,
                    faces: photo.faces || [],
                    title: photo.title,
                    description: photo.description,
                    location: photo.location,
                    venue: photo.venue,
                    tags: photo.tags,
                    date_taken: photo.date_taken || photo.dateTaken,
                    event_details: photo.event_details || photo.eventDetails,
                    matched_users: photo.matched_users || photo.matchedUsers
                };
            });
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
    return (_jsxs("div", { children: [
        error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2" }), error] })), 
        
        // Show success message when repair is successful
        repairStatus?.status === 'success' && (
            _jsxs("div", { 
                className: "mb-6 p-4 bg-green-50 text-green-600 rounded-apple flex items-center", 
                children: [
                    _jsx(Check, { className: "w-5 h-5 mr-2" }), 
                    repairStatus.message
                ]
            })
        ),
        
        // Admin tools section for Face Collection Repair
        isAdmin && (
            _jsxs("div", { 
                className: "mb-6 p-4 bg-apple-blue-50 rounded-apple border border-apple-blue-200", 
                children: [
                    _jsxs("div", { 
                        className: "flex items-center justify-between", 
                        children: [
                            _jsxs("div", { 
                                children: [
                                    _jsxs("h3", { 
                                        className: "font-medium text-apple-blue-700 flex items-center",
                                        children: [
                                            _jsx(Wrench, { className: "w-5 h-5 mr-2" }),
                                            "Admin Tools"
                                        ]
                                    }),
                                    _jsx("p", { 
                                        className: "text-sm text-apple-blue-600 mt-1",
                                        children: "Fix issues with the facial recognition system"
                                    })
                                ]
                            }),
                            _jsx("button", {
                                onClick: handleRepairFaceCollection,
                                disabled: repairLoading,
                                className: "ios-button-primary text-sm py-2 px-4 bg-apple-blue-600 hover:bg-apple-blue-700",
                                children: repairLoading ? (
                                    _jsxs(_Fragment, {
                                        children: [
                                            _jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }),
                                            "Repairing..."
                                        ]
                                    })
                                ) : (
                                    _jsxs(_Fragment, {
                                        children: [
                                            _jsx(Wrench, { className: "w-4 h-4 mr-2" }),
                                            "Repair Face Collection"
                                        ]
                                    })
                                )
                            })
                        ]
                    }),
                    
                    // Show status message during repair
                    repairStatus && repairStatus.status === 'running' && (
                        _jsxs("div", {
                            className: "mt-4 p-3 rounded-apple bg-blue-100 text-blue-700 text-sm",
                            children: [
                                _jsx(RefreshCw, { className: "w-4 h-4 mr-2 inline-block animate-spin" }),
                                _jsx("span", { children: repairStatus.message })
                            ]
                        })
                    ),
                    
                    // Show error message if repair failed
                    repairStatus && repairStatus.status === 'error' && (
                        _jsxs("div", {
                            className: "mt-4 p-3 rounded-apple bg-red-100 text-red-700 text-sm",
                            children: [
                                _jsx(AlertTriangle, { className: "w-4 h-4 mr-2 inline-block" }),
                                _jsx("span", { children: repairStatus.message })
                            ]
                        })
                    )
                ]
            })
        ),
        
        mode === 'upload' && (_jsx(PhotoUploader, { eventId: eventId, onUploadComplete: handlePhotoUpload, onError: (error) => setError(error) })),
        
        _jsxs("div", { className: "mt-8 mb-6", children: [
            _jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                _jsxs("div", { className: "relative flex-1 max-w-lg", children: [
                    _jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400 w-5 h-5" }), 
                    _jsx("input", { type: "text", placeholder: "Search photos...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 ios-input" })
                ] }), 
                _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: cn("ios-button-secondary ml-4 flex items-center", showFilters && "bg-apple-blue-500 text-white hover:bg-apple-blue-600"), children: [
                    _jsx(Filter, { className: "w-4 h-4 mr-2" }), 
                    "Filters", 
                    _jsx(ChevronDown, { className: cn("w-4 h-4 ml-2 transition-transform duration-200", showFilters && "transform rotate-180") })
                ] })
            ] }), 
            _jsx(AnimatePresence, { children: showFilters && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, className: "overflow-hidden", children: _jsxs("div", { className: "p-4 bg-white rounded-apple-xl border border-apple-gray-200 mb-6", children: [
                _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Date Range"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "date", value: filters.dateRange.start, onChange: (e) => setFilters({
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
                                                                }), className: "ios-input" })] })] })] }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx("button", { onClick: clearFilters, className: "ios-button-secondary", children: "Clear Filters" }) })] }) })) })
        ] }),
        
        _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, children: photos.length > 0 ? (_jsx(PhotoGrid, { photos: photos, onDelete: mode === 'upload' ? handlePhotoDelete : undefined, onShare: handleShare })) : (_jsx("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: _jsx("p", { className: "text-apple-gray-500", children: mode === 'upload' ? "No photos uploaded yet" : "No photos found with your face" }) })) })
    ] }));
};
