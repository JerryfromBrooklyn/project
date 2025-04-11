// src/components/PhotoManager.tsx

import React, { useState, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { PhotoMetadata } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Filter, ChevronDown, Calendar, MapPin, Tag, Clock, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { GoogleMaps } from './GoogleMaps';
import { awsPhotoService } from '../services/awsPhotoService';

interface PhotoManagerProps {
  eventId?: string;
  mode?: 'upload' | 'matches';
}

interface Filters {
  dateRange: {
    start: string;
    end: string;
  };
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  tags: string[];
  timeRange: {
    start: string;
    end: string;
  };
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({ eventId, mode = 'upload' }) => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    dateRange: {
      start: '',
      end: ''
    },
    location: {
      lat: 0,
      lng: 0,
      name: ''
    },
    tags: [],
    timeRange: {
      start: '',
      end: ''
    }
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('🔄 [PhotoManager] Setting up AWS photo polling...');
    
    // Fetch photos immediately on mount
    fetchPhotos();
    
    let pollingInterval: NodeJS.Timeout | null = null;

    // Set up polling ONLY IF mode is not 'upload'
    if (mode !== 'upload') {
      console.log(`[PhotoManager] Mode is '${mode}', enabling polling.`);
      pollingInterval = setInterval(() => {
        console.log(`[PhotoManager] Polling interval triggered for mode: ${mode}`);
        fetchPhotos();
      }, 30000); // Poll every 30 seconds
    } else {
      console.log(`[PhotoManager] Mode is 'upload', polling disabled.`);
    }
    
    return () => {
      console.log('🔄 [PhotoManager] Cleaning up AWS photo polling');
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [user?.id, mode]); // Add 'mode' to the dependency array

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) return;

      console.log('📥 [PhotoManager] Fetching photos from AWS DynamoDB...');
      
      // Get photos from DynamoDB via awsPhotoService
      const fetchedPhotos = await awsPhotoService.fetchPhotos(user.id);
      
      // Apply filters if needed
      let filteredPhotos = [...fetchedPhotos];
      
      // Apply date range filter
      if (filters.dateRange.start) {
        filteredPhotos = filteredPhotos.filter(
          photo => photo.date_taken && new Date(photo.date_taken) >= new Date(filters.dateRange.start)
        );
      }
      
      if (filters.dateRange.end) {
        filteredPhotos = filteredPhotos.filter(
          photo => photo.date_taken && new Date(photo.date_taken) <= new Date(filters.dateRange.end)
        );
      }
      
      // Apply location filter
      if (filters.location.name) {
        filteredPhotos = filteredPhotos.filter(
          photo => photo.location?.name?.toLowerCase().includes(filters.location.name.toLowerCase())
        );
      }
      
      // Apply tags filter
      if (filters.tags.length > 0) {
        filteredPhotos = filteredPhotos.filter(photo => {
          if (!photo.tags || !Array.isArray(photo.tags)) return false;
          return filters.tags.every(tag => photo.tags.includes(tag));
        });
      }
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPhotos = filteredPhotos.filter(photo => {
          const searchableFields = [
            photo.title,
            photo.description,
            photo.location?.name,
            photo.venue?.name,
            ...(photo.tags || [])
          ].filter(Boolean);
          
          return searchableFields.some(field => 
            field && field.toLowerCase().includes(query)
          );
        });
      }
      
      // Sort photos by date descending (newest first)
      filteredPhotos.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; 
      });
      
      setPhotos(filteredPhotos);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (photoId: string) => {
    await fetchPhotos();
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      // Use AWS S3/DynamoDB to delete the photo
      const success = await awsPhotoService.deletePhoto(photoId);
      
      if (success) {
        setPhotos(photos.filter(p => p.id !== photoId));
        // Manually trigger fetch for the 'matches' mode if needed, though polling should handle it.
        if (mode === 'matches') {
          fetchPhotos(); 
        }
      } else {
        throw new Error('Failed to delete photo');
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
    }
  };

  const handleShare = async (photoId: string) => {
    console.log('Share photo:', photoId);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        start: '',
        end: ''
      },
      location: {
        lat: 0,
        lng: 0,
        name: ''
      },
      tags: [],
      timeRange: {
        start: '',
        end: ''
      }
    });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-apple-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {mode === 'upload' && (
        <PhotoUploader
          eventId={eventId}
          onUploadComplete={handlePhotoUpload}
          onError={(error) => setError(error)}
        />
      )}

      <div className="mt-8 mb-6">
        {/* Search and Filter UI Removed */}
      </div>

      {/* Photo Count Display */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-apple-gray-800">
          {/* Corrected fetch logic in Dashboard, count display might need separate fetch here if desired */}
          {mode === 'upload' 
            ? `My Uploads (${photos.length})`
            : `My Photo Matches (${photos.length})`}
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            onDelete={mode === 'upload' ? handlePhotoDelete : undefined}
            onShare={handleShare}
          />
        ) : (
          <div className="text-center py-12 bg-apple-gray-50 rounded-apple-xl border-2 border-dashed border-apple-gray-200">
            <p className="text-apple-gray-500">
              {mode === 'upload' 
                ? "No photos uploaded yet" 
                : "No photos found with your face"
              }
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
