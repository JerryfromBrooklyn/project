import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

// Define proper types for libraries
type Library = "places" | "drawing" | "geometry" | "visualization";
const libraries: Library[] = ["places"];

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface GoogleMapsProps {
  location: Location;
  onLocationChange: (location: Location) => void;
  height?: string;
  className?: string;
}

export const GoogleMaps: React.FC<GoogleMapsProps> = ({
  location,
  onLocationChange,
  height = "100%",
  className
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyAfp-MrsswDkw8NAgm5CYvpcKAG_Ia8c2w',
    libraries,
    version: "weekly"
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = React.useState<google.maps.places.SearchBox | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isLoaded && searchInputRef.current && !searchBox) {
      const searchBoxInstance = new window.google.maps.places.SearchBox(
        searchInputRef.current
      );
      setSearchBox(searchBoxInstance);

      // Listen for the event fired when the user selects a prediction
      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();
        if (!places || places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Update location with place details
        onLocationChange({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name || place.formatted_address || ''
        });

        // Pan map to new location
        if (map) {
          map.panTo(place.geometry.location);
          map.setZoom(15);
        }
      });
    }

    return () => {
      if (searchBox) {
        window.google.maps.event.clearInstanceListeners(searchBox);
      }
    };
  }, [isLoaded, searchBox, map, onLocationChange]);

  if (!isLoaded) {
    return (
      <div className="h-64 bg-apple-gray-100 rounded-apple flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-apple-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location..."
          className="ios-input w-full mb-2"
          defaultValue={location.name}
        />
      </div>
      <div style={{ height, width: '100%' }} className="rounded-apple overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={location.lat && location.lng ? location : { lat: 0, lng: 0 }}
          zoom={location.lat && location.lng ? 15 : 1}
          onClick={(e) => {
            if (e.latLng) {
              onLocationChange({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
                name: location.name || `${e.latLng.lat()}, ${e.latLng.lng()}`
              });
            }
          }}
          onLoad={setMap}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }}
        >
          {location.lat && location.lng && (
            <Marker position={location} />
          )}
        </GoogleMap>
      </div>
    </div>
  );
};
