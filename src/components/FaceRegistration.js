import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/FaceRegistration.tsx
import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, RotateCcw, Check, Video, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { rekognitionClient } from '../lib/awsClient';
import { DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { FaceIndexingService } from '../services/FaceIndexingService.jsx';
// Define face registration method - use default 'direct' method
const FACE_REGISTER_METHOD = 'direct';
const FaceRegistration = ({ onSuccess, onClose }) => {
    const webcamRef = useRef(null);
    const [processing, setProcessing] = useState(false);
    const [captured, setCaptured] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [error, setError] = useState(null);
    const [facesDetected, setFacesDetected] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const { user } = useAuth();
    const capturePhoto = useCallback(() => {
        if (!webcamRef.current)
            return;
        // Reset states
        setError(null);
        setProcessing(true);
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            setImageSrc(imageSrc);
            setCaptured(true);
            setShowPreview(true);
            // Process the captured image for face detection 
            if (imageSrc) {
                processCapturedImage(imageSrc);
            }
        }
        catch (err) {
            console.error('Error capturing photo:', err);
            setError('Failed to capture photo. Please try again.');
            setProcessing(false);
        }
    }, [webcamRef]);
    const processCapturedImage = async (imgSrc) => {
        try {
            setProcessing(true);
            // Convert base64 to Uint8Array for AWS
            const base64Data = imgSrc.split(',')[1];
            const binaryData = Buffer.from(base64Data, 'base64');
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
            // Proceed with face registration
            if (user && FACE_REGISTER_METHOD === 'direct') {
                await registerFace(imgSrc, user.id);
            }
            setProcessing(false);
        }
        catch (err) {
            console.error('Error processing image:', err);
            setError('Failed to process the image. Please try again.');
            setCaptured(false);
            setProcessing(false);
        }
    };
    const registerFace = async (imgSrc, userId) => {
        try {
            setProcessing(true);
            console.log('Registering face for user:', userId);
            console.log('Image data type:', typeof imgSrc);
            console.log('Image data starts with:', imgSrc.substring(0, 30) + '...');
            
            // Use FaceIndexingService to register the face with historical matching
            const result = await FaceIndexingService.indexFace(userId, imgSrc);
            if (result.success) {
                console.log('Face registered successfully');
                console.log('Face attributes:', result.faceAttributes);
                
                // Log any historical matches
                if (result.historicalMatches && result.historicalMatches.length > 0) {
                    console.log('Historical matches found:', result.historicalMatches.length);
                    result.historicalMatches.forEach((match, index) => {
                        console.log(`Match ${index + 1}: Photo ID=${match.id}, Similarity=${match.similarity.toFixed(2)}%, URL=${match.imageUrl || 'N/A'}`);
                    });
                } else {
                    console.log('No historical matches found');
                }
                
                onSuccess(result);
            }
            else {
                setError(result.error || 'Failed to register face. Please try again.');
                setCaptured(false);
            }
        }
        catch (err) {
            console.error('Error registering face:', err);
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
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-black/80 flex items-center justify-center", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "relative bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full mx-4", children: [_jsx("button", { onClick: onClose, className: "absolute top-2 right-2 z-10 rounded-full p-1 bg-white/10 text-gray-400 hover:text-gray-500", "aria-label": "Close registration", children: _jsx(X, { className: "w-5 h-5" }) }), _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Face Registration" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: "Please align your face in the center of the frame and maintain good lighting." }), _jsxs("div", { className: cn("relative rounded-lg overflow-hidden bg-gray-100", captured ? "aspect-video" : ""), children: [!captured ? (_jsx(Webcam, { audio: false, ref: webcamRef, screenshotFormat: "image/jpeg", videoConstraints: {
                                        facingMode: "user",
                                        width: { min: 480 },
                                        height: { min: 360 }
                                    }, mirrored: true, className: "w-full h-full object-cover aspect-video" })) : showPreview && imageSrc ? (_jsxs("div", { className: "relative aspect-video", children: [_jsx("img", { src: imageSrc, alt: "Captured", className: "w-full h-full object-cover" }), facesDetected === 1 && !error && (_jsx("div", { className: "absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full", children: "Face detected" }))] })) : (_jsx("div", { className: "flex items-center justify-center h-64 bg-gray-100", children: _jsx(Video, { className: "h-16 w-16 text-gray-400" }) })), processing && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50 text-white", children: _jsxs("svg", { className: "animate-spin h-8 w-8 text-white", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) }))] }), error && (_jsx("div", { className: "mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(AlertTriangle, { className: "h-5 w-5 text-red-400" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-sm", children: error }) })] }) })), _jsx("div", { className: "mt-5 flex justify-center space-x-3", children: !captured ? (_jsxs("button", { onClick: capturePhoto, disabled: processing, className: "flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx(Camera, { className: "w-5 h-5 mr-2" }), "Capture"] })) : (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: resetCapture, disabled: processing, className: "flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx(RotateCcw, { className: "w-5 h-5 mr-2" }), "Retake"] }), facesDetected === 1 && !error && FACE_REGISTER_METHOD !== 'direct' && (_jsxs("button", { onClick: () => user && registerFace(imageSrc, user.id), disabled: processing, className: "flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50", children: [_jsx(Check, { className: "w-5 h-5 mr-2" }), "Save"] }))] })) })] })] }) }));
};
export default FaceRegistration;
