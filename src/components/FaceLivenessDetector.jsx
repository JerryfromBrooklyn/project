// Add a prominent console log at the top of the file
console.log('[FaceLivenessDetector.jsx] FILE LOADED - This is the AWS Face Liveness component');

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react-liveness/styles.css';
import { useAuth } from '../context/AuthContext';
import { FaceIndexingService } from '../services/FaceIndexingService';
import { createFaceLivenessSession, getFaceLivenessSessionResults } from '../api/faceLivenessApi';

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
  
  let testStream = null;
  try {
    // First request camera permission
    testStream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Then enumerate devices (this should now have device labels)
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    console.log('[FaceLivenessDetector] Available video devices:', videoDevices);
    
    // Log each camera's details for debugging
    videoDevices.forEach((device, index) => {
      console.log(`[FaceLivenessDetector] Camera #${index + 1} details:`, device);
    });
    
    return videoDevices;
  } catch (error) {
    console.error('[FaceLivenessDetector] Error accessing media devices:', error);
    return [];
  } finally {
    // Ensure we release camera resources immediately
    if (testStream) {
      testStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[FaceLivenessDetector] Stopping test track: ${track.label}`);
      });
    }
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
  console.log('[FaceLivenessCheck] Browser details:', { 
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor
  });
  
  // Basic state
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState('init'); // init, camera-select, checking, complete, error
  
  // State to track if a specific camera access error occurred
  const [showCameraAccessError, setShowCameraAccessError] = useState(false);
  
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
  const sessionCreatedRef = useRef(false); // Prevent multiple session creations
  const cameraTestingRef = useRef(false);
  const retryTimeoutRef = useRef(null);

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

  // Initialize on component mount
  useEffect(() => {
    console.log('[FaceLivenessCheck] useEffect triggered - camera setup');
    
    // Function to initialize camera and create session
    const setupCameraAndSession = async () => {
      if (cameraTestingRef.current) return;
      cameraTestingRef.current = true;
      
      try {
        // Get list of available cameras
        const videoDevices = await getVideoInputDevices();
        setCameraDevices(videoDevices);
        
        if (videoDevices.length === 0) {
          console.error('[FaceLivenessCheck] No cameras found');
          setError('No video devices detected. Please ensure your camera is connected and permissions are granted.');
          setShowCameraAccessError(true);
          setIsLoading(false);
          cameraTestingRef.current = false;
          return;
        }
        
        // Auto-select the first camera
        const firstCamera = videoDevices[0];
        console.log('[FaceLivenessCheck] Auto-selecting first camera:', firstCamera.label);
        setSelectedCameraId(firstCamera.deviceId);
        
        // Add a slight delay before starting AWS liveness check
        // This allows for complete cleanup of previous camera resources
        retryTimeoutRef.current = setTimeout(() => {
          startFaceLivenessSession(firstCamera);
        }, 500); // 500ms delay to ensure camera resources are fully released
      } catch (error) {
        console.error('[FaceLivenessCheck] Error during camera setup:', error);
        setError(`Camera access failed: ${error.message}`);
        setShowCameraAccessError(true);
        setIsLoading(false);
        cameraTestingRef.current = false;
      }
    };
    
    setupCameraAndSession();
    
    // Clear any resources on effect cleanup
    return () => {
      cameraTestingRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
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
    const newCameraId = e.target.value;
    console.log('[FaceLivenessCheck] Selected camera changed to:', newCameraId);
    
    // Stop any existing stream when changing cameras
    if (streamRef.current) {
      console.log('[FaceLivenessCheck] Stopping existing stream before changing camera');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setSelectedCameraId(newCameraId);
  };

  // Start the Face Liveness session with the selected camera
  const startFaceLivenessSession = async (camera) => {
    if (!camera || !camera.deviceId) {
      console.error('[FaceLivenessCheck] No camera selected for Face Liveness session');
      setError('No camera selected');
      setIsLoading(false);
      return;
    }
    
    console.log('[FaceLivenessCheck] Starting Face Liveness session with camera ID:', camera.deviceId);
    console.log('[FaceLivenessCheck] Selected camera device:', camera.label);
    
    try {
      // Reset any previous errors
      setError(null);
      setShowCameraAccessError(false);
      
      console.log('[FaceLivenessCheck] Creating Face Liveness session...');
      
      // Make sure we don't have multiple sessions running
      if (sessionId) {
        console.log('[FaceLivenessCheck] Session already exists, reusing:', sessionId);
        return;
      }
      
      // Ensure previous camera resources are fully released
      if (streamRef.current) {
        console.log('[FaceLivenessCheck] Stopping previous camera track: ${track.label}');
        streamRef.current.getTracks().forEach(track => {
          console.log('[FaceLivenessCheck] Stopping previous camera track: ${track.label}');
          track.stop();
        });
        streamRef.current = null;
      }
      
      console.log('[FaceLivenessCheck] Checking camera availability...');
      
      // Test camera access before creating the session
      // This pre-flight check ensures the camera is available and working
      try {
        const constraints = {
          video: {
            deviceId: { exact: camera.deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        
        console.log('[FaceLivenessCheck] Using camera constraints:', JSON.stringify(constraints));
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[FaceLivenessCheck] Successfully accessed camera with constraints');
        
        // Keep reference to first video track for debugging
        const videoTrack = stream.getVideoTracks()[0];
        console.log('[FaceLivenessCheck] Camera test track:', videoTrack);
        
        // Wait briefly to ensure camera is initialized before releasing it
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Now release the camera for AWS SDK to use
        console.log('[FaceLivenessCheck] Releasing camera test stream');
        stream.getTracks().forEach(track => {
          track.stop();
        });
        
        // Wait for camera to fully release before proceeding
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('[FaceLivenessCheck] Camera is available, proceeding with session creation');
      } catch (error) {
        console.error('[FaceLivenessCheck] Camera pre-check failed:', error);
        setError(`Camera access error: ${error.message}`);
        setShowCameraAccessError(true);
        setIsLoading(false);
        return;
      }
      
      console.log('[FaceLivenessCheck] Calling direct AWS SDK for session creation with userId:', user?.id);
      
      // Create liveness session with AWS SDK
      try {
        // Call the API to create a session
        const response = await createFaceLivenessSession(user?.id);
        
        // Check for a valid session ID in the response
        if (response && response.sessionId) {
          console.log('[FaceLivenessCheck] Session created successfully:', response.sessionId);
          setSessionId(response.sessionId);
          setStage('checking');
          setIsLoading(false);
        } else {
          console.error('[FaceLivenessCheck] Invalid response from API:', response);
          setError('Failed to create a Face Liveness session. Please try again.');
          setStage('error');
          setIsLoading(false);
          
          if (onError) {
            console.log('[FaceLivenessCheck] Calling onError callback');
            onError(new Error('Invalid API response'));
          }
        }
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
    } catch (err) {
      console.error('[FaceLivenessCheck] Unexpected error starting Face Liveness session:', err);
      setError(`Unexpected error: ${err.message}`);
      setStage('error');
      setIsLoading(false);
      
      if (onError) {
        onError(err);
      }
    }
  };

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
      
      // Use the direct API approach instead of server
      console.log('[FaceLivenessCheck] Getting results for session via direct API:', sessionId);
      const result = await getFaceLivenessSessionResults(sessionId);
      
      // Check if the response contains an error
      if (result.error) {
        console.error('[FaceLivenessCheck] Error getting session results:', result.error);
        setError(`Session results error: ${result.error}`);
        
        if (onError) {
          onError(new Error(result.error));
        }
        
        setIsLoading(false);
        return;
      }
      
      console.log('[FaceLivenessCheck] Liveness results received:', {
        isLive: result.isLive,
        confidence: result.confidence,
        status: result.status,
        hasReferenceImage: !!result.referenceImage,
        auditImagesCount: result.auditImages?.length || 0
      });
      
      setLivenessResult(result);
      setReferenceImage(result.referenceImage);
      
      // Proceed with face registration if successful
      if (result.isLive && result.referenceImage) {
        console.log('[FaceLivenessCheck] Liveness check passed, proceeding with face registration');
        await registerFace(result.referenceImage);
      } else {
        console.warn('[FaceLivenessCheck] Liveness check failed:', {
          isLive: result.isLive,
          confidence: result.confidence
        });
        
        if (!result.isLive) {
          setError('Face verification failed. The system could not verify that a live person was present.');
          if (onError) {
            onError(new Error('Liveness check failed with low confidence'));
          }
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
  }, [sessionId, onError, onSuccess, user?.id]);

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
    
    // Stop any existing stream before assigning the new one
    if (streamRef.current) {
      console.log('[FaceLivenessCheck] Stopping existing stream before assigning new one');
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Log what we received
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('[FaceLivenessCheck] Camera track granted:', {
          kind: track.kind,
          label: track.label,
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState
        });
      });
    }
    
    // Save the stream reference
    streamRef.current = stream;
  }, []);

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    console.log('[FaceLivenessCheck] Close button clicked, calling onClose callback');
    if (onClose) onClose();
  }, [onClose]);

  // If we have a camera error, show a user-friendly error with retry option
  if (showCameraAccessError) {
    return (
      <div className="face-liveness-container error-container">
        <div className="error-message">
          <h3>Camera Access Error</h3>
          <p>{error || 'Unable to access your camera. Please ensure that:'}</p>
          <ul>
            <li>Your camera is connected and working</li>
            <li>You've granted camera permission to this website</li>
            <li>No other application is currently using your camera</li>
          </ul>
          <button 
            className="retry-button" 
            onClick={() => {
              setShowCameraAccessError(false);
              setIsLoading(true);
              setError(null);
              // Get the selected camera device
              const selectedDevice = cameraDevices.find(device => device.deviceId === selectedCameraId);
              if (selectedDevice) {
                // Add delay before retry
                setTimeout(() => {
                  startFaceLivenessSession(selectedDevice);
                }, 500);
              } else {
                setError("No camera selected. Please choose a camera first.");
                setShowCameraAccessError(true);
                setIsLoading(false);
              }
            }}
          >
            Retry
          </button>
          <button className="close-button" onClick={handleCloseClick}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Simplify the render function to prioritize the FaceLivenessDetector component
  if (sessionId) {
    console.log('[FaceLivenessCheck] Rendering with sessionId:', sessionId);
    console.log('[FaceLivenessCheck] *** RENDERING FACE LIVENESS DETECTOR WITH AWS SDK COMPONENT ***');
    console.log('[FaceLivenessCheck] Using camera constraints:', {
      deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
      width: { ideal: 640 },
      height: { ideal: 480 }
    });
    
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[999] p-4"
        ref={containerRef}
      >
        {/* Modal container with max-height and internal scrolling */}
        <div 
          className="bg-white rounded-lg overflow-hidden w-full max-w-md shadow-xl mx-auto flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          {/* Modal Header (fixed size) */}
          <div className="p-3 sm:p-4 bg-gray-50 border-b flex justify-between items-center flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold">Face Verification</h2>
            <button 
              onClick={handleCloseClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content Area with fixed height and scrolling */}
          <div 
            className="relative flex-grow overflow-y-auto" 
            style={{ height: '450px' }}
          >
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
              deviceId={selectedCameraId}
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
  
  // Camera selection screen (apply similar logic)
  if (stage === 'init') {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[999] p-4"
        ref={containerRef}
      >
        {/* Modal container */}
        <div 
          className="bg-white rounded-lg overflow-hidden w-full max-w-sm sm:max-w-md shadow-xl mx-auto flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          {/* Scrollable content area */}
          <div className="p-4 sm:p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-5 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold">Select Camera</h2>
              <button 
                onClick={handleCloseClick}
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
                  onClick={() => startFaceLivenessSession(cameraDevices.find(d => d.deviceId === selectedCameraId))}
                  disabled={!selectedCameraId}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  aria-label="Start face verification process"
                  tabIndex={0}
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
                  aria-label="Retry detecting cameras"
                  tabIndex={0}
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
  
  // Loading state while creating session (apply similar logic)
  console.log('[FaceLivenessCheck] Rendering loading state - no sessionId yet, isLoading:', isLoading);
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[999] p-4"
      ref={containerRef}
    >
      {/* Modal container */}
      <div 
        className="bg-white rounded-lg overflow-hidden w-full max-w-sm sm:max-w-md shadow-xl mx-auto my-auto flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Scrollable content area */}
        <div className="p-4 sm:p-5 overflow-y-auto">
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
                  aria-label="Retry face verification setup or select a different camera"
                  tabIndex={0}
                >
                  Retry / Select Camera
                </button>
              </>
            )}
            
            {!isLoading && (
              <button
                onClick={handleCloseClick}
                className="mt-2 px-3 py-1 sm:px-4 sm:py-2 text-gray-600 text-sm sm:text-base rounded-md hover:bg-gray-100"
                aria-label="Cancel face verification"
                tabIndex={0}
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

// Add CSS styles for the face liveness detector
const styles = `
.face-liveness-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  min-height: 400px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.error-message {
  max-width: 400px;
}

.error-message h3 {
  color: #e53935;
  margin-bottom: 1rem;
}

.error-message ul {
  text-align: left;
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.error-message li {
  margin-bottom: 0.5rem;
}

.retry-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  margin-right: 1rem;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #388e3c;
}

.close-button {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #d32f2f;
}

.absolute-top-right {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Add styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 