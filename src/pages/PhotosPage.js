import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import PhotoGrid from '../features/photos/components/PhotoGrid';
import PhotoUploader from '../features/photos/components/PhotoUploader';
import { usePhotos } from '../features/photos/hooks/usePhotos';
import LocalStorageDebugPanel from '../features/photos/components/LocalStorageDebugPanel';
import SimplePhotoInfoModal from '../components/SimplePhotoInfoModal.jsx';
import { PhotoService } from '../services/PhotoService';
import { supabase } from '../lib/supabaseClient';
import LinkAccountsModal from '../components/LinkAccountsModal';
import { UserPlus } from 'lucide-react';
/**
 * Photos page component for displaying all photos
 */
const PhotosPage = () => {
    const { selectedPhoto, clearSelectedPhoto, fetchPhotos } = usePhotos();
    const [showUploader, setShowUploader] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [fixStatus, setFixStatus] = useState('idle'); // idle, checking, fixing, fixed, failed
    const [fixResults, setFixResults] = useState({ fixed: 0, alreadyMatched: 0, failed: 0 });
    const [showFixButton, setShowFixButton] = useState(true);
    const [showLinkAccountsModal, setShowLinkAccountsModal] = useState(false);
    const runPhotoFix = async () => {
        try {
            if (!window.supabase) {
                alert("Error: Supabase not initialized");
                return;
            }
            setFixStatus('checking');
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                setFixStatus('failed');
                alert("Please log in to fix your photo matches");
                return;
            }
            // These are the specific photos from the logs
            const specificPhotoIds = [
                '811d2222-0264-4676-b589-c7535e573e7f',
                'ee3010c6-b991-42e4-8b01-d7994e44035d',
                'b4362c15-e685-4f9e-9353-68f684989952'
            ];
            // Process each photo
            setFixStatus('fixing');
            let results = { fixed: 0, alreadyMatched: 0, failed: 0 };
            for (const photoId of specificPhotoIds) {
                // Check if photo exists
                const { data: photo, error: photoError } = await window.supabase
                    .from('photos')
                    .select('matched_users')
                    .eq('id', photoId)
                    .single();
                if (photoError) {
                    console.log(`Photo ${photoId} not found`);
                    results.failed++;
                    continue;
                }
                // Check if user is already matched
                const matchedUsers = Array.isArray(photo.matched_users) ? photo.matched_users : [];
                const userMatched = matchedUsers.some(match => match.userId === user.id || match.user_id === user.id);
                if (userMatched) {
                    console.log(`User already matched to photo ${photoId}`);
                    results.alreadyMatched++;
                    continue;
                }
                // Fix the photo
                console.log(`Fixing photo ${photoId}...`);
                const { data: result, error: updateError } = await window.supabase.rpc('debug_force_update_photo', {
                    p_id: photoId,
                    user_id: user.id
                });
                if (updateError) {
                    console.error(`Error fixing photo ${photoId}:`, updateError.message);
                    results.failed++;
                }
                else {
                    console.log(`Successfully fixed photo ${photoId}`);
                    results.fixed++;
                }
            }
            // Update results
            setFixResults(results);
            setFixStatus('fixed');
            setShowFixButton(false);
            // Reload if any photos were fixed
            if (results.fixed > 0) {
                alert(`Fixed ${results.fixed} photos! The page will reload to show your fixed photos.`);
                window.location.reload();
            }
        }
        catch (err) {
            console.error('Error fixing photos:', err);
            setFixStatus('failed');
        }
    };
    return (_jsxs(Layout, { children: [_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Photos" }), _jsx("div", { children: _jsx("button", { onClick: () => setShowUploader(!showUploader), className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: showUploader ? 'Hide Uploader' : 'Upload Photo' }) })] }), showUploader && (_jsxs("section", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Upload New Photo" }), _jsx(PhotoUploader, { onSuccess: () => {
                                    setShowUploader(false);
                                    fetchPhotos();
                                } })] })), _jsxs("section", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "All Photos" }), _jsx("button", { onClick: () => fetchPhotos(), className: "text-blue-600 hover:underline text-sm", children: "Refresh" })] }), _jsx(PhotoGrid, {})] }), _jsxs("section", { children: [_jsx("button", { onClick: () => setShowDebugPanel(!showDebugPanel), className: "text-gray-600 hover:text-gray-800 text-sm underline", children: showDebugPanel ? 'Hide Debug Info' : 'Show Debug Info' }), showDebugPanel && (_jsx("div", { className: "mt-4", children: _jsx(LocalStorageDebugPanel, {}) }))] }), showFixButton && (_jsxs("div", { className: "bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-bold", children: "Photo Matching Fix Available" }), _jsx("p", { children: "We detected that some of your photos may not be showing correctly." })] }), _jsxs("button", { onClick: runPhotoFix, disabled: fixStatus === 'checking' || fixStatus === 'fixing', className: `px-4 py-2 rounded text-white ${fixStatus === 'checking' || fixStatus === 'fixing'
                                            ? 'bg-gray-400'
                                            : 'bg-blue-500 hover:bg-blue-600'}`, children: [fixStatus === 'idle' && 'Fix Photo Matches', fixStatus === 'checking' && 'Checking...', fixStatus === 'fixing' && 'Fixing...', fixStatus === 'fixed' && 'Fixed!', fixStatus === 'failed' && 'Try Again'] })] }), fixStatus === 'fixed' && (_jsx("div", { className: "mt-2", children: _jsxs("p", { className: "text-sm", children: ["Results: ", fixResults.fixed, " fixed, ", fixResults.alreadyMatched, " already matched, ", fixResults.failed, " failed"] }) }))] })), _jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Photos" }), _jsx("div", { className: "flex space-x-2", children: _jsxs("button", { onClick: () => setShowLinkAccountsModal(true), className: "flex items-center px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200", title: "Link multiple accounts to view all your photos in one place", children: [_jsx(UserPlus, { size: 16, className: "mr-1" }), "Link Accounts"] }) })] })] }), selectedPhoto && (_jsx(SimplePhotoInfoModal, { photo: selectedPhoto, onClose: clearSelectedPhoto })), showLinkAccountsModal && (_jsx(LinkAccountsModal, { isOpen: showLinkAccountsModal, onClose: () => setShowLinkAccountsModal(false), supabase: window.supabase, user: user }))] }));
};
export default PhotosPage;
