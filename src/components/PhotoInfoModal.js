import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { motion } from 'framer-motion';
import { X, User, AlertCircle, Calendar, Tag, Download, Share2, Building, UserCog, Image, Clock, Sparkles, Eye, Ruler, Smile, Sliders, Glasses, Laugh, Bean as Beard, FileType, HardDrive, Globe, Upload } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
export const PhotoInfoModal = ({ photo, onClose, onShare }) => {
    const [loading, setLoading] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
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
    const renderEventDetails = () => {
        if (!photo.event_details)
            return null;
        const details = [
            {
                icon: _jsx(Calendar, { className: "w-4 h-4" }),
                label: "Event Date",
                value: new Date(photo.event_details.date || photo.date_taken || photo.created_at).toLocaleDateString()
            },
            {
                icon: _jsx(Sparkles, { className: "w-4 h-4" }),
                label: "Event Name",
                value: photo.event_details.name || 'Untitled Event'
            },
            {
                icon: _jsx(Building, { className: "w-4 h-4" }),
                label: "Venue",
                value: photo.venue?.name || 'Unknown Venue'
            },
            {
                icon: _jsx(UserCog, { className: "w-4 h-4" }),
                label: "Promoter",
                value: photo.event_details.promoter || 'Unknown'
            }
        ];
        return (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-apple-gray-700 mb-2", children: "Event Information" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: details.map((detail, index) => (_jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx("div", { className: "mr-2 text-apple-gray-500", children: detail.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-apple-gray-900", children: detail.label }), _jsx("div", { className: "text-xs text-apple-gray-500", children: detail.value })] })] }, index))) })] }));
    };
    const renderPhotoDetails = () => {
        const details = [
            {
                icon: _jsx(Calendar, { className: "w-4 h-4" }),
                label: "Date Taken",
                value: new Date(photo.date_taken || photo.created_at).toLocaleDateString()
            },
            {
                icon: _jsx(FileType, { className: "w-4 h-4" }),
                label: "File Type",
                value: photo.fileType
            },
            {
                icon: _jsx(HardDrive, { className: "w-4 h-4" }),
                label: "File Size",
                value: `${(photo.fileSize / 1024 / 1024).toFixed(2)} MB`
            },
            {
                icon: _jsx(Clock, { className: "w-4 h-4" }),
                label: "Uploaded",
                value: new Date(photo.created_at).toLocaleString()
            },
            {
                icon: _jsx(Image, { className: "w-4 h-4" }),
                label: "Dimensions",
                value: `${imageSize.width} × ${imageSize.height}`
            },
            {
                icon: _jsx(Upload, { className: "w-4 h-4" }),
                label: "Uploaded By",
                value: photo.uploadedBy || 'Unknown'
            }
        ];
        if (photo.location?.name) {
            details.push({
                icon: _jsx(Globe, { className: "w-4 h-4" }),
                label: "Location",
                value: photo.location.name
            });
        }
        if (photo.tags?.length) {
            details.push({
                icon: _jsx(Tag, { className: "w-4 h-4" }),
                label: "Tags",
                value: photo.tags.join(', ')
            });
        }
        return (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-apple-gray-700 mb-2", children: "Photo Information" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: details.map((detail, index) => (_jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx("div", { className: "mr-2 text-apple-gray-500", children: detail.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-apple-gray-900", children: detail.label }), _jsx("div", { className: "text-xs text-apple-gray-500", children: detail.value })] })] }, index))) }), photo.location?.lat && photo.location?.lng && (_jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "text-sm font-medium text-apple-gray-700 mb-2", children: "Location" }), _jsx("div", { className: "h-48 rounded-apple overflow-hidden", children: _jsx(GoogleMaps, { location: {
                                    lat: photo.location.lat,
                                    lng: photo.location.lng,
                                    name: photo.location.name || ''
                                }, onLocationChange: () => { }, height: "100%", className: "w-full" }) })] }))] }));
    };
    const renderFaceAttributes = () => {
        if (!photo.faces?.length)
            return null;
        const face = photo.faces[0];
        if (!face.attributes)
            return null;
        // Get primary emotion (highest confidence)
        const primaryEmotion = face.attributes.emotions?.reduce((prev, curr) => (curr.confidence > prev.confidence) ? curr : prev);
        const attributes = [
            {
                icon: _jsx(Smile, { className: "w-4 h-4" }),
                label: "Expression",
                value: face.attributes.smile?.value ? "Smiling" : "Not Smiling",
                confidence: face.attributes.smile?.confidence
            },
            {
                icon: _jsx(Eye, { className: "w-4 h-4" }),
                label: "Eyes",
                value: face.attributes.eyesOpen?.value ? "Open" : "Closed",
                confidence: face.attributes.eyesOpen?.confidence
            },
            {
                icon: _jsx(Glasses, { className: "w-4 h-4" }),
                label: "Eyewear",
                value: face.attributes.sunglasses?.value ? "Sunglasses" :
                    face.attributes.eyeglasses?.value ? "Glasses" : "None",
                confidence: face.attributes.sunglasses?.value ?
                    face.attributes.sunglasses?.confidence :
                    face.attributes.eyeglasses?.confidence
            },
            {
                icon: _jsx(Ruler, { className: "w-4 h-4" }),
                label: "Age Range",
                value: `${face.attributes.age?.low}-${face.attributes.age?.high} years`,
                confidence: 100
            },
            {
                icon: _jsx(User, { className: "w-4 h-4" }),
                label: "Gender",
                value: face.attributes.gender?.value,
                confidence: face.attributes.gender?.confidence
            },
            {
                icon: _jsx(Laugh, { className: "w-4 h-4" }),
                label: "Emotion",
                value: primaryEmotion?.type || "Neutral",
                confidence: primaryEmotion?.confidence
            },
            {
                icon: _jsx(Beard, { className: "w-4 h-4" }),
                label: "Facial Hair",
                value: face.attributes.beard?.value ? "Beard" :
                    face.attributes.mustache?.value ? "Mustache" : "None",
                confidence: face.attributes.beard?.value ?
                    face.attributes.beard?.confidence :
                    face.attributes.mustache?.confidence
            },
            {
                icon: _jsx(Sliders, { className: "w-4 h-4" }),
                label: "Quality",
                value: `${Math.round(face.attributes.quality?.brightness || 0)}% Brightness, ${Math.round(face.attributes.quality?.sharpness || 0)}% Sharpness`,
                confidence: 100
            }
        ];
        return (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-apple-gray-700 mb-2", children: "Face Analysis" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: attributes.map((attr, index) => (_jsxs("div", { className: "flex items-center p-2 bg-apple-gray-50 rounded-apple", children: [_jsx("div", { className: "mr-2 text-apple-gray-500", children: attr.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-apple-gray-900", children: attr.label }), _jsxs("div", { className: "text-xs text-apple-gray-500", children: [attr.value, " (", Math.round(attr.confidence || 0), "% confidence)"] })] })] }, index))) })] }));
    };
    const renderMatchedUsers = () => {
        if (!photo.matched_users?.length) {
            return (_jsxs("div", { className: "mb-6 p-4 bg-apple-gray-50 rounded-apple text-center", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-apple-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-apple-gray-600 font-medium", children: "No Matches Found" }), _jsx("p", { className: "text-apple-gray-500 text-sm mt-1", children: "No registered faces were detected in this photo" })] }));
        }
        return (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-apple-gray-700 mb-2", children: "Matched People" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: photo.matched_users.map((user) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-apple bg-apple-gray-50", children: [user.avatarUrl ? (_jsx("img", { src: user.avatarUrl, alt: user.fullName, className: "w-8 h-8 rounded-full" })) : (_jsx("div", { className: "w-8 h-8 rounded-full bg-apple-blue-100 text-apple-blue-500 flex items-center justify-center", children: _jsx(User, { className: "w-4 h-4" }) })), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: user.fullName }), _jsxs("div", { className: "text-xs text-apple-gray-500", children: [Math.round(user.confidence), "% match"] })] })] }, user.userId))) })] }));
    };
    return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4", onClick: onClose, children: _jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "relative w-full max-w-5xl bg-white rounded-apple-2xl overflow-hidden", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "flex flex-col md:flex-row h-[85vh]", children: [_jsx("div", { className: "w-full md:w-3/5 h-full relative", children: _jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-apple-gray-100", children: _jsxs("div", { className: "relative w-full h-full", children: [_jsx("img", { src: photo.url, alt: photo.title || 'Photo', className: cn("absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2", "max-w-[95%] max-h-[95%] w-auto h-auto object-contain", !imageLoaded && "opacity-0"), onLoad: handleImageLoad }), !imageLoaded && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-apple-gray-900" }) }))] }) }) }), _jsxs("div", { className: "w-full md:w-2/5 h-full flex flex-col", children: [_jsxs("div", { className: "p-6 flex-1 overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Photo Details" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 p-2 rounded-full bg-apple-white hover:bg-apple-gray-100 text-apple-gray-500 transition-colors", "aria-label": "Close modal", children: _jsx(X, { className: "w-5 h-5" }) })] }), (photo.title || photo.description) && (_jsxs("div", { className: "mb-6", children: [photo.title && (_jsx("h3", { className: "text-lg font-medium mb-1", children: photo.title })), photo.description && (_jsx("p", { className: "text-apple-gray-600 text-sm", children: photo.description }))] })), renderFaceAttributes(), renderEventDetails(), renderPhotoDetails(), renderMatchedUsers()] }), _jsx("div", { className: "p-4 border-t border-apple-gray-200 bg-white", children: _jsxs("div", { className: "flex justify-end gap-3", children: [_jsxs("button", { onClick: handleDownload, disabled: loading, className: "ios-button-secondary flex items-center", children: [_jsx(Download, { className: "w-5 h-5 mr-2" }), "Download"] }), onShare && (_jsxs("button", { onClick: () => onShare(photo.id), className: "ios-button-primary flex items-center", children: [_jsx(Share2, { className: "w-5 h-5 mr-2" }), "Share"] }))] }) })] })] }) }) }));
};
