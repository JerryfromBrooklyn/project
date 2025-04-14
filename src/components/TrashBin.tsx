import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { awsPhotoService } from '../services/awsPhotoService';
import { restorePhotosFromTrash, permanentlyHidePhotos, getPhotoVisibilityMap } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/TrashBin.css';
import { FaTrash, FaDownload, FaUndo, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { AlertCircle, Trash2, Upload, Image as ImageIcon, RotateCcw, XSquare, CheckSquare, Square, Select, Loader } from 'lucide-react';
import { PhotoGrid } from './PhotoGrid';
import { Button } from './ui/Button';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../utils/cn';

const TrashBin = ({ userId }) => {
  const [allTrashedPhotos, setAllTrashedPhotos] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTrashView, setActiveTrashView] = useState('matched');
  const [visibilityMap, setVisibilityMap] = useState({});
  const [isSelecting, setIsSelecting] = useState(false);

  const fetchTrashedPhotos = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setAllTrashedPhotos([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[TrashBin] Fetching trashed photos for user: ${userId}`);
      const photos = await awsPhotoService.getTrashedPhotos(userId);
      console.log(`[TrashBin] Fetched ${photos.length} trashed photos`);
      const sortedPhotos = (photos || []).sort((a: any, b: any) => 
         new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
      );
      setAllTrashedPhotos(sortedPhotos);
    } catch (err: any) {
      console.error('[TrashBin] Error fetching trashed photos:', err);
      setError('Failed to load trashed photos. Please try again later.');
      setAllTrashedPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTrashedPhotos();
  }, [fetchTrashedPhotos]);

  const filteredTrashedPhotos = useMemo(() => {
    return allTrashedPhotos.filter(photo => {
        const isUploadedByUser = photo.user_id === userId || photo.uploaded_by === userId;
        return activeTrashView === 'uploaded' ? isUploadedByUser : !isUploadedByUser;
    });
  }, [allTrashedPhotos, activeTrashView, userId]);

  useEffect(() => {
    if (!isSelecting) {
       setSelectedPhotos([]);
    }
  }, [activeTrashView, isSelecting]);

  const handleToggleSelectionMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedPhotos([]);
  };

  const handleSelectPhoto = (photoId: string) => {
    if (!isSelecting) return; 
    setSelectedPhotos(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };
  
  const toggleSelectAllOnPage = () => {
    if (!isSelecting) return;
    const currentPhotoIds = filteredTrashedPhotos.map(p => p.id);
    const allVisibleSelected = currentPhotoIds.length > 0 && currentPhotoIds.every(id => selectedPhotos.includes(id));

    if (allVisibleSelected) {
      setSelectedPhotos(prev => prev.filter(id => !currentPhotoIds.includes(id)));
    } else {
      setSelectedPhotos(prev => [...new Set([...prev, ...currentPhotoIds])]);
    }
  };

  const handleRestorePhotos = async () => {
    if (!isSelecting || !selectedPhotos.length) return;
    setIsActionLoading(true);
    setError(null);
    try {
      console.log(`[TrashBin] Restoring ${selectedPhotos.length} photos for user: ${userId}`);
      const result = await restorePhotosFromTrash(userId, selectedPhotos);
      if (result.success) {
        console.log('[TrashBin] Restore successful');
        setAllTrashedPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
      } else {
        setError(`Failed to restore photos: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('[TrashBin] Error restoring photos:', err);
      setError('Failed to restore photos. Please try again later.');
    } finally {
      setIsActionLoading(false);
      setIsSelecting(false);
      setSelectedPhotos([]);
    }
  };

  const handlePermanentlyDelete = async () => {
    if (!isSelecting || !selectedPhotos.length) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${selectedPhotos.length} photo(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsActionLoading(true);
    setError(null);
    try {
       console.log(`[TrashBin] Permanently deleting ${selectedPhotos.length} photos for user: ${userId}`);
      const result = await permanentlyHidePhotos(userId, selectedPhotos); 
      if (result.success) {
         console.log('[TrashBin] Permanent hide/delete successful');
        setAllTrashedPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
      } else {
        setError(`Failed to permanently delete photos: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('[TrashBin] Error permanently deleting photos:', err);
      setError('Failed to permanently delete photos. Please try again later.');
    } finally {
       setIsActionLoading(false);
       setIsSelecting(false);
       setSelectedPhotos([]);
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

  const matchedCount = useMemo(() => allTrashedPhotos.filter(photo => photo.user_id !== userId && photo.uploaded_by !== userId).length, [allTrashedPhotos, userId]);
  const uploadedCount = useMemo(() => allTrashedPhotos.filter(photo => photo.user_id === userId || photo.uploaded_by === userId).length, [allTrashedPhotos, userId]);

  const renderEmptyState = () => (
      <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Trash is Empty</h3>
          <p className="mt-1 text-sm text-gray-500">
              Photos moved to the trash will appear here.
          </p>
      </div>
  );
  
   const renderSectionEmptyState = () => (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100 mt-4">
          <p className="text-sm text-gray-500">
              No {activeTrashView === 'uploaded' ? 'uploaded' : 'matched'} photos in the trash.
          </p>
      </div>
  );

  if (isLoading) {
    return <div className="loading-indicator">Loading trashed photos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center flex-wrap gap-2">
         <h2 className="text-xl sm:text-2xl font-semibold">
           {isSelecting ? `${selectedPhotos.length} Selected` : "Trash"}
         </h2>
         {allTrashedPhotos.length > 0 && (
            <Button 
                 variant={isSelecting ? "destructive_outline" : "primary_outline"}
                 size="sm"
                 onClick={handleToggleSelectionMode}
               >
                 {isSelecting ? "Cancel" : <><Select size={16} className="mr-1.5"/> Select</>}
            </Button>
         )}
       </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
        </div>
      )}

      {isLoading ? (
         <div className="flex items-center justify-center h-48 text-sm text-gray-500">
            <Loader className="w-5 h-5 mr-2 animate-spin"/> Loading trashed photos...
         </div>
      ) : allTrashedPhotos.length === 0 ? (
          renderEmptyState()
      ) : (
          <div className="space-y-4">
              <div className="flex items-center border-b border-gray-200">
                 <button 
                    onClick={() => setActiveTrashView('matched')}
                    disabled={isSelecting}
                    className={cn(
                       "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2",
                       activeTrashView === 'matched' 
                         ? "border-blue-500 text-blue-600" 
                         : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                       isSelecting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ImageIcon size={16} /> Matched Photos
                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {matchedCount}
                    </span>
                  </button>
                  <button 
                    onClick={() => setActiveTrashView('uploaded')}
                    disabled={isSelecting}
                     className={cn(
                       "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2",
                       activeTrashView === 'uploaded' 
                         ? "border-blue-500 text-blue-600" 
                         : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                        isSelecting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                     <Upload size={16} /> My Uploads
                     <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {uploadedCount}
                    </span>
                  </button>
              </div>

             <AnimatePresence>
               {isSelecting && selectedPhotos.length > 0 && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }} 
                   animate={{ opacity: 1, height: 'auto' }} 
                   exit={{ opacity: 0, height: 0 }}
                   transition={{ duration: 0.2 }}
                   className="p-2 sm:p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between overflow-hidden" 
                 >
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={toggleSelectAllOnPage}
                     className="text-blue-600 hover:text-blue-700 px-2 sm:px-3"
                     aria-label={filteredTrashedPhotos.length > 0 && filteredTrashedPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect all on page' : 'Select all on page'}
                   >
                     {filteredTrashedPhotos.length > 0 && filteredTrashedPhotos.every(p => selectedPhotos.includes(p.id)) ? (
                       <CheckSquare className="mr-1.5 h-4 w-4" />
                     ) : (
                       <Square className="mr-1.5 h-4 w-4" />
                     )}
                    {filteredTrashedPhotos.length > 0 && filteredTrashedPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect All' : 'Select All'}
                   </Button>
                   
                   <div className="flex items-center space-x-2 sm:space-x-3">
                     <Button 
                       variant="ghost" 
                       size="icon_sm" 
                       onClick={handleRestorePhotos} 
                       disabled={isActionLoading} 
                       className="text-blue-600 hover:text-blue-700"
                       aria-label="Restore selected photos"
                       title="Restore"
                     >
                        {isActionLoading ? <Loader className="h-4 w-4 animate-spin"/> : <RotateCcw className="h-4 w-4" />}
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="icon_sm" 
                       onClick={handlePermanentlyDelete} 
                       disabled={isActionLoading} 
                       className="text-red-600 hover:text-red-700"
                       aria-label="Permanently delete selected photos"
                       title="Delete Permanently"
                     >
                        {isActionLoading ? <Loader className="h-4 w-4 animate-spin"/> : <XSquare className="h-4 w-4" />}
                     </Button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

              {filteredTrashedPhotos.length === 0 ? (
                  renderSectionEmptyState()
              ) : (
                  <PhotoGrid 
                    photos={filteredTrashedPhotos}
                    selectedPhotos={selectedPhotos}
                    onSelectPhoto={handleSelectPhoto} 
                    isSelecting={isSelecting}
                    onPhotoClick={(photo) => {
                       if (!isSelecting) {
                          console.log('Trash photo clicked (not selecting):', photo.id);
                       }
                     }}
                  />
              )}
            </div>
        )}
    </div>
  );
};

export default TrashBin; 