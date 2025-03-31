import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/FaceRegistration.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, RotateCcw, Check, Video, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { rekognitionClient } from '../config/aws-config';
import { DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { FaceIndexingService } from '../services/FaceIndexingService';
import { storeFaceId } from '../services/FaceStorageService';
import toast from 'react-hot-toast';

// Define face registration method - use default 'direct' method
const FACE_REGISTER_METHOD = 'direct'; // Options: 'RPC', 'direct'

export const FaceRegistration = ({ onSuccess, onClose }) => {
    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [faceDetected, setFaceDetected] = useState(false);
    const [isCheckingFace, setIsCheckingFace] = useState(false);
    const { user } = useAuth();
    useEffect(() => {
        const getVideoDevices = async () => {
            try {
                console.log('Getting video devices...');
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('Found video devices:', videoDevices);
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            }
            catch (err) {
                console.error('Error getting video devices:', err);
                setError('Unable to access camera devices');
            }
        };
        getVideoDevices();
    }, []);
    useEffect(() => {
        if (!capturedImage && webcamRef.current && webcamRef.current.video) {
            const checkForFace = async () => {
                setIsCheckingFace(true);
                try {
                    const video = webcamRef.current?.video;
                    if (!video)
                        return;
                    // Create canvas with proper dimensions
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    const ctx = canvas.getContext('2d');
                    if (!ctx)
                        return;
                    // Draw current video frame
                    ctx.drawImage(video, 0, 0);
                    // Convert to blob with proper type
                    const blob = await new Promise((resolve) => {
                        try {
                            canvas.toBlob(resolve, 'image/jpeg', 0.9);
                        }
                        catch (err) {
                            console.error('Error creating blob:', err);
                            resolve(null);
                        }
                    });
                    if (!blob) {
                        console.error('Failed to create blob from canvas');
                        return;
                    }
                    // Convert to array buffer
                    const arrayBuffer = await blob.arrayBuffer();
                    const imageBytes = new Uint8Array(arrayBuffer);
                    // Detect faces
                    console.log('Detecting faces in webcam frame...');
                    const command = new DetectFacesCommand({
                        Image: { Bytes: imageBytes },
                        Attributes: ['ALL']
                    });
                    const response = await rekognitionClient.send(command);
                    const hasFaces = !!(response.FaceDetails && response.FaceDetails.length > 0);
                    console.log('Face detection result:', hasFaces ? 'Face detected' : 'No face detected');
                    setFaceDetected(hasFaces);
                }
                catch (err) {
                    console.error('Error checking for face:', err);
                    setFaceDetected(false);
                }
                finally {
                    setIsCheckingFace(false);
                }
            };
            const interval = setInterval(checkForFace, 1000);
            return () => clearInterval(interval);
        }
    }, [capturedImage]);
    const capture = useCallback(() => {
        if (!faceDetected) {
            console.log('No face detected, cannot capture');
            setError('Please position your face in the frame');
            return;
        }
        console.log('Capturing image...');
        const screenshot = webcamRef.current?.getScreenshot();
        if (screenshot) {
            console.log('Image captured successfully');
            setCapturedImage(screenshot);
            setError(null);
        }
        else {
            console.error('Failed to capture image');
            setError('Failed to capture image');
        }
    }, [faceDetected]);
    const retake = () => {
        console.log('Retaking photo...');
        setCapturedImage(null);
        setError(null);
        setFaceDetected(false);
    };
    const handleDeviceChange = (event) => {
        console.log('Changing camera device to:', event.target.value);
        setSelectedDeviceId(event.target.value);
        setCapturedImage(null);
        setError(null);
        setFaceDetected(false);
    };
    const handleRegistration = async () => {
        if (!capturedImage || !user)
            return;
        setLoading(true);
        setError(null);
        try {
            console.log('Starting face registration process...');
            // Convert base64 to blob
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const imageBytes = new Uint8Array(arrayBuffer);
            // Detect face attributes with AWS Rekognition
            console.log('Detecting face attributes...');
            const detectCommand = new DetectFacesCommand({
                Image: { Bytes: imageBytes },
                Attributes: ['ALL']
            });
            const detectResponse = await rekognitionClient.send(detectCommand);
            if (!detectResponse.FaceDetails?.length) {
                throw new Error('No face detected in the image');
            }
            const faceAttributes = detectResponse.FaceDetails[0];
            console.log('Face attributes detected successfully');
            // Upload to Supabase storage
            console.log('Uploading image to storage...');
            const filePath = `${user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('face-data')
                .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/jpeg'
            });
            if (uploadError)
                throw uploadError;
            console.log('Image uploaded successfully');
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('face-data')
                .getPublicUrl(filePath);
            if (!publicUrl) {
                throw new Error('Failed to retrieve public URL');
            }
            
            // Index the face
            console.log('Starting face indexing process with AWS Rekognition');
            const { faceId, faceAttributes: indexedFaceAttributes } = await FaceIndexingService.indexFace(
                imageBytes,
                user.id
            );
            console.log('Face indexed successfully with ID:', faceId);
            
            // Store face ID in storage system
            console.log('Storing face ID in backup storage system');
            await storeFaceId(user.id, faceId);
            
            // Queue background face matching instead of doing it synchronously
            console.log('[FACE-MATCH] Queuing background face matching task');
            try {
                const queueResult = await FaceIndexingService.queueFaceMatchingTask(user.id, faceId);
                
                if (queueResult) {
                    console.log('[FACE-MATCH] Successfully queued background matching task');
                    
                    // Show a notification to the user
                    toast({
                        title: 'Face Registration Complete',
                        description: 'Your face has been registered. Matching with existing photos will happen automatically in the background.',
                        status: 'success',
                        duration: 5000,
                        isClosable: true,
                    });
                } else {
                    // If queuing fails, fall back to doing a quick direct match
                    console.log('[FACE-MATCH] Queue failed, falling back to direct matching');
                    await FaceIndexingService.searchFacesByFaceId(faceId, user.id);
                }
            } catch (matchError) {
                console.error('[FACE-MATCH] Error in face matching:', matchError);
                // Continue registration process even if matching fails
            }
            
            // If using direct RPC
            if (FACE_REGISTER_METHOD === 'RPC') {
                console.log('Using RPC method to register face');
                
                // Register through RPC (existing code)
                const { data: registerResult, error: rpcError } = await supabase.rpc('register_face', {
                    user_id: user.id,
                    face_id: faceId,
                    attributes: {
                        gender: {
                            value: indexedFaceAttributes.Gender?.Value || '',
                            confidence: indexedFaceAttributes.Gender?.Confidence || 0
                        },
                        age: {
                            low: indexedFaceAttributes.AgeRange?.Low || 0,
                            high: indexedFaceAttributes.AgeRange?.High || 0
                        },
                        emotions: (indexedFaceAttributes.Emotions?.map(emotion => ({
                            type: emotion.Type,
                            confidence: emotion.Confidence
                        })) || []),
                        landmarks: indexedFaceAttributes.Landmarks,
                        pose: indexedFaceAttributes.Pose,
                        beard: {
                            value: indexedFaceAttributes.Beard?.Value || false,
                            confidence: indexedFaceAttributes.Beard?.Confidence || 0
                        },
                        mustache: {
                            value: indexedFaceAttributes.Mustache?.Value || false,
                            confidence: indexedFaceAttributes.Mustache?.Confidence || 0
                        },
                        overallConfidence: indexedFaceAttributes.Confidence
                    },
                    metadata: {
                        registeredFrom: 'webcam',
                        registeredAt: new Date().toISOString(),
                        deviceType: selectedDeviceId
                    }
                });
                
                if (rpcError) {
                    throw rpcError;
                }
                
                if (registerResult && !registerResult.success) {
                    throw new Error(registerResult.message || 'Failed to register face');
                }
                
                // Directly call our storage method as a backup
                await storeFaceId(user.id, faceId);
                
                console.log('Face indexed and registered successfully');
                console.log('Face registration complete!');
                onSuccess();
            } else {
                // Using direct insert (existing code)
                
                // Directly call our storage method as a backup
                await storeFaceId(user.id, faceId);
                
                // Add success callback for direct insert
                console.log('Face indexed and registered successfully via direct insert');
                console.log('Face registration complete!');
                onSuccess();
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: _jsx("div", { className: "bg-white rounded-apple-2xl shadow-apple-lg overflow-hidden max-w-lg w-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold text-apple-gray-900", children: "Face Registration" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-apple-gray-100 text-apple-gray-500", children: _jsx(X, { className: "w-5 h-5" }) })] }), error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2" }), error] })), devices.length > 1 && (_jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "ios-label flex items-center", children: [_jsx(Video, { className: "w-4 h-4 mr-2" }), "Camera"] }), _jsx("select", { value: selectedDeviceId, onChange: handleDeviceChange, className: "ios-input", children: devices.map(device => (_jsx("option", { value: device.deviceId, children: device.label || `Camera ${devices.indexOf(device) + 1}` }, device.deviceId))) })] })), _jsx("div", { className: "relative aspect-video overflow-hidden rounded-apple-xl bg-black mb-6", children: capturedImage ? (_jsx("img", { src: capturedImage, alt: "Captured face", className: "w-full h-full object-cover" })) : (_jsxs(_Fragment, { children: [_jsx(Webcam, { ref: webcamRef, screenshotFormat: "image/jpeg", className: "w-full h-full object-cover", videoConstraints: {
                                        width: 1280,
                                        height: 720,
                                        deviceId: selectedDeviceId,
                                        facingMode: "user"
                                    } }), _jsx("div", { className: cn("absolute inset-0 border-4 transition-colors duration-300", faceDetected ? "border-apple-green-500" : "border-white/20") }), !isCheckingFace && !faceDetected && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/25", children: _jsxs("div", { className: "text-white text-center", children: [_jsx(AlertTriangle, { className: "w-8 h-8 mx-auto mb-2" }), _jsx("p", { children: "No face detected" })] }) }))] })) }), _jsx("div", { className: "flex gap-3", children: capturedImage ? (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: retake, className: "ios-button-secondary flex items-center", children: [_jsx(RotateCcw, { className: "w-5 h-5 mr-2" }), "Retake"] }), _jsx("button", { onClick: handleRegistration, disabled: loading, className: cn("ios-button-primary flex-1", loading && "opacity-50 cursor-not-allowed"), children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" }), "Registering..."] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-5 h-5 mr-2" }), "Confirm & Register"] })) })] })) : (_jsxs("button", { onClick: capture, disabled: !faceDetected, className: cn("ios-button-primary flex-1", !faceDetected && "opacity-50 cursor-not-allowed"), children: [_jsx(Camera, { className: "w-5 h-5 mr-2" }), faceDetected ? "Capture Photo" : "Position Your Face"] })) })] }) }) }));
};
