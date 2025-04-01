import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/FaceRegistration.tsx
import React from 'react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, RotateCcw, Check, Video, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { rekognitionClient } from '../config/aws-config';
import { DetectFacesCommand, QualityFilter } from '@aws-sdk/client-rekognition';
import { FaceIndexingService } from '../services/FaceIndexingService';
import { storeFaceId } from '../services/FaceStorageService';

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
    const [detectedFaceDetails, setDetectedFaceDetails] = useState(null);
    const [faceQualityOk, setFaceQualityOk] = useState(false);
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
        let faceCheckInterval;
        if (!capturedImage && webcamRef.current && webcamRef.current.video) {
            const checkForFace = async () => {
                if (isCheckingFace) return;
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
                    // Detect faces with quality filter
                    console.log('Detecting faces in webcam frame...');
                    const command = new DetectFacesCommand({
                        Image: { Bytes: imageBytes },
                        Attributes: ['ALL']
                    });
                    const response = await rekognitionClient.send(command);

                    if (response.FaceDetails && response.FaceDetails.length > 0) {
                        const face = response.FaceDetails[0];
                        // Basic quality check (confidence > 90, sharpness > 50)
                        const qualitySufficient = 
                            (face.Confidence || 0) > 90 && 
                            (face.Quality?.Sharpness || 0) > 50;
                            
                        console.log('Face detection result: Face detected', `Quality OK: ${qualitySufficient}`);
                        setFaceDetected(true);
                        setDetectedFaceDetails(face);
                        setFaceQualityOk(qualitySufficient);
                    } else {
                        console.log('Face detection result: No face detected');
                        setFaceDetected(false);
                        setDetectedFaceDetails(null);
                        setFaceQualityOk(false);
                    }
                } catch (err) {
                    console.error('Error checking for face:', err);
                    setFaceDetected(false);
                    setDetectedFaceDetails(null);
                    setFaceQualityOk(false);
                } finally {
                    setIsCheckingFace(false);
                }
            };

            checkForFace();
            faceCheckInterval = setInterval(checkForFace, 2000);
        }
        return () => {
            if (faceCheckInterval) {
                clearInterval(faceCheckInterval);
            }
        };
    }, [capturedImage, isCheckingFace]);
    const capture = useCallback(() => {
        if (!faceDetected) {
            setError('Please position your face clearly in the frame');
            return;
        }
        if (!faceQualityOk) {
            setError('Face quality is too low. Please ensure good lighting and sharpness.');
            return;
        }
        console.log('Capturing image (Face & Quality OK)...');
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
    }, [faceDetected, faceQualityOk]);
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
        if (!capturedImage || !user || !detectedFaceDetails) {
            setError('Cannot register without a captured image and detected face details.');
            return;
        }
        if (!faceQualityOk) {
            setError('Cannot register face, quality too low. Please retake.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Starting face registration process...');
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const imageBytes = new Uint8Array(arrayBuffer);

            const faceAttributes = detectedFaceDetails;
            console.log('Using pre-captured face attributes:', JSON.stringify(faceAttributes));

            // Generate a consistent timestamp to use for both storage and database
            const timestamp = Date.now();
            const filePath = `${user.id}/${timestamp}.jpg`;
            
            console.log('Uploading image to storage...');
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
            const { data: { publicUrl } } = supabase.storage
                .from('face-data')
                .getPublicUrl(filePath);
            if (!publicUrl) {
                throw new Error('Failed to retrieve public URL');
            }
            
            console.log('Starting face indexing process with AWS Rekognition');
            
            // Store the image_path in database first - with delete+insert instead of upsert
            // CRITICAL: Also store the face attributes directly here to ensure they're not lost
            const { error: deleteError } = await supabase
                .from('face_data')
                .delete()
                .eq('user_id', user.id);
                
            if (deleteError) {
                console.warn('Warning: Error deleting existing face data:', deleteError);
                // Continue anyway
            }
            
            // Create the face_data object with the attributes already included
            const faceDataObj = {
                image_path: filePath,
                created_at: new Date().toISOString(),
                // Store the attributes directly here
                attributes: faceAttributes
            };
            
            console.log('Storing initial face data with attributes:', JSON.stringify(faceDataObj));
            
            const { error: dbError } = await supabase
                .from('face_data')
                .insert({
                    user_id: user.id,
                    face_data: faceDataObj,
                    created_at: new Date().toISOString()
                });
                
            if (dbError) {
                console.warn('Warning: Failed to store initial face data:', dbError);
                // Continue anyway, might be fixed in next steps
            } else {
                console.log('Successfully stored initial face data with attributes');
            }
            
            const indexResult = await FaceIndexingService.indexFace(
                imageBytes,
                user.id,
                faceAttributes
            );

            if (!indexResult || !indexResult.success || !indexResult.faceId) {
                 throw new Error(indexResult?.error || 'Failed to index face.');
            }
            const faceId = indexResult.faceId;
            console.log('Face indexed successfully with ID:', faceId);

            console.log('Storing face ID relation...');
            const stored = await storeFaceId(user.id, faceId);
            if (!stored) {
                 console.warn('[FaceRegistration] Failed to store face ID relation in DB, but continuing...');
            }
            
            // Also directly update the face_data record with the face_id to ensure consistency
            const { error: updateError } = await supabase
                .from('face_data')
                .update({
                    face_id: faceId,
                    face_data: {
                        ...faceDataObj,
                        face_id: faceId
                    }
                })
                .eq('user_id', user.id);
                
            if (updateError) {
                console.warn('Warning: Failed to update face data with face_id:', updateError);
            } else {
                console.log('Successfully updated face data with face_id');
            }
            
            console.log('Face indexed and registered successfully.');
            console.log('Face registration complete!');
            
            // Force a refresh of the parent component's face data
            // This is a crucial step to ensure new data is shown
            console.log('Calling onSuccess callback with faceId:', faceId);
            
            // Add a delay to ensure database writes have completed
            setTimeout(() => {
                onSuccess(faceId);
            }, 500);

        } catch (err) {
             console.error('Face registration failed:', err);
             setError(`Registration failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-apple-2xl shadow-apple-lg overflow-hidden max-w-lg w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-apple-gray-900">Face Registration</h2>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full hover:bg-apple-gray-100 text-apple-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-apple flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                    )}
                    
                    {devices.length > 1 && (
                        <div className="mb-4">
                            <label className="ios-label flex items-center">
                                <Video className="w-4 h-4 mr-2" />
                                Camera
                            </label>
                            <select 
                                value={selectedDeviceId} 
                                onChange={handleDeviceChange} 
                                className="ios-input">
                                {devices.map(device => (
                                    <option 
                                        key={device.deviceId} 
                                        value={device.deviceId}>
                                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="relative aspect-video overflow-hidden rounded-apple-xl bg-black mb-6">
                        {capturedImage ? (
                            <img 
                                src={capturedImage} 
                                alt="Captured face" 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <>
                                <Webcam 
                                    ref={webcamRef} 
                                    screenshotFormat="image/jpeg" 
                                    className="w-full h-full object-cover" 
                                    videoConstraints={{
                                        width: 1280,
                                        height: 720,
                                        deviceId: selectedDeviceId,
                                        facingMode: "user"
                                    }} 
                                />
                                <div 
                                    className={cn(
                                        "absolute inset-0 border-4 transition-colors duration-300", 
                                        faceDetected 
                                            ? (faceQualityOk ? 'border-apple-green-500' : 'border-yellow-500') 
                                            : 'border-white/20'
                                    )} 
                                />
                                
                                {!isCheckingFace && !faceDetected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                        <div className="text-white text-center">
                                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                            <p>No face detected</p>
                                        </div>
                                    </div>
                                )}
                                
                                {!isCheckingFace && faceDetected && !faceQualityOk && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="text-white text-center p-4 bg-yellow-600/80 rounded-lg">
                                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                            <p>Face quality low. Improve lighting or hold still.</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="flex space-x-2">
                        {!capturedImage ? (
                            <button 
                                onClick={capture} 
                                disabled={loading || !faceDetected || !faceQualityOk} 
                                className={cn(
                                    "flex-1 py-3 rounded-apple-lg flex justify-center items-center font-medium",
                                    (faceDetected && faceQualityOk)
                                        ? "bg-apple-blue-500 text-white" 
                                        : "bg-apple-gray-200 text-apple-gray-600"
                                )}>
                                <Camera className="w-5 h-5 mr-2" />
                                Capture Photo
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={retake} 
                                    disabled={loading} 
                                    className="flex-1 py-3 rounded-apple-lg bg-apple-gray-200 font-medium text-apple-gray-900 flex justify-center items-center">
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Retake
                                </button>
                                <button 
                                    onClick={handleRegistration} 
                                    disabled={loading} 
                                    className="flex-1 py-3 rounded-apple-lg bg-apple-blue-500 text-white font-medium flex justify-center items-center">
                                    <Check className="w-5 h-5 mr-2" />
                                    {loading ? 'Processing...' : 'Register Face'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
