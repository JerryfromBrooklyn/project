import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, AlertCircle, Calendar, Tag, Download, Share2, Building, UserCog, Image, Clock, Sparkles, Eye, Ruler, Smile, Sliders, Glasses, Laugh, Bean as Beard, FileType, HardDrive, Globe, Upload, Users, MapPin, Link } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';

export const PhotoInfoModal = ({ photo, onClose, onShare }) => {
    const [loading, setLoading] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
    const [enhancedPhoto, setEnhancedPhoto] = useState(() => {
        // Initialize with safe defaults for all fields
        return {
            ...photo,
            faces: photo.faces || [],
            matched_users: photo.matched_users || [],
            location: photo.location || { lat: null, lng: null, name: null },
            venue: photo.venue || { id: null, name: null },
            event_details: photo.event_details || { date: null, name: null, type: null, promoter: null },
            tags: photo.tags || []
        };
    });
    
    // Check localStorage for cached face data when the photo is loaded
    useEffect(() => {
        const checkForCachedData = async () => {
            // Only look for cached data if no faces are present
            if (!photo.faces || !Array.isArray(photo.faces) || photo.faces.length === 0) {
                try {
                    // Get current user ID from Supabase
                    const { data: userData } = await PhotoService.getCurrentUser();
                    if (userData && userData.id) {
                        // Look for cached data for this photo
                        const cachedData = PhotoService.getFromLocalStorage(userData.id, photo.id);
                        
                        if (cachedData && cachedData.faces && cachedData.faces.length > 0) {
                            console.log("[PhotoInfoModal] Found cached face data:", cachedData.faces);
                            
                            // Merge the cached data with the current photo
                            setEnhancedPhoto({
                                ...photo,
                                faces: cachedData.faces,
                                face_ids: cachedData.face_ids || [],
                                matched_users: cachedData.matched_users || []
                            });
                            return;
                        }
                    }
                } catch (error) {
                    console.error("[PhotoInfoModal] Error retrieving cached data:", error);
                }
            }
        };
        
        checkForCachedData();
    }, [photo.id]);
    
    // Add extensive logging of incoming photo data
    console.log("[PhotoInfoModal] Full photo data:", JSON.stringify(enhancedPhoto, null, 2));
    console.log("[PhotoInfoModal] Has faces:", Boolean(enhancedPhoto.faces?.length), "Length:", enhancedPhoto.faces?.length);
    console.log("[PhotoInfoModal] Has matched_users:", Boolean(enhancedPhoto.matched_users?.length), "Length:", enhancedPhoto.matched_users?.length);
    console.log("[PhotoInfoModal] Has location:", Boolean(enhancedPhoto.location?.lat && enhancedPhoto.location?.lng));
    console.log("[PhotoInfoModal] Has event_details:", Boolean(enhancedPhoto.event_details));
    
    // Check externalAlbumLink specifically
    console.log("[PhotoInfoModal] DEBUG: externalAlbumLink value:", enhancedPhoto.externalAlbumLink);
    console.log("[PhotoInfoModal] DEBUG: All keys in enhancedPhoto:", Object.keys(enhancedPhoto));
    console.log("[PhotoInfoModal] DEBUG: safeGet result:", safeGet(enhancedPhoto, 'externalAlbumLink', null));
    
    // Check for potential issues with data structure
    if (enhancedPhoto.faces) {
        console.log("[PhotoInfoModal] First face structure:", JSON.stringify(enhancedPhoto.faces[0], null, 2));
        if (enhancedPhoto.faces[0] && !enhancedPhoto.faces[0].attributes) {
            console.error("[PhotoInfoModal] ERROR: Face object exists but has no attributes property");
            console.log("[PhotoInfoModal] Available face properties:", Object.keys(enhancedPhoto.faces[0]));
        }
    }
    
    if (enhancedPhoto.matched_users) {
        console.log("[PhotoInfoModal] First matched user:", JSON.stringify(enhancedPhoto.matched_users[0], null, 2));
    }
    
    if (enhancedPhoto.location) {
        console.log("[PhotoInfoModal] Location data:", JSON.stringify(enhancedPhoto.location, null, 2));
    }

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
            const url = await PhotoService.downloadPhoto(enhancedPhoto.id);
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-${enhancedPhoto.id}.jpg`;
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

    const renderEventDetails = () => {
        const details = [
            {
                icon: _jsx(Calendar, { className: "w-4 h-4" }),
                label: "Event Date",
                value: safeGet(enhancedPhoto, 'event_details.date', null) || 
                      safeGet(enhancedPhoto, 'date_taken', null) || 
                      safeGet(enhancedPhoto, 'created_at', 'Unknown Date')
            },
            {
                icon: _jsx(Sparkles, { className: "w-4 h-4" }),
                label: "Event Name",
                value: safeGet(enhancedPhoto, 'event_details.name', 'Untitled Event')
            },
            {
                icon: _jsx(Building, { className: "w-4 h-4" }),
                label: "Venue",
                value: safeGet(enhancedPhoto, 'venue.name', 'Unknown Venue')
            },
            {
                icon: _jsx(UserCog, { className: "w-4 h-4" }),
                label: "Promoter",
                value: safeGet(enhancedPhoto, 'event_details.promoter', 'Unknown')
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
        
        return (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: "Event Information" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: validDetails.map((detail, index) => {
            const valueDisplay = typeof detail.value === 'string' && detail.value.toLowerCase().includes('unknown')
                ? _jsx("span", { className: "text-gray-400 italic", children: detail.value })
                : detail.value;
                
            return (_jsxs("div", { className: "flex items-center p-2 bg-gray-50 rounded-xl", children: [_jsx("div", { className: "mr-2 text-gray-500", children: detail.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: detail.label }), _jsx("div", { className: "text-xs text-gray-500", children: valueDisplay })] })] }, index));
        }) })] }));
    };

    const renderAlbumLink = () => {
        if (!safeGet(enhancedPhoto, 'externalAlbumLink', null)) {
            return null;
        }

        return (
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Album Link</h4>
                <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex items-center">
                        <Link className="w-5 h-5 text-blue-600 mr-3" />
                        <a 
                            href={enhancedPhoto.externalAlbumLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 font-medium hover:underline flex-1 truncate"
                        >
                            {enhancedPhoto.externalAlbumLink}
                        </a>
                        <button 
                            onClick={() => window.open(enhancedPhoto.externalAlbumLink, '_blank')}
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
                icon: _jsx(Calendar, { className: "w-4 h-4" }),
                label: "Date Taken",
                value: safeGet(enhancedPhoto, 'date_taken', null) || 
                      safeGet(enhancedPhoto, 'created_at', new Date().toLocaleDateString())
            },
            {
                icon: _jsx(FileType, { className: "w-4 h-4" }),
                label: "File Type",
                value: safeGet(enhancedPhoto, 'file_type', null) || 
                      safeGet(enhancedPhoto, 'fileType', 'Unknown')
            },
            {
                icon: _jsx(HardDrive, { className: "w-4 h-4" }),
                label: "File Size",
                value: `${((safeGet(enhancedPhoto, 'file_size', 0) || 
                           safeGet(enhancedPhoto, 'fileSize', 0) || 
                           safeGet(enhancedPhoto, 'size', 0)) / 1024 / 1024).toFixed(2)} MB`
            },
            {
                icon: _jsx(Clock, { className: "w-4 h-4" }),
                label: "Uploaded",
                value: new Date(safeGet(enhancedPhoto, 'created_at', new Date())).toLocaleString()
            },
            {
                icon: _jsx(Image, { className: "w-4 h-4" }),
                label: "Dimensions",
                value: imageSize.width > 0 ? `${imageSize.width} × ${imageSize.height}` : 'Unknown'
            },
            {
                icon: _jsx(Upload, { className: "w-4 h-4" }),
                label: "Uploaded By",
                value: safeGet(enhancedPhoto, 'uploaded_by', null) || 
                      safeGet(enhancedPhoto, 'uploadedBy', 'Unknown')
            }
        ];
        
        if (safeGet(enhancedPhoto, 'location.name', null)) {
            details.push({
                icon: _jsx(Globe, { className: "w-4 h-4" }),
                label: "Location",
                value: enhancedPhoto.location.name
            });
        }
        
        if (safeGet(enhancedPhoto, 'tags', []).length) {
            details.push({
                icon: _jsx(Tag, { className: "w-4 h-4" }),
                label: "Tags",
                value: Array.isArray(enhancedPhoto.tags) ? enhancedPhoto.tags.join(', ') : 'No tags'
            });
        }
        
        // Album link is now handled in its own dedicated section
        
        // Check if GoogleMaps component is available
        let GoogleMapsComponent = null;
        try {
            GoogleMapsComponent = GoogleMaps;
        } catch (error) {
            console.warn('GoogleMaps component not available:', error);
        }
        
        // Only show the map if we have valid coordinates
        const showMap = safeGet(enhancedPhoto, 'location.lat', null) !== null && 
                       safeGet(enhancedPhoto, 'location.lng', null) !== null &&
                       GoogleMapsComponent !== null;
        
        return (_jsxs("div", { className: "mb-6", children: [
            _jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: "Photo Information" }), 
            _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: details.map((detail, index) => {
                const valueDisplay = typeof detail.value === 'string' && detail.value.toLowerCase().includes('unknown')
                    ? _jsx("span", { className: "text-gray-400 italic", children: detail.value })
                    : detail.value;
                    
                return (_jsxs("div", { className: "flex items-center p-2 bg-gray-50 rounded-xl", children: [
                    _jsx("div", { className: "mr-2 text-gray-500", children: detail.icon }), 
                    _jsxs("div", { children: [
                        _jsx("div", { className: "text-sm font-medium text-gray-900", children: detail.label }), 
                        _jsx("div", { className: "text-xs text-gray-500", children: valueDisplay })
                    ] })
                ] }, index));
            }) }), 
            (safeGet(enhancedPhoto, 'location.address', null) || safeGet(enhancedPhoto, 'location.name', null) || showMap) && (_jsxs("div", { className: "mt-4", children: [
                _jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: "Location Details" }), 
                  _jsxs("div", { className: "flex items-center p-3 bg-gray-50 rounded-xl mb-2", children: [
                    _jsx("div", { className: "mr-2 text-gray-500", children: _jsx(Building, { className: "w-4 h-4" }) }),
                    _jsxs("div", { children: [
                      _jsx("div", { className: "text-sm font-medium text-gray-900", children: "Place Name" }),
                      _jsx("div", { className: "text-xs text-gray-500", children: safeGet(enhancedPhoto, 'location.name', 'Unknown Location') })
                    ] })
                  ] }),
                  _jsxs("div", { className: "flex items-center p-3 bg-gray-50 rounded-xl mb-2", children: [
                    _jsx("div", { className: "mr-2 text-gray-500", children: _jsx(MapPin, { className: "w-4 h-4" }) }),
                    _jsxs("div", { children: [
                      _jsx("div", { className: "text-sm font-medium text-gray-900", children: "Address" }),
                      _jsx("div", { className: "text-xs text-gray-500", children: safeGet(enhancedPhoto, 'location.address', 
                        (safeGet(enhancedPhoto, 'location.lat', null) && safeGet(enhancedPhoto, 'location.lng', null)) 
                          ? `${enhancedPhoto.location.lat.toFixed(6)}, ${enhancedPhoto.location.lng.toFixed(6)}`
                          : 'No address available'
                      ) })
                    ] })
                  ] }),
                showMap && (
                  _jsx("div", { className: "h-48 rounded-xl overflow-hidden", children: _jsx(GoogleMapsComponent, { 
                      location: {
                          lat: enhancedPhoto.location.lat,
                          lng: enhancedPhoto.location.lng,
                          name: enhancedPhoto.location.name || ''
                      }, 
                      onLocationChange: () => { }, 
                      height: "100%", 
                      className: "w-full" 
                  }) })
                )
            ] }))
        ] }));
    };

    const renderFaceAttributes = () => {
        console.log("[renderFaceAttributes] Called with photo.faces:", JSON.stringify(enhancedPhoto.faces, null, 2));
        
        // If no faces are detected, return null
        if (!enhancedPhoto.faces || !Array.isArray(enhancedPhoto.faces) || enhancedPhoto.faces.length === 0) {
            console.log("[renderFaceAttributes] No faces found");
            return null;
        }
        
        const face = enhancedPhoto.faces[0];
        console.log("[renderFaceAttributes] Processing face:", JSON.stringify(face, null, 2));
        
        // Check if face object has expected structure and attributes
        if (!face) {
            console.error("[renderFaceAttributes] ERROR: Face is undefined or null");
            return null;
        }
        
        // If the attributes property doesn't exist or is empty, try to extract attributes from the face object directly
        let attributes = face.attributes;
        if (!attributes || Object.keys(attributes).length === 0) {
            console.log("[renderFaceAttributes] No attributes property found or it's empty, trying to extract attributes from the face object directly");
            
            // Try to reconstruct attributes from direct properties if they exist
            const possibleAttributes = ['age', 'gender', 'smile', 'emotions', 'eyeglasses', 'sunglasses', 'eyesOpen', 'mouthOpen',
                                       'AgeRange', 'Gender', 'Smile', 'Emotions', 'Eyeglasses', 'Sunglasses', 'EyesOpen', 'MouthOpen'];
            
            const foundKeys = Object.keys(face).filter(key => possibleAttributes.includes(key));
            console.log("[renderFaceAttributes] Found these attribute keys directly on face object:", foundKeys);
            
            if (foundKeys.length > 0) {
                // Create an attributes object from the direct properties
                attributes = {};
                foundKeys.forEach(key => {
                    attributes[key] = face[key];
                });
                console.log("[renderFaceAttributes] Reconstructed attributes:", attributes);
            } else {
                console.error("[renderFaceAttributes] ERROR: Could not find any attribute properties");
                
                // Provide a simpler face detected view since no attributes are available
                return (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl text-center">
                        <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-blue-600 font-medium">
                            Face Detected
                        </p>
                        <p className="text-blue-500 text-sm mt-1">
                            Face analysis is available, but no detailed attributes were found.
                        </p>
                    </div>
                );
            }
        }
        
        // Log the attributes we'll be using
        console.log("[renderFaceAttributes] Using these attributes:", attributes);
        
        // Normalize attributes to handle both camelCase and PascalCase formats from AWS
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
            // Add quality metrics
            quality: attributes.quality || {
                brightness: attributes.Quality?.Brightness || 0,
                sharpness: attributes.Quality?.Sharpness || 0
            },
            // Add pose information
            pose: attributes.pose || attributes.Pose || null,
            // Add beard and mustache
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
            console.log("[renderFaceAttributes] Using camelCase emotions:", attributes.emotions);
            primaryEmotion = attributes.emotions.reduce((prev, curr) => 
                (curr.confidence > prev.confidence) ? curr : prev, 
                { type: "Neutral", confidence: 0 }
            );
        } else if (attributes.Emotions && Array.isArray(attributes.Emotions)) {
            console.log("[renderFaceAttributes] Using PascalCase Emotions:", attributes.Emotions);
            primaryEmotion = attributes.Emotions.reduce((prev, curr) => 
                (curr.Confidence > prev.confidence) ? {type: curr.Type, confidence: curr.Confidence} : prev, 
                { type: "Neutral", confidence: 0 }
            );
        } else {
            console.warn("[renderFaceAttributes] WARNING: No emotions array found, using default neutral emotion");
        }
        
        console.log("[renderFaceAttributes] Normalized attributes:", normalizedAttrs);
        console.log("[renderFaceAttributes] Primary emotion:", primaryEmotion);
        
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
        console.log("[renderMatchedUsers] Called with matched_users:", JSON.stringify(enhancedPhoto.matched_users, null, 2));
        
        // Ensure matched_users is defined and is an array
        if (!enhancedPhoto.matched_users || !Array.isArray(enhancedPhoto.matched_users) || enhancedPhoto.matched_users.length === 0) {
            console.log("[renderMatchedUsers] No matched users found");
            // Check if there are faces detected but no matches
            const hasFaces = enhancedPhoto.faces && Array.isArray(enhancedPhoto.faces) && enhancedPhoto.faces.length > 0;
            
            return (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl text-center">
                    {hasFaces ? (
                        <>
                            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-blue-600 font-medium">
                                {enhancedPhoto.faces.length} {enhancedPhoto.faces.length === 1 ? "Face" : "Faces"} Detected
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
        
        console.log("[renderMatchedUsers] Processing matched users:", enhancedPhoto.matched_users);
        
        // Ensure each user has required properties, setting defaults if missing
        const validMatchedUsers = enhancedPhoto.matched_users.map((user, index) => {
            console.log(`[renderMatchedUsers] Processing user ${index}:`, JSON.stringify(user, null, 2));
            
            const normalizedUser = {
                userId: user.userId || user.user_id || 'unknown',
                fullName: user.fullName || user.full_name || user.name || user.display_name || user.email || 'Unknown User',
                avatarUrl: user.avatarUrl || user.avatar_url || null,
                confidence: user.confidence || 0
            };
            
            console.log(`[renderMatchedUsers] Normalized user ${index}:`, JSON.stringify(normalizedUser, null, 2));
            return normalizedUser;
        });
        
        console.log("[renderMatchedUsers] Final validMatchedUsers:", validMatchedUsers);
        
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
                                    src={enhancedPhoto.url || enhancedPhoto.public_url}
                                    alt={enhancedPhoto.title || 'Photo'}
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
                            {(enhancedPhoto.title || enhancedPhoto.description) && (
                                <div className="mb-6">
                                    {enhancedPhoto.title && (
                                        <h3 className="text-lg font-medium mb-1">{enhancedPhoto.title}</h3>
                                    )}
                                    {enhancedPhoto.description && (
                                        <p className="text-gray-600 text-sm">{enhancedPhoto.description}</p>
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
                                        onClick={() => onShare(enhancedPhoto.id)}
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