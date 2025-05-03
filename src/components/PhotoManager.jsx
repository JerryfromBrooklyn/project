import { useState, useEffect, useCallback } from 'react';
import SimplePhotoUploader from './SimplePhotoUploader.jsx';
import { PhotoGrid } from './PhotoGrid.jsx';
import { useAuth } from '../context/AuthContext';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Info, Trash2, Share, Download } from 'lucide-react';
import { PhotoInfoModal } from './PhotoInfoModal';
import FaceStorageService from '../services/FaceStorageService';

export const PhotoManager = ({ mode = 'all', nativeShare = false }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [photosWithAnalysis, setPhotosWithAnalysis] = useState({});
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ uploaded: 0, matched: 0 });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load photos based on mode
  const fetchPhotos = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    if (forceRefresh) {
      console.log(`[PhotoManager ${mode}] Force refresh requested`);
    }
    
    console.log(`[PhotoManager ${mode}] Fetching photos for mode: ${mode}`);
    setLoading(true);
    
    try {
      let fetchedPhotos = [];
      
      if (mode === 'upload') {
        console.log(`📥 [PhotoManager ${mode}] Fetching UPLOADED photos...`);
        fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'uploaded');
      } else if (mode === 'matched') {
        console.log(`📥 [PhotoManager ${mode}] Fetching MATCHED photos...`);
        fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');
      } else if (mode === 'all') {
        console.log(`📥 [PhotoManager ${mode}] Fetching ALL photos...`);
        const uploadedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'uploaded');
        const matchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');
        fetchedPhotos = [...uploadedPhotos, ...matchedPhotos];
      }
      
      console.log(`[PhotoManager ${mode}] Successfully fetched ${fetchedPhotos.length} photos for current view.`);
      setPhotos(fetchedPhotos);
      
      // Fetch photo counts for tabs
      console.log(`[PhotoManager ${mode}] Fetching counts...`);
      const uploadedCount = await awsPhotoService.getVisiblePhotos(user.id, 'uploaded').then(p => p.length);
      const matchedCount = await awsPhotoService.getVisiblePhotos(user.id, 'matched').then(p => p.length);
      setCounts({ uploaded: uploadedCount, matched: matchedCount });
      console.log(`[PhotoManager ${mode}] Counts updated: Uploaded=${uploadedCount}, Matched=${matchedCount}`);
      
      // Batch fetch analysis data for all loaded photos
      if (fetchedPhotos.length > 0) {
        console.log(`🔍 [PhotoManager ${mode}] Prefetching complete analysis data for ${fetchedPhotos.length} photos...`);
        try {
          const photoIds = fetchedPhotos.map(photo => photo.id);
          const analysisData = await FaceStorageService.getPhotosWithAnalysisBatch(photoIds);
          
          // Log some analysis stats
          const photoIdsWithAnalysis = Object.keys(analysisData);
          console.log(`🔍 [PhotoManager ${mode}] Successfully fetched analysis data for ${photoIdsWithAnalysis.length}/${photoIds.length} photos`);
          
          if (photoIdsWithAnalysis.length > 0) {
            // Count photos with actual content analysis
            const withLabels = photoIdsWithAnalysis.filter(id => analysisData[id].imageLabels || (analysisData[id].faces && analysisData[id].faces.some(face => face.imageLabels))).length;
            const withColors = photoIdsWithAnalysis.filter(id => analysisData[id].dominantColors || (analysisData[id].faces && analysisData[id].faces.some(face => face.dominantColors))).length;
            
            console.log(`🔍 [PhotoManager ${mode}] Analysis stats: ${withLabels} photos with labels, ${withColors} with color data`);
          }
          
          setPhotosWithAnalysis(analysisData);
        } catch (error) {
          console.error(`❌ [PhotoManager ${mode}] Error prefetching analysis data:`, error);
        }
      }
      
    } catch (error) {
      console.error(`[PhotoManager ${mode}] Error fetching photos:`, error);
    } finally {
      setLoading(false);
    }
  }, [user, mode]);

  // Load photos on mount and when user/mode changes
  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, mode, fetchPhotos, refreshTrigger]);

  // Handle photo actions
  const handlePhotoAction = async ({ type, photo }) => {
    if (!photo) return;
    
    switch (type) {
      case 'view':
        console.log(`[PhotoManager] Viewing photo: ${photo.id}`);
        
        // Try to get enhanced photo data if available
        if (photosWithAnalysis[photo.id]) {
          console.log(`[PhotoManager] Using enhanced photo data for ${photo.id}`);
          setSelectedPhoto(photosWithAnalysis[photo.id]);
        } else {
          // Fallback to regular photo data
          setSelectedPhoto(photo);
          
          // Try to fetch complete data in background
          console.log(`[PhotoManager] Fetching complete data for ${photo.id} in background`);
          try {
            const completeData = await FaceStorageService.getCompletePhotoData(photo.id);
            if (completeData) {
              console.log(`[PhotoManager] Updated with complete data for ${photo.id}`);
              setSelectedPhoto(completeData);
              
              // Also update the cache
              setPhotosWithAnalysis(prev => ({
                ...prev,
                [photo.id]: completeData
              }));
            }
          } catch (error) {
            console.error(`[PhotoManager] Error fetching complete photo data:`, error);
          }
        }
        break;
        
      case 'download':
        console.log(`[PhotoManager] Downloading photo: ${photo.id}`);
        // Create a download link
        const link = document.createElement('a');
        link.href = photo.url || photo.imageUrl;
        link.download = photo.title || `photo-${photo.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
        
      case 'trash':
        console.log(`[PhotoManager] Moving photo to trash: ${photo.id}`);
        try {
          await movePhotosToTrash(user.id, [photo.id]);
          // Refresh the photos list
          fetchPhotos(true);
        } catch (error) {
          console.error(`[PhotoManager] Error moving photo to trash:`, error);
        }
        break;
        
      case 'share':
        if (nativeShare && navigator.share) {
          try {
            await navigator.share({
              title: photo.title || 'Shared Photo',
              text: 'Check out this photo!',
              url: photo.url
            });
          } catch (error) {
            console.error(`[PhotoManager] Error sharing photo:`, error);
          }
        } else {
          // Copy link to clipboard
          navigator.clipboard.writeText(photo.url).then(() => {
            alert('Photo link copied to clipboard!');
          });
        }
        break;
        
      default:
        console.log(`[PhotoManager] Unknown photo action: ${type}`);
    }
  };

  // Handle photo upload completion
  const handleUploadComplete = (forceRefresh = true) => {
    console.log(`[PhotoManager] Photo upload complete${forceRefresh ? ' (force refresh requested)' : ''}`);
    if (forceRefresh) {
      fetchPhotos(true);
    }
  };

  // Close the photo modal
  const handleClosePhotoModal = () => {
    setSelectedPhoto(null);
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {mode === 'upload' && (
        <SimplePhotoUploader 
          user={user}
          onUploadComplete={handleUploadComplete}
        />
      )}
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {mode === 'upload' ? 'Your Uploads' : 
           mode === 'matched' ? 'Photos You Appear In' : 
           'All Photos'}
        </h2>
        
        <button
          onClick={handleManualRefresh}
          className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>
      
      <PhotoGrid
        photos={photos}
        loading={loading}
        onPhotoAction={handlePhotoAction}
        columns={{
          default: 2,
          sm: 3,
          md: 4,
          lg: 5
        }}
      />
      
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <PhotoInfoModal 
              photo={selectedPhoto} 
              onClose={handleClosePhotoModal}
              onShare={nativeShare ? () => handlePhotoAction({ type: 'share', photo: selectedPhoto }) : null}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoManager; 