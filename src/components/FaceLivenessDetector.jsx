// Add a prominent console log at the top of the file
console.log('[FaceLivenessDetector.jsx] FILE LOADED - This is the AWS Face Liveness component');

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react-liveness/styles.css';
import { useAuth } from '../context/AuthContext';
import { FaceIndexingService } from '../services/FaceIndexingService';

// AWS SDK clients
import { RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand, ListCollectionsCommand } from '@aws-sdk/client-rekognition';

// Helper function to get direct AWS credentials from environment variables
const getAwsCredentialsFromEnv = () => {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  
  console.log('[FaceLivenessDetector] Getting AWS credentials from environment variables:');
  console.log('- Access Key ID available:', !!accessKeyId);
  console.log('- Secret Access Key available:', !!secretAccessKey);
  
  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey
    };
  }
  
  return null;
};

// Helper function to get all available video input devices
const getVideoInputDevices = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.warn('[FaceLivenessDetector] Media devices or enumerateDevices not supported');
    return [];
  }
  
  try {
    // First request camera permission
    await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Then enumerate devices (this should now have device labels)
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    console.log('[FaceLivenessDetector] Available video devices:', videoDevices);
    return videoDevices;
  } catch (error) {
    console.error('[FaceLivenessDetector] Error getting video devices:', error);
    return [];
  }
};

// Helper function to log the current environment variables
const logEnvironmentVariables = () => {
  console.log('[FaceLivenessDetector] Environment variables:');
  console.log('- VITE_AWS_REGION:', import.meta.env.VITE_AWS_REGION || '(not set)');
  console.log('- VITE_AWS_ACCESS_KEY_ID available:', !!import.meta.env.VITE_AWS_ACCESS_KEY_ID);
  console.log('- VITE_AWS_SECRET_ACCESS_KEY available:', !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY);
  console.log('- VITE_COGNITO_USER_POOL_ID:', import.meta.env.VITE_COGNITO_USER_POOL_ID || '(not set)');
  console.log('- VITE_COGNITO_CLIENT_ID:', import.meta.env.VITE_COGNITO_CLIENT_ID || '(not set)');
  console.log('- VITE_COGNITO_IDENTITY_POOL_ID:', import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || '(not set)');
  console.log('- VITE_FACE_LIVENESS_S3_BUCKET:', import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || '(not set)');
};

// Call this once when the module is loaded
logEnvironmentVariables();

// Set AWS region and credentials from env if needed
const configureAwsSdk = () => {
  // This ensures AWS SDK clients have region and credentials if not provided explicitly
  const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  
  // Log AWS configuration being used
  console.log('[FaceLivenessDetector] Configuring AWS SDK with region:', AWS_REGION);
  
  return AWS_REGION;
};

// Configure AWS SDK with region
const AWS_REGION = configureAwsSdk();

// Detect iOS device
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

