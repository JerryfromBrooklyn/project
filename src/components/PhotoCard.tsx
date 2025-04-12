import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, Share2, Tag } from 'lucide-react';
import { cn } from '../utils/cn';

interface PhotoProps {
  id: string;
  url: string;
  title?: string;
  date: Date;
  likes: number;
  isLiked: boolean;
  tags?: string[];
}

interface PhotoCardProps {
  photo: PhotoProps;
  aspectRatio?: "square" | "portrait" | "landscape";
  size?: "sm" | "md" | "lg";
  showControls?: boolean;
  onLike?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onPhotoClick?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  aspectRatio = "landscape",
  size = "md",
  showControls = true,
  onLike,
  onDownload,
  onShare,
  onPhotoClick
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const aspectRatioClass = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  const sizeClass = {
    sm: "max-w-[240px]",
    md: "max-w-[320px]",
    lg: "max-w-[480px]",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "bg-white/90 backdrop-blur-sm border border-gray-100 rounded-apple-xl overflow-hidden shadow-apple transition-all hover:shadow-apple-lg",
        sizeClass[size]
      )}
    >
      <div className="relative" onClick={onPhotoClick}>
        <div 
          className={cn(
            "bg-cover bg-center cursor-pointer",
            aspectRatioClass[aspectRatio]
          )}
          style={{ backgroundImage: `url(${photo.url})` }}
        />
        
        {photo.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-white text-sm font-medium truncate">
              {photo.title}
            </h3>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{formatDate(photo.date)}</span>
          
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex items-center">
              <Tag className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                {photo.tags.slice(0, 2).join(', ')}
                {photo.tags.length > 2 && '...'}
              </span>
            </div>
          )}
        </div>

        {showControls && (
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex items-center text-xs rounded-full px-2 py-1",
                photo.isLiked 
                  ? "text-red-500 bg-red-50" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
              onClick={onLike}
              aria-label={photo.isLiked ? "Unlike photo" : "Like photo"}
            >
              <Heart 
                className={cn("h-3.5 w-3.5 mr-1", 
                  photo.isLiked ? "fill-current" : ""
                )} 
              />
              <span>{photo.likes}</span>
            </motion.button>

            <div className="flex space-x-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="text-gray-500 hover:bg-gray-50 rounded-full p-1.5"
                onClick={onDownload}
                aria-label="Download photo"
              >
                <Download className="h-3.5 w-3.5" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="text-gray-500 hover:bg-gray-50 rounded-full p-1.5"
                onClick={onShare}
                aria-label="Share photo"
              >
                <Share2 className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 