import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
const libraries = ["places"];
export const GoogleMaps = ({ location, onLocationChange, height = "100%", className }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyAfp-MrsswDkw8NAgm5CYvpcKAG_Ia8c2w',
        libraries,
        version: "weekly"
    });
    const [map, setMap] = React.useState(null);
    const [searchBox, setSearchBox] = React.useState(null);
    const searchInputRef = React.useRef(null);
    // Helper function to get detailed place information
    const getPlaceDetails = React.useCallback((placeId) => {
        if (!isLoaded || !window.google) return Promise.reject('Google Maps not loaded');
        
        return new Promise((resolve, reject) => {
            const service = new window.google.maps.places.PlacesService(map);
            service.getDetails(
                { 
                    placeId: placeId,
                    fields: ['name', 'formatted_address', 'geometry', 'address_components']
                },
                (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                        resolve(place);
                    } else {
                        reject(`Place details request failed: ${status}`);
                    }
                }
            );
        });
    }, [isLoaded, map]);
    React.useEffect(() => {
        if (isLoaded && searchInputRef.current && !searchBox) {
            const searchBoxInstance = new window.google.maps.places.SearchBox(searchInputRef.current);
            setSearchBox(searchBoxInstance);
            // Listen for the event fired when the user selects a prediction
            searchBoxInstance.addListener('places_changed', () => {
                const places = searchBoxInstance.getPlaces();
                if (!places || places.length === 0) return;
                
                const place = places[0];
                if (!place.geometry || !place.geometry.location) return;
                
                // Get more detailed place information if place_id exists
                if (place.place_id) {
                    getPlaceDetails(place.place_id)
                        .then(detailedPlace => {
                            // Update location with detailed place information
                            onLocationChange({
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng(),
                                name: detailedPlace.name || place.name || place.formatted_address || 'Selected Location',
                                address: detailedPlace.formatted_address || 'No address available'
                            });
                            
                            // Pan map to new location
                            if (map) {
                                map.panTo(place.geometry.location);
                                map.setZoom(15);
                            }
                        })
                        .catch(error => {
                            console.error('Error getting place details:', error);
                            // Fallback to basic information
                            onLocationChange({
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng(),
                                name: place.name || place.formatted_address || 'Selected Location',
                                address: place.formatted_address || 'No address available'
                            });
                            
                            // Pan map to new location
                            if (map) {
                                map.panTo(place.geometry.location);
                                map.setZoom(15);
                            }
                        });
                } else {
                    // Fallback if no place_id
                    onLocationChange({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        name: place.name || place.formatted_address || 'Selected Location',
                        address: place.formatted_address || 'No address available'
                    });
                    
                    // Pan map to new location
                    if (map) {
                        map.panTo(place.geometry.location);
                        map.setZoom(15);
                    }
                }
            });
        }
        
        return () => {
            if (searchBox) {
                window.google.maps.event.clearInstanceListeners(searchBox);
            }
        };
    }, [isLoaded, searchBox, map, onLocationChange, getPlaceDetails]);
    if (!isLoaded) {
        return (_jsx("div", { className: "h-64 bg-apple-gray-100 rounded-apple flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 text-apple-gray-400 animate-spin" }) }));
    }
    return (_jsxs("div", { className: className, children: [_jsx("div", { className: "relative", children: _jsx("input", { ref: searchInputRef, type: "text", placeholder: "Search for a location...", className: "ios-input w-full mb-2", defaultValue: location.name || '' }) }), _jsx("div", { style: { height, width: '100%' }, className: "rounded-apple overflow-hidden", children: _jsx(GoogleMap, { mapContainerStyle: { width: '100%', height: '100%' }, center: location.lat && location.lng ? location : { lat: 0, lng: 0 }, zoom: location.lat && location.lng ? 15 : 1, onClick: (e) => {
                        if (e.latLng) {
                            // Get address through reverse geocoding
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode(
                                { location: { lat: e.latLng.lat(), lng: e.latLng.lng() } }, 
                                (results, status) => {
                                    if (status === 'OK' && results[0]) {
                                        // Try to get the place details for better information
                                        if (results[0].place_id) {
                                            getPlaceDetails(results[0].place_id)
                                                .then(detailedPlace => {
                                                    onLocationChange({
                                                        lat: e.latLng.lat(),
                                                        lng: e.latLng.lng(),
                                                        name: detailedPlace.name || results[0].formatted_address || 'Selected Location',
                                                        address: detailedPlace.formatted_address || results[0].formatted_address || 'No address available'
                                                    });
                                                })
                                                .catch(error => {
                                                    console.error('Error getting place details:', error);
                                                    onLocationChange({
                                                        lat: e.latLng.lat(),
                                                        lng: e.latLng.lng(),
                                                        name: results[0].formatted_address || 'Selected Location',
                                                        address: results[0].formatted_address || 'No address available'
                                                    });
                                                });
                                        } else {
                                            onLocationChange({
                                                lat: e.latLng.lat(),
                                                lng: e.latLng.lng(),
                                                name: results[0].formatted_address || 'Selected Location',
                                                address: results[0].formatted_address || 'No address available'
                                            });
                                        }
                                    } else {
                                        // Fallback if geocoding fails
                                        onLocationChange({
                                            lat: e.latLng.lat(),
                                            lng: e.latLng.lng(),
                                            name: 'Selected Location',
                                            address: `${e.latLng.lat()}, ${e.latLng.lng()}`
                                        });
                                    }
                                }
                            );
                        }
                    }, onLoad: setMap, options: {
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false
                    }, children: location.lat && location.lng && (_jsx(Marker, { position: location })) }) })] }));
};
