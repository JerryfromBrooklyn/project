import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadPhotoWithMatching } from '../services/face-matching/api';

/**
 * PhotoUpload component for uploading photos with automatic face matching
 */
export const PhotoUpload = ({ onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    console.log('[UPLOAD] Selected', selectedFiles.length, 'files');
    
    // Validate files (only images)
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== selectedFiles.length) {
      setError('Only image files are allowed');
    }
    
    setFiles(imageFiles);
    setError(null);
  };

  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    
    if (event.dataTransfer.files) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      console.log('[UPLOAD] Dropped', droppedFiles.length, 'files');
      
      // Validate files (only images)
      const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length !== droppedFiles.length) {
        setError('Only image files are allowed');
      }
      
      setFiles(imageFiles);
      setError(null);
    }
  };

  // Prevent default drag behavior
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Clear selected files
  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload selected files
  const handleUpload = async () => {
    if (!files.length || !user) return;
    
    setUploading(true);
    setResults([]);
    setError(null);
    
    const uploadResults = [];
    
    console.log('[UPLOAD] Starting upload of', files.length, 'files');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          progress: 0,
          status: 'uploading'
        }
      }));
      
      try {
        console.log(`[UPLOAD] Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        // Upload with face matching
        const result = await uploadPhotoWithMatching(user.id, file, {
          title: file.name,
          uploadedBy: user.id
        });
        
        console.log(`[UPLOAD] Upload result for ${file.name}:`, result);
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            progress: 100,
            status: 'success',
            matches: result.matchedUsers?.length || 0
          }
        }));
        
        uploadResults.push({
          fileName: file.name,
          photoId: result.photoId,
          url: result.url,
          success: true,
          matchedUsers: result.matchedUsers || []
        });
      } catch (error) {
        console.error(`[UPLOAD] Error uploading ${file.name}:`, error);
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            progress: 100,
            status: 'error',
            error: error.message
          }
        }));
        
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('[UPLOAD] All uploads completed. Results:', uploadResults);
    setResults(uploadResults);
    setUploading(false);
    
    // Call success callback if provided
    if (onSuccess && uploadResults.some(r => r.success)) {
      onSuccess(uploadResults.filter(r => r.success));
    }
  };

  // Get upload status for all files
  const getOverallStatus = () => {
    if (!files.length) return 'idle';
    if (uploading) return 'uploading';
    if (results.length > 0) return 'completed';
    return 'ready';
  };

  return (
    <div className="photo-upload p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Photos</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {/* File Drop Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />
        
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        
        <p className="text-gray-700 mb-2">Drag & drop photos here or click to browse</p>
        <p className="text-gray-500 text-sm">JPG, PNG, GIF files accepted</p>
      </div>
      
      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">Selected Files ({files.length})</h3>
            <button 
              onClick={clearFiles}
              disabled={uploading}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div key={file.name} className="flex items-center p-2 border border-gray-200 rounded-md">
                <div className="h-10 w-10 mr-3 bg-gray-100 rounded overflow-hidden">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)}KB</p>
                </div>
                
                {uploadProgress[file.name] && (
                  <div className="ml-2 text-sm">
                    {uploadProgress[file.name].status === 'uploading' && (
                      <span className="text-blue-600">Uploading...</span>
                    )}
                    {uploadProgress[file.name].status === 'success' && (
                      <span className="text-green-600">Uploaded</span>
                    )}
                    {uploadProgress[file.name].status === 'error' && (
                      <span className="text-red-600">Failed</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload Button */}
      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            `Upload ${files.length > 0 ? `${files.length} Photo${files.length > 1 ? 's' : ''}` : 'Photos'}`
          )}
        </button>
      </div>
      
      {/* Upload Results */}
      {results.length > 0 && getOverallStatus() === 'completed' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Upload Results</h3>
          
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.fileName} className="p-3 bg-white rounded border border-gray-200">
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="font-medium">{result.fileName}</p>
                </div>
                
                {result.success ? (
                  <div className="mt-2 ml-6">
                    <p className="text-sm text-gray-600">
                      {result.matchedUsers.length > 0 ? (
                        `Matched with ${result.matchedUsers.length} user${result.matchedUsers.length > 1 ? 's' : ''}`
                      ) : (
                        'No face matches found'
                      )}
                    </p>
                    
                    {result.matchedUsers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.matchedUsers.map((user) => (
                          <div key={user.userId} className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            <div className="h-4 w-4 rounded-full bg-gray-200 overflow-hidden mr-1">
                              {user.avatarUrl && (
                                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <span>{user.fullName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 ml-6 text-sm text-red-600">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload; 