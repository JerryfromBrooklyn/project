import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';

/**
 * Debug panel for viewing and exporting locally stored photo metadata
 */
const LocalStorageDebugPanel = () => {
  const { user } = useAuth();
  const [localStoragePhotos, setLocalStoragePhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!user) {
      setLocalStoragePhotos([]);
      setLoading(false);
      return;
    }

    loadLocalStorageData();
  }, [user]);

  /**
   * Load all photo metadata from localStorage
   */
  const loadLocalStorageData = () => {
    try {
      setLoading(true);
      // Get the list of photo IDs for this user
      const userPhotosKey = `user_photos_${user.id}`;
      const photoIds = JSON.parse(localStorage.getItem(userPhotosKey) || '[]');
      console.log(`[LocalStorageDebug] Found ${photoIds.length} photo IDs in localStorage for user ${user.id}`);

      // Load metadata for each photo
      const photos = [];
      for (const photoId of photoIds) {
        const storageKey = `photo_metadata_${photoId}`;
        const metadataStr = localStorage.getItem(storageKey);
        if (metadataStr) {
          try {
            const metadata = JSON.parse(metadataStr);
            photos.push(metadata);
          } catch (err) {
            console.error(`[LocalStorageDebug] Error parsing metadata for photo ${photoId}:`, err);
          }
        }
      }

      setLocalStoragePhotos(photos);
      console.log(`[LocalStorageDebug] Loaded ${photos.length} photos from localStorage`);
    } catch (err) {
      console.error('[LocalStorageDebug] Error loading localStorage data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export all photo metadata as JSON file
   */
  const exportAllPhotosMetadata = () => {
    try {
      const dataStr = JSON.stringify(localStoragePhotos, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = `photo_metadata_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      console.log(`[LocalStorageDebug] Exported ${localStoragePhotos.length} photos to ${exportFileName}`);
    } catch (err) {
      console.error('[LocalStorageDebug] Error exporting photos:', err);
      alert('Failed to export photos: ' + err.message);
    }
  };

  /**
   * Clear all photo metadata from localStorage
   */
  const clearLocalStorage = () => {
    if (!window.confirm('Are you sure you want to clear all locally stored photo metadata? This cannot be undone.')) {
      return;
    }
    
    try {
      // Remove all photo metadata
      for (const photo of localStoragePhotos) {
        const storageKey = `photo_metadata_${photo.id}`;
        localStorage.removeItem(storageKey);
      }
      
      // Clear the user's photo list
      const userPhotosKey = `user_photos_${user.id}`;
      localStorage.removeItem(userPhotosKey);
      
      // Reload the data
      setLocalStoragePhotos([]);
      console.log('[LocalStorageDebug] Cleared all locally stored photo metadata');
      alert('Successfully cleared all locally stored photo metadata');
    } catch (err) {
      console.error('[LocalStorageDebug] Error clearing localStorage:', err);
      alert('Failed to clear localStorage: ' + err.message);
    }
  };

  /**
   * Format a date string for display
   */
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch (err) {
      return dateStr || 'Unknown';
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Local Storage Backup Data</h3>
        <div className="flex gap-2">
          <button
            onClick={loadLocalStorageData}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
          >
            Refresh
          </button>
          <button
            onClick={exportAllPhotosMetadata}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            disabled={localStoragePhotos.length === 0}
          >
            Export JSON
          </button>
          <button
            onClick={clearLocalStorage}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            disabled={localStoragePhotos.length === 0}
          >
            Clear Storage
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading localStorage data...</p>
      ) : localStoragePhotos.length === 0 ? (
        <p className="text-gray-500">No photos found in localStorage.</p>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Found {localStoragePhotos.length} photos stored locally in your browser. 
            This data serves as a backup when database operations fail.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faces</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localStoragePhotos.map((photo) => (
                  <tr key={photo.id}>
                    <td className="px-4 py-2 text-sm text-gray-900 font-mono">{photo.id}</td>
                    <td className="px-4 py-2">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        {photo.public_url ? (
                          <img 
                            src={photo.public_url} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{photo.event_details?.name || 'None'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{photo.venue?.name || 'None'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{formatDate(photo.created_at)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {Array.isArray(photo.faces) && photo.faces.length > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {photo.faces.length} faces
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          No faces
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {selectedPhoto === photo.id ? 'Hide JSON' : 'View JSON'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {selectedPhoto && (
            <div className="mt-4 p-4 bg-gray-800 rounded overflow-auto max-h-96">
              <pre className="text-xs text-green-400">
                {JSON.stringify(localStoragePhotos.find(p => p.id === selectedPhoto), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalStorageDebugPanel; 