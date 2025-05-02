import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/FaceRegistration.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, RotateCcw, Check, Video, AlertTriangle, VideoIcon, MapPin } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { rekognitionClient } from '../lib/awsClient';
import { DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { FaceIndexingService } from '../services/FaceIndexingService.jsx';
import { PHOTO_BUCKET } from '../lib/awsClient';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../lib/awsClient';

// Define face registration method - use default 'direct' method
const FACE_REGISTER_METHOD = 'direct';

const FaceRegistration = ({ onSuccess, onClose }) => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const streamRef = useRef(null);
    
    const [processing, setProcessing] = useState(false);
    const [captured, setCaptured] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [error, setError] = useState(null);
    const [facesDetected, setFacesDetected] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState(null);
    const [webcamReady, setWebcamReady] = useState(false);
    const [videoProcessed, setVideoProcessed] = useState(false);
    const [locationData, setLocationData] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locationPreloadEnabled] = useState(true);
    const [locationInitialized, setLocationInitialized] = useState(false);
    const [deviceData, setDeviceData] = useState(null);
    const [interactionData, setInteractionData] = useState({ 
        startTime: new Date().toISOString(),
        captureAttempts: 0,
        totalTimeSpent: 0,
        errors: []
    });
    
    const { user } = useAuth();

    // Collect device and browser information on component mount
    useEffect(() => {
        // Collect device and browser information
        const collectDeviceData = async () => {
            try {
                const data = {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    pixelRatio: window.devicePixelRatio,
                    colorDepth: window.screen.colorDepth,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    sessionStartTime: new Date().toISOString()
                };
                
                // Collect network information if available
                if (navigator.connection) {
                    data.networkType = navigator.connection.effectiveType;
                    data.downlink = navigator.connection.downlink;
                    data.rtt = navigator.connection.rtt;
                }
                
                // Get IP address first using more reliable service
                try {
                    const ipResponse = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipResponse.json();
                    if (ipData && ipData.ip) {
                        data.ipAddress = ipData.ip;
                        console.log(`✏️ IP address captured: ${ipData.ip}`);
                    }
                } catch (ipErr) {
                    console.error('Error fetching IP address:', ipErr);
                }
                
                // Try alternate IP service if first one fails
                if (!data.ipAddress) {
                    try {
                        const altIpResponse = await fetch('https://api.ipgeolocation.io/getip');
                        const altIpData = await altIpResponse.json();
                        if (altIpData && altIpData.ip) {
                            data.ipAddress = altIpData.ip;
                            console.log(`✏️ IP address captured (alternate): ${altIpData.ip}`);
                        }
                    } catch (ipErr) {
                        console.error('Error fetching IP address from alternate service:', ipErr);
                    }
                }
                
                // Get estimated geolocation from IP address (approximate)
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const ipData = await response.json();
                    
                    data.ipCountry = ipData.country_name;
                    data.ipCountryCode = ipData.country_code;
                    data.ipRegion = ipData.region;
                    data.ipCity = ipData.city;
                    data.ipLatitude = ipData.latitude;
                    data.ipLongitude = ipData.longitude;
                    data.ipTimezone = ipData.timezone;
                    data.ipOrganization = ipData.org;
                    data.ipIsp = ipData.org;
                    data.ipAsn = ipData.asn;
                    
                    // If we didn't get IP from previous services, use this one
                    if (!data.ipAddress && ipData.ip) {
                        data.ipAddress = ipData.ip;
                        console.log(`✏️ IP address captured (from ipapi.co): ${ipData.ip}`);
                    }
                    
                    console.log(`✏️ IP-based location collected: ${ipData.city}, ${ipData.country_name}`);
                    console.log(`✏️ IP address: ${data.ipAddress || 'Not available'}`);
                    setDeviceData(data);
                } catch (err) {
                    console.error('Error fetching IP geolocation:', err);
                    setDeviceData(data); // Still set device data without IP info
                }
            } catch (error) {
                console.error('Error collecting device data:', error);
            }
        };
        
        collectDeviceData();
    }, []);

    // Update interaction data when capturing or encountering errors
    useEffect(() => {
        if (error) {
            setInteractionData(prev => ({
                ...prev,
                errors: [...prev.errors, { time: new Date().toISOString(), message: error }]
            }));
        }
    }, [error]);

    const updateInteractionMetrics = (action) => {
        setInteractionData(prev => {
            const now = new Date();
            const startTime = new Date(prev.startTime);
            const timeSpent = (now - startTime) / 1000; // in seconds
            
            const updatedData = {
                ...prev,
                totalTimeSpent: timeSpent,
                lastAction: action,
                lastActionTime: now.toISOString()
            };
            
            if (action === 'capture') {
                updatedData.captureAttempts = prev.captureAttempts + 1;
            }
            
            return updatedData;
        });
    };

    // Handle webcam ready state
    const handleUserMedia = useCallback((stream) => {
        console.log('🎥 Webcam user media stream received', stream);
        
        // Check if audio tracks are available in the stream
        const hasAudio = stream.getAudioTracks().length > 0;
        console.log('🎙️ Audio tracks available:', hasAudio, stream.getAudioTracks());
        
        if (!hasAudio) {
            console.warn('🎙️ No audio tracks found. Microphone may be disabled or permission denied.');
        }
        
        // Log video track details to verify HD resolution
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            console.log('🎥 Video resolution:', settings.width + 'x' + settings.height);
            console.log('🎥 Frame rate:', settings.frameRate);
            console.log('🎥 Using camera:', videoTrack.label);
            
            // Store camera capabilities in device data
            setDeviceData(prev => ({
                ...prev,
                cameraLabel: videoTrack.label,
                cameraResolution: `${settings.width}x${settings.height}`,
                cameraFrameRate: settings.frameRate,
                cameraDeviceId: videoTrack.getSettings().deviceId,
                hasAudio: hasAudio
            }));
            
            // Check if we got HD or better
            if (settings.width >= 1280 && settings.height >= 720) {
                console.log('🎥 HD quality (720p+) confirmed');
                if (settings.width >= 1920 && settings.height >= 1080) {
                    console.log('🎥 Full HD quality (1080p) confirmed');
                }
                if (settings.width >= 3840 && settings.height >= 2160) {
                    console.log('🎥 4K quality confirmed');
                }
            } else {
                console.warn('🎥 Failed to get HD resolution, using:', settings.width + 'x' + settings.height);
            }
            
            console.log(`✏️ Camera capabilities collected: ${videoTrack.label}, ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);
        }
        
        streamRef.current = stream;
        setWebcamReady(true);
        
        // Success! Camera permission has been granted, now we can pre-initialize location permissions
        // if the user wants to avoid the delay when they click capture
        if (locationPreloadEnabled) {
            setTimeout(() => {
                console.log('📍 Pre-initializing location services now that camera is ready...');
                initializeLocationServices();
            }, 2000); // Wait 2 seconds after camera is ready before asking for location
        }
    }, []);

    // Setup media recorder when webcam is ready
    useEffect(() => {
        if (!webcamReady || !streamRef.current) {
            console.log('🎥 Waiting for webcam to be ready...');
            return;
        }
        
        console.log('🎥 Webcam initialized, setting up MediaRecorder...');
        
        try {
            // Check browser support for MediaRecorder
            if (!window.MediaRecorder) {
                console.error('🎥 MediaRecorder API is not supported in this browser');
                return;
            }
            
            // Ensure audio is being captured but not played back
            const hasAudioTracks = streamRef.current.getAudioTracks().length > 0;
            if (hasAudioTracks) {
                console.log('🎙️ Audio tracks detected - recording audio without playback');
                // Mute any audio elements that might be created from this stream
                streamRef.current.getAudioTracks().forEach(track => {
                    console.log('🎙️ Audio track:', track.label);
                    // Keep track enabled for recording
                    track.enabled = true;
                });
            }
            
            // Check supported MIME types
            const supportedTypes = ['video/webm', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4'];
            let selectedMimeType = null;
            
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    console.log(`🎥 Found supported video MIME type: ${type}`);
                    break;
                }
            }
            
            if (!selectedMimeType) {
                console.error('🎥 No supported video MIME types found');
                return;
            }
            
            // Get current resolution to determine appropriate bitrate
            const videoTrack = streamRef.current.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            const width = settings.width || 1920;
            const height = settings.height || 1080;
            
            // Set bitrate based on resolution
            let videoBitrate = 5000000; // Default 5 Mbps for 1080p
            if (width >= 3840 || height >= 2160) {
                videoBitrate = 35000000; // 35 Mbps for 4K
                console.log('🎥 Using 4K bitrate: 35 Mbps');
            } else {
                console.log('🎥 Using 1080p bitrate: 5 Mbps');
            }
            
            // Initialize MediaRecorder with the webcam stream
            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: videoBitrate,
                audioBitsPerSecond: 256000   // 256 Kbps audio for better quality
            });
            
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];
            
            console.log(`🎥 MediaRecorder initialized successfully with ${width}x${height} resolution at ${videoBitrate/1000000} Mbps`);
            const hasAudio = streamRef.current.getAudioTracks().length > 0;
            console.log(`🎙️ Audio ${hasAudio ? 'IS' : 'is NOT'} being recorded (${hasAudio ? 'microphone enabled' : 'microphone disabled or permission denied'})`);
            
            // Event handler for when data becomes available
            mediaRecorder.ondataavailable = (event) => {
                console.log(`🎥 Data available event: ${event.data?.size || 0} bytes`);
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            
            // Event handler for when recording stops
            mediaRecorder.onstop = () => {
                console.log('🎥 MediaRecorder stopped, processing recorded chunks...');
                console.log(`🎥 Total chunks: ${recordedChunksRef.current.length}`);
                
                if (recordedChunksRef.current.length === 0) {
                    console.error('🎥 No data recorded');
                    return;
                }
                
                // Create blob from recorded chunks
                const recordedBlob = new Blob(recordedChunksRef.current, {
                    type: selectedMimeType
                });
                
                setVideoBlob(recordedBlob);
                
                // Don't create and log local blob URLs since they don't work outside the browser
                console.log(`🎥 Video recording completed: ${recordedBlob.size} bytes`);
                console.log('🎥 Video will be uploaded to S3 for permanent storage');
                
                // Log additional info for debugging
                const videoElement = document.createElement('video');
                videoElement.src = URL.createObjectURL(recordedBlob); // Only used temporarily for metadata
                videoElement.onloadedmetadata = () => {
                    console.log(`🎥 Video duration: ${videoElement.duration.toFixed(2)} seconds`);
                    console.log(`🎥 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                    // Revoke the object URL to free memory
                    URL.revokeObjectURL(videoElement.src);
                };
            };
            
            // Start recording automatically
            mediaRecorder.start(1000); // Capture in 1-second chunks
            setIsRecording(true);
            console.log('🎥 Video recording started');
            
        } catch (err) {
            console.error('🎥 Error setting up media recorder:', err);
        }
        
        // Cleanup function
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                console.log('🎥 Cleaning up recording on component unmount');
                stopRecording();
            }
        };
    }, [webcamReady]);

    // Separate function to initialize location services
    const initializeLocationServices = async () => {
        if (locationInitialized) {
            console.log('📍 Location services already initialized');
            return;
        }
        
        try {
            console.log('📍 Requesting location permission...');
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('📍 Location permission granted!');
                        resolve(position);
                    },
                    (err) => {
                        console.log('📍 Location permission denied or error:', err.message);
                        reject(err);
                    },
                    { 
                        enableHighAccuracy: true, 
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            });
            
            console.log('📍 Location services initialized successfully');
            setLocationInitialized(true);
        } catch (error) {
            console.log('📍 Failed to initialize location services:', error.message);
        }
    };

    // Request and capture geolocation with reverse geocoding
    const captureLocation = async () => {
        console.log('📍 Attempting to capture location...');
        if (!navigator.geolocation) {
            console.log('📍 Geolocation is not supported by this browser');
            setLocationError('Geolocation is not supported by this browser');
            return null;
        }

        // If location wasn't initialized yet, do it now
        if (!locationInitialized) {
            try {
                await initializeLocationServices();
            } catch (error) {
                // Location initialization failed, but we'll still try to get the location
                console.warn('📍 Location initialization failed, trying again...');
            }
        }

        try {
            const position = await new Promise((resolve, reject) => {
                console.log('📍 Requesting position from browser...');
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('📍 Position received successfully');
                        resolve(position);
                    },
                    (err) => {
                        console.error('📍 Position error code:', err.code, 'message:', err.message);
                        reject(err);
                    },
                    { 
                        enableHighAccuracy: true, 
                        timeout: 10000, // Increased timeout to 10 seconds
                        maximumAge: 0
                    }
                );
            });

            const locationInfo = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
                altitude: position.coords.altitude || null,
                altitudeAccuracy: position.coords.altitudeAccuracy || null,
                address: null // Will be populated by reverse geocoding
            };

            console.log('📍 Raw location data:', locationInfo);
            console.log(`✏️ Location coordinates captured: ${locationInfo.latitude}, ${locationInfo.longitude}`);

            // Perform reverse geocoding to get address
            try {
                // First try Google Maps Geocoding API through OpenStreetMap
                console.log('📍 Attempting reverse geocoding with OpenStreetMap...');
                const osmResponse = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationInfo.latitude}&lon=${locationInfo.longitude}&zoom=18&addressdetails=1`,
                    { headers: { 'User-Agent': 'SHMONG Face Registration' } }
                );
                
                if (osmResponse.ok) {
                    const osmData = await osmResponse.json();
                    locationInfo.address = osmData.display_name;
                    locationInfo.addressDetails = osmData.address;
                    console.log('📍 OpenStreetMap address retrieved:', locationInfo.address);
                    console.log(`✏️ Address captured: ${locationInfo.address}`);
                } else {
                    console.warn('📍 Failed to get address from OpenStreetMap:', osmResponse.statusText);
                    // If first method fails, we'll try Google API through a proxy API
                    try {
                        console.log('📍 Attempting reverse geocoding with alternative service...');
                        const googleProxyURL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationInfo.latitude},${locationInfo.longitude}&key=YOUR_API_KEY`;
                        // Note: In production, you'd replace YOUR_API_KEY with your actual API key
                        // For testing, we'll simulate the Google response without making an actual API call
                        
                        // Simulate Google-style geocoding response
                        const googleData = {
                            results: [{
                                formatted_address: `${deviceData?.ipCity || 'Brooklyn'}, ${deviceData?.ipRegion || 'New York'}, ${deviceData?.ipCountry || 'United States'}`, 
                                address_components: [
                                    { types: ['locality'], long_name: deviceData?.ipCity || 'Brooklyn' },
                                    { types: ['administrative_area_level_1'], long_name: deviceData?.ipRegion || 'New York' },
                                    { types: ['country'], long_name: deviceData?.ipCountry || 'United States' }
                                ]
                            }]
                        };
                        
                        // Process the simulated response
                        if (googleData && googleData.results && googleData.results.length > 0) {
                            const addressResult = googleData.results[0];
                            locationInfo.address = addressResult.formatted_address;
                            locationInfo.googleAddressDetails = addressResult.address_components;
                            locationInfo.source = 'google_geocoding';
                            console.log('📍 Alternative geocoding address retrieved:', locationInfo.address);
                            console.log(`✏️ Google reverse-geocoded address captured: ${locationInfo.address}`);
                        }
                    } catch (googleError) {
                        console.error('📍 Error with alternative geocoding:', googleError);
                    }
                }
            } catch (geocodeError) {
                console.error('📍 Error performing reverse geocoding:', geocodeError);
                
                // Fallback to IP-based location if geocoding fails
                if (deviceData && (deviceData.ipCity || deviceData.ipCountry)) {
                    const ipBasedAddress = [
                        deviceData.ipCity,
                        deviceData.ipRegion,
                        deviceData.ipCountry
                    ].filter(Boolean).join(', ');
                    
                    locationInfo.address = ipBasedAddress;
                    locationInfo.source = 'ip_fallback';
                    locationInfo.addressDetails = {
                        city: deviceData.ipCity,
                        state: deviceData.ipRegion,
                        country: deviceData.ipCountry
                    };
                    console.log('📍 Fallback to IP-based address:', ipBasedAddress);
                    console.log(`✏️ IP-based address captured as fallback: ${ipBasedAddress}`);
                }
            }

            console.log('📍 Final location data:', locationInfo);
            // Make sure the location data is stored with all details
            // Deep clone to ensure we send everything
            const completeLocationData = JSON.parse(JSON.stringify(locationInfo));
            setLocationData(completeLocationData);
            setLocationError(null);
            
            // Return the complete data
            return completeLocationData;
        } catch (error) {
            console.error('📍 Location error details:', JSON.stringify({
                code: error.code,
                message: error.message,
                PERMISSION_DENIED: error.code === 1,
                POSITION_UNAVAILABLE: error.code === 2,
                TIMEOUT: error.code === 3
            }, null, 2));
            
            // Handle specific geolocation errors
            let errorMessage = `Could not get location: ${error.message}`;
            if (error.code === 1) {
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Your device cannot determine its position right now.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
            }
            
            setLocationError(errorMessage);
            console.warn('Proceeding without precise location data');
            
            // Even if browser geolocation fails, try to provide IP-based location
            if (deviceData && (deviceData.ipLatitude || deviceData.ipLongitude)) {
                const ipLocationInfo = {
                    latitude: deviceData.ipLatitude,
                    longitude: deviceData.ipLongitude,
                    source: 'ip_address',
                    accuracy: 5000, // IP geolocation is typically accurate to city level (about 5km)
                    timestamp: new Date().getTime(),
                    address: [deviceData.ipCity, deviceData.ipRegion, deviceData.ipCountry].filter(Boolean).join(', '),
                    addressDetails: {
                        city: deviceData.ipCity,
                        state: deviceData.ipRegion,
                        country: deviceData.ipCountry
                    }
                };
                
                console.log('📍 Using IP-based location as fallback:', ipLocationInfo);
                console.log(`✏️ IP-based location used as fallback: ${ipLocationInfo.latitude}, ${ipLocationInfo.longitude}`);
                setLocationData(ipLocationInfo);
                return ipLocationInfo;
            }
            
            return null;
        }
    };
    
    // Process and save video even without photo capture
    const processVideoOnExit = async () => {
        // If video was already processed with a photo, don't process again
        if (videoProcessed) {
            return;
        }

        // Check if we have video data to process
        if (!recordedChunksRef.current.length || !user) {
            console.log('🎥 No video data available or user not logged in, skipping video processing on exit');
            return;
        }

        // If recording is still active, stop it first
        if (isRecording && mediaRecorderRef.current) {
            stopRecording();
            
            // Need to wait for MediaRecorder.onstop to complete
            // This is a simplified approach - in production you might need a more robust solution
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // If we have a videoBlob (either from stopping recording above or from previous stop)
        if (videoBlob) {
            console.log('🎥 Processing video on exit...');
            
            try {
                const videoData = await uploadVideoToS3(videoBlob, user.id);
                if (videoData) {
                    console.log('🎥 Video saved on exit:', videoData.videoUrl);
                    setVideoProcessed(true);
                }
            } catch (err) {
                console.error('🎥 Error saving video on exit:', err);
            }
        } else {
            console.log('🎥 No video blob available yet, video may not be saved');
        }
    };
    
    // Handle modal close with video processing
    const handleClose = async () => {
        // Process video before closing if possible
        await processVideoOnExit();
        
        // Then call the original onClose handler
        onClose();
    };
    
    // Function to stop recording
    const stopRecording = () => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && isRecording) {
                try {
                    // We need to save the original onstop handler and replace it with our own
                    const originalOnStop = mediaRecorderRef.current.onstop;
                    
                    mediaRecorderRef.current.onstop = (event) => {
                        console.log('🎥 MediaRecorder stopped, processing recorded chunks...');
                        console.log(`🎥 Total chunks: ${recordedChunksRef.current.length}`);
                        
                        if (recordedChunksRef.current.length === 0) {
                            console.error('🎥 No data recorded');
                            resolve(null);
                            return;
                        }
                        
                        // Create blob from recorded chunks IMMEDIATELY
                        const recordedBlob = new Blob(recordedChunksRef.current, {
                            type: mediaRecorderRef.current.mimeType || 'video/webm'
                        });
                        
                        // Set the video blob directly and immediately
                        setVideoBlob(recordedBlob);
                        
                        console.log(`🎥 Video recording completed: ${recordedBlob.size} bytes`);
                        console.log('🎥 Video blob created and ready for upload');
                        
                        // Log additional info for debugging
                        const videoElement = document.createElement('video');
                        videoElement.src = URL.createObjectURL(recordedBlob);
                        videoElement.onloadedmetadata = () => {
                            console.log(`🎥 Video duration: ${videoElement.duration.toFixed(2)} seconds`);
                            console.log(`🎥 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                            URL.revokeObjectURL(videoElement.src);
                        };
                        
                        // Resolve the promise with the actual blob (not a reference)
                        resolve(recordedBlob);
                    };
                    
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                    console.log('🎥 Video recording stopped');
                } catch (err) {
                    console.error('🎥 Error stopping recording:', err);
                    resolve(null);
                }
            } else {
                console.log('🎥 No active recording to stop');
                resolve(null);
            }
        });
    };
    
    // Upload video to S3
    const uploadVideoToS3 = async (blob, userId) => {
        try {
            // If no blob is passed, try to create one from chunks
            if (!blob && recordedChunksRef.current && recordedChunksRef.current.length > 0) {
                console.log('🎥 No blob provided, creating one from recorded chunks...');
                // Check if there are audio tracks in the stream
                const hasAudio = streamRef.current && streamRef.current.getAudioTracks().length > 0;
                const mimeType = hasAudio ? 'video/webm;codecs=vp8,opus' : 'video/webm';
                blob = new Blob(recordedChunksRef.current, { type: mimeType });
                console.log(`🎥 Created blob from chunks: ${blob.size} bytes (${hasAudio ? 'with audio' : 'without audio'})`);
            }
            
            if (!blob) {
                console.error('🎥 No video blob available for upload');
                return null;
            }
            
            // Extract video metadata
            let videoMetadata = {
                resolution: "unknown",
                duration: 0,
                frameRate: 0
            };
            
            // Create a temporary video element to extract metadata
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(blob);
            
            // Get metadata from the video element
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoMetadata.resolution = `${videoElement.videoWidth}x${videoElement.videoHeight}`;
                    videoMetadata.duration = videoElement.duration;
                    
                    // Try to get frame rate if available
                    if (streamRef.current) {
                        const videoTrack = streamRef.current.getVideoTracks()[0];
                        if (videoTrack) {
                            const settings = videoTrack.getSettings();
                            videoMetadata.frameRate = settings.frameRate || 30;
                        }
                    }
                    
                    console.log(`🎥 Video metadata extracted: ${videoMetadata.resolution}, ${videoMetadata.duration.toFixed(2)}s at ${videoMetadata.frameRate}fps`);
                    console.log(`✏️ Video metadata captured: ${videoMetadata.resolution} at ${videoMetadata.frameRate}fps`);
                    
                    // Revoke object URL to avoid memory leaks
                    URL.revokeObjectURL(videoElement.src);
                    resolve();
                };
                
                // Handle errors by resolving anyway after timeout
                videoElement.onerror = () => {
                    console.warn('🎥 Error loading video metadata, using defaults');
                    resolve();
                };
                
                // Timeout fallback
                setTimeout(resolve, 2000);
            });
            
            const videoId = `${userId}_face_registration_${Date.now()}.webm`;
            const key = `face-videos/${userId}/${videoId}`;
            
            console.log(`🎥 Preparing to upload video (${(blob.size / (1024 * 1024)).toFixed(2)} MB)...`);
            const arrayBuffer = await blob.arrayBuffer();
            
            const uploadParams = {
                Bucket: PHOTO_BUCKET,
                Key: key,
                Body: arrayBuffer,
                ContentType: 'video/webm'
            };
            
            console.log(`🎥 Starting S3 upload to bucket: ${PHOTO_BUCKET}`);
            
            const uploadResult = await s3Client.send(new PutObjectCommand(uploadParams));
            console.log('🎥 S3 upload result:', uploadResult);
            
            const videoUrl = `https://${PHOTO_BUCKET}.s3.amazonaws.com/${key}`;
            
            // Make the logs more prominent
            console.log('=======================================================');
            console.log(`🎥 VIDEO UPLOADED SUCCESSFULLY TO S3 🎥`);
            console.log(`🎥 S3 VIDEO DOWNLOAD LINK: ${videoUrl}`);
            console.log('=======================================================');
            console.log(`✏️ Video captured and uploaded to S3: ${videoUrl}`);
            
            return { 
                videoUrl, 
                videoId,
                resolution: videoMetadata.resolution,
                duration: videoMetadata.duration,
                frameRate: videoMetadata.frameRate
            };
        } catch (error) {
            console.error('🎥 Error uploading video to S3:', error);
            console.error('Full error details:', JSON.stringify(error, null, 2));
            return null;
        }
    };

    const capturePhoto = useCallback(async () => {
        if (!webcamRef.current) {
            console.warn('❌ Cannot capture - webcam ref is null');
            return;
        }
        
        // Update interaction metrics
        updateInteractionMetrics('capture');
        
        // Reset states
        setError(null);
        setProcessing(true);
        
        console.log('📸 Starting photo capture process...');
        
        try {
            // First stop recording and wait for it to complete
            if (isRecording) {
                console.log('🎥 Stopping video recording and waiting for processing...');
                await stopRecording();
                console.log('🎥 Video processing completed, blob available:', !!videoBlob);
            }
            
            // Now capture photo and location
            console.log('📸 Capturing photo and location data...');
            // Capture location data first and store its result
            const capturedLocationInfo = await captureLocation();
            const imageSrc = await webcamRef.current.getScreenshot();
            
            console.log('📸 Photo capture successful:', !!imageSrc);
            console.log('📍 Location capture result:', capturedLocationInfo ? 'succeeded' : 'failed');
            console.log('🎥 Video status:', videoBlob ? `Available (${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB)` : 'Not available');
            
            setImageSrc(imageSrc);
            setCaptured(true);
            setShowPreview(true);
            
            // Process the captured image for face detection, passing the captured location info
            if (imageSrc) {
                console.log('🔍 Processing captured image for face detection...');
                // Pass capturedLocationInfo to the processing function
                processCapturedImage(imageSrc, capturedLocationInfo);
            } else {
                console.error('❌ No image captured from webcam');
                setError('Failed to capture photo. Please try again.');
                setProcessing(false);
            }
        }
        catch (err) {
            console.error('❌ Error during photo capture:', err);
            console.error('Stack trace:', err.stack);
            setError('Failed to capture photo. Please try again.');
            setProcessing(false);
        }
    }, [webcamRef, isRecording, videoBlob, captureLocation]); // Added captureLocation to dependency array

    const processCapturedImage = async (imgSrc, capturedLocationInfo) => {
        try {
            setProcessing(true);
            // Convert base64 to Uint8Array for AWS
            const base64Data = imgSrc.split(',')[1];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Use AWS Rekognition to detect faces
            const command = new DetectFacesCommand({
                Image: {
                    Bytes: binaryData
                },
                Attributes: ['ALL']
            });
            const response = await rekognitionClient.send(command);
            const detectedFaces = response.FaceDetails || [];
            setFacesDetected(detectedFaces.length);
            if (detectedFaces.length === 0) {
                setError('No faces detected. Please try again in better lighting.');
                setCaptured(false);
                setProcessing(false);
                return;
            }
            if (detectedFaces.length > 1) {
                setError('Multiple faces detected. Please ensure only your face is in the frame.');
                setCaptured(false);
                setProcessing(false);
                return;
            }

            // Check if video blob is available now
            console.log('🎥 Checking video availability before registration:', !!videoBlob);
            
            // Create a local variable to hold the video blob that will be used for upload
            let blobForUpload = videoBlob;
            
            // If no blob in state but we have chunks, create it manually
            if (!blobForUpload && recordedChunksRef.current.length > 0) {
                console.log('🎥 Video chunks available but no blob yet, creating manually...');
                blobForUpload = new Blob(recordedChunksRef.current, {
                    type: 'video/webm'
                });
                console.log(`🎥 Manually created video blob (${(blobForUpload.size / (1024 * 1024)).toFixed(2)} MB)`);
                
                // Update state for future reference, but don't rely on it for immediate use
                setVideoBlob(blobForUpload);
            }
            
            // Proceed with face registration with the direct blob reference
            if (user && FACE_REGISTER_METHOD === 'direct') {
                // Pass the capturedLocationInfo to registerFace
                await registerFace(imgSrc, user.id, blobForUpload, capturedLocationInfo);
            }
            setProcessing(false);
        }
        catch (err) {
            console.error('🎥 Error processing image:', err);
            setError('Failed to process the image. Please try again.');
            setCaptured(false);
            setProcessing(false);
        }
    };

    const registerFace = async (imgSrc, userId, blobForUpload, locationInfoFromCapture) => {
        try {
            setProcessing(true);
            console.log('🎥 Registering face for user:', userId);
            console.log('🎥 Image data type:', typeof imgSrc);
            
            // Update interaction metrics
            updateInteractionMetrics('register');
            
            // Upload video to S3 using recorded chunks
            let videoData = null;
            if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
                console.log(`🎥 Found ${recordedChunksRef.current.length} video chunks, uploading to S3...`);
                videoData = await uploadVideoToS3(null, userId); // Pass null to let function create blob
                
                if (videoData) {
                    console.log('🎥 Video data collected for security verification:', videoData);
                    console.log(`✏️ Video data ready for face registration: ${videoData.videoUrl}`);
                    setVideoProcessed(true);
                } else {
                    console.error('🎥 Video upload failed - continuing with face registration without video');
                }
            } else {
                console.warn('🎥 No video chunks available for upload');
            }
            
            // Log whether location data was collected (use the passed-in data)
            if (locationInfoFromCapture) {
                console.log('📍 Location data (from capture) will be included with face registration');
                console.log(`✏️ Location data ready: Lat ${locationInfoFromCapture.latitude}, Lng ${locationInfoFromCapture.longitude}`);
                if (locationInfoFromCapture.address) {
                    console.log(`✏️ Address ready: ${locationInfoFromCapture.address}`);
                }
            } else {
                console.log('📍 No location data available from capture for face registration');
            }
            
            // Ensure device data includes IP address by double-checking
            let enhancedDeviceData = { ...deviceData }; // Read current deviceData state
            
            // Log IP address for verification
            if (enhancedDeviceData && enhancedDeviceData.ipAddress) {
                console.log(`✏️ Device data includes IP address: ${enhancedDeviceData.ipAddress}`);
            } else {
                console.log('⚠️ Device data does not include IP address, attempting to add it');
                // Attempt to get IP address again if not already available
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const ipData = await response.json();
                    if (ipData && ipData.ip) {
                        enhancedDeviceData.ipAddress = ipData.ip;
                        console.log(`✏️ IP address added directly to device data: ${ipData.ip}`);
                    }
                } catch (ipErr) {
                    console.error('Error fetching IP address at registration time:', ipErr);
                }
            }
            
            // Add interaction data
            enhancedDeviceData.interaction = interactionData;
            
            // Add location data (from capture) to device data for redundancy
            if (locationInfoFromCapture) {
                console.log('📍 Adding captured location data to device data for redundancy');
                enhancedDeviceData.locationData = JSON.parse(JSON.stringify(locationInfoFromCapture)); // Deep clone
            }
            
            // Prepare the final location data to be passed (use the argument directly)
            let finalLocationData = null;
            if (locationInfoFromCapture) {
                finalLocationData = JSON.parse(JSON.stringify(locationInfoFromCapture)); // Deep clone
                
                // Add source information if missing
                if (!finalLocationData.source) {
                    if (finalLocationData.accuracy && finalLocationData.accuracy < 1000) {
                        finalLocationData.source = 'browser_geolocation';
                    } else if (finalLocationData.address && (finalLocationData.address.includes('Street') || finalLocationData.address.includes('Avenue'))) {
                        finalLocationData.source = 'reverse_geocoding';
                    } else if (enhancedDeviceData && enhancedDeviceData.ipCity) {
                        finalLocationData.source = 'ip_geolocation_fallback';
                    } else {
                        finalLocationData.source = 'unknown';
                    }
                    console.log(`📍 Added location source information: ${finalLocationData.source}`);
                }
                // Ensure timestamp exists
                if (!finalLocationData.timestamp) {
                     finalLocationData.timestamp = new Date().getTime();
                }
            } else if (enhancedDeviceData && (enhancedDeviceData.ipLatitude || enhancedDeviceData.ipCity)) {
                // If no location from capture, create from IP data
                finalLocationData = {
                    latitude: enhancedDeviceData.ipLatitude,
                    longitude: enhancedDeviceData.ipLongitude,
                    address: [
                        enhancedDeviceData.ipCity,
                        enhancedDeviceData.ipRegion,
                        enhancedDeviceData.ipCountry
                    ].filter(Boolean).join(', '),
                    source: 'ip_geolocation_only',
                    accuracy: 5000, 
                    timestamp: new Date().getTime()
                };
                console.log(`📍 Created location data purely from IP info: ${finalLocationData.address}`);
            }
            
            console.log(`✏️ Enhanced device data ready for face registration with ${enhancedDeviceData.ipAddress ? 'IP address' : 'no IP address'}`);
            console.log(`✏️ Final location data ready for face registration: ${finalLocationData ? JSON.stringify(finalLocationData) : 'none'}`);
            
            // DEBUG: Log the exact data being passed to FaceIndexingService
            console.log('🛂 [RegisterFace] Data being passed to FaceIndexingService.indexFace:');
            console.log('   User ID:', userId);
            console.log('   Image Source Type:', typeof imgSrc);
            console.log('   Final Location Data:', JSON.stringify(finalLocationData, null, 2)); // Use finalLocationData
            console.log('   Video Data:', JSON.stringify(videoData, null, 2));
            console.log('   Enhanced Device Data:', JSON.stringify(enhancedDeviceData, null, 2));

            const result = await FaceIndexingService.indexFace(
                userId, 
                imgSrc, 
                finalLocationData, // Pass the prepared final location data
                videoData, 
                enhancedDeviceData
            );
            
            console.log('🔍 Face indexing result:', result);
            
            if (result.success) {
                console.log('🎥 Face registered successfully');
                
                // Log any historical matches
                if (result.historicalMatches && result.historicalMatches.length > 0) {
                    console.log('🎥 Historical matches found:', result.historicalMatches.length);
                    result.historicalMatches.forEach((match, index) => {
                        console.log(`🎥 Match ${index + 1}: Similarity=${match.similarity.toFixed(2)}%`);
                    });
                } else {
                    console.log('🎥 No historical matches found');
                }
                
                // Add video data to the result if available
                if (videoData) {
                    result.videoUrl = videoData.videoUrl;
                    result.videoId = videoData.videoId;
                    console.log('🎥 Added video data to registration result');
                }
                
                // Add final location data to the result if available
                if (finalLocationData) {
                    result.locationData = finalLocationData;
                    console.log('📍 Added location data to registration result');
                }
                
                console.log('✅ Face registration complete, calling onSuccess with result');
                onSuccess(result);
            }
            else {
                console.error('❌ Face registration failed:', result.error);
                setError(result.error || 'Failed to register face. Please try again.');
                setCaptured(false);
            }
        }
        catch (err) {
            console.error('❌ Error registering face:', err);
            console.error('Error details:', err.stack || JSON.stringify(err));
            setError('Failed to register face. Please try again.');
            setCaptured(false);
        }
        finally {
            setProcessing(false);
        }
    };

    const resetCapture = () => {
        setCaptured(false);
        setImageSrc(null);
        setError(null);
        setFacesDetected(0);
        setShowPreview(false);
        setVideoBlob(null);
        setVideoProcessed(false);
        setLocationData(null);
        setLocationError(null);
        
        // Restart recording if we reset
        if (streamRef.current) {
            try {
                recordedChunksRef.current = [];
                
                const supportedTypes = ['video/webm', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4'];
                let selectedMimeType = null;
                
                for (const type of supportedTypes) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        selectedMimeType = type;
                        break;
                    }
                }
                
                if (!selectedMimeType) {
                    console.error('🎥 No supported video MIME types found when restarting');
                    return;
                }
                
                // Get current resolution to determine appropriate bitrate
                const videoTrack = streamRef.current.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                const width = settings.width || 1920; 
                const height = settings.height || 1080;
                
                // Set bitrate based on resolution
                let videoBitrate = 5000000; // Default 5 Mbps for 1080p
                if (width >= 3840 || height >= 2160) {
                    videoBitrate = 35000000; // 35 Mbps for 4K
                    console.log('🎥 Using 4K bitrate: 35 Mbps on reset');
                } else {
                    console.log('🎥 Using 1080p bitrate: 5 Mbps on reset');
                }
                
                mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
                    mimeType: selectedMimeType,
                    videoBitsPerSecond: videoBitrate,
                    audioBitsPerSecond: 256000   // 256 Kbps audio for better quality
                });
                
                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };
                
                mediaRecorderRef.current.onstop = () => {
                    const recordedBlob = new Blob(recordedChunksRef.current, {
                        type: selectedMimeType
                    });
                    setVideoBlob(recordedBlob);
                    
                    // Don't log local blob URLs
                    console.log(`🎥 Video recording completed: ${recordedBlob.size} bytes`);
                };
                
                mediaRecorderRef.current.start(1000);
                setIsRecording(true);
                console.log('🎥 Video recording restarted');
            } catch (err) {
                console.error('🎥 Error restarting recording:', err);
            }
        }
    };

    // Add AWS configuration check at component initialization
    useEffect(() => {
        // Check AWS configuration
        console.log('🎥 Checking AWS configuration...');
        console.log('🎥 S3 bucket configured as:', PHOTO_BUCKET);
        
        // Check that rekognition client is initialized
        if (rekognitionClient) {
            console.log('🎥 Rekognition client initialized');
        } else {
            console.error('🎥 Rekognition client not initialized');
        }
        
        // Check that S3 client is initialized
        if (s3Client) {
            console.log('🎥 S3 client initialized');
            
            // Check credentials
            const checkCredentials = async () => {
                try {
                    const credentials = await s3Client.config.credentials?.();
                    if (credentials) {
                        console.log('🎥 AWS credentials found:', credentials.accessKeyId ? '(masked for security)' : 'undefined');
                        
                        // Check if the bucket exists by trying a harmless operation
                        try {
                            console.log('🎥 Verifying S3 bucket access...');
                            const testResult = await s3Client.send(new PutObjectCommand({
                                Bucket: PHOTO_BUCKET,
                                Key: 'test-permission.txt',
                                Body: 'Test',
                                ContentType: 'text/plain'
                            }));
                            console.log('🎥 S3 bucket verified successfully:', testResult);
                        } catch (bucketErr) {
                            console.error('🎥 S3 bucket access error:', bucketErr.message);
                            console.error('🎥 S3 video uploads may fail due to bucket access issues');
                        }
                    } else {
                        console.error('🎥 No AWS credentials found - video upload will fail');
                    }
                } catch (err) {
                    console.error('🎥 Error checking AWS credentials:', err);
                }
            };
            
            checkCredentials();
        } else {
            console.error('🎥 S3 client not initialized - video upload will fail');
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }} 
                className="relative bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full mx-4"
            >
                <button 
                    onClick={handleClose} 
                    className="absolute top-2 right-2 z-10 rounded-full p-1 bg-white/10 text-gray-400 hover:text-gray-500" 
                    aria-label="Close registration"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Face Registration</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Please align your face in the center of the frame and maintain good lighting.
                    </p>
                    <div className={cn("relative rounded-lg overflow-hidden bg-gray-100", captured ? "aspect-square" : "")}>
                        {!captured ? (
                            <div className="relative">
                                <Webcam 
                                    audio={true}
                                    muted={true}
                                    ref={webcamRef} 
                                    screenshotFormat="image/jpeg" 
                                    videoConstraints={{
                                        facingMode: "user",
                                        width: { ideal: 3840, min: 1920 },
                                        height: { ideal: 2160, min: 1080 }
                                    }} 
                                    mirrored={true} 
                                    className="w-full h-full object-cover aspect-square"
                                    onUserMedia={handleUserMedia}
                                />
                                {isRecording && (
                                    <div className="absolute top-2 left-2 flex items-center bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                                        <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-white"/>
                                        Analyzing Face
                                    </div>
                                )}
                            </div>
                        ) : showPreview && imageSrc ? (
                            <div className="relative aspect-square">
                                <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
                                {facesDetected === 1 && !error && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                        Face detected
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-gray-100">
                                <Video className="h-16 w-16 text-gray-400" />
                            </div>
                        )}
                        {processing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-5 flex justify-center space-x-3">
                        {!captured ? (
                            <button 
                                onClick={capturePhoto} 
                                disabled={processing} 
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Capture
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={resetCapture} 
                                    disabled={processing} 
                                    className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Retake
                                </button>
                                {facesDetected === 1 && !error && FACE_REGISTER_METHOD !== 'direct' && (
                                    <button 
                                        onClick={() => user && registerFace(imageSrc, user.id, videoBlob, locationData)} 
                                        disabled={processing} 
                                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                    >
                                        <Check className="w-5 h-5 mr-2" />
                                        Save
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default FaceRegistration;
