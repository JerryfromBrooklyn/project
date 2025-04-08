import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import SimplePhotoUploader from '../components/SimplePhotoUploader';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getPhotosByUserId } from '../services/database-utils.js';
import { Image, Upload, AlertCircle } from 'lucide-react';
/**
 * Upload page component with face recognition
 * Features the enhanced photo uploader with extensive logging
 */
const UploadPage = () => {
    const { user } = useAuth();
    const [recentUploads, setRecentUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    // Fetch recent uploads by the current user from DynamoDB
    useEffect(() => {
        const fetchRecentUploads = async () => {
            if (!user)
                return;
            setLoading(true);
            try {
                // Replace Supabase query with DynamoDB query
                const result = await getPhotosByUserId(user.id, 4); // Fetch 4 most recent
                if (!result.success) {
                    throw new Error(result.error || 'Failed to fetch photos');
                }
                setRecentUploads(result.data || []);
            }
            catch (err) {
                console.error('Error fetching recent uploads from DynamoDB:', err);
                setRecentUploads([]); // Clear uploads on error
            }
            finally {
                setLoading(false);
            }
        };
        fetchRecentUploads();
    }, [user]); // Depend on user object
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("header", { className: "mb-4", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "FACE RECOGNITION UPLOAD" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Upload photos to automatically detect and match faces using AWS Rekognition" })] }), _jsx("div", { className: "bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-md", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "bg-white/20 p-2 rounded-lg mr-4", children: _jsx(Upload, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: "Enhanced Face Recognition Upload" }), _jsx("p", { className: "mt-1 text-blue-100", children: "This uploader features real-time face detection, AWS Rekognition integration, and detailed logging of the entire process" })] })] }) }), _jsx("section", { className: "bg-white rounded-xl shadow-md overflow-hidden", children: _jsx(SimplePhotoUploader, {}) }), _jsxs("section", { className: "bg-gray-50 rounded-xl p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Image, { className: "w-5 h-5 text-gray-500 mr-2" }), _jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Recent Uploads" })] }), _jsx(Link, { to: "/photos", className: "text-sm text-blue-600 hover:text-blue-800", children: "View all photos \u2192" })] }), loading ? (_jsx("div", { className: "flex justify-center items-center h-32", children: _jsx("div", { className: "animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" }) })) : recentUploads.length === 0 ? (_jsxs("div", { className: "bg-white p-6 text-center rounded-lg border border-gray-100", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-gray-500", children: "You haven't uploaded any photos yet" }), _jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Your recent uploads will appear here" })] })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: recentUploads.map(photo => (_jsxs("div", { className: "bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow", children: [_jsx("div", { className: "aspect-square bg-gray-100 relative", children: photo.public_url ? (_jsx("img", { src: photo.public_url, alt: `Photo ${photo.id}`, className: "w-full h-full object-cover", onError: (e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/300?text=Error';
                                            } })) : (_jsx("div", { className: "flex items-center justify-center h-full text-gray-400", children: _jsx(Image, { className: "w-8 h-8 opacity-30" }) })) }), _jsx("div", { className: "p-2", children: _jsx("p", { className: "text-xs text-gray-500", children: new Date(photo.created_at).toLocaleString() }) })] }, photo.id))) }))] })] }) }));
};
export default UploadPage;
