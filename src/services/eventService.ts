import { awsPhotoService } from './awsPhotoService';

interface EventDetail {
  id: string;
  title: string;
  date: Date;
  location: string;
  photoCount: number;
  coverImage: string;
  attendees: number;
  photos: any[];
}

/**
 * Extract events from user's photos
 * @param userId The user ID
 * @returns Array of event objects
 */
export const extractEventsFromPhotos = async (userId: string): Promise<EventDetail[]> => {
  if (!userId) {
    console.error('[eventService] No userId provided');
    return [];
  }

  try {
    console.log('[eventService] Fetching photos for user:', userId);
    
    // Get all photos (uploaded and matched)
    // @ts-ignore - Method exists in JS implementation
    const uploadedPhotos = await awsPhotoService.getVisiblePhotos(userId, 'uploaded');
    // @ts-ignore - Method exists in JS implementation
    const matchedPhotos = await awsPhotoService.getVisiblePhotos(userId, 'matched');
    
    // Combine all photos
    const allPhotos = [...uploadedPhotos, ...matchedPhotos];
    
    // Group photos by event
    const eventMap = new Map<string, any[]>();
    
    // Create default event for photos without event data
    eventMap.set('default-event', []);
    
    let photosWithoutEventInfo = 0;
    
    allPhotos.forEach(photo => {
      let eventId = 'default-event';
      let eventName = 'My Photos';
      let eventDate = photo.date_taken || photo.created_at || new Date().toISOString();
      let eventLocation = 'Unknown Location';
      
      // Check different possible event property structures
      if (photo.event) {
        // Modern structure
        eventId = photo.event.id || photo.event.name || eventId;
        eventName = photo.event.name || eventName;
        eventDate = photo.event.date || eventDate;
        eventLocation = typeof photo.event.location === 'string' ? 
          photo.event.location : 
          (photo.event.location?.name || eventLocation);
      } else if (photo.event_details) {
        // Legacy structure
        eventId = photo.event_details.id || photo.event_details.name || eventId;
        eventName = photo.event_details.name || eventName;
        eventDate = photo.event_details.date || eventDate;
        eventLocation = typeof photo.event_details.location === 'string' ? 
          photo.event_details.location : 
          (photo.event_details.location?.name || eventLocation);
      } else if (photo.eventName) {
        // Alternative structure
        eventId = photo.eventId || photo.eventName || eventId;
        eventName = photo.eventName || eventName;
        eventDate = photo.eventDate || eventDate;
        eventLocation = photo.eventLocation || eventLocation;
      } else {
        // No explicit event info, infer from metadata
        photosWithoutEventInfo++;
        
        // If photo has location data, use that to create location-based events
        if (photo.location && (typeof photo.location === 'string' || photo.location.name)) {
          const locationName = typeof photo.location === 'string' ? 
            photo.location : 
            (photo.location.name || 'Unknown Location');
          
          eventId = `location-${locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          eventName = `Photos at ${locationName}`;
          eventLocation = locationName;
        }
        
        // If photo has a date, create date-based events (by month)
        if (photo.date_taken || photo.created_at) {
          const photoDate = new Date(photo.date_taken || photo.created_at);
          const monthYear = `${photoDate.getFullYear()}-${String(photoDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Only use date-based event if we don't have a location-based one
          if (eventId === 'default-event') {
            eventId = `date-${monthYear}`;
            eventName = new Date(photoDate.getFullYear(), photoDate.getMonth(), 1)
              .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        }
      }
      
      // Create event group if it doesn't exist
      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, []);
      }
      
      // Add event metadata to photo
      const photoWithEventMeta = {
        ...photo,
        _extractedEventData: {
          id: eventId,
          name: eventName,
          date: eventDate,
          location: eventLocation
        }
      };
      
      // Add photo to event group
      eventMap.get(eventId)?.push(photoWithEventMeta);
    });
    
    console.log(`[eventService] Photos without explicit event info: ${photosWithoutEventInfo}/${allPhotos.length}`);
    
    // If default event has no photos, remove it
    if (eventMap.get('default-event')?.length === 0) {
      eventMap.delete('default-event');
    }
    
    // Create event objects
    const events: EventDetail[] = Array.from(eventMap.entries())
      .filter(([_, photos]) => photos.length > 0) // Only include events with photos
      .map(([eventId, photos]) => {
        // Use the first photo's extracted event data
        const firstPhoto = photos[0];
        const eventData = firstPhoto._extractedEventData;
        
        // Use the most recent photo as cover image
        const sortedPhotos = [...photos].sort((a, b) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        
        // Get unique people in the event
        const uniquePeople = new Set<string>();
        photos.forEach(photo => {
          if (photo.people && Array.isArray(photo.people)) {
            photo.people.forEach((person: any) => {
              if (person.id) {
                uniquePeople.add(person.id);
              }
            });
          }
          
          // Also check for faces
          if (photo.faces && Array.isArray(photo.faces)) {
            photo.faces.forEach((face: any) => {
              if (face.person_id) {
                uniquePeople.add(face.person_id);
              }
            });
          }
          
          // Check for matched_users
          if (photo.matched_users && Array.isArray(photo.matched_users)) {
            photo.matched_users.forEach((user: any) => {
              if (typeof user === 'string') {
                uniquePeople.add(user);
              } else if (user.id) {
                uniquePeople.add(user.id);
              }
            });
          }
        });
        
        // Create event detail object
        const eventDetail: EventDetail = {
          id: eventId,
          title: eventData.name,
          date: new Date(eventData.date),
          location: eventData.location,
          photoCount: photos.length,
          coverImage: sortedPhotos[0]?.thumbnail_url || sortedPhotos[0]?.url || '',
          attendees: uniquePeople.size || 1,
          photos: photos // Store photos with event for easy retrieval
        };
        
        return eventDetail;
      });
    
    // Sort events by date descending (newest first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log(`[eventService] Found ${events.length} events`);
    return events;
  } catch (error) {
    console.error('[eventService] Error extracting events:', error);
    return [];
  }
};

/**
 * Get all photos for a specific event
 * @param userId The user ID
 * @param eventId The event ID (which is typically the event name or a generated ID)
 * @returns Array of photos in the event
 */
export const getEventPhotos = async (userId: string, eventId: string): Promise<any[]> => {
  if (!userId || !eventId) {
    console.error('[eventService] Missing userId or eventId for getEventPhotos');
    return [];
  }
  
  try {
    console.log(`[eventService] Fetching photos for event: ${eventId} (user: ${userId})`);
    
    // 1. Fetch all user photos (uploaded and matched)
    // @ts-ignore - Method exists in JS implementation
    const uploadedPhotos = await awsPhotoService.getVisiblePhotos(userId, 'uploaded');
    // @ts-ignore - Method exists in JS implementation
    const matchedPhotos = await awsPhotoService.getVisiblePhotos(userId, 'matched');
    const allPhotos = [...uploadedPhotos, ...matchedPhotos];

    // 2. Filter photos based on the eventId (mimicking the logic in extractEventsFromPhotos)
    const eventPhotos = allPhotos.filter(photo => {
      let currentEventId = 'default-event';
      
      // Check different possible event property structures
      if (photo.event) {
        currentEventId = photo.event.id || photo.event.name || currentEventId;
      } else if (photo.event_details) {
        currentEventId = photo.event_details.id || photo.event_details.name || currentEventId;
      } else if (photo.eventName) {
        currentEventId = photo.eventId || photo.eventName || currentEventId;
      } else {
        // Handle photos without explicit event info (location/date based grouping)
        if (photo.location && (typeof photo.location === 'string' || photo.location.name)) {
          const locationName = typeof photo.location === 'string' ? 
            photo.location : 
            (photo.location.name || 'Unknown Location');
          currentEventId = `location-${locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        }
        
        if (photo.date_taken || photo.created_at) {
          const photoDate = new Date(photo.date_taken || photo.created_at);
          const monthYear = `${photoDate.getFullYear()}-${String(photoDate.getMonth() + 1).padStart(2, '0')}`;
          if (currentEventId === 'default-event') { // Only use date if no location event ID assigned
             currentEventId = `date-${monthYear}`;
          }
        }
      }
      
      // Match the calculated event ID with the requested eventId
      return currentEventId === eventId;
    });

    if (!eventPhotos || eventPhotos.length === 0) {
      console.warn(`[eventService] No photos found matching event ID: ${eventId}`);
      return [];
    }
    
    // Sort photos by date descending
    eventPhotos.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; 
    });

    console.log(`[eventService] Found ${eventPhotos.length} photos for event ID: ${eventId}`);
    
    // Log the first photo object to check its structure
    if (eventPhotos.length > 0) {
      console.log('[eventService] Sample photo object structure:', JSON.stringify(eventPhotos[0], null, 2));
    }
    
    return eventPhotos;
    
  } catch (error) {
    console.error(`[eventService] Error getting photos for event ${eventId}:`, error);
    return [];
  }
}; 