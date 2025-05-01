// [FIXED VERSION] - main.jsx with enhanced logs for debugging AWS Face Liveness issues
console.log('[MAIN.JSX] Loading fixed version with explicit debug logging for Face Liveness');

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/tailwind.css'
import './styles/global.css'
// Buffer polyfill is no longer needed - we handle browser compatibility directly in the services

// Import AWS Amplify and configure it
import { Amplify } from 'aws-amplify';

// Configure Amplify with your AWS settings
console.log('[MAIN.JSX] Configuring AWS Amplify with explicit Face Liveness settings');
const amplifyConfig = {
  Auth: {
    // Only needed if using Auth with Amplify - can be removed if using your own auth system
    mandatorySignIn: false,
    // region where your auth resources are located
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    // Add Cognito settings
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-1:58370502-e0c5-4ce1-b99c-411a0a895d07',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_wXi7yGqKw',
    userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '6dj72i4m73up31kt5qgdg22c68'
  },
  // Required for Face Liveness detection
  Liveness: {
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    // For direct AWS access without a backend API
    s3: {
      bucket: import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430'
    },
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-1:58370502-e0c5-4ce1-b99c-411a0a895d07'
  },
  // Added for direct credential access
  Storage: {
    AWSS3: {
      bucket: import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
    }
  },
  aws_appsync_region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  aws_appsync_authenticationType: 'AWS_IAM',
  aws_appsync_apiKey: 'null' // We're using IAM, not API key
};

console.log('[MAIN.JSX] Amplify configuration:', amplifyConfig);
Amplify.configure(amplifyConfig);

// Explicitly request camera permission early with more robust error handling
const requestCameraPermission = async () => {
  try {
    console.log('[MAIN.JSX] Requesting camera permission early...');
    
    // First check if the navigator.mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[MAIN.JSX] Camera API not available in this browser');
      return;
    }
    
    // Try with just video first
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 } 
    });
    
    console.log('[MAIN.JSX] Camera permission granted successfully');
    
    // Stop all tracks immediately to free the camera
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(track => {
        console.log('[MAIN.JSX] Stopping camera track:', track.kind);
        track.stop();
      });
    }
    
    // Create a global helper to check camera status
    window.checkCameraAccess = async () => {
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const tracks = testStream.getTracks();
        const hasCamera = tracks.length > 0;
        tracks.forEach(track => track.stop());
        console.log('[CAMERA CHECK] Camera is available:', hasCamera);
        return hasCamera;
      } catch (err) {
        console.error('[CAMERA CHECK] Camera access error:', err);
        return false;
      }
    };
    
  } catch (error) {
    console.warn('[MAIN.JSX] Failed to get early camera permission:', error);
    
    // Provide more detailed error based on the error type
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      console.error('[MAIN.JSX] Camera permission was denied by the user');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      console.error('[MAIN.JSX] No camera device found on this system');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      console.error('[MAIN.JSX] Camera is already in use by another application');
    }
  }
};

// Try to get camera permission when the app loads
requestCameraPermission();

// Log Amplify configuration for debugging
console.log('[App] Amplify configured with:', {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-1:58370502-e0c5-4ce1-b99c-411a0a895d07',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_wXi7yGqKw',
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '6dj72i4m73up31kt5qgdg22c68',
  s3Bucket: import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430'
});

// Import debug utilities to make them available in browser console
import './debug-utils'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 