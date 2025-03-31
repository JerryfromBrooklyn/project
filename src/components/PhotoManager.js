import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/PhotoManager.tsx
import { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Filter, ChevronDown, Calendar, MapPin, Tag, Clock, Search, Wrench, Check, Info } from 'lucide-react';
import { supabase, supabaseAdmin, isSchemaValid, getCachedSchema, updateSchemaCache, getFaceIdFromCache, cacheFaceId } from '../supabaseClient';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { getFaceId } from '../services/FaceStorageService';
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
    const [matchedPhotoIds, setMatchedPhotoIds] = useState([]);

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
        try {
            setLoading(true);
            setError(null);
            console.log('[DEBUG] Fetching photos...');
            
            // Ensure we have a user ID
            if (!user?.id) {
                console.warn('[DEBUG] No user ID available for fetching photos.');
                setLoading(false);
                return;
            }
            
            // Ensure we have valid filters
            const activeFilters = { 
                ...filters, 
                dateRange: {
                    start: filters.dateRange.start || '',
                    end: filters.dateRange.end || ''
                },
                timeRange: {
                    start: filters.timeRange.start || '',
                    end: filters.timeRange.end || ''
                }
            };
            
            let photosToProcess = [];
            let fetchedUserFaceId = currentUserFaceId; // Start with cached ID if available
            
            if (mode === 'matches') {
                console.log('[DEBUG] Fetching matched photos for user:', user.id);
                
                // Ensure we have the user's face ID
                if (!fetchedUserFaceId) {
                    console.log('[DEBUG] No cached face ID, fetching from database...');
                    fetchedUserFaceId = await getUserFaceId(user.id);
                    if (fetchedUserFaceId) {
                        setCurrentUserFaceId(fetchedUserFaceId); // Update state cache
                        console.log('[DEBUG] User face ID obtained:', fetchedUserFaceId);
                    } else {
                        console.warn('[DEBUG] Could not obtain user face ID. Cannot fetch matches.');
                        setError('Could not find your registered face. Please try registering again.');
                        setPhotos([]); // Clear photos if we can't match
                        setLoading(false);
                        return;
                    }
                }
                
                // Try to get face matches directly from FaceIndexingService
                let photoIdsFromService = [];
                if (fetchedUserFaceId) {
                    console.log('[DEBUG] Using FaceIndexingService.searchFacesByFaceId directly');
                    try {
                        const matchesFromService = await FaceIndexingService.searchFacesByFaceId(fetchedUserFaceId, user.id);
                        if (matchesFromService && Array.isArray(matchesFromService)) {
                            photoIdsFromService = matchesFromService.map(match => 
                                typeof match === 'object' ? (match.photo_id || match.photoId || match.id || match.Face?.FaceId) : match
                            ).filter(Boolean);
                            
                            if (photoIdsFromService.length > 0) {
                                console.log(`[DEBUG] Found ${photoIdsFromService.length} potential matching photo/face IDs`);
                                setMatchedPhotoIds(photoIdsFromService); // Store these for filtering
                            }
                        }
                    } catch (error) {
                        console.error('[DEBUG] Error getting matches from service:', error);
                    }
                }
                
                // Fetch all photos and filter later
                photosToProcess = await fetchFromBothTables('matches');
                console.log(`[DEBUG] Fetched ${photosToProcess.length} total photos for potential matching`);
                
            } else { // mode === 'upload'
                console.log('[DEBUG] Fetching uploaded photos for user:', user.id);
                photosToProcess = await fetchFromBothTables('upload');
                console.log(`[DEBUG] Fetched ${photosToProcess.length} uploaded photos`);
            }
            
            // Process photos to ensure consistent structure
            if (Array.isArray(photosToProcess)) {
                console.log(`[DEBUG] Processing ${photosToProcess.length} photos for display`);
                const processedPhotos = await processPhotos(photosToProcess);
                
                // Filter by mode (matches or uploads)
                const filteredByModePhotos = filterPhotosByMode(processedPhotos, mode, user.id, fetchedUserFaceId);
                
                // Apply search/filter UI inputs
                const filteredAndSearchedPhotos = applySearchAndFilter(filteredByModePhotos, searchQuery, activeFilters);
                console.log(`[DEBUG] Final photo count after filtering: ${filteredAndSearchedPhotos.length}`);
                
                setPhotos(filteredAndSearchedPhotos);
            } else {
                console.warn('[DEBUG] photosToProcess was not an array');
                setPhotos([]);
            }
            
        } catch (error) {
            console.error('[DEBUG] Error fetching photos:', error);
            setError('Failed to fetch photos. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add the applySearchAndFilter function definition (can be placed near filterPhotosByMode)
    const applySearchAndFilter = (photos, query, filters) => {
        let results = [...photos];

        // Apply search query
        if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(photo => 
                (photo.file_name && photo.file_name.toLowerCase().includes(lowerQuery)) ||
                (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                (photo.venue && photo.venue.name && photo.venue.name.toLowerCase().includes(lowerQuery)) ||
                (photo.event_details && photo.event_details.name && photo.event_details.name.toLowerCase().includes(lowerQuery))
            );
        }

        // Apply date range filter
        if (filters.dateRange.start) {
            results = results.filter(photo => new Date(photo.created_at) >= new Date(filters.dateRange.start));
        }
        if (filters.dateRange.end) {
            results = results.filter(photo => new Date(photo.created_at) <= new Date(filters.dateRange.end));
        }

        // Apply time range filter
        if (filters.timeRange.start) {
            results = results.filter(photo => {
                const photoTime = new Date(photo.created_at).toLocaleTimeString('en-US', { hour12: false });
                return photoTime >= filters.timeRange.start;
            });
        }
        if (filters.timeRange.end) {
            results = results.filter(photo => {
                const photoTime = new Date(photo.created_at).toLocaleTimeString('en-US', { hour12: false });
                return photoTime <= filters.timeRange.end;
            });
        }

        // Apply tags filter
        if (filters.tags.length > 0) {
            results = results.filter(photo => 
                filters.tags.every(filterTag => 
                    photo.tags && photo.tags.some(photoTag => photoTag.toLowerCase() === filterTag.toLowerCase())
                )
            );
        }
        
        // Apply location filter (basic check for now)
        if (filters.location.lat && filters.location.lng) {
            // Placeholder for potential future geo-filtering logic
            // For now, just logs that location filter is active
            console.log('[FILTER] Location filter is active but not implemented yet');
        }

        console.log(`[FILTER] Applied search/filters, ${results.length} photos remaining`);
        return results;
    };

    // Modify fetchFromBothTables function (around line 445)
    const fetchFromBothTables = async (currentMode) => {
        console.log(`[DEBUG] Fetching from both tables for mode: ${currentMode}`);
        let combinedPhotos = [];
        let uniquePhotoIds = new Set();

        const processAndAdd = (photos, sourceTable) => {
            if (!photos || !Array.isArray(photos)) return;
            photos.forEach(photo => {
                // Use photo_id or id as the unique identifier
                const photoIdentifier = photo.photo_id || photo.id;
                if (photoIdentifier && !uniquePhotoIds.has(photoIdentifier)) {
                    combinedPhotos.push({ ...photo, source_table: sourceTable });
                    uniquePhotoIds.add(photoIdentifier);
                }
            });
        };

        try {
            // Direct table queries
            console.log(`[DEBUG] Falling back to table queries`);
            const tables = ['photos', 'simple_photos'];
            
            // ADDITION: If we're in 'matches' mode and have a face ID, also fetch photos directly from face_matches
            if (currentMode === 'matches' && user?.id) {
                const fetchedUserFaceId = await getUserFaceId(user.id);
                
                if (fetchedUserFaceId) {
                    console.log(`[DEBUG] Using face_matches table to find photos for face ID: ${fetchedUserFaceId}`);
                    
                    // Get photo IDs from face_matches table
                    const { data: matchData, error: matchError } = await supabase
                        .from('face_matches')
                        .select('matched_face_id, user_id')
                        .eq('face_id', fetchedUserFaceId);
                    
                    if (matchError) {
                        console.error('[DEBUG] Error fetching from face_matches:', matchError);
                    } else if (matchData && matchData.length > 0) {
                        console.log(`[DEBUG] Found ${matchData.length} matching entries in face_matches table`);
                        
                        // IMPORTANT: In face_matches, "user_id" contains the other user's ID
                        // We need to find photos that contain these matched face_ids
                        const matchedFaceIds = [...new Set(matchData.map(m => m.matched_face_id))].filter(Boolean);
                        const matchedUserIds = [...new Set(matchData.map(m => m.user_id))].filter(Boolean);
                        
                        console.log(`[DEBUG] Extracted ${matchedFaceIds.length} matched face IDs and ${matchedUserIds.length} matched user IDs`);
                        
                        if (matchedFaceIds.length > 0) {
                            console.log(`[DEBUG] Matched face ID examples:`, matchedFaceIds.slice(0, 3));
                            console.log(`[DEBUG] Matched user ID examples:`, matchedUserIds.slice(0, 3));
                            
                            let foundAnyPhotos = false;
                            
                            // Try to find photos with these matched face IDs
                            for (const table of tables) {
                                try {
                                    // Look for photos containing any of the matched face IDs in their face_ids array
                                    const { data: facePhotos, error: facePhotoError } = await supabase
                                        .from(table)
                                        .select('*')
                                        .contains('face_ids', matchedFaceIds);
                                        
                                    if (!facePhotoError && facePhotos && facePhotos.length > 0) {
                                        console.log(`[DEBUG] Found ${facePhotos.length} photos by face IDs in ${table}`);
                                        processAndAdd(facePhotos, table);
                                        foundAnyPhotos = true;
                                    }
                                    
                                    // Also look for photos uploaded by the matched users
                                    // This covers cases where the user appears in photos uploaded by others
                                    const { data: userPhotos, error: userPhotoError } = await supabase
                                        .from(table)
                                        .select('*')
                                        .in('uploaded_by', matchedUserIds);
                                        
                                    if (!userPhotoError && userPhotos && userPhotos.length > 0) {
                                        console.log(`[DEBUG] Found ${userPhotos.length} photos uploaded by matched users in ${table}`);
                                        processAndAdd(userPhotos, table);
                                        foundAnyPhotos = true;
                                    }
                                    
                                    // Also look for photos where the user's ID appears in the matched_users JSON array
                                    for (const matchedUserId of matchedUserIds.slice(0, 10)) { // Limit to 10 users for performance
                                        const userMatchJson = JSON.stringify([{ userId: matchedUserId }]);
                                        const userMatchJson2 = JSON.stringify([{ user_id: matchedUserId }]);
                                        
                                        const { data: matchedUserPhotos, error: matchedUserError } = await supabase
                                            .from(table)
                                            .select('*')
                                            .or(`matched_users.cs.${userMatchJson},matched_users.cs.${userMatchJson2}`);
                                            
                                        if (!matchedUserError && matchedUserPhotos && matchedUserPhotos.length > 0) {
                                            console.log(`[DEBUG] Found ${matchedUserPhotos.length} photos with matched user ${matchedUserId} in metadata`);
                                            processAndAdd(matchedUserPhotos, table);
                                            foundAnyPhotos = true;
                                        }
                                    }
                                    
                                } catch (err) {
                                    console.error(`[DEBUG] Error searching for matched photos in ${table}:`, err);
                                }
                            }
                            
                            // If we still didn't find any photos through the original tables
                            if (!foundAnyPhotos) {
                                console.log('[DEBUG] No photos found through standard queries, trying direct database query...');
                                try {
                                    // Use the function suggested in the error message hint
                                    const { data: directData, error: directError } = await supabase.rpc(
                                        'find_photos_with_face_ids',
                                        { 
                                            face_id_list: [fetchedUserFaceId, ...matchedFaceIds] 
                                        }
                                    );
                                    
                                    if (directError) {
                                        console.error('[DEBUG] Error with direct photo query:', directError);
                                        
                                        // Try another approach with the matched face IDs if available
                                        console.log('[DEBUG] Trying another approach with the matched face IDs...');
                                        try {
                                            // Get the matched face IDs from face_matches
                                            const { data: matchedFaceIds, error: matchedFaceError } = await supabase
                                                .from('face_matches')
                                                .select('matched_face_id')
                                                .eq('face_id', fetchedUserFaceId);
                                                
                                            if (!matchedFaceError && matchedFaceIds && matchedFaceIds.length > 0) {
                                                console.log(`[DEBUG] Found ${matchedFaceIds.length} matched face IDs`);
                                                const faceIds = [...new Set(matchedFaceIds.map(m => m.matched_face_id))];
                                                
                                                // Try to find photos with these face IDs
                                                for (const table of tables) {
                                                    const { data: facePhotos, error: facePhotoError } = await supabase
                                                        .from(table)
                                                        .select('*')
                                                        .contains('face_ids', faceIds);
                                                        
                                                    if (!facePhotoError && facePhotos && facePhotos.length > 0) {
                                                        console.log(`[DEBUG] Found ${facePhotos.length} photos by face IDs in ${table}`);
                                                        processAndAdd(facePhotos, table);
                                                        foundAnyPhotos = true;
                                                    }
                                                }
                                            }
                                        } catch (matchError) {
                                            console.error('[DEBUG] Error trying to match by face IDs:', matchError);
                                        }
                                        
                                        // LAST RESORT: If we still have no photos, just load all available photos
                                        if (!foundAnyPhotos) {
                                            console.log('[DEBUG] As a last resort, trying to load any available photos...');
                                            for (const table of tables) {
                                                // Just get the most recent 50 photos
                                                const { data: allPhotos, error: allPhotosError } = await supabase
                                                    .from(table)
                                                    .select('*')
                                                    .order('created_at', { ascending: false })
                                                    .limit(50);
                                                    
                                                if (!allPhotosError && allPhotos && allPhotos.length > 0) {
                                                    console.log(`[DEBUG] Found ${allPhotos.length} recent photos in ${table} as fallback`);
                                                    processAndAdd(allPhotos, table);
                                                    foundAnyPhotos = true;
                                                }
                                            }
                                        }
                                        
                                        // If RPC isn't available, fetch photos directly from storage as fallback
                                        if (!foundAnyPhotos && directError.message && directError.message.includes('function')) {
                                            console.log('[DEBUG] RPC not available, trying direct storage access...');
                                            // This is a fallback method to show at least something to the user
                                            const storagePhotos = await fetchFromStorageBucket(user.id);
                                            if (storagePhotos && storagePhotos.length > 0) {
                                                console.log(`[DEBUG] Found ${storagePhotos.length} photos from storage bucket`);
                                                processAndAdd(storagePhotos, 'storage');
                                            }
                                        }
                                    } else if (directData && directData.length > 0) {
                                        console.log(`[DEBUG] Found ${directData.length} photos through direct query`);
                                        processAndAdd(directData, 'direct_query');
                                    }
                                } catch (directErr) {
                                    console.error('[DEBUG] Exception in direct query:', directErr);
                                }
                            }
                        }
                    }
                }
            }
            
            // Original query logic - still needed for standard matched_users lookup
            for (const table of tables) {
                let query = supabase.from(table).select('*');

                if (currentMode === 'matches') {
                    if (user?.id) {
                        // Construct the JSON string for the object to check containment
                        // Check both possible key names (user_id and userId)
                        const containsUserObject1 = JSON.stringify([{ user_id: user.id }]);
                        const containsUserObject2 = JSON.stringify([{ userId: user.id }]);
                        
                        // Use the OR filter to check for either structure within the matched_users array
                        query = query.or(`matched_users.cs.${containsUserObject1},matched_users.cs.${containsUserObject2}`);
                        
                        console.log(`[DEBUG] Querying ${table} for matches containing user: ${user.id}`);
                    } else {
                        // If no user ID, don't fetch matches
                        console.warn(`[DEBUG] No user ID available for match query on table ${table}`);
                        continue; // Skip this table query
                    }
                } else { // mode === 'upload'
                    if (user?.id) {
                        query = query.eq('uploaded_by', user.id);
                    } else {
                        console.warn(`[DEBUG] No user ID available for upload query on table ${table}`);
                        continue; // Skip this table query
                    }
                }
                
                query = query.order('created_at', { ascending: false });

                const { data, error } = await query;
                
                if (error) {
                    // Log specific errors, especially the JSON syntax one
                    console.error(`[DEBUG] Error fetching from ${table}:`, error.message, `(Code: ${error.code})`);
                    if (error.code === '22P02') { // Invalid text representation (JSON syntax error)
                         console.error(`[DEBUG] Potential issue with JSON structure or query syntax for table ${table}.`);
                    }
                } else if (data) {
                    console.log(`[DEBUG] Fetched ${data.length} photos from ${table}`);
                    processAndAdd(data, table);
                }
            }
            
            console.log(`[DEBUG] Combined ${combinedPhotos.length} unique photos from all queries`);
            return combinedPhotos;
        } catch (error) {
            console.error('[DEBUG] Error in fetchFromBothTables:', error);
            return [];
        }
    };

    /**
     * Fetch photos directly from storage bucket
     * @param {string} userId - The user ID to fetch photos for
     * @returns {Promise<Array>} - Array of photo objects
     */
    const fetchFromStorageBucket = async (userId) => {
        try {
            console.log('[STORAGE] Fetching files from storage bucket for user:', userId);
            
            // Get the list of files in the user's folder
            const { data: files, error } = await supabase.storage
                .from('photos')
                .list(userId);
                
            if (error) {
                console.error('[STORAGE] Error listing files:', error);
                return [];
            }
            
            if (!files || files.length === 0) {
                console.log('[STORAGE] No files found in storage for user:', userId);
                return [];
            }
            
            console.log(`[STORAGE] Found ${files.length} files in storage`);
            
            // Convert storage files to photo objects
            const photos = files
                .filter(file => {
                    // Only include image files
                    const extension = file.name.split('.').pop().toLowerCase();
                    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                })
                .map(file => {
                    const storagePath = `${userId}/${file.name}`;
                    const { data: { publicUrl } } = supabase.storage
                        .from('photos')
                        .getPublicUrl(storagePath);
                        
                    return {
                        id: file.id || `storage-${userId}-${file.name}`,
                        url: publicUrl,
                        public_url: publicUrl,
                        storage_path: storagePath,
                        uploaded_by: userId,
                        file_name: file.name,
                        file_size: file.metadata?.size || 0,
                        file_type: file.metadata?.mimetype || 'image/jpeg',
                        created_at: file.created_at || new Date().toISOString(),
                        matched_users: [],
                        faces: []
                    };
                });
                
            console.log(`[STORAGE] Created ${photos.length} photo objects from storage`);
            return photos;
        } catch (error) {
            console.error('[STORAGE] Error in fetchFromStorageBucket:', error);
            return [];
        }
    };

    /**
     * Get the face ID for a user from the database
     * @param {string} userId - The user ID
     * @returns {Promise<string|null>} - The user's face ID or null
     */
    const getUserFaceId = async (userId) => {
        if (!userId) {
            console.warn('[FACE-ID] No userId provided');
            return null;
        }

        try {
            console.log('[FACE-ID] Getting face ID for user:', userId);

            // Try the user_face_data table first (new schema)
            const { data: userData, error: userError } = await supabase
                .from('user_face_data')
                .select('face_id')
                .eq('user_id', userId)
                .single();

            if (userData && userData.face_id) {
                console.log('[FACE-ID] Found face ID in user_face_data table:', userData.face_id);
                return userData.face_id;
            }

            if (userError && userError.code !== 'PGRST116') { // Ignore 'No rows found' error
                console.error('[FACE-ID] Error fetching from user_face_data:', userError);
            }

            // Try the face_data table as a fallback (old schema - might still exist?)
            try {
                const { data: faceData, error: faceError } = await supabase
                    .from('face_data') // This table should ideally be removed later
                    .select('face_id')
                    .eq('user_id', userId)
                    .single();

                if (faceData && faceData.face_id) {
                    console.warn('[FACE-ID] Found face ID in DEPRECATED face_data table:', faceData.face_id);
                    return faceData.face_id;
                }

                if (faceError && faceError.code !== 'PGRST116' && faceError.code !== '42P01') { // Ignore 'No rows' and 'table does not exist'
                    console.error('[FACE-ID] Error fetching from deprecated face_data:', faceError);
                }
            } catch (deprecatedTableError) {
                 console.warn('[FACE-ID] Could not query deprecated face_data table.');
            }

            // Try getting from localStorage as last resort
            try {
                const localFaceId = localStorage.getItem(`user_face_id_${userId}`);
                if (localFaceId) {
                    console.warn('[FACE-ID] Found face ID in localStorage (fallback):', localFaceId);
                    return localFaceId;
                }
            } catch (lsError) {
                console.warn('[FACE-ID] Error checking localStorage:', lsError);
            }

            console.warn('[FACE-ID] No face ID found for user:', userId);
            return null;
        } catch (error) {
            console.error('[FACE-ID] Critical error getting user face ID:', error);
            return null;
        }
    };

    // Call this in useEffect
    useEffect(() => {
        if (user) {
            // Get the user's face ID when the component mounts
            getUserFaceId(user.id);
        }
    }, [user]);

    // Process face matches in a more robust way
    const enhancePhotoMatches = (photos, currentUserId, currentUserFaceId) => {
        console.log("[DEBUG] Advanced matching enabled");
        console.log(`[DEBUG] Using expanded matching for user: ${currentUserId}`);
        
        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            return [];
        }
        
        if (!currentUserFaceId) {
            console.log("[DEBUG] No face ID available for matching");
            return photos;
        }
        
        const enhancedPhotos = photos.map(photo => {
            // Deep clone to avoid mutating original
            const enhancedPhoto = JSON.parse(JSON.stringify(photo));
            
            // Already has direct match
            if (enhancedPhoto.matched_users?.some(match => 
                match.userId === currentUserId || match.user_id === currentUserId
            )) {
                return enhancedPhoto;
            }
            
            // Check for face ID match
            let hasFaceMatch = false;
            
            // Check face_ids array
            if (Array.isArray(enhancedPhoto.face_ids) && enhancedPhoto.face_ids.includes(currentUserFaceId)) {
                hasFaceMatch = true;
            }
            
            // Check faces array
            if (!hasFaceMatch && Array.isArray(enhancedPhoto.faces)) {
                hasFaceMatch = enhancedPhoto.faces.some(face => 
                    face.faceId === currentUserFaceId || face.face_id === currentUserFaceId
                );
            }
            
            // If there's a face match but no direct match, fix it in the UI layer
            if (hasFaceMatch) {
                console.log(`[DEBUG] Found face match in photo ${enhancedPhoto.id}`);
                
                // Ensure matched_users is an array
                if (!enhancedPhoto.matched_users) {
                    enhancedPhoto.matched_users = [];
                }
                
                // Add virtual match for UI display only
                enhancedPhoto._hasFaceMatch = true;
                
                // Schedule a background repair (this won't block the UI)
                if (typeof window !== 'undefined') {
                    setTimeout(() => {
                        console.log(`[DEBUG] Scheduling background repair for photo ${enhancedPhoto.id}`);
                        try {
                            supabase.rpc('update_photo_matched_users', {
                                p_photo_id: enhancedPhoto.id,
                                p_user_match: {
                                    userId: currentUserId,
                                    faceId: currentUserFaceId,
                                    fullName: 'User',
                                    similarity: 98,
                                    confidence: 99
                                },
                                p_table_name: enhancedPhoto.source_table || 'photos'
                            }).then(result => {
                                console.log(`[DEBUG] Background repair result:`, result);
                            }).catch(err => {
                                console.error(`[DEBUG] Background repair error:`, err);
                            });
                        } catch (e) {
                            console.error(`[DEBUG] Error in background repair:`, e);
                        }
                    }, 5000);
                }
            }
            
            return enhancedPhoto;
        });
        
        return enhancedPhotos;
    };

    // Helper function to get and ensure user's face ID is cached
    const ensureUserFaceId = async (userId) => {
        // First check if it's already in memory cache
        const cachedFaceId = getFaceIdFromCache(userId);
        if (cachedFaceId) {
            return cachedFaceId;
        }
        
        try {
            console.log(`[DEBUG] Fetching face ID for user: ${userId}`);
            
            // Try to get from face_data table
            const { data: faceData, error: faceError } = await supabase
                .from('face_data')
                .select('face_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false }) // Get most recent
                .limit(1);
                
            if (faceError) {
                console.error('[DEBUG] Error fetching face ID:', faceError);
                return null;
            }
            
            if (faceData && faceData.length > 0) {
                const faceId = faceData[0].face_id;
                
                if (faceId) {
                    console.log(`[DEBUG] Found face ID in database: ${faceId}`);
                    cacheFaceId(userId, faceId);
                    return faceId;
                }
            }
            
            // If not found, try to find from photos
            console.log('[DEBUG] No face ID found in face_data, searching in photos');
            
            const { data: photoData, error: photoError } = await supabase
                .from('photos')
                .select('matched_users')
                .contains('matched_users', [{ userId }])
                .limit(5);
                
            if (!photoError && photoData && photoData.length > 0) {
                for (const photo of photoData) {
                    if (photo.matched_users && Array.isArray(photo.matched_users)) {
                        const userMatch = photo.matched_users.find(match => 
                            match.userId === userId || match.user_id === userId
                        );
                        
                        if (userMatch && userMatch.faceId) {
                            console.log(`[DEBUG] Found face ID in photos: ${userMatch.faceId}`);
                            cacheFaceId(userId, userMatch.faceId);
                            return userMatch.faceId;
                        }
                    }
                }
            }
            
            console.log('[DEBUG] Could not find face ID for user');
            return null;
        } catch (error) {
            console.error('[DEBUG] Error in ensureUserFaceId:', error);
            return null;
        }
    };

    // Helper function to process photos
    const processPhotos = async (photos) => {
        if (photos && photos.length > 0) {
            console.log('[DEBUG] Processing photos, first photo:', photos[0]);
            console.log('[DEBUG] First photo matched_users:', JSON.stringify(photos[0].matched_users || photos[0].matchedUsers));
        } else {
            console.log('[DEBUG] No photos to process');
            setPhotos([]);
            return [];
        }
        
        console.log(`[DEBUG] Processing ${photos.length} photos for display`);
        
        let transformedPhotos = (photos || []).map(photo => {
            // Enhanced normalization for storage-only photos
            const normalizeStoragePhoto = (storagePhoto) => {
                console.log(`[DEBUG] Normalizing photo: ${storagePhoto.id}`);
                
                // If this is a storage-only photo (has no attributes), add defaults
                if (!storagePhoto.faces || !Array.isArray(storagePhoto.faces)) {
                    console.log(`[DEBUG] Adding default 'faces' array to photo ${storagePhoto.id}`);
                    storagePhoto.faces = [];
                }
                
                // Process matched_users with robust format handling
                if (!storagePhoto.matched_users && storagePhoto.matchedUsers) {
                    console.log(`[DEBUG] Using matchedUsers instead of matched_users for photo ${storagePhoto.id}`);
                    storagePhoto.matched_users = storagePhoto.matchedUsers;
                }
                
                if (!storagePhoto.matched_users) {
                    console.log(`[DEBUG] Adding default 'matched_users' array to photo ${storagePhoto.id}`);
                    storagePhoto.matched_users = [];
                } else {
                    // Make sure matched_users is an array
                    if (!Array.isArray(storagePhoto.matched_users)) {
                        try {
                            console.log(`[DEBUG] matched_users is not an array, trying to parse: ${typeof storagePhoto.matched_users}`);
                            // If it's a string, try to parse it
                            if (typeof storagePhoto.matched_users === 'string') {
                                storagePhoto.matched_users = JSON.parse(storagePhoto.matched_users);
                                console.log(`[DEBUG] Parsed matched_users from string: ${JSON.stringify(storagePhoto.matched_users)}`);
                            }
                        } catch (e) {
                            console.error(`[DEBUG] Failed to parse matched_users: ${e.message}`);
                            storagePhoto.matched_users = [];
                        }
                    }
                    
                    // Additional check after potential parsing
                    if (!Array.isArray(storagePhoto.matched_users)) {
                        console.log(`[DEBUG] matched_users is still not an array after parsing attempt, setting to empty array`);
                        storagePhoto.matched_users = [];
                    }
                    
                    // Log matched users for debugging
                    console.log(`[DEBUG] Photo ${storagePhoto.id} has ${storagePhoto.matched_users.length} matched users`);
                    if (storagePhoto.matched_users.length > 0) {
                        console.log(`[DEBUG] First matched user:`, JSON.stringify(storagePhoto.matched_users[0]));
                        
                        // Log which exact format is being used in matched_users
                        const firstUser = storagePhoto.matched_users[0];
                        if (firstUser.userId) {
                            console.log(`[DEBUG] Match uses 'userId' format: ${firstUser.userId}`);
                        } else if (firstUser.user_id) {
                            console.log(`[DEBUG] Match uses 'user_id' format: ${firstUser.user_id}`);
                        }
                    }
                    
                    // Check if current user ID is in the matched_users
                    if (user && storagePhoto.matched_users.length > 0) {
                        const currentUserId = user.id;
                        const isUserMatched = storagePhoto.matched_users.some(
                            matchUser => (matchUser.userId === currentUserId || matchUser.user_id === currentUserId)
                        );
                        console.log(`[DEBUG] Current user ${currentUserId} is ${isUserMatched ? '' : 'NOT '}in the matches`);
                    }
                    
                    // Fix for "My Images" tab: Ensure matched_users has all required properties
                    storagePhoto.matched_users = storagePhoto.matched_users.map(user => {
                        // If the matched user doesn't have the expected fields, normalize it
                        if (user) {
                            const userId = user.userId || user.user_id || null;
                            
                            if (userId) {
                                return {
                                    userId: userId,
                                    faceId: user.faceId || user.face_id || null,
                                    fullName: user.fullName || user.full_name || user.name || 'Unknown User',
                                    email: user.email || null,
                                    avatarUrl: user.avatarUrl || user.avatar_url || null,
                                    similarity: user.similarity || user.confidence || 95, // Default high confidence for matches
                                    confidence: user.confidence || user.similarity || 95
                                };
                            }
                        }
                        
                        // Skip null/undefined or invalid user objects
                        console.log(`[DEBUG] Skipping invalid matched user:`, user);
                        return null;
                    }).filter(Boolean); // Remove any null entries
                }
                
                if (!storagePhoto.location) {
                    console.log(`[DEBUG] Adding default 'location' object to photo ${storagePhoto.id}`);
                    storagePhoto.location = { lat: null, lng: null, name: null };
                }
                
                if (!storagePhoto.venue) {
                    console.log(`[DEBUG] Adding default 'venue' object to photo ${storagePhoto.id}`);
                    storagePhoto.venue = { id: null, name: null };
                }
                
                if (!storagePhoto.event_details) {
                    console.log(`[DEBUG] Adding default 'event_details' object to photo ${storagePhoto.id}`);
                    storagePhoto.event_details = { date: null, name: null, type: null };
                }
                
                if (!storagePhoto.tags) {
                    console.log(`[DEBUG] Adding default 'tags' array to photo ${storagePhoto.id}`);
                    storagePhoto.tags = [];
                }
                
                return storagePhoto;
            };
            
            // Apply normalization
            const normalizedPhoto = normalizeStoragePhoto(photo);
            
            return {
                id: normalizedPhoto.id,
                url: normalizedPhoto.url || normalizedPhoto.public_url,
                eventId: normalizedPhoto.event_id || normalizedPhoto.eventId,
                uploadedBy: normalizedPhoto.uploaded_by || normalizedPhoto.uploadedBy,
                created_at: normalizedPhoto.created_at || normalizedPhoto.createdAt || new Date().toISOString(),
                updated_at: normalizedPhoto.updated_at || normalizedPhoto.updatedAt,
                folderPath: normalizedPhoto.folder_path || normalizedPhoto.folderPath,
                folderName: normalizedPhoto.folder_name || normalizedPhoto.folderName,
                fileSize: normalizedPhoto.file_size || normalizedPhoto.fileSize,
                fileType: normalizedPhoto.file_type || normalizedPhoto.fileType,
                faces: normalizedPhoto.faces || [],
                title: normalizedPhoto.title,
                description: normalizedPhoto.description,
                location: normalizedPhoto.location,
                venue: normalizedPhoto.venue,
                tags: normalizedPhoto.tags,
                date_taken: normalizedPhoto.date_taken || normalizedPhoto.dateTaken,
                event_details: normalizedPhoto.event_details || normalizedPhoto.eventDetails,
                matched_users: normalizedPhoto.matched_users || normalizedPhoto.matchedUsers
            };
        });
        
        console.log(`[DEBUG] Transformed ${transformedPhotos.length} photos`);
        
        // Client-side filtering for matches mode
        if (mode === 'matches' && user) {
            console.log('[DEBUG] Applying client-side filtering for matches mode');
            const currentUserId = user.id;
            
            // Use the improved face ID lookup
            let userFaceId = await ensureUserFaceId(currentUserId);
            
            if (userFaceId) {
                console.log('[DEBUG] Using face ID for matching:', userFaceId);
                console.log('[DEBUG] Advanced matching enabled');
                
                // Apply enhanced matching
                transformedPhotos = enhancePhotoMatches(transformedPhotos, currentUserId, userFaceId);
            } else {
                console.log('[DEBUG] No face ID available for enhanced matching');
            }
            
            const matchedPhotos = transformedPhotos.filter(photo => {
                // Include photos where the current user appears in matched_users
                const matchedUsers = photo.matched_users || [];
                
                // Direct match: user ID in matched_users
                const isDirectMatch = matchedUsers.some(match => 
                    (match.userId === currentUserId || match.user_id === currentUserId)
                );
                
                // Face match: either from our enhanced check or direct face ID comparison
                let isFaceMatch = photo._hasFaceMatch === true;
                
                // Double-check face IDs if we have them
                if (!isFaceMatch && userFaceId) {
                    // Check if user's face ID is in photo's face_ids array
                    if (photo.face_ids && Array.isArray(photo.face_ids)) {
                        if (photo.face_ids.includes(userFaceId)) {
                            console.log(`[DEBUG] Found face match via face_ids array in photo ${photo.id}`);
                            isFaceMatch = true;
                        }
                    }
                    
                    // Check if user's face ID is in photo's faces array
                    if (!isFaceMatch && photo.faces && Array.isArray(photo.faces)) {
                        isFaceMatch = photo.faces.some(face => 
                            face.faceId === userFaceId || face.face_id === userFaceId
                        );
                        if (isFaceMatch) {
                            console.log(`[DEBUG] Found face match via faces array in photo ${photo.id}`);
                        }
                    }
                }
                
                if (isDirectMatch) {
                    console.log(`[DEBUG] Found direct match in photo ${photo.id}`);
                }
                
                // Include either direct or face matches
                return isDirectMatch || isFaceMatch;
            });
            
            console.log(`[DEBUG] Found ${matchedPhotos.length} photos matching user ID ${currentUserId} out of ${transformedPhotos.length} total`);
            
            setPhotos(matchedPhotos);
            return matchedPhotos;
        }
        
        setPhotos(transformedPhotos);
        return transformedPhotos;
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
            setIsAdmin(user.user_metadata?.role === 'admin');
            fetchPhotos(); // Fetch photos on mount/user change
            // Remove the schema check
            // checkDatabaseSchema(); 
            // checkFunctions();
        }
    }, [user, mode, eventId]); // Re-fetch when mode or eventId changes
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

    /**
     * Process photos to ensure they match the current mode (uploads or matches)
     * @param {Array} photos - Photos to process
     * @param {string} mode - Current display mode
     * @param {string} currentUserId - Current user ID
     * @param {string} userFaceId - User's face ID
     * @returns {Array} - Filtered and processed photos
     */
    const filterPhotosByMode = (photos, mode, currentUserId, userFaceId) => {
        console.log(`[PHOTO-FILTER] Filtering ${photos.length} photos for mode: ${mode}`);
        
        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            console.log('[PHOTO-FILTER] No photos to filter');
            return [];
        }
        
        // Apply different filtering based on mode
        let filteredPhotos = [...photos];
        
        if (mode === 'matches') {
            console.log(`[PHOTO-FILTER] Applying match filtering with userFaceId: ${userFaceId}`);
            
            // If we don't have a face ID yet, try to get it from the photo metadata
            // This handles the case where userFaceId wasn't properly passed in
            if (!userFaceId) {
                console.log('[PHOTO-FILTER] No userFaceId provided, attempting to extract from photo metadata');
                
                // Try to find the face ID in the photos' metadata
                for (const photo of photos) {
                    if (photo.matched_users && Array.isArray(photo.matched_users)) {
                        const userMatch = photo.matched_users.find(m => 
                            m.userId === currentUserId || m.user_id === currentUserId
                        );
                        
                        if (userMatch && (userMatch.faceId || userMatch.face_id)) {
                            userFaceId = userMatch.faceId || userMatch.face_id;
                            console.log(`[PHOTO-FILTER] Extracted userFaceId from photo metadata: ${userFaceId}`);
                            break;
                        }
                    }
                }
            }
            
            // For 'my photos' tab, show ALL photos with potential matches for user's face
            filteredPhotos = photos.filter(photo => {
                // Log face IDs for debugging
                if (photo.faces && Array.isArray(photo.faces) && photo.faces.length > 0) {
                    const faceIds = photo.faces.map(f => f.faceId || f.face_id).filter(Boolean);
                    if (faceIds.length > 0) {
                        console.log(`[PHOTO-FILTER-DEBUG] Photo ${photo.id} has faces with IDs:`, faceIds);
                    }
                }
                
                // Check 1: Direct user match in matched_users (relaxed confidence threshold)
                if (photo.matched_users && Array.isArray(photo.matched_users)) {
                    const directMatch = photo.matched_users.some(match => {
                        const isUserMatch = match.userId === currentUserId || match.user_id === currentUserId;
                        const hasReasonableConfidence = (match.confidence > 80 || match.similarity > 80);
                        
                        if (isUserMatch && hasReasonableConfidence) {
                            console.log(`[PHOTO-FILTER] Found direct user match in photo ${photo.id} with confidence ${match.confidence || match.similarity}`);
                            return true;
                        }
                        return false;
                    });
                    
                    if (directMatch) return true;
                }
                
                // Check 2: User's face ID match in any structure
                // Try multiple property paths that might contain the face ID
                if (userFaceId) {
                    // Check in face_detection_results
                    if (photo.face_detection_results) {
                        const hasFaceIdMatch = photo.face_detection_results.face_ids && 
                                             Array.isArray(photo.face_detection_results.face_ids) && 
                                             photo.face_detection_results.face_ids.includes(userFaceId);
                        
                        if (hasFaceIdMatch) {
                            console.log(`[PHOTO-FILTER] Found face ID match in face_detection_results for photo ${photo.id}`);
                            return true;
                        }
                    }
                    
                    // Check in faces array
                    if (photo.faces && Array.isArray(photo.faces)) {
                        const exactFaceMatch = photo.faces.some(face => 
                            (face.faceId === userFaceId) || 
                            (face.face_id === userFaceId) ||
                            (face.id === userFaceId)
                        );
                        
                        if (exactFaceMatch) {
                            console.log(`[PHOTO-FILTER] Found exact face ID match in faces array for photo ${photo.id}`);
                            return true;
                        }
                    }
                    
                    // Check in face_ids array
                    if (photo.face_ids && Array.isArray(photo.face_ids)) {
                        if (photo.face_ids.includes(userFaceId)) {
                            console.log(`[PHOTO-FILTER] Found face ID in face_ids array for photo ${photo.id}`);
                            return true;
                        }
                    }
                    
                    // Check in AWS-specific face_matches data structure
                    if (photo.face_matches && Array.isArray(photo.face_matches)) {
                        const faceMatch = photo.face_matches.some(match => 
                            match.Face?.FaceId === userFaceId || 
                            match.matched_face_id === userFaceId
                        );
                        
                        if (faceMatch) {
                            console.log(`[PHOTO-FILTER] Found face ID in AWS face_matches for photo ${photo.id}`);
                            return true;
                        }
                    }
                }
                
                // Check for photo ID in user's matched photos array
                if (matchedPhotoIds && Array.isArray(matchedPhotoIds) && matchedPhotoIds.includes(photo.id)) {
                    console.log(`[PHOTO-FILTER] Found photo ID in user's matched photos list: ${photo.id}`);
                    return true;
                }
                
                // Not a match for this user
                return false;
            });
            
            console.log(`[PHOTO-FILTER] Found ${filteredPhotos.length} photos with matches for user ID: ${currentUserId}`);
        } else if (mode === 'upload') {
            // For uploads, only show photos uploaded by the current user
            filteredPhotos = photos.filter(photo => 
                photo.uploadedBy === currentUserId || 
                photo.uploaded_by === currentUserId
            );
            
            console.log(`[PHOTO-FILTER] Found ${filteredPhotos.length} photos uploaded by user: ${currentUserId}`);
        }
        
        return filteredPhotos;
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
                _jsxs("div", { className: "flex items-center", children: [
                    _jsx("h2", { 
                        className: "text-xl font-semibold text-gray-900 border-b-2 border-blue-500 pb-1", 
                        children: mode === 'matches' ? "Matched Faces" : "My Uploads" 
                    }),
                    mode === 'matches' && _jsx("div", {
                        className: "ml-2 text-blue-600 hover:text-blue-800 cursor-help relative group",
                        children: [
                            _jsx(Info, { className: "w-4 h-4" }),
                            _jsx("div", {
                                className: "absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50 transition-opacity",
                                children: "We match faces based on similarity. These are photos with faces that look similar to yours."
                            })
                        ]
                    })
                ]}),
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
