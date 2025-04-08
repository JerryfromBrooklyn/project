import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadPhotoWithMatching } from '../services/face-matching/api';
/**
 * PhotoUpload component for uploading photos with automatic face matching
 */
export const PhotoUpload = ({ onSuccess }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const { user } = useAuth();
    // Handle file selection
    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        console.log('[UPLOAD] Selected', selectedFiles.length, 'files');
        // Validate files (only images)
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length !== selectedFiles.length) {
            setError('Only image files are allowed');
        }
        setFiles(imageFiles);
        setError(null);
    };
    // Handle file drop
    const handleDrop = (event) => {
        event.preventDefault();
        if (event.dataTransfer.files) {
            const droppedFiles = Array.from(event.dataTransfer.files);
            console.log('[UPLOAD] Dropped', droppedFiles.length, 'files');
            // Validate files (only images)
            const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
            if (imageFiles.length !== droppedFiles.length) {
                setError('Only image files are allowed');
            }
            setFiles(imageFiles);
            setError(null);
        }
    };
    // Prevent default drag behavior
    const handleDragOver = (event) => {
        event.preventDefault();
    };
    // Clear selected files
    const clearFiles = () => {
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    // Upload selected files
    const handleUpload = async () => {
        if (!files.length || !user)
            return;
        setUploading(true);
        setResults([]);
        setError(null);
        const uploadResults = [];
        console.log('[UPLOAD] Starting upload of', files.length, 'files');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Update progress
            setUploadProgress(prev => ({
                ...prev,
                [file.name]: {
                    progress: 0,
                    status: 'uploading'
                }
            }));
            try {
                console.log(`[UPLOAD] Uploading file ${i + 1}/${files.length}: ${file.name}`);
                // Upload with face matching
                const result = await uploadPhotoWithMatching(user.id, file, {
                    title: file.name,
                    uploadedBy: user.id
                });
                console.log(`[UPLOAD] Upload result for ${file.name}:`, result);
                if (!result.success) {
                    throw new Error(result.error || 'Upload failed');
                }
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: {
                        progress: 100,
                        status: 'success',
                        matches: result.matchedUsers?.length || 0
                    }
                }));
                uploadResults.push({
                    fileName: file.name,
                    photoId: result.photoId,
                    url: result.url,
                    success: true,
                    matchedUsers: result.matchedUsers || []
                });
            }
            catch (error) {
                console.error(`[UPLOAD] Error uploading ${file.name}:`, error);
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: {
                        progress: 100,
                        status: 'error',
                        error: error.message
                    }
                }));
                uploadResults.push({
                    fileName: file.name,
                    success: false,
                    error: error.message
                });
            }
        }
        console.log('[UPLOAD] All uploads completed. Results:', uploadResults);
        setResults(uploadResults);
        setUploading(false);
        // Call success callback if provided
        if (onSuccess && uploadResults.some(r => r.success)) {
            onSuccess(uploadResults.filter(r => r.success));
        }
    };
    // Get upload status for all files
    const getOverallStatus = () => {
        if (!files.length)
            return 'idle';
        if (uploading)
            return 'uploading';
        if (results.length > 0)
            return 'completed';
        return 'ready';
    };
    return (_jsxs("div", { className: "photo-upload p-6 bg-white rounded-xl shadow-md", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: "Upload Photos" }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-50 text-red-700 rounded-lg", children: _jsx("p", { children: error }) })), _jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer hover:border-blue-500 transition-colors", onDrop: handleDrop, onDragOver: handleDragOver, onClick: () => fileInputRef.current?.click(), children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileSelect, accept: "image/*", multiple: true, className: "hidden" }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 mx-auto text-gray-400 mb-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }) }), _jsx("p", { className: "text-gray-700 mb-2", children: "Drag & drop photos here or click to browse" }), _jsx("p", { className: "text-gray-500 text-sm", children: "JPG, PNG, GIF files accepted" })] }), files.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("h3", { className: "font-medium text-gray-900", children: ["Selected Files (", files.length, ")"] }), _jsx("button", { onClick: clearFiles, disabled: uploading, className: "text-sm text-red-600 hover:text-red-800 disabled:opacity-50", children: "Clear All" })] }), _jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto", children: files.map((file) => (_jsxs("div", { className: "flex items-center p-2 border border-gray-200 rounded-md", children: [_jsx("div", { className: "h-10 w-10 mr-3 bg-gray-100 rounded overflow-hidden", children: _jsx("img", { src: URL.createObjectURL(file), alt: file.name, className: "h-full w-full object-cover" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: file.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [(file.size / 1024).toFixed(1), "KB"] })] }), uploadProgress[file.name] && (_jsxs("div", { className: "ml-2 text-sm", children: [uploadProgress[file.name].status === 'uploading' && (_jsx("span", { className: "text-blue-600", children: "Uploading..." })), uploadProgress[file.name].status === 'success' && (_jsx("span", { className: "text-green-600", children: "Uploaded" })), uploadProgress[file.name].status === 'error' && (_jsx("span", { className: "text-red-600", children: "Failed" }))] }))] }, file.name))) })] })), _jsx("div", { className: "mt-6", children: _jsx("button", { onClick: handleUpload, disabled: files.length === 0 || uploading, className: "w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: uploading ? (_jsxs("span", { className: "flex items-center justify-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Uploading..."] })) : (`Upload ${files.length > 0 ? `${files.length} Photo${files.length > 1 ? 's' : ''}` : 'Photos'}`) }) }), results.length > 0 && getOverallStatus() === 'completed' && (_jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-2", children: "Upload Results" }), _jsx("div", { className: "space-y-3", children: results.map((result) => (_jsxs("div", { className: "p-3 bg-white rounded border border-gray-200", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `h-4 w-4 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("p", { className: "font-medium", children: result.fileName })] }), result.success ? (_jsxs("div", { className: "mt-2 ml-6", children: [_jsx("p", { className: "text-sm text-gray-600", children: result.matchedUsers.length > 0 ? (`Matched with ${result.matchedUsers.length} user${result.matchedUsers.length > 1 ? 's' : ''}`) : ('No face matches found') }), result.matchedUsers.length > 0 && (_jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: result.matchedUsers.map((user) => (_jsxs("div", { className: "flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs", children: [_jsx("div", { className: "h-4 w-4 rounded-full bg-gray-200 overflow-hidden mr-1", children: user.avatarUrl && (_jsx("img", { src: user.avatarUrl, alt: user.fullName, className: "h-full w-full object-cover" })) }), _jsx("span", { children: user.fullName })] }, user.userId))) }))] })) : (_jsx("p", { className: "mt-1 ml-6 text-sm text-red-600", children: result.error }))] }, result.fileName))) })] }))] }));
};
export default PhotoUpload;
