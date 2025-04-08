import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import SimplePhotoInfoModal from './SimplePhotoInfoModal';
import { cn } from '../utils/cn';
export const PhotoGrid = ({ photos, onDelete, onShare, onDownload }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [loading, setLoading] = useState({});
    const handleDownload = async (photo) => {
        if (onDownload) {
            try {
                setLoading({ ...loading, [photo.id]: true });
                await onDownload(photo.id);
            }
            catch (error) {
                console.error('Error downloading photo:', error);
            }
            finally {
                setLoading({ ...loading, [photo.id]: false });
            }
            return;
        }
        try {
            setLoading({ ...loading, [photo.id]: true });
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
            setLoading({ ...loading, [photo.id]: false });
        }
    };
    if (photos.length === 0) {
        return (_jsxs("div", { className: "text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-apple-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-apple-gray-500 font-medium", children: "No photos found" }), _jsx("p", { className: "text-apple-gray-400 text-sm mt-1", children: photos.length === 0 ? "No photos have been uploaded yet" : "No matches found in any photos" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: photos.map((photo) => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "relative group", children: [_jsx("div", { className: "aspect-square rounded-apple-xl overflow-hidden", children: _jsx("img", { src: photo.url, alt: photo.title || `Photo ${photo.id}`, className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" }) }), photo.faces && (_jsxs("div", { className: cn("absolute top-2 right-2 px-2 py-1 rounded-full text-sm flex items-center gap-1", "bg-apple-blue-500/80 text-white backdrop-blur-sm"), children: [_jsx(Users, { className: "w-4 h-4" }), photo.matched_users?.length > 0
                                    ? `${photo.matched_users.length} ${photo.matched_users.length === 1 ? "Match" : "Matches"}`
                                    : `${photo.faces.length} ${photo.faces.length === 1 ? "Face" : "Faces"}`] })), _jsx("div", { className: "absolute inset-0 bg-black/50 rounded-apple-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: _jsxs("div", { className: "absolute bottom-0 inset-x-0 p-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleDownload(photo), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", disabled: loading[photo.id], "aria-label": "Download photo", children: _jsx(Download, { className: "w-5 h-5" }) }), onShare && (_jsx("button", { onClick: () => onShare(photo.id), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", "aria-label": "Share photo", children: _jsx(Share2, { className: "w-5 h-5" }) })), _jsx("button", { onClick: () => setSelectedPhoto(photo), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", "aria-label": "View photo details", children: _jsx(Info, { className: "w-5 h-5" }) })] }), onDelete && (_jsx("button", { onClick: () => onDelete(photo.id), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", "aria-label": "Delete photo", children: _jsx(Trash2, { className: "w-5 h-5" }) }))] }) })] }, photo.id))) }), _jsx(AnimatePresence, { children: selectedPhoto && (_jsx(SimplePhotoInfoModal, { photo: selectedPhoto, onClose: () => setSelectedPhoto(null) })) })] }));
};
