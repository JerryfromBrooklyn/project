import React, { useState } from 'react';
import { usePhotos } from '../hooks/usePhotos';

/**
 * Photo uploader component with event details form
 */
const PhotoUploader = ({ onSuccess }) => {
  const { uploadPhoto } = usePhotos();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [eventData, setEventData] = useState({
    eventName: '',
    venueName: '',
    promoterName: '',
    date: new Date().toISOString().split('T')[0]
  });

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage('');
    setError('');
    setProgress(0);
  };
  
  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Upload the selected photo with metadata
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    // Validate form fields
    if (!eventData.eventName.trim()) {
      setError('Please enter an event name');
      return;
    }
    
    if (!eventData.venueName.trim()) {
      setError('Please enter a venue name');
      return;
    }

    try {
      setUploading(true);
      setMessage('Starting upload...');
      
      // Create a snapshot of event data to ensure it's not affected by state changes
      const currentEventData = {
        eventName: eventData.eventName.trim(),
        venueName: eventData.venueName.trim(),
        promoterName: eventData.promoterName.trim(),
        date: eventData.date
      };
      
      console.log('Starting upload with data:', currentEventData);
      
      // Prepare metadata for the photo
      const metadata = {
        event_details: {
          date: currentEventData.date || new Date().toISOString(),
          name: currentEventData.eventName,
          type: null,
          promoter: currentEventData.promoterName
        },
        venue: {
          id: null,
          name: currentEventData.venueName
        },
        location: {
          lat: null,
          lng: null,
          name: null
        }
      };
      
      // Upload the photo with progress tracking
      await uploadPhoto(
        selectedFile, 
        metadata,
        (progressValue) => {
          setProgress(progressValue);
          if (progressValue === 20) setMessage('Uploading to storage...');
          if (progressValue === 50) setMessage('Processing image...');
          if (progressValue === 70) setMessage('Saving metadata...');
          if (progressValue === 90) setMessage('Almost done...');
        }
      );
      
      setProgress(100);
      setMessage('Upload successful!');
      setSelectedFile(null);
      
      // Reset form after successful upload
      setEventData({
        eventName: '',
        venueName: '',
        promoterName: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Call success callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6 border p-4 rounded-xl">
      <h3 className="text-lg font-semibold mb-3">Upload Photo</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload a new photo with event information
      </p>
      
      <div className="flex flex-col gap-4">
        <input 
          type="file" 
          onChange={handleFileChange}
          accept="image/*"
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name*</label>
            <input
              type="text"
              name="eventName"
              value={eventData.eventName}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter event name"
              disabled={uploading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue*</label>
            <input
              type="text"
              name="venueName"
              value={eventData.venueName}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter venue name"
              disabled={uploading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promoter</label>
            <input
              type="text"
              name="promoterName"
              value={eventData.promoterName}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter promoter name"
              disabled={uploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={eventData.date}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              disabled={uploading}
            />
          </div>
        </div>
        
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}></div>
            <p className="text-xs text-gray-500 mt-1">Progress: {progress}% {message}</p>
          </div>
        )}
        
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          className="py-2 px-4 font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
      
      {message && !uploading && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default PhotoUploader; 