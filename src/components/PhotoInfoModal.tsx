import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Users, AlertCircle, Calendar, MapPin, Tag, Info, 
  Download, Share2, Building, UserCog, Camera, Image, Clock,
  Sparkles, Eye, Ruler, Smile, Aperture, Settings, Sliders,
  Glasses, Frown, Laugh, Bean as Beard, Meh, Compass, Map,
  FileType, HardDrive, Globe, Upload
} from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { PhotoMetadata } from '../types';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { EventDetails, FaceAttributes } from '../types';

interface PhotoInfoModalProps {
  photo: PhotoMetadata;
  onClose: () => void;
  onShare?: (photoId: string) => void;
}

export const PhotoInfoModal: React.FC<PhotoInfoModalProps> = ({ 
  photo, 
  onClose,
  onShare 
}) => {
  const [loading, setLoading] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const url = await PhotoService.downloadPhoto(photo.id);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventDetails = () => {
    if (!photo.event_details) return null;

    const details = [
      {
        icon: <Calendar className="w-4 h-4" />,
        label: "Event Date",
        value: new Date(photo.event_details.date || photo.date_taken || photo.created_at).toLocaleDateString()
      },
      {
        icon: <Sparkles className="w-4 h-4" />,
        label: "Event Name",
        value: photo.event_details.name || 'Untitled Event'
      },
      {
        icon: <Building className="w-4 h-4" />,
        label: "Venue",
        value: photo.venue?.name || 'Unknown Venue'
      },
      {
        icon: <UserCog className="w-4 h-4" />,
        label: "Promoter",
        value: photo.event_details.promoter || 'Unknown'
      }
    ];

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-apple-gray-700 mb-2">Event Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {details.map((detail, index) => (
            <div 
              key={index}
              className="flex items-center p-2 bg-apple-gray-50 rounded-apple"
            >
              <div className="mr-2 text-apple-gray-500">
                {detail.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-apple-gray-900">
                  {detail.label}
                </div>
                <div className="text-xs text-apple-gray-500">
                  {detail.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPhotoDetails = () => {
    const details = [
      {
        icon: <Calendar className="w-4 h-4" />,
        label: "Date Taken",
        value: new Date(photo.date_taken || photo.created_at).toLocaleDateString()
      },
      {
        icon: <FileType className="w-4 h-4" />,
        label: "File Type",
        value: photo.fileType
      },
      {
        icon: <HardDrive className="w-4 h-4" />,
        label: "File Size",
        value: `${(photo.fileSize / 1024 / 1024).toFixed(2)} MB`
      },
      {
        icon: <Clock className="w-4 h-4" />,
        label: "Uploaded",
        value: new Date(photo.created_at).toLocaleString()
      },
      {
        icon: <Image className="w-4 h-4" />,
        label: "Dimensions",
        value: `${imageSize.width} × ${imageSize.height}`
      },
      {
        icon: <Upload className="w-4 h-4" />,
        label: "Uploaded By",
        value: photo.uploadedBy || 'Unknown'
      }
    ];

    if (photo.location?.name) {
      details.push({
        icon: <Globe className="w-4 h-4" />,
        label: "Location",
        value: photo.location.name
      });
    }

    if (photo.tags?.length) {
      details.push({
        icon: <Tag className="w-4 h-4" />,
        label: "Tags",
        value: photo.tags.join(', ')
      });
    }

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-apple-gray-700 mb-2">Photo Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {details.map((detail, index) => (
            <div 
              key={index}
              className="flex items-center p-2 bg-apple-gray-50 rounded-apple"
            >
              <div className="mr-2 text-apple-gray-500">
                {detail.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-apple-gray-900">
                  {detail.label}
                </div>
                <div className="text-xs text-apple-gray-500">
                  {detail.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {photo.location?.lat && photo.location?.lng && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-apple-gray-700 mb-2">Location</h4>
            <div className="h-48 rounded-apple overflow-hidden">
              <GoogleMaps
                location={{
                  lat: photo.location.lat,
                  lng: photo.location.lng,
                  name: photo.location.name || ''
                }}
                onLocationChange={() => {}}
                height="100%"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFaceAttributes = () => {
    if (!photo.faces?.length) return null;

    const face = photo.faces[0];
    if (!face.attributes) return null;

    // Get primary emotion (highest confidence)
    const primaryEmotion = face.attributes.emotions?.reduce((prev, curr) => 
      (curr.confidence > prev.confidence) ? curr : prev
    );

    const attributes = [
      {
        icon: <Smile className="w-4 h-4" />,
        label: "Expression",
        value: face.attributes.smile?.value ? "Smiling" : "Not Smiling",
        confidence: face.attributes.smile?.confidence
      },
      {
        icon: <Eye className="w-4 h-4" />,
        label: "Eyes",
        value: face.attributes.eyesOpen?.value ? "Open" : "Closed",
        confidence: face.attributes.eyesOpen?.confidence
      },
      {
        icon: <Glasses className="w-4 h-4" />,
        label: "Eyewear",
        value: face.attributes.sunglasses?.value ? "Sunglasses" : 
               face.attributes.eyeglasses?.value ? "Glasses" : "None",
        confidence: face.attributes.sunglasses?.value ? 
                   face.attributes.sunglasses?.confidence :
                   face.attributes.eyeglasses?.confidence
      },
      {
        icon: <Ruler className="w-4 h-4" />,
        label: "Age Range",
        value: `${face.attributes.age?.low}-${face.attributes.age?.high} years`,
        confidence: 100
      },
      {
        icon: <User className="w-4 h-4" />,
        label: "Gender",
        value: face.attributes.gender?.value,
        confidence: face.attributes.gender?.confidence
      },
      {
        icon: <Laugh className="w-4 h-4" />,
        label: "Emotion",
        value: primaryEmotion?.type || "Neutral",
        confidence: primaryEmotion?.confidence
      },
      {
        icon: <Beard className="w-4 h-4" />,
        label: "Facial Hair",
        value: face.attributes.beard?.value ? "Beard" : 
               face.attributes.mustache?.value ? "Mustache" : "None",
        confidence: face.attributes.beard?.value ? 
                   face.attributes.beard?.confidence :
                   face.attributes.mustache?.confidence
      },
      {
        icon: <Sliders className="w-4 h-4" />,
        label: "Quality",
        value: `${Math.round(face.attributes.quality?.brightness || 0)}% Brightness, ${Math.round(face.attributes.quality?.sharpness || 0)}% Sharpness`,
        confidence: 100
      }
    ];

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-apple-gray-700 mb-2">Face Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {attributes.map((attr, index) => (
            <div 
              key={index}
              className="flex items-center p-2 bg-apple-gray-50 rounded-apple"
            >
              <div className="mr-2 text-apple-gray-500">
                {attr.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-apple-gray-900">
                  {attr.label}
                </div>
                <div className="text-xs text-apple-gray-500">
                  {attr.value} ({Math.round(attr.confidence || 0)}% confidence)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMatchedUsers = () => {
    if (!photo.matched_users?.length) {
      return (
        <div className="mb-6 p-4 bg-apple-gray-50 rounded-apple text-center">
          <AlertCircle className="w-8 h-8 text-apple-gray-400 mx-auto mb-2" />
          <p className="text-apple-gray-600 font-medium">No Matches Found</p>
          <p className="text-apple-gray-500 text-sm mt-1">
            No registered faces were detected in this photo
          </p>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-apple-gray-700 mb-2">Matched People</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {photo.matched_users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2 p-2 rounded-apple bg-apple-gray-50"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-apple-blue-100 text-apple-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium">{user.fullName}</div>
                <div className="text-xs text-apple-gray-500">
                  {Math.round(user.confidence)}% match
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl bg-white rounded-apple-2xl overflow-hidden"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-[85vh]">
          {/* Left side - Image */}
          <div className="w-full md:w-3/5 h-full relative">
            <div className="absolute inset-0 flex items-center justify-center bg-apple-gray-100">
              <div className="relative w-full h-full">
                <img
                  src={photo.url}
                  alt={photo.title || 'Photo'}
                  className={cn(
                    "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                    "max-w-[95%] max-h-[95%] w-auto h-auto object-contain",
                    !imageLoaded && "opacity-0"
                  )}
                  onLoad={handleImageLoad}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-apple-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Details */}
          <div className="w-full md:w-2/5 h-full flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Photo Details</h3>
                <button 
                  onClick={onClose} 
                  className="absolute top-2 right-2 p-2 rounded-full bg-apple-white hover:bg-apple-gray-100 text-apple-gray-500 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Info */}
              {(photo.title || photo.description) && (
                <div className="mb-6">
                  {photo.title && (
                    <h3 className="text-lg font-medium mb-1">{photo.title}</h3>
                  )}
                  {photo.description && (
                    <p className="text-apple-gray-600 text-sm">{photo.description}</p>
                  )}
                </div>
              )}

              {/* Face Analysis */}
              {renderFaceAttributes()}

              {/* Event Details */}
              {renderEventDetails()}

              {/* Photo Details */}
              {renderPhotoDetails()}

              {/* Matched Users */}
              {renderMatchedUsers()}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-apple-gray-200 bg-white">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="ios-button-secondary flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </button>
                {onShare && (
                  <button
                    onClick={() => onShare(photo.id)}
                    className="ios-button-primary flex items-center"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
