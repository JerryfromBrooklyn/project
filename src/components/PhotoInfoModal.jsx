import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, AlertCircle, Calendar, Tag, Download, Share2, Building, UserCog, Image, Clock, Sparkles, Eye, Ruler, Smile, Sliders, Glasses, Laugh, Bean as Beard, FileType, HardDrive, Globe, Upload, Users, MapPin, Link, Camera, ColorSwatch, ZoomIn, FileImage, LayoutGrid, Binary, Database } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';

export const PhotoInfoModal = ({ photo, onClose, onShare }) => {
    const [loading, setLoading] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
    
    // Add simple debug log of incoming photo data
    console.log("[PhotoInfoModal] Received photo data:", photo?.id);
    
    const handleImageLoad = (e) => {
        const img = e.target;
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
        }
        catch (error) {
            console.error('Error downloading photo:', error);
        }
        finally {
            setLoading(false);
        }
    };

    // Function to safely get fields with proper fallbacks
    const safeGet = (obj, path, defaultVal) => {
        try {
            const parts = path.split('.');
            let result = obj;
            for (const part of parts) {
                if (result == null) return defaultVal;
                result = result[part];
            }
            return result == null ? defaultVal : result;
        } catch (e) {
            return defaultVal;
        }
    };

    // Render image analysis data directly from the provided data
    const renderImageAnalysis = () => {
        // Image analysis data can be at the top level or in faces[0] if it's face-specific
        const imageLabels = photo.imageLabels || (photo.faces?.[0]?.imageLabels) || [];
        const imageProperties = photo.imageProperties || (photo.faces?.[0]?.imageProperties) || null;
        const topLabels = photo.topLabels || (photo.faces?.[0]?.topLabels) || [];
        const dominantColors = photo.dominantColors || (photo.faces?.[0]?.dominantColors) || [];
        const imageQuality = photo.imageQuality || (photo.faces?.[0]?.imageQuality) || null;
        
        // If no image analysis data is available, return null
        if (!imageLabels.length && !imageProperties && !topLabels.length && !dominantColors.length && !imageQuality) {
            return null;
        }
        
        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Image Analysis</h4>
                
                {/* Display top labels if available */}
                {topLabels.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">Content Labels</h5>
                        <div className="flex flex-wrap gap-2">
                            {topLabels.map((label, index) => (
                                <span 
                                    key={index} 
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Display dominant colors if available */}
                {dominantColors.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">Dominant Colors</h5>
                        <div className="flex flex-wrap gap-2">
                            {dominantColors.slice(0, 5).map((color, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center bg-white rounded-lg p-2 shadow-sm"
                                >
                                    <div 
                                        className="w-6 h-6 rounded-full mr-2" 
                                        style={{ backgroundColor: color }}
                                    ></div>
                                    <span className="text-xs font-mono">{color}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Display image quality if available */}
                {imageQuality && (
                    <div className="mb-4 grid grid-cols-3 gap-2">
                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-1">
                                <ZoomIn className="w-4 h-4 text-gray-500 mr-1" />
                                <span className="text-xs font-medium text-gray-600">Sharpness</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${(imageQuality.sharpness || 0) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-right mt-1">
                                {Math.round((imageQuality.sharpness || 0) * 100)}%
                            </span>
                        </div>
                        
                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-1">
                                <Image className="w-4 h-4 text-gray-500 mr-1" />
                                <span className="text-xs font-medium text-gray-600">Brightness</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-yellow-500 rounded-full" 
                                    style={{ width: `${(imageQuality.brightness || 0) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-right mt-1">
                                {Math.round((imageQuality.brightness || 0) * 100)}%
                            </span>
                        </div>
                        
                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-1">
                                <Sliders className="w-4 h-4 text-gray-500 mr-1" />
                                <span className="text-xs font-medium text-gray-600">Contrast</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-purple-500 rounded-full" 
                                    style={{ width: `${(imageQuality.contrast || 0) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-right mt-1">
                                {Math.round((imageQuality.contrast || 0) * 100)}%
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Display detailed labels if available */}
                {imageLabels.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                            <FileImage className="w-4 h-4 mr-1" />
                            Detailed Labels {imageLabels.length > 10 && `(showing top 10 of ${imageLabels.length})`}
                        </h5>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="text-gray-500 border-b">
                                    <tr>
                                        <th className="text-left py-1 font-medium">Label</th>
                                        <th className="text-right py-1 font-medium">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {imageLabels.slice(0, 10).map((label, index) => (
                                        <tr key={index} className="border-b border-gray-100">
                                            <td className="py-1.5">{label.Name}</td>
                                            <td className="text-right py-1.5">{label.Confidence?.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/* Data source info */}
                <div className="text-xs text-gray-400 italic text-center">
                    Analysis powered by AWS Rekognition
                </div>
            </div>
        );
    };

    const renderEventDetails = () => {
        const details = [
            {
                icon: <Calendar className="w-4 h-4" />,
                label: "Event Date",
                value: safeGet(photo, 'event_details.date', null) || 
                      safeGet(photo, 'date_taken', null) || 
                      safeGet(photo, 'created_at', 'Unknown Date')
            },
            {
                icon: <Sparkles className="w-4 h-4" />,
                label: "Event Name",
                value: safeGet(photo, 'event_details.name', 'Untitled Event')
            },
            {
                icon: <Building className="w-4 h-4" />,
                label: "Venue",
                value: safeGet(photo, 'venue.name', 'Unknown Venue')
            },
            {
                icon: <UserCog className="w-4 h-4" />,
                label: "Promoter",
                value: safeGet(photo, 'event_details.promoter', 'Unknown')
            }
        ];
        
        // Only show details that have valid values
        const validDetails = details.filter(detail => {
            if (typeof detail.value === 'string' && detail.value.includes('Unknown')) {
                // Keep "Unknown" values if we don't have anything better
                return true;
            }
            return detail.value != null;
        });
        
        if (validDetails.length === 0) return null;
        
        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Event Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {validDetails.map((detail, index) => {
                        const valueDisplay = typeof detail.value === 'string' && detail.value.toLowerCase().includes('unknown')
                            ? <span className="text-gray-400 italic">{detail.value}</span>
                            : detail.value;
                            
                        return (
                            <div className="flex items-center p-2 bg-gray-50 rounded-xl" key={index}>
                                <div className="mr-2 text-gray-500">{detail.icon}</div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{detail.label}</div>
                                    <div className="text-xs text-gray-500">{valueDisplay}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderAlbumLink = () => {
        if (!safeGet(photo, 'externalAlbumLink', null)) {
            return null;
        }

        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Album Link</h4>
                <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex items-center">
                        <Link className="w-5 h-5 text-blue-600 mr-3" />
                        <a 
                            href={photo.externalAlbumLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 font-medium hover:underline flex-1 truncate"
                        >
                            {photo.externalAlbumLink}
                        </a>
                        <button 
                            onClick={() => window.open(photo.externalAlbumLink, '_blank')}
                            className="ml-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Visit
                        </button>
                    </div>
                    <p className="text-blue-700 text-xs mt-2">
                        Click to open the album in a new tab
                    </p>
                </div>
            </div>
        );
    };

    const renderPhotoDetails = () => {
        const details = [
            {
                icon: <Calendar className="w-4 h-4" />,
                label: "Date Taken",
                value: safeGet(photo, 'date_taken', null) || 
                      safeGet(photo, 'created_at', new Date().toLocaleDateString())
            },
            {
                icon: <FileType className="w-4 h-4" />,
                label: "File Type",
                value: safeGet(photo, 'file_type', null) || 
                      safeGet(photo, 'fileType', 'Unknown')
            },
            {
                icon: <HardDrive className="w-4 h-4" />,
                label: "File Size",
                value: `${((safeGet(photo, 'file_size', 0) || 
                           safeGet(photo, 'fileSize', 0) || 
                           safeGet(photo, 'size', 0)) / 1024 / 1024).toFixed(2)} MB`
            },
            {
                icon: <Clock className="w-4 h-4" />,
                label: "Uploaded",
                value: new Date(safeGet(photo, 'created_at', new Date())).toLocaleString()
            },
            {
                icon: <Image className="w-4 h-4" />,
                label: "Dimensions",
                value: imageSize.width > 0 ? `${imageSize.width} × ${imageSize.height}` : 'Unknown'
            },
            {
                icon: <Upload className="w-4 h-4" />,
                label: "Uploaded By",
                value: safeGet(photo, 'uploaded_by', null) || 
                      safeGet(photo, 'uploadedBy', 'Unknown')
            }
        ];
        
        if (safeGet(photo, 'location.name', null)) {
            details.push({
                icon: <Globe className="w-4 h-4" />,
                label: "Location",
                value: photo.location.name
            });
        }
        
        if (safeGet(photo, 'tags', []).length) {
            details.push({
                icon: <Tag className="w-4 h-4" />,
                label: "Tags",
                value: Array.isArray(photo.tags) ? photo.tags.join(', ') : 'No tags'
            });
        }
        
        // Check if GoogleMaps component is available
        let GoogleMapsComponent = null;
        try {
            GoogleMapsComponent = GoogleMaps;
        } catch (error) {
            console.warn('GoogleMaps component not available:', error);
        }
        
        // Only show the map if we have valid coordinates
        const showMap = safeGet(photo, 'location.lat', null) !== null && 
                       safeGet(photo, 'location.lng', null) !== null &&
                       GoogleMapsComponent !== null;
        
        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Photo Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {details.map((detail, index) => {
                        const valueDisplay = typeof detail.value === 'string' && detail.value.toLowerCase().includes('unknown')
                            ? <span className="text-gray-400 italic">{detail.value}</span>
                            : detail.value;
                            
                        return (
                            <div className="flex items-center p-2 bg-gray-50 rounded-xl" key={index}>
                                <div className="mr-2 text-gray-500">{detail.icon}</div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{detail.label}</div>
                                    <div className="text-xs text-gray-500">{valueDisplay}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {renderImageAnalysis()}
                
                {(safeGet(photo, 'location.address', null) || safeGet(photo, 'location.name', null) || showMap) && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Location Details</h4>
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl mb-2">
                            <div className="mr-2 text-gray-500"><Building className="w-4 h-4" /></div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Place Name</div>
                                <div className="text-xs text-gray-500">{safeGet(photo, 'location.name', 'Unknown Location')}</div>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl mb-2">
                            <div className="mr-2 text-gray-500"><MapPin className="w-4 h-4" /></div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Address</div>
                                <div className="text-xs text-gray-500">{safeGet(photo, 'location.address', 
                                    (safeGet(photo, 'location.lat', null) && safeGet(photo, 'location.lng', null)) 
                                      ? `${photo.location.lat.toFixed(6)}, ${photo.location.lng.toFixed(6)}`
                                      : 'No address available'
                                )}</div>
                            </div>
                        </div>
                        {showMap && (
                          <div className="h-48 rounded-xl overflow-hidden">
                              <GoogleMapsComponent 
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
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderFaceAttributes = () => {
        // If no faces are detected, return null
        if (!photo.faces || !Array.isArray(photo.faces) || photo.faces.length === 0) {
            return null;
        }
        
        const face = photo.faces[0];
        
        // If the face object is undefined or null, return null
        if (!face) {
            return null;
        }
        
        // Look for attributes in the standard place
        const attributes = face.attributes || {};
        
        // Normalize attributes
        const normalizedAttrs = {
            age: attributes.age || {
                low: attributes.AgeRange?.Low || 0,
                high: attributes.AgeRange?.High || 0
            },
            gender: attributes.gender || {
                value: attributes.Gender?.Value || '',
                confidence: attributes.Gender?.Confidence || 0
            },
            smile: attributes.smile || {
                value: attributes.Smile?.Value || false,
                confidence: attributes.Smile?.Confidence || 0
            },
            eyeglasses: attributes.eyeglasses || {
                value: attributes.Eyeglasses?.Value || false,
                confidence: attributes.Eyeglasses?.Confidence || 0
            },
            sunglasses: attributes.sunglasses || {
                value: attributes.Sunglasses?.Value || false,
                confidence: attributes.Sunglasses?.Confidence || 0
            },
            eyesOpen: attributes.eyesOpen || {
                value: attributes.EyesOpen?.Value || false,
                confidence: attributes.EyesOpen?.Confidence || 0
            },
            mouthOpen: attributes.mouthOpen || {
                value: attributes.MouthOpen?.Value || false,
                confidence: attributes.MouthOpen?.Confidence || 0
            },
            quality: attributes.quality || {
                brightness: attributes.Quality?.Brightness || 0,
                sharpness: attributes.Quality?.Sharpness || 0
            },
            pose: attributes.pose || attributes.Pose || null,
            beard: attributes.beard || {
                value: attributes.Beard?.Value || false,
                confidence: attributes.Beard?.Confidence || 0
            },
            mustache: attributes.mustache || {
                value: attributes.Mustache?.Value || false,
                confidence: attributes.Mustache?.Confidence || 0
            }
        };
        
        // Get primary emotion (highest confidence)
        let primaryEmotion = { type: "Neutral", confidence: 0 };
        if (attributes.emotions && Array.isArray(attributes.emotions) && attributes.emotions.length > 0) {
            primaryEmotion = attributes.emotions.reduce((prev, curr) => 
                (curr.confidence > prev.confidence) ? curr : prev, 
                { type: "Neutral", confidence: 0 }
            );
        } else if (attributes.Emotions && Array.isArray(attributes.Emotions)) {
            primaryEmotion = attributes.Emotions.reduce((prev, curr) => 
                (curr.Confidence > prev.confidence) ? {type: curr.Type, confidence: curr.Confidence} : prev, 
                { type: "Neutral", confidence: 0 }
            );
        }
        
        // Display these attributes in a nice UI
        const details = [
            {
                icon: <User className="w-4 h-4" />,
                label: "Age Range",
                value: `${normalizedAttrs.age?.low || 'Unknown'} - ${normalizedAttrs.age?.high || 'Unknown'}`
            },
            {
                icon: <AlertCircle className="w-4 h-4" />,
                label: "Gender",
                value: normalizedAttrs.gender?.value || 'Unknown',
                confidence: normalizedAttrs.gender?.confidence
            },
            {
                icon: <Smile className="w-4 h-4" />,
                label: "Expression",
                value: primaryEmotion?.type || 'Unknown',
                confidence: primaryEmotion?.confidence
            },
            {
                icon: <Laugh className="w-4 h-4" />,
                label: "Smiling",
                value: normalizedAttrs.smile?.value ? 'Yes' : 'No',
                confidence: normalizedAttrs.smile?.confidence
            },
            {
                icon: <Glasses className="w-4 h-4" />,
                label: "Glasses",
                value: normalizedAttrs.eyeglasses?.value ? 'Yes' : 'No',
                confidence: normalizedAttrs.eyeglasses?.confidence
            },
            {
                icon: <Eye className="w-4 h-4" />,
                label: "Eyes Open",
                value: normalizedAttrs.eyesOpen?.value ? 'Yes' : 'No',
                confidence: normalizedAttrs.eyesOpen?.confidence
            },
            {
                icon: <Eye className="w-4 h-4" />,
                label: "Mouth Open",
                value: normalizedAttrs.mouthOpen?.value ? 'Yes' : 'No',
                confidence: normalizedAttrs.mouthOpen?.confidence
            }
        ];
        
        // Only add beard if found in attributes
        if (normalizedAttrs.beard && (normalizedAttrs.beard.value || (attributes.beard?.value || attributes.Beard?.Value))) {
            details.push({
                icon: <Beard className="w-4 h-4" />,
                label: "Beard",
                value: 'Yes',
                confidence: normalizedAttrs.beard.confidence
            });
        }

        // Only add mustache if found in attributes
        if (normalizedAttrs.mustache && (normalizedAttrs.mustache.value || (attributes.mustache?.value || attributes.Mustache?.Value))) {
            details.push({
                icon: <Beard className="w-4 h-4" />,
                label: "Mustache",
                value: 'Yes',
                confidence: normalizedAttrs.mustache.confidence
            });
        }

        // Add sunglasses if present
        if (normalizedAttrs.sunglasses && normalizedAttrs.sunglasses.value) {
            details.push({
                icon: <Glasses className="w-4 h-4" />,
                label: "Sunglasses",
                value: 'Yes',
                confidence: normalizedAttrs.sunglasses.confidence
            });
        }

        // Add image quality if available
        if (normalizedAttrs.quality && (normalizedAttrs.quality.brightness > 0 || normalizedAttrs.quality.sharpness > 0)) {
            details.push({
                icon: <Sliders className="w-4 h-4" />,
                label: "Image Quality",
                value: `Brightness: ${Math.round(normalizedAttrs.quality.brightness * 100)}%, Sharpness: ${Math.round(normalizedAttrs.quality.sharpness * 100)}%`
            });
        }
        
        // Add pose information if available
        if (normalizedAttrs.pose) {
            const pose = normalizedAttrs.pose;
            const poseString = [
                pose.Roll ? `Roll: ${Math.round(pose.Roll)}°` : '',
                pose.Yaw ? `Yaw: ${Math.round(pose.Yaw)}°` : '',
                pose.Pitch ? `Pitch: ${Math.round(pose.Pitch)}°` : ''
            ].filter(Boolean).join(', ');
            
            if (poseString) {
                details.push({
                    icon: <Ruler className="w-4 h-4" />,
                    label: "Head Pose",
                    value: poseString
                });
            }
        }
        
        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Face Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {details.map((detail, index) => (
                        <div key={index} className="flex items-center p-2 bg-gray-50 rounded-xl">
                            <div className="mr-2 text-gray-500">
                                {detail.icon}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">{detail.label}</div>
                                <div className="text-xs text-gray-500">
                                    {detail.value}
                                    {detail.confidence && detail.confidence > 0 && (
                                        <span className="text-gray-400 ml-1">{Math.round(detail.confidence)}% confident</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMatchedUsers = () => {
        // Ensure matched_users is defined and is an array
        if (!photo.matched_users || !Array.isArray(photo.matched_users) || photo.matched_users.length === 0) {
            // Check if there are faces detected but no matches
            const hasFaces = photo.faces && Array.isArray(photo.faces) && photo.faces.length > 0;
            
            return (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl text-center">
                    {hasFaces ? (
                        <>
                            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-blue-600 font-medium">
                                {photo.faces.length} {photo.faces.length === 1 ? "Face" : "Faces"} Detected
                            </p>
                            <p className="text-blue-500 text-sm mt-1">
                                No matches found with registered users
                            </p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 font-medium">No Matches Found</p>
                            <p className="text-gray-500 text-sm mt-1">
                                No registered faces were detected in this photo
                            </p>
                        </>
                    )}
                </div>
            );
        }
        
        // Ensure each user has required properties, setting defaults if missing
        const validMatchedUsers = photo.matched_users.map((user, index) => {
            const normalizedUser = {
                userId: user.userId || user.user_id || 'unknown',
                fullName: user.fullName || user.full_name || user.name || user.display_name || user.email || 'Unknown User',
                avatarUrl: user.avatarUrl || user.avatar_url || null,
                confidence: user.confidence || 0
            };
            
            return normalizedUser;
        });
        
        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Matched People ({validMatchedUsers.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {validMatchedUsers.map((user) => (
                        <div
                            key={user.userId}
                            className="flex items-center gap-2 p-2 rounded-xl bg-gray-50"
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.fullName}
                                    className="w-8 h-8 rounded-full"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-medium">{user.fullName}</div>
                                <div className="text-xs text-gray-500">
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
                className="relative w-full max-w-5xl bg-white rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row h-[85vh]">
                    {/* Left side - Image */}
                    <div className="w-full md:w-3/5 h-full relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="relative w-full h-full">
                                <img
                                    src={photo.url || photo.public_url}
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
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
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
                                    className="absolute top-2 right-2 p-2 rounded-full bg-white hover:bg-gray-100 text-gray-500 transition-colors"
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
                                        <p className="text-gray-600 text-sm">{photo.description}</p>
                                    )}
                                </div>
                            )}

                            {/* Matched Users (Shown first since it's most important) */}
                            {renderMatchedUsers()}
                            
                            {/* Face Analysis */}
                            {renderFaceAttributes()}

                            {/* Event Details */}
                            {renderEventDetails()}

                            {/* Album Link */}
                            {renderAlbumLink()}

                            {/* Photo Details */}
                            {renderPhotoDetails()}
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 border-t border-gray-200 bg-white">
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