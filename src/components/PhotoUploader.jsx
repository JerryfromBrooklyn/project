import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { awsPhotoService } from '../services/awsPhotoService';
import { useAuth } from '../context/AuthContext';
import { updatePhotoVisibility } from '../services/userVisibilityService';
import { useDropzone } from 'react-dropzone';

// Import Uppy and its plugins
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import ImageEditor from '@uppy/image-editor';
import DropboxPlugin from '@uppy/dropbox';
import GoogleDrivePlugin from '@uppy/google-drive';
import UrlPlugin from '@uppy/url';

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
  
  // Initialize Uppy only once
  useEffect(() => {
    // Only initialize once
    if (initializationCompleteRef.current || uppyRef.current) {
      return;
    }
    
    console.log('🚀 [Uppy] Initializing Uppy instance');
    
    try {
      const uppyInstance = new Uppy({
        id: 'photo-uploader',
        autoProceed: false, // Disable auto upload
        restrictions: {
          maxFileSize: 100 * 1024 * 1024, // 100MB
          allowedFileTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.raw', '.cr2', '.nef', '.arw', '.rw2']
        },
        meta: {
          userId: user?.id || '',
          eventId: eventId || '',
          timestamp: Date.now()
        }
      })
      .use(AwsS3Multipart, {
        limit: 5,
        retryDelays: [0, 1000, 3000, 5000],
        companionUrl: process.env.REACT_APP_COMPANION_URL || 'http://localhost:3020',
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
        },
        getUploadParameters: async (file) => {
          console.log('📤 [Uppy] Getting upload parameters for file:', file.name);
          try {
            const fileData = new File([file.data], file.name, { type: file.type });
            
            const uploadMetadata = {
              ...metadata,
              user_id: user?.id || '',
              uploadedBy: user?.id || '',
              uploaded_by: user?.id || '',
              externalAlbumLink: metadata.albumLink || ''
            };

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
      })
      .use(DropboxPlugin, {
        companionUrl: 'http://localhost:3020',
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
        },
        companionAllowedHosts: ['localhost:3020']
      })
      .use(GoogleDrivePlugin, {
        companionUrl: 'http://localhost:3020',
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
        },
        companionAllowedHosts: ['localhost:3020']
      })
      .use(UrlPlugin, {
        companionUrl: 'http://localhost:3020',
        companionHeaders: {
          Authorization: `Bearer ${user?.accessToken || ''}`,
        },
        companionAllowedHosts: ['localhost:3020']
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
      
      // Only cleanup if we have an instance and we're truly unmounting
      // (not just temporarily removing the component)
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
            
          // If we have completed uploads, trigger a final callback to ensure they're captured
          if (completedUploads.length > 0 && onUploadComplete) {
            console.log(`[PhotoUploader] Final cleanup with ${completedUploads.length} completed uploads.`);
            onUploadComplete();
          }
          
          // Rest of cleanup as before...
          instance.off('file-added', handlersRef.current.handleFileAdded);
          instance.off('file-removed', handlersRef.current.handleFileRemoved);
          instance.off('upload-progress', handlersRef.current.handleUploadProgress);
          instance.off('complete', handlersRef.current.handleBatchComplete);
          instance.off('error', handlersRef.current.handleUploadError);
          
          // Safely close the instance
          if (typeof instance.close === 'function') {
            instance.close();
          } else {
            console.log('⚠️ [Uppy] Warning: instance.close is not a function');
            if (typeof instance.destroy === 'function') {
              instance.destroy();
            }
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
      uppyRef.current.setMeta({
        userId: user?.id || '',
        eventId: eventId || '',
        ...metadata
      });
    }
  }, [user?.id, eventId, metadata]);

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
      size: file.size
    });

    setTotalStorage(prev => prev + (file.size || 0));
    
    // Basic folder structure handling (can be enhanced)
    if (file.source === 'Client' && file.meta?.relativePath) {
        const folderPath = file.meta.relativePath.substring(0, file.meta.relativePath.lastIndexOf('/'));
        if (folderPath) {
            // Logic to update folderStructure state if needed
            // console.log(`Folder path derived: ${folderPath}`);
        }
    }

    // Add to our internal state for rendering the list/grid
    setUploads(prev => [...prev, {
      id: file.id,
      file: file.data || file, // Store the file object itself
      progress: 0,
      status: 'pending',
      metadata: { ...metadata }, // Use current metadata state
      folderPath: file.meta?.folderPath || null,
      error: null,
      photoDetails: null // Initialize photoDetails
    }]);
  }, [metadata]); // Dependency: metadata (if used inside, which it is for the initial state)

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

  // Add a dedicated upload completion handling function
  const finalizeUpload = useCallback(() => {
    console.log('[PhotoUploader] Finalizing upload and refreshing display...');
    
    // Ensure we mark uploads as complete in the UI
    const completedFiles = uppy?.getFiles().filter(f => f.progress?.uploadComplete) || [];
    if (completedFiles.length > 0) {
      setUploads(prev => {
        const updatedUploads = [...prev];
        completedFiles.forEach(file => {
          const index = updatedUploads.findIndex(u => u.id === file.id);
          if (index !== -1) {
            updatedUploads[index] = {
              ...updatedUploads[index],
              status: 'complete',
              progress: 100,
              photoDetails: file.response?.body || {}
            };
          }
        });
        return updatedUploads;
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
    }, 1000); // Small delay to ensure backend processing completes
  }, [uppy, onUploadComplete]);

  // Update handleBatchComplete to use the finalizeUpload function
  const handleBatchComplete = useCallback((result) => {
    console.log('✅ [Uppy] Batch Upload Result:', result);
    
    // Check completion status
    const successfulUploads = result.successful || [];
    const failedUploads = result.failed || [];
    console.log(`📊 [Uppy] Batch Summary: ${successfulUploads.length} successful, ${failedUploads.length} failed.`);

    // Update uploads state with completion status and response data
    if (successfulUploads.length > 0) {
      setUploads(prev => prev.map(upload => {
        const successfulUpload = successfulUploads.find(u => u.id === upload.id);
        if (successfulUpload) {
          // Extract response data from the successful upload
          const responseData = successfulUpload.response?.body || {};
          
          return {
            ...upload,
            status: 'complete',
            progress: 100,
            photoDetails: {
              id: responseData.id || successfulUpload.id,
              url: responseData.url || successfulUpload.uploadURL,
              matched_users: responseData.matched_users || [],
              faces: responseData.faces || []
            }
          };
        }
        return upload;
      }));
    }

    // Update uploads state with error information for failed uploads
    if (failedUploads.length > 0) {
      setUploads(prev => prev.map(upload => {
        const failedUpload = failedUploads.find(u => u.id === upload.id);
        if (failedUpload) {
          return {
            ...upload,
            status: 'error',
            error: failedUpload.error || 'Upload failed'
          };
        }
        return upload;
      }));
    }

    // Check if there are any files that haven't even started or completed yet
    const remainingFiles = uppy?.getFiles().filter(f => !f.progress?.uploadComplete && !f.progress?.uploadStarted);
    
    if (remainingFiles && remainingFiles.length > 0) {
      console.log(`🔄 [Uppy] Batch finished, but ${remainingFiles.length} files still pending in queue. Starting next batch.`);
      // Process the next batch using the ref
      if (startUploadQueueRef.current && uppy) {
        startUploadQueueRef.current(uppy);
      }
    } else {
      console.log('✅ [Uppy] All files processed. Upload process fully complete.');
      
      // Use the dedicated finalizer function
      setTimeout(finalizeUpload, 500);
    }
  }, [uppy, finalizeUpload]);

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
          {upload.photoDetails.matched_users && upload.photoDetails.matched_users.length > 0 ? (
            <div>
              <p className="text-sm text-apple-gray-500 mb-2">Matched Users: {upload.photoDetails.matched_users.length}</p>
              <div className="grid grid-cols-2 gap-2">
                {upload.photoDetails.matched_users.map((user, index) => (
                  <div key={index} className="bg-apple-gray-100 p-2 rounded">
                    <p className="text-sm font-medium text-apple-gray-900">{user.name || `User ${index + 1}`}</p>
                    <p className="text-xs text-apple-gray-500">Confidence: {user.confidence}%</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-apple-gray-500">No matches found</p>
          )}
        </div>
      </div>
    );
  };

  // Handle file drops
  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach(file => {
      uppy?.addFile({
        name: file.name,
        type: file.type,
        data: file,
        meta: {
          ...metadata,
          folderPath: file.path // If available from the file system
        }
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
                    {upload.file.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(upload.file)}
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
                        <p className="font-medium text-apple-gray-900 truncate max-w-[200px]">{upload.file.name}</p>
                        <p className="text-sm text-apple-gray-500">
                          {upload.folderPath && (
                            <span className="text-apple-gray-400">{upload.folderPath} /</span>
                          )}
                          {' '}
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB
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
                    
                    {upload.status === 'complete' && upload.photoDetails && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-2">
                          {upload.photoDetails.matched_users?.length ? (
                            <div className="bg-apple-green-500 text-white px-2 py-1 rounded-full text-sm flex items-center">
                              <LucideIcons.Users className="w-4 h-4 mr-1" />
                              {upload.photoDetails.matched_users.length} {upload.photoDetails.matched_users.length === 1 ? 'Match' : 'Matches'}
                            </div>
                          ) : (
                            <div className="bg-apple-gray-200 text-apple-gray-600 px-2 py-1 rounded-full text-sm flex items-center">
                              <LucideIcons.Users className="w-4 h-4 mr-1" />
                              No Matches
                            </div>
                          )}
                        </div>
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