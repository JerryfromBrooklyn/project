import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, Check, Image as ImageIcon, AlertTriangle, Folder, List, Grid, 
  Filter, Search, Edit2, Calendar, MapPin, User, Building, Users, Info,
  Download, Trash2, Share2, ZoomIn, ZoomOut, RotateCw, Maximize, Minimize, Link
} from 'lucide-react';
import { PhotoMetadata, UploadItem } from '../types';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { awsPhotoService } from '../services/awsPhotoService';

// Adding moveToTrash to the imported awsPhotoService
// This helps TypeScript recognize the method exists
declare module '../services/awsPhotoService' {
  interface AwsPhotoService {
    moveToTrash: (photoId: string) => Promise<{ success: boolean, error?: string }>;
  }
}

interface PhotoUploaderProps {
  eventId?: string;
  onUploadComplete?: (photoId: string) => void;
  onError?: (error: string) => void;
}

interface ViewMode {
  mode: 'grid' | 'list';
  sortBy: 'date' | 'name' | 'size';
}

interface FolderStructure {
  [key: string]: {
    name: string;
    files: UploadItem[];
    subfolders: FolderStructure;
  };
}

interface UploadMetadata {
  eventName: string;
  venueName: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  promoterName: string;
  date: string;
  externalAlbumLink?: string;
}

