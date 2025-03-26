import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Trash2, X, Users, AlertCircle, Info } from 'lucide-react';
import { PhotoService, PhotoMetadata } from '../services/PhotoService';
import { PhotoInfoModal } from './PhotoInfoModal';
import { cn } from '../utils/cn';

interface PhotoGridProps {
  photos: PhotoMetadata[];
  onDelete?: (photoId: string) => void;
  onShare?: (photoId: string) => void;
  onDownload?: (photoId: string) => Promise<void>;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onDelete,
  onShare,
  onDownload
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleDownload = async (photo: PhotoMetadata) => {
    try {
      setLoading({ ...loading, [photo.id]: true });
      
      if (onDownload) {
        await onDownload(photo.id);
      } else {
        const url = await PhotoService.downloadPhoto(photo.id);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `photo-${photo.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
    } finally {
      setLoading({ ...loading, [photo.id]: false });
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200">
        <AlertCircle className="w-12 h-12 text-apple-gray-400 mx-auto mb-4" />
        <p className="text-apple-gray-500 font-medium">No photos found</p>
        <p className="text-apple-gray-400 text-sm mt-1">
          {photos.length === 0 ? "No photos have been uploaded yet" : "No matches found in any photos"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group"
          >
            <div className="aspect-square rounded-apple-xl overflow-hidden">
              <img
                src={photo.url}
                alt={photo.title || `Photo ${photo.id}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Match Status Badge */}
            {photo.faces && (
              <div 
                className={cn(
                  "absolute top-2 right-2 px-2 py-1 rounded-full text-sm flex items-center gap-1",
                  photo.matched_users?.length 
                    ? "bg-apple-green-500 text-white" 
                    : "bg-apple-gray-200 text-apple-gray-600"
                )}
              >
                <Users className="w-4 h-4" />
                {photo.matched_users?.length || "No"} {photo.matched_users?.length === 1 ? "Match" : "Matches"}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-apple-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 inset-x-0 p-4 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(photo)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300"
                    disabled={loading[photo.id]}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {onShare && (
                    <button
                      onClick={() => onShare(photo.id)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(photo.id)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Photo Info Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoInfoModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};