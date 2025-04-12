import React, { useState, useRef, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { AlertCircle, Camera, Check, Info, RotateCcw, User, X } from 'lucide-react';

const FaceRegistration: React.FC = () => {
  const [captureMode, setCaptureMode] = useState<'idle' | 'capturing' | 'reviewing'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facesDetected, setFacesDetected] = useState<number>(0);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [registeredName, setRegisteredName] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    return () => {
      // Cleanup: stop the camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCaptureMode('capturing');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Unable to access camera. Please check permissions and try again.');
      setRegistrationStatus('error');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCaptureMode('idle');
  };
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL (base64 encoded image)
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        
        // Move to review mode
        setCaptureMode('reviewing');
        
        // Simulate face detection (this would be replaced with actual AWS Rekognition call)
        simulateFaceDetection();
        
        // Stop the camera
        stopCamera();
      }
    }
  };
  
  const simulateFaceDetection = () => {
    // This is a placeholder for actual face detection with AWS Rekognition
    // In a real app, you would send the image to your backend, which would call Rekognition
    const randomFaces = Math.random() > 0.2 ? 1 : 0;
    setFacesDetected(randomFaces);
  };
  
  const resetCapture = () => {
    setCapturedImage(null);
    setFacesDetected(0);
    setRegistrationStatus('idle');
    setErrorMessage('');
    setCaptureMode('idle');
  };
  
  const handleRegisterFace = () => {
    // This is a placeholder for actual face registration with AWS Rekognition
    // In a real app, you would send the image to your backend along with the user ID
    
    if (facesDetected === 0) {
      setErrorMessage('No faces detected in the image. Please try again with a clearer photo.');
      setRegistrationStatus('error');
      return;
    }
    
    if (facesDetected > 1) {
      setErrorMessage('Multiple faces detected. Please ensure only your face is in the frame.');
      setRegistrationStatus('error');
      return;
    }
    
    // Simulate a successful registration
    setRegistrationStatus('success');
    setRegisteredName('Your Face');  // In a real app, this would be the user's name
  };
  
  const retryCapture = () => {
    setCapturedImage(null);
    setFacesDetected(0);
    setRegistrationStatus('idle');
    setErrorMessage('');
    startCamera();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">Face Registration</h1>
            <p className="text-gray-600">
              Register your face to enable automatic identification in your photos. 
              This helps organize and find photos containing specific people.
            </p>
          </div>
          
          {/* Registration Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Register Your Face</h2>
              <p className="text-gray-600 mt-1">
                Take a clear photo of your face to register it with our system.
              </p>
            </div>
            
            <div className="p-6">
              {captureMode === 'idle' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Register Your Face?</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Make sure you're in a well-lit area and your face is clearly visible.
                    Look directly at the camera for best results.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </button>
                </div>
              )}
              
              {captureMode === 'capturing' && (
                <div>
                  <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-black mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full"
                      style={{ maxHeight: '480px' }}
                    />
                    
                    <div className="absolute inset-0 border-4 border-blue-400 border-dashed rounded-lg pointer-events-none opacity-60"></div>
                    
                    <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-2 py-1 rounded">
                      <div className="flex items-center">
                        <Info className="w-4 h-4 mr-1" />
                        Position your face in the frame
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors inline-flex items-center"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={captureImage}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Capture
                    </button>
                  </div>
                  
                  {/* Hidden canvas for capturing the image */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
              
              {captureMode === 'reviewing' && capturedImage && (
                <div>
                  <div className="rounded-lg overflow-hidden border border-gray-300 mb-4 bg-black">
                    <img 
                      src={capturedImage} 
                      alt="Captured face" 
                      className="w-full max-h-[480px] object-contain"
                    />
                  </div>
                  
                  {registrationStatus === 'idle' && (
                    <div>
                      {facesDetected === 0 && (
                        <div className="flex items-start p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800">No faces detected</h4>
                            <p className="text-yellow-700 text-sm">
                              We couldn't detect any faces in this image. Please try again with better lighting or positioning.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {facesDetected > 1 && (
                        <div className="flex items-start p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800">Multiple faces detected</h4>
                            <p className="text-yellow-700 text-sm">
                              We detected multiple faces in this image. Please ensure only your face is in the frame.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {facesDetected === 1 && (
                        <div className="flex items-start p-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
                          <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-800">Face detected successfully</h4>
                            <p className="text-green-700 text-sm">
                              Perfect! We've detected your face in the image. Ready to register?
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 justify-center">
                        <button
                          onClick={resetCapture}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors inline-flex items-center"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={retryCapture}
                          className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors inline-flex items-center"
                        >
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Retry
                        </button>
                        <button
                          onClick={handleRegisterFace}
                          className={`px-6 py-2 rounded-lg inline-flex items-center ${
                            facesDetected === 1
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={facesDetected !== 1}
                        >
                          <User className="w-5 h-5 mr-2" />
                          Register Face
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {registrationStatus === 'success' && (
                    <div className="flex items-start p-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-800">Registration Successful!</h4>
                        <p className="text-green-700 text-sm">
                          Your face has been successfully registered as "{registeredName}". 
                          You can now be identified in photos uploaded to the system.
                        </p>
                        <button
                          onClick={resetCapture}
                          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center text-sm"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {registrationStatus === 'error' && (
                    <div className="flex items-start p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800">Registration Failed</h4>
                        <p className="text-red-700 text-sm">{errorMessage}</p>
                        <button
                          onClick={retryCapture}
                          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center text-sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Tips Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Tips for Best Results</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <p className="text-gray-700">Ensure good lighting on your face, avoiding harsh shadows.</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <p className="text-gray-700">Look directly at the camera with a neutral expression.</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <p className="text-gray-700">Remove glasses, hats, or accessories that obscure your face.</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                <p className="text-gray-700">Use a neutral background with good contrast to your face.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration; 