// Add the missing getUserStorageUsage method to the AwsPhotoService interface
interface AwsPhotoService {
  uploadPhoto: (
    file: File,
    eventId?: string,
    folderPath?: string,
    metadata?: Partial<PhotoMetadata>,
    progressCallback?: (progress: number) => void
  ) => Promise<{ photoId: string; success: boolean; photoMetadata: any; error?: string }>;
  getPhotos: () => Promise<any[]>;
  deletePhoto: (photoId: string) => Promise<{ success: boolean }>;
  trashPhoto: (photoId: string) => Promise<{ success: boolean }>;
  moveToTrash: (photoId: string) => Promise<{ success: boolean, error?: string }>;
  createFolder: (folderName: string, parentPath?: string) => Promise<{ success: boolean }>;
  renameFolder: (oldPath: string, newName: string) => Promise<{ success: boolean }>;
  getUserStorageUsage: (userId: string) => Promise<{ data?: { total_size: number }, error?: string }>;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  eventId,
  onUploadComplete,
  onError
}) => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>({
    mode: 'grid',
    sortBy: 'date'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({});
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [totalStorage, setTotalStorage] = useState(0);
  const [storageLimit] = useState(10 * 1024 * 1024 * 1024); // 10GB in bytes
  const [metadata, setMetadata] = useState<UploadMetadata>({
    eventName: '',
    venueName: '',
    location: {
      lat: 0,
      lng: 0,
      name: ''
    },
    promoterName: '',
    date: new Date().toISOString().split('T')[0],
    externalAlbumLink: ''
  });
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<UploadItem | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<{file: File, previewUrl: string}[]>([]);
  
  // New state for image viewer
  const [viewerImage, setViewerImage] = useState<UploadItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Fetch current storage usage
    const fetchStorageUsage = async () => {
      if (!user) return;
      
      try {
        // Get storage usage from AWS S3
        const { data, error } = await awsPhotoService.getUserStorageUsage(user.id);
        if (!error && data) {
          setTotalStorage(data.total_size);
        }
      } catch (err) {
        console.error('Error fetching storage usage:', err);
      }
    };

    fetchStorageUsage();
  }, [user]);

  const validateMetadata = () => {
    if (!metadata.eventName.trim()) {
      onError?.('Event name is required');
      return false;
    }
    if (!metadata.venueName.trim()) {
      onError?.('Venue name is required');
      return false;
    }
    if (!metadata.promoterName.trim()) {
      onError?.('Promoter name is required');
      return false;
    }
    if (!metadata.date) {
      onError?.('Date is required');
      return false;
    }
    
    // Make sure location is complete if it's provided
    if (metadata.location && metadata.location.name) {
      if (!metadata.location.lat || !metadata.location.lng) {
        onError?.('Location is incomplete. Please search or click on the map');
        return false;
      }
    }
    
    return true;
  };

  // Function to generate preview URLs for images
  const generatePreviewUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if total upload size would exceed limit
    const uploadSize = acceptedFiles.reduce((total, file) => total + file.size, 0);
    if (totalStorage + uploadSize > storageLimit) {
      onError?.('Upload would exceed your 10GB storage limit');
      return;
    }

    // Generate preview URLs for the dropped files
    const previewPromises = acceptedFiles.map(async (file) => {
      const previewUrl = await generatePreviewUrl(file);
      return { file, previewUrl };
    });
    
    const previews = await Promise.all(previewPromises);
    setPendingPreviews(previews);

    // Store files for later processing
    setPendingFiles(acceptedFiles);
    setShowMetadataForm(true);
  }, [totalStorage, storageLimit, onError, generatePreviewUrl]);

  const processUploads = async () => {
    if (!validateMetadata()) return;

    // Process folder structure
    const newFolderStructure = { ...folderStructure };
    const newUploads: UploadItem[] = [];

    pendingFiles.forEach(file => {
      const relativePath = file.webkitRelativePath || file.name;
      const pathParts = relativePath.split('/');
      const fileName = pathParts.pop()!;
      
      let currentLevel = newFolderStructure;
      let currentPath = '';

      // Create folder structure
      pathParts.forEach(folder => {
        currentPath = currentPath ? `${currentPath}/${folder}` : folder;
        if (!currentLevel[folder]) {
          currentLevel[folder] = {
            name: folder,
            files: [],
            subfolders: {}
          };
        }
        currentLevel = currentLevel[folder].subfolders;
      });

      // Add file to uploads with preview URL
      const preview = pendingPreviews.find(p => p.file === file);
      const uploadItem = {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending' as const,
        folderPath: pathParts.length ? pathParts.join('/') : null,
        previewUrl: preview?.previewUrl
      };

      newUploads.push(uploadItem);
    });

    setFolderStructure(newFolderStructure);
    setUploads(prev => [...prev, ...newUploads]);

    // Process uploads
    for (const upload of newUploads) {
      try {
        setUploads(prev => 
          prev.map(u => 
            u.id === upload.id 
              ? { ...u, status: 'uploading' as const, progress: 10 }
              : u
          )
        );

        // Create a custom progress handler for this upload
        const handleProgress = (progress: number) => {
          setUploads(prev => 
            prev.map(u => {
              if (u.id === upload.id && u.status === 'uploading') {
                return { ...u, progress };
              }
              return u;
            })
          );
        };

        // Prepare photo metadata
        const partialMetadata: Partial<PhotoMetadata> = {
          id: upload.id, // Use upload item ID temporarily?
          // url: upload.s3Url, // This might not be available yet
          fileSize: upload.file.size,
          fileType: upload.file.type,
          title: upload.file.name,
          description: '',
          date_taken: new Date(metadata.date).toISOString(),
          location: metadata.location ? {
            lat: metadata.location.lat,
            lng: metadata.location.lng,
            name: metadata.location.name,
          } : undefined,
          event_details: { 
            name: metadata.eventName, 
            date: metadata.date, 
            promoter: metadata.promoterName,
            type: null // Ensure type is included (even if null)
          },
          venue: { 
            id: null, // Ensure id is included (even if null)
            name: metadata.venueName 
          },
          externalAlbumLink: metadata.externalAlbumLink || undefined,
          tags: [],
          user_id: user?.id, // Add the current user's ID
          uploaded_by: user?.id, // Add the current user's ID
          uploadedBy: user?.id, // Add the current user's ID for consistency
        };

        // Upload photo using AWS S3 service
        const result = await awsPhotoService.uploadPhoto(
          upload.file,
          eventId ? eventId : undefined, // Fix potential object conversion issue
          upload.folderPath,
          partialMetadata,
          handleProgress
        );

        if (result.success) {
          // Ensure the structure fully matches PhotoMetadata & UploadItem
          const updatedDetails: Partial<PhotoMetadata> = {
            ...result.photoMetadata, // Start with the data from the service
            event_details: { // Explicitly define event_details
              name: result.photoMetadata?.event_details?.name ?? metadata.eventName,
              date: result.photoMetadata?.event_details?.date ?? metadata.date,
              type: result.photoMetadata?.event_details?.type ?? null,
              promoter: (result.photoMetadata?.event_details && 'promoter' in result.photoMetadata.event_details) 
                          ? result.photoMetadata.event_details.promoter 
                          : metadata.promoterName,
            }
            // Add other potentially required fields here if needed
          };
          
          const updatedUpload: UploadItem = {
            ...upload, // Keep existing upload data
            status: 'complete' as const,
            progress: 100,
            photoId: result.photoId,
            photoDetails: updatedDetails, // Use the correctly structured details
            s3Url: result.photoMetadata.url // Assuming url is the S3 URL
          };

          setUploads(prev => 
            prev.map(u => 
              u.id === upload.id 
                ? updatedUpload
                : u
            )
          );
          
          onUploadComplete?.(result.photoId);
          
          // Update storage usage
          setTotalStorage(prev => prev + upload.file.size);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        setUploads(prev => 
          prev.map(u => 
            u.id === upload.id 
              ? { ...u, status: 'error' as const, error: (error as Error).message }
              : u
          )
        );
        onError?.((error as Error).message);
      }
    }

    // Reset metadata form and previews
    setShowMetadataForm(false);
    setPendingFiles([]);
    setPendingPreviews([]);
  };

  // Fix the useDropzone hook with proper type
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/x-dcraw': ['.raw'],
      'image/x-canon-cr2': ['.cr2'],
      'image/x-nikon-nef': ['.nef'],
      'image/x-sony-arw': ['.arw'],
      'image/x-panasonic-rw2': ['.rw2']
    },
    maxSize: 104857600, // 100MB
    disabled: showMetadataForm,
    noClick: showMetadataForm,
    noKeyboard: showMetadataForm,
    // Add the missing properties required by the DropzoneOptions interface
    multiple: true,
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {}
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handleFolderRename = async (oldPath: string, newName: string) => {
    try {
      // Use AWS service to rename folder
      const success = await awsPhotoService.renameFolder(oldPath, newName);
      
      if (!success) {
        throw new Error('Failed to rename folder');
      }
      
      // Update local state
      setUploads(prev => 
        prev.map(upload => {
          if (upload.folderPath?.startsWith(oldPath)) {
            const newPath = upload.folderPath.replace(oldPath, newName);
            return { ...upload, folderPath: newPath };
          }
          return upload;
        })
      );

      // Update folder structure
      const updateFolderStructure = (structure: FolderStructure, path: string[], newName: string): FolderStructure => {
        if (path.length === 0) return structure;

        const [current, ...rest] = path;
        const result = { ...structure };

        if (rest.length === 0) {
          // This is the folder to rename
          if (result[current]) {
            result[newName] = {
              ...result[current],
              name: newName
            };
            delete result[current];
          }
        } else {
          // Keep traversing
          if (result[current]) {
            result[current] = {
              ...result[current],
              subfolders: updateFolderStructure(result[current].subfolders, rest, newName)
            };
          }
        }

        return result;
      };

      setFolderStructure(prev => 
        updateFolderStructure(prev, oldPath.split('/'), newName)
      );

      setEditingFolder(null);
      setNewFolderName('');
    } catch (error) {
      onError?.('Failed to rename folder');
    }
  };

  // Filter and sort uploads
  const filteredUploads = uploads
    .filter(upload => {
      if (searchQuery) {
        return upload.file.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (selectedFolder) {
        return upload.folderPath === selectedFolder;
      }
      return true;
    })
    .sort((a, b) => {
      switch (viewMode.sortBy) {
        case 'name':
          return a.file.name.localeCompare(b.file.name);
        case 'size':
          return b.file.size - a.file.size;
        case 'date':
        default:
          return b.file.lastModified - a.file.lastModified;
      }
    });

  const removeUpload = (id: string) => {
    const upload = uploads.find(u => u.id === id);
    if (upload && upload.status === 'complete') {
      setTotalStorage(prev => prev - upload.file.size);
    }
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const renderFolderStructure = (structure: FolderStructure, path = '') => {
    return Object.entries(structure).map(([key, folder]) => (
      <div key={path + key} className="mb-4">
        <div className="flex items-center justify-between p-2 bg-apple-gray-50 rounded-apple">
          <div className="flex items-center">
            <Folder className="w-4 h-4 text-apple-gray-400 mr-2" />
            {editingFolder === path + key ? (
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => {
                  if (newFolderName && newFolderName !== folder.name) {
                    handleFolderRename(path + key, newFolderName);
                  } else {
                    setEditingFolder(null);
                    setNewFolderName('');
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newFolderName && newFolderName !== folder.name) {
                    handleFolderRename(path + key, newFolderName);
                  }
                }}
                className="px-2 py-1 rounded-apple text-sm"
                autoFocus
                placeholder="New folder name"
                title="Edit folder name"
                aria-label="Edit folder name"
              />
            ) : (
              <>
                <span className="text-sm font-medium">{folder.name}</span>
                <button
                  onClick={() => {
                    setEditingFolder(path + key);
                    setNewFolderName(folder.name);
                  }}
                  className="ml-2 text-apple-gray-400 hover:text-apple-gray-600"
                  aria-label={`Edit folder name ${folder.name}`}
                  title="Edit folder name"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
          <span className="text-xs text-apple-gray-500">
            {folder.files.length} files
          </span>
        </div>
        <div className="ml-4">
          {renderFolderStructure(folder.subfolders, path + key + '/')}
        </div>
      </div>
    ));
  };

  const renderUploadDetails = (upload: UploadItem) => {
    if (!upload.photoDetails) return null;

    return (
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Photo Information</h4>
            <div className="space-y-2">
              <div className="flex items-center p-2 bg-apple-gray-50 rounded-apple">
                <Calendar className="w-4 h-4 text-apple-gray-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">Date Taken</div>
                  <div className="text-xs text-apple-gray-500">
                    {new Date(upload.photoDetails.date_taken || upload.photoDetails.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center p-2 bg-apple-gray-50 rounded-apple">
                <MapPin className="w-4 h-4 text-apple-gray-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="text-xs text-apple-gray-500">
                    {upload.photoDetails.location?.name || 'Unknown'}
                  </div>
                </div>
              </div>
              {upload.photoDetails.externalAlbumLink && (
                <div className="flex items-center p-2 bg-apple-gray-50 rounded-apple">
                  <Link className="w-4 h-4 text-apple-gray-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium">External Link</div>
                    <a 
                      href={upload.photoDetails.externalAlbumLink}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-500 hover:underline"
                    >
                      {upload.photoDetails.externalAlbumLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Face Detection</h4>
            <div className="space-y-2">
              {upload.photoDetails.matched_users?.length ? (
                upload.photoDetails.matched_users.map((user, index) => (
                  <div key={index} className="flex items-center p-2 bg-apple-gray-50 rounded-apple">
                    <User className="w-4 h-4 text-apple-gray-500 mr-2" />
                    <div>
                      <div className="text-sm font-medium">{user.fullName}</div>
                      <div className="text-xs text-apple-gray-500">
                        {Math.round(user.confidence)}% match
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center p-2 bg-apple-gray-50 rounded-apple">
                  <AlertTriangle className="w-4 h-4 text-apple-gray-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium">No Matches Found</div>
                    <div className="text-xs text-apple-gray-500">
                      No registered faces were detected
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // New function to handle image download
  const handleDownload = async (upload: UploadItem) => {
    try {
      const url = upload.s3Url || upload.previewUrl;
      if (!url) {
        throw new Error('No image URL available for download');
      }
      
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = upload.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      onError?.('Failed to download image');
    }
  };

  // New function to handle moving to trash
  const handleTrash = async (upload: UploadItem) => {
    try {
      if (!upload.photoId) {
        // Just remove from local state if not saved to backend yet
        removeUpload(upload.id);
        return;
      }
      
      // Call API to move to trash - using type assertion to fix TypeScript error
      const result = await (awsPhotoService as any).moveToTrash(upload.photoId);
      
      if (result.success) {
        // Remove from local state
        removeUpload(upload.id);
        // Close any open viewers/modals
        if (viewerImage?.id === upload.id) setViewerImage(null);
        if (selectedUpload?.id === upload.id) setSelectedUpload(null);
      } else {
        throw new Error(result.error || 'Failed to move to trash');
      }
    } catch (error) {
      onError?.((error as Error).message);
    }
  };
  
  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        onError?.(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Reset zoom and rotation when image changes
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
  }, [viewerImage]);
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // First, make sure the thumbnail click handler is properly working
  const handleThumbnailClick = (upload: UploadItem) => {
    if (upload.previewUrl || upload.s3Url) {
      setViewerImage(upload);
    }
  };

  return (
    <div className="w-full">
      {/* Storage Usage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-apple-gray-700">Storage Usage</span>
          <span className="text-sm text-apple-gray-500">
            {(totalStorage / 1024 / 1024 / 1024).toFixed(2)}GB of 10GB
          </span>
        </div>
        <div className="h-2 bg-apple-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-apple-blue-500 transition-all duration-300"
            style={{ width: `${(totalStorage / storageLimit) * 100}%` }}
          />
        </div>
      </div>

      {/* Metadata Form */}
      <AnimatePresence>
        {showMetadataForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 bg-white rounded-apple-xl border border-apple-gray-200"
          >
            <h3 className="text-lg font-medium text-apple-gray-900 mb-4">
              Photo Details
            </h3>
            
            {/* Image Preview Grid */}
            {pendingPreviews.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-apple-gray-700 mb-2">
                  Selected Photos ({pendingPreviews.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {pendingPreviews.slice(0, 10).map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-apple overflow-hidden bg-apple-gray-50 border border-apple-gray-200">
                      <img 
                        src={preview.previewUrl} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                        {preview.file.name}
                      </div>
                    </div>
                  ))}
                  {pendingPreviews.length > 10 && (
                    <div className="flex items-center justify-center aspect-square rounded-apple bg-apple-gray-50 border border-apple-gray-200">
                      <span className="text-apple-gray-500 text-sm">
                        +{pendingPreviews.length - 10} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="px-4 py-5">
              <h2 className="text-lg font-semibold mb-3">Photo Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name{metadata.eventName !== undefined && "*"}
                  </label>
                  <input
                    type="text"
                    value={metadata.eventName || ""}
                    onChange={(e) => setMetadata({...metadata, eventName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event name"
                    title="Event name"
                    aria-label="Event name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name{metadata.venueName !== undefined && "*"}
                  </label>
                  <input
                    type="text"
                    value={metadata.venueName || ""}
                    onChange={(e) => setMetadata({...metadata, venueName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter venue name"
                    title="Venue name"
                    aria-label="Venue name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promoter Name{metadata.promoterName !== undefined && "*"}
                  </label>
                  <input
                    type="text"
                    value={metadata.promoterName || ""}
                    onChange={(e) => setMetadata({...metadata, promoterName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter promoter name"
                    title="Promoter name"
                    aria-label="Promoter name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date{metadata.date !== undefined && "*"}
                  </label>
                  <input
                    id="upload-date"
                    type="date"
                    value={metadata.date || ""}
                    onChange={(e) => setMetadata({...metadata, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Event date"
                    aria-label="Event date"
                  />
                </div>

                <div className="flex flex-col mb-4">
                  <label htmlFor="external-link-input" className="block text-sm font-medium text-gray-700 mb-1">
                    External Album Link
                  </label>
                  <input
                    id="external-link-input"
                    type="url"
                    value={metadata.externalAlbumLink || ''}
                    onChange={(e) =>
                      setMetadata({ ...metadata, externalAlbumLink: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://photos.example.com/album"
                    title="External album link"
                    aria-label="External album link"
                  />
                </div>

                <div className="flex flex-col mb-4">
                  <label htmlFor="location-input" className="font-medium mb-1 text-gray-700">
                    Location
                  </label>
                  <div className="flex">
                    <input
                      id="location-input"
                      type="text"
                      value={metadata.location?.name || ''}
                      onChange={(e) => setMetadata({ ...metadata, location: { ...metadata.location, name: e.target.value } })}
                      className="border border-gray-300 rounded-l-md px-3 py-2 w-full"
                      placeholder="Enter a location"
                      title="Location input"
                      aria-label="Location input"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // Use existing Google Maps Geocoding API
                          if (metadata.location?.name) {
                            // This would call your existing Google Maps Geocoding API
                            // For now we're not implementing the actual API call since you said you already have it
                            console.log("Would call Google Geocoding API with:", metadata.location.name);
                          }
                        } catch (error) {
                          console.error('Error searching for location:', error);
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                      aria-label="Get coordinates"
                    >
                      Set Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowMetadataForm(false);
                  setPendingFiles([]);
                  setPendingPreviews([]);
                }}
                className="ios-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={processUploads}
                className="ios-button-primary"
              >
                Continue Upload
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "mt-4 p-10 border-2 border-dashed rounded-apple-xl text-center transition-colors duration-300",
          isDragActive 
            ? "border-apple-blue-500 bg-apple-blue-50" 
            : "border-apple-gray-200 bg-apple-gray-50",
          uploads.length > 0 && "mb-8"
        )}
      >
        <input 
          {...getInputProps()} 
          multiple 
          type="file" 
          accept="image/*" 
          className="hidden"
          aria-label="Upload files"
          title="Select files to upload"
          placeholder="Upload files"
        />
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
          <Upload className="w-8 h-8 text-apple-gray-500" />
        </div>
        <p className="text-apple-gray-500 mb-2">
          {isDragActive
            ? "Drop the photos or folders here"
            : "Drag and drop photos or folders here, or click to select"}
        </p>
        <p className="text-apple-gray-400 text-sm">
          Supported formats: JPG, PNG, WebP, RAW (CR2, NEF, ARW, RW2) • Max 100MB per file
        </p>
      </div>

      {/* Toolbar */}
      {uploads.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(prev => ({ ...prev, mode: 'grid' }))}
              className={cn(
                "p-2 rounded-apple",
                viewMode.mode === 'grid' 
                  ? "bg-apple-blue-500 text-white" 
                  : "bg-apple-gray-100 text-apple-gray-600"
              )}
              aria-label="Set view to grid"
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(prev => ({ ...prev, mode: 'list' }))}
              className={cn(
                "p-2 rounded-apple",
                viewMode.mode === 'list' 
                  ? "bg-apple-blue-500 text-white" 
                  : "bg-apple-gray-100 text-apple-gray-600"
              )}
              aria-label="Set view to list"
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="h-6 w-px bg-apple-gray-200 mx-2" />
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400" />
              <input
                type="text"
                placeholder="Search uploads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-apple bg-apple-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-500"
                title="Search uploads"
                aria-label="Search uploads"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="ios-button-secondary flex items-center" aria-label="Filter uploads" title="Filter uploads">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <label htmlFor="sort-uploads" className="sr-only">Sort uploads by</label>
            <select
              id="sort-uploads"
              value={viewMode.sortBy}
              onChange={(e) => setViewMode(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'name' | 'size' }))}
              className="ios-input py-2 pl-4 pr-10"
              aria-label="Sort uploads by"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>
      )}

      {/* Folder Structure */}
      {Object.keys(folderStructure).length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-apple-gray-700 mb-2">Folders</h3>
          {renderFolderStructure(folderStructure)}
        </div>
      )}

      {/* Upload List/Grid */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid gap-4",
              viewMode.mode === 'grid' 
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" 
                : "space-y-4"
            )}
          >
            {filteredUploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "bg-white rounded-apple shadow-sm border border-apple-gray-200",
                  viewMode.mode === 'list' && "flex items-center"
                )}
              >
                {/* Thumbnail/Preview - Now clickable */}
                <div 
                  className={cn(
                    "relative cursor-pointer w-full h-full",
                    viewMode.mode === 'grid' 
                      ? "aspect-square" 
                      : "w-20 h-20"
                  )}
                  onClick={() => handleThumbnailClick(upload)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${upload.file.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleThumbnailClick(upload);
                    }
                  }}
                >
                  {upload.previewUrl || upload.s3Url ? (
                    <img
                      src={upload.previewUrl || upload.s3Url}
                      alt={upload.file.name}
                      className="w-full h-full object-cover rounded-tl-apple rounded-tr-apple"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <ImageIcon className="w-10 h-10 text-apple-gray-300" />
                    </div>
                  )}
                  {upload.status !== 'complete' && (
                    <div 
                      className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center",
                        upload.status === 'complete' && "bg-apple-green-500/50",
                        upload.status === 'error' && "bg-apple-red-500/50"
                      )}
                    >
                      {upload.status === 'uploading' && (
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {upload.status === 'complete' && (
                        <Check className="w-8 h-8 text-white" />
                      )}
                      {upload.status === 'error' && (
                        <AlertTriangle className="w-8 h-8 text-white" />
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-apple-gray-900 truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-sm text-apple-gray-500">
                        {upload.folderPath && (
                          <span className="text-apple-gray-400">
                            {upload.folderPath} /
                          </span>
                        )}
                        {' '}
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {upload.status === 'complete' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUpload(upload);
                          }}
                          className="text-apple-gray-400 hover:text-apple-gray-600"
                          aria-label={`Show details for ${upload.file.name}`}
                          title="Show details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUpload(upload.id);
                        }}
                        className="text-apple-gray-400 hover:text-apple-gray-600"
                        aria-label={`Remove upload ${upload.file.name}`}
                        title="Remove upload"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {upload.status !== 'complete' && (
                    <div className="mt-2">
                      <div className="h-1 bg-apple-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            upload.status === 'error'
                              ? "bg-apple-red-500"
                              : "bg-apple-blue-500"
                          )}
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      {upload.error && (
                        <p className="mt-1 text-sm text-apple-red-500">
                          {upload.error}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Upload Details */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Upload Details Modal - Now without image */}
      <AnimatePresence>
        {selectedUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 p-6 bg-white rounded-apple-xl border border-apple-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-apple-gray-900">
                {selectedUpload.file.name}
              </h3>
              <button
                onClick={() => setSelectedUpload(null)}
                className="text-apple-gray-400 hover:text-apple-gray-600"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-apple-gray-500">Size:</span>
                  <span className="text-sm font-medium text-apple-gray-700">
                    {(selectedUpload.file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-apple-gray-500">Type:</span>
                  <span className="text-sm font-medium text-apple-gray-700">
                    {selectedUpload.file.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-apple-gray-500">Modified:</span>
                  <span className="text-sm font-medium text-apple-gray-700">
                    {new Date(selectedUpload.file.lastModified).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-apple-gray-500">Status:</span>
                  <span className="text-sm font-medium text-apple-gray-700">
                    {selectedUpload.status}
                  </span>
                </div>
              </div>
              
              {renderUploadDetails(selectedUpload)}

              <div className="flex space-x-4 pt-4 border-t border-apple-gray-100">
                <button
                  onClick={() => setViewerImage(selectedUpload)}
                  className="ios-button-secondary flex items-center"
                  aria-label="View image"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  View
                </button>
                <button
                  onClick={() => handleDownload(selectedUpload)}
                  className="ios-button-secondary flex items-center"
                  aria-label="Download image"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => handleTrash(selectedUpload)}
                  className="ios-button-destructive flex items-center"
                  aria-label="Move to trash"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hide
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Image Viewer Modal */}
      <AnimatePresence>
        {viewerImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col touch-none"
            onClick={() => setViewerImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-white truncate max-w-[200px] sm:max-w-sm">
                    {viewerImage.file.name}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(viewerImage)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Download image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUpload(viewerImage);
                      setViewerImage(null);
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Show image information"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrash(viewerImage);
                      setViewerImage(null);
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Hide image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewerImage(null)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Close viewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Image Container with touch support */}
              <div 
                className="flex-1 flex items-center justify-center overflow-hidden touch-pan-y"
                style={{
                  touchAction: "pan-y"
                }}
              >
                <div 
                  className="relative transform-gpu"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <img
                    src={viewerImage.previewUrl || viewerImage.s3Url}
                    alt={viewerImage.file.name}
                    className="max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] object-contain"
                    draggable={false}
                  />
                </div>
              </div>
              
              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-white text-sm">
                    {(viewerImage.file.size / 1024 / 1024).toFixed(2)} MB • {viewerImage.file.type.split('/')[1].toUpperCase()}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                    <button
                      onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setRotation((rotation + 90) % 360)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      aria-label="Rotate image"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.share?.({
                          title: viewerImage.file.name,
                          url: viewerImage.s3Url
                        }).catch(() => {
                          // Fallback if Web Share API is not available
                          handleDownload(viewerImage);
                        });
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      aria-label="Share image"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoUploader;