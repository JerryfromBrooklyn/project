import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, AlertCircle, CheckCircle, Loader, Video, User, Info } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { indexFace } from '../services/FaceIndexingService';
import { detectFacesInImage } from '../services/FaceDetectionService';
import { updatePhotoVisibility } from '../services/userVisibilityService';

// ... existing code ...

// After capturing the face image and getting face attributes:
// Find this section in handleRegister or saveFaceData
// where the face registration is complete

// Example location:
// After the successful face registration but before the final success message

// Add this code to verify face attributes were saved
try {
  console.log('Verifying face attributes are saved in the user profile...');
  
  // Use the admin function to verify face data
  const { data: verifyResult, error: verifyError } = await supabase.rpc(
    'admin_check_user_face_attributes',
    { p_user_id: userId }
  );
  
  if (verifyError) {
    console.error('Error verifying face attributes:', verifyError);
  } else {
    console.log('Face attribute verification result:', verifyResult);
    
    // If verification shows missing data, try to save it directly
    if (!verifyResult.user_data?.has_user_record || !verifyResult.face_data?.has_face_data) {
      console.log('Face attributes not properly saved, attempting direct save...');
      
      // Try direct admin function
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'admin_update_user_face_attributes',
        {
          p_user_id: userId,
          p_face_id: faceId,
          p_attributes: attributes
        }
      );
      
      if (updateError) {
        console.error('Error saving face attributes via admin function:', updateError);
      } else {
        console.log('Face attributes saved successfully via admin function:', updateResult);
      }
    } else {
      console.log('Face attributes already saved correctly');
    }
  }
} catch (attributeError) {
  console.error('Exception during face attribute verification:', attributeError);
}

// Continue with existing code for completion message
// ... existing code ... 

const FaceRegistration = ({ onSuccess, onClose }) => {
  // Component logging
  useEffect(() => {
    console.log('[FaceRegistration.jsx] Mounted');
  }, []);

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceId, setFaceId] = useState(null);
  const [registeredImageUrl, setRegisteredImageUrl] = useState(null);
  const [faceAttributes, setFaceAttributes] = useState(null);
  const [historicalMatches, setHistoricalMatches] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const { user, updateUserFaceData } = useAuth();
  const webcamRef = useRef(null);

  // State for camera selection
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect if using a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      console.log('[FaceReg] Device detected as:', isMobileDevice ? 'Mobile' : 'Desktop');
    };
    
    checkMobile();
  }, []);

  // Fetch video devices on mount
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        console.log('[FaceReg] Requesting camera permissions...');
        // First request permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Important: Store the stream temporarily so it doesn't get garbage collected
        window.tempStream = stream;
        
        console.log('[FaceReg] Camera permission granted, enumerating devices...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        console.log('[FaceReg] Available cameras:', cameras.map(c => ({
          deviceId: c.deviceId.substring(0, 8) + '...',
          label: c.label || 'Unnamed camera'
        })));
        
        setVideoDevices(cameras);
        
        if (cameras.length > 0) {
          // On mobile, try to use the front-facing camera
          if (isMobile) {
            const frontCamera = cameras.find(camera => 
              camera.label.toLowerCase().includes('front') || 
              camera.label.toLowerCase().includes('user') ||
              camera.label.toLowerCase().includes('selfie'));
            
            if (frontCamera) {
              console.log('[FaceReg] Found front camera:', frontCamera.label);
              setSelectedDeviceId(frontCamera.deviceId);
            } else {
              setSelectedDeviceId(cameras[0].deviceId);
            }
          } else {
            // On desktop, use the first camera by default
            setSelectedDeviceId(cameras[0].deviceId);
          }
          
          console.log('[FaceReg] Selected camera device:', 
            cameras.find(c => c.deviceId === (cameras[0].deviceId))?.label || 'Default camera');
        } else {
          console.error('[FaceReg] No camera devices found');
          setError('No camera devices found. Please check your camera connections and permissions.');
          setStatus('error');
        }
        
        // Clean up the temporary stream
        if (window.tempStream) {
          window.tempStream.getTracks().forEach(track => track.stop());
          window.tempStream = null;
        }
      } catch (err) {
        console.error("[FaceReg] Error accessing media devices:", err);
        setError('Could not access media devices. Please check permissions and try again.');
        setStatus('error');
      }
    };

    getVideoDevices();
    
    // Cleanup function
    return () => {
      // Make sure to clean up any temporary streams
      if (window.tempStream) {
        window.tempStream.getTracks().forEach(track => track.stop());
        window.tempStream = null;
      }
    };
  }, [isMobile]);

  // Add a manual camera detection function for diagnostics
  const manualCameraDetection = async () => {
    try {
      console.log('[FaceReg] Manual camera detection started...');
      setError('Detecting cameras, please wait...');
      
      // Stop any existing stream
      if (window.tempStream) {
        window.tempStream.getTracks().forEach(track => track.stop());
        window.tempStream = null;
      }
      
      // Try to get access with explicit permission request
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      window.tempStream = stream;
      
      // Force a re-enumeration of devices
      const refreshedDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = refreshedDevices.filter(device => device.kind === 'videoinput');
      
      console.log('[FaceReg] Manual detection found cameras:', cameras);
      setVideoDevices(cameras);
      
      if (cameras.length > 0) {
        setSelectedDeviceId(cameras[0].deviceId);
        setError(null);
        setStatus('idle');
      } else {
        setError('No cameras found even after manual detection.');
      }
    } catch (err) {
      console.error('[FaceReg] Manual camera detection error:', err);
      setError(`Camera detection failed: ${err.message}`);
    }
  };

  // Updated video constraints based on selected device
  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: isMobile ? "user" : undefined,
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
  };

  // Handler for camera selection change
  const handleCameraChange = (event) => {
    setSelectedDeviceId(event.target.value);
    // Reset capture status if camera changes
    retakeImage(); 
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Could not capture image.');
      return;
    }
    // Convert base64 to Blob
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        // Create a File object with a proper name for easier debugging
        const file = new File([blob], `face-registration-${Date.now()}.jpeg`, {
          type: 'image/jpeg'
        });
        setImageBlob(file);
        setStatus('captured'); // Or appropriate status
      });
  }, [webcamRef]);

  const retakeImage = () => {
    setImageBlob(null);
    setRegisteredImageUrl(null); // Also clear registered image if retaking
    setFaceAttributes(null); // Clear face attributes
    setHistoricalMatches([]);
    setMatchCount(0);
    setStatus('idle'); // Reset status
  };

  const processImage = useCallback(() => {
    if (imageBlob) {
      processRegistration(imageBlob);
    }
  }, [imageBlob, user?.id]);

  const processRegistration = async (blobToProcess) => {
    if (!user || !user.id) {
      setError('User not authenticated.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    setRegisteredImageUrl(null);
    setFaceAttributes(null);
    setHistoricalMatches([]);
    setMatchCount(0);
    console.log('[FaceReg] Starting AWS face registration process...');
    console.log('[FaceReg] User ID:', user.id);
    console.log('[FaceReg] Image blob size:', blobToProcess.size, 'bytes');

    try {
      console.log('[FaceReg] Indexing face with AWS Rekognition & saving to DB...');
      // Ensure we're passing a valid image blob
      if (!(blobToProcess instanceof Blob)) {
        console.warn('[FaceReg] Image is not a Blob, attempting to convert...');
        // Try to convert to Blob if needed
        if (typeof blobToProcess === 'string' && blobToProcess.startsWith('data:')) {
          // Convert base64 to Blob
          const response = await fetch(blobToProcess);
          blobToProcess = await response.blob();
        } else {
          throw new Error('Invalid image format for registration');
        }
      }
      
      console.log(`[FaceReg] Image blob ready for processing: ${blobToProcess.size} bytes, type: ${blobToProcess.type}`);
      
      // This is the key function that handles face registration and historical matching
      const result = await indexFace(user.id, blobToProcess);

      if (!result.success || !result.faceId) {
        console.error('[FaceReg] Face registration failed:', result.error);
        setStatus('error');
        setError(result.error || 'Failed to register face with Rekognition');
        return;
      }

      console.log(`[FaceReg] Face indexed successfully with Face ID: ${result.faceId}`);
      console.log('[FaceReg] Face attributes received:', JSON.stringify(result.faceAttributes, null, 2));
      setFaceId(result.faceId);
      setFaceAttributes(result.faceAttributes);

      // Handle historical matches if they exist
      if (result.historicalMatches && result.historicalMatches.length > 0) {
        console.log('[FaceReg] Historical matches found:', result.historicalMatches.length);
        console.log('[FaceReg] Historical match details:', JSON.stringify(result.historicalMatches, null, 2));
        setHistoricalMatches(result.historicalMatches);
        setMatchCount(result.historicalMatches.length);
      } else {
        console.log('[FaceReg] No historical matches found');
      }

      // Create a URL for the blob to display on success
      if (blobToProcess instanceof Blob) {
        console.log('[FaceReg] Creating URL for blob to display');
        const imageUrl = URL.createObjectURL(blobToProcess);
        setRegisteredImageUrl(imageUrl);
        console.log('[FaceReg] Image URL created:', imageUrl);
      } else {
        console.warn('[FaceReg] Could not create URL for image - not a Blob');
      }

      setStatus('success');
      console.log('[FaceReg] Registration status updated to success');

      if (updateUserFaceData) {
        try {
          console.log('[FaceReg] Updating user face data in AuthContext with:', {
            faceId: result.faceId,
            attributesLength: result.faceAttributes ? Object.keys(result.faceAttributes).length : 0,
            historicalMatches: result.historicalMatches?.length || 0
          });
          
          // Call the updateUserFaceData function with all available data
          await updateUserFaceData(
            result.faceId, 
            result.faceAttributes, 
            result.historicalMatches || []
          );
          
          console.log('[FaceReg] User face data updated successfully in AuthContext');
        } catch (updateError) {
          console.error('[FaceReg] Error updating user face data:', updateError);
          // Continue with success flow even if there was an error updating user data
        }
      } else {
        console.warn('[FaceReg] updateUserFaceData function not found in AuthContext');
      }
      
      // Notify parent about successful registration
      if (onSuccess) {
        console.log('[FaceReg] Calling onSuccess prop in parent (Dashboard)...');
        console.log('[FaceReg] Sending face data to Dashboard:', {
          faceId: result.faceId,
          attributesSize: result.faceAttributes ? Object.keys(result.faceAttributes).length : 0,
          matches: result.historicalMatches ? result.historicalMatches.length : 0
        });
        
        onSuccess(
          result.faceId, 
          result.faceAttributes,
          result.historicalMatches || []
        );
      }

      // Check if there are historical matches
      if (result.matches && result.matches.length > 0) {
        setHistoricalMatches(result.matches);
        
        // Add visibility records for all matched photos
        try {
          const matchedPhotoIds = result.matches.map(match => match.photoId || match.id);
          if (matchedPhotoIds.length > 0) {
            await updatePhotoVisibility(user.id, matchedPhotoIds, 'VISIBLE');
            console.log(`Set visibility for ${matchedPhotoIds.length} matched photos to VISIBLE`);
          }
        } catch (visibilityError) {
          console.error("Error setting visibility for matched photos:", visibilityError);
        }
      }
      
      // Update user profile to indicate face is registered
      const { error: updateError } = await supabase
        .from('users')
        .update({ face_registered: true })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }

    } catch (err) {
      console.error('[FaceReg] Error during face registration:', err);
      setStatus('error');
      setError(err.message || 'An unexpected error occurred');
    }
  };

  const detectFaces = useCallback(async () => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            try {
                const faces = await detectFacesInImage(imageSrc);
                setIsFaceDetected(faces.length > 0);
            } catch (error) {
                console.error("Error detecting faces:", error);
                setIsFaceDetected(false); // Assume no face if detection fails
            }
        }
    }
  }, [webcamRef]);

  useEffect(() => {
      const intervalId = setInterval(() => {
          if (status === 'idle') { 
              detectFaces();
          }
      }, 1000);

      return () => clearInterval(intervalId);
  }, [detectFaces, status]);

  useEffect(() => {
    return () => {
      if (registeredImageUrl) {
        URL.revokeObjectURL(registeredImageUrl);
      }
    };
  }, [registeredImageUrl]);

  const handleContinue = () => {
    if (onSuccess) {
      onSuccess(faceId, faceAttributes, historicalMatches);
    } else if (onClose) {
      onClose();
    }
  };

  // Helper function to render face attributes in a readable format
  const renderFaceAttributes = () => {
    if (!faceAttributes) return null;
    
    const attributes = [];
    
    // Age range
    if (faceAttributes.AgeRange) {
      attributes.push({
        label: 'Age Range',
        value: `${faceAttributes.AgeRange.Low}-${faceAttributes.AgeRange.High} years`
      });
    }
    
    // Gender
    if (faceAttributes.Gender) {
      attributes.push({
        label: 'Gender',
        value: `${faceAttributes.Gender.Value} (${Math.round(faceAttributes.Gender.Confidence)}%)`
      });
    }
    
    // Smile
    if (faceAttributes.Smile) {
      attributes.push({
        label: 'Smiling',
        value: faceAttributes.Smile.Value ? 'Yes' : 'No'
      });
    }
    
    // Eyeglasses
    if (faceAttributes.Eyeglasses) {
      attributes.push({
        label: 'Eyeglasses',
        value: faceAttributes.Eyeglasses.Value ? 'Yes' : 'No'
      });
    }
    
    // Sunglasses
    if (faceAttributes.Sunglasses) {
      attributes.push({
        label: 'Sunglasses',
        value: faceAttributes.Sunglasses.Value ? 'Yes' : 'No'
      });
    }
    
    // Beard
    if (faceAttributes.Beard) {
      attributes.push({
        label: 'Beard',
        value: faceAttributes.Beard.Value ? 'Yes' : 'No'
      });
    }
    
    // Mustache
    if (faceAttributes.Mustache) {
      attributes.push({
        label: 'Mustache',
        value: faceAttributes.Mustache.Value ? 'Yes' : 'No'
      });
    }
    
    // Eyes open
    if (faceAttributes.EyesOpen) {
      attributes.push({
        label: 'Eyes Open',
        value: faceAttributes.EyesOpen.Value ? 'Yes' : 'No'
      });
    }
    
    // Mouth open
    if (faceAttributes.MouthOpen) {
      attributes.push({
        label: 'Mouth Open',
        value: faceAttributes.MouthOpen.Value ? 'Yes' : 'No'
      });
    }
    
    // Emotions (top emotion)
    if (faceAttributes.Emotions && faceAttributes.Emotions.length > 0) {
      // Sort emotions by confidence
      const sortedEmotions = [...faceAttributes.Emotions].sort((a, b) => b.Confidence - a.Confidence);
      const topEmotion = sortedEmotions[0];
      
      attributes.push({
        label: 'Emotion',
        value: `${topEmotion.Type} (${Math.round(topEmotion.Confidence)}%)`
      });
    }
    
    return (
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        {attributes.map((attr, index) => (
          <div key={index} className="border border-apple-gray-200 rounded-apple p-2 bg-apple-gray-50">
            <p className="text-apple-gray-500">{attr.label}</p>
            <p className="font-medium text-apple-gray-800">{attr.value}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="face-registration">
      <div className="mx-auto max-w-3xl bg-white rounded-apple-xl shadow-sm border border-apple-gray-200 overflow-hidden">
        <div className="p-6 bg-apple-gray-50 border-b border-apple-gray-200">
          <h2 className="text-xl font-semibold text-apple-gray-900 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-apple-blue-500" />
            Face Registration
          </h2>
          <p className="mt-2 text-apple-gray-600">
            Please align your face in the center of the frame using the circular guide and maintain good lighting.
          </p>
        </div>
        
        <div className="p-6">
          {/* WEBCAM SELECTOR - ALWAYS DISPLAYED AT THE TOP */}
          <div className="mb-6 p-4 bg-blue-100 rounded-lg border-2 border-blue-400 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-blue-800 flex items-center">
                <Video className="w-5 h-5 mr-2 text-blue-700" />
                Select Camera Device
              </h3>
              {videoDevices.length > 0 && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  {videoDevices.length} camera(s) found
                </span>
              )}
            </div>
            
            {videoDevices.length > 0 ? (
              <div className="mb-2">
                <select 
                  id="cameraSelect"
                  value={selectedDeviceId}
                  onChange={handleCameraChange}
                  className="block w-full p-3 border border-blue-400 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  aria-label="Select camera device"
                >
                  {videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                <p className="text-sm text-red-600 font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  No camera devices detected
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Please check your camera connections and browser permissions
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2 mb-2">
              <button 
                onClick={manualCameraDetection}
                className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center"
              >
                <Camera className="w-3 h-3 mr-1" />
                Detect Cameras Manually
              </button>
              
              {selectedDeviceId && (
                <div className="text-xs text-blue-600">
                  Active camera ID: {selectedDeviceId.substring(0, 6)}...
                </div>
              )}
            </div>
            
            <div className="text-xs bg-white p-2 rounded border border-blue-200 text-blue-800">
              <p><strong>Camera Troubleshooting:</strong></p>
              <ol className="list-decimal pl-4 mt-1 space-y-1">
                <li>Make sure your webcam is connected and not being used by another application</li>
                <li>Allow camera permissions when prompted by your browser</li>
                <li>Try refreshing the page or restarting your browser</li>
              </ol>
            </div>
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="relative aspect-video bg-black rounded-apple-lg overflow-hidden border border-apple-gray-300 shadow-inner">
                {status === 'success' && registeredImageUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={registeredImageUrl} alt="Registered Face" className="object-contain max-h-full" />
                  </div>
                ) : (
                  <>
                    {/* Face positioning guides */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {/* Center circle for face alignment */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-dashed border-white opacity-40"></div>
                      
                      {/* Rule of thirds grid */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-white opacity-20 h-full col-start-1"></div>
                        <div className="border-r border-white opacity-20 h-full col-start-2"></div>
                        <div className="border-b border-white opacity-20 w-full row-start-1"></div>
                        <div className="border-b border-white opacity-20 w-full row-start-2"></div>
                      </div>
                    </div>
                    
                    {isFaceDetected && status !== 'processing' && status !== 'success' && (
                      <div className="absolute inset-0 border-4 border-green-500 rounded-apple z-10 animate-pulse opacity-70"></div>
                    )}
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      mirrored={true}
                      videoConstraints={videoConstraints}
                    />
                  </>
                )}

                {status === 'success' && (
                  <div className="absolute bottom-4 left-4 p-2 rounded-apple bg-white bg-opacity-90 shadow">
                     <div className="flex items-center">
                       <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                       <p className="text-green-800 font-medium text-sm">Registration Complete!</p>
                     </div>
                   </div>
                )}
                {status === 'processing' && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                     <div className="text-center p-4">
                       <Loader className="w-12 h-12 text-white mx-auto mb-2 animate-spin" />
                       <p className="text-white">Processing...</p>
                     </div>
                   </div>
                )}
              </div>

             {status !== 'success' && (
               <div className="mt-4 flex items-center justify-between">
                 <div className="flex items-center">
                   <div className={`w-3 h-3 rounded-full mr-2 ${isFaceDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <span className="text-sm text-apple-gray-700">
                     {isFaceDetected ? 'Face Detected' : 'No Face Detected'}
                   </span>
                 </div>
                {!imageBlob && status !== 'success' && (
                  <button
                    onClick={captureImage}
                    disabled={!isFaceDetected || status === 'processing'}
                    className="px-4 py-2 bg-apple-blue-500 text-white rounded-apple font-medium hover:bg-apple-blue-600 transition-colors disabled:bg-apple-gray-300 disabled:cursor-not-allowed"
                  >
                    Capture Image
                  </button>
                )}

                {imageBlob && status !== 'success' && status !== 'processing' && (
                  <div className="flex gap-2">
                    <button
                      onClick={retakeImage}
                      className="px-4 py-2 bg-apple-gray-200 text-apple-gray-700 rounded-apple font-medium hover:bg-apple-gray-300 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      onClick={processImage}
                      className="px-4 py-2 bg-apple-blue-500 text-white rounded-apple font-medium hover:bg-apple-blue-600 transition-colors"
                    >
                      Use This Image
                    </button>
                  </div>
                )}
               </div>
             )}
            </div>
            
            <div className="md:w-64">
              {status === 'success' && faceAttributes ? (
                <div className="bg-white p-4 rounded-apple border border-apple-gray-200">
                  <h3 className="font-medium text-apple-gray-900 mb-2 flex items-center">
                    <User className="w-4 h-4 text-apple-blue-500 mr-2" />
                    Facial Attributes
                  </h3>
                  {renderFaceAttributes()}
                </div>
              ) : (
                <div className="bg-apple-gray-50 p-4 rounded-apple border border-apple-gray-200">
                  <h3 className="font-medium text-apple-gray-900 mb-2">Registration Tips</h3>
                  <ul className="text-sm text-apple-gray-700 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Center your face within the circle guide</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Use good lighting - avoid shadows</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Remove sunglasses for best results</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Look directly at the camera</span>
                    </li>
                  </ul>
                </div>
              )}
              
              {status === 'success' && (
                <>
                  <div className="mt-4 bg-green-50 p-4 rounded-apple border border-green-200">
                    <h3 className="font-medium text-green-900 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Registration Complete
                    </h3>
                    <p className="text-sm text-green-800">
                      Your face has been successfully registered. New Face ID: {faceId || 'N/A'}
                    </p>
                    
                    {matchCount > 0 && (
                      <div className="mt-2 text-sm text-green-800">
                        <p className="font-medium">Found you in {matchCount} existing photo{matchCount !== 1 ? 's' : ''}!</p>
                        <p className="text-xs mt-1">View them in your dashboard.</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleContinue}
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-apple font-medium hover:bg-green-700 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;