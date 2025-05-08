import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Calendar, MapPin, Building, Tag, Download, Image, FileType,
         Smile, Eye, Glasses, Sliders, Ruler, Laugh, AlertCircle, Clock, Globe, Link,
         FileImage, ZoomIn, Palette, Database, LayoutGrid, Info, Share2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import FaceStorageService from '../services/FaceStorageService';
import { useAuth } from '../context/AuthContext';
import { movePhotosToTrash } from '../services/userVisibilityService';

/**
 * A modern, iOS-inspired photo information modal
 */
export const SimplePhotoInfoModal = ({ photo, onClose }) => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAnalysisData, setImageAnalysisData] = useState(null);
  const [completePhotoData, setCompletePhotoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageError, setIsImageError] = useState(false);
  const [imageLabels, setImageLabels] = useState(null);
  const [imageProperties, setImageProperties] = useState(null);
  const [topLabels, setTopLabels] = useState(null);
  const [dominantColors, setDominantColors] = useState(null);
  const [foregroundColors, setForegroundColors] = useState(null);
  const [backgroundColors, setBackgroundColors] = useState(null);
  const [imageQuality, setImageQuality] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      // Try to create a Date object from the string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format the date using the browser's locale
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
  };

  // Fetch complete photo data with analysis when the modal opens
  useEffect(() => {
    if (photo?.id) {
      setIsLoading(true);
      
      const fetchCompleteData = async () => {
        console.log(`📊 [SimplePhotoInfoModal] Fetching complete data for photo ${photo.id}`);
        
        // Debug info about incoming photo object
        if (photo) {
          console.log('📊 [SimplePhotoInfoModal] Initial photo object event data:', {
            directEventName: photo.eventName,
            nestedEventName: photo.event_details?.name,
            directVenueName: photo.venueName,
            nestedVenueName: photo.venue?.name,
            directPromoterName: photo.promoterName,
            nestedPromoterName: photo.event_details?.promoter,
            directDate: photo.date,
            nestedDate: photo.event_details?.date,
            externalAlbumLink: photo.externalAlbumLink
          });
        }
        
        try {
          // Get the complete photo data with all analysis
          const completeData = await FaceStorageService.getCompletePhotoData(photo.id);
          console.log(`📊 [SimplePhotoInfoModal] Complete data received:`, completeData);
          
          // Debug: show event info from complete data
          if (completeData) {
            console.log('📊 [SimplePhotoInfoModal] Event data from complete data:', {
              eventName: completeData.eventName,
              venueName: completeData.venueName,
              promoterName: completeData.promoterName,
              date: completeData.date,
              event_details: completeData.event_details,
              venue: completeData.venue,
              externalAlbumLink: completeData.externalAlbumLink
            });
          }
          
          setCompletePhotoData(completeData);
          
          // Check for analysis data directly in the complete data
          processAnalysisData(completeData);
        } catch (error) {
          console.error(`❌ [SimplePhotoInfoModal] Error fetching complete photo data:`, error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCompleteData();
    }
  }, [photo?.id]);
  
  // Process analysis data from the complete photo data
  const processAnalysisData = (data) => {
    if (!data) return;
    
    console.log('🔄 [SimplePhotoInfoModal] Processing analysis data from:', Object.keys(data).filter(key => 
      ['imageLabels', 'imageProperties', 'topLabels', 'dominantColors', 'foregroundColors', 'backgroundColors', 'imageQuality', 'imageAnalysis'].includes(key)
    ));
    
    // Extract analysis data fields
    let labels = null;
    let properties = null;
    let topLabels = null;
    let colors = null;
    let foregroundColors = null;
    let backgroundColors = null;
    let quality = null;
    
    // Check direct properties first
    if (data.imageLabels) {
      console.log('📊 [SimplePhotoInfoModal] Found imageLabels in complete data, type:', typeof data.imageLabels);
      try {
        labels = typeof data.imageLabels === 'string' ? JSON.parse(data.imageLabels) : data.imageLabels;
        console.log('📊 [SimplePhotoInfoModal] Parsed imageLabels:', Array.isArray(labels) ? `Array[${labels.length}]` : typeof labels);
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing imageLabels:', error);
      }
    }
    
    if (data.imageProperties) {
      console.log('📊 [SimplePhotoInfoModal] Found imageProperties in complete data, type:', typeof data.imageProperties);
      try {
        properties = typeof data.imageProperties === 'string' ? JSON.parse(data.imageProperties) : data.imageProperties;
        console.log('📊 [SimplePhotoInfoModal] Parsed imageProperties:', properties ? 'Object' : 'null');
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing imageProperties:', error);
      }
    }
    
    if (data.topLabels) {
      console.log('📊 [SimplePhotoInfoModal] Found topLabels in complete data, type:', typeof data.topLabels);
      try {
        topLabels = typeof data.topLabels === 'string' ? JSON.parse(data.topLabels) : data.topLabels;
        console.log('📊 [SimplePhotoInfoModal] Parsed topLabels:', Array.isArray(topLabels) ? `Array[${topLabels.length}]` : typeof topLabels);
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing topLabels:', error);
      }
    }
    
    if (data.dominantColors) {
      console.log('📊 [SimplePhotoInfoModal] Found dominantColors in complete data, type:', typeof data.dominantColors);
      try {
        colors = typeof data.dominantColors === 'string' ? JSON.parse(data.dominantColors) : data.dominantColors;
        console.log('📊 [SimplePhotoInfoModal] Parsed dominantColors:', Array.isArray(colors) ? `Array[${colors.length}]: ${colors.slice(0,3).join(', ')}...` : typeof colors);
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing dominantColors:', error);
      }
    }
    
    if (data.foregroundColors) {
      console.log('📊 [SimplePhotoInfoModal] Found foregroundColors in complete data, type:', typeof data.foregroundColors);
      try {
        foregroundColors = typeof data.foregroundColors === 'string' ? JSON.parse(data.foregroundColors) : data.foregroundColors;
        console.log('📊 [SimplePhotoInfoModal] Parsed foregroundColors:', Array.isArray(foregroundColors) ? `Array[${foregroundColors.length}]: ${foregroundColors.slice(0,3).join(', ')}...` : typeof foregroundColors);
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing foregroundColors:', error);
      }
    }
    
    if (data.backgroundColors) {
      console.log('📊 [SimplePhotoInfoModal] Found backgroundColors in complete data, type:', typeof data.backgroundColors);
      try {
        backgroundColors = typeof data.backgroundColors === 'string' ? JSON.parse(data.backgroundColors) : data.backgroundColors;
        console.log('📊 [SimplePhotoInfoModal] Parsed backgroundColors:', Array.isArray(backgroundColors) ? `Array[${backgroundColors.length}]: ${backgroundColors.slice(0,3).join(', ')}...` : typeof backgroundColors);
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing backgroundColors:', error);
      }
    }
    
    if (data.imageQuality) {
      console.log('📊 [SimplePhotoInfoModal] Found imageQuality in complete data, type:', typeof data.imageQuality);
      try {
        // Make sure we parse the string if needed
        let quality = typeof data.imageQuality === 'string' ? JSON.parse(data.imageQuality) : data.imageQuality;
        
        // Add more debug info
        console.log('📊 [SimplePhotoInfoModal] Raw imageQuality data:', data.imageQuality);
        console.log('📊 [SimplePhotoInfoModal] Parsed imageQuality:', quality);
        
        // Ensure values are within 0-100 range
        if (quality) {
          // Create a normalized copy with values capped at 100
          quality = {
            brightness: quality.brightness !== undefined ? Math.min(quality.brightness, 100) : undefined,
            sharpness: quality.sharpness !== undefined ? Math.min(quality.sharpness, 100) : undefined,
            contrast: quality.contrast !== undefined ? Math.min(quality.contrast, 100) : undefined
          };
        }
        
        console.log('📊 [SimplePhotoInfoModal] Normalized imageQuality:', quality ? `Object(${Object.keys(quality).join(', ')})` : 'null', 
          quality ? `Values: brightness=${quality.brightness}, sharpness=${quality.sharpness}, contrast=${quality.contrast}` : '');
        
        // Store the normalized quality
        setImageAnalysisData(prevData => ({
          ...prevData,
          imageQuality: quality
        }));
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing imageQuality:', error);
      }
    }
    
    // Store the compiled analysis data
    const analysisData = {
      labels,
      properties,
      topLabels,
      dominantColors: colors,
      foregroundColors,
      backgroundColors,
      imageQuality: quality
    };
    
    // Log what we found
    console.log('📊 [SimplePhotoInfoModal] Analysis data compiled from complete data:', {
      hasLabels: !!analysisData.labels,
      labelCount: analysisData.labels?.length || 0,
      hasProperties: !!analysisData.properties,
      hasTopLabels: !!analysisData.topLabels,
      topLabelCount: analysisData.topLabels?.length || 0,
      hasDominantColors: !!analysisData.dominantColors,
      colorCount: analysisData.dominantColors?.length || 0,
      hasForegroundColors: !!analysisData.foregroundColors,
      foregroundColorCount: analysisData.foregroundColors?.length || 0,
      hasBackgroundColors: !!analysisData.backgroundColors,
      backgroundColorCount: analysisData.backgroundColors?.length || 0,
      hasImageQuality: !!analysisData.imageQuality,
      imageQualityContent: analysisData.imageQuality ? Object.keys(analysisData.imageQuality) : []
    });
    
    setImageAnalysisData(analysisData);
  };

  // Helper function to get uploader name in a user-friendly format
  const getUploaderName = () => {
    // Check for explicit uploader name fields first
    if (safePhoto.uploaderName) return safePhoto.uploaderName;
    if (safePhoto.uploader_name) return safePhoto.uploader_name;
    
    // Check for uploader object fields
    if (safePhoto.uploader) {
      // If uploader is an object with user details
      if (typeof safePhoto.uploader === 'object') {
        // Try to get name in order of preference
        if (safePhoto.uploader.full_name) return safePhoto.uploader.full_name;
        if (safePhoto.uploader.name) return safePhoto.uploader.name;
        if (safePhoto.uploader.username) return safePhoto.uploader.username;
        if (safePhoto.uploader.email) return safePhoto.uploader.email;
        if (safePhoto.uploader.display_name) return safePhoto.uploader.display_name;
      }
      
      // If uploader is a string that looks like an email, use it
      if (typeof safePhoto.uploader === 'string' && safePhoto.uploader.includes('@')) {
        return safePhoto.uploader;
      }
    }
    
    // Check uploaded_by field in the same way
    if (safePhoto.uploaded_by) {
      if (typeof safePhoto.uploaded_by === 'object') {
        if (safePhoto.uploaded_by.full_name) return safePhoto.uploaded_by.full_name;
        if (safePhoto.uploaded_by.name) return safePhoto.uploaded_by.name;
        if (safePhoto.uploaded_by.username) return safePhoto.uploaded_by.username;
        if (safePhoto.uploaded_by.email) return safePhoto.uploaded_by.email;
        if (safePhoto.uploaded_by.display_name) return safePhoto.uploaded_by.display_name;
      }
      
      if (typeof safePhoto.uploaded_by === 'string' && safePhoto.uploaded_by.includes('@')) {
        return safePhoto.uploaded_by;
      }
    }
    
    // Try to use user information if available in the photo itself
    if (photo.user) {
      if (photo.user.name) return photo.user.name;
      if (photo.user.full_name) return photo.user.full_name;
      if (photo.user.email) return photo.user.email;
    }
    
    // Default fallback
    return 'Unknown';
  };

  // Normalize the photo data structure to prevent errors
  const sanitizeImageUrl = (url) => {
    if (!url) return '';
    
    // If it's already an S3 URL, return it
    if (url.includes('.s3.amazonaws.com/')) {
      return url;
    }
    
    // Replace localhost temporary URLs with valid S3 URLs if we can identify the path
    if (url.includes('localhost:3020') || url.includes('/companion/') || 
        url.includes('/dropbox/') || url.includes('/drive/')) {
      
      console.log(`🔄 [SimplePhotoInfoModal] Detected temporary URL: ${url}`);
      
      // Check if we have a proper S3 URL in storage_path
      if (completePhotoData?.storage_path) {
        const bucketName = completePhotoData.bucket_name || 
                          (completePhotoData.storage_path.includes('s3://') ? 
                            completePhotoData.storage_path.split('/')[2] : 'shmong-photos');
        
        const s3Path = completePhotoData.storage_path;
        const s3Url = `https://${bucketName}.s3.amazonaws.com/${s3Path}`;
        
        console.log(`🔄 [SimplePhotoInfoModal] Replacing with S3 URL: ${s3Url}`);
        return s3Url;
      }
    }
    
    // Return the original URL if we couldn't transform it
    return url;
  };

  // Helper function to properly parse matched_users if it's a string
  const parseMatchedUsers = (matchedUsers) => {
    if (!matchedUsers) return [];
    
    // If already an array, return it
    if (Array.isArray(matchedUsers)) {
      return matchedUsers;
    }
    
    // If it's a string (stringified JSON), try to parse it
    if (typeof matchedUsers === 'string') {
      try {
        const parsed = JSON.parse(matchedUsers);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing matched_users string:', error);
        return [];
      }
    }
    
    return [];
  };

  const safePhoto = {
    id: (completePhotoData?.id || photo?.id) || 'unknown',
    url: sanitizeImageUrl(completePhotoData?.url || completePhotoData?.public_url || photo?.url || photo?.public_url),
    title: (completePhotoData?.title || photo?.title) || 'Untitled Photo',
    file_size: (completePhotoData?.file_size || completePhotoData?.fileSize || photo?.file_size || photo?.fileSize) || 0,
    file_type: (completePhotoData?.file_type || completePhotoData?.fileType || photo?.file_type || photo?.fileType) || 'unknown',
    created_at: (completePhotoData?.created_at || photo?.created_at) || new Date().toISOString(),
    faces: Array.isArray(completePhotoData?.faces) ? completePhotoData.faces : (Array.isArray(photo?.faces) ? photo.faces : []),
    
    // Add matched users data with proper parsing
    matched_users: parseMatchedUsers(completePhotoData?.matched_users || photo?.matched_users),
    matched_users_list: Array.isArray(completePhotoData?.matched_users_list) ? 
      completePhotoData.matched_users_list : 
      (Array.isArray(photo?.matched_users_list) ? photo.matched_users_list : 
       parseMatchedUsers(completePhotoData?.matched_users || photo?.matched_users)),
    
    // Add storage path which can be useful for building S3 URLs
    storage_path: completePhotoData?.storage_path || photo?.storage_path || '',
    
    // Add uploader information
    uploader: completePhotoData?.uploader || photo?.uploader || null,
    uploaded_by: completePhotoData?.uploaded_by || photo?.uploaded_by || null,
    uploaderName: completePhotoData?.uploaderName || photo?.uploaderName || 
                 completePhotoData?.uploader_name || photo?.uploader_name || null,
    
    // Enhanced event information handling from all possible sources
    // Direct event fields - flat structure
    eventName: completePhotoData?.eventName || photo?.eventName || '',
    venueName: completePhotoData?.venueName || photo?.venueName || '',
    promoterName: completePhotoData?.promoterName || photo?.promoterName || '',
    date: completePhotoData?.date || photo?.date || null,
    
    // Legacy/nested event fields structure
    event_details: {
      name: completePhotoData?.event_details?.name || photo?.event_details?.name || 
            completePhotoData?.eventName || photo?.eventName || null,
      date: completePhotoData?.event_details?.date || photo?.event_details?.date || 
            completePhotoData?.date || photo?.date || null,
      promoter: completePhotoData?.event_details?.promoter || photo?.event_details?.promoter || 
                completePhotoData?.promoterName || photo?.promoterName || null,
      type: completePhotoData?.event_details?.type || photo?.event_details?.type || null
    },
    
    venue: {
      name: completePhotoData?.venue?.name || photo?.venue?.name || 
            completePhotoData?.venueName || photo?.venueName || null,
      id: completePhotoData?.venue?.id || photo?.venue?.id || null
    },
    
    location: (completePhotoData?.location || photo?.location) || { name: null, lat: null, lng: null, address: null },
    tags: Array.isArray(completePhotoData?.tags) ? completePhotoData.tags : (Array.isArray(photo?.tags) ? photo.tags : []),
    date_taken: completePhotoData?.date_taken || photo?.date_taken,
    externalAlbumLink: (completePhotoData?.externalAlbumLink || completePhotoData?.albumLink || completePhotoData?.album_link ||
                      completePhotoData?.external_album_link || completePhotoData?.external_link || 
                      photo?.externalAlbumLink || photo?.albumLink || photo?.album_link ||
                      photo?.external_album_link || photo?.external_link) || null,
  };

  // Log the normalized data for debugging
  console.log('📋 [SimplePhotoInfoModal] Normalized event data:', {
    eventName: safePhoto.eventName,
    eventDetailsName: safePhoto.event_details?.name,
    venueName: safePhoto.venueName,
    venueDetailsName: safePhoto.venue?.name,
    promoterName: safePhoto.promoterName,
    eventDetailsPromoter: safePhoto.event_details?.promoter,
    date: safePhoto.date,
    eventDetailsDate: safePhoto.event_details?.date
  });

  // Debug log uploader information
  console.log('👤 [SimplePhotoInfoModal] DEBUG UPLOADER INFO:', {
    // Original photo uploader properties
    originalUploaderFromPhoto: photo.uploader,
    originalUploadedByFromPhoto: photo.uploaded_by,
    originalUploaderNameFromPhoto: photo.uploaderName,
    originalUserFromPhoto: photo.user,
    
    // Complete data uploader properties
    completeDataUploader: completePhotoData?.uploader,
    completeDataUploadedBy: completePhotoData?.uploaded_by,
    completeDataUploaderName: completePhotoData?.uploaderName,
    completeDataUser: completePhotoData?.user,
    
    // Safe photo uploader properties after normalization
    safeUploader: safePhoto.uploader,
    safeUploadedBy: safePhoto.uploaded_by,
    safeUploaderName: safePhoto.uploaderName,
    
    // Type information
    uploaderType: typeof safePhoto.uploader,
    uploadedByType: typeof safePhoto.uploaded_by
  });

  // Extract image analysis data when component mounts (fallback approach)
  useEffect(() => {
    console.log('📊 [SimplePhotoInfoModal] Checking for analysis data in photo:', photo?.id);
    
    // Debug dump all keys on photo object
    if (photo) {
      console.log('📊 [SimplePhotoInfoModal] Available properties on photo object:', Object.keys(photo));
      
      // Check for specific analysis properties
      const hasImageLabels = !!photo.imageLabels;
      const hasImageProperties = !!photo.imageProperties;
      const hasTopLabels = !!photo.topLabels;
      const hasDominantColors = !!photo.dominantColors;
      const hasImageQuality = !!photo.imageQuality;
      
      console.log('📊 [SimplePhotoInfoModal] Analysis data present check:', {
        hasImageLabels,
        hasImageProperties,
        hasTopLabels,
        hasDominantColors,
        hasImageQuality
      });
    }
    
    console.log('📊 [SimplePhotoInfoModal] Complete raw photo object:', JSON.stringify(photo, null, 2));
    
    // Search for these types of analysis data
    let labels = null;
    let properties = null;
    let topLabels = null;
    let colors = null;
    let foregroundColors = null;
    let backgroundColors = null;
    let quality = null;
    
    // Direct properties (top level)
    if (photo?.imageLabels) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level imageLabels');
      labels = typeof photo.imageLabels === 'string' ? JSON.parse(photo.imageLabels) : photo.imageLabels;
    }
    
    if (photo?.imageProperties) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level imageProperties');
      properties = typeof photo.imageProperties === 'string' ? JSON.parse(photo.imageProperties) : photo.imageProperties;
    }
    
    if (photo?.topLabels) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level topLabels');
      topLabels = typeof photo.topLabels === 'string' ? JSON.parse(photo.topLabels) : photo.topLabels;
    }
    
    if (photo?.dominantColors) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level dominantColors');
      colors = typeof photo.dominantColors === 'string' ? JSON.parse(photo.dominantColors) : photo.dominantColors;
    }
    
    if (photo?.foregroundColors) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level foregroundColors');
      foregroundColors = typeof photo.foregroundColors === 'string' ? JSON.parse(photo.foregroundColors) : photo.foregroundColors;
    }
    
    if (photo?.backgroundColors) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level backgroundColors');
      backgroundColors = typeof photo.backgroundColors === 'string' ? JSON.parse(photo.backgroundColors) : photo.backgroundColors;
    }
    
    if (photo?.imageQuality) {
      console.log('📊 [SimplePhotoInfoModal] Found top-level imageQuality');
      try {
        // Parse as needed
        let rawQuality = typeof photo.imageQuality === 'string' ? JSON.parse(photo.imageQuality) : photo.imageQuality;
        
        // Debug logs
        console.log('📊 [SimplePhotoInfoModal] Raw fallback imageQuality:', rawQuality);
        
        // Normalize values to 0-100 range
        quality = {
          brightness: rawQuality.brightness !== undefined ? Math.min(rawQuality.brightness, 100) : undefined,
          sharpness: rawQuality.sharpness !== undefined ? Math.min(rawQuality.sharpness, 100) : undefined,
          contrast: rawQuality.contrast !== undefined ? Math.min(rawQuality.contrast, 100) : undefined
        };
        
        console.log('📊 [SimplePhotoInfoModal] Normalized fallback imageQuality:', 
          `Values: brightness=${quality.brightness}, sharpness=${quality.sharpness}, contrast=${quality.contrast}`);
      } catch (error) {
        console.error('❌ [SimplePhotoInfoModal] Error parsing fallback imageQuality:', error);
      }
    }
    
    // Check in faces[0] if we couldn't find at the top level
    if ((!labels || !properties) && photo?.faces && photo.faces.length > 0) {
      const face = photo.faces[0];
      console.log('📊 [SimplePhotoInfoModal] Checking for analysis data in face[0]:', face);
      
      if (!labels && face.imageLabels) {
        console.log('📊 [SimplePhotoInfoModal] Found imageLabels in face[0]');
        labels = typeof face.imageLabels === 'string' ? JSON.parse(face.imageLabels) : face.imageLabels;
      }
      
      if (!properties && face.imageProperties) {
        console.log('📊 [SimplePhotoInfoModal] Found imageProperties in face[0]');
        properties = typeof face.imageProperties === 'string' ? JSON.parse(face.imageProperties) : face.imageProperties;
      }
      
      if (!topLabels && face.topLabels) {
        console.log('📊 [SimplePhotoInfoModal] Found topLabels in face[0]');
        topLabels = typeof face.topLabels === 'string' ? JSON.parse(face.topLabels) : face.topLabels;
      }
      
      if (!colors && face.dominantColors) {
        console.log('📊 [SimplePhotoInfoModal] Found dominantColors in face[0]');
        colors = typeof face.dominantColors === 'string' ? JSON.parse(face.dominantColors) : face.dominantColors;
      }
      
      if (!foregroundColors && face.foregroundColors) {
        console.log('📊 [SimplePhotoInfoModal] Found foregroundColors in face[0]');
        foregroundColors = typeof face.foregroundColors === 'string' ? JSON.parse(face.foregroundColors) : face.foregroundColors;
      }
      
      if (!backgroundColors && face.backgroundColors) {
        console.log('📊 [SimplePhotoInfoModal] Found backgroundColors in face[0]');
        backgroundColors = typeof face.backgroundColors === 'string' ? JSON.parse(face.backgroundColors) : face.backgroundColors;
      }
      
      if (!quality && face.imageQuality) {
        console.log('📊 [SimplePhotoInfoModal] Found imageQuality in face[0]');
        quality = typeof face.imageQuality === 'string' ? JSON.parse(face.imageQuality) : face.imageQuality;
      }
      
      // Check in face.attributes (sometimes analysis data is nested here)
      if ((!labels || !properties) && face.attributes) {
        const attrs = typeof face.attributes === 'string' ? 
          JSON.parse(face.attributes) : face.attributes;
          
        console.log('📊 [SimplePhotoInfoModal] Checking for analysis data in face[0].attributes:', attrs);
        
        if (!labels && attrs.imageLabels) {
          console.log('📊 [SimplePhotoInfoModal] Found imageLabels in face[0].attributes');
          labels = typeof attrs.imageLabels === 'string' ? JSON.parse(attrs.imageLabels) : attrs.imageLabels;
        }
        
        if (!properties && attrs.imageProperties) {
          console.log('📊 [SimplePhotoInfoModal] Found imageProperties in face[0].attributes');
          properties = typeof attrs.imageProperties === 'string' ? JSON.parse(attrs.imageProperties) : attrs.imageProperties;
        }
      }
    }
    
    // Store the analysis data we found (only if we haven't already set it from the complete data)
    if (!imageAnalysisData) {
      const analysisData = {
        labels,
        properties,
        topLabels,
        dominantColors: colors,
        foregroundColors,
        backgroundColors,
        imageQuality: quality
      };
      
      // Log what we found (or didn't)
      console.log('📊 [SimplePhotoInfoModal] Analysis data compiled:', {
        hasLabels: !!analysisData.labels,
        labelCount: analysisData.labels?.length || 0,
        hasProperties: !!analysisData.properties,
        hasTopLabels: !!analysisData.topLabels,
        topLabelCount: analysisData.topLabels?.length || 0,
        hasDominantColors: !!analysisData.dominantColors,
        colorCount: analysisData.dominantColors?.length || 0,
        hasForegroundColors: !!analysisData.foregroundColors,
        foregroundColorCount: analysisData.foregroundColors?.length || 0,
        hasBackgroundColors: !!analysisData.backgroundColors,
        backgroundColorCount: analysisData.backgroundColors?.length || 0,
        hasImageQuality: !!analysisData.imageQuality
      });
      
      setImageAnalysisData(analysisData);
    }
  }, [photo, imageAnalysisData]);

  console.log('[SimplePhotoInfoModal] Using sanitized photo data:', safePhoto);
  
  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Use the URL directly instead of querying the database
      const url = safePhoto.url;
      
      // Check if URL exists
      if (!url) {
        throw new Error('No download URL available');
      }
      
      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${safePhoto.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading photo:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(2) + ' MB';
  };

  // Get complete location string
  const getLocationString = () => {
    const loc = safePhoto.location;
    if (!loc) return null;
    
    // Use address if available
    if (loc.address) return loc.address;
    
    // Use name if available
    if (loc.name && loc.name !== "Unknown Location") return loc.name;
    
    // Use coordinates if available
    if (loc.lat && loc.lng) return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
    
    return null;
  };

  // Check if we have location data to display
  const hasLocationData = () => {
    const loc = safePhoto.location;
    
    // Always show location section, even with minimal data
    return true;
  };

  // Get location name (place name)
  const getLocationName = () => {
    const loc = safePhoto.location;
    if (!loc) return null;
    
    if (loc.name && loc.name !== "Unknown Location") return loc.name;
    return "Unknown Location";
  };

  // Get location address
  const getLocationAddress = () => {
    const loc = safePhoto.location;
    if (!loc) return "No address available";
    
    if (loc.address) return loc.address;
    
    // If no address but we have coordinates, return them formatted
    if (loc.lat && loc.lng) return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
    
    return "No address available";
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Render image analysis section
  const renderImageAnalysis = () => {
    if (isLoading) {
      return (
        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Database size={16} className="mr-2 text-blue-500" />
            Image Analysis
          </h3>
          <div className="flex items-center justify-center p-6">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">Loading analysis data...</span>
          </div>
        </section>
      );
    }
    
    if (!imageAnalysisData) {
      console.log('📊 [SimplePhotoInfoModal] No image analysis data available to render');
      return null;
    }
    
    const { labels, properties, topLabels, dominantColors, imageQuality } = imageAnalysisData;
    
    // Debug what we have to render
    console.log('📊 [SimplePhotoInfoModal] Analysis rendering with:', {
      hasLabels: !!labels,
      labelCount: labels?.length || 0,
      hasProperties: !!properties,
      hasTopLabels: !!topLabels,
      topLabelCount: topLabels?.length || 0,
      hasDominantColors: !!dominantColors,
      colorCount: dominantColors?.length || 0,
      hasImageQuality: !!imageQuality,
      imageQualityValues: imageQuality ? Object.keys(imageQuality) : []
    });
    
    // If we don't have any analysis data, don't render this section
    if (!labels && !properties && !topLabels && !dominantColors && !imageQuality) {
      console.log('📊 [SimplePhotoInfoModal] No specific analysis components to render');
      return null;
    }
    
    console.log('📊 [SimplePhotoInfoModal] Rendering image analysis section with available data');
    
    return (
      <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Database size={16} className="mr-2 text-blue-500" />
          Image Analysis
        </h3>
        
        {/* Display top labels if available */}
        {topLabels && topLabels.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Tag size={14} className="mr-2 text-gray-500" />
              Content Labels
            </h4>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {topLabels.map((label, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                >
                  <Tag size={12} className="mr-1" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Display dominant colors if available */}
        {dominantColors && dominantColors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Palette size={14} className="mr-2 text-gray-500" />
              Dominant Colors
            </h4>
            
            <div className="space-y-3">
              {/* Overall dominant colors */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mr-1 w-full">Overall:</div>
                {dominantColors.map((color, index) => {
                  console.log(`   Color ${index}: ${color}`);
                  return (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm"
                    >
                      <div 
                        className="w-6 h-6 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{color}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Foreground colors */}
              {imageAnalysisData && imageAnalysisData.foregroundColors && imageAnalysisData.foregroundColors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mr-1 w-full">Foreground:</div>
                  {imageAnalysisData.foregroundColors.map((color, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm"
                    >
                      <div 
                        className="w-6 h-6 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{color}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Background colors */}
              {imageAnalysisData && imageAnalysisData.backgroundColors && imageAnalysisData.backgroundColors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mr-1 w-full">Background:</div>
                  {imageAnalysisData.backgroundColors.map((color, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm"
                    >
                      <div 
                        className="w-6 h-6 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{color}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Display image quality metrics if available */}
        {imageQuality && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {imageQuality.sharpness !== undefined && (
              <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center mb-1">
                  <ZoomIn className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sharpness</span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(Math.max(imageQuality.sharpness || 0, 0), 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">
                  {Math.round(Math.min(imageQuality.sharpness || 0, 100))}%
                </span>
              </div>
            )}
            
            {imageQuality.brightness !== undefined && (
              <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center mb-1">
                  <Image className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Brightness</span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full" 
                    style={{ width: `${Math.min(Math.max(imageQuality.brightness || 0, 0), 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">
                  {Math.round(Math.min(imageQuality.brightness || 0, 100))}%
                </span>
              </div>
            )}
            
            {imageQuality.contrast !== undefined && (
              <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center mb-1">
                  <Sliders className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Contrast</span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${Math.min(Math.max(imageQuality.contrast || 0, 0), 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">
                  {Math.round(Math.min(imageQuality.contrast || 0, 100))}%
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Display detailed labels table if available */}
        {labels && labels.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <FileImage className="w-4 h-4 mr-1 text-gray-500" />
              Detailed Labels {labels.length > 40 && `(showing all ${Math.min(labels.length, 40)} of ${labels.length})`}
            </h4>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <table className="w-full text-xs">
                <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left py-1 font-medium">Label</th>
                    <th className="text-right py-1 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.slice(0, 40).map((label, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-1.5 text-gray-900 dark:text-gray-100">{label.Name}</td>
                      <td className="text-right py-1.5 text-gray-700 dark:text-gray-300">
                        {label.Confidence?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500 italic text-center mt-2">
              Analysis powered by SHMONG AI
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderFaceAttributes = () => {
    if (!safePhoto.faces || safePhoto.faces.length === 0) {
      return null; // No faces to analyze
    }
    return (
      <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <User size={16} className="mr-2 text-blue-500" />
          Face Analysis ({safePhoto.faces.length})
        </h3>
        <div className="space-y-4">
          {safePhoto.faces.map((face, index) => {
            // Extract attributes - ensure we have a valid object
            const attrs = face.attributes || {};
            
            // Log what face data we have for debugging
            console.log(`😊 [SimplePhotoInfoModal] Face #${index} data:`, {
              hasAttributes: !!face.attributes,
              attributeKeys: face.attributes ? Object.keys(face.attributes) : [],
              hasEmotions: !!(attrs.emotions || attrs.Emotions),
              hasAge: !!(attrs.age || attrs.Age || attrs.AgeRange),
              hasGender: !!(attrs.gender || attrs.Gender)
            });
            
            // Normalize age data structure which can be in different formats
            let ageRange = null;
            if (attrs.age && (attrs.age.low !== undefined || attrs.age.Low !== undefined)) {
              ageRange = {
                low: attrs.age.low || attrs.age.Low,
                high: attrs.age.high || attrs.age.High
              };
            } else if (attrs.Age && (attrs.Age.Low !== undefined || attrs.Age.Low !== undefined)) {
              ageRange = {
                low: attrs.Age.Low,
                high: attrs.Age.High
              };
            } else if (attrs.AgeRange) {
              ageRange = {
                low: attrs.AgeRange.Low,
                high: attrs.AgeRange.High
              };
            }
            
            // Get primary emotion if available
            let primaryEmotion = "Unknown";
            let emotionConfidence = 0;
            
            if (attrs.emotions && Array.isArray(attrs.emotions) && attrs.emotions.length > 0) {
              const topEmotion = attrs.emotions.sort((a, b) => b.confidence - a.confidence)[0];
              primaryEmotion = topEmotion.type;
              emotionConfidence = topEmotion.confidence;
            } else if (attrs.Emotions && Array.isArray(attrs.Emotions) && attrs.Emotions.length > 0) {
              // Handle capitalized property name variation
              const topEmotion = attrs.Emotions.sort((a, b) => b.Confidence - a.Confidence)[0];
              primaryEmotion = topEmotion.Type;
              emotionConfidence = topEmotion.Confidence;
            }
            
            // Build attribute list
            const attributes = [
              // Basic attributes
              { 
                label: "Age", 
                value: ageRange ? `${ageRange.low} - ${ageRange.high} years` : "Unknown",
                icon: <User size={16} className="text-gray-500" />
              },
              { 
                label: "Gender", 
                value: attrs.gender?.value || attrs.Gender?.Value || "Unknown",
                confidence: attrs.gender?.confidence || attrs.Gender?.Confidence,
                icon: <AlertCircle size={16} className="text-gray-500" />
              },
              
              // Add skin tone if available
              ...(attrs.skinTone ? [{
                label: "Skin Tone", 
                value: "",
                customContent: (
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: attrs.skinTone.skinToneColor }}
                    ></div>
                    <span className="text-sm text-gray-900 dark:text-white font-mono text-xs">
                      {attrs.skinTone.skinToneColor}
                    </span>
                    {attrs.skinTone.skinToneConfidence > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        {Math.round(attrs.skinTone.skinToneConfidence)}%
                      </span>
                    )}
                  </div>
                ),
                icon: <Palette size={16} className="text-gray-500" />
              }] : []),
              
              { 
                label: "Expression", 
                value: primaryEmotion,
                confidence: emotionConfidence,
                icon: <Smile size={16} className="text-gray-500" />
              },
              { 
                label: "Smiling", 
                value: (attrs.smile?.value || attrs.Smile?.Value) ? "Yes" : "No",
                confidence: attrs.smile?.confidence || attrs.Smile?.Confidence,
                icon: <Laugh size={16} className="text-gray-500" />
              },
              { 
                label: "Eyes Open", 
                value: (attrs.eyesOpen?.value !== undefined || attrs.EyesOpen?.Value !== undefined) ? 
                      ((attrs.eyesOpen?.value || attrs.EyesOpen?.Value) ? "Yes" : "No") : "Unknown",
                confidence: attrs.eyesOpen?.confidence || attrs.EyesOpen?.Confidence,
                icon: <Eye size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Mouth Open", 
                value: (attrs.mouthOpen?.value !== undefined || attrs.MouthOpen?.Value !== undefined) ? 
                      ((attrs.mouthOpen?.value || attrs.MouthOpen?.Value) ? "Yes" : "No") : "Unknown",
                confidence: attrs.mouthOpen?.confidence || attrs.MouthOpen?.Confidence,
                icon: <Eye size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Glasses", 
                value: (attrs.eyeglasses?.value !== undefined || attrs.Eyeglasses?.Value !== undefined) ? 
                      ((attrs.eyeglasses?.value || attrs.Eyeglasses?.Value) ? "Yes" : "No") : "Unknown",
                confidence: attrs.eyeglasses?.confidence || attrs.Eyeglasses?.Confidence,
                icon: <Glasses size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Sunglasses", 
                value: (attrs.sunglasses?.value !== undefined || attrs.Sunglasses?.Value !== undefined) ? 
                      ((attrs.sunglasses?.value || attrs.Sunglasses?.Value) ? "Yes" : "No") : "Unknown",
                confidence: attrs.sunglasses?.confidence || attrs.Sunglasses?.Confidence,
                icon: <Glasses size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Beard", 
                value: (attrs.beard?.value !== undefined || attrs.Beard?.Value !== undefined) ? 
                      ((attrs.beard?.value || attrs.Beard?.Value) ? "Yes" : "No") : "Unknown",
                confidence: attrs.beard?.confidence || attrs.Beard?.Confidence,
                icon: <User size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Mustache", 
                value: (attrs.mustache?.value !== undefined || attrs.Mustache?.Value !== undefined) ? 
                      ((attrs.mustache?.value || attrs.Mustache?.Value) ? "Yes" : "No") : "Unknown",
                confidence: attrs.mustache?.confidence || attrs.Mustache?.Confidence,
                icon: <User size={16} className="text-gray-500" />,
                forceShow: true
              }
            ];
            
            // Add image quality if available
            if (attrs.quality && (attrs.quality.brightness !== undefined || attrs.quality.sharpness !== undefined)) {
              // Normalize to 0-100 range
              const normalizedBrightness = attrs.quality.brightness !== undefined ? 
                Math.min(Math.max(attrs.quality.brightness, 0), 100) : undefined;
              const normalizedSharpness = attrs.quality.sharpness !== undefined ? 
                Math.min(Math.max(attrs.quality.sharpness, 0), 100) : undefined;
              
              const brightnessVal = normalizedBrightness !== undefined ? `${Math.round(normalizedBrightness)}%` : "Unknown";
              const sharpnessVal = normalizedSharpness !== undefined ? `${Math.round(normalizedSharpness)}%` : "Unknown";
              
              console.log(`😊 [Face ${index}] Quality values - original: B=${attrs.quality.brightness}, S=${attrs.quality.sharpness} | normalized: B=${normalizedBrightness}, S=${normalizedSharpness}`);
              
              attributes.push({ 
                label: "Image Quality", 
                value: `Brightness: ${brightnessVal}, Sharpness: ${sharpnessVal}`,
                icon: <Sliders size={16} className="text-gray-500" />,
                forceShow: true
              });
            } else if (attrs.Quality) {
              // Alternative Quality structure (uppercase key)
              const quality = attrs.Quality;
              const qualityDetails = [];
              
              // Normalize brightness
              if (quality.Brightness !== undefined) {
                const normalizedBrightness = Math.min(Math.max(quality.Brightness, 0), 100);
                qualityDetails.push(`Brightness: ${Math.round(normalizedBrightness)}%`);
                console.log(`😊 [Face ${index}] Uppercase Quality - original B=${quality.Brightness} | normalized: B=${normalizedBrightness}`);
              }
              
              // Normalize sharpness
              if (quality.Sharpness !== undefined) {
                const normalizedSharpness = Math.min(Math.max(quality.Sharpness, 0), 100);
                qualityDetails.push(`Sharpness: ${Math.round(normalizedSharpness)}%`);
                console.log(`😊 [Face ${index}] Uppercase Quality - original S=${quality.Sharpness} | normalized: S=${normalizedSharpness}`);
              }
              
              if (qualityDetails.length > 0) {
                attributes.push({
                  label: "Image Quality",
                  value: qualityDetails.join(', '),
                  icon: <Sliders size={16} className="text-gray-500" />,
                  forceShow: true
                });
              }
            }
            
            // Add pose information if available
            if (attrs.pose || attrs.Pose) {
              const pose = attrs.pose || attrs.Pose;
              const poseParts = [];
              
              if (pose.Roll !== undefined) poseParts.push(`Roll: ${Math.round(pose.Roll)}°`);
              if (pose.Yaw !== undefined) poseParts.push(`Yaw: ${Math.round(pose.Yaw)}°`);
              if (pose.Pitch !== undefined) poseParts.push(`Pitch: ${Math.round(pose.Pitch)}°`);
              
              const poseString = poseParts.join(', ');
              
              if (poseString) {
                attributes.push({ 
                  label: "Head Pose", 
                  value: poseString,
                  icon: <Ruler size={16} className="text-gray-500" />
                });
              }
            }
            
            // Filter attributes based on user preference - show all 
            const filteredAttributes = attributes.filter(attr => true);
            
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-3 pb-1 border-b border-gray-200 dark:border-gray-700">
                  Face #{index + 1}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredAttributes.map((attr, attrIndex) => (
                    <div key={attrIndex} className="flex items-center">
                      <div className="mr-2">{attr.icon}</div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{attr.label}:</span>
                        {attr.customContent ? attr.customContent : (
                          <>
                            <span className="text-sm text-gray-900 dark:text-white">{attr.value}</span>
                            {attr.confidence > 0 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                {Math.round(attr.confidence)}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Helper function to toggle between image and details view
  const toggleDetailsView = () => {
    setShowDetails(!showDetails);
  };

  // Handle native share action
  const handleShare = async () => {
    if (!navigator.share) {
      console.warn('Web Share API not supported in this browser.');
      alert('Sharing is not supported on this browser.');
      return;
    }
    
    const shareData = {
      title: safePhoto.title || 'Check out this photo!',
      text: `Photo: ${safePhoto.title}`,
      url: safePhoto.url || window.location.href, // Fallback to current page URL
    };
    
    try {
      await navigator.share(shareData);
      console.log('Photo shared successfully!');
    } catch (error) {
      if (error.name !== 'AbortError') { // Don't log error if user cancels
        console.error('Error sharing photo:', error);
        alert(`Error sharing: ${error.message}`);
      } else {
        console.log('Share action cancelled by user.');
      }
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = () => {
    setShowDeleteConfirmation(true);
  };

  // Cancel delete action
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  // Handle delete action (move to trash)
  const handleDelete = async () => {
    if (!user?.id || !safePhoto.id) {
      console.error('Cannot delete photo: Missing user ID or photo ID');
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log(`[SimplePhotoInfoModal] Moving photo ${safePhoto.id} to trash for user ${user.id}`);
      
      const result = await movePhotosToTrash(user.id, [safePhoto.id]);
      
      if (result.success) {
        console.log(`[SimplePhotoInfoModal] Successfully moved photo ${safePhoto.id} to trash`);
        // Close the modal after successful deletion
        setShowDeleteConfirmation(false);
        onClose();
      } else {
        console.error(`[SimplePhotoInfoModal] Error moving photo to trash:`, result.error);
        alert('Failed to move photo to trash. Please try again.');
      }
    } catch (err) {
      console.error(`[SimplePhotoInfoModal] Exception moving photo to trash:`, err);
      alert('An error occurred while deleting the photo. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Section */}
        {!showDetails && (
          <div className="w-full bg-black flex items-center justify-center relative flex-grow min-h-0">
            <img
              src={encodeURI(safePhoto.url)}
              alt={safePhoto.title}
              className={cn(
                "object-contain max-w-full max-h-full transition-opacity duration-300",
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={handleImageLoad}
              onError={(e) => { 
                console.error(`❌ [SimplePhotoInfoModal] Error loading image: ${safePhoto.url}`);
                setIsImageError(true);
                e.target.onerror = null; 
                e.target.src='/placeholder.png'; 
              }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}

        {/* Details Section */}
        {showDetails && (
          <div className="w-full flex flex-col overflow-hidden flex-grow min-h-0">
            {/* Details Header */}
            <div className="relative h-11 flex items-center justify-center border-b border-gray-300/70 dark:border-gray-700/70 flex-shrink-0 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Photo Details</h2>
            </div>

            {/* Scrollable Details Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-800">
              {/* Basic Info Section */}
              <section className="bg-white dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 ml-1">
                  Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Title', value: safePhoto.title, icon: <Image size={16} className="text-gray-500 dark:text-gray-400" /> },
                    { label: 'Date', value: formatDate(safePhoto.date_taken || safePhoto.created_at), icon: <Calendar size={16} className="text-gray-500 dark:text-gray-400" /> },
                    { label: 'File Size', value: formatFileSize(safePhoto.file_size), icon: <FileType size={16} className="text-gray-500 dark:text-gray-400" /> },
                    { label: 'File Type', value: safePhoto.file_type, icon: <FileType size={16} className="text-gray-500 dark:text-gray-400" /> },
                    { label: 'Uploaded', value: formatDate(safePhoto.created_at), icon: <Clock size={16} className="text-gray-500 dark:text-gray-400" /> },
                    {
                      label: 'Uploaded by',
                      value: getUploaderName(),
                      icon: <User size={16} className="text-gray-500 dark:text-gray-400" />
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center p-2.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-md">
                      <div className="mr-2 text-gray-500 dark:text-gray-400">{item.icon}</div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.value || 'Not available'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Event Info Section */}
              <section className="bg-white dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 ml-1">
                  Event Information
                </h3>
                <div className="space-y-3 divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Display information about the event */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {[
                      { 
                        label: 'Event Name', 
                        value: safePhoto.eventName || safePhoto.event_details?.name || 'Not specified', 
                        icon: <Calendar size={16} className="text-gray-500 dark:text-gray-400" />,
                        highlight: !!safePhoto.eventName || !!safePhoto.event_details?.name
                      },
                      { 
                        label: 'Venue', 
                        value: safePhoto.venueName || safePhoto.venue?.name || 'Not specified', 
                        icon: <MapPin size={16} className="text-gray-500 dark:text-gray-400" />,
                        highlight: !!safePhoto.venueName || !!safePhoto.venue?.name
                      },
                      { 
                        label: 'Promoter', 
                        value: safePhoto.promoterName || safePhoto.event_details?.promoter || 'Not specified', 
                        icon: <User size={16} className="text-gray-500 dark:text-gray-400" />,
                        highlight: !!safePhoto.promoterName || !!safePhoto.event_details?.promoter
                      },
                      { 
                        label: 'Date', 
                        value: formatDate(safePhoto.date || safePhoto.event_details?.date || safePhoto.created_at), 
                        icon: <Calendar size={16} className="text-gray-500 dark:text-gray-400" />,
                        highlight: true
                      },
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className={`flex flex-col p-3 ${item.highlight ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'} rounded-lg`}
                      >
                        <div className="flex items-center mb-1">
                          {item.icon}
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">
                            {item.label}
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${item.highlight ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* External Album Link if it exists */}
                  {(safePhoto.externalAlbumLink || safePhoto.albumLink) && (
                    <div className="pt-3">
                      <div className="flex items-center mb-1">
                        <Link size={16} className="text-gray-500 dark:text-gray-400 mr-1" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          External Album
                        </span>
                      </div>
                      <a 
                        href={safePhoto.externalAlbumLink || safePhoto.albumLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline block mt-1 truncate"
                      >
                        {safePhoto.externalAlbumLink || safePhoto.albumLink}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Analysis Section */}
              {renderImageAnalysis()}

              {/* Location Section */}
              {hasLocationData() && (
                <section className="bg-white dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 ml-1">
                    Location
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center">
                      <Building size={18} className="text-gray-500 dark:text-gray-400 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Place Name</p>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{getLocationName()}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center">
                      <MapPin size={18} className="text-gray-500 dark:text-gray-400 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{getLocationAddress()}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Faces Section */}
              {renderFaceAttributes()}

              {/* Tags Section */}
              {safePhoto.tags && safePhoto.tags.length > 0 && (
                <section className="bg-white dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 ml-1">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {safePhoto.tags.map((tag, index) => (
                      <div key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center text-sm">
                        <Tag size={14} className="mr-1" />
                        {tag}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* Top action buttons with Close button only */}
        <div className="absolute top-3 right-3 z-20">
          {/* Close Button - Apple HIG styled */}
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-[#8E8E93]/90 hover:bg-[#8E8E93] text-white transition-colors shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bottom Buttons Toolbar */}
        <div className="p-3 border-t border-gray-300/70 dark:border-gray-700/70 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
          {/* Use grid-cols-2 for mobile, sm:flex for larger screens */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-end gap-2.5"> 
            {/* Details/Image Toggle Button */}
            <button
              onClick={toggleDetailsView}
              className="sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors
                         bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100
                         hover:bg-gray-300/80 dark:hover:bg-gray-600/80
                         flex items-center justify-center"
            >
              {showDetails ? (
                <>
                  <Image className="w-4 h-4 mr-1.5" />
                  Image
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 mr-1.5" />
                  Details
                </>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors
                         bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100
                         hover:bg-gray-300/80 dark:hover:bg-gray-600/80
                         disabled:opacity-50 flex items-center justify-center"
              disabled={!navigator.share}
              title={!navigator.share ? "Sharing not supported on this browser" : "Share this photo"}
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading || !safePhoto.url}
              className="sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors
                         bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100
                         hover:bg-gray-300/80 dark:hover:bg-gray-600/80
                         disabled:opacity-50 flex items-center justify-center"
            >
              {downloading ? (
                <div className="w-5 h-5 mr-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Download
            </button>

            {/* Delete Button - Apple HIG styled (positioned next to Close) */}
            <button
              onClick={confirmDelete}
              className="sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors
                         bg-[#FF3B30] text-white
                         hover:bg-[#FF2D20] active:bg-[#FF453A]
                         flex items-center justify-center"
              aria-label="Delete photo"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </button>
            
            {/* Close Button (Primary Action) */}
            <button
              onClick={onClose}
              className="sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors
                         bg-blue-500 text-white
                         hover:bg-blue-600 active:bg-blue-700
                         flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* iOS-style Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={cancelDelete}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-xl sm:rounded-lg mb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Action Sheet Header */}
              <div className="px-4 py-4 text-center border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Photo</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to move this photo to trash?
                </p>
              </div>
              
              {/* Action Sheet Buttons - iOS style puts destructive actions first */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                <button
                  className="w-full py-3.5 px-4 text-[#FF3B30] font-medium text-sm flex items-center justify-center"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 mr-2 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Photo
                </button>
                <button
                  className="w-full py-3.5 px-4 text-[#007AFF] font-medium text-sm"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimplePhotoInfoModal;
