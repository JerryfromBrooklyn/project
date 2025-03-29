import React, { useState } from 'react';
import { X, User, Calendar, MapPin, Building, Tag, Download, Image, FileType } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';

/**
 * A simple, robust modal for displaying photo information
 * This component focuses on reliability and simplicity
 */
export const SimplePhotoInfoModal = ({ photo, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  // Normalize the photo data structure to prevent errors
  const safePhoto = {
    id: photo?.id || 'unknown',
    url: photo?.url || photo?.public_url || '',
    title: photo?.title || 'Untitled Photo',
    file_size: photo?.file_size || photo?.fileSize || 0,
    file_type: photo?.file_type || photo?.fileType || 'unknown',
    created_at: photo?.created_at || new Date().toISOString(),
    faces: Array.isArray(photo?.faces) ? photo.faces : [],
    matched_users: Array.isArray(photo?.matched_users) ? 
      photo.matched_users.map(user => ({
        userId: user.userId || user.user_id,
        faceId: user.faceId || user.face_id || null,
        fullName: user.fullName || user.full_name || user.name || 'Unknown User',
        email: user.email || null,
        avatarUrl: user.avatarUrl || user.avatar_url || null,
        confidence: user.confidence || user.similarity || 95,
        similarity: user.similarity || user.confidence || 95
      })) : [],
    event_details: photo?.event_details || { name: null, date: null, promoter: null },
    venue: photo?.venue || { name: null },
    location: photo?.location || { name: null, lat: null, lng: null },
    tags: Array.isArray(photo?.tags) ? photo.tags : []
  };

  // Log the sanitized data
  console.log('[SimplePhotoInfoModal] Using sanitized photo data:', safePhoto);
  
  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Use the URL directly instead of querying the database
      const url = safePhoto.url;
      
      // Check if URL exists
      if (!url) {
        throw new Error('No download URL available');
      }
      
      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${safePhoto.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading photo:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(2) + ' MB';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Photo Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Image preview */}
        <div className="p-4 bg-gray-50">
          <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
            <img 
              src={safePhoto.url} 
              alt={safePhoto.title} 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* Info sections */}
        <div className="p-4 grid gap-6">
          {/* Photo info */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Title', value: safePhoto.title, icon: <Image size={16} /> },
                { label: 'Date', value: formatDate(safePhoto.created_at), icon: <Calendar size={16} /> },
                { label: 'File Size', value: formatFileSize(safePhoto.file_size), icon: <FileType size={16} /> },
                { label: 'File Type', value: safePhoto.file_type, icon: <FileType size={16} /> }
              ].map((item, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                  <div className="mr-3 text-gray-500">{item.icon}</div>
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="font-medium">{item.value || 'Not available'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Event info */}
          {safePhoto.event_details?.name && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Event Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Event Name', value: safePhoto.event_details.name, icon: <Calendar size={16} /> },
                  { label: 'Event Date', value: formatDate(safePhoto.event_details.date), icon: <Calendar size={16} /> },
                  { label: 'Promoter', value: safePhoto.event_details.promoter, icon: <User size={16} /> },
                  { label: 'Venue', value: safePhoto.venue?.name, icon: <Building size={16} /> }
                ].map((item, index) => (
                  item.value && (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                      <div className="mr-3 text-gray-500">{item.icon}</div>
                      <div>
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium">{item.value || 'Not available'}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </section>
          )}
          
          {/* Face information */}
          {safePhoto.faces.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Face Analysis ({safePhoto.faces.length})</h3>
              <div className="grid grid-cols-1 gap-3">
                {safePhoto.faces.map((face, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium mb-2">Face #{index + 1}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {face.attributes?.age && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Age:</span>
                          <span>{face.attributes.age.low} - {face.attributes.age.high} years</span>
                        </div>
                      )}
                      
                      {face.attributes?.gender && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Gender:</span>
                          <span>{face.attributes.gender.value} ({Math.round(face.attributes.gender.confidence)}% confident)</span>
                        </div>
                      )}
                      
                      {face.attributes?.emotions?.length > 0 && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Emotion:</span>
                          <span>
                            {face.attributes.emotions
                              .sort((a, b) => b.confidence - a.confidence)[0]?.type || 'Unknown'}
                          </span>
                        </div>
                      )}
                      
                      {face.attributes?.smile && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Smiling:</span>
                          <span>{face.attributes.smile.value ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Matched users */}
          {safePhoto.matched_users.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Matched Users ({safePhoto.matched_users.length})</h3>
              <div className="grid grid-cols-1 gap-3">
                {safePhoto.matched_users.map((user, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.fullName || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">
                        Match confidence: {Math.round(user.confidence)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Location */}
          {safePhoto.location?.name && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Location</h3>
              <div className="p-3 bg-gray-50 rounded flex items-center">
                <MapPin size={20} className="text-gray-500 mr-3" />
                <span>{safePhoto.location.name}</span>
              </div>
            </section>
          )}
          
          {/* Tags */}
          {safePhoto.tags.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {safePhoto.tags.map((tag, index) => (
                  <div key={index} className="px-3 py-1 bg-gray-100 rounded-full flex items-center">
                    <Tag size={14} className="mr-1 text-gray-500" />
                    <span className="text-sm">{tag}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <Download size={16} className="mr-2" />
            {downloading ? 'Downloading...' : 'Download Photo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplePhotoInfoModal; 