import React from 'react';
import { usePhotos } from '../hooks/usePhotos';

/**
 * Grid component for displaying photos
 */
const PhotoGrid = ({ 
  photos = [], 
  selectPhoto = () => {}, 
  columns = {
    default: 2,
    sm: 2,
    md: 3,
    lg: 4
  } 
}) => {
  const { loading, error } = usePhotos();

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p>Loading photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-100 rounded-lg">
        No photos uploaded yet
      </div>
    );
  }

  /**
   * Format a date string for display
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  // Dynamically generate grid classes based on columns prop
  const gridClasses = `grid grid-cols-${columns.default} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} gap-4`;

  return (
    <div className={gridClasses}>
      {photos.map(photo => (
        <div 
          key={photo.id} 
          className="border rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          onClick={() => selectPhoto(photo)}
        >
          <div className="aspect-square w-full relative bg-gray-100">
            <img 
              src={photo.public_url || photo.url} 
              alt={photo.title || "User uploaded photo"}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Event name overlay if available */}
            {photo.event_details?.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">
                  {photo.event_details.name}
                </p>
                {photo.venue?.name && (
                  <p className="text-white/80 text-xs truncate">
                    {photo.venue.name}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formatDate(photo.created_at)}
              </p>
              
              {/* Face count badge if faces detected */}
              {photo.faces && photo.faces.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {photo.faces.length} {photo.faces.length === 1 ? 'Face' : 'Faces'}
                </span>
              )}
            </div>
            
            {/* Match count badge */}
            {photo.matched_users && photo.matched_users.length > 0 && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {photo.matched_users.length} {photo.matched_users.length === 1 ? 'Match' : 'Matches'}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid; 