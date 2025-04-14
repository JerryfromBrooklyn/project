import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoDetailsModal from './PhotoDetailsModal';
import { Trash2, RefreshCw, User, ChevronLeft, ChevronRight, CheckSquare, Square, Select } from 'lucide-react';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/MyPhotos.css';
import { FaTrash, FaDownload, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { PhotoGrid } from './PhotoGrid';
import { Button } from './ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

const MyPhotos = () => {
  // Add useEffect for mount logging
  useEffect(() => {
    console.log('[MyPhotos.jsx] Mounted');
  }, []);

  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 48; // 12 rows of 4 images
  
  // State for selection
  const [isSelecting, setIsSelecting] = useState(false);

  // Get total matches count
  const totalMatchesCount = useMemo(() => 
    (photos || []).reduce((total, photo) => total + (photo.matched_users?.length || 0), 0),
    [photos]
  );

  // Use useCallback for the fetch function
  const fetchPhotos = useCallback(async (showLoading = true) => {
    if (!user?.id) {
      console.log("[MyPhotos] No user ID, skipping fetch.");
      setLoading(false); // Ensure loading stops if no user
      setPhotos([]); // Clear photos if no user
      return; 
    }
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null); // Clear previous errors
    
    try {
      console.log(`[MyPhotos] Fetching matched photos for user: ${user.id}`);
      const fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');
      // Sort photos by date (newest first) after fetching
      const sortedPhotos = (fetchedPhotos || []).sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setPhotos(sortedPhotos);
      console.log(`[MyPhotos] Successfully fetched and sorted ${sortedPhotos?.length || 0} matched photos.`);
    } catch (err: any) {
      console.error('[MyPhotos] Error fetching photos:', err);
      setError(err.message || 'An error occurred while fetching photos');
      setPhotos([]); // Clear photos on error
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Fetch photos on component mount or when user changes
  useEffect(() => {
    console.log('[MyPhotos.jsx] Mounted or User ID changed');
    fetchPhotos(); // Initial fetch

    // Removed the setInterval polling logic

  }, [fetchPhotos]); // Depend on the memoized fetchPhotos function

  // Update pagination logic to use photos directly
  const totalPages = Math.ceil(photos.length / photosPerPage);
  const currentPhotos = useMemo(() => {
      const indexOfLastPhoto = currentPage * photosPerPage;
      const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
      // Slice directly from photos state
      return photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
  }, [photos, currentPage, photosPerPage]);

  const handleRefresh = () => {
    if (isSelecting) return; // Don't refresh while selecting
    fetchPhotos(true);
  };

  const handlePhotoSelect = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleModalClose = () => {
    setSelectedPhoto(null);
  };

  // Toggle selection of a single photo
  const handleSelectPhoto = (photoId: string) => {
    if (!isSelecting) return; 

    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };
  
  // Toggle selection of all currently visible photos
  const toggleSelectAllOnPage = () => {
    if (!isSelecting) return;
    
    const currentPhotoIds = currentPhotos.map(p => p.id);
    const allVisibleSelected = currentPhotoIds.length > 0 && currentPhotoIds.every(id => selectedPhotos.includes(id));

    if (allVisibleSelected) {
      // Deselect all on the current page
      setSelectedPhotos(prev => prev.filter(id => !currentPhotoIds.includes(id)));
    } else {
      // Select all photos on the current page, merging with any existing selections from other pages
      setSelectedPhotos(prev => [...new Set([...prev, ...currentPhotoIds])]);
    }
  };

  // Move selected photos to trash
  const handleTrashSelected = async () => {
    if (!isSelecting || !selectedPhotos.length || !user?.id) return;

    const confirmTrash = window.confirm(`Are you sure you want to move ${selectedPhotos.length} selected photo(s) to the trash?`);
    if (!confirmTrash) return;

    setLoading(true); // Indicate loading state for the trash action
    try {
      console.log(`[MyPhotos] Trashing ${selectedPhotos.length} photos for user: ${user.id}`);
      const result = await movePhotosToTrash(user.id, selectedPhotos);
      if (result.success) {
        console.log(`[MyPhotos] Successfully trashed photos.`);
        // Refresh photos list to reflect changes (or filter locally)
        await fetchPhotos(false); // Fetch photos without showing main loading indicator
        setSelectedPhotos([]); // Clear selection after successful trash
        // Optionally show a success toast/message
      } else {
        setError(`Failed to move photos to trash: ${result.error || 'Unknown error'}`);
        console.error('[MyPhotos] Error trashing selected photos:', result.error);
        // Optionally show an error toast/message
      }
    } catch (err: any) {
      console.error('[MyPhotos] Exception trashing selected photos:', err);
      setError('An error occurred while moving photos to trash. Please try again.');
      // Optionally show an error toast/message
    } finally {
      setLoading(false);
      setIsSelecting(false); // Exit selection mode after action
      setSelectedPhotos([]); // Clear selection
    }
  };

  // Download selected photos (updated to use filtered list)
  const handleDownloadSelected = async () => {
    if (!isSelecting || !selectedPhotos.length) return;
    const photosToDownloadData = selectedPhotos.map(id => photos.find(p => p.id === id)).filter(Boolean);
    if (photosToDownloadData.length === 0) return;

    if (photosToDownloadData.length === 1) {
      const photo = photosToDownloadData[0];
      await downloadSingleImage(
        photo.url, 
        `photo-${photo.id}.jpg`
      );
    } else {
      const downloadItems = photosToDownloadData.map(photo => ({
          id: photo.id,
          url: photo.url
      }));
      await downloadImagesAsZip(downloadItems, 'my-photos-selection.zip');
    }
    setIsSelecting(false); // Exit selection mode
    setSelectedPhotos([]); // Clear selection
  };

  // Handler for trashing a single photo
  const handleTrashSinglePhoto = async (photo: any, event?: React.MouseEvent) => {
    event?.stopPropagation(); // Prevent card selection when clicking the trash icon
    if (isSelecting || !user?.id || !photo?.id) return;

    const photoId = photo.id;
    const confirmTrash = window.confirm("Are you sure you want to move this photo to the trash?");
    if (!confirmTrash) return;

    try {
      console.log(`[MyPhotos] Trashing single photo: ${photoId} for user: ${user.id}`);
      const result = await movePhotosToTrash(user.id, [photoId]);
      
      if (result.success) {
        console.log(`[MyPhotos] Successfully trashed photo: ${photoId}`);
        // Remove the trashed photo from the current view
        setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
        // If the trashed photo was selected, remove it from selection
        setSelectedPhotos(prevSelected => prevSelected.filter(id => id !== photoId));
      } else {
        setError(`Failed to move photo to trash: ${result.error || 'Unknown error'}`);
        console.error(`[MyPhotos] Error trashing photo ${photoId}:`, result.error);
      }
    } catch (err: any) {
      console.error(`[MyPhotos] Exception trashing photo ${photoId}:`, err);
      setError('Failed to move photo to trash. Please try again later.');
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedPhotos([]); // Clear selection when toggling mode
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Optionally clear selection when changing pages in selection mode
      // if (isSelecting) {
      //   setSelectedPhotos([]); 
      // }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Photos</h2>
          {totalMatchesCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have been matched with {totalMatchesCount} {totalMatchesCount === 1 ? 'photo' : 'photos'} in total
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} className="mr-1" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            disabled={isSelecting}
          >
            Try again
          </button>
        </div>
      ) : currentPhotos.length > 0 ? (
        <div>
          {/* Conditional Action Bar */}
          {selectedPhotos.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between sticky top-0 z-10 shadow">
              <div className="flex items-center space-x-3">
                 <Button 
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAllOnPage}
                  aria-label={currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect all on page' : 'Select all on page'}
                >
                   {currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? (
                     <CheckSquare className="mr-2 h-4 w-4" />
                   ) : (
                     <Square className="mr-2 h-4 w-4" />
                   )}
                  {currentPhotos.length > 0 && currentPhotos.every(p => selectedPhotos.includes(p.id)) ? 'Deselect All' : 'Select All'}
                 </Button>
                <span className="text-sm font-medium text-blue-700">
                  {selectedPhotos.length} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={handleTrashSelected} 
                  disabled={loading} // Disable while trashing
                  aria-label="Move selected photos to trash"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Move to Trash
                </Button>
                {/* Add Download button here if needed */}
                {/* <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadSelected} 
                  aria-label="Download selected photos"
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Download
                </Button> */}
              </div>
            </div>
          )}
          
          {/* Pass selection state and handler to PhotoGrid */}
          <PhotoGrid 
            photos={currentPhotos}
            onTrash={handleTrashSinglePhoto}
            selectedPhotos={selectedPhotos}
            onSelectPhoto={handleSelectPhoto}
            isSelecting={isSelecting}
            onPhotoClick={(photo) => {
              if (!isSelecting) {
                setSelectedPhoto(photo);
              }
            }}
          />
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isSelecting}
                  className="p-2 mr-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isSelecting}
                  className="p-2 ml-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">No photos found</p>
          <p className="text-sm text-gray-400">
            No photos matched your face yet.
          </p>
        </div>
      )}
      
      {selectedPhoto && (
        <PhotoDetailsModal 
          photo={selectedPhoto}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default MyPhotos; 