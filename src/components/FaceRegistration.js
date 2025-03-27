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
            
            // Index the face with AWS Rekognition
            console.log('Indexing face...');
            const indexResult = await FaceIndexingService.indexFace(imageBytes, user.id);
            if (!indexResult.success) {
                throw new Error(indexResult.error || 'Failed to index face');
            }
            
            // Save face data reference with attributes using the new RPC function
            console.log('Saving face data...');
            const generatedFaceId = `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const faceIdToUse = (indexResult && indexResult.faceId) ? indexResult.faceId : generatedFaceId;

            console.log('Using face ID for registration:', faceIdToUse);

            // First try direct insert to face_data as a workaround
            try {
                console.log('Trying direct insert with face_id:', faceIdToUse);
                const { error: directError } = await supabase
                    .from('face_data')
                    .insert({
                        user_id: user.id,
                        face_id: faceIdToUse, // Explicitly provide face_id
                        face_data: {
                            image_path: filePath,
                            public_url: publicUrl,
                            attributes: {
                                age: {
                                    low: faceAttributes.AgeRange?.Low || 0,
                                    high: faceAttributes.AgeRange?.High || 0
                                },
                                smile: {
                                    value: faceAttributes.Smile?.Value || false,
                                    confidence: faceAttributes.Smile?.Confidence || 0
                                },
                                eyeglasses: {
                                    value: faceAttributes.Eyeglasses?.Value || false,
                                    confidence: faceAttributes.Eyeglasses?.Confidence || 0
                                },
                                sunglasses: {
                                    value: faceAttributes.Sunglasses?.Value || false,
                                    confidence: faceAttributes.Sunglasses?.Confidence || 0
                                },
                                gender: {
                                    value: faceAttributes.Gender?.Value || '',
                                    confidence: faceAttributes.Gender?.Confidence || 0
                                },
                                eyesOpen: {
                                    value: faceAttributes.EyesOpen?.Value || false,
                                    confidence: faceAttributes.EyesOpen?.Confidence || 0
                                },
                                mouthOpen: {
                                    value: faceAttributes.MouthOpen?.Value || false,
                                    confidence: faceAttributes.MouthOpen?.Confidence || 0
                                },
                                quality: {
                                    brightness: faceAttributes.Quality?.Brightness || 0,
                                    sharpness: faceAttributes.Quality?.Sharpness || 0
                                },
                                emotions: faceAttributes.Emotions?.map(emotion => ({
                                    type: emotion.Type,
                                    confidence: emotion.Confidence
                                })) || [],
                                landmarks: faceAttributes.Landmarks,
                                pose: faceAttributes.Pose,
                                beard: {
                                    value: faceAttributes.Beard?.Value || false,
                                    confidence: faceAttributes.Beard?.Confidence || 0
                                },
                                mustache: {
                                    value: faceAttributes.Mustache?.Value || false,
                                    confidence: faceAttributes.Mustache?.Confidence || 0
                                },
                                overallConfidence: faceAttributes.Confidence
                            }
                        },
                        metadata: {
                            registeredFrom: 'webcam',
                            registeredAt: new Date().toISOString(),
                            deviceType: selectedDeviceId
                        }
                    });
                
                if (directError) {
                    console.error('Direct insert failed:', directError);
                    // Fall back to RPC method if direct insert fails
                    const { data: registerResult, error: rpcError } = await supabase.rpc('rpc_register_face', {
                        face_id: faceIdToUse,
                        face_data: {
                            image_path: filePath,
                            public_url: publicUrl,
                            attributes: {
                                age: {
                                    low: faceAttributes.AgeRange?.Low || 0,
                                    high: faceAttributes.AgeRange?.High || 0
                                },
                                smile: {
                                    value: faceAttributes.Smile?.Value || false,
                                    confidence: faceAttributes.Smile?.Confidence || 0
                                },
                                eyeglasses: {
                                    value: faceAttributes.Eyeglasses?.Value || false,
                                    confidence: faceAttributes.Eyeglasses?.Confidence || 0
                                },
                                sunglasses: {
                                    value: faceAttributes.Sunglasses?.Value || false,
                                    confidence: faceAttributes.Sunglasses?.Confidence || 0
                                },
                                gender: {
                                    value: faceAttributes.Gender?.Value || '',
                                    confidence: faceAttributes.Gender?.Confidence || 0
                                },
                                eyesOpen: {
                                    value: faceAttributes.EyesOpen?.Value || false,
                                    confidence: faceAttributes.EyesOpen?.Confidence || 0
                                },
                                mouthOpen: {
                                    value: faceAttributes.MouthOpen?.Value || false,
                                    confidence: faceAttributes.MouthOpen?.Confidence || 0
                                },
                                quality: {
                                    brightness: faceAttributes.Quality?.Brightness || 0,
                                    sharpness: faceAttributes.Quality?.Sharpness || 0
                                },
                                emotions: faceAttributes.Emotions?.map(emotion => ({
                                    type: emotion.Type,
                                    confidence: emotion.Confidence
                                })) || [],
                                landmarks: faceAttributes.Landmarks,
                                pose: faceAttributes.Pose,
                                beard: {
                                    value: faceAttributes.Beard?.Value || false,
                                    confidence: faceAttributes.Beard?.Confidence || 0
                                },
                                mustache: {
                                    value: faceAttributes.Mustache?.Value || false,
                                    confidence: faceAttributes.Mustache?.Confidence || 0
                                },
                                overallConfidence: faceAttributes.Confidence
                            }
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
                    
                    console.log('Face indexed and registered successfully');
                    console.log('Face registration complete!');
                    onSuccess();
                } else {
                    // Add success callback for direct insert
                    console.log('Face indexed and registered successfully via direct insert');
                    console.log('Face registration complete!');
                    onSuccess();
                }
            }
            catch (err) {
                console.error('Face registration error:', err);
                setError(err.message || 'Failed to register face');
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
