import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Filter, ChevronDown, Calendar, MapPin, Tag, Clock, Search, Wrench, Check } from 'lucide-react';
import { supabase, supabaseAdmin, isSchemaValid, getCachedSchema, updateSchemaCache, getFaceIdFromCache, cacheFaceId } from '../supabaseClient';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { getFaceId } from '../services/FaceStorageService';
import LinkedAccountsService from '../services/LinkedAccountsService';
import FaceIndexingService from '../services/FaceIndexingService';

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
    const [currentUserFaceId, setCurrentUserFaceId] = useState(null);

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
        
        // Create a subscription for photos table
        const photosSubscription = supabase
            .channel('photo-matches')
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'photos',
            filter: mode === 'matches' ?
                `matched_users::text.ilike.%${user.id}%` :
                `uploaded_by=eq.${user.id}`
        }, (payload) => {
            console.log('Received realtime update for photos:', payload);
            fetchPhotos();
        })
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'photos',
            filter: mode === 'matches' ?
                `matched_users::text.ilike.%${user.id}%` :
                `uploaded_by=eq.${user.id}`
        }, (payload) => {
            console.log('Received realtime insert for photos:', payload);
            fetchPhotos();
        })
            .subscribe();
            
        // Create a subscription for simple_photos table
        const simplePhotosSubscription = supabase
            .channel('simple-photo-matches')
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'simple_photos',
            filter: mode === 'matches' ?
                `matched_users::text.ilike.%${user.id}%` :
                `uploaded_by=eq.${user.id}`
        }, (payload) => {
            console.log('Received realtime update for simple_photos:', payload);
            fetchPhotos();
        })
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'simple_photos',
            filter: mode === 'matches' ?
                `matched_users::text.ilike.%${user.id}%` :
                `uploaded_by=eq.${user.id}`
        }, (payload) => {
            console.log('Received realtime insert for simple_photos:', payload);
            fetchPhotos();
        })
            .subscribe();
            
        return () => {
            console.log('Cleaning up realtime subscriptions');
            photosSubscription.unsubscribe();
            simplePhotosSubscription.unsubscribe();
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
        setLoading(true);
        setError(null);
        console.log('Fetching photos...');
        console.log('[DEBUG] Current user ID:', user?.id);
        console.log('[DEBUG] Fetch mode:', mode);
        console.log('[DEBUG] Applied filters:', JSON.stringify(filters, null, 2));
        console.log('[DEBUG] Search query:', searchQuery);

        try {
            // Check database schema at the beginning
            await checkDatabaseSchema();
            
            // Add a diagnostic query to see what's in the database
            try {
                const { data: allPhotos, error: allPhotosError } = await supabase
                    .from('photos')
                    .select('*')
                    .limit(5);
                
                if (allPhotosError) {
                    console.error('[DEBUG] Error fetching diagnostic sample:', allPhotosError);
                } else if (allPhotos && allPhotos.length > 0) {
                    console.log(`[DEBUG] Found ${allPhotos.length} photos in database (diagnostics sample)`);
                    console.log('[DEBUG] First photo structure:', allPhotos[0]);
                    console.log('[DEBUG] First photo matched_users:', JSON.stringify(allPhotos[0].matched_users || []));
                    
                    // Try to analyze if any photos match the current user
                    const matchingPhotos = allPhotos.filter(photo => {
                        if (!photo.matched_users || !Array.isArray(photo.matched_users)) return false;
                        
                        return photo.matched_users.some(match => 
                            (match.userId === user.id || match.user_id === user.id)
                        );
                    });
                    
                    if (matchingPhotos.length > 0) {
                        console.log(`[DEBUG] Found ${matchingPhotos.length} photos with user ID in matched_users`);
                        console.log('[DEBUG] Example matching photo:', matchingPhotos[0]);
                    } else {
                        console.log('[DEBUG] No photos found with user ID in matched_users in diagnostic sample');
                    }
                } else {
                    console.log('[DEBUG] No photos found in database for diagnostic sample');
                }
            } catch (diagErr) {
                console.error('[DEBUG] Error running diagnostic query:', diagErr);
            }
            
            // Use the fallback method directly since RPCs are not available
            return fetchPhotosFallback(mode);
        }
        catch (err) {
            console.error('[DEBUG] Error fetching photos:', err);
            setError('Failed to load photos. Please try again.');
            setPhotos([]);
        }
        finally {
            setLoading(false);
        }
    };
    
    // Fallback method that uses direct table queries
    const fetchPhotosFallback = async (queryMode = mode) => {
        try {
            console.log('[DEBUG] Using fallback query method for mode:', queryMode);
            
            // Always use the all_photos view which combines both tables
            console.log('[DEBUG] Using all_photos view which combines both tables');
            let query = supabase
                .from('all_photos')
                .select('*');
                
            console.log(`[DEBUG] Base query being constructed for all_photos view`);
            
            // Apply filters
            if (filters.dateRange.start) {
                query = query.gte('date_taken', filters.dateRange.start);
                console.log('[DEBUG] Added date filter (start):', filters.dateRange.start);
            }
            if (filters.dateRange.end) {
                query = query.lte('date_taken', filters.dateRange.end);
                console.log('[DEBUG] Added date filter (end):', filters.dateRange.end);
            }
            if (filters.location.name) {
                query = query.textSearch('location->>name', filters.location.name);
                console.log('[DEBUG] Added location filter:', filters.location.name);
            }
            if (filters.tags.length > 0) {
                query = query.contains('tags', filters.tags);
                console.log('[DEBUG] Added tags filter:', filters.tags);
            }
            if (searchQuery) {
                query = query.textSearch('search_vector', searchQuery);
                console.log('[DEBUG] Added search query filter:', searchQuery);
            }
            
            // Initialize the queries array at the top level of the function
            const queries = [];
            
            if (queryMode === 'upload') {
                console.log('Fetching uploaded photos');
                
                // Add the all_photos view query with uploaded_by filter
                queries.push(
                    query.eq('uploaded_by', user.id)
                        .order('created_at', { ascending: false })
                );
                
                console.log('[DEBUG] Added uploaded_by filter for user ID:', user.id);
                
                // Also query both tables directly as fallback
                queries.push(
                    supabase
                        .from('simple_photos')
                        .select('*')
                        .eq('uploaded_by', user.id)
                        .order('created_at', { ascending: false })
                );
                
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .eq('uploaded_by', user.id)
                        .order('created_at', { ascending: false })
                );
            }
            else {
                console.log('Fetching matched photos');
                console.log(`Looking for photos matching user ID: ${user.id}`);
                
                // Use a simple consistent format for JSON matching
                const userId = user.id;
                
                console.log('[DEBUG] Using properly stringified JSON for queries');
                
                // Try using the suggested RPC from the error hint
                if (supabase.rpc && typeof supabase.rpc === 'function') {
                    try {
                        console.log('[DEBUG] Trying suggested RPC get_all_user_photos');
                        const rpcPromise = new Promise((resolve, reject) => {
                            supabase.rpc('get_all_user_photos', { user_id: userId })
                                .then(result => {
                                    console.log('[DEBUG] RPC get_all_user_photos result:', result);
                                    resolve(result);
                                })
                                .catch(err => {
                                    console.error('[DEBUG] RPC get_all_user_photos error:', err);
                                    resolve({ data: [], error: err });
                                });
                        });
                        queries.push(rpcPromise);
                    } catch (e) {
                        console.error('[DEBUG] Error setting up RPC query:', e);
                    }
                }
                
                // Simple, direct queries that might work with any structure
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .order('created_at', { ascending: false })
                );
                
                queries.push(
                    supabase
                        .from('simple_photos')
                        .select('*')
                        .order('created_at', { ascending: false })
                );
                
                queries.push(
                    supabase
                        .from('all_photos')
                        .select('*')
                        .order('created_at', { ascending: false })
                );
                
                // After getting all photos, we can filter for matches in the client
                console.log('[DEBUG] Will filter for matches in client-side code');
                
                // Try with properly stringified JSON
                const jsonMatchString = JSON.stringify([{ userId: userId }]);
                console.log('[DEBUG] Using JSON string for contains:', jsonMatchString);
                
                // Try with the simplest format
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .contains('matched_users', [{ userId: userId }])
                        .order('created_at', { ascending: false })
                );
                
                // Try with explicit string value version
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .eq('matched_users::text', jsonMatchString)
                        .order('created_at', { ascending: false })
                );
                
                // Try basic text search as a fallback
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .filter('matched_users::text', 'ilike', `%${userId}%`)
                        .order('created_at', { ascending: false })
                );
            }
            
            // Make sure all queries are valid Promise objects that can be caught
            const safeQueries = queries.map(q => {
                try {
                    // More robust check for Promise-like objects
                    if (q && typeof q.then === 'function') {
                        // Properly wrap in a new Promise to ensure catch works
                        return Promise.resolve(q)
                            .then(result => result)
                            .catch(e => ({ data: [], error: e }));
                    } else {
                        console.error('[DEBUG] Invalid query found in queries array:', q);
                        return Promise.resolve({ data: [], error: 'Invalid query' });
                    }
                } catch (err) {
                    // Last resort error handling
                    console.error('[DEBUG] Error wrapping query in safe promise:', err);
                    return Promise.resolve({ data: [], error: err });
                }
            });
            
            // Execute all queries
            const results = await Promise.all(safeQueries);
            
            // Filter out error results and combine valid data
            const validResults = results.filter(r => !r.error && Array.isArray(r.data));
            const combinedPhotos = validResults.flatMap(r => r.data || []);
            
            // Remove duplicates by ID
            const uniquePhotos = combinedPhotos.reduce((acc, photo) => {
                if (!acc.some(p => p.id === photo.id)) {
                    acc.push(photo);
                }
                return acc;
            }, []);
            
            // Sort photos by created_at date, newest first
            uniquePhotos.sort((a, b) => {
                const dateA = new Date(a.created_at || a.createdAt || 0);
                const dateB = new Date(b.created_at || b.createdAt || 0);
                return dateB - dateA; // Descending order (newest first)
            });
            
            console.log(`[DEBUG] Combined ${uniquePhotos.length} unique photos from all queries`);
            
            if (uniquePhotos.length > 0) {
                return await processPhotos(uniquePhotos);
            } else {
                // Only fetch from storage if we're in 'upload' mode
                // For 'matches' mode, if there are no matches in the database, we shouldn't show any photos
                if (queryMode === 'upload') {
                    console.log('[DEBUG] No photos found in database tables, trying storage lookup');
                    return await fetchFromStorageBucket();
                } else {
                    console.log('[DEBUG] No matched photos found in database tables, returning empty array');
                    setPhotos([]);
                    return [];
                }
            }
        } catch (error) {
            console.error('[DEBUG] Error in fallback query:', error);
            // Try fetching from both tables separately
            return await fetchFromBothTables(queryMode);
        }
    };

    // Helper function to fetch from both tables separately
    const fetchFromBothTables = async (queryMode) => {
        try {
            console.log('[DEBUG] Trying to fetch from both photos and simple_photos tables separately');
            
            // Query both tables
            const queries = [];
            
            // Mode-specific queries
            if (queryMode === 'upload') {
                // Query simple_photos for uploads
                queries.push(
                    supabase
                        .from('simple_photos')
                        .select('*')
                        .eq('uploaded_by', user.id)
                        .order('created_at', { ascending: false })
                );
                
                // Query photos for uploads
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .eq('uploaded_by', user.id)
                        .order('created_at', { ascending: false })
                );
            } else {
                // Correctly format matched_users queries with proper JSON encoding
                const userId = user.id;
                
                console.log('[DEBUG] Using simplified query approach in fetchFromBothTables');
                
                // Basic approach: use contains with proper format
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .contains('matched_users', [{"userId": userId}])
                        .order('created_at', { ascending: false })
                );
                
                // Try alternative field name format
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .contains('matched_users', [{"user_id": userId}])
                        .order('created_at', { ascending: false })
                );
                
                // Same for simple_photos table
                queries.push(
                    supabase
                        .from('simple_photos')
                        .select('*')
                        .contains('matched_users', [{"userId": userId}])
                        .order('created_at', { ascending: false })
                );
                
                queries.push(
                    supabase
                        .from('simple_photos')
                        .select('*')
                        .contains('matched_users', [{"user_id": userId}])
                        .order('created_at', { ascending: false })
                );
                
                // Try a simple text search as fallback
                queries.push(
                    supabase
                        .from('photos')
                        .select('*')
                        .filter('matched_users::text', 'like', `%${userId}%`)
                        .order('created_at', { ascending: false })
                );
                
                // Also try the RPC
                if (supabase.rpc && typeof supabase.rpc === 'function') {
                    try {
                        console.log('[DEBUG] Trying RPC query in fetchFromBothTables with user ID:', userId);
                        const rpcPromise = new Promise((resolve, reject) => {
                            supabase.rpc('get_matched_photos_for_user', { user_id_param: userId })
                                .then(result => {
                                    console.log('[DEBUG] RPC result in fetchFromBothTables:', result);
                                    resolve(result);
                                })
                                .catch(err => {
                                    console.error('[DEBUG] RPC error in fetchFromBothTables:', err);
                                    resolve({ data: [], error: err });
                                }); 
                        });
                        queries.push(rpcPromise);
                    } catch (e) {
                        console.error('[DEBUG] Error setting up RPC query in fetchFromBothTables:', e);
                    }
                }
            }
            
            // Make sure all queries are valid Promise objects that can be caught
            const safeQueries = queries.map(q => {
                try {
                    // More robust check for Promise-like objects
                    if (q && typeof q.then === 'function') {
                        // Properly wrap in a new Promise to ensure catch works
                        return Promise.resolve(q)
                            .then(result => result)
                            .catch(e => ({ data: [], error: e }));
                    } else {
                        console.error('[DEBUG] Invalid query found in queries array:', q);
                        return Promise.resolve({ data: [], error: 'Invalid query' });
                    }
                } catch (err) {
                    // Last resort error handling
                    console.error('[DEBUG] Error wrapping query in safe promise:', err);
                    return Promise.resolve({ data: [], error: err });
                }
            });
            
            // Execute all queries
            const results = await Promise.all(safeQueries);
            
            // Filter out error results and combine valid data
            const validResults = results.filter(r => !r.error && Array.isArray(r.data));
            const combinedPhotos = validResults.flatMap(r => r.data || []);
            
            // Remove duplicates by ID
            const uniquePhotos = combinedPhotos.reduce((acc, photo) => {
                if (!acc.some(p => p.id === photo.id)) {
                    acc.push(photo);
                }
                return acc;
            }, []);
            
            // Sort photos by created_at date, newest first
            uniquePhotos.sort((a, b) => {
                const dateA = new Date(a.created_at || a.createdAt || 0);
                const dateB = new Date(b.created_at || b.createdAt || 0);
                return dateB - dateA; // Descending order (newest first)
            });
            
            console.log(`[DEBUG] Combined ${uniquePhotos.length} unique photos from all queries`);
            
            if (uniquePhotos.length > 0) {
                return await processPhotos(uniquePhotos);
            } else {
                // Only fetch from storage if we're in 'upload' mode
                // For 'matches' mode, if there are no matches in the database, we shouldn't show any photos
                if (queryMode === 'upload') {
                    console.log('[DEBUG] No photos found in database tables, trying storage lookup');
                    return await fetchFromStorageBucket();
                } else {
                    console.log('[DEBUG] No matched photos found in database tables, returning empty array');
                    setPhotos([]);
                    return [];
                }
            }
        } catch (error) {
            console.error('[DEBUG] Error fetching from both tables:', error);
            // Only fall back to storage for 'upload' mode
            if (queryMode === 'upload') {
                return await fetchFromStorageBucket();
            } else {
                setPhotos([]);
                return [];
            }
        }
    };
    
    // Helper function to fetch directly from storage bucket
    const fetchFromStorageBucket = async () => {
        try {
            console.log('[DEBUG] Trying to fetch photos directly from storage bucket');
            
            // Get files from storage bucket for this user
            const { data: storageFiles, error: storageError } = await supabase.storage
                .from('photos')
                .list(user.id);
                
            if (storageError) {
                console.error('[DEBUG] Error fetching from storage:', storageError);
                setPhotos([]);
                return [];
            }
            
            if (storageFiles && storageFiles.length > 0) {
                console.log(`[DEBUG] Found ${storageFiles.length} files in storage bucket`);
                
                // Convert to photo objects
                const photosFromStorage = storageFiles.map(file => {
                    const storagePath = `${user.id}/${file.name}`;
                    const { data: { publicUrl } } = supabase.storage
                        .from('photos')
                        .getPublicUrl(storagePath);
                        
                    return {
                        id: file.id || storagePath,
                        storage_path: storagePath,
                        public_url: publicUrl,
                        uploaded_by: user.id,
                        file_size: file.metadata?.size || 0,
                        file_type: file.metadata?.mimetype || 'image/jpeg',
                        created_at: file.created_at || new Date().toISOString()
                    };
                });
                
                // Sort storage photos by created_at date, newest first
                photosFromStorage.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA; // Descending order (newest first)
                });
                
                return await processPhotos(photosFromStorage);
            }
            
            console.log('[DEBUG] No photos found in storage bucket');
            setPhotos([]);
            return [];
        } catch (error) {
            console.error('[DEBUG] Error fetching from storage bucket:', error);
            setPhotos([]);
            return [];
        }
    };

    // Update this function to fetch the user's face ID once
    const getUserFaceId = async () => {
        if (currentUserFaceId || !user) return currentUserFaceId;
        
        try {
            console.log('[DEBUG] Fetching face ID for user:', user.id);
            
            // First, check our memory cache via the supabaseClient utility
            const cachedFaceId = getFaceIdFromCache(user.id);
            if (cachedFaceId) {
                console.log('[DEBUG] Found face ID in cache:', cachedFaceId);
                setCurrentUserFaceId(cachedFaceId);
                return cachedFaceId;
            }
            
            // Try storage-based method
            const storedFaceId = await getFaceId(user.id);
            if (storedFaceId) {
                console.log('[DEBUG] Found face ID in storage:', storedFaceId);
                setCurrentUserFaceId(storedFaceId);
                cacheFaceId(user.id, storedFaceId); // Update cache
                return storedFaceId;
            }
            
            // Try user_faces table, but only if storage-based method didn't work
            const { data: faceData } = await supabase
                .from('user_faces')
                .select('face_id')
                .eq('user_id', user.id)
                .single();
            
            if (faceData && faceData.face_id) {
                console.log('[DEBUG] Found face ID in user_faces table:', faceData.face_id);
                setCurrentUserFaceId(faceData.face_id);
                cacheFaceId(user.id, faceData.face_id); // Update cache
                return faceData.face_id;
            }
            
            // Try profiles table as a last resort
            const { data: profileData } = await supabase
                .from('profiles')
                .select('face_id')
                .eq('id', user.id)
                .single();
                
            if (profileData && profileData.face_id) {
                console.log('[DEBUG] Found face ID in profiles table:', profileData.face_id);
                setCurrentUserFaceId(profileData.face_id);
                cacheFaceId(user.id, profileData.face_id); // Update cache
                return profileData.face_id;
            }
            
            console.log('[DEBUG] No face ID found for user:', user.id);
            return null;
        } catch (error) {
            console.log('[DEBUG] Error getting user face ID:', error);
            return null;
        }
    };

    // Call this in useEffect
    useEffect(() => {
        if (user) {
            // Get the user's face ID when the component mounts
            getUserFaceId();
        }
    }, [user]);

    // Add this function after the getUserFaceId function
    const getLinkedUserIds = async () => {
        if (!user) return [];
        
        try {
            const ids = await FaceIndexingService.getLinkedUserIds(user.id);
            console.log('[PhotoManager] Fetched Linked User IDs:', ids);
            return ids;
        } catch (error) {
            console.error('[PhotoManager] Error fetching linked user IDs:', error);
            return [user.id]; // Fallback to current user ID
        }
    };

    // Add this function right before the processPhotos function
    const enhancePhotoMatches = (photos, currentUserId, currentUserFaceId) => {
        // Disable inferred matching algorithm - return photos unchanged
        console.log("[DEBUG] Enhanced photo matching disabled - using direct AWS Rekognition matches only");
        return photos;
    };

    // Process and normalize photos, then apply final filtering based on mode
    const processPhotos = async (rawPhotos) => {
        console.log(`[DEBUG] Processing ${rawPhotos.length} photos for display`);
        if (!user) {
            console.error('[processPhotos] User is null, cannot process photos.');
            return [];
        }
        
        // Fetch linked user IDs for filtering in 'matches' mode
        let linkedIds = [user.id];
        if (mode === 'matches') {
            linkedIds = await getLinkedUserIds();
        }

        const processed = rawPhotos.map(photo => {
            console.log('[DEBUG] Normalizing photo:', photo.id);
            
            // Ensure matched_users is an array
            let matchedUsers = [];
            if (photo.matched_users && typeof photo.matched_users === 'string') {
                try {
                    matchedUsers = JSON.parse(photo.matched_users);
                    if (!Array.isArray(matchedUsers)) matchedUsers = [];
                } catch (e) {
                    console.warn(`[DEBUG] Failed to parse matched_users for photo ${photo.id}:`, photo.matched_users, e);
                    matchedUsers = [];
                }
            } else if (Array.isArray(photo.matched_users)) {
                matchedUsers = photo.matched_users;
            } else {
                // If it's neither string nor array, initialize as empty
                matchedUsers = [];
            }
            
            console.log(`[DEBUG] Photo ${photo.id} has ${matchedUsers.length} matched users`);
            
            // Normalize matched user structure
            const normalizedMatchedUsers = matchedUsers.map(match => {
                const userId = match.userId || match.user_id;
                if (!userId) {
                    console.warn('[DEBUG] Malformed match found (missing userId):', match, 'in photo:', photo.id);
                }
                return {
                    userId: userId,
                    faceId: match.faceId,
                    fullName: match.fullName || match.full_name || 'Unknown User',
                    avatarUrl: match.avatarUrl || match.avatar_url,
                    confidence: match.confidence || 0,
                    similarity: match.similarity || 0,
                    email: match.email // Preserve email if available
                };
            }).filter(match => match.userId); // Filter out matches without a userId
            
            if (normalizedMatchedUsers.length > 0) {
                console.log('[DEBUG] First matched user:', JSON.stringify(normalizedMatchedUsers[0]));
                console.log(`[DEBUG] Match uses 'userId' format: ${normalizedMatchedUsers[0].userId}`);
            }
            
            // Check if the current user (or linked users) is in the matches
            const isMatched = normalizedMatchedUsers.some(match => linkedIds.includes(match.userId));
            
            if (mode === 'matches') {
                console.log(`[DEBUG] Current user/linked users (${linkedIds.join(', ')}) ${isMatched ? 'IS' : 'is NOT'} in the matches for photo ${photo.id}`);
            } else {
                 // For upload mode, just log the check without filtering based on it here
                 const currentUserMatched = normalizedMatchedUsers.some(match => match.userId === user.id);
                 console.log(`[DEBUG] Current user ${user.id} ${currentUserMatched ? 'IS' : 'is NOT'} in the matches for photo ${photo.id} (Upload Mode)`);
            }
            
            // Return a normalized structure, potentially adding an isMatched flag
            return {
                ...photo,
                matched_users: normalizedMatchedUsers, // Use the normalized array
                // Add a flag indicating if the current user/linked account is matched
                // This flag can be used later for filtering if needed
                isCurrentUserMatched: isMatched 
            };
        });

        console.log(`[DEBUG] Transformed ${processed.length} photos`);

        // Apply final filtering based on the mode
        let finalPhotos;
        if (mode === 'matches') {
            console.log('[DEBUG] Applying final filtering for matches mode');
            finalPhotos = processed.filter(photo => photo.isCurrentUserMatched);
            console.log(`[DEBUG] Found ${finalPhotos.length} photos matching current user or linked accounts.`);

             // Attempt to fix photos if no matches found initially
             if (finalPhotos.length === 0 && processed.length > 0) { // Only fix if DB returned photos but none matched
                console.log('[DEBUG] No matching photos found after initial processing. Attempting to fix linked account photos...');
                try {
                    const fixResult = await LinkedAccountsService.updatePhotosForLinkedAccounts(user.id, linkedIds);
                    console.log('[DEBUG] Photo fix attempt result:', fixResult);
                    if (fixResult.success && fixResult.updated > 0) {
                        console.log('[DEBUG] Photos were updated by fix process. Refetching...');
                        // Trigger a refetch by calling fetchPhotos again
                        // Be careful to avoid infinite loops - maybe add a flag?
                        // For now, just log and let the user refresh manually or rely on realtime.
                        setError('Some photo matches might have been fixed. Please refresh.'); 
                    } else {
                         console.log('[DEBUG] No photos were fixed or update failed:', fixResult);
                    }
                } catch (fixError) {
                    console.error('[DEBUG] Error during photo fix attempt:', fixError);
                }
            }
        } else { // mode === 'upload'
            console.log('[DEBUG] Filtering for photos uploaded by the current user');
            finalPhotos = processed.filter(photo => photo.uploaded_by === user.id);
        }

        setPhotos(finalPhotos);
        return finalPhotos;
    };

    // Helper function to check database schema
    const checkDatabaseSchema = async () => {
        try {
            // Check cache first
            if (isSchemaValid()) {
                console.log('[DEBUG] Using cached schema information');
                const cachedSchema = getCachedSchema();
                return cachedSchema;
            }
            
            console.log('[DEBUG] Checking database schema...');
            
            // Try to get the list of tables directly - use admin client to bypass RLS
            console.log('[DEBUG] Fetching list of tables from information_schema');
            const { data: tableInfo, error: tableError } = await supabaseAdmin
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .limit(20);
            
            let tables = null;
            let functions = null;
            
            if (tableError) {
                console.error('[DEBUG] Error fetching tables from information_schema:', tableError);
            } else if (tableInfo) {
                tables = tableInfo.map(t => t.table_name);
                console.log('[DEBUG] Tables in database:', tables);
            }
            
            // Try a direct SQL query to look for stored procedures - use admin client
            console.log('[DEBUG] Checking for available functions (RPCs)');
            const functionQuery = await supabaseAdmin.rpc('list_functions');
            if (functionQuery.error) {
                console.error('[DEBUG] Error listing functions:', functionQuery.error);
                
                // Try the hint from the error message
                console.log('[DEBUG] Trying hint from error: get_all_user_photos');
                
                // Check if the hint suggests a particular function
                const hintMatch = functionQuery.error.hint?.match(/call the function ([a-zA-Z0-9_]+)/);
                if (hintMatch && hintMatch[1]) {
                    functions = [hintMatch[1]];
                    console.log(`[DEBUG] Found suggested function in hint: ${hintMatch[1]}`);
                }
            } else if (functionQuery.data) {
                functions = functionQuery.data;
                console.log('[DEBUG] Available functions:', functions);
            }
            
            // Store in cache
            updateSchemaCache(tables, functions);
            
            return { tables, functions };
            
        } catch (e) {
            console.error('[DEBUG] Error checking schema:', e);
            return { tables: null, functions: null };
        }
    };

    useEffect(() => {
        if (user) {
            fetchPhotos();
            // Only check schema if we don't have valid cached data
            if (!isSchemaValid()) {
                checkDatabaseSchema();
            }
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
    
    const handleDownload = async (photoId) => {
        try {
            // Find the photo by ID in our local photos array
            const photo = photos.find(p => p.id === photoId);
            
            if (!photo || !photo.url) {
                throw new Error('Photo not found or URL is missing');
            }
            
            // Use the direct URL from the photo object
            const response = await fetch(photo.url);
            
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-${photoId}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the object URL to prevent memory leaks
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading photo:', err);
            setError('Failed to download photo. Please try again.');
        }
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
        
        _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, children: photos.length > 0 ? (_jsx(PhotoGrid, { photos: photos, onDelete: mode === 'upload' ? handlePhotoDelete : undefined, onShare: handleShare, onDownload: handleDownload })) : (_jsx("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: _jsx("p", { className: "text-apple-gray-500", children: mode === 'upload' ? "No photos uploaded yet" : "No photos found with your face" }) })) })
    ] }));
};
