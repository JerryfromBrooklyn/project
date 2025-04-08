import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
const LocalStorageDebugPanel = ({ userId }) => {
    const [localStoragePhotos, setLocalStoragePhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    useEffect(() => {
        if (!userId) {
            setLocalStoragePhotos([]);
            setLoading(false);
            return;
        }
        loadLocalStorageData();
    }, [userId]);
    const loadLocalStorageData = () => {
        try {
            setLoading(true);
            // Get the list of photo IDs for this user
            const userPhotosKey = `user_photos_${userId}`;
            const photoIds = JSON.parse(localStorage.getItem(userPhotosKey) || '[]');
            console.log(`[LocalStorageDebug] Found ${photoIds.length} photo IDs in localStorage for user ${userId}`);
            // Load metadata for each photo
            const photos = [];
            for (const photoId of photoIds) {
                const storageKey = `photo_metadata_${photoId}`;
                const metadataStr = localStorage.getItem(storageKey);
                if (metadataStr) {
                    try {
                        const metadata = JSON.parse(metadataStr);
                        photos.push(metadata);
                    }
                    catch (err) {
                        console.error(`[LocalStorageDebug] Error parsing metadata for photo ${photoId}:`, err);
                    }
                }
            }
            setLocalStoragePhotos(photos);
            console.log(`[LocalStorageDebug] Loaded ${photos.length} photos from localStorage`);
        }
        catch (err) {
            console.error('[LocalStorageDebug] Error loading localStorage data:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const exportAllPhotosMetadata = () => {
        try {
            const dataStr = JSON.stringify(localStoragePhotos, null, 2);
            const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
            const exportFileName = `photo_metadata_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            linkElement.click();
            console.log(`[LocalStorageDebug] Exported ${localStoragePhotos.length} photos to ${exportFileName}`);
        }
        catch (err) {
            console.error('[LocalStorageDebug] Error exporting photos:', err);
            alert('Failed to export photos: ' + err.message);
        }
    };
    const clearLocalStorage = () => {
        if (!confirm('Are you sure you want to clear all locally stored photo metadata? This cannot be undone.')) {
            return;
        }
        try {
            // Remove all photo metadata
            for (const photo of localStoragePhotos) {
                const storageKey = `photo_metadata_${photo.id}`;
                localStorage.removeItem(storageKey);
            }
            // Clear the user's photo list
            const userPhotosKey = `user_photos_${userId}`;
            localStorage.removeItem(userPhotosKey);
            // Reload the data
            setLocalStoragePhotos([]);
            console.log('[LocalStorageDebug] Cleared all locally stored photo metadata');
            alert('Successfully cleared all locally stored photo metadata');
        }
        catch (err) {
            console.error('[LocalStorageDebug] Error clearing localStorage:', err);
            alert('Failed to clear localStorage: ' + err.message);
        }
    };
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString();
        }
        catch (err) {
            return dateStr || 'Unknown';
        }
    };
    return (_jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Local Storage Backup Data" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: loadLocalStorageData, className: "px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm", children: "Refresh" }), _jsx("button", { onClick: exportAllPhotosMetadata, className: "px-3 py-1 bg-blue-600 text-white rounded text-sm", disabled: localStoragePhotos.length === 0, children: "Export JSON" }), _jsx("button", { onClick: clearLocalStorage, className: "px-3 py-1 bg-red-600 text-white rounded text-sm", disabled: localStoragePhotos.length === 0, children: "Clear Storage" })] })] }), loading ? (_jsx("p", { className: "text-gray-500", children: "Loading localStorage data..." })) : localStoragePhotos.length === 0 ? (_jsx("p", { className: "text-gray-500", children: "No photos found in localStorage." })) : (_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Found ", localStoragePhotos.length, " photos stored locally in your browser. This data serves as a backup when database operations fail."] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full bg-white border rounded", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Preview" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Event" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Venue" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Uploaded" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Faces" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: localStoragePhotos.map((photo) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 text-sm text-gray-900 font-mono", children: photo.id }), _jsx("td", { className: "px-4 py-2", children: _jsx("div", { className: "w-12 h-12 bg-gray-100 rounded overflow-hidden", children: photo.public_url ? (_jsx("img", { src: photo.public_url, alt: "Thumbnail", className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-gray-400", children: "No image" })) }) }), _jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: photo.event_details?.name || 'None' }), _jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: photo.venue?.name || 'None' }), _jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: formatDate(photo.created_at) }), _jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: Array.isArray(photo.faces) && photo.faces.length > 0 ? (_jsxs("span", { className: "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs", children: [photo.faces.length, " faces"] })) : (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs", children: "No faces" })) }), _jsx("td", { className: "px-4 py-2 text-sm", children: _jsx("button", { onClick: () => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id), className: "text-blue-600 hover:text-blue-800", children: selectedPhoto === photo.id ? 'Hide JSON' : 'View JSON' }) })] }, photo.id))) })] }) }), selectedPhoto && (_jsx("div", { className: "mt-4 p-4 bg-gray-800 rounded overflow-auto max-h-96", children: _jsx("pre", { className: "text-xs text-green-400", children: JSON.stringify(localStoragePhotos.find(p => p.id === selectedPhoto), null, 2) }) }))] }))] }));
};
export default LocalStorageDebugPanel;
