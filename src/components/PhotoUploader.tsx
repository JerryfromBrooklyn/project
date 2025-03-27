import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, Check, Image as ImageIcon, AlertTriangle, Folder, List, Grid, 
  Filter, Search, Edit2, Calendar, MapPin, User, Building, Users, Info 
} from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { PhotoMetadata, UploadItem } from '../types';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { GoogleMaps } from './GoogleMaps';
import { v4 as uuidv4 } from 'uuid';

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
    date: new Date().toISOString().split('T')[0]
  });
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<UploadItem | null>(null);

  useEffect(() => {
    // Fetch current storage usage
    const fetchStorageUsage = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await PhotoService.getUserStorageUsage(user.id);
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if total upload size would exceed limit
    const uploadSize = acceptedFiles.reduce((total, file) => total + file.size, 0);
    if (totalStorage + uploadSize > storageLimit) {
      onError?.('Upload would exceed your 10GB storage limit');
      return;
    }

    // Store files for later processing
    setPendingFiles(acceptedFiles);
    setShowMetadataForm(true);
  }, [totalStorage, storageLimit, onError]);

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

      // Add file to uploads
      const uploadItem = {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending' as const,
        folderPath: pathParts.length ? pathParts.join('/') : null
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

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploads(prev => 
            prev.map(u => {
              if (u.id === upload.id && u.status === 'uploading' && u.progress < 90) {
                return { ...u, progress: u.progress + 10 };
              }
              return u;
            })
          );
        }, 200);

        // Prepare photo metadata
        const photoMetadata: Partial<PhotoMetadata> = {
          title: upload.file.name,
          event_details: {
            name: metadata.eventName,
            date: metadata.date,
            promoter: metadata.promoterName
          },
          venue: {
            name: metadata.venueName
          },
          // Only include location if it has valid data
          ...(metadata.location && metadata.location.name && metadata.location.lat && metadata.location.lng 
            ? { 
                location: {
                  lat: metadata.location.lat,
                  lng: metadata.location.lng,
                  name: metadata.location.name
                } 
              } 
            : {}),
          date_taken: metadata.date
        };

        // Upload photo
        const result = await PhotoService.uploadPhoto(
          upload.file,
          eventId,
          upload.folderPath,
          photoMetadata
        );

        clearInterval(progressInterval);

        if (result.success) {
          const updatedUpload = {
            ...upload,
            status: 'complete' as const,
            progress: 100,
            photoId: result.photoId,
            photoDetails: result.photoMetadata
          };

          setUploads(prev => 
            prev.map(u => 
              u.id === upload.id 
                ? updatedUpload
                : u
            )
          );

          onUploadComplete?.(result.photoId!);
          
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

    // Reset metadata form
    setShowMetadataForm(false);
    setPendingFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
  });

  const handleFolderRename = async (oldPath: string, newName: string) => {
    try {
      // Update folder name in database
      await PhotoService.renameFolder(oldPath, newName);
      
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="ios-label flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Event Name*
                </label>
                <input
                  type="text"
                  value={metadata.eventName}
                  onChange={(e) => setMetadata({ ...metadata, eventName: e.target.value })}
                  className="ios-input"
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div>
                <label className="ios-label flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Venue Name*
                </label>
                <input
                  type="text"
                  value={metadata.venueName}
                  onChange={(e) => setMetadata({ ...metadata, venueName: e.target.value })}
                  className="ios-input"
                  placeholder="Enter venue name"
                  required
                />
              </div>
              <div>
                <label className="ios-label flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Promoter Name*
                </label>
                <input
                  type="text"
                  value={metadata.promoterName}
                  onChange={(e) => setMetadata({ ...metadata, promoterName: e.target.value })}
                  className="ios-input"
                  placeholder="Enter promoter name"
                  required
                />
              </div>
              <div>
                <label className="ios-label flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date*
                </label>
                <input
                  type="date"
                  value={metadata.date}
                  onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                  className="ios-input"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="ios-label flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location (optional)
                </label>
                <GoogleMaps
                  location={metadata.location}
                  onLocationChange={(location) => setMetadata({ ...metadata, location })}
                  height="300px"
                  className="rounded-apple overflow-hidden"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowMetadataForm(false);
                  setPendingFiles([]);
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
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="ios-button-secondary flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <select
              value={viewMode.sortBy}
              onChange={(e) => setViewMode(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'name' | 'size' }))}
              className="ios-input py-2 pl-4 pr-10"
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
                ? "grid-cols-1 md:grid-cols-3" 
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
                  "bg-white rounded-apple shadow-sm border border-apple-gray-200",
                  viewMode.mode === 'list' && "flex items-center"
                )}
              >
                {/* Thumbnail/Preview */}
                <div className={cn(
                  "relative",
                  viewMode.mode === 'grid' 
                    ? "aspect-square" 
                    : "w-20 h-20"
                )}>
                  {upload.file.type.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(upload.file)}
                      alt={upload.file.name}
                      className="w-full h-full object-cover rounded-tl-apple rounded-tr-apple"
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
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {upload.status === 'complete' && (
                      <Check className="w-8 h-8 text-white" />
                    )}
                    {upload.status === 'error' && (
                      <AlertTriangle className="w-8 h-8 text-white" />
                    )}
                  </div>
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
                          onClick={() => setSelectedUpload(upload)}
                          className="text-apple-gray-400 hover:text-apple-gray-600"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="text-apple-gray-400 hover:text-apple-gray-600"
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

      {/* Photo Details Modal */}
      <AnimatePresence>
        {selectedUpload && selectedUpload.photoDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedUpload(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full bg-white rounded-apple-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Photo Details</h3>
                  <button
                    onClick={() => setSelectedUpload(null)}
                    className="text-apple-gray-400 hover:text-apple-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="aspect-video rounded-apple-xl overflow-hidden mb-6">
                  <img
                    src={URL.createObjectURL(selectedUpload.file)}
                    alt={selectedUpload.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {renderUploadDetails(selectedUpload)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoUploader;