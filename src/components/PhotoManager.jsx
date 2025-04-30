import { useState, useEffect, useCallback } from 'react';
import SimplePhotoUploader from './SimplePhotoUploader.jsx';
import { PhotoGrid } from './PhotoGrid.jsx';
import { useAuth } from '../context/AuthContext';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Info, Trash2, Share, Download } from 'lucide-react';

export const PhotoManager = ({ mode = 'all', nativeShare = false }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // Define fetch function with proper method based on mode
  const fetchPhotos = useCallback(async () => {
    if (!user?.id) {
      console.warn("[PhotoManager] No user ID, skipping fetch");
      setLoading(false);
      setPhotos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[PhotoManager] Fetching photos for mode: ${mode}, user: ${user.id}`);
      
      let fetchedPhotos = [];
      
      // Important: Use the correct method based on mode
      if (mode === 'matches') {
        // Only use fetchPhotos for actual face matches - this now uses the 99% threshold
        fetchedPhotos = await awsPhotoService.fetchPhotos(user.id);
        console.log(`[PhotoManager] Fetched ${fetchedPhotos.length} matched photos with strict 99% threshold`);
      } else if (mode === 'upload') {
        // Use fetchUploadedPhotosOnly for uploads
        fetchedPhotos = await awsPhotoService.fetchUploadedPhotosOnly(user.id);
        console.log(`[PhotoManager] Fetched ${fetchedPhotos.length} uploaded photos`);
      } else {
        // Use getVisiblePhotos for 'all' mode or any other mode
        fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, mode);
        console.log(`[PhotoManager] Fetched ${fetchedPhotos.length} photos for mode: ${mode}`);
      }
      
      // Sort by creation date (newest first)
      const sortedPhotos = fetchedPhotos.sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      
      setPhotos(sortedPhotos);
    } catch (err) {
      console.error(`[PhotoManager] Error fetching photos for mode ${mode}:`, err);
      setError(err.message || 'Error fetching photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, mode]);

  // Fetch photos when component mounts or mode/user changes
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handlePhotoSelect = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleRefresh = () => {
    fetchPhotos();
  };

  const handleTrashPhotos = async () => {
    if (!selectedPhotos.length) return;
    
    try {
      const result = await movePhotosToTrash(user.id, selectedPhotos);
      if (result.success) {
        setPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
        setSelectedPhotos([]);
      } else {
        setError(`Failed to move photos to trash: ${result.error}`);
      }
    } catch (err) {
      console.error('Error moving photos to trash:', err);
      setError('Failed to move photos to trash');
    }
  };

  const handlePhotoAction = async (action) => {
    if (action.type === 'trash') {
      try {
        const result = await movePhotosToTrash(user.id, [action.photo.id]);
        if (result.success) {
          setPhotos(prev => prev.filter(photo => photo.id !== action.photo.id));
        } else {
          setError('Failed to move photo to trash');
        }
      } catch (err) {
        console.error('Error trashing photo:', err);
        setError('Failed to move photo to trash');
      }
    } else if (action.type === 'share' && nativeShare) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Share Photo',
            text: 'Check out this photo!',
            url: action.photo.url || action.photo.public_url || window.location.href
          });
        } else {
          console.log('Web Share API not supported');
        }
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="photo-manager">
      {mode === 'upload' && (
        <div className="mb-8">
          <SimplePhotoUploader onUploadComplete={fetchPhotos} />
        </div>
      )}
      
      {/* Controls and Selection */}
      {photos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            
            {selectedPhotos.length > 0 && (
              <button
                onClick={handleTrashPhotos}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Move to Trash ({selectedPhotos.length})
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading photos...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 text-red-700 p-4 rounded-lg mb-6"
        >
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-sm underline mt-2"
          >
            Dismiss
          </button>
        </motion.div>
      )}
      
      {/* Empty state */}
      {!loading && !error && photos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4">
            {mode === 'matches' ? (
              <Info className="w-8 h-8" />
            ) : (
              <Info className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No photos found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {mode === 'matches' 
              ? "We haven't found any photos with you yet. Your face must match with high confidence (99%) to appear here."
              : mode === 'upload'
                ? "You haven't uploaded any photos yet. Use the uploader above to add photos."
                : "No photos available. Try uploading some photos first."}
          </p>
        </div>
      )}
      
      {/* Photo grid */}
      {!loading && !error && photos.length > 0 && (
        <PhotoGrid
          photos={photos}
          selectable={true}
          selectedPhotos={selectedPhotos}
          onSelectPhoto={handlePhotoSelect}
          onPhotoAction={handlePhotoAction}
          actionButtons={[
            nativeShare && { 
              icon: Share, 
              label: 'Share', 
              action: 'share',
              className: 'text-blue-600' 
            },
            { 
              icon: Trash2, 
              label: 'Move to Trash', 
              action: 'trash',
              className: 'text-red-600'
            }
          ].filter(Boolean)}
        />
      )}
    </div>
  );
};

export default PhotoManager; 