import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Camera, Users } from 'lucide-react';
import { cn } from '../utils/cn';

interface EventProps {
  id: string;
  title: string;
  date: Date;
  location: string;
  photoCount: number;
  coverImage: string;
  attendees: number;
}

interface EventCardProps {
  event: EventProps;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  viewMode, 
  onClick 
}) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(event.date);
  
  if (viewMode === 'list') {
    return (
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-apple-xl p-4 shadow-apple cursor-pointer transition-all hover:shadow-apple-lg"
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          <div 
            className="w-20 h-20 rounded-apple-lg bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${event.coverImage})` }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 mb-1 truncate">{event.title}</h3>
            <div className="space-y-1">
              <div className="flex items-center text-gray-500 text-xs">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center text-gray-500 text-xs">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center text-gray-500 text-xs">
              <Camera className="h-3 w-3 mr-1" />
              <span>{event.photoCount}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Users className="h-3 w-3 mr-1" />
              <span>{event.attendees}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-apple-xl overflow-hidden shadow-apple cursor-pointer transition-all hover:shadow-apple-lg"
      onClick={onClick}
    >
      <div 
        className="h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${event.coverImage})` }}
      />
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{event.title}</h3>
        <div className="space-y-2">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          <div className="flex items-center text-gray-500 text-sm">
            <Camera className="h-4 w-4 mr-1 text-gray-400" />
            <span>{event.photoCount} photos</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Users className="h-4 w-4 mr-1 text-gray-400" />
            <span>{event.attendees} people</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 