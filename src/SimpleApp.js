import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import SimplePhotoUpload from './components/workaround/SimplePhotoUpload';
import AdminTools from './components/AdminTools';
import { PhotoUploader } from './components/PhotoUploader';
import SimplePhotoInfoModal from './components/SimplePhotoInfoModal.jsx';
import LocalStorageDebugPanel from './components/LocalStorageDebugPanel';
import awsAuth from './services/awsAuthService';
import { getUserPhotos } from './services/PhotoService';
const SimpleApp = () => {
    // Add useEffect for mount logging
    useEffect(() => {
        console.log('[SimpleApp.jsx] Mounted');
    }, []);
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [showPhotoInfoModal, setShowPhotoInfoModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(null);
    useEffect(() => {
        // Check for active session
        const initAuth = async () => {
            try {
                const { data } = await awsAuth.getSession();
                const currentUser = await awsAuth.getCurrentUser();
                setSession(data.session);
                setUser(currentUser);
                setLoading(false);
                if (currentUser) {
                    fetchPhotos();
                    // Set up polling for photos instead of real-time subscription
                    const interval = setInterval(() => {
                        fetchPhotos();
                    }, 30000); // Poll every 30 seconds
                    setRefreshInterval(interval);
                }
            }
            catch (error) {
                console.error('Error checking auth state:', error);
                setLoading(false);
            }
        };
        initAuth();
        // Set up auth listener
        const subscription = awsAuth.onAuthStateChange((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchPhotos();
                // Start polling if not already
                if (!refreshInterval) {
                    const interval = setInterval(() => {
                        fetchPhotos();
                    }, 30000);
                    setRefreshInterval(interval);
                }
            }
            else {
                // Clear polling interval on sign out
                if (refreshInterval) {
                    clearInterval(refreshInterval);
                    setRefreshInterval(null);
                }
            }
        });
        // Clean up on unmount
        return () => {
            subscription.unsubscribe();
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, []);
    const fetchPhotos = async () => {
        if (!user)
            return;
        setLoadingPhotos(true);
        try {
            const { success, photos } = await getUserPhotos(user.id);
            if (success) {
                setPhotos(photos);
            }
        }
        catch (error) {
            console.error('Error fetching photos:', error);
        }
        finally {
            setLoadingPhotos(false);
        }
    };
    const handlePhotoUploadSuccess = (photo) => {
        // Add the new photo to the list
        setPhotos(prev => [photo, ...prev]);
    };
    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
        setShowPhotoInfoModal(true);
    };
    const signOut = async () => {
        await awsAuth.signOut();
        setUser(null);
        setSession(null);
    };
    if (loading) {
        return _jsx("div", { className: "flex justify-center items-center h-screen", children: "Loading..." });
    }
    if (!session) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen p-4", children: _jsxs("div", { className: "w-full max-w-md bg-white shadow-lg rounded-lg p-8", children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-center", children: "Welcome to the Photo App" }), _jsx("p", { className: "mb-8 text-gray-600 text-center", children: "Please sign in or create an account to continue." }), _jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: () => window.location.href = '/login', className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "Sign In" }), _jsx("button", { onClick: () => window.location.href = '/signup', className: "w-full bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "Create Account" })] })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Photo App" }), _jsxs("div", { className: "flex items-center", children: [_jsx("p", { className: "mr-4", children: user?.email || user?.id }), _jsx("button", { onClick: signOut, className: "bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2", children: "Sign Out" })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Upload Photo" }), _jsx(PhotoUploader, { onSuccess: handlePhotoUploadSuccess, onError: (error) => console.error('Upload error:', error) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "My Photos" }), loadingPhotos ? (_jsx("div", { className: "text-center py-8", children: "Loading photos..." })) : photos.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: photos.map((photo) => (_jsxs("div", { className: "border rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow", onClick: () => handlePhotoClick(photo), children: [_jsx("img", { src: photo.url, alt: "User uploaded", className: "w-full h-48 object-cover" }), _jsxs("div", { className: "p-3", children: [_jsx("p", { className: "text-sm text-gray-600 truncate", children: new Date(photo.created_at).toLocaleDateString() }), photo.matched_users && photo.matched_users.length > 0 && (_jsx("div", { className: "mt-2 flex items-center", children: _jsxs("span", { className: "text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full", children: [photo.matched_users.length, " matches"] }) }))] })] }, photo.id))) })) : (_jsx("div", { className: "text-center py-8 bg-gray-50 rounded-lg", children: _jsx("p", { className: "text-gray-600", children: "No photos found. Upload your first photo above!" }) }))] }), showPhotoInfoModal && selectedPhoto && (_jsx(SimplePhotoInfoModal, { photo: selectedPhoto, onClose: () => {
                    setShowPhotoInfoModal(false);
                    setSelectedPhoto(null);
                } })), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Developer Tools" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(LocalStorageDebugPanel, {}), _jsx(AdminTools, { user: user })] })] })] }));
};
export default SimpleApp;
