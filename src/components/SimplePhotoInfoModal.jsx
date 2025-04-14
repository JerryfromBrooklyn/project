import React, { useState } from 'react';
import { X, User, Calendar, MapPin, Building, Tag, Download, Image, FileType,
         Smile, Eye, Glasses, Sliders, Ruler, Laugh, AlertCircle, Clock, Globe, Link } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * A modern, iOS-inspired photo information modal
 */
export const SimplePhotoInfoModal = ({ photo, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Normalize the photo data structure to prevent errors
  const safePhoto = {
    id: photo?.id || 'unknown',
    url: photo?.url || photo?.public_url || '',
    title: photo?.title || 'Untitled Photo',
    file_size: photo?.file_size || photo?.fileSize || 0,
    file_type: photo?.file_type || photo?.fileType || 'unknown',
    created_at: photo?.created_at || new Date().toISOString(),
    faces: Array.isArray(photo?.faces) ? photo.faces : [],
    event_details: photo?.event_details || { name: null, date: null, promoter: null },
    venue: photo?.venue || { name: null },
    location: photo?.location || { name: null, lat: null, lng: null, address: null },
    tags: Array.isArray(photo?.tags) ? photo.tags : [],
    date_taken: photo?.date_taken,
    externalAlbumLink: photo?.externalAlbumLink || photo?.albumLink || photo?.album_link ||
                      photo?.external_album_link || photo?.external_link || null
  };

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

  // Get complete location string
  const getLocationString = () => {
    const loc = safePhoto.location;
    if (!loc) return null;
    
    // Use address if available
    if (loc.address) return loc.address;
    
    // Use name if available
    if (loc.name && loc.name !== "Unknown Location") return loc.name;
    
    // Use coordinates if available
    if (loc.lat && loc.lng) return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
    
    return null;
  };

  // Check if we have location data to display
  const hasLocationData = () => {
    const loc = safePhoto.location;
    
    // Always show location section, even with minimal data
    return true;
  };

  // Get location name (place name)
  const getLocationName = () => {
    const loc = safePhoto.location;
    if (!loc) return null;
    
    if (loc.name && loc.name !== "Unknown Location") return loc.name;
    return "Unknown Location";
  };

  // Get location address
  const getLocationAddress = () => {
    const loc = safePhoto.location;
    if (!loc) return "No address available";
    
    if (loc.address) return loc.address;
    
    // If no address but we have coordinates, return them formatted
    if (loc.lat && loc.lng) return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
    
    return "No address available";
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const renderFaceAttributes = () => {
    if (!safePhoto.faces || safePhoto.faces.length === 0) {
      return null; // No faces to analyze
    }
    return (
      <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <User size={16} className="mr-2 text-blue-500" />
          Face Analysis ({safePhoto.faces.length})
        </h3>
        <div className="space-y-4">
          {safePhoto.faces.map((face, index) => {
            // Extract attributes
            const attrs = face.attributes || {};
            
            // Get primary emotion if available
            let primaryEmotion = "Unknown";
            let emotionConfidence = 0;
            
            if (attrs.emotions && Array.isArray(attrs.emotions) && attrs.emotions.length > 0) {
              const topEmotion = attrs.emotions.sort((a, b) => b.confidence - a.confidence)[0];
              primaryEmotion = topEmotion.type;
              emotionConfidence = topEmotion.confidence;
            }
            
            // Build attribute list
            const attributes = [
              // Basic attributes
              { 
                label: "Age", 
                value: attrs.age ? `${attrs.age.low} - ${attrs.age.high} years` : "Unknown",
                icon: <User size={16} className="text-gray-500" />
              },
              { 
                label: "Gender", 
                value: attrs.gender?.value || "Unknown",
                confidence: attrs.gender?.confidence,
                icon: <AlertCircle size={16} className="text-gray-500" />
              },
              { 
                label: "Expression", 
                value: primaryEmotion,
                confidence: emotionConfidence,
                icon: <Smile size={16} className="text-gray-500" />
              },
              { 
                label: "Smiling", 
                value: attrs.smile?.value ? "Yes" : "No",
                confidence: attrs.smile?.confidence,
                icon: <Laugh size={16} className="text-gray-500" />
              },
              { 
                label: "Eyes Open", 
                value: attrs.eyesOpen?.value !== undefined ? (attrs.eyesOpen.value ? "Yes" : "No") : "Unknown",
                confidence: attrs.eyesOpen?.confidence,
                icon: <Eye size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Mouth Open", 
                value: attrs.mouthOpen?.value !== undefined ? (attrs.mouthOpen.value ? "Yes" : "No") : "Unknown",
                confidence: attrs.mouthOpen?.confidence,
                icon: <Eye size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Glasses", 
                value: attrs.eyeglasses?.value !== undefined ? (attrs.eyeglasses.value ? "Yes" : "No") : "Unknown",
                confidence: attrs.eyeglasses?.confidence,
                icon: <Glasses size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Sunglasses", 
                value: attrs.sunglasses?.value !== undefined ? (attrs.sunglasses.value ? "Yes" : "No") : "Unknown",
                confidence: attrs.sunglasses?.confidence,
                icon: <Glasses size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Beard", 
                value: attrs.beard?.value !== undefined ? (attrs.beard.value ? "Yes" : "No") : "Unknown",
                confidence: attrs.beard?.confidence,
                icon: <User size={16} className="text-gray-500" />,
                forceShow: true
              },
              { 
                label: "Mustache", 
                value: attrs.mustache?.value !== undefined ? (attrs.mustache.value ? "Yes" : "No") : "Unknown",
                confidence: attrs.mustache?.confidence,
                icon: <User size={16} className="text-gray-500" />,
                forceShow: true
              }
            ];
            
            // Add image quality if available
            if (attrs.quality && (attrs.quality.brightness !== undefined || attrs.quality.sharpness !== undefined)) {
              const brightnessVal = attrs.quality.brightness !== undefined ? `${Math.round(attrs.quality.brightness * 100)}%` : "Unknown";
              const sharpnessVal = attrs.quality.sharpness !== undefined ? `${Math.round(attrs.quality.sharpness * 100)}%` : "Unknown";
              
              attributes.push({ 
                label: "Image Quality", 
                value: `Brightness: ${brightnessVal}, Sharpness: ${sharpnessVal}`,
                icon: <Sliders size={16} className="text-gray-500" />,
                forceShow: true
              });
            } else if (attrs.Quality) {
              // Alternative Quality structure (uppercase key)
              const quality = attrs.Quality;
              const qualityDetails = [];
              
              if (quality.Brightness !== undefined) {
                qualityDetails.push(`Brightness: ${Math.round(quality.Brightness * 100)}%`);
              }
              
              if (quality.Sharpness !== undefined) {
                qualityDetails.push(`Sharpness: ${Math.round(quality.Sharpness * 100)}%`);
              }
              
              if (qualityDetails.length > 0) {
                attributes.push({
                  label: "Image Quality",
                  value: qualityDetails.join(', '),
                  icon: <Sliders size={16} className="text-gray-500" />,
                  forceShow: true
                });
              }
            }
            
            // Add pose information if available
            if (attrs.pose) {
              const pose = attrs.pose;
              const poseParts = [];
              
              if (pose.Roll !== undefined) poseParts.push(`Roll: ${Math.round(pose.Roll)}°`);
              if (pose.Yaw !== undefined) poseParts.push(`Yaw: ${Math.round(pose.Yaw)}°`);
              if (pose.Pitch !== undefined) poseParts.push(`Pitch: ${Math.round(pose.Pitch)}°`);
              
              const poseString = poseParts.join(', ');
              
              if (poseString) {
                attributes.push({ 
                  label: "Head Pose", 
                  value: poseString,
                  icon: <Ruler size={16} className="text-gray-500" />
                });
              }
            }
            
            // Filter attributes based on user preference - show all 
            const filteredAttributes = attributes.filter(attr => true);
            
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-3 pb-1 border-b border-gray-200 dark:border-gray-700">
                  Face #{index + 1}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredAttributes.map((attr, attrIndex) => (
                    <div key={attrIndex} className="flex items-center">
                      <div className="mr-2">{attr.icon}</div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{attr.label}:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{attr.value}</span>
                        {attr.confidence > 0 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                            {Math.round(attr.confidence)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-fadeIn flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full md:w-1/2 lg:w-3/5 bg-black flex items-center justify-center relative h-[50vh] md:h-full">
          <img
            src={encodeURI(safePhoto.url || '')}
            alt={safePhoto.title}
            className={cn(
              "object-contain max-w-full max-h-full transition-opacity duration-300",
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleImageLoad}
            onError={(e) => { e.target.onerror = null; e.target.src='/placeholder.png'; }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col h-[calc(90vh - 50vh - 3rem)] md:h-full">
          <div className="relative h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Photo Details</h2>
            <button
              onClick={onClose}
              className="absolute right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
            <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Image size={16} className="mr-2 text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Title', value: safePhoto.title, icon: <Image size={16} className="text-gray-500" /> },
                  { label: 'Date', value: formatDate(safePhoto.date_taken || safePhoto.created_at), icon: <Calendar size={16} className="text-gray-500" /> },
                  { label: 'File Size', value: formatFileSize(safePhoto.file_size), icon: <FileType size={16} className="text-gray-500" /> },
                  { label: 'File Type', value: safePhoto.file_type, icon: <FileType size={16} className="text-gray-500" /> },
                  { label: 'Uploaded', value: formatDate(safePhoto.created_at), icon: <Clock size={16} className="text-gray-500" /> }
                ].map((item, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="mr-3 text-gray-500">{item.icon}</div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{item.value || 'Not available'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {safePhoto.externalAlbumLink && (
              <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Link size={16} className="mr-2 text-blue-500" />
                  Album Link
                </h3>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <div className="flex flex-wrap items-center">
                    <a 
                      href={safePhoto.externalAlbumLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex-1 truncate"
                    >
                      {safePhoto.externalAlbumLink || "No album link available"}
                    </a>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    {safePhoto.externalAlbumLink 
                      ? "Click to open the album in a new tab" 
                      : ""}
                  </p>
                </div>
              </section>
            )}

            {hasLocationData() && (
              <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Globe size={16} className="mr-2 text-blue-500" />
                  Location
                </h3>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center">
                    <Building size={18} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Place Name</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{getLocationName()}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center">
                    <MapPin size={18} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{getLocationAddress()}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {renderFaceAttributes()}

            {safePhoto.tags && safePhoto.tags.length > 0 && (
              <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Tag size={16} className="mr-2 text-blue-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {safePhoto.tags.map((tag, index) => (
                    <div key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center text-sm">
                      <Tag size={14} className="mr-1" />
                      {tag}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading || !safePhoto.url}
                className="ios-button-secondary flex items-center disabled:opacity-50"
              >
                {downloading ? (
                  <div className="w-5 h-5 mr-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                Download
              </button>
              <button onClick={onClose} className="ios-button-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePhotoInfoModal;
