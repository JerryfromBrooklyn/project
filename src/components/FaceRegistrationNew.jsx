import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { registerFace } from '../services/face-matching/api';
/**
 * FaceRegistration component for capturing and registering a user's face
 * during the onboarding process.
 */
export const FaceRegistration = ({ onSuccess, onClose }) => {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [faceDetected, setFaceDetected] = useState(false);
    const [devices, setDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState('');
    const { user } = useAuth();
    // Get available camera devices
    useEffect(() => {
        const getDevices = async () => {
            console.log('[FACE-UI] Getting video devices');
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('[FACE-UI] Found', videoDevices.length, 'video devices');
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setActiveDeviceId(videoDevices[0].deviceId);
                    console.log('[FACE-UI] Set active device:', videoDevices[0].deviceId);
                }
            }
            catch (error) {
                console.error('[FACE-UI] Error getting video devices:', error);
                setError('Unable to access camera. Please check your permissions.');
            }
        };
        getDevices();
    }, []);
    // Check for face in the webcam feed
    useEffect(() => {
        if (!capturedImage && webcamRef.current) {
            const checkForFace = async () => {
                try {
                    // Get current video frame
                    const screenshot = webcamRef.current?.getScreenshot();
                    if (!screenshot)
                        return;
                    // Send to local face detection (simplified for this example)
                    // In a real implementation, we would call a face detection API
                    // But to avoid extra API calls, we're simulating this step
                    // Simulated face detection
                    // In a real implementation, we'd use something like:
                    // const hasFace = await detectFace(screenshot);
                    const hasFace = true; // Simplified
                    setFaceDetected(hasFace);
                    console.log('[FACE-UI] Face detected:', hasFace);
                }
                catch (error) {
                    console.error('[FACE-UI] Error checking for face:', error);
                }
            };
            const interval = setInterval(checkForFace, 1000);
            return () => clearInterval(interval);
        }
    }, [capturedImage]);
    // Handle device change
    const handleDeviceChange = (event) => {
        console.log('[FACE-UI] Changing camera device:', event.target.value);
        setActiveDeviceId(event.target.value);
    };
    // Capture current frame
    const capture = useCallback(() => {
        if (!faceDetected) {
            console.log('[FACE-UI] No face detected, please position your face in the frame');
            setError('No face detected. Please position your face in the frame.');
            return;
        }
        console.log('[FACE-UI] Capturing image');
        const screenshot = webcamRef.current?.getScreenshot();
        if (screenshot) {
            console.log('[FACE-UI] Image captured successfully');
            setCapturedImage(screenshot);
            setError(null);
        }
        else {
            setError('Failed to capture image. Please try again.');
            console.error('[FACE-UI] Failed to capture image');
        }
    }, [faceDetected]);
    // Retake photo
    const retake = () => {
        console.log('[FACE-UI] Retaking photo');
        setCapturedImage(null);
        setError(null);
    };
    // Register face with the service
    const handleRegistration = async () => {
        if (!capturedImage || !user) {
            console.error('[FACE-UI] Missing image or user');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log('[FACE-UI] Converting image for registration');
            // Convert the base64 image to binary
            const base64Data = capturedImage.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            console.log('[FACE-UI] Registering face for user:', user.id);
            const result = await registerFace(user.id, bytes);
            if (!result.success) {
                throw new Error(result.error || 'Failed to register face');
            }
            console.log('[FACE-UI] Face registered successfully with ID:', result.faceId);
            console.log('[FACE-UI] Found', result.matchCount, 'existing photos with this face');
            // Call success callback
            onSuccess(result);
        }
        catch (error) {
            console.error('[FACE-UI] Error during face registration:', error);
            setError(error.message || 'Failed to register face. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "face-registration p-6 max-w-md mx-auto bg-white rounded-xl shadow-md", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-800", children: "Face Registration" }), _jsx("button", { onClick: onClose, className: "p-1 rounded-full hover:bg-gray-200", "aria-label": "Close", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-50 text-red-700 rounded-lg", children: _jsx("p", { children: error }) })), devices.length > 1 && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Camera" }), _jsx("select", { value: activeDeviceId, onChange: handleDeviceChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", children: devices.map(device => (_jsx("option", { value: device.deviceId, children: device.label || `Camera ${devices.indexOf(device) + 1}` }, device.deviceId))) })] })), _jsx("div", { className: "relative aspect-square overflow-hidden rounded-lg bg-black mb-4", children: capturedImage ? (_jsx("img", { src: capturedImage, alt: "Captured face", className: "w-full h-full object-cover" })) : (_jsxs(_Fragment, { children: [_jsx(Webcam, { audio: false, ref: webcamRef, screenshotFormat: "image/jpeg", videoConstraints: {
                                width: 1280,
                                height: 1280,
                                deviceId: activeDeviceId,
                                facingMode: "user"
                            }, className: "w-full h-full object-cover" }), _jsx("div", { className: `absolute inset-0 border-4 transition-colors duration-300 ${faceDetected ? 'border-green-500' : 'border-white/20'}` }), !faceDetected && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/25", children: _jsxs("div", { className: "text-white text-center", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 mx-auto mb-2", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })] }), _jsx("p", { children: "No face detected" })] }) }))] })) }), _jsx("div", { className: "flex gap-3", children: capturedImage ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: retake, className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", disabled: loading, children: "Retake" }), _jsx("button", { onClick: handleRegistration, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", disabled: loading, children: loading ? (_jsxs("span", { className: "flex items-center justify-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Registering..."] })) : "Confirm & Register" })] })) : (_jsx("button", { onClick: capture, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", disabled: !faceDetected, children: faceDetected ? "Capture Photo" : "Position Your Face" })) }), _jsx("div", { className: "mt-4 text-sm text-gray-500", children: _jsx("p", { children: "Your face will be used to find photos you appear in. We'll index your face once and use it to search for matches in our photo collection." }) })] }));
};
export default FaceRegistration;
