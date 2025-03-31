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
        try {
            setLoading(true);
            setError(null);
            
            if (!user) return;

            console.log('[DEBUG] Fetching photos...');
            
            let photos = [];
            
            if (mode === 'upload') {
                console.log('[DEBUG] Fetching uploaded photos');
                // Simply query storage bucket directly - most reliable approach
                photos = await fetchFromStorageBucket();
            } else {
                console.log('[DEBUG] Fetching matched photos for user:', user.id);
                
                try {
                    // Try getting user's face ID from face_data table
                    let faceId = null;
                    const { data: faceData, error: faceError } = await supabase
                        .from('face_data')
                        .select('face_id')
                        .eq('user_id', user.id)
                        .single();
                        
                    if (!faceError && faceData && faceData.face_id) {
                        faceId = faceData.face_id;
                        console.log('[DEBUG] Found face ID:', faceId);
                        
                        // DIRECT API APPROACH: Directly call AWS Rekognition without any SQL functions
                        // This works around all the missing SQL functions issues
                        
                        try {
                            console.log('[DIRECT-API] Searching with user face ID:', faceId);
                            
                            // Create FaceIndexingService instance for direct API calls
                            const searchResults = await window.FaceIndexingService.searchFacesByFaceId(faceId, user.id);
                            
                            if (searchResults && searchResults.length > 0) {
                                console.log('[DIRECT-API] Found', searchResults.length, 'matching photos');
                                photos = searchResults;
                            } else {
                                console.log('[DIRECT-API] No matching photos found via direct API');
                            }
                        } catch (directApiError) {
                            console.error('[DIRECT-API] Error using direct API:', directApiError);
                        }
                    } else {
                        console.log('[DEBUG] No face ID found for user. Face registration required.');
                    }
                } catch (err) {
                    console.error('[DEBUG] Error with face ID lookup:', err);
                }
            }
            
            // Show a clear error message if no photos found
            if (!photos || photos.length === 0) {
                if (mode === 'matches') {
                    setError('No matched photos found. This could mean either no one has uploaded photos with your face, or you need to complete face registration.');
                } else {
                    setError('No uploaded photos found. Try uploading a photo first.');
                }
                setPhotos([]);
                setLoading(false);
                return;
            }
            
            // Process any photos we found
            console.log(`[DEBUG] Found ${photos.length} photos, processing...`);
            const processedPhotos = await processPhotos(photos);
            setPhotos(processedPhotos || []);
        } catch (err) {
            console.error('[DEBUG] Error in fetchPhotos:', err);
            setError('Failed to load photos. Please try again.');
            setPhotos([]);
        } finally {
            setLoading(false);
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
