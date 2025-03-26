import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, Users, AlertCircle, Info } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';
import { PhotoInfoModal } from './PhotoInfoModal';
import { cn } from '../utils/cn';
export const PhotoGrid = ({ photos, onDelete, onShare, onDownload }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [loading, setLoading] = useState({});
    const handleDownload = async (photo) => {
        try {
            setLoading({ ...loading, [photo.id]: true });
            if (onDownload) {
                await onDownload(photo.id);
            }
            else {
                const url = await PhotoService.downloadPhoto(photo.id);
                const link = document.createElement('a');
                link.href = url;
                link.download = `photo-${photo.id}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
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
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: photos.map((photo) => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "relative group", children: [_jsx("div", { className: "aspect-square rounded-apple-xl overflow-hidden", children: _jsx("img", { src: photo.url, alt: photo.title || `Photo ${photo.id}`, className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" }) }), photo.faces && (_jsxs("div", { className: cn("absolute top-2 right-2 px-2 py-1 rounded-full text-sm flex items-center gap-1", photo.matched_users?.length
                                ? "bg-apple-green-500 text-white"
                                : "bg-apple-gray-200 text-apple-gray-600"), children: [_jsx(Users, { className: "w-4 h-4" }), photo.matched_users?.length || "No", " ", photo.matched_users?.length === 1 ? "Match" : "Matches"] })), _jsx("div", { className: "absolute inset-0 bg-black/50 rounded-apple-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: _jsxs("div", { className: "absolute bottom-0 inset-x-0 p-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleDownload(photo), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", disabled: loading[photo.id], children: _jsx(Download, { className: "w-5 h-5" }) }), onShare && (_jsx("button", { onClick: () => onShare(photo.id), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", children: _jsx(Share2, { className: "w-5 h-5" }) })), _jsx("button", { onClick: () => setSelectedPhoto(photo), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", children: _jsx(Info, { className: "w-5 h-5" }) })] }), onDelete && (_jsx("button", { onClick: () => onDelete(photo.id), className: "p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300", children: _jsx(Trash2, { className: "w-5 h-5" }) }))] }) })] }, photo.id))) }), _jsx(AnimatePresence, { children: selectedPhoto && (_jsx(PhotoInfoModal, { photo: selectedPhoto, onClose: () => setSelectedPhoto(null) })) })] }));
};
