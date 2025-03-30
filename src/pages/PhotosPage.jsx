import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import PhotoGrid from '../features/photos/components/PhotoGrid';
import PhotoUploader from '../features/photos/components/PhotoUploader';
import { usePhotos } from '../features/photos/hooks/usePhotos';
import LocalStorageDebugPanel from '../features/photos/components/LocalStorageDebugPanel';
import SimplePhotoInfoModal from '../components/SimplePhotoInfoModal';
import { PhotoService } from '../services/PhotoService';
import { supabase } from '../lib/supabaseClient';

/**
 * Photos page component for displaying all photos
 */
const PhotosPage = () => {
  const { selectedPhoto, clearSelectedPhoto, fetchPhotos } = usePhotos();
  const [showUploader, setShowUploader] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Photos</h1>
          <div>
            <button 
              onClick={() => setShowUploader(!showUploader)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showUploader ? 'Hide Uploader' : 'Upload Photo'}
            </button>
          </div>
        </header>

        {showUploader && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Upload New Photo</h2>
            <PhotoUploader onSuccess={() => {
              setShowUploader(false);
              fetchPhotos();
            }} />
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Photos</h2>
            <button 
              onClick={() => fetchPhotos()}
              className="text-blue-600 hover:underline text-sm"
            >
              Refresh
            </button>
          </div>
          <PhotoGrid />
        </section>

        <section>
          <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            {showDebugPanel ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
          
          {showDebugPanel && (
            <div className="mt-4">
              <LocalStorageDebugPanel />
            </div>
          )}
        </section>
      </div>

      {/* Photo Info Modal */}
      {selectedPhoto && (
        <SimplePhotoInfoModal
          photo={selectedPhoto}
          onClose={clearSelectedPhoto}
        />
      )}
    </Layout>
  );
};

export default PhotosPage; 