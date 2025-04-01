import { supabase } from '../lib/supabaseClient';
import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { DetectFacesCommand, IndexFacesCommand } from '@aws-sdk/client-rekognition';
import { v4 as uuidv4 } from 'uuid';
import { FaceIndexingService } from './FaceIndexingService';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { validateForTable } from '../utils/databaseValidator';

export class PhotoService {
    // Maximum number of retries for API calls
    static MAX_RETRIES = 3;
    // Delay between retries in ms (will be multiplied by retry number)
    static RETRY_DELAY = 1000;
    
    /**
     * Saves photo data to localStorage as a backup mechanism
     * @param {string} userId - User ID for namespace
     * @param {Object} photoData - Complete photo data object
     * @returns {boolean} - Success or failure
     */
    static saveToLocalStorage(userId, photoData) {
        try {
            // Create a photos cache if it doesn't exist
            const cacheKey = `photos_cache_${userId}`;
            let photosCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            
            // Store this photo data indexed by its ID
            photosCache[photoData.id] = {
                ...photoData,
                cached_at: new Date().toISOString()
            };
            
            // Keep only the newest 50 photos to avoid localStorage size limits
            const photoIds = Object.keys(photosCache);
            if (photoIds.length > 50) {
                // Sort by cached_at date, newest first
                photoIds.sort((a, b) => 
                    new Date(photosCache[b].cached_at) - new Date(photosCache[a].cached_at)
                );
                
                // Keep only the newest 50
                const idsToKeep = photoIds.slice(0, 50);
                const newCache = {};
                idsToKeep.forEach(id => {
                    newCache[id] = photosCache[id];
                });
                
                // Replace with the trimmed cache
                photosCache = newCache;
            }
            
            // Save back to localStorage
            localStorage.setItem(cacheKey, JSON.stringify(photosCache));
            console.log(`[DEBUG] Saved photo ${photoData.id} to local cache (${Object.keys(photosCache).length} photos cached)`);
            return true;
        } catch (error) {
            console.error('[DEBUG] Error saving to local cache:', error);
            return false;
        }
    }
    
    /**
     * Retrieves photo data from localStorage
     * @param {string} userId - User ID for namespace
     * @param {string} photoId - Photo ID to retrieve
     * @returns {Object|null} - Photo data or null if not found
     */
    static getFromLocalStorage(userId, photoId) {
        try {
            const cacheKey = `photos_cache_${userId}`;
            const photosCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            return photosCache[photoId] || null;
        } catch (error) {
            console.error('[DEBUG] Error retrieving from local cache:', error);
            return null;
        }
    }
    
    /**
     * Validates photo data before database insertion
     * @param {Object} photoData - The photo data object
     * @param {File|Blob} file - The file object
     * @param {string} publicUrl - The public URL
     * @returns {Object} - Validated photo data with all required fields
     * @throws {Error} - If validation fails
     */
    static validatePhotoData(photoData, file, publicUrl) {
        // Create a data object with all available fields
        const dataToValidate = {
            ...photoData,
            public_url: publicUrl || photoData.public_url,
            file_size: file?.size || photoData.file_size,
            file_type: file?.type || photoData.file_type || 'image/jpeg'
        };
        
        // Use the generic validator with the photos table schema
        return validateForTable('photos', dataToValidate);
    }

