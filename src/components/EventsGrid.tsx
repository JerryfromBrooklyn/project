import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Grid, List, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { EventCard } from './EventCard';
import { extractEventsFromPhotos } from '../services/eventService';
import { cn } from '../utils/cn';
import { PhotoManager } from './PhotoManager';

interface EventsGridProps {
  userId: string;
}

export const EventsGrid: React.FC<EventsGridProps> = ({ userId }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedEventData, setSelectedEventData] = useState<any | null>(null);
  
  useEffect(() => {
    if (!userId) return;
    
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        console.log('[EventsGrid] Loading events for user:', userId);
        const eventsList = await extractEventsFromPhotos(userId);
        setEvents(eventsList);
        console.log(`[EventsGrid] Loaded ${eventsList.length} events`);
      } catch (err) {
        console.error('[EventsGrid] Error loading events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, [userId]);

  const handleEventClick = (eventId: string) => {
    console.log(`[EventsGrid] Event clicked: ${eventId}`);
    
    // Find the full event data for the selected event
    const eventData = events.find(event => event.id === eventId);
    
    if (eventData) {
      console.log(`[EventsGrid] Selected event: ${eventData.title} with ${eventData.photoCount} photos`);
      setSelectedEvent(eventId);
      setSelectedEventData(eventData);
    } else {
      console.error(`[EventsGrid] Could not find event data for ID: ${eventId}`);
    }
  };

  const handleBackClick = () => {
    setSelectedEvent(null);
    setSelectedEventData(null);
  };
  
  // Format location string to display properly
  const formatLocation = (location: any): string => {
    if (!location) return 'Unknown Location';
    
    if (typeof location === 'string') {
      return location;
    }
    
    if (typeof location === 'object') {
      return location.name || 'Unknown Location';
    }
    
    return 'Unknown Location';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-apple-gray-400 animate-spin" />
        <span className="ml-2 text-apple-gray-600">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-xl flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (selectedEvent) {
    // Event detail view
    return (
      <div>
        <div className="mb-6">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-apple-gray-600 hover:text-apple-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
        </div>
        
        {selectedEventData && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-apple-gray-900">{selectedEventData.title}</h2>
            <div className="flex items-center mt-2 text-sm text-apple-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(selectedEventData.date).toLocaleDateString()}</span>
              {selectedEventData.location && (
                <>
                  <span className="mx-2">•</span>
                  <span>{formatLocation(selectedEventData.location)}</span>
                </>
              )}
              <span className="mx-2">•</span>
              <span>{selectedEventData.photoCount} photos</span>
            </div>
          </div>
        )}
        
        <PhotoManager 
          eventId={selectedEvent} 
          mode="event" 
          key={`event-photos-${selectedEvent}`}
        />
      </div>
    );
  }

  // Main events grid view
  return (
    <div>
      {events.length === 0 ? (
        <div className="text-center p-8 bg-apple-gray-50 rounded-lg border border-apple-gray-100">
          <Calendar className="w-10 h-10 mx-auto text-apple-gray-400 mb-3" />
          <p className="text-sm text-apple-gray-500">No events found. Upload photos to create events.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-apple-gray-800">
              Events ({events.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1 rounded",
                  viewMode === 'grid' 
                    ? "bg-apple-gray-100 text-apple-gray-900" 
                    : "text-apple-gray-500 hover:text-apple-gray-900"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1 rounded",
                  viewMode === 'list' 
                    ? "bg-apple-gray-100 text-apple-gray-900" 
                    : "text-apple-gray-500 hover:text-apple-gray-900"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" 
              : "grid-cols-1"
          )}>
            {events.map(event => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={new Date(event.date)}
                location={formatLocation(event.location)}
                photoCount={event.photoCount}
                coverImage={event.coverImage}
                attendees={event.attendees}
                onClick={() => handleEventClick(event.id)}
                layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}; 