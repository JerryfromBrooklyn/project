import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoDetailsModal from './PhotoDetailsModal';
import { Trash2, RefreshCw, Search, Filter, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/MyPhotos.css';
import { FaTrash, FaDownload, FaCheckSquare, FaSquare } from 'react-icons/fa';

const MyPhotos = () => {
  // Add useEffect for mount logging
  useEffect(() => {
    console.log('[MyPhotos.jsx] Mounted');
  }, []);

  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 48; // 12 rows of 4 images
  
  // Get total matches count
  const totalMatchesCount = photos.reduce((total, photo) => {
    return total + (photo.matched_users?.length || 0);
  }, 0);

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
      // Use the corrected service function for matched photos (which includes visibility filter)
      const fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched'); 
      setPhotos(fetchedPhotos || []); 
      console.log(`[MyPhotos] Successfully fetched ${fetchedPhotos?.length || 0} matched photos.`);
    } catch (err) {
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

  // Recalculate filtered photos when photos or searchTerm changes
  const filteredPhotos = useMemo(() => {
      return photos.filter(photo => {
        const searchFields = [
          photo.id,
          photo.description || '',
          photo.location?.name || '',
          photo.title || '',
          ...(photo.tags || []),
          ...(photo.matched_users?.map(u => u.userId || u.user_id || '') || []) // Search matched user IDs
        ].join(' ').toLowerCase();
        
        return searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
      });
  }, [photos, searchTerm]);

  // Recalculate pagination based on filtered photos
  const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
  const currentPhotos = useMemo(() => {
      const indexOfLastPhoto = currentPage * photosPerPage;
      const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
      return filteredPhotos.slice(indexOfFirstPhoto, indexOfLastPhoto);
  }, [filteredPhotos, currentPage, photosPerPage]);

  const handleRefresh = () => {
    fetchPhotos(true);
  };

  const handlePhotoSelect = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleModalClose = () => {
    setSelectedPhoto(null);
  };

  // Toggle selection of a single photo
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
    // Don't automatically open modal on selection toggle
    // handlePhotoSelect(photos.find(p => p.id === photoId)); 
  };

  // Toggle selection of all photos currently visible
  const toggleSelectAll = () => {
    if (selectedPhotos.length === currentPhotos.length && currentPhotos.length > 0) {
      setSelectedPhotos([]); // Deselect all in current view
    } else {
      // Select all in current view
      setSelectedPhotos(currentPhotos.map(photo => photo.id)); 
    }
  };

  // Move selected photos to trash (updated to use filtered list)
  const handleMoveToTrash = async () => {
    if (!selectedPhotos.length) return;
    const photosToTrash = selectedPhotos; // IDs are already selected

    const confirmTrash = window.confirm(`Are you sure you want to move ${photosToTrash.length} photos to the trash?`);
    if (!confirmTrash) return;

    try {
      const result = await movePhotosToTrash(user.id, photosToTrash);
      if (result.success) {
        setPhotos(prevPhotos => prevPhotos.filter(photo => !photosToTrash.includes(photo.id)));
        setSelectedPhotos([]); // Clear selection
      } else {
        setError(`Failed to move photos to trash: ${result.error}`);
      }
    } catch (err) {
      console.error('Error moving photos to trash:', err);
      setError('Failed to move photos to trash. Please try again later.');
    }
  };

  // Download selected photos (updated to use filtered list)
  const handleDownloadSelected = async () => {
    if (!selectedPhotos.length) return;
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
  };

  // Handler for trashing a single photo
  const handleTrashSinglePhoto = async (photoId, event) => {
    event.stopPropagation(); // Prevent card selection when clicking the trash icon
    if (!user?.id || !photoId) return;

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
        setError(`Failed to move photo to trash: ${result.error}`);
        console.error(`[MyPhotos] Error trashing photo ${photoId}:`, result.error);
      }
    } catch (err) {
      console.error(`[MyPhotos] Exception trashing photo ${photoId}:`, err);
      setError('Failed to move photo to trash. Please try again later.');
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
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center">
          <Filter size={16} className="mr-2" />
          <span>Filter</span>
        </button>
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
          >
            Try again
          </button>
        </div>
      ) : currentPhotos.length > 0 ? (
        <div>
          <div className="toolbar">
            <div className="selection-tools">
              <button
                className="btn btn-text"
                onClick={toggleSelectAll}
                aria-label={selectedPhotos.length === photos.length ? 'Deselect all' : 'Select all'}
              >
                {selectedPhotos.length === photos.length ? <FaCheckSquare /> : <FaSquare />}
                <span>{selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}</span>
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
                  className="btn btn-danger"
                  onClick={handleMoveToTrash}
                  aria-label="Move to trash"
                >
                  <FaTrash />
                  <span>Move to Trash</span>
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
          
          <div className="photo-grid">
            {currentPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`photo-card ${selectedPhotos.includes(photo.id) ? 'selected' : ''}`}
                onClick={() => {
                  togglePhotoSelection(photo.id);
                  handlePhotoSelect(photo);
                }}
              >
                <div className="photo-select-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={() => {}} // Handled by parent div click
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                
                {/* Add Trash Icon Button to Photo Card */}
                <button 
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60 transition-opacity opacity-0 group-hover:opacity-100 z-10"
                  onClick={(e) => handleTrashSinglePhoto(photo.id, e)}
                  aria-label="Move photo to trash"
                >
                  <Trash2 size={14} />
                </button>
                
                <div className="photo-image">
                  <img
                    src={photo.url}
                    alt={photo.description || 'Photo'}
                    loading="lazy"
                  />
                </div>
                
                <div className="photo-info">
                  <p className="photo-title">{photo.description || 'Untitled'}</p>
                  <p className="photo-date">
                    {new Date(photo.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
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
                  disabled={currentPage === totalPages}
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
            {searchTerm ? 'Try a different search term' : 'Upload some photos to get started'}
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