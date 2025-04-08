import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { usePhotos } from '../hooks/usePhotos';
/**
 * Grid component for displaying photos
 */
const PhotoGrid = () => {
    const { photos, loading, error, selectPhoto } = usePhotos();
    if (loading) {
        return (_jsxs("div", { className: "text-center p-4", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2" }), _jsx("p", { children: "Loading photos..." })] }));
    }
    if (error) {
        return (_jsx("div", { className: "text-center p-4 bg-red-50 text-red-600 rounded-lg", children: error }));
    }
    if (!photos || photos.length === 0) {
        return (_jsx("div", { className: "text-center p-4 bg-gray-100 rounded-lg", children: "No photos uploaded yet" }));
    }
    /**
     * Format a date string for display
     */
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString();
        }
        catch {
            return 'Unknown date';
        }
    };
    return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: photos.map(photo => (_jsxs("div", { className: "border rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow", onClick: () => selectPhoto(photo), children: [_jsxs("div", { className: "aspect-square w-full relative bg-gray-100", children: [_jsx("img", { src: photo.public_url || photo.url, alt: photo.title || "User uploaded photo", className: "w-full h-full object-cover", loading: "lazy" }), photo.event_details?.name && (_jsxs("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3", children: [_jsx("p", { className: "text-white text-sm font-medium truncate", children: photo.event_details.name }), photo.venue?.name && (_jsx("p", { className: "text-white/80 text-xs truncate", children: photo.venue.name }))] }))] }), _jsxs("div", { className: "p-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "text-xs text-gray-500", children: formatDate(photo.created_at) }), photo.faces && photo.faces.length > 0 && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: [photo.faces.length, " ", photo.faces.length === 1 ? 'Face' : 'Faces'] }))] }), photo.matched_users && photo.matched_users.length > 0 && (_jsx("div", { className: "mt-2", children: _jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [photo.matched_users.length, " ", photo.matched_users.length === 1 ? 'Match' : 'Matches'] }) }))] })] }, photo.id))) }));
};
export default PhotoGrid;
