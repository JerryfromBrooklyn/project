import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { awsPhotoService } from '../services/awsPhotoService';
import { useAuth } from '../context/AuthContext';
import { updatePhotoVisibility } from '../services/userVisibilityService';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';

// Import Uppy and its plugins
import Uppy from '@uppy/core';
import { Dashboard, DashboardModal } from '@uppy/react';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import ImageEditor from '@uppy/image-editor';
import DropboxPlugin from '@uppy/dropbox';
import GoogleDrivePlugin from '@uppy/google-drive';
import UrlPlugin from '@uppy/url';
import XHRUpload from '@uppy/xhr-upload';

// Import Uppy styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';

// Import our new components with proper mobile UX
import Dialog from './ui/Dialog.jsx';
import ImageViewer from './ui/ImageViewer.jsx';
import Button from './ui/Button.jsx';

// Add a debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Create a separate memoized form component to prevent re-renders
const MetadataForm = React.memo(({ 
  metadata, 
  setMetadata, 
  onCancel, 
  onSubmit,
  isValid 
}) => {
  // Use local state for form inputs to prevent parent re-renders
  const [localMetadata, setLocalMetadata] = useState(metadata);
  
  // Update local state on props change
  useEffect(() => {
    setLocalMetadata(metadata);
  }, [metadata]);
  
  // Create a debounced update function
  const debouncedSetMetadata = useRef(
    debounce((newMetadata) => {
      setMetadata(newMetadata);
    }, 300)
  ).current;
  
  // Handle input changes locally first, then debounce the parent update
  const handleInputChange = (field, value) => {
    const newMetadata = { ...localMetadata, [field]: value };
    setLocalMetadata(newMetadata);
    debouncedSetMetadata(newMetadata);
  };
  
  // Handle the submit by passing the local state
  const handleSubmit = () => {
    // Update the parent state one final time synchronously
    setMetadata(localMetadata);
    onSubmit();
  };
  
  return (
    <div className="space-y-6 p-4">
      <div className="bg-blue-50 p-3 rounded-md mb-6">
        <p className="text-center text-blue-700 text-sm">
          Please provide information about these photos
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name*
          </label>
          <input
            type="text"
            value={localMetadata.eventName}
            onChange={(e) => handleInputChange('eventName', e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400"
            placeholder="Enter event name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue Name*
          </label>
          <input
            type="text"
            value={localMetadata.venueName}
            onChange={(e) => handleInputChange('venueName', e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400"
            placeholder="Enter venue name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Promoter Name*
          </label>
          <input
            type="text"
            value={localMetadata.promoterName}
            onChange={(e) => handleInputChange('promoterName', e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400"
            placeholder="Enter promoter name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date*
          </label>
          <input
            type="date"
            value={localMetadata.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Album Link (optional)
        </label>
        <input
          type="url"
          value={localMetadata.albumLink}
          onChange={(e) => handleInputChange('albumLink', e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400"
          placeholder="https://example.com/album"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter a URL to the album or event page
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location (optional)
        </label>
        <input
          type="text"
          value={localMetadata.location?.address || ''}
          onChange={(e) => handleInputChange('location', { address: e.target.value })}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400"
          placeholder="Search for a location..."
        />
      </div>

      <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="px-6 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-6 py-2 text-sm font-medium rounded-md ${isValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-300 text-white cursor-not-allowed'}`}
        >
          Continue Upload
        </Button>
      </div>
    </div>
  );
});

// Add display name for React DevTools
MetadataForm.displayName = 'MetadataForm';

export const PhotoUploader = ({ eventId, onUploadComplete, onError }) => {
  // State variables
  const [uploads, setUploads] = useState([]);
  const [totalStorage, setTotalStorage] = useState(0);
  const [viewMode, setViewMode] = useState({ mode: 'grid', sortBy: 'date' });
  const [folderStructure, setFolderStructure] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [metadata, setMetadata] = useState({
    eventName: '',
    venueName: '',
    promoterName: '',
    date: new Date().toISOString().split('T')[0],
    albumLink: '',
    location: null
  });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uppy, setUppy] = useState(null);
  const [dropboxConfigured, setDropboxConfigured] = useState(false);
  const [googleDriveConfigured, setGoogleDriveConfigured] = useState(false);
  
  // Get auth context
  const { user } = useAuth();

  // Add a proper ref for Uppy instance (for cleanup)
  const uppyRef = useRef(null);

  // Initialize an empty handlers ref (we'll populate it after the handlers are defined)
  const handlersRef = useRef({});

  // Store a flag to track if initialization has already happened
  const initializationCompleteRef = useRef(false);
  
  // Check if this is a remote upload (Dropbox/Google Drive)
  const checkIsRemoteUpload = useCallback((file) => {
    console.log(`🔎 [Uppy] Checking if file is remote:`, {
      id: file.id,
      source: file.source,
      metaSource: file.meta?.source
    });
    
    // Add explicit check for Dropbox IDs which start with "id:"
    const isDropboxId = typeof file.id === 'string' && file.id.startsWith('id:');
    
    return file.source === 'dropbox' || 
           file.source === 'googledrive' ||
           file.meta?.source === 'dropbox' || 
           file.meta?.source === 'googledrive' ||
           isDropboxId;
  }, []);
  
  // Initialize Uppy only once
  useEffect(() => {
    // Only initialize once
    if (initializationCompleteRef.current || uppyRef.current) {
      return;
    }
    
    console.log('🚀 [Uppy] Initializing Uppy instance');
    
    try {
      // Get user info
      const userId = user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '';
      const username = user?.username || JSON.parse(localStorage.getItem('authUser'))?.username || '';
      
      console.log('👤 [Uppy] User info for initialization:', { userId, username });
      
      // Don't append params to base URL as it breaks provider connections
      const companionBaseUrl = import.meta.env.VITE_COMPANION_URL;
      
      const uppyInstance = new Uppy({
        id: 'photo-uploader',
        autoProceed: false,
        restrictions: {
          maxFileSize: 100 * 1024 * 1024, // 100MB
          allowedFileTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.raw', '.cr2', '.nef', '.arw', '.rw2']
        },
        meta: {
          // Get user ID from localStorage
          userId: userId,
          user_id: userId,
          uploadedBy: userId,
          uploaded_by: userId,
          username: username,
          eventId: eventId || '',
          timestamp: Date.now()
        }
      })
      .use(AwsS3Multipart, {
        limit: 5,
        retryDelays: [0, 1000, 3000, 5000],
        companionUrl: companionBaseUrl,
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
          'X-User-Data': JSON.stringify({
            userId: userId,
            username: username
          })
        },
        getChunkSize: () => 10 * 1024 * 1024, // 10MB chunks
        allowedMetaFields: [
          'userId', 'user_id', 'uploadedBy', 'uploaded_by', 
          'username', 'eventId', 'folderPath', 'timestamp',
          'eventName', 'venueName', 'promoterName', 'date', 'albumLink',
          'location', 'event_details', 'venue', 'promoter', 'externalAlbumLink',
          'title', 'description', 'tags', 'isPrivate', 'source'
        ],
        metadata: {
          userId: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
          user_id: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
          uploadedBy: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
          uploaded_by: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
          username: user?.username || JSON.parse(localStorage.getItem('authUser'))?.username || ''
        },
        getUploadParameters: async (file) => {
          console.log('📤 [Uppy] Getting upload parameters for file:', file.name);
          console.log('🔑 [Uppy] File metadata before upload:', JSON.stringify(file.meta));
          
          try {
            const fileData = new File([file.data], file.name, { type: file.type });
            
            // Make sure user info is available
            console.log('👤 [Uppy] Current user info:', {
              id: user?.id || 'not set',
              username: user?.username || 'not set',
              localStorage: {
                userId: JSON.parse(localStorage.getItem('authUser'))?.id || 'not in localStorage',
                username: JSON.parse(localStorage.getItem('authUser'))?.username || 'not in localStorage'
              }
            });
            
            // Ensure metadata is set for this specific file (may be needed if file.meta is missing some fields)
            if (!file.meta.userId && !file.meta.user_id) {
              console.log('⚠️ [Uppy] Adding missing user ID to file metadata');
              uppy.setFileMeta(file.id, {
                userId: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
                user_id: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
                uploadedBy: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
                uploaded_by: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
                username: user?.username || JSON.parse(localStorage.getItem('authUser'))?.username || ''
              });
            }
            
            const uploadMetadata = {
              ...metadata,
              ...file.meta, // Include the file's own metadata
              userId: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '', // Add userId explicitly
              user_id: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
              uploadedBy: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
              uploaded_by: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
              username: user?.username || JSON.parse(localStorage.getItem('authUser'))?.username || '',
              externalAlbumLink: metadata.albumLink || ''
            };

            console.log('📤 [Uppy] Sending metadata to companion:', JSON.stringify(uploadMetadata));

            const result = await awsPhotoService.uploadPhoto(fileData, eventId, file.meta?.folderPath || '', uploadMetadata);

            if (!result.success) {
              console.error('❌ [Uppy] Failed to get upload parameters:', result.error);
              throw new Error(result.error || 'Failed to get upload parameters');
            }

            return {
              method: 'PUT',
              url: result.s3Url || '',
              fields: {},
              headers: {},
            };
          } catch (error) {
            console.error('❌ [Uppy] Error getting upload parameters:', error);
            throw error;
          }
        },
      })
      .use(ImageEditor, {
        quality: 0.9,
        cropperOptions: {
          viewMode: 1,
          background: false,
          autoCropArea: 1,
          responsive: true
        }
      });

      // Initialize Dropbox plugin with proper configuration
      uppyInstance.use(DropboxPlugin, {
        companionUrl: companionBaseUrl,
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
          'X-User-Data': JSON.stringify({
            userId: userId,
            username: username
          })
        },
        companionAllowedHosts: [import.meta.env.VITE_COMPANION_URL],
        // Add metadata for all files from Dropbox
        metaFields: [
          { id: 'userId', name: 'userId', getValue: () => userId },
          { id: 'user_id', name: 'user_id', getValue: () => userId },
          { id: 'uploadedBy', name: 'uploadedBy', getValue: () => userId },
          { id: 'uploaded_by', name: 'uploaded_by', getValue: () => userId },
          { id: 'username', name: 'username', getValue: () => username },
          { id: 'eventId', name: 'eventId', getValue: () => eventId || '' },
          { id: 'timestamp', name: 'timestamp', getValue: () => Date.now() }
        ],
        locale: {
          strings: {
            // Add any custom strings here
          }
        },
        socketOptions: {
          query: {
            userId: userId,
            username: username
          }
        },
        oauth: {
          transport: 'session',
          domain: import.meta.env.VITE_COMPANION_URL
        }
      });

      // Add socket event listeners for upload completion
      if (uppyInstance.getPlugin('DropboxPlugin')?.socket) {
        const socket = uppyInstance.getPlugin('DropboxPlugin').socket;
        
        socket.on('upload-processed', (data) => {
          console.log('📤 [Uppy] Upload processed event received:', data);
          
          if (data.success) {
            console.log('✅ [Uppy] Remote upload successfully processed on server');
            
            // Update the matching upload with the complete data
            setUploads(prev => prev.map(upload => {
              // Improved matching logic
              const isMatch = (
                // Direct ID match from data.uploadId (new improved method)
                (data.uploadId && upload.id === data.uploadId) ||
                // Direct photo ID match (if available)
                (data.photoId && upload.id === data.photoId) || 
                // Match by storage path (fallback)
                (data.photoMetadata?.storage_path && upload.photoDetails?.url && 
                 upload.photoDetails.url.includes(data.photoMetadata.storage_path))
              );
              
              if (isMatch) {
                console.log(`✅ [Uppy] Updating UI for processed upload: ${upload.id}`);
                
                // NEW: Ensure we save this metadata to the database properly
                if (data.photoMetadata) {
                  console.log(`🌟 [DATABASE] Ensuring socket-processed upload is saved to database for ${upload.id}`);
                  
                  // Make sure the source field is set correctly for remote uploads
                  const enhancedMetadata = {
                    ...data.photoMetadata,
                    source: upload.source || data.photoMetadata.source || 'remote',
                    user_id: data.photoMetadata.user_id || user?.id,
                    uploaded_by: data.photoMetadata.uploaded_by || user?.id
                  };
                  
                  // Add a debug log to show the exact metadata being sent to the database
                  console.log(`🌟 [DATABASE] Saving metadata to database:`, JSON.stringify(enhancedMetadata, null, 2));
                  
                  // Save the metadata to ensure it's in the database
                  awsPhotoService.savePhotoMetadata(enhancedMetadata)
                    .then(result => {
                      if (result.success) {
                        console.log(`🌟 [DATABASE] SUCCESS: Saved socket-processed metadata to database: ${upload.id}`);
                      } else {
                        console.error(`🌟 [DATABASE] ERROR: Failed to save socket-processed metadata: ${result.error}`);
                      }
                    })
                    .catch(error => {
                      console.error(`🌟 [DATABASE] ERROR: Error saving socket-processed metadata:`, error);
                    });
                }
                
                return {
                  ...upload,
                  status: 'complete',
                  progress: 100,
                  photoDetails: {
                    ...upload.photoDetails,
                    ...data.photoMetadata,
                    id: data.photoId || upload.photoDetails?.id || upload.id,
                    user_id: data.photoMetadata?.user_id || upload.photoDetails?.user_id || user?.id,
                    userId: data.photoMetadata?.userId || upload.photoDetails?.userId || user?.id,
                    uploaded_by: data.photoMetadata?.uploaded_by || upload.photoDetails?.uploaded_by || user?.id,
                    uploadedBy: data.photoMetadata?.uploadedBy || upload.photoDetails?.uploadedBy || user?.id,
                    source: upload.source || data.photoMetadata?.source || 'remote',
                    matched_users: data.photoMetadata?.matched_users || upload.photoDetails?.matched_users || []
                  }
                };
              }
              return upload;
            }));
            
            // Trigger final completion after all updates are done
            setTimeout(finalizeUpload, 500);
          } else {
            console.error('❌ [Uppy] Upload processing failed:', data.error);
            // Only update error status if not already complete
            setUploads(prev => prev.map(upload => {
              if (upload.id === data.photoId && upload.status !== 'complete') {
                return {
                  ...upload,
                  status: 'error',
                  error: data.error
                };
              }
              return upload;
            }));
          }
        });
      }

      // Initialize Google Drive plugin
      uppyInstance.use(GoogleDrivePlugin, {
        companionUrl: companionBaseUrl,
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
          'X-User-Data': JSON.stringify({
            userId: userId,
            username: username
          })
        },
        companionAllowedHosts: [import.meta.env.VITE_COMPANION_URL],
        // Add metadata for all files from Google Drive
        metaFields: [
          { id: 'userId', name: 'userId', getValue: () => userId },
          { id: 'user_id', name: 'user_id', getValue: () => userId },
          { id: 'uploadedBy', name: 'uploadedBy', getValue: () => userId },
          { id: 'uploaded_by', name: 'uploaded_by', getValue: () => userId },
          { id: 'username', name: 'username', getValue: () => username },
          { id: 'eventId', name: 'eventId', getValue: () => eventId || '' },
          { id: 'timestamp', name: 'timestamp', getValue: () => Date.now() }
        ],
        locale: {
          strings: {
            // Add any custom strings here
          }
        },
        socketOptions: {
          query: {
            userId: userId,
            username: username
          }
        },
        oauth: {
          transport: 'session',
          domain: import.meta.env.VITE_COMPANION_URL,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: ['https://www.googleapis.com/auth/drive.readonly'],
          responseType: 'token',
          redirectUri: `${window.location.origin}/oauth/callback`
        }
      });

      // Initialize URL plugin
      uppyInstance.use(UrlPlugin, {
        companionUrl: companionBaseUrl, // Use the base URL without query params
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
          'X-User-Data': JSON.stringify({
            userId: userId,
            username: username
          })
        },
        companionAllowedHosts: [import.meta.env.VITE_COMPANION_URL],
        // Add metadata for all files from URL
        metaFields: [
          { id: 'userId', name: 'userId', getValue: () => userId },
          { id: 'username', name: 'username', getValue: () => username }
        ],
        locale: {
          strings: {
            // Add any custom strings here
          }
        },
      });

      // Add authentication to socket connection
      uppyInstance.on('connect', (target) => {
        console.log('🔌 [Uppy] Socket connected to', target);
        
        // Send auth data through socket connection
        if (uppyInstance.getPlugin('DropboxPlugin')?.socket || 
            uppyInstance.getPlugin('GoogleDrivePlugin')?.socket) {
          try {
            console.log('🔑 [Uppy] Sending auth data via socket connection');
            const socket = uppyInstance.getPlugin('DropboxPlugin')?.socket || 
                          uppyInstance.getPlugin('GoogleDrivePlugin')?.socket;
            
            if (socket && socket.emit) {
              // Make sure we have robust user data to send
              const authData = {
                userId: userId,
                user_id: userId, // Send both formats to be safe
                uploadedBy: userId,
                uploaded_by: userId,
                username: username,
                eventId: eventId || '',
                timestamp: Date.now(),
                ...metadata
              };
              
              // Send the auth data to the server
              console.log('📤 [Uppy] Emitting auth event with data:', authData);
              socket.emit('auth', authData);
              
              // Listen for auth response
              socket.on('auth-response', (response) => {
                if (response.success) {
                  console.log('✅ [Uppy] Socket authentication successful');
                } else {
                  console.error('❌ [Uppy] Socket authentication failed:', response.error);
                }
              });
              
              // ENHANCED LOGGING: Enhanced socket event handling for upload-processed events
              socket.on('upload-processed', (data) => {
                console.log('%c📤 [Uppy] UPLOAD PROCESSED EVENT RECEIVED:', 'background: #00c853; color: white; font-weight: bold; padding: 3px 5px; border-radius: 4px;');
                console.log('%c- Upload ID: ' + (data.uploadId || 'unknown'), 'color: #00c853; font-weight: bold;');
                console.log('%c- Photo ID: ' + (data.photoId || 'unknown'), 'color: #00c853; font-weight: bold;');
                console.log('%c- Success: ' + (data.success ? 'YES' : 'NO'), 'color: #00c853; font-weight: bold;');
                console.log('%c- Explicit Processing: ' + (data.explicitProcessing ? 'YES' : 'NO'), 'color: #00c853; font-weight: bold;');
                console.log('%c- Full Response:', 'color: #00c853; font-weight: bold;', data);
                if (data.photoMetadata) {
                  console.log('%c🧠 [Uppy] Rekognition Face Data:', 'background: #ffd600; color: #222; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data.photoMetadata.faces);
                  console.log('%c🔗 [Uppy] Matched Users:', 'background: #00b8d4; color: #fff; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data.photoMetadata.matched_users, data.photoMetadata.matched_users_list);
                }
                
                if (data.success) {
                  console.log('%c✅ [Uppy] Remote upload successfully processed on server', 'background: #00c853; color: white; padding: 2px 5px; border-radius: 3px;');
                  
                  // Update the matching upload with the complete data
                  setUploads(prev => prev.map(upload => {
                    // Improved matching logic
                    const isMatch = (
                      // Direct ID match from data.uploadId (new improved method)
                      (data.uploadId && upload.id === data.uploadId) ||
                      // Direct photo ID match (if available)
                      (data.photoId && upload.id === data.photoId) || 
                      // Match by storage path (fallback)
                      (data.photoMetadata?.storage_path && upload.photoDetails?.url && 
                       upload.photoDetails.url.includes(data.photoMetadata.storage_path))
                    );
                    
                    if (isMatch) {
                      console.log(`%c✅ [Uppy] Updating UI for processed upload: ${upload.id}`, 'background: #00c853; color: white; padding: 2px 5px; border-radius: 3px;');
                      return {
                        ...upload,
                        status: 'complete',
                        progress: 100,
                        photoDetails: {
                          ...upload.photoDetails,
                          ...data.photoMetadata,
                          id: data.photoId || upload.photoDetails?.id || upload.id,
                          user_id: data.photoMetadata?.user_id || upload.photoDetails?.user_id,
                          userId: data.photoMetadata?.userId || upload.photoDetails?.userId,
                          matched_users: data.photoMetadata?.matched_users || upload.photoDetails?.matched_users || [],
                          matched_users_list: data.photoMetadata?.matched_users_list || upload.photoDetails?.matched_users_list || [],
                          faces: data.photoMetadata?.faces || upload.photoDetails?.faces || []
                        }
                      };
                    }
                    return upload;
                  }));
                  
                  // Trigger final completion after all updates are done
                  setTimeout(finalizeUpload, 500);
                } else {
                  console.error('%c❌ [Uppy] Upload processing failed:', 'background: #d50000; color: white; padding: 2px 5px; border-radius: 3px;', data.error);
                  
                  // Update error status for relevant uploads
                  setUploads(prev => prev.map(upload => {
                    // Improved matching logic
                    const isMatch = (
                      // Direct ID match (new improved method)
                      (data.uploadId && upload.id === data.uploadId) ||
                      // Fallback to finding the most recent incomplete upload
                      (!data.uploadId && upload.status !== 'complete' && upload.status !== 'error')
                    );
                    
                    if (isMatch) {
                      console.log('%c⚠️ [Uppy] Marking upload as failed:', 'background: #ff6d00; color: white; padding: 2px 5px; border-radius: 3px;', upload.id);
                      return {
                        ...upload,
                        status: 'error',
                        error: data.error || 'Upload processing failed'
                      };
                    }
                    return upload;
                  }));
                }
              });
              
              // ENHANCED LOGGING: Listen for global upload events (in case the original socket disconnects)
              socket.on('global-upload-processed', (data) => {
                console.log('%c🌐 [Uppy] GLOBAL UPLOAD PROCESSED EVENT RECEIVED:', 'background: #0091ea; color: white; font-weight: bold; padding: 3px 5px; border-radius: 4px;', data);
                
                // Only process if it matches our user ID
                if (data.userId === userId) {
                  setUploads(prev => prev.map(upload => {
                    const isMatch = (
                      (data.uploadId && upload.id === data.uploadId) ||
                      (upload.source === 'dropbox' || upload.source === 'googledrive')
                    );
                    
                    if (isMatch && upload.status !== 'complete') {
                      console.log(`%c✅ [Uppy] Updating UI from global event for upload: ${upload.id}`, 'background: #00c853; color: white; padding: 2px 5px; border-radius: 3px;');
                      
                      // Force refresh photos to make sure we get this upload
                      setTimeout(() => {
                        if (onUploadComplete) {
                          console.log('%c[PhotoUploader] Forcing refresh from global event', 'background: #0091ea; color: white; padding: 2px 5px; border-radius: 3px;');
                          onUploadComplete(true);
                        }
                      }, 1000);
                      
                      return {
                        ...upload,
                        status: 'complete',
                        progress: 100,
                        photoDetails: {
                          ...upload.photoDetails,
                          id: data.photoId || upload.photoDetails?.id,
                          s3Path: data.s3Path
                        }
                      };
                    }
                    return upload;
                  }));
                }
              });
            }
          } catch (error) {
            console.error('❌ [Uppy] Error sending auth via socket:', error);
          }
        }
      });

      // For all remote source files, make sure they have user info
      uppyInstance.on('file-added', (file) => {
        console.log(`📄 [Uppy] File added from source ${file.source || 'local'}:`, file.name);
        
        // Set metadata for all files, regardless of source
        const fileMeta = {
          userId: userId,
          user_id: userId,
          uploadedBy: userId,
          uploaded_by: userId,
          username: username,
          eventId: eventId || '',
          timestamp: Date.now(),
          ...metadata,
          source: file.source || 'local'
        };
        
        console.log('🔖 [Uppy] Setting metadata for file:', JSON.stringify(fileMeta));
        uppyInstance.setFileMeta(file.id, fileMeta);
        
        // For remote files (Dropbox/Google Drive), ensure we have the preview
        const isRemoteFile = file.source === 'dropbox' || file.source === 'googledrive' || 
                             (typeof file.id === 'string' && file.id.startsWith('id:'));
                             
        if (isRemoteFile) {
          console.log(`🌟 [DATABASE] Remote file detected from ${file.source}. Will ensure database entry is created.`);
          
          // Set preview if available
          if (file.thumbnail) {
            file.preview = file.thumbnail;
          } else if (file.remote && file.remote.url) {
            file.preview = file.remote.url;
          }
          
          // NEW: Track the remote upload for special handling
          const remoteUploadsKey = `remote_uploads_${userId}`;
          try {
            let remoteUploads = JSON.parse(localStorage.getItem(remoteUploadsKey) || '[]');
            remoteUploads.push({
              id: file.id,
              source: file.source,
              name: file.name,
              timestamp: Date.now(),
              userId: userId
            });
            localStorage.setItem(remoteUploadsKey, JSON.stringify(remoteUploads));
            console.log(`🌐 [Uppy] Tracking remote upload from ${file.source}: ${file.name} with ID ${file.id}`);
          } catch (error) {
            console.error('❌ [Uppy] Error saving remote upload tracking data:', error);
          }
          
          // NEW: Set up a fallback save to database even before upload completes
          // This ensures metadata is saved to database regardless of socket status
          try {
            // Only do this for Dropbox and Google Drive files
            setTimeout(() => {
              // Basic metadata for the file
              const basicMetadata = {
                id: file.id,
                user_id: userId,
                userId: userId,
                uploadedBy: userId,
                uploaded_by: userId,
                username: username,
                source: file.source,
                url: file.thumbnail || file.preview || '',
                public_url: file.thumbnail || file.preview || '',
                file_size: file.size || 0,
                file_type: file.type || 'image/jpeg',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                storage_path: `photos/${userId}/${file.source}/${file.id}`,
                // Include event metadata if available
                ...metadata,
                // Empty arrays for faces and matches
                faces: [],
                matched_users: []
              };
              
              console.log(`🌟 [DATABASE] Setting up fallback save to database for ${file.id} from ${file.source}`);
              
              // Wait a bit to ensure upload process has started
              setTimeout(() => {
                // Check if this file is still in Uppy
                if (uppyInstance.getFile(file.id)) {
                  console.log(`🌟 [DATABASE] Fallback saving metadata to database for ${file.id}`);
                  
                  awsPhotoService.savePhotoMetadata(basicMetadata)
                    .then(result => {
                      if (result.success) {
                        console.log(`🌟 [DATABASE] SUCCESS: Fallback metadata save successful for ${file.id}`);
                      } else {
                        console.warn(`🌟 [DATABASE] WARNING: Fallback metadata save failed: ${result.error}`);
                      }
                    })
                    .catch(error => {
                      console.error(`🌟 [DATABASE] ERROR: Fallback metadata save exception:`, error);
                    });
                } else {
                  console.log(`🌟 [DATABASE] File ${file.id} no longer in Uppy, skipping fallback save`);
                }
              }, 10000); // Wait 10 seconds to ensure upload has had time to start
            }, 2000); // Small delay to ensure proper setup
          } catch (fallbackError) {
            console.error('❌ [DATABASE] Error setting up fallback database save:', fallbackError);
          }
        }
      });

      // Add listeners using the refs
      uppyInstance.on('file-added', handlersRef.current.handleFileAdded);
      uppyInstance.on('file-removed', handlersRef.current.handleFileRemoved);
      uppyInstance.on('upload-progress', handlersRef.current.handleUploadProgress);
      uppyInstance.on('complete', handlersRef.current.handleBatchComplete);
      uppyInstance.on('error', handlersRef.current.handleUploadError);

      // Save to both ref and state
      uppyRef.current = uppyInstance;
      
      // Set the state in a way that doesn't trigger re-renders during initialization
      setUppy(uppyInstance);
      
      // Mark initialization as complete
      initializationCompleteRef.current = true;
      
      console.log('✅ [Uppy] Initialization complete');
    } catch (error) {
      console.error('❌ [Uppy] Error initializing Uppy:', error);
    }
    
    // Proper cleanup function
    return () => {
      console.log('🧹 [Uppy] Cleaning up Uppy instance');
      
      if (uppyRef.current) {
        try {
          const instance = uppyRef.current;
          
          // Save any complete uploads to prevent loss of upload state
          const completedUploads = instance.getFiles()
            .filter(f => f.progress?.uploadComplete)
            .map(f => ({
              id: f.id,
              status: 'complete',
              photoDetails: f.response?.body || {},
              progress: 100,
              file: f.data
            }));
            
          // If we have completed uploads, trigger a final callback
          if (completedUploads.length > 0 && onUploadComplete) {
            console.log(`[PhotoUploader] Final cleanup with ${completedUploads.length} completed uploads.`);
            onUploadComplete();
          }
          
          // Remove all event listeners
          instance.off('file-added', handlersRef.current.handleFileAdded);
          instance.off('file-removed', handlersRef.current.handleFileRemoved);
          instance.off('upload-progress', handlersRef.current.handleUploadProgress);
          instance.off('complete', handlersRef.current.handleBatchComplete);
          instance.off('error', handlersRef.current.handleUploadError);
          
          // Only call reset if it exists
          if (typeof instance.reset === 'function') {
            instance.reset();
          }
          
          // Only call destroy if it exists
          if (typeof instance.destroy === 'function') {
            instance.destroy();
          }
        } catch (cleanupError) {
          console.error('❌ [Uppy] Error during cleanup:', cleanupError);
        }
        
        // Reset refs
        uppyRef.current = null;
        initializationCompleteRef.current = false;
      }
    };
  }, []);

  // Update Uppy metadata when user or event changes
  useEffect(() => {
    if (uppyRef.current && (user?.id || eventId)) {
      console.log('🔄 [Uppy] Updating global metadata with user/event info:', {
        userId: user?.id,
        eventId: eventId,
        username: user?.username
      });
      
      uppyRef.current.setMeta({
        userId: user?.id || '',
        user_id: user?.id || '',
        uploadedBy: user?.id || '',
        uploaded_by: user?.id || '',
        username: user?.username || '',
        eventId: eventId || '',
        ...metadata
      });
    }
  }, [user?.id, user?.username, eventId, metadata]);

  // Ensure handleFileAdded, handleFileRemoved, etc. are defined with useCallback or outside the component
  const handleFileAdded = useCallback((file) => {
    if (!file) {
      console.error('❌ [Uppy] handleFileAdded: No file object provided');
      return;
    }

    console.log('📎 [Uppy] File added:', {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      source: file.source
    });

    setTotalStorage(prev => prev + (file.size || 0));
    
    // Create a file object that works for both local and companion files
    const fileObject = {
      id: file.id,
      file: {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        preview: file.preview || (file.data ? URL.createObjectURL(file.data) : null),
        source: file.source || file.meta?.source || 'local' // Add source to file object itself
      },
      progress: 0,
      status: 'pending',
      metadata: { ...metadata },
      folderPath: file.meta?.folderPath || null,
      error: null,
      photoDetails: null,
      source: file.source || file.meta?.source || 'local'
    };

    // For remote files (Dropbox/Google Drive), ensure we have the preview
    if (file.source && (file.source === 'dropbox' || file.source === 'googledrive')) {
      // If we have a thumbnail URL, use it as preview
      if (file.thumbnail) {
        fileObject.file.preview = file.thumbnail;
      }
      // If we have a remote URL, use it as preview
      else if (file.remote && file.remote.url) {
        fileObject.file.preview = file.remote.url;
      }
    }

    setUploads(prev => [...prev, fileObject]);
  }, [metadata]);

  const handleFileRemoved = useCallback((file) => {
    if (!file) {
      console.error('❌ [Uppy] handleFileRemoved: No file object provided');
      return;
    }
    console.log('🗑️ [Uppy] File removed:', { id: file.id, name: file.name });
    setTotalStorage(prev => Math.max(0, prev - (file.size || 0))); // Prevent negative storage
    setUploads(prev => prev.filter(upload => upload.id !== file.id));
  }, []); // No dependencies needed

  const handleUploadProgress = useCallback((file, progress) => {
    if (!file || !progress) {
        console.error('❌ [Uppy] handleUploadProgress: Missing file or progress object');
        return;
    }
    // console.log('📊 [Uppy] Upload progress:', { file: file.name, progress: progress.bytesUploaded / progress.bytesTotal * 100 });
    const { bytesUploaded, bytesTotal } = progress;
    const progressPercentage = bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0;
    
    setUploads(prev => prev.map(upload => 
      upload.id === file.id 
        ? { ...upload, progress: progressPercentage, status: 'uploading' }
        : upload
    ));
  }, []); // No dependencies needed

  const handleUploadError = useCallback((file, error, response) => {
     if (!file) {
      console.error('❌ [Uppy] handleUploadError: No file object provided');
      return;
    }
    console.error('❌ [Uppy] Upload error:', {
      file: file.name,
      error: error,
      response: response
    });
    setUploads(prev => prev.map(upload => 
      upload.id === file.id 
        ? { ...upload, status: 'error', error: error.message || 'Upload failed' }
        : upload
    ));

    if (onError) {
      onError(error.message || 'An upload error occurred');
    }
  }, [onError]); // Dependency: onError prop

  // Create a function reference that will remain stable
  const startUploadQueueRef = useRef(null);

  // Wrap startUploadQueue in useCallback
  const startUploadQueue = useCallback((uppyInstance) => {
    if (!uppyInstance) {
        console.error('❌ [Uppy] startUploadQueue called without a valid Uppy instance.');
        return;
    }
    console.log('🔄 [Uppy] Starting/continuing upload queue process');
    const allFiles = uppyInstance.getFiles();
    // Filter for files that are genuinely pending (not started, not complete, not errored)
    const pendingFiles = allFiles.filter(f => 
        !f.progress?.uploadComplete && 
        !f.progress?.uploadStarted && 
        !f.error
    );
    const inProgressFiles = allFiles.filter(f => 
        f.progress?.uploadStarted && 
        !f.progress?.uploadComplete &&
        !f.error
    );
    
    console.log(`📊 [Uppy] Queue status: ${pendingFiles.length} pending, ${inProgressFiles.length} in progress, ${allFiles.length - pendingFiles.length - inProgressFiles.length} completed/errored`);
    
    if (pendingFiles.length > 0) {
      // Only start upload if there are pending files and not too many already in progress
      // This prevents accidentally calling upload() multiple times rapidly
      if(inProgressFiles.length < (uppyInstance.opts.limit || 5)) { // Check against the concurrency limit
         console.log(`🚀 [Uppy] Starting upload for next batch of files (${pendingFiles.length} pending).`);
         uppyInstance.upload().catch(error => {
           console.error('❌ [Uppy] Error calling uppy.upload():', error);
         });
      } else {
         console.log(`🚦 [Uppy] ${inProgressFiles.length} files already in progress (limit: ${uppyInstance.opts.limit || 5}). Waiting for current batch to complete.`);
      }
    } else if (inProgressFiles.length === 0) {
      console.log(`✅ [Uppy] No pending files and no uploads in progress. Queue appears complete.`);
      // You might want to set a state here indicating completion if needed
    }
  }, []); // Empty dependency array as it doesn't depend on component state/props

  // Store the function in ref to avoid circular dependencies
  useEffect(() => {
    startUploadQueueRef.current = startUploadQueue;
  }, [startUploadQueue]);

  // Add a function to force-process any Dropbox/Google Drive uploads 
  // that might not have been properly identified
  const processRemoteUploads = useCallback(() => {
    const pendingFiles = uploads.filter(u => 
      (u.source === 'dropbox' || u.source === 'googledrive' || u.file?.source === 'dropbox' || u.file?.source === 'googledrive') && 
      u.status !== 'complete' && 
      u.status !== 'error'
    );
    
    if (pendingFiles.length > 0) {
      console.log(`[PhotoUploader] Force-completing ${pendingFiles.length} pending remote uploads`);
      setUploads(prev => prev.map(upload => {
        if ((upload.source === 'dropbox' || upload.source === 'googledrive' || upload.file?.source === 'dropbox' || upload.file?.source === 'googledrive') && 
            upload.status !== 'complete' && upload.status !== 'error') {
          return {
            ...upload,
            status: 'complete',
            photoDetails: upload.photoDetails || {
              id: upload.id,
              url: upload.file.preview || '',
              source: upload.source || upload.file?.source || 'remote',
              metadata: upload.metadata,
              userId: user?.id || '',
              user_id: user?.id || '',
              uploadedBy: user?.id || '',
              uploaded_by: user?.id || '',
              username: user?.username || ''
            }
          };
        }
        return upload;
      }));
      return true;
    }
    return false;
  }, [uploads, user]);

  // Add a dedicated upload completion handling function
  const finalizeUpload = useCallback(() => {
    console.log('[PhotoUploader] Finalizing upload and refreshing display...');
    
    // First, ensure any remote uploads are properly processed
    const processedRemotes = processRemoteUploads();
    
    // Helper function to determine if a URL is a temporary Companion URL
    const isTemporaryUrl = (url) => {
      if (!url) return false;
      return url.includes('localhost:3020') || 
             url.includes('/companion/') || 
             url.includes('/dropbox/') || 
             url.includes('/drive/');
    };
    
    // Helper function to convert a temporary URL to a potential S3 URL
    const getS3UrlFromStoragePath = (userId, source, fileId) => {
      // Expected S3 path format: photos/userId/source/fileId
      const storagePath = `photos/${userId}/${source}/${fileId}`;
      // We don't know the bucket name here, but server.js will handle that
      return storagePath;
    };
    
    // Ensure we mark uploads as complete in the UI
    const completedFiles = uppy?.getFiles().filter(f => f.progress?.uploadComplete) || [];
    if (completedFiles.length > 0) {
      console.log(`[PhotoUploader] Finalizing ${completedFiles.length} completed uploads`);
      setUploads(prev => {
        const updatedUploads = [...prev];
        completedFiles.forEach(file => {
          const index = updatedUploads.findIndex(u => u.id === file.id);
          if (index !== -1) {
            // Get the potential final S3 path if this is a remote upload with a temporary URL
            const isRemote = file.source === 'dropbox' || file.source === 'googledrive';
            const currentUrl = file.response?.body?.url || updatedUploads[index].photoDetails?.url;
            const hasTemporaryUrl = isTemporaryUrl(currentUrl);
            
            // If it's a remote upload with a temporary URL, generate a proper S3 path
            let properUrl = currentUrl;
            let storagePath = '';
            
            if (isRemote && hasTemporaryUrl) {
              storagePath = getS3UrlFromStoragePath(
                user?.id || '', 
                file.source, 
                file.id
              );
              console.log(`[PhotoUploader] Detected temporary URL for remote upload. 
                File: ${file.name}
                URL: ${currentUrl}
                Generated storage path: ${storagePath}`);
            }
            
            updatedUploads[index] = {
              ...updatedUploads[index],
              status: 'complete',
              progress: 100,
              photoDetails: {
                ...updatedUploads[index].photoDetails,
                ...file.response?.body,
                storage_path: storagePath || file.response?.body?.storage_path || updatedUploads[index].photoDetails?.storage_path
              }
            };
          }
        });
        return updatedUploads;
      });
    }
    
    // Log all completed uploads for debugging
    const allUploads = uppy?.getFiles() || [];
    console.log(`[PhotoUploader] All uploads (${allUploads.length}):`);
    allUploads.forEach(file => {
      console.log(`- ${file.id}: complete=${file.progress?.uploadComplete}, source=${file.source || file.meta?.source}, response=${!!file.response?.body}`);
    });

    // Also mark processing uploads as complete (for remote uploads that might be stuck)
    setUploads(prev => {
      const processingUploads = prev.filter(u => u.status === 'processing');
      if (processingUploads.length > 0) {
        console.log(`[PhotoUploader] Marking ${processingUploads.length} processing uploads as complete`);
        return prev.map(upload => 
          upload.status === 'processing' ? { 
            ...upload, 
            status: 'complete',
            // For remote sources, ensure we have minimum data needed
            photoDetails: upload.photoDetails || {
              id: upload.id,
              url: upload.url || upload.file?.preview || '',
              userId: user?.id || '',
              user_id: user?.id || '',
              uploadedBy: user?.id || '',
              uploaded_by: user?.id || '',
              username: user?.username || '',
              source: upload.source || upload.file?.source || 'remote'
            }
          } : upload
        );
      }
      return prev;
    });
    
    // Check if we have any uploads that completed but are missing from our local state
    // This can happen with Dropbox/Google Drive uploads
    const localUploadIds = new Set(uploads.map(u => u.id));
    const completedIds = new Set(completedFiles.map(f => f.id));
    const missingUploads = [...completedIds].filter(id => !localUploadIds.has(id));
    
    if (missingUploads.length > 0) {
      console.log(`[PhotoUploader] Found ${missingUploads.length} uploads missing from local state. Adding them.`);
      setUploads(prev => [
        ...prev,
        ...missingUploads.map(id => {
          const file = uppy.getFile(id);
          return {
            id: id,
            file: file.data || { 
              name: file.name, 
              type: file.type,
              size: file.size,
              preview: file.preview || file.thumbnail,
              source: file.source || file.meta?.source
            },
            progress: 100,
            status: 'complete',
            metadata: file.meta || {},
            photoDetails: file.response?.body || {
              id: file.meta?.photoId || id,
              url: file.uploadURL || file.response?.uploadURL || '',
              userId: user?.id || '',
              user_id: user?.id || '',
              uploadedBy: user?.id || '',
              uploaded_by: user?.id || '',
              username: user?.username || '',
              source: file.source || file.meta?.source || 'remote'
            },
            source: file.source || file.meta?.source || 'local'
          };
        })
      ]);
    }
    
    // Check for remote uploads (Dropbox/Google Drive)
    const remoteUploads = uploads.filter(upload => 
      (upload.source === 'dropbox' || upload.source === 'googledrive' || 
       upload.file?.source === 'dropbox' || upload.file?.source === 'googledrive') &&
      upload.status === 'complete'
    );
    
    if (remoteUploads.length > 0) {
      console.log(`[PhotoUploader] Ensuring ${remoteUploads.length} remote uploads are properly saved to database`);
      
      // Process each remote upload to save it to the database
      const dbSavePromises = remoteUploads.map(async (upload) => {
        try {
          // Only process if we have the necessary data
          if (!upload.id) {
            console.warn(`[PhotoUploader] Cannot save remote upload without ID`);
            return;
          }
          
          // Determine if this is a Dropbox or Google Drive upload
          const source = upload.source || upload.file?.source || 
                       (typeof upload.id === 'string' && upload.id.startsWith('id:') ? 'dropbox' : 'remote');
          
          // Create metadata object with required fields for DynamoDB
          const uploadMetadata = {
            id: upload.photoDetails?.id || upload.id,
            user_id: user?.id || upload.metadata?.userId || upload.photoDetails?.userId,
            userId: user?.id || upload.metadata?.userId || upload.photoDetails?.userId,
            uploaded_by: user?.id || upload.metadata?.uploadedBy || upload.photoDetails?.uploadedBy,
            uploadedBy: user?.id || upload.metadata?.uploadedBy || upload.photoDetails?.uploadedBy,
            username: user?.username || upload.metadata?.username || upload.photoDetails?.username,
            storage_path: upload.photoDetails?.storage_path || `photos/${user?.id}/${source}/${upload.id}`,
            url: upload.photoDetails?.url || upload.file?.preview || '',
            public_url: upload.photoDetails?.url || upload.file?.preview || '',
            file_size: upload.file?.size || 0,
            file_type: upload.file?.type || 'image/jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            faces: upload.photoDetails?.faces || [],
            matched_users: upload.photoDetails?.matched_users || [],
            face_ids: upload.photoDetails?.face_ids || [],
            source: source,
            // Include event metadata
            eventName: metadata.eventName || upload.metadata?.eventName || '',
            venueName: metadata.venueName || upload.metadata?.venueName || '',
            promoterName: metadata.promoterName || upload.metadata?.promoterName || '',
            date: metadata.date || upload.metadata?.date || new Date().toISOString().split('T')[0],
            albumLink: metadata.albumLink || upload.metadata?.albumLink || '',
            // Include nested structures
            event_details: upload.metadata?.event_details || metadata?.event_details || {
              name: metadata.eventName || 'Event',
              date: metadata.date || new Date().toISOString().split('T')[0],
              type: 'event'
            },
            venue: upload.metadata?.venue || {
              name: metadata.venueName || 'Venue',
              id: null
            },
            promoter: upload.metadata?.promoter || {
              name: metadata.promoterName || 'Promoter'
            },
            location: upload.metadata?.location || metadata.location || {},
            externalAlbumLink: upload.metadata?.albumLink || metadata.albumLink
          };
          
          console.log(`[PhotoUploader] Saving metadata for remote upload ${upload.id} to database`, {
            id: uploadMetadata.id,
            source: uploadMetadata.source,
            user_id: uploadMetadata.user_id
          });
          
          // Use the awsPhotoService to save metadata (without re-uploading the file)
          const result = await awsPhotoService.savePhotoMetadata(uploadMetadata);
          
          if (result.success) {
            console.log(`[PhotoUploader] ✅ Successfully saved remote upload metadata to database: ${upload.id}`);
            return true;
          } else {
            console.error(`[PhotoUploader] ❌ Failed to save remote upload metadata: ${result.error}`);
            return false;
          }
        } catch (error) {
          console.error(`[PhotoUploader] ❌ Error saving remote upload metadata:`, error);
          return false;
        }
      });
      
      // Wait for all database saves to complete before continuing
      Promise.all(dbSavePromises)
        .then(results => {
          const successCount = results.filter(Boolean).length;
          console.log(`[PhotoUploader] Database save operations completed: ${successCount} successful, ${results.length - successCount} failed`);
          
          // After database save, force refresh photos
          setTimeout(() => {
            if (onUploadComplete) {
              console.log('[PhotoUploader] Database save complete, refreshing display');
              onUploadComplete(true);
            }
          }, 1000);
        })
        .catch(error => {
          console.error('[PhotoUploader] Error during database save operations:', error);
        });
    }
    
    // Create a small delay to ensure backend processing completes
    setTimeout(() => {
      // Reset the uploader state and trigger refresh
      if (onUploadComplete) {
        console.log('[PhotoUploader] Calling final onUploadComplete callback with force refresh.');
        // Pass true to indicate this should force a refresh of the photos list
        onUploadComplete(true);
      }
      
      setUploadComplete(true);
      
      // Add a secondary refresh to ensure photos are displayed
      setTimeout(() => {
        if (onUploadComplete) {
          console.log('[PhotoUploader] Secondary refresh to ensure photos are displayed.');
          onUploadComplete(true);
        }
      }, 3000); // Small delay to ensure backend processing completes
    }, 1000); // Small delay to ensure backend processing completes
  }, [uppy, onUploadComplete, uploads, user, processRemoteUploads, metadata]);

  // Process successful uploads
  const processSuccessfulUploads = useCallback((successfulUploads) => {
    if (!successfulUploads || successfulUploads.length === 0) return;
    
    console.log(`🧾 [Uppy] Processing ${successfulUploads.length} successful uploads...`);
    
    // Update the uploads state
    setUploads(prev => prev.map(upload => {
      const successfulUpload = successfulUploads.find(u => u.id === upload.id);
      if (successfulUpload) {
        // Extract response data consistently
        const responseData = successfulUpload.response?.body || {};
        const uploadURL = successfulUpload.uploadURL || responseData.url || '';
        
        // For all uploads, store additional metadata to help with identification
        const uploaderId = user?.id || upload.metadata?.userId || upload.file.meta?.userId;
        const uploaderName = user?.username || upload.metadata?.username || upload.file.meta?.username;
        
        // Determine the source with explicit checking
        let sourceType = 'local';
        const isDropboxId = typeof successfulUpload.id === 'string' && successfulUpload.id.startsWith('id:');
        
        if (successfulUpload.source === 'dropbox' || upload.source === 'dropbox' || 
            successfulUpload.meta?.source === 'dropbox' || isDropboxId) {
          sourceType = 'dropbox';
        } else if (successfulUpload.source === 'googledrive' || upload.source === 'googledrive' || 
                  successfulUpload.meta?.source === 'googledrive') {
          sourceType = 'googledrive';
        }
        
        console.log(`🧾 [Uppy] Processing upload with source: ${sourceType}`);
        
        // Create a complete photoDetails object with all required fields
        const photoDetails = {
          id: responseData.id || successfulUpload.id,
          url: uploadURL || successfulUpload.preview || successfulUpload.thumbnail,
          matched_users: responseData.matched_users || [],
          faces: responseData.faces || [],
          userId: uploaderId,
          user_id: uploaderId,
          username: uploaderName,
          uploadedBy: uploaderId,
          uploaded_by: uploaderId,
          file_size: upload.file.size,
          file_type: upload.file.type || 'image/jpeg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          storage_path: responseData.storage_path || `photos/${uploaderId}/${sourceType}/${successfulUpload.id}`,
          public_url: uploadURL || successfulUpload.preview || successfulUpload.thumbnail,
          source: sourceType,
          // Include additional metadata
          metadata: {
            ...upload.metadata,
            userId: uploaderId,
            username: uploaderName,
            source: sourceType
          },
          // Event data
          event_details: metadata.event_details || {
            name: metadata.eventName || 'Event',
            date: metadata.date || new Date().toISOString().split('T')[0],
            type: 'event'
          },
          venue: {
            name: metadata.venueName || 'Venue',
            id: null
          },
          promoter: {
            name: metadata.promoterName || 'Promoter'
          },
          location: metadata.location || {},
          externalAlbumLink: metadata.albumLink || ''
        };
        
        // Log the created photoDetails
        console.log(`🌟 [DATABASE] Created photoDetails for upload: ${upload.id}, Source: ${sourceType}`);
        
        // Check if this is a remote upload (Dropbox/Google Drive)
        const isRemoteSource = sourceType === 'dropbox' || sourceType === 'googledrive';
                           
        if (isRemoteSource) {
          console.log(`🌟 [DATABASE] Remote upload completed. Will save metadata directly to database for ${upload.id}`);
          
          // Save metadata to database immediately
          awsPhotoService.savePhotoMetadata(photoDetails)
            .then(result => {
              if (result.success) {
                console.log(`🌟 [DATABASE] SUCCESS: Saved remote upload metadata to database for ${upload.id}`);
                
                // Refresh the list of uploads after successful save to database
                setTimeout(() => {
                  if (onUploadComplete) {
                    console.log(`🔄 [Uppy] Refreshing display after successful database save for ${upload.id}`);
                    onUploadComplete(true);
                  }
                }, 2000); // Give database operation time to complete
              } else {
                console.error(`🌟 [DATABASE] ERROR: Failed to save remote upload metadata for ${upload.id}: ${result.error}`);
              }
            })
            .catch(error => {
              console.error(`🌟 [DATABASE] ERROR: Exception while saving remote upload metadata:`, error);
            });
        }
        
        // Return updated upload object with additional details
        return {
          ...upload,
          status: 'complete',
          progress: {
            ...upload.progress,
            uploadComplete: true,
            percentage: 100
          },
          successResponse: responseData,
          uploadURL,
          photoDetails,
          source: sourceType
        };
      }
      return upload;
    }));
    
  }, [user, metadata, onUploadComplete]);

  // Add socket initialization at component level
  const [socket, setSocket] = useState(null);
  
  // Initialize socket connection when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check what URL is actually available
      const socketUrl = import.meta.env.VITE_COMPANION_URL || 'http://localhost:3020';
      console.log('🔌 [PhotoUploader] Attempting to connect to socket at:', socketUrl);
      
      try {
        const socketInstance = io(socketUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000
        });
        
        console.log('🔌 [PhotoUploader] Socket instance created:', socketInstance);
        
        socketInstance.on('connect', () => {
          console.log(`🔌 [PhotoUploader] Socket connected with ID: ${socketInstance.id}`);
          // Send auth data immediately after connection
          socketInstance.emit('auth', {
            userId: user?.id,
            username: user?.username,
          });
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('❌ [PhotoUploader] Socket connection error:', error);
        });
        
        socketInstance.on('connect_timeout', () => {
          console.error('❌ [PhotoUploader] Socket connection timeout');
        });
        
        socketInstance.on('error', (error) => {
          console.error('❌ [PhotoUploader] Socket error:', error);
        });
        
        socketInstance.on('disconnect', (reason) => {
          console.log(`🔌 [PhotoUploader] Socket disconnected: ${reason}`);
        });
        
        socketInstance.on('reconnect', (attemptNumber) => {
          console.log(`🔌 [PhotoUploader] Socket reconnected after ${attemptNumber} attempts`);
        });
        
        socketInstance.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔌 [PhotoUploader] Socket reconnection attempt ${attemptNumber}`);
        });
        
        socketInstance.on('reconnect_error', (error) => {
          console.error('❌ [PhotoUploader] Socket reconnection error:', error);
        });
        
        socketInstance.on('reconnect_failed', () => {
          console.error('❌ [PhotoUploader] Socket reconnection failed');
        });
        
        socketInstance.on('upload-processed', (data) => {
          console.log('%c📤 [PhotoUploader] UPLOAD PROCESSED EVENT:', 'background: #2196f3; color: white; padding: 2px 5px; border-radius: 3px;', data);
          
          if (data.faces) {
            console.log('%c👥 [PhotoUploader] Face Detection Results:', 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px;', data.faces);
          }
          
          if (data.matched_users) {
            console.log('%c🎯 [PhotoUploader] Face Matching Results:', 'background: #9c27b0; color: white; padding: 2px 5px; border-radius: 3px;', data.matched_users);
          }
          
          // Update the upload state with the processed data
          setUploads(prevUploads => {
            return prevUploads.map(upload => {
              if (upload.id === data.uploadId) {
                return {
                  ...upload,
                  photoDetails: {
                    ...upload.photoDetails,
                    ...data,
                    faces: data.faces || [],
                    matched_users: data.matched_users || [],
                    matched_users_list: data.matched_users || [],
                    processing_complete: true
                  }
                };
              }
              return upload;
            });
          });
        });
        
        setSocket(socketInstance);
        
        return () => {
          console.log('🔌 [PhotoUploader] Cleaning up socket connection');
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('❌ [PhotoUploader] Error initializing socket:', error);
      }
    }
  }, [user]);

  // Update the handleBatchComplete function to use the socket
  const handleBatchComplete = useCallback(async (result) => {
    console.log('✅ [Uppy] Batch Upload Result:', result);
    const { successful, failed, uploadID } = result;
    
    console.log(`📊 [Uppy] Batch Summary: ${successful.length} successful, ${failed.length} failed.`);
    
    // Process successful uploads
    const uploadSources = successful.map(upload => ({
      id: upload.id,
      source: upload.source,
      metaSource: upload.meta?.source
    }));
    
    console.log('🔍 [Uppy] Upload sources:', uploadSources);
    
    // Check for remote uploads (Dropbox/Google Drive)
    const hasRemoteUploads = uploadSources.some(upload => checkIsRemoteUpload(upload));
    console.log('🔍 [Uppy] Has remote uploads:', hasRemoteUploads);
    
    // Helper function to determine upload source
    const determineUploadSource = (file) => {
      // Dropbox upload IDs start with "id:"
      const isDropboxId = typeof file.id === 'string' && file.id.startsWith('id:');
      
      // Determine the source with explicit checking
      if (file.source === 'dropbox' || isDropboxId) {
        return 'dropbox';
      } else if (file.source === 'googledrive') {
        return 'googledrive';
      } else if (file.meta?.source === 'dropbox') {
        return 'dropbox';
      } else if (file.meta?.source === 'googledrive') {
        return 'googledrive';
      }
      
      return 'local';
    };
    
    // Process each successful upload
    for (const successfulUpload of successful) {
      const sourceType = determineUploadSource(successfulUpload);
      console.log(`🔍 [Uppy] Determined upload source for ${successfulUpload.id}: ${sourceType}`);
      
      // For remote uploads, ensure socket communication
      if (sourceType === 'dropbox' || sourceType === 'googledrive') {
        if (!socket) {
          console.error('❌ [PhotoUploader] No socket connection available for remote upload!', {
            socketExists: !!socket,
            socketId: socket?.id,
            socketConnected: socket?.connected,
            url: import.meta.env.VITE_COMPANION_URL || 'http://localhost:3020'
          });
          
          // Try to reconnect the socket
          console.log('🔄 [PhotoUploader] Attempting to reconnect socket for remote upload');
          try {
            const socketUrl = import.meta.env.VITE_COMPANION_URL || 'http://localhost:3020';
            const reconnectSocket = io(socketUrl, {
              transports: ['websocket'],
              reconnection: true,
              forceNew: true
            });
            
            reconnectSocket.on('connect', () => {
              console.log(`🔌 [PhotoUploader] Socket reconnected with ID: ${reconnectSocket.id}`);
              // Use the reconnected socket for this upload
              reconnectSocket.emit('upload-complete', {
                uploadId: successfulUpload.id,
                userId: user?.id,
                username: user?.username,
                source: sourceType,
                fileData: {
                  name: successfulUpload.name,
                  type: successfulUpload.type,
                  size: successfulUpload.size,
                },
                metadata: {
                  ...successfulUpload.meta,
                  userId: user?.id,
                  username: user?.username,
                }
              });
              
              console.log(`📤 [PhotoUploader] Emitted upload-complete event for ${successfulUpload.id} on reconnected socket`);
            });
            
            reconnectSocket.on('connect_error', (error) => {
              console.error('❌ [PhotoUploader] Reconnection socket error:', error);
            });
          } catch (error) {
            console.error('❌ [PhotoUploader] Error in socket reconnection attempt:', error);
          }
          
          continue;
        }
        
        console.log(`🔄 [PhotoUploader] Processing remote upload: ${successfulUpload.id}`);
        console.log(`🔄 [PhotoUploader] Socket status:`, {
          id: socket.id,
          connected: socket.connected,
          disconnected: socket.disconnected
        });
        
        // Emit upload complete event with all necessary data
        try {
          socket.emit('upload-complete', {
            uploadId: successfulUpload.id,
            userId: user?.id,
            username: user?.username,
            source: sourceType,
            fileData: {
              name: successfulUpload.name,
              type: successfulUpload.type,
              size: successfulUpload.size,
            },
            metadata: {
              ...successfulUpload.meta,
              userId: user?.id,
              username: user?.username,
            }
          });
          
          console.log(`📤 [PhotoUploader] Emitted upload-complete event for ${successfulUpload.id}`);
        } catch (error) {
          console.error('❌ [PhotoUploader] Error emitting upload-complete event:', error);
        }
      }
    }
  }, [socket, user, checkIsRemoteUpload]);

  // Now that all handlers are defined, update the handlers ref
  useEffect(() => {
    handlersRef.current = {
      handleFileAdded,
      handleFileRemoved,
      handleUploadProgress,
      handleBatchComplete,
      handleUploadError
    };
  }, [handleFileAdded, handleFileRemoved, handleUploadProgress, handleBatchComplete, handleUploadError]);

  const validateMetadata = () => {
    if (!metadata.eventName || !metadata.venueName || !metadata.promoterName || !metadata.date) {
      return false;
    }
    return true;
  };

  // Handle the green button click
  const handleUploadClick = () => {
    console.log('Upload button clicked', { numberOfFiles: uploads.length });
    
    if (uploads.length === 0) {
      console.log('No files selected');
      alert('Please select files first');
      return;
    }
    
    console.log('Showing metadata form');
    setShowMetadataForm(true);
  };

  // Modify the handleContinueUpload function
  const handleContinueUpload = () => {
    console.log('Continue Upload clicked');
    
    if (!validateMetadata()) {
      console.log('Metadata validation failed');
      alert('Please fill in all required fields');
      return;
    }

    // Format metadata for database
    const formattedMetadata = {
      event_details: {
        name: metadata.eventName,
        date: metadata.date,
        type: 'event' // default type
      },
      venue: {
        name: metadata.venueName,
        id: null // can be updated if you have venue IDs
      },
      promoter: {
        name: metadata.promoterName
      },
      location: metadata.location || { address: null, lat: null, lng: null },
      externalAlbumLink: metadata.albumLink || null,
      uploaded_by: user?.id,
      username: user?.username || JSON.parse(localStorage.getItem('authUser'))?.username || '',
      created_at: new Date().toISOString()
    };

    console.log('Updating uploads with metadata', formattedMetadata);
    
    // Update all pending uploads with the formatted metadata
    setUploads(prev => prev.map(upload => ({
      ...upload,
      metadata: formattedMetadata
    })));

    // Start the upload process
    if (uppy) {
      console.log('Starting Uppy upload with formatted metadata');
      uppy.setMeta(formattedMetadata);
      if (startUploadQueueRef.current) {
        startUploadQueueRef.current(uppy); // Use our new function instead of just uppy.upload()
      } else {
        console.error('❌ [Uppy] startUploadQueueRef.current is not available');
        uppy.upload().catch(error => {
          console.error('❌ [Uppy] Error calling uppy.upload():', error);
        });
      }
    }

    setShowMetadataForm(false);
  };

  // Storage limit in bytes (10GB)
  const storageLimit = 10 * 1024 * 1024 * 1024;

  // Filter uploads based on search query
  const filteredUploads = uploads.filter(upload => {
    if (!searchQuery) return true;
    return upload.file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (upload.folderPath && upload.folderPath.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Remove upload
  const removeUpload = (id) => {
    const uploadToRemove = uploads.find(u => u.id === id);
    if (uploadToRemove) {
      uppy?.removeFile(id);
    }
  };

  // Render folder structure recursively
  const renderFolderStructure = (structure, path = '') => {
    return (
      <div className="pl-4">
        {Object.keys(structure).map(folder => (
          <div key={path + folder} className="mb-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-apple-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-medium text-apple-gray-700">{folder}</span>
            </div>
            {renderFolderStructure(structure[folder], path + folder + '/')}
          </div>
        ))}
      </div>
    );
  };

  // Render upload details
  const renderUploadDetails = (upload) => {
    if (!upload.photoDetails) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-apple-gray-900 mb-1">File Information</h4>
          <p className="text-sm text-apple-gray-500">Name: {upload.file.name}</p>
          <p className="text-sm text-apple-gray-500">Size: {(upload.file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p className="text-sm text-apple-gray-500">Type: {upload.file.type}</p>
        </div>
        
        <div>
          <h4 className="font-medium text-apple-gray-900 mb-1">Metadata</h4>
          <p className="text-sm text-apple-gray-500">Event: {upload.metadata?.eventName}</p>
          <p className="text-sm text-apple-gray-500">Venue: {upload.metadata?.venueName}</p>
          <p className="text-sm text-apple-gray-500">Date: {upload.metadata?.date}</p>
          {upload.metadata?.albumLink && (
            <p className="text-sm text-apple-gray-500">
              Album Link: <a 
                href={upload.metadata.albumLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {upload.metadata.albumLink}
              </a>
            </p>
          )}
        </div>
        
        <div className="md:col-span-2">
          <h4 className="font-medium text-apple-gray-900 mb-1">Recognition Results</h4>
          {upload.photoDetails.matched_users_list && upload.photoDetails.matched_users_list.length > 0 ? (
            <div>
              <p className="text-sm text-apple-gray-500 mb-2">Matched Users: {upload.photoDetails.matched_users_list.length}</p>
              <div className="grid grid-cols-2 gap-2">
                {upload.photoDetails.matched_users_list.map((user, index) => (
                  <div key={index} className="bg-apple-gray-100 p-2 rounded">
                    <p className="text-sm font-medium text-apple-gray-900">{user.name || user.userId || `User ${index + 1}`}</p>
                    <p className="text-xs text-apple-gray-500">Confidence: {user.similarity ? `${user.similarity.toFixed(2)}%` : (user.confidence ? `${user.confidence}%` : 'N/A')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-apple-gray-500">No matches found</p>
          )}
        </div>
        <div className="md:col-span-2 mt-4">
          <details className="bg-gray-50 rounded p-2 mt-2">
            <summary className="cursor-pointer text-xs text-gray-500">Debug: Raw Rekognition & Matching Data</summary>
            <pre className="text-xs text-gray-700 overflow-x-auto max-h-48 mt-2">
              {JSON.stringify({ faces: upload.photoDetails.faces, matched_users: upload.photoDetails.matched_users, matched_users_list: upload.photoDetails.matched_users_list }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  // Handle file drops
  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach(file => {
      // Log the current user info
      console.log('👤 [Uppy] Adding file with user context:', {
        id: user?.id || 'not set',
        username: user?.username || 'not set'
      });
      
      const fileMeta = {
        ...metadata,
        userId: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
        user_id: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
        uploadedBy: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
        uploaded_by: user?.id || JSON.parse(localStorage.getItem('authUser'))?.id || '',
        username: user?.username || JSON.parse(localStorage.getItem('authUser'))?.username || '',
        folderPath: file.path || '', // If available from the file system
        source: 'local' // Explicitly mark as local upload
      };
      
      console.log('🔖 [Uppy] Adding file with metadata:', JSON.stringify(fileMeta));
      
      uppy?.addFile({
        name: file.name,
        type: file.type,
        data: file,
        meta: fileMeta
      });
    });
  };

  // Dropzone hook
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.cr2', '.nef', '.arw', '.rw2']
    },
    maxSize: 100 * 1024 * 1024 // 100MB max file size
  });

  // Ensure the final upload function uses the stable startUploadQueue
  const handleFinalUpload = () => {
    if (!uppy) { // Check uppy state variable
      console.error('Uppy instance not available for final upload.');
      return;
    }
    console.log('🚀 [Uppy] Final upload button clicked, initiating queue process.');
    // setIsUploading(true); // Manage upload state if needed
    // setUploadComplete(false);
    // setError(null);
    // Call the stable queue helper function using the ref
    if (startUploadQueueRef.current) {
      startUploadQueueRef.current(uppy);
    } else {
      console.error('❌ [Uppy] startUploadQueueRef.current is not available');
      uppy.upload().catch(error => {
        console.error('❌ [Uppy] Error calling uppy.upload():', error);
      });
    }
  };

  return (
    <div className="relative w-full max-w-full bg-white shadow-lg rounded-lg border border-gray-200 mb-8 mt-16">
      {/* Header Section */}
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Upload Photos
        </h2>
        
        {/* Storage Usage */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-apple-gray-700">Storage Usage</span>
            <span className="text-sm text-apple-gray-500">{(totalStorage / 1024 / 1024 / 1024).toFixed(2)}GB of 10GB</span>
          </div>
          <div className="h-2 bg-apple-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-apple-blue-500 transition-all duration-300" style={{ width: `${(totalStorage / storageLimit) * 100}%` }}></div>
          </div>
        </div>

        {/* Uppy Dashboard with adjusted positioning */}
        {uppy && (
          <div className="w-full overflow-hidden rounded-lg border border-gray-200 relative z-10">
            <Dashboard
              uppy={uppy}
              plugins={['ImageEditor', 'Dropbox', 'GoogleDrive', 'Url']}
              width="100%"
              height="min(70vh, 600px)"
              showProgressDetails={true}
              proudlyDisplayPoweredByUppy={false}
              note="Supported formats: JPG, PNG, WebP, RAW • Max 100MB per file"
              metaFields={[
                { id: 'folderPath', name: 'Folder Path', placeholder: 'Optional folder path' }
              ]}
              className="uppy-Dashboard--adaptive"
              hideUploadButton={true}
              showRemoveButtonAfterComplete={true}
              showLinkToFileUploadResult={true}
              showSelectedFiles={true}
              doneButtonHandler={() => {
                console.log('Upload complete');
                if (onUploadComplete) {
                  onUploadComplete();
                }
              }}
              locale={{
                strings: {
                  dropPasteFiles: 'Drop files here, %{browse} or %{paste}',
                  browse: 'browse',
                  paste: 'paste from clipboard',
                  uploadComplete: 'Upload complete',
                  uploadFailed: 'Upload failed',
                  dropPasteFolders: 'Drop files here, %{browseFolders} or %{paste}',
                  browseFolders: 'browse folders',
                  selectToUpload: 'Select files to upload',
                  closeModal: 'Close Modal',
                  upload: 'Upload',
                  importFrom: 'Import files from %{name}',
                  dashboardTitle: 'File Upload Dashboard',
                  dashboardWindowTitle: 'File Upload Dashboard Window (Press escape to close)',
                  copyLinkToClipboardSuccess: 'Link copied to clipboard.',
                  copyLinkToClipboardFallback: 'Copy the URL below',
                  copyLink: 'Copy link',
                  fileSource: 'File source: %{name}',
                  done: 'Done',
                  localDisk: 'Local Disk',
                  dropbox: 'Dropbox',
                  googleDrive: 'Google Drive',
                  url: 'URL',
                  retry: 'Retry upload',
                  retryUpload: 'Retry upload',
                  cancel: 'Cancel',
                  cancelUpload: 'Cancel upload',
                  pause: 'Pause',
                  pauseUpload: 'Pause uploads',
                  resume: 'Resume',
                  resumeUpload: 'Resume uploads',
                  close: 'Close',
                  uploadXFiles: {
                    0: 'Upload %{smart_count} file',
                    1: 'Upload %{smart_count} files',
                    2: 'Upload %{smart_count} files'
                  },
                  uploadXNewFiles: {
                    0: 'Upload +%{smart_count} file',
                    1: 'Upload +%{smart_count} files',
                    2: 'Upload +%{smart_count} files'
                  },
                  xFilesSelected: {
                    0: '%{smart_count} file selected',
                    1: '%{smart_count} files selected',
                    2: '%{smart_count} files selected'
                  },
                  uploadingXFiles: {
                    0: 'Uploading %{smart_count} file',
                    1: 'Uploading %{smart_count} files',
                    2: 'Uploading %{smart_count} files'
                  },
                  processingXFiles: {
                    0: 'Processing %{smart_count} file',
                    1: 'Processing %{smart_count} files',
                    2: 'Processing %{smart_count} files'
                  },
                  poweredBy: 'Powered by %{uppy}',
                  addMore: 'Add more',
                  addMoreFiles: 'Add more files',
                  addingMoreFiles: 'Adding more files',
                  dropPaste: 'Drop files here, %{browse} or %{paste}',
                  selectAllFilesFromFolderNamed: 'Select all files from folder %{name}',
                  moveToTrash: 'Move to trash',
                  confirmTrash: 'Are you sure you want to move these files to trash?',
                  removeFile: 'Remove file',
                  removeFiles: 'Remove files',
                  cancelUploads: 'Cancel uploads',
                  retryUploads: 'Retry uploads',
                  pauseUploads: 'Pause uploads',
                  resumeUploads: 'Resume uploads',
                  uploadPaused: 'Upload paused',
                  uploadPausedXFiles: {
                    0: 'Upload paused for %{smart_count} file',
                    1: 'Upload paused for %{smart_count} files',
                    2: 'Upload paused for %{smart_count} files'
                  },
                  uploadFailedXFiles: {
                    0: 'Upload failed for %{smart_count} file',
                    1: 'Upload failed for %{smart_count} files',
                    2: 'Upload failed for %{smart_count} files'
                  },
                  uploadCompleteXFiles: {
                    0: 'Upload complete for %{smart_count} file',
                    1: 'Upload complete for %{smart_count} files',
                    2: 'Upload complete for %{smart_count} files'
                  }
                }
              }}
            />
          </div>
        )}

        {/* Custom Upload Buttons */}
        {uploads.length > 0 && (
          <div className="mt-4 flex items-center justify-start gap-4">
            <Button
              onClick={handleUploadClick}
              variant="primary"
              size="md"
              className="bg-green-500 hover:bg-green-600 text-white px-6 rounded-md"
            >
              Upload {uploads.length} {uploads.length === 1 ? 'File' : 'Files'}
            </Button>

            <Button
              onClick={() => {
                // Reset all uploads
                uploads.forEach(upload => {
                  uppy?.removeFile(upload.id);
                });
                setUploads([]);
                setTotalStorage(0);
              }}
              variant="primary"
              size="md"
              className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-md"
            >
              Reset All
            </Button>
          </div>
        )}

        {/* Metadata Form Dialog */}
        <Dialog
          isOpen={showMetadataForm}
          onClose={() => setShowMetadataForm(false)}
          title="Photo Details"
          maxWidth="max-w-2xl"
        >
          <MetadataForm
            metadata={metadata}
            setMetadata={setMetadata}
            onCancel={() => setShowMetadataForm(false)}
            onSubmit={handleContinueUpload}
            isValid={validateMetadata()}
          />
        </Dialog>

        {/* Uploads List */}
        {uploads.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setViewMode(prev => ({ ...prev, mode: 'grid' }))}
                  variant={viewMode.mode === 'grid' ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<LucideIcons.Grid className="w-4 h-4" />}
                  aria-label="Grid view"
                />
                <Button
                  onClick={() => setViewMode(prev => ({ ...prev, mode: 'list' }))}
                  variant={viewMode.mode === 'list' ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<LucideIcons.List className="w-4 h-4" />}
                  aria-label="List view"
                />
                
                <div className="h-6 w-px bg-apple-gray-200 mx-2"></div>
                
                <div className="relative flex-1 min-w-[200px]">
                  <LucideIcons.Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400" />
                  <input
                    type="text"
                    placeholder="Search uploads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-md bg-apple-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<LucideIcons.Filter className="w-4 h-4" />}
                >
                  Filter
                </Button>
                
                <select
                  value={viewMode.sortBy}
                  onChange={(e) => setViewMode(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="py-2 pl-4 pr-10 rounded-md border border-apple-gray-200 bg-white text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                </select>
              </div>
            </div>

            {/* Upload Grid/List */}
            <div 
              className={cn(
                "grid gap-4",
                viewMode.mode === 'grid' 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              )}
            >
              {filteredUploads.map((upload) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "bg-white rounded-lg shadow-sm border border-apple-gray-200",
                    viewMode.mode === 'list' && "flex items-center"
                  )}
                >
                  <div 
                    className={cn(
                      "relative",
                      viewMode.mode === 'grid' ? "aspect-square" : "w-20 h-20"
                    )}
                  >
                    {upload.file && (
                      <img
                        src={upload.photoDetails?.url || upload.file?.preview || (upload.file?.data ? URL.createObjectURL(upload.file.data) : undefined)}
                        alt={upload.file.name}
                        className="w-full h-full object-cover rounded-tl-lg rounded-tr-lg cursor-pointer"
                        onClick={() => setPreviewImage(upload.file)}
                      />
                    )}
                    
                    <div 
                      className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center",
                        upload.status === 'complete' && "bg-apple-green-500/50",
                        upload.status === 'error' && "bg-apple-red-500/50"
                      )}
                    >
                      {upload.status === 'uploading' && (
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                      {upload.status === 'complete' && (
                        <LucideIcons.Check className="w-8 h-8 text-white" />
                      )}
                      {upload.status === 'error' && (
                        <LucideIcons.AlertTriangle className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-apple-gray-900 truncate max-w-[200px]">
                          {upload.file?.name || 'Unknown file'}
                        </p>
                        <p className="text-sm text-apple-gray-500">
                          {upload.source && (
                            <span className="text-apple-gray-400">
                              {upload.source === 'dropbox' ? 'Dropbox' : 
                               upload.source === 'googledrive' ? 'Google Drive' : 
                               'Local'} / 
                            </span>
                          )}
                          {upload.folderPath && (
                            <span className="text-apple-gray-400">{upload.folderPath} /</span>
                          )}
                          {' '}
                          {upload.file?.size ? (upload.file.size / 1024 / 1024).toFixed(2) : '0'} MB
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {upload.status === 'complete' && (
                          <button
                            onClick={() => setSelectedUpload(upload)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-apple-gray-400 hover:text-apple-gray-600"
                            aria-label="View details"
                          >
                            <LucideIcons.Info className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => removeUpload(upload.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-apple-gray-400 hover:text-apple-gray-600"
                          aria-label="Remove upload"
                        >
                          <LucideIcons.X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {upload.status !== 'complete' && (
                      <div className="mt-2">
                        <div className="h-1 bg-apple-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300",
                              upload.status === 'error' ? "bg-apple-red-500" : "bg-apple-blue-500"
                            )}
                            style={{ width: `${upload.progress}%` }}
                          ></div>
                        </div>
                        
                        {upload.error && (
                          <p className="mt-1 text-sm text-apple-red-500">{upload.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo details dialog */}
      <Dialog
        isOpen={!!selectedUpload && !!selectedUpload.photoDetails}
        onClose={() => setSelectedUpload(null)}
        title="Photo Details"
        maxWidth="max-w-2xl"
      >
        {selectedUpload && selectedUpload.photoDetails && (
          <>
            <div className="aspect-video rounded-lg overflow-hidden mb-6">
              <img
                src={URL.createObjectURL(selectedUpload.file)}
                alt={selectedUpload.file.name}
                className="w-full h-full object-cover"
              />
            </div>
            {renderUploadDetails(selectedUpload)}
          </>
        )}
      </Dialog>

      {/* Image viewer */}
      {previewImage && (
        <ImageViewer
          image={{ 
            url: URL.createObjectURL(previewImage), 
            name: previewImage.name 
          }}
          onClose={() => setPreviewImage(null)}
          onAction={(action) => console.log('Image action:', action)}
        />
      )}
    </div>
  );
}; 