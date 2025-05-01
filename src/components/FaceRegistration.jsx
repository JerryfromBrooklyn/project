import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, RotateCcw, Check, Video, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import FaceLivenessCheck from './FaceLivenessDetector';
import ErrorBoundary from './ErrorBoundary';

// Define face registration method - now using face liveness
const FACE_REGISTER_METHOD = 'liveness';

const FaceRegistration = ({ onSuccess, onClose }) => {
  console.log('[FaceRegistration] Component Mounted'); // Log on mount

  const [stage, setStage] = useState('init'); // init, liveness, success, error
  const [error, setError] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null); // Add camera permission state
  const { user } = useAuth();

  console.log('[FaceRegistration] Initial render with user:', user?.id || 'not available');
  console.log('[FaceRegistration] Initial stage:', stage);

  // Cleanup function for camera resources
  useEffect(() => {
    return () => {
      console.log('[FaceRegistration] Component unmounting - cleaning up any lingering camera resources');
      // Try to stop any active media tracks that might be left
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (stream) {
            console.log('[FaceRegistration] Stopping lingering camera tracks on unmount');
            stream.getTracks().forEach(track => track.stop());
          }
        })
        .catch(err => {
          console.log('[FaceRegistration] No active camera to clean up on unmount');
        });
    };
  }, []);

  // Check camera permission
  useEffect(() => {
    if (stage === 'liveness') {
      console.log('[FaceRegistration] Checking camera permission...');
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          console.log('[FaceRegistration] Camera permission granted');
          setCameraPermission('granted');
          // Stop the stream immediately - we're just checking permission
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((err) => {
          console.error('[FaceRegistration] Camera permission error:', err);
          setCameraPermission('denied');
          setError('Camera access denied. Please allow camera access to continue.');
          setStage('error');
        });
    }
  }, [stage]);

  // Handle successful liveness verification and face registration
  const handleLivenessSuccess = useCallback((result) => {
    console.log('[FaceRegistration] handleLivenessSuccess called with result:', result);
    setRegistrationResult(result);
    setStage('success');
    console.log('[FaceRegistration] Stage set to: success');
    
    // Call the parent component's onSuccess handler
    if (onSuccess) {
      console.log('[FaceRegistration] Calling onSuccess callback');
      onSuccess(result);
    }
  }, [onSuccess]);

  // Handle errors during the liveness process
  const handleLivenessError = useCallback((err) => {
    console.error('[FaceRegistration] handleLivenessError triggered with error:', err);
    setError(err.message || 'An error occurred during face verification.');
    setStage('error');
    console.log('[FaceRegistration] Stage set to: error');
  }, []);

  // Log stage changes
  useEffect(() => {
    console.log(`[FaceRegistration] Stage changed to: ${stage}`);
  }, [stage]);

  // Render appropriate UI based on current stage
  const renderContent = () => {
    console.log(`[FaceRegistration] Rendering content for stage: ${stage}`);
    switch (stage) {
      case 'init':
        return (
          <div className="p-6 bg-white rounded-lg shadow-xl max-w-md mx-auto relative">
            <button
              onClick={() => {
                console.log('[FaceRegistration] Close button (X) clicked');
                onClose(); // Call the original onClose passed from Dashboard
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Face Registration</h2>
              <p className="text-gray-600 mb-6">
                To verify your identity, we'll need to perform a face liveness check.
                This ensures you're a real person and not an image or video.
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Camera className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-700">Requirements</h3>
                      <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
                        <li>Ensure your face is clearly visible</li>
                        <li>Good lighting in your environment</li>
                        <li>Remove sunglasses or face coverings</li>
                        <li>Follow the on-screen instructions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  console.log('[FaceRegistration] >>> "Begin Face Verification" button clicked <<<');
                  console.log('[FaceRegistration] About to set stage to "liveness"');
                  setStage('liveness');
                  console.log('[FaceRegistration] Stage set to "liveness" - FaceLivenessCheck should render next');
                }}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Begin Face Verification
              </button>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="p-6 bg-white rounded-lg shadow-xl max-w-md mx-auto">
            <div className="text-center">
              {console.log('[FaceRegistration] Rendering Success UI')}
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Registration Complete</h2>
              <p className="text-gray-600 mb-6">
                Your face has been successfully verified and registered.
                You can now use face recognition to log in.
              </p>
              
              <button 
                onClick={() => {
                  console.log('[FaceRegistration] Success UI: Done button clicked, calling onClose');
                  onClose();
                }}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="p-6 bg-white rounded-lg shadow-xl max-w-md mx-auto">
            <div className="text-center">
              {console.log('[FaceRegistration] Rendering Error UI with error:', error)}
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Registration Failed</h2>
              <p className="text-red-600 mb-6">
                {error || 'An error occurred during face registration.'}
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    console.log('[FaceRegistration] Error UI: Try Again button clicked, returning to init stage');
                    setStage('init');
                  }}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    console.log('[FaceRegistration] Error UI: Cancel button clicked, calling onClose');
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        console.error('[FaceRegistration] Unknown stage:', stage);
        return null;
    }
  };

  // This is a direct, standalone render of FaceLivenessCheck
  if (stage === 'liveness' && cameraPermission === 'granted') {
    return (
      <div className="fixed inset-0 z-[999]">
        <FaceLivenessCheck
          onSuccess={handleLivenessSuccess}
          onError={handleLivenessError}
          onClose={() => {
            console.log('[FaceRegistration] FaceLivenessCheck onClose called, returning to init stage');
            setStage('init');
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999]">
      {/* Main content */}
      {stage !== 'liveness' && (
        <div className="relative max-w-md w-full">
          {renderContent()}
        </div>
      )}
      
      {/* Render FaceLivenessCheck in fallback mode if camera permission is pending */}
      {stage === 'liveness' && cameraPermission !== 'granted' && (
        <ErrorBoundary
          fallback={
            <div className="p-6 bg-white rounded-lg shadow-xl max-w-md mx-auto">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2">Component Error</h2>
                <p className="text-red-600 mb-6">
                  There was an error rendering the Face Liveness component.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      console.log('[FaceRegistration] Error boundary: Try Again button clicked');
                      setStage('init');
                    }}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      console.log('[FaceRegistration] Error boundary: Cancel button clicked');
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          }
          onError={(error) => {
            console.error('[FaceRegistration] Error boundary caught error:', error);
            handleLivenessError(error);
          }}
        >
          <div className="p-8 bg-white rounded-lg flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Checking camera access...</p>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default FaceRegistration;