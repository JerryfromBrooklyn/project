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
    
    const { user } = useAuth();

    // Handle webcam ready state
    const handleUserMedia = useCallback((stream) => {
        console.log('🎥 Webcam user media stream received', stream);
        streamRef.current = stream;
        setWebcamReady(true);
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
            
            // Initialize MediaRecorder with the webcam stream
            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });
            
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];
            
            console.log('🎥 MediaRecorder initialized successfully');
            console.log('🎥 Note: Audio is NOT being recorded (audio: false)');
            
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

    // Request and capture geolocation with reverse geocoding
    const captureLocation = async () => {
        console.log('📍 Attempting to capture location...');
        if (!navigator.geolocation) {
            console.log('📍 Geolocation is not supported by this browser');
            setLocationError('Geolocation is not supported by this browser');
            return null;
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

            // Perform reverse geocoding to get address
            try {
                console.log('📍 Attempting reverse geocoding...');
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationInfo.latitude}&lon=${locationInfo.longitude}&zoom=18&addressdetails=1`,
                    { headers: { 'User-Agent': 'SHMONG Face Registration' } }
                );
                
                if (response.ok) {
                    const addressData = await response.json();
                    locationInfo.address = addressData.display_name;
                    locationInfo.addressDetails = addressData.address;
                    console.log('📍 Address retrieved:', locationInfo.address);
                } else {
                    console.warn('📍 Failed to get address:', response.statusText);
                }
            } catch (geocodeError) {
                console.error('📍 Error performing reverse geocoding:', geocodeError);
            }

            console.log('📍 Final location data:', locationInfo);
            setLocationData(locationInfo);
            setLocationError(null);
            return locationInfo;
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
            console.warn('📍 Proceeding without location data');
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
                blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                console.log(`🎥 Created blob from chunks: ${blob.size} bytes`);
            }
            
            if (!blob) {
                console.error('🎥 No video blob available for upload');
                return null;
            }
            
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
            
            return { videoUrl, videoId };
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
            const [imageSrc, locationInfo] = await Promise.all([
                webcamRef.current.getScreenshot(),
                captureLocation()
            ]);
            
            console.log('📸 Photo capture successful:', !!imageSrc);
            console.log('📍 Location capture result:', locationInfo ? 'succeeded' : 'failed');
            console.log('🎥 Video status:', videoBlob ? `Available (${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB)` : 'Not available');
            
            setImageSrc(imageSrc);
            setCaptured(true);
            setShowPreview(true);
            
            // Process the captured image for face detection 
            if (imageSrc) {
                console.log('🔍 Processing captured image for face detection...');
                processCapturedImage(imageSrc);
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
    }, [webcamRef, isRecording, videoBlob]);

    const processCapturedImage = async (imgSrc) => {
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
                Attributes: ['DEFAULT']
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
                await registerFace(imgSrc, user.id, blobForUpload);
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

    const registerFace = async (imgSrc, userId, blobForUpload) => {
        try {
            setProcessing(true);
            console.log('🎥 Registering face for user:', userId);
            console.log('🎥 Image data type:', typeof imgSrc);
            
            // Upload video to S3 using recorded chunks
            let videoData = null;
            if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
                console.log(`🎥 Found ${recordedChunksRef.current.length} video chunks, uploading to S3...`);
                videoData = await uploadVideoToS3(null, userId); // Pass null to let function create blob
                
                if (videoData) {
                    console.log('🎥 Video data collected for security verification:', videoData);
                    setVideoProcessed(true);
                } else {
                    console.error('🎥 Video upload failed - continuing with face registration without video');
                }
            } else {
                console.warn('🎥 No video chunks available for upload');
            }
            
            // Log whether location data was collected
            if (locationData) {
                console.log('📍 Location data will be included with face registration');
            } else {
                console.log('📍 No location data available for face registration');
            }
            
            // Create registration data object with all info
            const registrationData = {
                userId,
                imageData: imgSrc,
                locationData
            };
            
            console.log('🔍 Starting face indexing with FaceIndexingService...');
            
            // Use FaceIndexingService to register the face with historical matching
            const result = await FaceIndexingService.indexFace(userId, imgSrc, locationData);
            
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
                
                // Add location data to the result if available
                if (locationData) {
                    result.locationData = locationData;
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
                
                mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
                    mimeType: selectedMimeType,
                    videoBitsPerSecond: 2500000
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
                                    audio={false} 
                                    ref={webcamRef} 
                                    screenshotFormat="image/jpeg" 
                                    videoConstraints={{
                                        facingMode: "user",
                                        width: { min: 480 },
                                        height: { min: 480 }
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
                                        onClick={() => user && registerFace(imageSrc, user.id, videoBlob)} 
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
