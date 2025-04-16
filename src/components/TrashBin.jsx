import React, { useState, useEffect, useMemo } from 'react';
import { awsPhotoService } from '../services/awsPhotoService';
import { restorePhotosFromTrash, permanentlyHidePhotos, getPhotoVisibilityMap } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/TrashBin.css';
import { FaTrash, FaDownload, FaUndo, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { AlertCircle, Trash2, Upload, Image as ImageIcon, RotateCcw, Grid, RefreshCw, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  const togglePhotoSelection = (photoId) => {
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
    }
  };

  const handlePermanentlyHide = async () => {
    if (!selectedPhotos.length) return;
    const confirmed = window.confirm(
      "Are you sure you want to permanently hide these photos? " +
      "They will no longer appear in your account, but will still be available for matching and other users."
    );
    if (!confirmed) return;
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
    }
  };

  const handleDownloadSelected = async () => {
    if (!selectedPhotos.length) return;
    const photosToDownloadData = selectedPhotos.map(id => allTrashedPhotos.find(p => p.id === id)).filter(Boolean);
    if (photosToDownloadData.length === 0) return;

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
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading trashed photos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="trash-bin-container">
      <div className="trash-header">
        <div className="flex justify-between items-center mb-2">
          <h2>Trash Bin</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleDebug}
              className="debug-button flex items-center text-sm px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
            >
              <Bug className="w-4 h-4 mr-1.5" />
              Debug
            </button>
            <button 
              onClick={handleDirectFetch}
              className="direct-fetch-button flex items-center text-sm px-3 py-1.5 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
            >
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Direct Query
            </button>
            <button 
              onClick={handleRefresh}
              className="refresh-button flex items-center text-sm px-3 py-1.5 bg-apple-gray-50 hover:bg-apple-gray-100 rounded-md transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <p className="trash-description">
          Items here are hidden from your view. Restore them or delete them permanently.
        </p>
        <div className="trash-view-toggle">
          <button 
            onClick={() => setActiveTrashView('all')}
            className={activeTrashView === 'all' ? 'active' : ''}
          >
            <Grid size={16} /> All Photos
            <span className="photo-count">{allTrashedPhotos.length}</span>
          </button>
          <button 
            onClick={() => setActiveTrashView('matched')}
            className={activeTrashView === 'matched' ? 'active' : ''}
          >
            <ImageIcon size={16} /> Matched Photos
            <span className="photo-count">{allTrashedPhotos.filter(photo => photo.user_id !== userId && photo.uploaded_by !== userId).length}</span>
          </button>
          <button 
            onClick={() => setActiveTrashView('uploaded')}
            className={activeTrashView === 'uploaded' ? 'active' : ''}
          >
             <Upload size={16} /> My Uploads
             <span className="photo-count">{allTrashedPhotos.filter(photo => photo.user_id === userId || photo.uploaded_by === userId).length}</span>
          </button>
        </div>
        <div className="trash-summary">
          <p>Total in trash: <strong>{filteredTrashedPhotos.length}</strong> photos</p>
        </div>
      </div>
      
      {debugInfo && (
        <div className="debug-info bg-purple-50 p-4 my-4 rounded-lg border border-purple-200 text-sm">
          <h3 className="font-bold text-purple-800 mb-2">Debug Information</h3>
          <p>User ID: {debugInfo.userId}</p>
          <p>Timestamp: {debugInfo.timestamp}</p>
          <p>Visibility Map Size: {debugInfo.visibilityMapSize}</p>
          <p>Trash Items in Database: {debugInfo.trashCount}</p>
          <p>Trash Items Displayed: {debugInfo.allTrashedPhotosCount}</p>
          
          {debugInfo.trashItems.length > 0 ? (
            <div className="mt-3">
              <h4 className="font-bold text-purple-700 mb-1">Trash Items:</h4>
              <ul className="bg-white p-3 rounded border border-purple-200 max-h-60 overflow-y-auto">
                {debugInfo.trashItems.map((item, index) => (
                  <li key={index} className="mb-2 pb-2 border-b border-purple-100 last:border-0">
                    <div>
                      <span className="font-medium">Photo ID:</span> {item.photoId}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {item.status}
                    </div>
                    {item.photo && (
                      <>
                        <div>
                          <span className="font-medium">Title:</span> {item.photo.title || 'Untitled'}
                        </div>
                        {item.photo.url && (
                          <div className="mt-1">
                            <img src={item.photo.url} alt="Thumbnail" className="w-16 h-16 object-cover rounded" />
                          </div>
                        )}
                      </>
                    )}
                    {item.error && (
                      <div className="text-red-600">Error: {item.error}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-red-600">No trash items found in database!</p>
          )}
        </div>
      )}
      
      <div className="toolbar">
        <div className="selection-tools">
          <button
            className="btn btn-text"
            onClick={toggleSelectAll}
            disabled={filteredTrashedPhotos.length === 0}
            aria-label={selectedPhotos.length === filteredTrashedPhotos.length ? 'Deselect all' : 'Select all'}
          >
            {selectedPhotos.length === filteredTrashedPhotos.length && filteredTrashedPhotos.length > 0 ? <FaCheckSquare /> : <FaSquare />}
            <span>{selectedPhotos.length === filteredTrashedPhotos.length && filteredTrashedPhotos.length > 0 ? 'Deselect All' : 'Select All'}</span>
          </button>
          
          <div className="selected-count">
            {selectedPhotos.length > 0 && (
              <span>{selectedPhotos.length} selected</span>
            )}
          </div>
        </div>
        
        {selectedPhotos.length > 0 && (
          <div className="action-buttons">
             <button
               className="btn btn-success"
               onClick={handleRestorePhotos}
               aria-label="Restore selected photos"
             >
               <RotateCcw className="w-3 h-3 mr-1" />
               <span>Restore</span>
             </button>
             
             <button
               className="btn btn-danger"
               onClick={handlePermanentlyHide}
               aria-label="Permanently hide selected photos"
             >
               <Trash2 className="w-3 h-3 mr-1" />
               <span>DELETE</span>
             </button>
             
             <button
               className="btn btn-primary"
               onClick={handleDownloadSelected}
               aria-label="Download selected"
             >
               <FaDownload />
               <span>Download</span>
             </button>
           </div>
        )}
      </div>
      
      {filteredTrashedPhotos.length === 0 ? (
        <div className="no-photos-message">
          <p>No photos in this section of the trash.</p>
        </div>
      ) : (
        <div className="photo-grid">
          {filteredTrashedPhotos.map(photo => (
            <div
              key={photo.id}
              className={`photo-card ${selectedPhotos.includes(photo.id) ? 'selected' : ''}`}
              onClick={() => togglePhotoSelection(photo.id)}
            >
              <div className="photo-select-checkbox">
                <input
                  type="checkbox"
                  checked={selectedPhotos.includes(photo.id)}
                  onChange={() => {}}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              
              <div className="photo-image">
                <img
                  src={photo.imageUrl || photo.url}
                  alt={photo.title || 'Photo'}
                  loading="lazy"
                />
              </div>
              
              <div className="photo-info">
                <p className="photo-title">{photo.title || 'Untitled'}</p>
                <p className="photo-date">
                  {new Date(photo.createdAt || photo.created_at || Date.now()).toLocaleDateString()}
                </p>
                <p className="photo-visibility">
                  Status: {visibilityMap[photo.id] || 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashBin; 