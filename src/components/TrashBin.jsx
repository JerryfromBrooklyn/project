import React, { useState, useEffect, useMemo } from 'react';
import { awsPhotoService } from '../services/awsPhotoService';
import { restorePhotosFromTrash, permanentlyHidePhotos } from '../services/userVisibilityService';
import { downloadImagesAsZip, downloadSingleImage } from '../utils/downloadUtils';
import '../styles/TrashBin.css';
import { FaTrash, FaDownload, FaUndo, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { AlertCircle, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

const TrashBin = ({ userId }) => {
  const [allTrashedPhotos, setAllTrashedPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTrashView, setActiveTrashView] = useState('matched');

  useEffect(() => {
    const loadTrashedPhotos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const photos = await awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'TRASH');
        setAllTrashedPhotos(photos || []);
      } catch (err) {
        console.error('Error fetching trashed photos:', err);
        setError('Failed to load trashed photos. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadTrashedPhotos();
    }
  }, [userId]);

  const filteredTrashedPhotos = useMemo(() => {
    if (activeTrashView === 'uploaded') {
      return allTrashedPhotos.filter(photo => photo.user_id === userId);
    } else {
      return allTrashedPhotos.filter(photo => photo.user_id !== userId);
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
        <h2>Trash Bin</h2>
        <p className="trash-description">
          Items here are hidden from your view. Restore them or delete them permanently.
        </p>
        <div className="trash-view-toggle">
          <button 
            onClick={() => setActiveTrashView('matched')}
            className={activeTrashView === 'matched' ? 'active' : ''}
          >
            <ImageIcon size={16} /> Matched Photos
          </button>
          <button 
            onClick={() => setActiveTrashView('uploaded')}
            className={activeTrashView === 'uploaded' ? 'active' : ''}
          >
             <Upload size={16} /> My Uploads
          </button>
        </div>
      </div>
      
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
               <FaUndo />
               <span>Restore</span>
             </button>
             
             <button
               className="btn btn-danger"
               onClick={handlePermanentlyHide}
               aria-label="Permanently hide selected photos"
             >
               <FaTrash />
               <span>Delete Permanently</span>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashBin; 