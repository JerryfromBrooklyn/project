import React, { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import { DashboardModal } from '@uppy/react';
import AwsS3 from '@uppy/aws-s3';
import Webcam from '@uppy/webcam';
import { Check, Upload, AlertCircle, Camera, X } from 'lucide-react';

// Import CSS
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';

const SafePhotoUploader = () => {
  const [uppy, setUppy] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Uppy
    const uppyInstance = new Uppy({
      id: 'safe-uploader',
      autoProceed: false,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB max
        maxNumberOfFiles: 10,
        allowedFileTypes: ['image/*']
      },
      meta: {
        // You can add default metadata here
        uploadedBy: 'dashboard-user'
      }
    })
    .use(Webcam, {
      mirror: true,
      facingMode: 'user',
      showRecordingLength: true
    })
    .use(AwsS3, {
      companionUrl: '/',
      // In a real implementation, you would implement this to get presigned URLs
      getUploadParameters(file) {
        // Mock implementation - in production, you would call your backend
        console.log('Getting upload parameters for:', file.name);
        return {
          method: 'PUT',
          url: `https://example.com/upload/${file.name}`,
          headers: {
            'Content-Type': file.type
          }
        };
      }
    });

    // Set up event listeners
    uppyInstance.on('upload-success', (file, response) => {
      console.log('Upload success:', file.name);
      setUploadResults(prev => [
        ...prev,
        { 
          id: file.id, 
          name: file.name, 
          status: 'success',
          thumbnail: file.preview
        }
      ]);
    });

    uppyInstance.on('upload-error', (file, error) => {
      console.error('Upload error:', error);
      setError(`Failed to upload ${file.name}: ${error.message}`);
      setUploadResults(prev => [
        ...prev,
        { 
          id: file.id, 
          name: file.name, 
          status: 'error',
          error: error.message
        }
      ]);
    });

    setUppy(uppyInstance);

    // Cleanup
    return () => {
      uppyInstance.close({ reason: 'unmount' });
    };
  }, []);

  const handleOpenUploader = () => {
    setShowUploader(true);
  };

  const handleCloseUploader = () => {
    setShowUploader(false);
  };

  return (
    <div className="w-full">
      {/* Upload Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={handleOpenUploader}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Photos</span>
        </button>
        <button
          onClick={handleOpenUploader}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <Camera className="w-5 h-5" />
          <span>Take a Photo</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Upload Results</h3>
          <div className="space-y-2">
            {uploadResults.map(result => (
              <div 
                key={result.id}
                className={`border p-3 rounded-lg flex justify-between items-center ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center">
                  {result.status === 'success' 
                    ? <Check className="w-5 h-5 text-green-500 mr-2" /> 
                    : <AlertCircle className="w-5 h-5 text-red-500 mr-2" />}
                  <span>{result.name}</span>
                </div>
                {result.status === 'error' && <p className="text-sm text-red-600">{result.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uppy Dashboard Modal */}
      {uppy && (
        <DashboardModal
          uppy={uppy}
          open={showUploader}
          onRequestClose={handleCloseUploader}
          plugins={['Webcam']}
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails
          note="Images only, up to 10MB"
          closeAfterFinish
          browserBackButtonClose
          showLinkToFileInput={false}
        />
      )}
    </div>
  );
};

export default SafePhotoUploader; 