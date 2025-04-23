import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { awsPhotoService } from '../services/awsPhotoService';
import { restorePhotosFromTrash, permanentlyHidePhotos, getPhotoVisibilityMap } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/TrashBin.css';
import { FaTrash, FaDownload, FaUndo, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { 
  AlertCircle, Trash2, Upload, Image as ImageIcon, 
  RotateCcw, Grid, RefreshCw, Bug, X, CheckCircle,
  Check, Download, Square, Info, Filter, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PhotoGrid } from './PhotoGrid.jsx';
import { cn } from '../utils/cn';

const TrashBin = ({ userId: propUserId }) => {
  // Use AuthContext to ensure userId is always available
  const { user: authUser } = useAuth();
  const userId = propUserId || (authUser && authUser.id);
  
  const [allTrashedPhotos, setAllTrashedPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTrashView, setActiveTrashView] = useState('all');
  const [visibilityMap, setVisibilityMap] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Debug logging when component mounts or userId changes
  useEffect(() => {
    console.log(`[TrashBin] Component mounted/updated - userId: ${userId || "none"}, propUserId: ${propUserId || "none"}, authUser.id: ${authUser?.id || "none"}`);
  }, [userId, propUserId, authUser]);

  const loadTrashedPhotos = async () => {
    if (!userId) {
      console.error('[TrashBin] No userId available - cannot load trash');
      setError('User ID is missing. Please sign in again.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[TrashBin] Fetching trashed photos for user: ${userId}`);
      
      // Use getTrashedPhotos which properly fetches photos with TRASH visibility status
      const photos = await awsPhotoService.getTrashedPhotos(userId);
      
      console.log(`[TrashBin] Fetched ${photos.length} trashed photos`);
      
      // Get the visibility map for debugging
      const visibilityMapResult = await getPhotoVisibilityMap(userId);
      setVisibilityMap(visibilityMapResult.visibilityMap || {});
      
      // Verify all photos have TRASH status in the visibility map
      const trashCount = photos.filter(p => visibilityMapResult.visibilityMap[p.id] === 'TRASH').length;
      console.log(`[TrashBin] Photos confirmed in TRASH status: ${trashCount} out of ${photos.length}`);
      console.log(`[TrashBin] Total items in visibility map: ${Object.keys(visibilityMapResult.visibilityMap).length}`);
      
      if (trashCount !== photos.length) {
        console.warn('[TrashBin] Some photos in the trash don\'t have TRASH visibility status');
      }
      
      setAllTrashedPhotos(photos || []);
    } catch (err) {
      console.error('[TrashBin] Error fetching trashed photos:', err);
      setError('Failed to load trashed photos. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTrashedPhotos();
    } else {
      console.warn('[TrashBin] No userId available - skipping trash load');
    }
  }, [userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrashedPhotos();
  };

  const handleDebug = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      // 1. Get the visibility map
      const { visibilityMap, success } = await getPhotoVisibilityMap(userId);
      
      if (!success) {
        throw new Error("Failed to get visibility map");
      }
      
      // 2. Filter for TRASH items
      const trashItems = Object.entries(visibilityMap)
        .filter(([_, status]) => status === 'TRASH')
        .map(([photoId, status]) => ({ photoId, status }));
      
      console.log(`[TrashBin DEBUG] Found ${trashItems.length} items with TRASH status in visibility map`);
      
      // 3. If we have trash items, fetch the actual photos for each one
      let resolvedPhotos = [];
      
      if (trashItems.length > 0) {
        // Get batch of up to 10 photos at a time
        for (let i = 0; i < trashItems.length; i += 10) {
          const batch = trashItems.slice(i, i + 10);
          const photoPromises = batch.map(item => 
            awsPhotoService.getPhotoById(item.photoId)
              .then(photo => ({ 
                ...item, 
                photo: photo || { id: item.photoId, error: 'Photo not found' }
              }))
              .catch(err => ({ 
                ...item, 
                error: err.message || 'Failed to fetch photo' 
              }))
          );
          
          const batchResults = await Promise.all(photoPromises);
          resolvedPhotos = [...resolvedPhotos, ...batchResults];
        }
      }
      
      // 4. Build debug info
      const debugData = {
        userId,
        timestamp: new Date().toISOString(),
        visibilityMapSize: Object.keys(visibilityMap).length,
        trashCount: trashItems.length,
        trashItems: resolvedPhotos,
        allTrashedPhotosCount: allTrashedPhotos.length,
      };
      
      console.log('[TrashBin DEBUG] Debug data:', debugData);
      setDebugInfo(debugData);
      setShowDebugPanel(true);
      
    } catch (err) {
      console.error('[TrashBin DEBUG] Error in debug function:', err);
      setError(`Debug error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to directly load trash items from visibility map
  const handleDirectFetch = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Get the visibility map
      const { visibilityMap, success } = await getPhotoVisibilityMap(userId);
      
      if (!success) {
        throw new Error("Failed to get visibility map");
      }
      
      // 2. Filter for TRASH items
      const trashItemIds = Object.entries(visibilityMap)
        .filter(([_, status]) => status === 'TRASH')
        .map(([photoId]) => photoId);
      
      console.log(`[TrashBin] Found ${trashItemIds.length} items with TRASH status in visibility map`);
      
      if (trashItemIds.length === 0) {
        setAllTrashedPhotos([]);
        setIsLoading(false);
        return;
      }
      
      // 3. Directly fetch the photos using their IDs
      let allPhotos = [];
      
      // Process in batches of 10
      for (let i = 0; i < trashItemIds.length; i += 10) {
        const batch = trashItemIds.slice(i, i + 10);
        console.log(`[TrashBin] Fetching batch ${Math.floor(i/10) + 1} of ${Math.ceil(trashItemIds.length/10)}`);
        
        const photoPromises = batch.map(photoId => 
          awsPhotoService.getPhotoById(photoId)
        );
        
        const batchResults = await Promise.all(photoPromises);
        const validPhotos = batchResults.filter(Boolean); // Remove null results
        allPhotos = [...allPhotos, ...validPhotos];
      }
      
      console.log(`[TrashBin] Successfully fetched ${allPhotos.length} photos directly`);
      setAllTrashedPhotos(allPhotos);
      setVisibilityMap(visibilityMap);
      
    } catch (err) {
      console.error('[TrashBin] Error in direct fetch:', err);
      setError(`Failed to fetch trash items: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrashedPhotos = useMemo(() => {
    if (activeTrashView === 'uploaded') {
      return allTrashedPhotos.filter(photo => photo.user_id === userId || photo.uploaded_by === userId);
    } else if (activeTrashView === 'matched') {
      return allTrashedPhotos.filter(photo => photo.user_id !== userId && photo.uploaded_by !== userId);
    } else {
      return allTrashedPhotos;
    }
  }, [allTrashedPhotos, activeTrashView, userId]);

  useEffect(() => {
    setSelectedPhotos([]);
  }, [filteredTrashedPhotos]);

  const handleSelectPhoto = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.length === filteredTrashedPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredTrashedPhotos.map(photo => photo.id));
    }
  };

  const handleRestorePhotos = async () => {
    if (!selectedPhotos.length) return;
    
    setIsLoading(true);
    try {
      const result = await restorePhotosFromTrash(userId, selectedPhotos);
      if (result.success) {
        setAllTrashedPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
        setSelectedPhotos([]);
      } else {
        setError(`Failed to restore photos: ${result.error}`);
      }
    } catch (err) {
      console.error('Error restoring photos:', err);
      setError('Failed to restore photos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentlyHide = async () => {
    if (!selectedPhotos.length) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to permanently hide these photos? " +
      "They will no longer appear in your account, but will still be available for matching and other users."
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      const result = await permanentlyHidePhotos(userId, selectedPhotos);
      if (result.success) {
        setAllTrashedPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
        setSelectedPhotos([]);
      } else {
        setError(`Failed to permanently hide photos: ${result.error}`);
      }
    } catch (err) {
      console.error('Error permanently hiding photos:', err);
      setError('Failed to permanently hide photos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (!selectedPhotos.length) return;
    
    setIsLoading(true);
    try {
      const photosToDownloadData = selectedPhotos.map(id => 
        allTrashedPhotos.find(p => p.id === id)
      ).filter(Boolean);
      
      if (photosToDownloadData.length === 0) {
        setError('No valid photos selected for download');
        return;
      }

      if (photosToDownloadData.length === 1) {
        const photo = photosToDownloadData[0];
        await downloadSingleImage(
          photo.imageUrl || photo.url,
          `photo-${photo.id}.jpg`
        );
      } else {
        const downloadItems = photosToDownloadData.map(photo => ({
            id: photo.id,
            url: photo.imageUrl || photo.url
        }));
        await downloadImagesAsZip(downloadItems, 'selected-trashed-photos.zip');
      }
    } catch (err) {
      console.error('Error downloading photos:', err);
      setError('Failed to download photos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoAction = (action) => {
    if (action.type === 'trash') {
      // No need to trash already trashed photos
    } else if (action.type === 'download') {
      downloadSingleImage(
        action.photo.imageUrl || action.photo.url,
        `photo-${action.photo.id}.jpg`
      );
    } else if (action.type === 'restore') {
      handleRestorePhotos([action.photo.id]);
    }
  };

  const closeDebugPanel = () => {
    setShowDebugPanel(false);
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading trashed photos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Header Section */}
        <div className="border-b border-gray-200">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Trash2 className="w-5 h-5 mr-2 text-gray-500" />
                Trash Bin
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Items here are hidden from your view. Restore them or permanently delete them.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button 
                onClick={handleDebug}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Bug className="w-4 h-4 mr-1.5" />
                Debug
              </button>
              <button 
                onClick={handleDirectFetch}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Direct Query
              </button>
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        
          {/* Tabs Navigation */}
          <div className="px-6 border-t border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'all', label: 'All Trashed Photos', icon: Grid, count: allTrashedPhotos.length },
                { id: 'matched', label: 'Trashed Matches', icon: ImageIcon, count: allTrashedPhotos.filter(photo => photo.user_id !== userId && photo.uploaded_by !== userId).length },
                { id: 'uploaded', label: 'Trashed Uploads', icon: Upload, count: allTrashedPhotos.filter(photo => photo.user_id === userId || photo.uploaded_by === userId).length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTrashView(tab.id)}
                  className={`group inline-flex items-center px-4 py-3 border-b-2 text-sm font-medium ${
                    activeTrashView === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} className="mr-2" />
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTrashView === tab.id
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Action Toolbar */}
        {filteredTrashedPhotos.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <button
                onClick={toggleSelectAll}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium",
                  selectedPhotos.length === filteredTrashedPhotos.length && filteredTrashedPhotos.length > 0
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                )}
              >
                {selectedPhotos.length === filteredTrashedPhotos.length && filteredTrashedPhotos.length > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Select All
                  </>
                )}
              </button>
              
              {selectedPhotos.length > 0 && (
                <span className="ml-3 text-sm text-gray-700">
                  {selectedPhotos.length} selected
                </span>
              )}
            </div>
            
            {selectedPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRestorePhotos}
                  className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-md transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </button>
                
                <button
                  onClick={handlePermanentlyHide}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </button>
                
                <button
                  onClick={handleDownloadSelected}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Debug Panel */}
        <AnimatePresence>
          {showDebugPanel && debugInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-50 border-b border-indigo-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-indigo-700 flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    Debug Information
                  </h3>
                  <button 
                    onClick={closeDebugPanel}
                    className="p-1 rounded-full hover:bg-indigo-100 text-indigo-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div className="bg-white p-2 rounded-md">
                    <p className="text-gray-500">User ID</p>
                    <p className="font-medium">{debugInfo.userId}</p>
                  </div>
                  <div className="bg-white p-2 rounded-md">
                    <p className="text-gray-500">Visibility Map Size</p>
                    <p className="font-medium">{debugInfo.visibilityMapSize}</p>
                  </div>
                  <div className="bg-white p-2 rounded-md">
                    <p className="text-gray-500">Trash Count</p>
                    <p className="font-medium">{debugInfo.trashCount}</p>
                  </div>
                </div>
                
                {debugInfo.trashItems.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="font-bold text-indigo-700 mb-2">Trash Items:</h4>
                    <div className="bg-white p-3 rounded-md border border-indigo-100 max-h-60 overflow-y-auto">
                      {debugInfo.trashItems.map((item, index) => (
                        <div key={index} className="mb-2 pb-2 border-b border-indigo-50 last:border-0 last:mb-0 last:pb-0">
                          <div className="flex items-start">
                            {item.photo?.url && (
                              <div className="mr-3">
                                <img 
                                  src={item.photo.url} 
                                  alt="Thumbnail" 
                                  className="w-10 h-10 object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-gray-900">
                                <span className="font-medium">Photo ID:</span> {item.photoId}
                              </p>
                              <p className="text-gray-700">
                                <span className="font-medium">Status:</span> {item.status}
                              </p>
                              {item.photo && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Title:</span> {item.photo.title || 'Untitled'}
                                </p>
                              )}
                              {item.error && (
                                <p className="text-red-600 text-sm mt-1">Error: {item.error}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-md text-center">
                    <p className="text-red-600">No trash items found in database!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        <div className="p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
              <p className="text-gray-500 text-sm">Loading trashed photos...</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start"
            >
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium mt-2"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Empty State */}
          {!isLoading && !error && filteredTrashedPhotos.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">Trash is empty</h3>
              <p className="text-gray-500 max-w-md">
                {activeTrashView === 'all' 
                  ? "You don't have any photos in the trash." 
                  : activeTrashView === 'uploaded' 
                    ? "You don't have any uploaded photos in the trash."
                    : "You don't have any matched photos in the trash."
                }
              </p>
            </motion.div>
          )}
          
          {/* Photo Grid */}
          {!isLoading && !error && filteredTrashedPhotos.length > 0 && (
            <PhotoGrid
              photos={filteredTrashedPhotos}
              selectable={true}
              selectedPhotos={selectedPhotos}
              onSelectPhoto={handleSelectPhoto}
              onPhotoAction={handlePhotoAction}
              columns={{ default: 2, sm: 3, md: 4, lg: 4 }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashBin; 