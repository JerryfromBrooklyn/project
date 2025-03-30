import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertTriangle, Folder, List, Grid, Filter, Search, Edit2, Calendar, MapPin, User, Building, Users, Info } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { GoogleMaps } from './GoogleMaps';
import { supabase } from '../supabaseClient';
import SimplePhotoInfoModal from './SimplePhotoInfoModal';

export const PhotoUploader = ({ eventId, onUploadComplete, onError }) => {
    const { user } = useAuth();
    const [uploads, setUploads] = useState([]);
    const [viewMode, setViewMode] = useState({
        mode: 'grid',
        sortBy: 'date'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderStructure, setFolderStructure] = useState({});
    const [editingFolder, setEditingFolder] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [totalStorage, setTotalStorage] = useState(0);
    const [storageLimit] = useState(10 * 1024 * 1024 * 1024); // 10GB in bytes
    const [metadata, setMetadata] = useState({
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
    const [pendingFiles, setPendingFiles] = useState([]);
    const [selectedUpload, setSelectedUpload] = useState(null);

    useEffect(() => {
        // Fetch current storage usage
        const fetchStorageUsage = async () => {
            if (!user)
                return;
            try {
                const { data, error } = await PhotoService.getUserStorageUsage(user.id);
                if (!error && data) {
                    setTotalStorage(data.total_size);
                }
            }
            catch (err) {
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
        return true;
    };

    const onDrop = useCallback(async (acceptedFiles) => {
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
        if (!validateMetadata())
            return;
            
        console.log('[DEBUG] Processing uploads - validation passed');
        console.log('[DEBUG] Pending files:', pendingFiles.map(f => f.name));
        console.log('[DEBUG] Current user:', user?.id);
        console.log('[DEBUG] Metadata:', JSON.stringify(metadata, null, 2));
            
        // Process folder structure
        const newFolderStructure = { ...folderStructure };
        const newUploads = [];
        pendingFiles.forEach(file => {
            const relativePath = file.webkitRelativePath || file.name;
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop();
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
                status: 'pending',
                folderPath: pathParts.length ? pathParts.join('/') : null
            };
            newUploads.push(uploadItem);
        });
        
        console.log('[DEBUG] Created upload items:', newUploads.length);
        
        setFolderStructure(newFolderStructure);
        setUploads(prev => [...prev, ...newUploads]);
        
        // Process uploads
        for (const upload of newUploads) {
            try {
                console.log(`[DEBUG] Starting upload process for ${upload.file.name} (${upload.id})`);
                
                setUploads(prev => prev.map(u => u.id === upload.id
                    ? { ...u, status: 'uploading', progress: 10 }
                    : u));
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploads(prev => prev.map(u => {
                        if (u.id === upload.id && u.status === 'uploading' && u.progress < 90) {
                            return { ...u, progress: u.progress + 10 };
                        }
                        return u;
                    }));
                }, 200);
                
                // Prepare photo metadata
                const photoMetadata = {
                    title: upload.file.name,
                    event_details: {
                        name: metadata.eventName || "Untitled Event",
                        date: metadata.date || new Date().toISOString(),
                        promoter: metadata.promoterName || "Unknown"
                    },
                    venue: {
                        name: metadata.venueName || "Unknown Venue",
                        id: null
                    },
                    location: metadata.location && metadata.location.name ? metadata.location : {
                        lat: null,
                        lng: null,
                        name: "Unknown Location"
                    },
                    date_taken: metadata.date || new Date().toISOString(),
                    // Add empty structures for things that will be populated by the service
                    tags: [],
                    matched_users: []
                };
                
                console.log(`[DEBUG] Location data being uploaded:`, JSON.stringify(metadata.location, null, 2));
                console.log(`[DEBUG] Prepared metadata for ${upload.file.name}:`, JSON.stringify(photoMetadata, null, 2));
                
                // Upload photo
                console.log(`[DEBUG] Calling PhotoService.uploadPhoto for ${upload.file.name}`);
                const result = await PhotoService.uploadPhoto(upload.file, eventId, upload.folderPath, photoMetadata);
                console.log(`[DEBUG] Upload result for ${upload.file.name}:`, JSON.stringify(result, null, 2));
                
                clearInterval(progressInterval);
                
                if (result.success) {
                    console.log(`[DEBUG] Upload successful for ${upload.file.name} - photoId: ${result.photoId}`);
                    
                    const updatedUpload = {
                        ...upload,
                        status: 'complete',
                        progress: 100,
                        photoId: result.photoId,
                        photoDetails: result.photoMetadata
                    };
                    
                    setUploads(prev => prev.map(u => u.id === upload.id
                        ? updatedUpload
                        : u));
                        
                    if (onUploadComplete) {
                        console.log(`[DEBUG] Calling onUploadComplete callback for ${result.photoId}`);
                        onUploadComplete(result.photoId);
                    } else {
                        console.log(`[DEBUG] No onUploadComplete callback provided`);
                    }
                    
                    // Update storage usage
                    setTotalStorage(prev => prev + upload.file.size);
                }
                else {
                    console.error(`[DEBUG] Upload failed for ${upload.file.name}:`, result.error);
                    throw new Error(result.error);
                }
            }
            catch (error) {
                console.error(`[DEBUG] Exception during upload of ${upload.file.name}:`, error);
                
                setUploads(prev => prev.map(u => u.id === upload.id
                    ? { ...u, status: 'error', error: error.message }
                    : u));
                    
                if (onError) {
                    console.log(`[DEBUG] Calling onError callback with: ${error.message}`);
                    onError(error.message);
                } else {
                    console.log(`[DEBUG] No onError callback provided`);
                }
            }
        }
        
        console.log(`[DEBUG] All uploads processed - total: ${newUploads.length}`);
        
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

    const handleFolderRename = async (oldPath, newName) => {
        try {
            // Update folder name in database
            await PhotoService.renameFolder(oldPath, newName);
            // Update local state
            setUploads(prev => prev.map(upload => {
                if (upload.folderPath?.startsWith(oldPath)) {
                    const newPath = upload.folderPath.replace(oldPath, newName);
                    return { ...upload, folderPath: newPath };
                }
                return upload;
            }));
            // Update folder structure
            const updateFolderStructure = (structure, path, newName) => {
                if (path.length === 0)
                    return structure;
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
                }
                else {
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
            setFolderStructure(prev => updateFolderStructure(prev, oldPath.split('/'), newName));
            setEditingFolder(null);
            setNewFolderName('');
        }
        catch (error) {
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

    const removeUpload = (id) => {
        const upload = uploads.find(u => u.id === id);
        if (upload && upload.status === 'complete') {
            setTotalStorage(prev => prev - upload.file.size);
        }
        setUploads(prev => prev.filter(u => u.id !== id));
    };

    const renderFolderStructure = (structure, path = '') => {
        return Object.entries(structure).map(([key, folder]) => (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between p-2 bg-apple-gray-50 rounded-apple", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Folder, { className: "w-4 h-4 text-apple-gray-400 mr-2" }), editingFolder === path + key ? (_jsx("input", { type: "text", value: newFolderName, onChange: (e) => setNewFolderName(e.target.value), onBlur: () => {
                                        if (newFolderName && newFolderName !== folder.name) {
                                            handleFolderRename(path + key, newFolderName);
                                        }
                                        else {
                                            setEditingFolder(null);
                                            setNewFolderName('');
                                        }
                                    }, onKeyPress: (e) => {
                                        if (e.key === 'Enter' && newFolderName && newFolderName !== folder.name) {
                                            handleFolderRename(path + key, newFolderName);
                                        }
                                    }, className: "px-2 py-1 rounded-apple text-sm", autoFocus: true })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-sm font-medium", children: folder.name }), _jsx("button", { onClick: () => {
                                                setEditingFolder(path + key);
                                                setNewFolderName(folder.name);
                                            }, className: "ml-2 text-apple-gray-400 hover:text-apple-gray-600", children: _jsx(Edit2, { className: "w-3 h-3" }) })] }))] }), _jsxs("span", { className: "text-xs text-apple-gray-500", children: [folder.files.length, " files"] })] }), _jsx("div", { className: "ml-4", children: renderFolderStructure(folder.subfolders, path + key + '/') })] }, path + key)));
    };

    const renderUploadDetails = (upload) => {
        if (!upload.photoDetails)
            return null;
        return (_jsx("div", { className: "mt-4 space-y-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Photo Information" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx(Calendar, { className: "w-4 h-4 text-apple-gray-500 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Date Taken" }), _jsx("div", { className: "text-xs text-apple-gray-500", children: new Date(upload.photoDetails.date_taken || upload.photoDetails.created_at).toLocaleDateString() })] })] }), _jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx(MapPin, { className: "w-4 h-4 text-apple-gray-500 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Location" }), _jsx("div", { className: "text-xs text-apple-gray-500", children: upload.photoDetails.location?.name || 'Unknown' })] })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Face Detection" }), _jsx("div", { className: "space-y-2", children: upload.photoDetails.matched_users?.length ? (upload.photoDetails.matched_users.map((user, index) => (_jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx(User, { className: "w-4 h-4 text-apple-gray-500 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: user.fullName }), _jsxs("div", { className: "text-xs text-apple-gray-500", children: [Math.round(user.confidence), "% match"] })] })] }, index)))) : (_jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-apple-gray-500 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "No Matches Found" }), _jsx("div", { className: "text-xs text-apple-gray-500", children: "No registered faces were detected" })] })] })) })] })] }) }));
    };

    return (_jsxs("div", { className: "w-full", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-apple-gray-700", children: "Storage Usage" }), _jsxs("span", { className: "text-sm text-apple-gray-500", children: [(totalStorage / 1024 / 1024 / 1024).toFixed(2), "GB of 10GB"] })] }), _jsx("div", { className: "h-2 bg-apple-gray-100 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-apple-blue-500 transition-all duration-300", style: { width: `${(totalStorage / storageLimit) * 100}%` } }) })] }), _jsx(AnimatePresence, { children: showMetadataForm && (_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "mb-8 p-6 bg-white rounded-apple-xl border border-apple-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-apple-gray-900 mb-4", children: "Photo Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                      _jsxs("div", { children: [
                        _jsxs("label", { className: "ios-label flex items-center", children: [
                          _jsx(Calendar, { className: "w-4 h-4 mr-2" }), 
                          "Event Name*"
                        ] }), 
                        _jsx("input", { 
                          type: "text", 
                          value: metadata.eventName, 
                          onChange: (e) => setMetadata({ ...metadata, eventName: e.target.value }), 
                          className: "ios-input", 
                          placeholder: "Enter event name", 
                          required: true 
                        })
                      ] }), 
                      _jsxs("div", { children: [
                        _jsxs("label", { className: "ios-label flex items-center", children: [
                          _jsx(Building, { className: "w-4 h-4 mr-2" }), 
                          "Venue Name*"
                        ] }), 
                        _jsx("input", { 
                          type: "text", 
                          value: metadata.venueName, 
                          onChange: (e) => setMetadata({ ...metadata, venueName: e.target.value }), 
                          className: "ios-input", 
                          placeholder: "Enter venue name", 
                          required: true 
                        })
                      ] }), 
                      _jsxs("div", { children: [
                        _jsxs("label", { className: "ios-label flex items-center", children: [
                          _jsx(User, { className: "w-4 h-4 mr-2" }), 
                          "Promoter Name*"
                        ] }), 
                        _jsx("input", { 
                          type: "text", 
                          value: metadata.promoterName, 
                          onChange: (e) => setMetadata({ ...metadata, promoterName: e.target.value }), 
                          className: "ios-input", 
                          placeholder: "Enter promoter name", 
                          required: true 
                        })
                      ] }), 
                      _jsxs("div", { children: [
                        _jsxs("label", { className: "ios-label flex items-center", children: [
                          _jsx(Calendar, { className: "w-4 h-4 mr-2" }), 
                          "Date*"
                        ] }), 
                        _jsx("input", { 
                          type: "date", 
                          value: metadata.date, 
                          onChange: (e) => setMetadata({ ...metadata, date: e.target.value }), 
                          className: "ios-input", 
                          required: true 
                        })
                      ] }), 
                      _jsxs("div", { className: "md:col-span-2", children: [
                        _jsxs("label", { className: "ios-label flex items-center", children: [
                          _jsx(MapPin, { className: "w-4 h-4 mr-2" }), 
                          "Location (optional)"
                        ] }), 
                        _jsx(GoogleMaps, { 
                          location: metadata.location, 
                          onLocationChange: (location) => {
                            console.log('[DEBUG] Setting location data from GoogleMaps:', JSON.stringify(location, null, 2));
                            setMetadata({ ...metadata, location });
                          },
                          height: "300px", 
                          className: "rounded-apple overflow-hidden" 
                        })
                      ] })
                    ] }), 
                    _jsxs("div", { className: "flex justify-end space-x-4 mt-6", children: [
                      _jsx("button", { 
                        onClick: () => {
                          setShowMetadataForm(false);
                          setPendingFiles([]);
                        }, 
                        className: "ios-button-secondary", 
                        children: "Cancel" 
                      }), 
                      _jsx("button", { 
                        onClick: processUploads, 
                        className: "ios-button-primary", 
                        children: "Continue Upload" 
                      })
                    ] })
                  ] })) }), _jsxs("div", { ...getRootProps(), className: cn("mt-4 p-10 border-2 border-dashed rounded-apple-xl text-center transition-colors duration-300", isDragActive
                    ? "border-apple-blue-500 bg-apple-blue-50"
                    : "border-apple-gray-200 bg-apple-gray-50", uploads.length > 0 && "mb-8"), children: [_jsx("input", { ...getInputProps(), multiple: true, type: "file", accept: "image/*", className: "hidden", "aria-label": "Upload files" }), _jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center", children: _jsx(Upload, { className: "w-8 h-8 text-apple-gray-500" }) }), _jsx("p", { className: "text-apple-gray-500 mb-2", children: isDragActive
                            ? "Drop the photos or folders here"
                            : "Drag and drop photos or folders here, or click to select" }), _jsx("p", { className: "text-apple-gray-400 text-sm", children: "Supported formats: JPG, PNG, WebP, RAW (CR2, NEF, ARW, RW2) \u2022 Max 100MB per file" })] }), uploads.length > 0 && (_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => setViewMode(prev => ({ ...prev, mode: 'grid' })), className: cn("p-2 rounded-apple", viewMode.mode === 'grid'
                                    ? "bg-apple-blue-500 text-white"
                                    : "bg-apple-gray-100 text-apple-gray-600"), children: _jsx(Grid, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setViewMode(prev => ({ ...prev, mode: 'list' })), className: cn("p-2 rounded-apple", viewMode.mode === 'list'
                                    ? "bg-apple-blue-500 text-white"
                                    : "bg-apple-gray-100 text-apple-gray-600"), children: _jsx(List, { className: "w-4 h-4" }) }), _jsx("div", { className: "h-6 w-px bg-apple-gray-200 mx-2" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400" }), _jsx("input", { type: "text", placeholder: "Search uploads...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9 pr-4 py-2 rounded-apple bg-apple-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-500" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { className: "ios-button-secondary flex items-center", children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Filter"] }), _jsxs("select", { value: viewMode.sortBy, onChange: (e) => setViewMode(prev => ({ ...prev, sortBy: e.target.value })), className: "ios-input py-2 pl-4 pr-10", children: [_jsx("option", { value: "date", children: "Sort by Date" }), _jsx("option", { value: "name", children: "Sort by Name" }), _jsx("option", { value: "size", children: "Sort by Size" })] })] })] })), Object.keys(folderStructure).length > 0 && (_jsxs("div", { className: "mb-8", children: [_jsx("h3", { className: "text-sm font-medium text-apple-gray-700 mb-2", children: "Folders" }), renderFolderStructure(folderStructure)] })), _jsx(AnimatePresence, { children: uploads.length > 0 && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: cn("grid gap-4", viewMode.mode === 'grid'
                        ? "grid-cols-1 md:grid-cols-3"
                        : "grid-cols-1"), children: filteredUploads.map((upload) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: cn("bg-white rounded-apple shadow-sm border border-apple-gray-200", viewMode.mode === 'list' && "flex items-center"), children: [_jsxs("div", { className: cn("relative", viewMode.mode === 'grid'
                                    ? "aspect-square"
                                    : "w-20 h-20"), children: [upload.file.type.startsWith('image/') && (_jsx("img", { src: URL.createObjectURL(upload.file), alt: upload.file.name, className: "w-full h-full object-cover rounded-tl-apple rounded-tr-apple" })), _jsxs("div", { className: cn("absolute inset-0 bg-black/50 flex items-center justify-center", upload.status === 'complete' && "bg-apple-green-500/50", upload.status === 'error' && "bg-apple-red-500/50"), children: [upload.status === 'uploading' && (_jsx("div", { className: "w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" })), upload.status === 'complete' && (_jsx(Check, { className: "w-8 h-8 text-white" })), upload.status === 'error' && (_jsx(AlertTriangle, { className: "w-8 h-8 text-white" }))] })] }), _jsxs("div", { className: "p-4 flex-1", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-apple-gray-900 truncate", children: upload.file.name }), _jsxs("p", { className: "text-sm text-apple-gray-500", children: [upload.folderPath && (_jsxs("span", { className: "text-apple-gray-400", children: [upload.folderPath, " /"] })), ' ', (upload.file.size / 1024 / 1024).toFixed(2), " MB"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [upload.status === 'complete' && (_jsx("button", { onClick: () => setSelectedUpload(upload), className: "text-apple-gray-400 hover:text-apple-gray-600", children: _jsx(Info, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => removeUpload(upload.id), className: "text-apple-gray-400 hover:text-apple-gray-600", children: _jsx(X, { className: "w-4 h-4" }) })] })] }), upload.status !== 'complete' && (_jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "h-1 bg-apple-gray-100 rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full transition-all duration-300", upload.status === 'error'
                                                        ? "bg-apple-red-500"
                                                        : "bg-apple-blue-500"), style: { width: `${upload.progress}%` } }) }), upload.error && (_jsx("p", { className: "mt-1 text-sm text-apple-red-500", children: upload.error }))] })), upload.status === 'complete' && upload.photoDetails && (_jsx("div", { className: "mt-4", children: _jsx("div", { className: "flex items-center space-x-2", children: upload.photoDetails.matched_users?.length ? (_jsxs("div", { className: "bg-apple-green-500 text-white px-2 py-1 rounded-full text-sm flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), upload.photoDetails.matched_users.length, " ", upload.photoDetails.matched_users.length === 1 ? 'Match' : 'Matches'] })) : (_jsxs("div", { className: "bg-apple-gray-200 text-apple-gray-600 px-2 py-1 rounded-full text-sm flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "No Matches"] })) }) }))] })] }, upload.id))) })) }), _jsx(AnimatePresence, { children: selectedUpload && selectedUpload.photoDetails && (
          _jsx(SimplePhotoInfoModal, {
            photo: selectedUpload.photoDetails,
            onClose: () => setSelectedUpload(null)
          })
        ) })] }));
};

export default PhotoUploader;
