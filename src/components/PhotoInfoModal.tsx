import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Tag, Info, Download, Share2, 
  Building, Camera, Image, Clock, Sparkles, Eye, Ruler, 
  Smile, Glasses, FileType, HardDrive, Globe, Upload,
  Users, ChevronRight, User, MessageCircle, Award, Heart,
  AlertCircle
} from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { PhotoMetadata, MatchedUser, FaceAttributes } from '../types';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';

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
  // Log the full photo object for debugging
  console.log('[PhotoInfoModal] Full photo data:', JSON.stringify(photo, null, 2));
  
  // Ensure photo has all required properties
  const normalizedPhoto = {
    ...photo,
    faces: Array.isArray(photo.faces) ? photo.faces : [],
    matched_users: Array.isArray(photo.matched_users) ? photo.matched_users : [],
    location: photo.location || { lat: null, lng: null, name: null },
    event_details: photo.event_details || { date: null, name: null, type: null, promoter: null },
    venue: photo.venue || { id: null, name: null },
    tags: Array.isArray(photo.tags) ? photo.tags : []
  };

  // Debug logs - more detailed info
  console.log('[PhotoInfoModal] Has faces:', normalizedPhoto.faces.length > 0, 'Length:', normalizedPhoto.faces.length);
  console.log('[PhotoInfoModal] Has matched_users:', normalizedPhoto.matched_users?.length > 0, 'Length:', normalizedPhoto.matched_users?.length);
  console.log('[PhotoInfoModal] Has location:', normalizedPhoto.location?.name != null);
  console.log('[PhotoInfoModal] Has event_details:', 
    normalizedPhoto.event_details?.name != null || normalizedPhoto.event_details?.date != null ||
    normalizedPhoto.event_details?.promoter != null);
  
  // Debug first face in more detail
  if (normalizedPhoto.faces.length > 0) {
    console.log('[PhotoInfoModal] First face structure:', JSON.stringify(normalizedPhoto.faces[0], null, 2));
    
    if (normalizedPhoto.faces[0]?.attributes) {
      console.log('[PhotoInfoModal] First face attributes:', JSON.stringify(normalizedPhoto.faces[0].attributes, null, 2));
      
      if (normalizedPhoto.faces[0].attributes.emotions?.length > 0) {
        console.log('[PhotoInfoModal] First face emotions:', JSON.stringify(normalizedPhoto.faces[0].attributes.emotions, null, 2));
      }
    }
  }
  
  // Debug additional photo data
  console.log('[PhotoInfoModal] First matched user:', normalizedPhoto.matched_users?.[0] ? 
    JSON.stringify(normalizedPhoto.matched_users[0], null, 2) : 'None');
  console.log('[PhotoInfoModal] Location data:', JSON.stringify(normalizedPhoto.location, null, 2));
  console.log('[PhotoInfoModal] Event details:', JSON.stringify(normalizedPhoto.event_details, null, 2));
  console.log('[PhotoInfoModal] Venue data:', JSON.stringify(normalizedPhoto.venue, null, 2));

  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState<'info' | 'faces' | 'matches'>('info');

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
      const url = await PhotoService.downloadPhoto(normalizedPhoto.id);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${normalizedPhoto.id}.jpg`;
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

  const handleShare = () => {
    if (onShare) {
      onShare(normalizedPhoto.id);
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300 
      } 
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.98,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  // Helper for confidence indicator
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Safely check if a property exists and has a value
  const hasValue = (obj: any, key: string) => {
    if (!obj) return false;
    const value = obj[key];
    // Check for empty strings, null, undefined
    return value !== null && value !== undefined && value !== '' && value !== 'null';
  };

  // Tabs components
  const InfoTabContent = () => {
    // Check if event details exist and have any non-empty values
    const hasEventName = hasValue(normalizedPhoto.event_details, 'name');
    const hasEventDate = hasValue(normalizedPhoto.event_details, 'date');
    const hasPromoter = hasValue(normalizedPhoto.event_details, 'promoter');
    const hasEventDetails = hasEventName || hasEventDate || hasPromoter;
    
    // Check if venue exists and has a name
    const hasVenueName = hasValue(normalizedPhoto.venue, 'name');
    
    // Check if location exists and has any values
    const hasLocation = hasValue(normalizedPhoto.location, 'name') || 
                       (normalizedPhoto.location?.lat && normalizedPhoto.location.lat !== 0) || 
                       (normalizedPhoto.location?.lng && normalizedPhoto.location.lng !== 0);
    
    console.log('[InfoTabContent] Has event name:', hasEventName);
    console.log('[InfoTabContent] Has event date:', hasEventDate);
    console.log('[InfoTabContent] Has promoter:', hasPromoter);
    console.log('[InfoTabContent] Has event details:', hasEventDetails);
    console.log('[InfoTabContent] Has venue name:', hasVenueName);
    console.log('[InfoTabContent] Has location:', hasLocation);
    console.log('[InfoTabContent] Event details:', JSON.stringify(normalizedPhoto.event_details, null, 2));
    console.log('[InfoTabContent] Venue data:', JSON.stringify(normalizedPhoto.venue, null, 2));
    
    return (
      <div className="space-y-6">
        {/* Photo details */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Photo Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <Calendar className="w-4 h-4" />, label: "Date Taken", value: new Date(normalizedPhoto.date_taken || normalizedPhoto.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { icon: <FileType className="w-4 h-4" />, label: "File Type", value: normalizedPhoto.fileType },
              { icon: <HardDrive className="w-4 h-4" />, label: "File Size", value: `${(normalizedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB` },
              { icon: <Image className="w-4 h-4" />, label: "Dimensions", value: `${imageSize.width} × ${imageSize.height}` },
              { icon: <Clock className="w-4 h-4" />, label: "Uploaded", value: new Date(normalizedPhoto.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              { icon: <Upload className="w-4 h-4" />, label: "Uploaded By", value: normalizedPhoto.uploadedBy || 'Unknown' }
            ].map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Event details */}
        {(hasEventDetails || hasVenueName) && (
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                // Only include items with values
                hasEventDate && { 
                  icon: <Calendar className="w-4 h-4" />, 
                  label: "Event Date", 
                  value: normalizedPhoto.event_details.date && normalizedPhoto.event_details.date !== "null" 
                    ? new Date(normalizedPhoto.event_details.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                    : "Unknown" 
                },
                hasEventName && { 
                  icon: <Sparkles className="w-4 h-4" />, 
                  label: "Event Name", 
                  value: normalizedPhoto.event_details.name
                },
                hasVenueName && { 
                  icon: <Building className="w-4 h-4" />, 
                  label: "Venue", 
                  value: normalizedPhoto.venue.name
                },
                hasPromoter && { 
                  icon: <User className="w-4 h-4" />, 
                  label: "Promoter", 
                  value: normalizedPhoto.event_details.promoter
                }
              ]
              .filter(Boolean)
              .map((item, index) => (
                item && (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <div className="ml-3">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-medium text-gray-900">{item.value}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* Location */}
        {hasLocation && (
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
            <div className="h-60 rounded-xl overflow-hidden shadow-sm">
              <GoogleMaps
                location={{
                  lat: normalizedPhoto.location.lat,
                  lng: normalizedPhoto.location.lng,
                  name: normalizedPhoto.location.name || ''
                }}
                onLocationChange={() => {}}
                height="100%"
                className="w-full"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{normalizedPhoto.location.name}</p>
          </section>
        )}

        {/* Tags */}
        {normalizedPhoto.tags && normalizedPhoto.tags.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {normalizedPhoto.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Show raw data for debugging */}
        <section className="border-t border-gray-200 pt-4 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500">Debug Information</h3>
            <span className="text-xs text-gray-400">For development</span>
          </div>
          <div className="bg-gray-50 p-2 rounded-md text-xs font-mono text-gray-600 overflow-x-auto max-h-32 overflow-y-auto">
            <pre>ID: {normalizedPhoto.id}</pre>
            {normalizedPhoto.faces?.length > 0 && (
              <pre>Faces: {normalizedPhoto.faces.length} detected</pre>
            )}
            {normalizedPhoto.event_details && (
              <pre>Event: {JSON.stringify(normalizedPhoto.event_details, null, 2)}</pre>
            )}
            {normalizedPhoto.venue && (
              <pre>Venue: {JSON.stringify(normalizedPhoto.venue, null, 2)}</pre>
            )}
          </div>
        </section>
      </div>
    );
  };

  const FacesTabContent = () => {
    console.log("[renderFaceAttributes] Called with photo.faces:", JSON.stringify(normalizedPhoto.faces, null, 2));
    
    if (!normalizedPhoto.faces || normalizedPhoto.faces.length === 0) {
      console.log("[renderFaceAttributes] No faces found");
      return (
        <div className="py-10 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-100 mb-3">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No faces detected</h3>
          <p className="text-sm text-gray-500 mt-1">This photo doesn't contain any recognized faces</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {normalizedPhoto.faces.map((face, faceIndex) => {
          console.log(`[renderFaceAttributes] Rendering face ${faceIndex}:`, face);
          if (!face.attributes) {
            console.log(`[renderFaceAttributes] No attributes for face ${faceIndex}`);
            return (
              <div key={faceIndex} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Face #{faceIndex + 1}</h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">Confidence:</span>
                    <div className="ml-2 flex items-center">
                      <div className={cn("h-2 w-16 rounded-full bg-gray-200 overflow-hidden")}>
                        <div 
                          className={cn("h-full rounded-full", getConfidenceColor(face.confidence))}
                          style={{ width: `${face.confidence}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs font-medium">{Math.round(face.confidence)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Face detected but no attributes available</p>
                </div>
              </div>
            );
          }
          
          // Ensure attributes exist and have proper structure
          const attributes = face.attributes || {};

          // Get primary emotion (highest confidence) if emotions exist
          const primaryEmotion = attributes.emotions && Array.isArray(attributes.emotions) 
            ? attributes.emotions.reduce(
                (prev, curr) => (curr.confidence > prev.confidence) ? curr : prev, 
                { type: 'neutral', confidence: 0 }
              )
            : null;

          const hasAge = attributes.age && (
            (attributes.age.low > 0 || attributes.age.high > 0) || 
            (typeof attributes.age === 'object' && Object.keys(attributes.age).length > 0)
          );
          const hasGender = attributes.gender && (attributes.gender.value || attributes.gender.confidence > 0);
          const hasSmile = attributes.smile && (typeof attributes.smile.value === 'boolean' || attributes.smile.confidence > 0);
          const hasEmotions = attributes.emotions && Array.isArray(attributes.emotions) && attributes.emotions.length > 0;

          return (
            <div key={faceIndex} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Face #{faceIndex + 1}</h3>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">Confidence:</span>
                  <div className="ml-2 flex items-center">
                    <div className={cn("h-2 w-16 rounded-full bg-gray-200 overflow-hidden")}>
                      <div 
                        className={cn("h-full rounded-full", getConfidenceColor(face.confidence))}
                        style={{ width: `${face.confidence}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs font-medium">{Math.round(face.confidence)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Age */}
                {hasAge && (
                  <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <Ruler className="w-3 h-3 text-blue-500" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">Age Range</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {attributes.age.low}-{attributes.age.high} years
                    </span>
                  </div>
                )}

                {/* Gender */}
                {hasGender && (
                  <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                        <User className="w-3 h-3 text-purple-500" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">Gender</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">{attributes.gender.value}</span>
                      <div className="ml-2 text-xs text-gray-500">
                        {Math.round(attributes.gender.confidence)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Emotion */}
                {hasEmotions && primaryEmotion && (
                  <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-50 flex items-center justify-center">
                        <Heart className="w-3 h-3 text-yellow-500" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">Emotion</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold capitalize">{primaryEmotion.type}</span>
                      <div className="ml-2 text-xs text-gray-500">
                        {Math.round(primaryEmotion.confidence)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Smile */}
                {hasSmile && (
                  <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                        <Smile className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">Expression</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">{attributes.smile.value ? "Smiling" : "Not Smiling"}</span>
                      <div className="ml-2 text-xs text-gray-500">
                        {Math.round(attributes.smile.confidence)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Eyes */}
                {attributes.eyesOpen && (
                  <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Eye className="w-3 h-3 text-indigo-500" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">Eyes</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">{attributes.eyesOpen.value ? "Open" : "Closed"}</span>
                      <div className="ml-2 text-xs text-gray-500">
                        {Math.round(attributes.eyesOpen.confidence)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Eyewear */}
                {(attributes.sunglasses || attributes.eyeglasses) && (
                  <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center">
                        <Glasses className="w-3 h-3 text-teal-500" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-gray-500">Eyewear</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">
                        {attributes.sunglasses?.value 
                          ? "Sunglasses" 
                          : attributes.eyeglasses?.value 
                            ? "Glasses" 
                            : "None"}
                      </span>
                      <div className="ml-2 text-xs text-gray-500">
                        {Math.round(
                          attributes.sunglasses?.value 
                            ? attributes.sunglasses.confidence 
                            : attributes.eyeglasses?.confidence || 0
                        )}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const MatchesTabContent = () => {
    console.log("[renderMatchedUsers] Called with matched_users:", normalizedPhoto.matched_users);
    
    if (!normalizedPhoto.matched_users || normalizedPhoto.matched_users.length === 0) {
      console.log("[renderMatchedUsers] No matched users found");
      return (
        <div className="py-10 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-100 mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No matches found</h3>
          <p className="text-sm text-gray-500 mt-1">There are no recognized users in this photo</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {normalizedPhoto.matched_users.map((user, index) => (
          <div key={index} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">{user.fullName}</h4>
                  <p className="text-xs text-gray-500">ID: {user.userId.substring(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">Match:</span>
                <div className="ml-1 w-12 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", getConfidenceColor(user.confidence))}
                    style={{ width: `${user.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(user.confidence)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <motion.div
          className="bg-white w-full max-w-none sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
        >
          {/* Header - Non-shrinking */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Photo Details</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image preview container - Further reduced fixed height on mobile, non-shrinking */}
          <div className="flex-shrink-0 bg-gray-50 p-2 sm:p-4 border-b border-gray-100 h-[40vh] sm:h-auto">
            <div className="relative rounded-lg overflow-hidden bg-gray-100 mx-auto shadow-sm h-full w-full sm:aspect-video">
              <img
                src={normalizedPhoto.url}
                alt="Photo preview"
                className="object-contain w-full h-full"
                onLoad={handleImageLoad}
              />
            </div>
          </div>

          {/* Scrollable Details Area - Takes remaining space */}
          <div className="flex-1 overflow-y-auto">
            {/* Action buttons */}
            <div className="p-3 flex justify-center space-x-4 border-b border-gray-100 flex-shrink-0">
              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Downloading...' : 'Download'}
              </button>
              
              {onShare && (
                <button
                  onClick={handleShare}
                  className="flex items-center px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              )}
            </div>
            
            {/* Tabs - Sticky within this scrollable container */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 grid grid-cols-3">
              {/* Info Tab Button */}
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  "py-3 text-sm font-medium flex items-center justify-center border-b-2 transition-colors",
                  activeTab === 'info'
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                )}
              >
                <Info className="w-4 h-4 mr-1 sm:mr-2" />
                Details
              </button>
              {/* Faces Tab Button */}
               <button
                onClick={() => setActiveTab('faces')}
                className={cn(
                  "py-3 text-sm font-medium flex items-center justify-center border-b-2 transition-colors relative",
                  activeTab === 'faces'
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                )}
              >
                <User className="w-4 h-4 mr-1 sm:mr-2" />
                Analysis
                {normalizedPhoto.faces && normalizedPhoto.faces.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                    {normalizedPhoto.faces.length}
                  </span>
                )}
              </button>
              {/* Matches Tab Button */}
              <button
                onClick={() => setActiveTab('matches')}
                className={cn(
                  "py-3 text-sm font-medium flex items-center justify-center border-b-2 transition-colors relative",
                  activeTab === 'matches'
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                )}
              >
                <Users className="w-4 h-4 mr-1 sm:mr-2" />
                Matches
                {normalizedPhoto.matched_users && normalizedPhoto.matched_users.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                    {normalizedPhoto.matched_users.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'info' && <InfoTabContent />}
              {activeTab === 'faces' && <FacesTabContent />}
              {activeTab === 'matches' && <MatchesTabContent />}
            </div>
          </div> {/* End Scrollable Details Area */}
          
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
