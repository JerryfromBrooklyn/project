import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoDetailsModal from './PhotoDetailsModal';
import { Trash2, RefreshCw, User, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { awsPhotoService } from '../services/awsPhotoService';
import { movePhotosToTrash } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/MyPhotos.css';
import { FaTrash, FaDownload, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { PhotoGrid } from './PhotoGrid.jsx';
import { motion } from 'framer-motion';

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
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
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
      const fetchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');
      // Sort photos by date (newest first) after fetching
      const sortedPhotos = (fetchedPhotos || []).sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setPhotos(sortedPhotos);
      console.log(`[MyPhotos] Successfully fetched and sorted ${sortedPhotos?.length || 0} matched photos.`);
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

  // Filter photos based on search term
  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      // Search in photo ID, description, location name, etc.
      if (!searchTerm) return true;
      
      const searchFields = [
        photo.id,
        photo.title || '',
        photo.description || '',
        photo.location?.name || '',
        ...(photo.matched_users?.map(user => user.fullName || '') || [])
      ].join(' ').toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
  }, [photos, searchTerm]);

  // Update pagination logic to use filteredPhotos
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

  const handleSelectPhoto = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
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
      setError('Failed to move photos to trash. Please try again later.');
    }
  };

  const handlePhotoAction = (action) => {
    if (action.type === 'trash') {
      movePhotosToTrash(user.id, [action.photo.id])
        .then((result) => {
          if (result.success) {
            setPhotos(prev => prev.filter(photo => photo.id !== action.photo.id));
          }
        })
        .catch((err) => {
          console.error('Error trashing photo:', err);
          setError('Failed to move photo to trash');
        });
    } else if (action.type === 'download') {
      downloadSingleImage(
        action.photo.url || action.photo.imageUrl,
        `photo-${action.photo.id}.jpg`
      );
    } else if (action.type === 'view' || action.type === 'info') {
      setSelectedPhoto(action.photo);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Header Section */}
        <div className="border-b border-gray-200">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-500" />
                My Photos
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Photos where you have been recognized.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        
          {/* Search & Filter Section */}
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
        
        {/* Selected Photos Actions */}
        {selectedPhotos.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              {selectedPhotos.length} photo(s) selected
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleTrashPhotos}
                className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Move to Trash
              </button>
              
              <button
                onClick={() => setSelectedPhotos([])}
                className="inline-flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Main Content Area */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
              <p className="text-gray-500 text-sm">Loading photos...</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start"
            >
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
          {!loading && !error && filteredPhotos.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <User className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">No photos found</h3>
              <p className="text-gray-500 max-w-md">
                {searchTerm 
                  ? "No photos match your search. Try different keywords." 
                  : "We haven't found any photos with you yet. Try uploading more photos or check again later."}
              </p>
            </motion.div>
          )}
          
          {/* Photo Grid */}
          {!loading && !error && filteredPhotos.length > 0 && (
            <>
              <div className="text-sm text-gray-500 mb-4">
                Showing {currentPhotos.length} of {filteredPhotos.length} photos
              </div>
              
              <PhotoGrid
                photos={currentPhotos}
                selectable={true}
                selectedPhotos={selectedPhotos}
                onSelectPhoto={handleSelectPhoto}
                onPhotoAction={handlePhotoAction}
                columns={{ default: 2, sm: 3, md: 4, lg: 4 }}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Show first page, last page, current page, and pages around current
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-md ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Photo Details Modal */}
      {selectedPhoto && (
        <PhotoDetailsModal photo={selectedPhoto} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default MyPhotos; 