    /**
     * Analyzes a photo for a specific user using multiple fallback methods
     * @param {string} photoId - ID of the photo to analyze 
     * @param {string} userId - ID of the user to compare with
     * @returns {Promise<Object>} - Analysis results with confidence score
     */
    static async analyzePhotoForUser(photoId, userId) {
        try {
            // First try: Use Supabase RPC function that calls our Edge Function
            console.log(`[PhotoService] Attempting to use Supabase RPC for analysis...`);
            try {
                const { supabase } = await import('../lib/supabaseClient');
                
                const { data, error } = await supabase.rpc('match_faces_with_aws_data', {
                    p_photo_id: photoId,
                    p_user_id: userId
                });
                
                if (!error && data?.success) {
                    console.log(`[PhotoService] RPC analysis successful:`, data);
                    return {
                        success: true,
                        confidence: data.similarity,
                        faceDetails: data.face_details,
                        matchCount: data.match_count,
                        method: 'supabase_rpc'
                    };
                }
                
                console.warn(`[PhotoService] RPC analysis failed:`, error || 'No data returned');
                
                // Fall through to next approach if RPC fails
            } catch (rpcError) {
                console.warn(`[PhotoService] RPC analysis error:`, rpcError);
                // Fall through to next approach
            }
            
            // Second try: Use Edge Function endpoint directly
            console.log(`[PhotoService] Attempting to use Edge Function for analysis...`);
            try {
                // Get supabase URL and key from environment
                const { supabase } = await import('../lib/supabaseClient');
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gmupwzjxirpkskolsuix.supabase.co';
                
                // Get the anon key directly from environment or try to find it another way
                let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                // If not available in environment, try to get from localStorage (if browser)
                if (!supabaseKey && typeof localStorage !== 'undefined') {
                    try {
                        const storedKey = localStorage.getItem('supabase.auth.token');
                        if (storedKey) {
                            const parsedToken = JSON.parse(storedKey);
                            supabaseKey = parsedToken?.currentSession?.access_token;
                        }
                    } catch (e) {
                        console.warn('[PhotoService] Error retrieving token from localStorage:', e);
                    }
                }
                
                // Fallback to a hardcoded key - only for development, remove in production!
                if (!supabaseKey) {
                    console.warn('[PhotoService] No Supabase key found, using anonymous session');
                    const { data: { session }, error: authError } = await supabase.auth.getSession();
                    
                    if (authError) {
                        throw new Error(`Auth error: ${authError.message}`);
                    }
                    
                    supabaseKey = session?.access_token;
                }
                
                if (!supabaseKey) {
                    throw new Error('No Supabase key available for authorization');
                }
                
                console.log(`[PhotoService] Calling Edge Function at ${supabaseUrl}/functions/v1/compare-faces`);
                
                const response = await fetch(`${supabaseUrl}/functions/v1/compare-faces`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({ photoId, userId }),
                    credentials: 'include',
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[PhotoService] Edge Function HTTP error ${response.status}:`, errorText);
                    console.error('[PhotoService] Request details:', {
                        url: `${supabaseUrl}/functions/v1/compare-faces`,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + (supabaseKey ? '****' + supabaseKey.substring(supabaseKey.length - 4) : 'undefined')
                        },
                        body: JSON.stringify({ photoId, userId })
                    });
                    throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`);
                }
                
                const result = await response.json();
                console.log(`[PhotoService] Edge Function result:`, result);
                
                if (result.success) {
                    return {
                        success: true,
                        confidence: result.similarity,
                        faceDetails: result.face_details,
                        matchCount: result.match_count,
                        method: 'edge_function'
                    };
                }
                
                throw new Error(result.message || 'Function returned success: false');
            } catch (edgeFunctionError) {
                console.warn(`[PhotoService] Edge Function error:`, edgeFunctionError);
                
                // Log more details about the error for debugging
                if (edgeFunctionError.name === 'TypeError' && edgeFunctionError.message.includes('Failed to fetch')) {
                    console.error('[PhotoService] Network error - likely CORS issue or Function not accessible');
                } else if (edgeFunctionError.message.includes('401')) {
                    console.error('[PhotoService] Authentication error - check your JWT token/API key');
                }
                
                // Fall through to next approach
            }
            
            // Final try: Direct AWS SDK call with error handling
            console.log(`[PhotoService] Attempting direct AWS SDK call for analysis...`);
            try {
                // Load AWS config and SDK
                const { rekognitionClient, COLLECTION_ID } = await import('../config/aws-config');
                const { CompareFacesCommand } = await import('@aws-sdk/client-rekognition');
                
                // 1. Get user's face image
                const { data: faceData } = await supabase
                    .from('face_data')
                    .select('face_data')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                    
                if (!faceData?.face_data?.image_path) {
                    throw new Error('No face image found for user');
                }
                
                // 2. Download face image
                const { data: faceImageData } = await supabase.storage
                    .from('face-data')
                    .download(faceData.face_data.image_path);
                    
                if (!faceImageData) {
                    throw new Error('Failed to download face image');
                }
                
                const faceArrayBuffer = await faceImageData.arrayBuffer();
                const faceBytes = new Uint8Array(faceArrayBuffer);
                
                // 3. Get photo image path
                try {
                    console.log(`[PhotoService] Querying database for photo ID:`, photoId);
                    const { data: photoData, error: photoError } = await supabase
                        .from('photos')
                        .select('storage_path')
                        .eq('id', photoId)
                        .single();
                        
                    if (photoError) {
                        console.error(`[PhotoService] Database query error:`, photoError);
                        throw new Error(`Database error: ${photoError.message}`);
                    }
                    
                    if (!photoData?.storage_path) {
                        console.error(`[PhotoService] No storage path found for photo ID:`, photoId);
                        throw new Error('No storage path found for photo');
                    }
                    
                    console.log(`[PhotoService] Found storage path:`, photoData.storage_path);
                
                    // 4. Download photo image
                    const { data: photoImageData, error: downloadError } = await supabase.storage
                        .from('photos')
                        .download(photoData.storage_path);
                        
                    if (downloadError) {
                        console.error(`[PhotoService] Error downloading photo:`, downloadError);
                        throw new Error(`Failed to download photo: ${downloadError.message}`);
                    }
                    
                    if (!photoImageData) {
                        throw new Error('Failed to download photo image');
                    }
                    
                    const photoArrayBuffer = await photoImageData.arrayBuffer();
                    const photoBytes = new Uint8Array(photoArrayBuffer);
                    
                    // 5. Call AWS Rekognition
                    const command = new CompareFacesCommand({
                        SourceImage: { Bytes: faceBytes },
                        TargetImage: { Bytes: photoBytes },
                        SimilarityThreshold: 70
                    });
                    
                    const response = await rekognitionClient.send(command);
                    
                    if (response.FaceMatches && response.FaceMatches.length > 0) {
                        const bestMatch = response.FaceMatches[0];
                        
                        console.log(`[PhotoService] Direct AWS analysis successful:`, bestMatch);
                        return {
                            success: true,
                            confidence: bestMatch.Similarity / 100,
                            faceDetails: bestMatch.Face,
                            boundingBox: bestMatch.Face.BoundingBox,
                            method: 'direct_aws'
                        };
                    } else {
                        console.log(`[PhotoService] Direct AWS analysis found no matches`);
                        return {
                            success: false,
                            message: 'No face matches found',
                            method: 'direct_aws'
                        };
                    }
                } catch (photoError) {
                    console.error(`[PhotoService] Error handling photo:`, photoError);
                    throw photoError;
                }
            } catch (awsError) {
                console.warn(`[PhotoService] Direct AWS analysis error:`, awsError);
                
                // Fallback: Just indicate failure, don't simulate
                return {
                    success: false,
                    message: `All methods failed. Last error (AWS): ${awsError.message}`,
                    method: 'all_failed'
                };
            }
        } catch (err) {
            console.error(`[PhotoService] All analysis approaches failed:`, err);
            return {
                success: false,
                message: err.message,
                method: 'all_failed'
            };
        }
    }
  
    // Add the rest of your PhotoService class methods here
} 