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
    if (user) {
      fetchPhotos();
    }
  }, [user, filters, searchQuery]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) return;
      
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
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 ios-input"
            />
          </div>
          <button
            onClick={fetchPhotos}
            className="ios-button-secondary mr-2 flex items-center"
            aria-label="Refresh photos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "ios-button-secondary flex items-center",
              showFilters && "bg-apple-blue-500 text-white hover:bg-apple-blue-600"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={cn(
              "w-4 h-4 ml-2 transition-transform duration-200",
              showFilters && "transform rotate-180"
            )} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white rounded-apple-xl border border-apple-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="ios-label flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters.dateRange.start}
                        onChange={(e) => setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: e.target.value }
                        })}
                        className="ios-input"
                      />
                      <input
                        type="date"
                        value={filters.dateRange.end}
                        onChange={(e) => setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, end: e.target.value }
                        })}
                        className="ios-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="ios-label flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location
                    </label>
                    <GoogleMaps
                      location={filters.location}
                      onLocationChange={(location) => setFilters({
                        ...filters,
                        location
                      })}
                      height="200px"
                      className="rounded-apple overflow-hidden"
                    />
                  </div>

                  <div>
                    <label className="ios-label flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="Add tags..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          setFilters({
                            ...filters,
                            tags: [...filters.tags, e.currentTarget.value]
                          });
                          e.currentTarget.value = '';
                        }
                      }}
                      className="ios-input"
                    />
                    {filters.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filters.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-apple-blue-100 text-apple-blue-700 px-2 py-1 rounded-full text-sm flex items-center"
                          >
                            {tag}
                            <button
                              onClick={() => setFilters({
                                ...filters,
                                tags: filters.tags.filter((_, i) => i !== index)
                              })}
                              className="ml-1 hover:text-apple-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="ios-label flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Time Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="time"
                        value={filters.timeRange.start}
                        onChange={(e) => setFilters({
                          ...filters,
                          timeRange: { ...filters.timeRange, start: e.target.value }
                        })}
                        className="ios-input"
                      />
                      <input
                        type="time"
                        value={filters.timeRange.end}
                        onChange={(e) => setFilters({
                          ...filters,
                          timeRange: { ...filters.timeRange, end: e.target.value }
                        })}
                        className="ios-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="ios-button-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
