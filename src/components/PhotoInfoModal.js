import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Tag, Info, Download, Share2, Building, Image, Clock, Sparkles, Eye, Ruler, Smile, Glasses, FileType, HardDrive, Upload, Users, User, Heart, AlertCircle } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
// iOS-specific styles
const iOSStyles = `
  @supports (-webkit-touch-callout: none) {
    /* CSS specific to iOS devices */
    .ios-modal-container {
      height: 100% !important;
      max-height: 100% !important;
    }
    
    .ios-image-container {
      height: 40% !important;
      max-height: 40% !important;
    }
    
    .ios-content-container {
      height: 60% !important;
      max-height: 60% !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
  }
`;
export const PhotoInfoModal = ({ photo, onClose, onShare }) => {
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
    console.log('[PhotoInfoModal] Has event_details:', normalizedPhoto.event_details?.name != null || normalizedPhoto.event_details?.date != null ||
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
    const [activeTab, setActiveTab] = useState('info');
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
            const url = await PhotoService.downloadPhoto(normalizedPhoto.id);
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-${normalizedPhoto.id}.jpg`;
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
    const getConfidenceColor = (confidence) => {
        if (confidence >= 90)
            return 'bg-green-500';
        if (confidence >= 70)
            return 'bg-yellow-500';
        return 'bg-orange-500';
    };
    // Safely check if a property exists and has a value
    const hasValue = (obj, key) => {
        if (!obj)
            return false;
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
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Photo Details" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
                                { icon: _jsx(Calendar, { className: "w-4 h-4" }), label: "Date Taken", value: new Date(normalizedPhoto.date_taken || normalizedPhoto.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                { icon: _jsx(FileType, { className: "w-4 h-4" }), label: "File Type", value: normalizedPhoto.fileType },
                                { icon: _jsx(HardDrive, { className: "w-4 h-4" }), label: "File Size", value: `${(normalizedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB` },
                                { icon: _jsx(Image, { className: "w-4 h-4" }), label: "Dimensions", value: `${imageSize.width} × ${imageSize.height}` },
                                { icon: _jsx(Clock, { className: "w-4 h-4" }), label: "Uploaded", value: new Date(normalizedPhoto.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                                { icon: _jsx(Upload, { className: "w-4 h-4" }), label: "Uploaded By", value: normalizedPhoto.uploadedBy || 'Unknown' }
                            ].map((item, index) => (_jsxs("div", { className: "flex items-center p-3 bg-gray-50 rounded-xl", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm", children: item.icon }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: item.label }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: item.value })] })] }, index))) })] }), (hasEventDetails || hasVenueName) && (_jsxs("section", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Event Information" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
                                // Only include items with values
                                hasEventDate && {
                                    icon: _jsx(Calendar, { className: "w-4 h-4" }),
                                    label: "Event Date",
                                    value: normalizedPhoto.event_details.date && normalizedPhoto.event_details.date !== "null"
                                        ? new Date(normalizedPhoto.event_details.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : "Unknown"
                                },
                                hasEventName && {
                                    icon: _jsx(Sparkles, { className: "w-4 h-4" }),
                                    label: "Event Name",
                                    value: normalizedPhoto.event_details.name
                                },
                                hasVenueName && {
                                    icon: _jsx(Building, { className: "w-4 h-4" }),
                                    label: "Venue",
                                    value: normalizedPhoto.venue.name
                                },
                                hasPromoter && {
                                    icon: _jsx(User, { className: "w-4 h-4" }),
                                    label: "Promoter",
                                    value: normalizedPhoto.event_details.promoter
                                }
                            ]
                                .filter(Boolean)
                                .map((item, index) => (item && (_jsxs("div", { className: "flex items-center p-3 bg-gray-50 rounded-xl", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm", children: item.icon }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: item.label }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: item.value })] })] }, index)))) })] })), hasLocation && (_jsxs("section", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Location" }), _jsx("div", { className: "h-60 rounded-xl overflow-hidden shadow-sm", children: _jsx(GoogleMaps, { location: {
                                    lat: normalizedPhoto.location.lat,
                                    lng: normalizedPhoto.location.lng,
                                    name: normalizedPhoto.location.name || ''
                                }, onLocationChange: () => { }, height: "100%", className: "w-full" }) }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: normalizedPhoto.location.name })] })), normalizedPhoto.tags && normalizedPhoto.tags.length > 0 && (_jsxs("section", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2", children: normalizedPhoto.tags.map((tag, index) => (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700", children: [_jsx(Tag, { className: "w-3 h-3 mr-1" }), tag] }, index))) })] })), _jsxs("section", { className: "border-t border-gray-200 pt-4 mt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-500", children: "Debug Information" }), _jsx("span", { className: "text-xs text-gray-400", children: "For development" })] }), _jsxs("div", { className: "bg-gray-50 p-2 rounded-md text-xs font-mono text-gray-600 overflow-x-auto max-h-32 overflow-y-auto", children: [_jsxs("pre", { children: ["ID: ", normalizedPhoto.id] }), normalizedPhoto.faces?.length > 0 && (_jsxs("pre", { children: ["Faces: ", normalizedPhoto.faces.length, " detected"] })), normalizedPhoto.event_details && (_jsxs("pre", { children: ["Event: ", JSON.stringify(normalizedPhoto.event_details, null, 2)] })), normalizedPhoto.venue && (_jsxs("pre", { children: ["Venue: ", JSON.stringify(normalizedPhoto.venue, null, 2)] }))] })] })] }));
    };
    const FacesTabContent = () => {
        console.log("[renderFaceAttributes] Called with photo.faces:", JSON.stringify(normalizedPhoto.faces, null, 2));
        if (!normalizedPhoto.faces || normalizedPhoto.faces.length === 0) {
            console.log("[renderFaceAttributes] No faces found");
            return (_jsxs("div", { className: "py-10 text-center", children: [_jsx("div", { className: "inline-block p-3 rounded-full bg-gray-100 mb-3", children: _jsx(User, { className: "w-6 h-6 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No faces detected" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "This photo doesn't contain any recognized faces" })] }));
        }
        return (_jsx("div", { className: "space-y-6", children: normalizedPhoto.faces.map((face, faceIndex) => {
                console.log(`[renderFaceAttributes] Rendering face ${faceIndex}:`, face);
                if (!face.attributes) {
                    console.log(`[renderFaceAttributes] No attributes for face ${faceIndex}`);
                    return (_jsxs("div", { className: "bg-gray-50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Face #", faceIndex + 1] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Confidence:" }), _jsxs("div", { className: "ml-2 flex items-center", children: [_jsx("div", { className: cn("h-2 w-16 rounded-full bg-gray-200 overflow-hidden"), children: _jsx("div", { className: cn("h-full rounded-full", getConfidenceColor(face.confidence)), style: { width: `${face.confidence}%` } }) }), _jsxs("span", { className: "ml-2 text-xs font-medium", children: [Math.round(face.confidence), "%"] })] })] })] }), _jsxs("div", { className: "text-center py-4", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-orange-400 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-600", children: "Face detected but no attributes available" })] })] }, faceIndex));
                }
                // Ensure attributes exist and have proper structure
                const attributes = face.attributes || {};
                // Get primary emotion (highest confidence) if emotions exist
                const primaryEmotion = attributes.emotions && Array.isArray(attributes.emotions)
                    ? attributes.emotions.reduce((prev, curr) => (curr.confidence > prev.confidence) ? curr : prev, { type: 'neutral', confidence: 0 })
                    : null;
                const hasAge = attributes.age && ((attributes.age.low > 0 || attributes.age.high > 0) ||
                    (typeof attributes.age === 'object' && Object.keys(attributes.age).length > 0));
                const hasGender = attributes.gender && (attributes.gender.value || attributes.gender.confidence > 0);
                const hasSmile = attributes.smile && (typeof attributes.smile.value === 'boolean' || attributes.smile.confidence > 0);
                const hasEmotions = attributes.emotions && Array.isArray(attributes.emotions) && attributes.emotions.length > 0;
                return (_jsxs("div", { className: "bg-gray-50 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Face #", faceIndex + 1] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Confidence:" }), _jsxs("div", { className: "ml-2 flex items-center", children: [_jsx("div", { className: cn("h-2 w-16 rounded-full bg-gray-200 overflow-hidden"), children: _jsx("div", { className: cn("h-full rounded-full", getConfidenceColor(face.confidence)), style: { width: `${face.confidence}%` } }) }), _jsxs("span", { className: "ml-2 text-xs font-medium", children: [Math.round(face.confidence), "%"] })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [hasAge && (_jsxs("div", { className: "flex flex-col p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center", children: _jsx(Ruler, { className: "w-3 h-3 text-blue-500" }) }), _jsx("span", { className: "ml-2 text-xs font-medium text-gray-500", children: "Age Range" })] }), _jsxs("span", { className: "text-sm font-semibold", children: [attributes.age.low, "-", attributes.age.high, " years"] })] })), hasGender && (_jsxs("div", { className: "flex flex-col p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center", children: _jsx(User, { className: "w-3 h-3 text-purple-500" }) }), _jsx("span", { className: "ml-2 text-xs font-medium text-gray-500", children: "Gender" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-sm font-semibold", children: attributes.gender.value }), _jsxs("div", { className: "ml-2 text-xs text-gray-500", children: [Math.round(attributes.gender.confidence), "%"] })] })] })), hasEmotions && primaryEmotion && (_jsxs("div", { className: "flex flex-col p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-yellow-50 flex items-center justify-center", children: _jsx(Heart, { className: "w-3 h-3 text-yellow-500" }) }), _jsx("span", { className: "ml-2 text-xs font-medium text-gray-500", children: "Emotion" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-sm font-semibold capitalize", children: primaryEmotion.type }), _jsxs("div", { className: "ml-2 text-xs text-gray-500", children: [Math.round(primaryEmotion.confidence), "%"] })] })] })), hasSmile && (_jsxs("div", { className: "flex flex-col p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-green-50 flex items-center justify-center", children: _jsx(Smile, { className: "w-3 h-3 text-green-500" }) }), _jsx("span", { className: "ml-2 text-xs font-medium text-gray-500", children: "Expression" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-sm font-semibold", children: attributes.smile.value ? "Smiling" : "Not Smiling" }), _jsxs("div", { className: "ml-2 text-xs text-gray-500", children: [Math.round(attributes.smile.confidence), "%"] })] })] })), attributes.eyesOpen && (_jsxs("div", { className: "flex flex-col p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center", children: _jsx(Eye, { className: "w-3 h-3 text-indigo-500" }) }), _jsx("span", { className: "ml-2 text-xs font-medium text-gray-500", children: "Eyes" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-sm font-semibold", children: attributes.eyesOpen.value ? "Open" : "Closed" }), _jsxs("div", { className: "ml-2 text-xs text-gray-500", children: [Math.round(attributes.eyesOpen.confidence), "%"] })] })] })), (attributes.sunglasses || attributes.eyeglasses) && (_jsxs("div", { className: "flex flex-col p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center", children: _jsx(Glasses, { className: "w-3 h-3 text-teal-500" }) }), _jsx("span", { className: "ml-2 text-xs font-medium text-gray-500", children: "Eyewear" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-sm font-semibold", children: attributes.sunglasses?.value
                                                        ? "Sunglasses"
                                                        : attributes.eyeglasses?.value
                                                            ? "Glasses"
                                                            : "None" }), _jsxs("div", { className: "ml-2 text-xs text-gray-500", children: [Math.round(attributes.sunglasses?.value
                                                            ? attributes.sunglasses.confidence
                                                            : attributes.eyeglasses?.confidence || 0), "%"] })] })] }))] })] }, faceIndex));
            }) }));
    };
    const MatchesTabContent = () => {
        console.log("[renderMatchedUsers] Called with matched_users:", normalizedPhoto.matched_users);
        if (!normalizedPhoto.matched_users || normalizedPhoto.matched_users.length === 0) {
            console.log("[renderMatchedUsers] No matched users found");
            return (_jsxs("div", { className: "py-10 text-center", children: [_jsx("div", { className: "inline-block p-3 rounded-full bg-gray-100 mb-3", children: _jsx(Users, { className: "w-6 h-6 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No matches found" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "There are no recognized users in this photo" })] }));
        }
        return (_jsx("div", { className: "space-y-3", children: normalizedPhoto.matched_users.map((user, index) => (_jsx("div", { className: "bg-white border border-gray-100 rounded-xl p-3 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0", children: user.avatarUrl ? (_jsx("img", { src: user.avatarUrl, alt: user.fullName, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-blue-100 text-blue-500", children: _jsx(User, { className: "w-5 h-5" }) })) }), _jsxs("div", { className: "ml-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: user.fullName }), _jsxs("p", { className: "text-xs text-gray-500", children: ["ID: ", user.userId.substring(0, 8), "..."] })] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Match:" }), _jsx("div", { className: "ml-1 w-12 h-2 rounded-full bg-gray-200 overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full", getConfidenceColor(user.confidence)), style: { width: `${user.confidence}%` } }) }), _jsxs("span", { className: "text-xs font-medium", children: [Math.round(user.confidence), "%"] })] })] }) }, index))) }));
    };
    return (_jsxs(AnimatePresence, { children: [_jsx("style", { children: iOSStyles }), _jsx(motion.div, { className: "fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4", variants: backdropVariants, initial: "hidden", animate: "visible", exit: "hidden", onClick: onClose, children: _jsxs(motion.div, { className: "bg-white w-full max-w-none sm:max-w-3xl max-h-[98vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden ios-modal-container", variants: modalVariants, initial: "hidden", animate: "visible", exit: "exit", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "p-4 border-b border-gray-100 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg sm:text-xl font-semibold text-gray-900", children: "Photo Details" }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500", "aria-label": "Close modal", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "flex flex-col h-[calc(98vh-4rem)] sm:h-auto", children: [_jsx("div", { className: "bg-gray-50 p-2 sm:p-4 border-b border-gray-100 ios-image-container", style: { height: '35vh', maxHeight: '35vh' }, children: _jsx("div", { className: "h-full w-full relative rounded-lg overflow-hidden bg-gray-100 mx-auto shadow-sm", children: _jsx("img", { src: normalizedPhoto.url, alt: "Photo preview", className: "object-contain w-full h-full", onLoad: handleImageLoad }) }) }), _jsxs("div", { className: "flex-1 overflow-y-auto ios-content-container", style: { height: 'calc(98vh - 35vh - 4rem)' }, children: [_jsxs("div", { className: "p-3 flex justify-center space-x-4 border-b border-gray-100", children: [_jsxs("button", { onClick: handleDownload, disabled: loading, className: "flex items-center px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), loading ? 'Downloading...' : 'Download'] }), onShare && (_jsxs("button", { onClick: handleShare, className: "flex items-center px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium", children: [_jsx(Share2, { className: "w-4 h-4 mr-2" }), "Share"] }))] }), _jsxs("div", { className: "sticky top-0 z-10 bg-white border-b border-gray-100 grid grid-cols-3", children: [_jsxs("button", { onClick: () => setActiveTab('info'), className: cn("py-3 text-sm font-medium flex items-center justify-center border-b-2 transition-colors", activeTab === 'info'
                                                        ? "border-blue-500 text-blue-600"
                                                        : "border-transparent text-gray-500 hover:text-gray-900"), children: [_jsx(Info, { className: "w-4 h-4 mr-1 sm:mr-2" }), "Details"] }), _jsxs("button", { onClick: () => setActiveTab('faces'), className: cn("py-3 text-sm font-medium flex items-center justify-center border-b-2 transition-colors relative", activeTab === 'faces'
                                                        ? "border-blue-500 text-blue-600"
                                                        : "border-transparent text-gray-500 hover:text-gray-900"), children: [_jsx(User, { className: "w-4 h-4 mr-1 sm:mr-2" }), "Analysis", normalizedPhoto.faces && normalizedPhoto.faces.length > 0 && (_jsx("span", { className: "ml-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center", children: normalizedPhoto.faces.length }))] }), _jsxs("button", { onClick: () => setActiveTab('matches'), className: cn("py-3 text-sm font-medium flex items-center justify-center border-b-2 transition-colors relative", activeTab === 'matches'
                                                        ? "border-blue-500 text-blue-600"
                                                        : "border-transparent text-gray-500 hover:text-gray-900"), children: [_jsx(Users, { className: "w-4 h-4 mr-1 sm:mr-2" }), "Matches", normalizedPhoto.matched_users && normalizedPhoto.matched_users.length > 0 && (_jsx("span", { className: "ml-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center", children: normalizedPhoto.matched_users.length }))] })] }), _jsxs("div", { className: "p-4", children: [activeTab === 'info' && _jsx(InfoTabContent, {}), activeTab === 'faces' && _jsx(FacesTabContent, {}), activeTab === 'matches' && _jsx(MatchesTabContent, {})] })] })] })] }) })] }));
};