const FaceLivenessCheck = ({ onSuccess, onError, onClose }) => {
  console.log('[FaceLivenessCheck] *** COMPONENT MOUNTED ***');
  console.log('[FaceLivenessCheck] Props received:', { hasOnSuccess: !!onSuccess, hasOnError: !!onError, hasOnClose: !!onClose });
  console.log('[FaceLivenessCheck] Running on iOS device:', isIOS());
  
  // Basic state
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState('init'); // init, camera-select, checking, complete, error
  
  // Camera selection state
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  // Results state
  const [livenessResult, setLivenessResult] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);

  // Get user from auth context
  const { user } = useAuth();

  // Constants from environment variables
  const FACE_LIVENESS_S3_BUCKET = import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430';

  // Set viewport meta tag for iOS
  useEffect(() => {
    if (isIOS()) {
      // Find viewport meta tag
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      
      // If it doesn't exist, create it
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      
      // Set content with height=device-height to ensure full viewport usage
      viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no';
      
      console.log('[FaceLivenessCheck] Set viewport meta for iOS');
      
      // Restore original viewport on unmount
      return () => {
        viewportMeta.content = 'width=device-width, initial-scale=1';
      };
    }
  }, []);
  
  // Adjust screen when keyboard is visible on iOS
  useEffect(() => {
    if (!isIOS()) return;
    
    const handleResize = () => {
      // Add a small delay to ensure viewport has updated
      setTimeout(() => {
        if (containerRef.current) {
          // Make sure we're not cutting off content when keyboard appears
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load available camera devices on mount
  useEffect(() => {
    const loadCameraDevices = async () => {
      setIsCameraLoading(true);
      const devices = await getVideoInputDevices();
      setCameraDevices(devices);
      
      // Auto-select the first camera if available
      if (devices.length > 0) {
        setSelectedCameraId(devices[0].deviceId);
      }
      setIsCameraLoading(false);
    };
    
    loadCameraDevices();
  }, []);

  // Debug effect to check if credentials are available
  useEffect(() => {
    // Check if credentials are available immediately on mount
    const envCredentials = getAwsCredentialsFromEnv();
    console.log('[FaceLivenessCheck] DEBUG - AWS Credentials check on mount:');
    console.log('- Direct environment credentials available:', !!envCredentials);
    console.log('- Access Key available:', !!import.meta.env.VITE_AWS_ACCESS_KEY_ID);
    console.log('- Secret Key available:', !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY);
    
    // Try to check Amplify credentials
    fetchAuthSession()
      .then(authSession => {
        console.log('[FaceLivenessCheck] DEBUG - Amplify auth session available:', !!authSession);
        console.log('- Amplify credentials available:', !!authSession?.credentials);
      })
      .catch(err => {
        console.warn('[FaceLivenessCheck] DEBUG - Error checking Amplify auth session:', err);
      });
  }, []);

  // Handle camera device selection
  const handleCameraChange = (e) => {
    setSelectedCameraId(e.target.value);
  };

  // Start the face liveness session with the selected camera
  const startFaceLivenessSession = () => {
    console.log('[FaceLivenessCheck] Starting Face Liveness session with camera ID:', selectedCameraId);
    setStage('checking');
    createFaceLivenessSession();
  };

  // Create a Face Liveness session directly with AWS
  const createFaceLivenessSession = useCallback(async () => {
    console.log('[FaceLivenessCheck] Creating Face Liveness session...');
    setIsLoading(true);
    setError(null);
    
    // Check if user is authenticated before proceeding
    if (!user?.id) {
      console.warn('[FaceLivenessCheck] No authenticated user found');
      setError('You must be logged in to use face verification. Please sign in and try again.');
      setStage('error');
      setIsLoading(false);
      return;
    }
    
    // Check if camera is available before proceeding
    try {
      console.log('[FaceLivenessCheck] Checking camera availability...');
      let cameraAvailable = false;
      
      try {
        // Try to access the camera directly with the selected device id
        const constraints = { 
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true 
        };
        
        console.log('[FaceLivenessCheck] Using camera constraints:', constraints);
        const testStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (testStream) {
          cameraAvailable = true;
          // Release the camera immediately
          testStream.getTracks().forEach(track => track.stop());
        }
      } catch (cameraErr) {
        console.error('[FaceLivenessCheck] Camera check failed:', cameraErr);
        cameraAvailable = false;
      }
      
      // If camera is not available, show error and return
      if (!cameraAvailable) {
        const errorMessage = 'Camera access is required for face verification. Please ensure your camera is connected and not being used by another application, and you have granted camera permission to this site.';
        console.error('[FaceLivenessCheck] Camera not available:', errorMessage);
        setError(errorMessage);
        setStage('error');
        setIsLoading(false);
        return;
      }
      
      console.log('[FaceLivenessCheck] Camera is available, proceeding with session creation');
    } catch (err) {
      console.error('[FaceLivenessCheck] Error checking camera:', err);
    }
    
    try {
      // Get AWS credentials - try Amplify Auth first, then fall back to direct AWS config
      console.log('[FaceLivenessCheck] Attempting to get AWS credentials...');
      let credentials;
      
      try {
        // Try to get credentials from Amplify Auth
        const authSession = await fetchAuthSession();
        console.log('[FaceLivenessCheck] Auth session result:', authSession);
        
        if (authSession?.credentials) {
          credentials = authSession.credentials;
          console.log('[FaceLivenessCheck] Successfully obtained Amplify credentials');
        } else {
          console.log('[FaceLivenessCheck] No credentials in auth session, will use configured AWS credentials');
        }
      } catch (authError) {
        console.warn('[FaceLivenessCheck] Error getting Amplify auth session:', authError);
      }
      
      // Get direct environment variable credentials as a fallback
      if (!credentials) {
        console.log('[FaceLivenessCheck] Trying to get AWS credentials from environment variables');
        const envCredentials = getAwsCredentialsFromEnv();
        
        if (envCredentials) {
          console.log('[FaceLivenessCheck] Successfully obtained credentials from environment variables');
          credentials = envCredentials;
        } else {
          console.warn('[FaceLivenessCheck] No credentials found in environment variables either');
        }
      }
      
      // Initialize Rekognition client - with or without explicit credentials
      console.log('[FaceLivenessCheck] Initializing Rekognition client with region:', AWS_REGION);
      const rekognitionConfig = { 
        region: AWS_REGION
      };
      
      // Only add credentials if we got them
      if (credentials) {
        console.log('[FaceLivenessCheck] Using explicit credentials for Rekognition client');
        rekognitionConfig.credentials = credentials;
      } else {
        console.warn('[FaceLivenessCheck] No credentials available, SDK will try to use default credential provider chain');
      }
      
      const rekognition = new RekognitionClient(rekognitionConfig);
      
      // Create session command
      const command = new CreateFaceLivenessSessionCommand({
        ClientRequestToken: `session-${user?.id || 'anonymous'}-${Date.now()}`,
        Settings: {
          OutputConfig: {
            S3Bucket: FACE_LIVENESS_S3_BUCKET,
            S3KeyPrefix: `face-liveness/${user?.id || 'anonymous'}/`
          }
        }
      });
      
      // Send request to AWS
      console.log('[FaceLivenessCheck] Sending CreateFaceLivenessSession request to AWS...');
      const response = await rekognition.send(command);
      
      // Handle successful response
      console.log('[FaceLivenessCheck] Session created successfully:', response);
      setSessionId(response.SessionId);
      setStage('checking');
      setIsLoading(false);
    } catch (err) {
      console.error('[FaceLivenessCheck] Error creating Face Liveness session:', err);
      
      // Format error message based on error type
      let errorMessage = 'Failed to initiate face verification. Please try again.';
      
      if (err.name === 'AccessDeniedException' || err.message?.includes('Access Denied')) {
        errorMessage = 'Access denied. Your AWS account may not have permissions for Face Liveness detection operations.';
      } else if (err.name === 'ResourceNotFoundException') {
        errorMessage = 'The S3 bucket specified for Face Liveness does not exist or is not accessible.';
      } else if (err.name === 'ValidationException') {
        errorMessage = `Validation error: ${err.message}`;
      } else if (err.name === 'ThrottlingException') {
        errorMessage = 'AWS request rate exceeded. Please try again in a few moments.';
      } else if (err.message?.includes('identityId')) {
        errorMessage = 'Authentication error: Unable to get valid AWS credentials. Please log in again.';
      } else if (err.message?.includes('Credential is missing') || err.message?.includes('Missing credentials')) {
        errorMessage = 'AWS credentials are missing. You need to set up valid AWS credentials in your .env file with VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY.';
        console.error('[FaceLivenessCheck] Credentials are missing. Environment access key available:', !!import.meta.env.VITE_AWS_ACCESS_KEY_ID);
      }
      
      setError(errorMessage);
      setStage('error');
      setIsLoading(false);
      
      if (onError) {
        console.log('[FaceLivenessCheck] Calling onError callback');
        onError(err);
      }
    }
  }, [user, onError, AWS_REGION, FACE_LIVENESS_S3_BUCKET, selectedCameraId]);

  // Initialize on component mount
  useEffect(() => {
    console.log('[FaceLivenessCheck] useEffect triggered - calling createFaceLivenessSession');
    
    // Add a small delay before requesting camera to ensure any previous instances are cleaned up
    const timeoutId = setTimeout(() => {
      // Don't auto-start session - wait for camera selection
      // createFaceLivenessSession();
    }, 500);
    
    // Cleanup function
    return () => {
      console.log('[FaceLivenessCheck] Component unmounting - cleaning up resources');
      clearTimeout(timeoutId);
      
      if (streamRef.current) {
        console.log('[FaceLivenessCheck] Stopping all camera tracks');
        streamRef.current.getTracks().forEach(track => {
          console.log('[FaceLivenessCheck] Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('[FaceLivenessCheck] Stopping media recorder');
        mediaRecorderRef.current.stop();
      }
    };
  }, [createFaceLivenessSession]);

  // Handle when analysis starts
  const handleAnalysisStart = useCallback(() => {
    console.log('[FaceLivenessCheck] Liveness analysis started');
    
    // Start recording if the browser supports it
    if (streamRef.current && typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm')) {
      try {
        const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;
        videoChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(videoBlob);
          setRecordedVideo(videoUrl);
        };
        
        mediaRecorder.start();
        console.log('[FaceLivenessCheck] Video recording started');
      } catch (error) {
        console.error('[FaceLivenessCheck] Error starting video recording:', error);
      }
    }
  }, []);

  // Handle when analysis is complete
  const handleAnalysisComplete = useCallback(async () => {
    console.log('[FaceLivenessCheck] Face liveness analysis complete');
    
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setStage('complete');
    
    try {
      setIsLoading(true);
      
      // Get AWS credentials - try Amplify Auth first, then fall back to direct AWS config
      let credentials;
      
      try {
        // Try to get credentials from Amplify Auth
        const authSession = await fetchAuthSession();
        if (authSession?.credentials) {
          credentials = authSession.credentials;
          console.log('[FaceLivenessCheck] Successfully obtained Amplify credentials for results');
        } else {
          console.log('[FaceLivenessCheck] No credentials in auth session for results, using configured AWS credentials');
        }
      } catch (authError) {
        console.warn('[FaceLivenessCheck] Error getting Amplify auth session for results:', authError);
      }
      
      // Get direct environment variable credentials as a fallback
      if (!credentials) {
        console.log('[FaceLivenessCheck] Trying to get AWS credentials from environment variables for results');
        const envCredentials = getAwsCredentialsFromEnv();
        
        if (envCredentials) {
          console.log('[FaceLivenessCheck] Successfully obtained credentials from environment variables for results');
          credentials = envCredentials;
        } else {
          console.warn('[FaceLivenessCheck] No credentials found in environment variables for results');
        }
      }
      
      // Initialize Rekognition client - with or without explicit credentials
      const rekognitionConfig = { 
        region: AWS_REGION
      };
      
      // Only add credentials if we got them
      if (credentials) {
        console.log('[FaceLivenessCheck] Using explicit credentials for Rekognition client in results');
        rekognitionConfig.credentials = credentials;
      } else {
        console.warn('[FaceLivenessCheck] No credentials available for results, SDK will try to use default credential provider chain');
      }
      
      const rekognition = new RekognitionClient(rekognitionConfig);
      
      // Create and send command
      const command = new GetFaceLivenessSessionResultsCommand({
        SessionId: sessionId
      });
      
      console.log('[FaceLivenessCheck] Getting results for session:', sessionId);
      const response = await rekognition.send(command);
      
      console.log('[FaceLivenessCheck] Results received:', response);
      
      // Process the response
      const confidenceThreshold = parseFloat(import.meta.env.VITE_FACE_LIVENESS_CONFIDENCE_THRESHOLD || '90');
      const result = {
        isLive: response.Status === 'SUCCEEDED' && response.Confidence >= confidenceThreshold,
        confidence: response.Confidence || 0,
        status: response.Status,
        referenceImage: response.ReferenceImage?.S3ObjectKey 
          ? `https://${FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${response.ReferenceImage.S3ObjectKey}`
          : null,
        auditImages: response.AuditImages?.map(img => 
          img.S3ObjectKey 
            ? `https://${FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${img.S3ObjectKey}`
            : null
        ).filter(Boolean) || []
      };
      
      console.log('[FaceLivenessCheck] Processed results:', result);
      setLivenessResult(result);
      setReferenceImage(result.referenceImage);
      
      // Proceed with face registration if successful
      if (result.isLive && result.confidence > confidenceThreshold) {
        console.log('[FaceLivenessCheck] Liveness check passed, proceeding with face registration');
        if (result.referenceImage) {
          await registerFace(result.referenceImage);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('[FaceLivenessCheck] Error getting Face Liveness results:', err);
      
      // Format error message based on error type
      let errorMessage = 'Failed to process verification results. Please try again.';
      
      if (err.name === 'AccessDeniedException' || err.message?.includes('Access Denied')) {
        errorMessage = 'Access denied. Your AWS account may not have permissions to get Face Liveness results.';
      } else if (err.name === 'ResourceNotFoundException') {
        errorMessage = 'The Face Liveness session could not be found. It may have expired.';
      } 
      
      setError(errorMessage);
      setStage('error');
      setIsLoading(false);
      
      if (onError) {
        console.log('[FaceLivenessCheck] Calling onError callback');
        onError(err);
      }
    }
  }, [sessionId, onError, AWS_REGION, FACE_LIVENESS_S3_BUCKET]);

  // Register the face after successful liveness check
  const registerFace = async (imageUrl) => {
    console.log('[FaceLivenessCheck] Registering face with image URL:', imageUrl);
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const imageBlob = await response.blob();
      
      // Use your existing face registration service
      if (user?.id) {
        const result = await FaceIndexingService.indexFace(user.id, imageBlob);
        
        if (result.success) {
          console.log('[FaceLivenessCheck] Face registered successfully:', result);
          if (onSuccess) {
            console.log('[FaceLivenessCheck] Calling onSuccess callback');
            onSuccess(result);
          }
        } else {
          console.error('[FaceLivenessCheck] Face registration failed:', result.error);
          setError(`Face verification completed, but registration failed: ${result.error}`);
          if (onError) {
            console.log('[FaceLivenessCheck] Calling onError callback due to registration failure');
            onError(new Error(result.error));
          }
        }
      }
    } catch (err) {
      console.error('[FaceLivenessCheck] Error registering face:', err);
      setError('Face verification completed, but registration failed.');
      if (onError) {
        console.log('[FaceLivenessCheck] Calling onError callback due to exception');
        onError(err);
      }
    }
  };

  // Handle when an error occurs during the liveness check
  const handleError = useCallback((err) => {
    console.error('[FaceLivenessCheck] Liveness check error:', err);
    setError('Face verification failed. Please try again.');
    setStage('error');
    
    if (onError) {
      console.log('[FaceLivenessCheck] Calling onError callback from handleError');
      onError(err);
    }
    
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [onError]);

  // Save reference to the stream when camera is accessed
  const handleCameraAccessGranted = useCallback((stream) => {
    console.log('[FaceLivenessCheck] Camera access granted');
    streamRef.current = stream;
  }, []);

  // Handle close button click
  const handleClose = useCallback(() => {
    console.log('[FaceLivenessCheck] Close button clicked, calling onClose callback');
    if (onClose) onClose();
  }, [onClose]);

  // Simplify the render function to prioritize the FaceLivenessDetector component
  if (sessionId) {
    console.log('[FaceLivenessCheck] Rendering with sessionId:', sessionId);
    console.log('[FaceLivenessCheck] *** RENDERING FACE LIVENESS DETECTOR WITH AWS SDK COMPONENT ***');
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[999] overflow-y-auto" 
        style={{ 
          paddingTop: isIOS() ? 'env(safe-area-inset-top, 20px)' : '16px',
          paddingBottom: isIOS() ? 'env(safe-area-inset-bottom, 40px)' : '16px',
          paddingLeft: isIOS() ? 'env(safe-area-inset-left, 12px)' : '12px',
          paddingRight: isIOS() ? 'env(safe-area-inset-right, 12px)' : '12px',
          height: '100%',
          width: '100%'
        }}
        ref={containerRef}
      >
        <div className="bg-white rounded-lg overflow-hidden w-full max-w-sm sm:max-w-md shadow-xl mx-auto my-auto flex flex-col"
          style={{
            maxHeight: isIOS() ? 'calc(100vh - 80px)' : 'calc(100vh - 60px)',
            height: 'auto'
          }}
        >
          <div className="p-2 sm:p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold">Face Verification</h2>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="relative flex-grow" style={{ 
            minHeight: isIOS() ? '250px' : '300px',
            maxHeight: isIOS() ? '500px' : '600px',
            overflowY: 'hidden'
          }}>
            {console.log('[FaceLivenessCheck] About to render AWS FaceLivenessDetector component')}
            <FaceLivenessDetector
              sessionId={sessionId}
              region={AWS_REGION}
              onAnalysisComplete={handleAnalysisComplete}
              onError={handleError}
              onAnalysisStarted={handleAnalysisStart}
              onCameraAccessGranted={handleCameraAccessGranted}
              disableInstructionScreen={false}
              displayDebugInfo={true}
              cameraFacing="user"
              cameraConstraints={selectedCameraId ? { deviceId: { exact: selectedCameraId } } : undefined}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}
            />
            {console.log('[FaceLivenessCheck] AWS FaceLivenessDetector component rendered')}
          </div>
        </div>
      </div>
    );
  }
  
  // Camera selection screen
  if (stage === 'init') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[999] overflow-y-auto"
        style={{ 
          paddingTop: isIOS() ? 'env(safe-area-inset-top, 20px)' : '16px',
          paddingBottom: isIOS() ? 'env(safe-area-inset-bottom, 40px)' : '16px',
          paddingLeft: isIOS() ? 'env(safe-area-inset-left, 12px)' : '12px',
          paddingRight: isIOS() ? 'env(safe-area-inset-right, 12px)' : '12px',
          height: '100%',
          width: '100%'
        }}
        ref={containerRef}
      >
        <div className="bg-white rounded-lg overflow-hidden w-full max-w-sm sm:max-w-md shadow-xl mx-auto my-auto"
          style={{
            maxHeight: isIOS() ? 'calc(100vh - 80px)' : 'calc(100vh - 60px)'
          }}
        >
          <div className="p-3 sm:p-5">
            <div className="flex justify-between items-center mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-semibold">Select Camera</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isCameraLoading ? (
              <div className="flex flex-col items-center justify-center py-3">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Detecting available cameras...</p>
              </div>
            ) : cameraDevices.length > 0 ? (
              <>
                <div className="mb-4 sm:mb-5">
                  <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Choose a camera:
                  </label>
                  <select
                    id="camera-select"
                    value={selectedCameraId || ''}
                    onChange={handleCameraChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  >
                    {cameraDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${cameraDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={startFaceLivenessSession}
                  disabled={!selectedCameraId}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  Start Face Verification
                </button>
                
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                  Please select your preferred camera and ensure it's not being used by another application.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-red-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium mb-2 text-sm sm:text-base">No cameras detected</p>
                <p className="text-gray-600 mb-4 text-xs sm:text-sm">
                  Please make sure your camera is connected and you've granted permission to use it.
                </p>
                <button
                  onClick={() => getVideoInputDevices().then(devices => setCameraDevices(devices))}
                  className="mt-1 sm:mt-2 px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state while creating session
  console.log('[FaceLivenessCheck] Rendering loading state - no sessionId yet, isLoading:', isLoading);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[999] overflow-y-auto"
      style={{ 
        paddingTop: isIOS() ? 'env(safe-area-inset-top, 20px)' : '16px',
        paddingBottom: isIOS() ? 'env(safe-area-inset-bottom, 40px)' : '16px',
        paddingLeft: isIOS() ? 'env(safe-area-inset-left, 12px)' : '12px',
        paddingRight: isIOS() ? 'env(safe-area-inset-right, 12px)' : '12px',
        height: '100%',
        width: '100%'
      }}
      ref={containerRef}
    >
      <div className="bg-white rounded-lg overflow-hidden w-full max-w-sm sm:max-w-md shadow-xl mx-auto my-auto"
        style={{
          maxHeight: isIOS() ? 'calc(100vh - 80px)' : 'calc(100vh - 60px)'
        }}
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Initializing face verification...</p>
              </>
            ) : (
              <>
                {error ? (
                  <>
                    <div className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-red-100 flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-2 text-center text-sm sm:text-base">{error}</p>
                    <p className="text-gray-500 text-xs sm:text-sm mb-4 text-center">
                      This might be due to missing AWS credentials or permissions.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-sm sm:text-base">Waiting for verification to start...</p>
                  </>
                )}
                
                <button
                  onClick={() => {
                    // Log detailed diagnostic information
                    console.log('[FaceLivenessCheck] DIAGNOSTIC - Retry attempt');
                    console.log('- User authenticated:', !!user?.id);
                    console.log('- AWS Region:', AWS_REGION);
                    console.log('- S3 Bucket:', FACE_LIVENESS_S3_BUCKET);
                    console.log('- Environment variables:');
                    console.log('  - VITE_AWS_ACCESS_KEY_ID available:', !!import.meta.env.VITE_AWS_ACCESS_KEY_ID);
                    console.log('  - VITE_AWS_SECRET_ACCESS_KEY available:', !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY);
                    
                    // Get credentials status
                    const envCreds = getAwsCredentialsFromEnv();
                    console.log('- Direct env credentials available:', !!envCreds);
                    
                    // Reset state and try again
                    setError(null);
                    setStage('init');
                  }}
                  className="mt-3 sm:mt-4 px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Select a Different Camera
                </button>
              </>
            )}
            
            {!isLoading && (
              <button
                onClick={handleClose}
                className="mt-2 px-3 py-1 sm:px-4 sm:py-2 text-gray-600 text-sm sm:text-base rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceLivenessCheck; 