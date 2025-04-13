import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Check, AlertTriangle, Grid, List, Search, Filter, Users, X, Info, Calendar, Building, User, MapPin } from 'lucide-react';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { awsPhotoService } from '../services/awsPhotoService';
import { useAuth } from '../context/AuthContext';
import { updatePhotoVisibility } from '../services/userVisibilityService';

// Import our new components with proper mobile UX
import Dialog from './ui/Dialog.jsx';
import ImageViewer from './ui/ImageViewer.jsx';
import Button from './ui/Button.jsx';

export const PhotoUploader = ({ eventId, onUploadComplete, onError }) => {
  // State variables
  const [uploads, setUploads] = useState([]);
  const [totalStorage, setTotalStorage] = useState(0);
  const [viewMode, setViewMode] = useState({ mode: 'grid', sortBy: 'date' });
  const [folderStructure, setFolderStructure] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
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
  
  // Get auth context
  const { user } = useAuth();

  const validateMetadata = () => {
    if (!metadata.eventName || !metadata.venueName || !metadata.promoterName || !metadata.date) {
      return false;
    }
    return true;
  };

  // Storage limit in bytes (10GB)
  const storageLimit = 10 * 1024 * 1024 * 1024;

  // Filter uploads based on search query
  const filteredUploads = uploads.filter(upload => {
    if (!searchQuery) return true;
    return upload.file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (upload.folderPath && upload.folderPath.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Process uploads
  const processUploads = async () => {
    if (!validateMetadata()) {
      alert('Please fill in all required fields');
      return;
    }

    // Process pending files with metadata
    const newUploads = pendingFiles.map(file => {
      // Clean up folder path - don't use '.' as a folder path
      let folderPath = null;
      if (file.path) {
        const pathParts = file.path.split('/').slice(0, -1);
        if (pathParts.length > 0 && pathParts.join('/') !== '.') {
          folderPath = pathParts.join('/');
        }
      }

      return {
        id: uuidv4(),
        file,
        progress: 0,
        status: 'uploading',
        metadata: { ...metadata },
        folderPath: folderPath
      };
    });

    setUploads(prev => [...prev, ...newUploads]);
    setPendingFiles([]);
    setShowMetadataForm(false);

    // Process uploads one by one
    for (const upload of newUploads) {
      try {
        await uploadFile(upload);
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'error', error: error.message || 'Upload failed' }
            : u
        ));

        if (onError) {
          onError(error);
        }
      }
    }

    if (onUploadComplete) {
      onUploadComplete(newUploads);
    }
  };

  // Upload a single file
  const uploadFile = async (upload) => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, progress: Math.min(progress, 99) } : u
      ));
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);

    try {
      // Use the current user from auth context
      const userId = user?.id;
      
      if (!userId) {
        console.warn("⚠️ No user ID found in auth context. Upload will proceed with unknown user.");
      } else {
        console.log(`👤 Using user ID from auth context: ${userId}`);
      }
      
      // Call AWS photo service with user ID explicitly set
      const result = await awsPhotoService.uploadPhoto(
        upload.file,
        eventId,
        upload.folderPath,
        {
          ...upload.metadata,
          user_id: userId,
          uploadedBy: userId,
          uploaded_by: userId,
          externalAlbumLink: upload.metadata.albumLink
        },
        (progress) => {
          setUploads(prev => prev.map(u => 
            u.id === upload.id ? { ...u, progress: Math.min(progress, 99) } : u
          ));
        }
      );

      clearInterval(interval);

      // Explicitly set the photo visibility to VISIBLE in the visibility table
      if (result.success && result.photoId && userId) {
        console.log(`Setting visibility for new photo ${result.photoId} to VISIBLE`);
        try {
          await updatePhotoVisibility(userId, [result.photoId], 'VISIBLE');
          console.log(`✅ Successfully set visibility for photo ${result.photoId} to VISIBLE`);
        } catch (visibilityError) {
          console.error(`❌ Error setting visibility for photo ${result.photoId}:`, visibilityError);
        }
      }

      // Update with success
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { 
          ...u, 
          status: 'complete', 
          progress: 100,
          photoDetails: result 
        } : u
      ));

      return result;
    } catch (error) {
      clearInterval(interval);
      throw error;
    }
  };

  // Remove upload
  const removeUpload = (id) => {
    setUploads(prev => {
      const uploadToRemove = prev.find(u => u.id === id);
      const newUploads = prev.filter(u => u.id !== id);
      
      // Update total storage calculation
      if (uploadToRemove) {
        setTotalStorage(prev => prev - uploadToRemove.file.size);
      }
      
      return newUploads;
    });
  };

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    // Calculate total size
    const newSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);
    const projectedSize = totalStorage + newSize;
    
    if (projectedSize > storageLimit) {
      alert('Uploading these files would exceed your storage limit of 10GB');
      return;
    }
    
    // Update total storage
    setTotalStorage(projectedSize);
    
    // Update folder structure
    const newStructure = { ...folderStructure };
    
    acceptedFiles.forEach(file => {
      if (file.path) {
        const parts = file.path.split('/');
        if (parts.length > 1) {
          let current = newStructure;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
        }
      }
    });
    
    setFolderStructure(newStructure);
    
    // Show metadata form before starting upload
    setPendingFiles(acceptedFiles);
    setShowMetadataForm(true);
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

  // Dropzone hook
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.cr2', '.nef', '.arw', '.rw2']
    },
    maxSize: 100 * 1024 * 1024 // 100MB max file size
  });

  return (
    <div className="relative p-4 bg-white shadow-lg rounded-lg border border-gray-200 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Upload Photos
      </h2>
      
      <div className="w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-apple-gray-700">Storage Usage</span>
            <span className="text-sm text-apple-gray-500">{(totalStorage / 1024 / 1024 / 1024).toFixed(2)}GB of 10GB</span>
          </div>
          <div className="h-2 bg-apple-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-apple-blue-500 transition-all duration-300" style={{ width: `${(totalStorage / storageLimit) * 100}%` }}></div>
          </div>
        </div>

        {/* File Dropzone - touch-friendly */}
        <div 
          {...getRootProps()} 
          className={cn(
            "mt-4 p-10 border-4 border-dashed rounded-xl text-center transition-colors duration-300 min-h-[200px] flex flex-col items-center justify-center", 
            isDragActive ? "border-blue-500 bg-blue-50" : "border-blue-300 bg-blue-50",
            uploads.length > 0 && "mb-8"
          )}
        >
          <input {...getInputProps()} multiple type="file" accept="image/*" className="hidden" aria-label="Upload files" />
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-lg">
            <Upload className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-gray-700 mb-4 text-lg font-semibold">
            {isDragActive ? "Drop the photos or folders here" : "Drag and drop photos here"}
          </p>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transform transition hover:scale-105 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              // Trigger the hidden file input click
              document.querySelector('input[type="file"]').click();
            }}
            type="button"
          >
            <Upload className="w-6 h-6 mr-2" />
            UPLOAD
          </button>
          
          <p className="text-gray-600 text-sm mt-4">Supported formats: JPG, PNG, WebP, RAW • Max 100MB per file</p>
        </div>
        
        {/* Uploads list with touch-friendly controls */}
        {uploads.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setViewMode(prev => ({ ...prev, mode: 'grid' }))}
                variant={viewMode.mode === 'grid' ? 'primary' : 'secondary'}
                size="sm"
                icon={<Grid className="w-4 h-4" />}
                aria-label="Grid view"
              />
              <Button
                onClick={() => setViewMode(prev => ({ ...prev, mode: 'list' }))}
                variant={viewMode.mode === 'list' ? 'primary' : 'secondary'}
                size="sm"
                icon={<List className="w-4 h-4" />}
                aria-label="List view"
              />
              
              <div className="h-6 w-px bg-apple-gray-200 mx-2"></div>
              
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400" />
                <input
                  type="text"
                  placeholder="Search uploads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-md bg-apple-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Filter className="w-4 h-4" />}
              >
                Filter
              </Button>
              
              <select
                value={viewMode.sortBy}
                onChange={(e) => setViewMode(prev => ({ ...prev, sortBy: e.target.value }))}
                className="py-2 pl-4 pr-10 rounded-md border border-apple-gray-200 bg-white"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Folder structure */}
        {Object.keys(folderStructure).length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-apple-gray-700 mb-2">Folders</h3>
            {renderFolderStructure(folderStructure)}
          </div>
        )}
        
        {/* Upload grid with touch-friendly controls */}
        <AnimatePresence>
          {uploads.length > 0 && (
            <div 
              className={cn(
                "grid gap-4",
                viewMode.mode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1"
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
                        className="w-full h-full object-cover rounded-tl-lg rounded-tr-lg"
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
                        <Check className="w-8 h-8 text-white" />
                      )}
                      {upload.status === 'error' && (
                        <AlertTriangle className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-apple-gray-900 truncate">{upload.file.name}</p>
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
                            <Info className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => removeUpload(upload.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-apple-gray-400 hover:text-apple-gray-600"
                          aria-label="Remove upload"
                        >
                          <X className="w-5 h-5" />
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
                              <Users className="w-4 h-4 mr-1" />
                              {upload.photoDetails.matched_users.length} {upload.photoDetails.matched_users.length === 1 ? 'Match' : 'Matches'}
                            </div>
                          ) : (
                            <div className="bg-apple-gray-200 text-apple-gray-600 px-2 py-1 rounded-full text-sm flex items-center">
                              <Users className="w-4 h-4 mr-1" />
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
          )}
        </AnimatePresence>
      </div>

      {/* Photo details dialog - using our new Dialog component */}
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

      {/* Metadata form dialog - using our new Dialog component */}
      <Dialog
        isOpen={showMetadataForm}
        onClose={() => {
          setShowMetadataForm(false);
          setPendingFiles([]);
        }}
        title="Photo Details"
        description="Please provide information about these photos"
        maxWidth="max-w-3xl"
        actions={[
          {
            label: "Cancel",
            onClick: () => {
              setShowMetadataForm(false);
              setPendingFiles([]);
            },
            variant: "secondary"
          },
          {
            label: "Continue Upload",
            onClick: processUploads,
            variant: "primary",
            className: "bg-blue-600 text-white font-bold shadow-lg"
          }
        ]}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name*
            </label>
            <input
              type="text"
              value={metadata.eventName}
              onChange={(e) => setMetadata({ ...metadata, eventName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              value={metadata.venueName}
              onChange={(e) => setMetadata({ ...metadata, venueName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              value={metadata.promoterName}
              onChange={(e) => setMetadata({ ...metadata, promoterName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              value={metadata.date}
              onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Album Link (optional)
            </label>
            <input
              type="url"
              value={metadata.albumLink}
              onChange={(e) => setMetadata({ ...metadata, albumLink: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com/album"
            />
            <p className="mt-1 text-xs text-gray-500">Enter a URL to the album or event page</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (optional)
            </label>
            <GoogleMaps
              location={metadata.location}
              onLocationChange={(location) => setMetadata({ ...metadata, location })}
              height="220px"
              className="rounded overflow-hidden border border-gray-300"
            />
          </div>
        </div>
      </Dialog>

      {/* Image viewer - using our new ImageViewer component */}
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