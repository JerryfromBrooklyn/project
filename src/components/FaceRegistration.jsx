import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { indexFace } from '../services/FaceIndexingService';
import { detectFacesInImage } from '../services/FaceDetectionService';

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

const FaceRegistration = ({ onClose }) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceId, setFaceId] = useState(null);
  const [registeredImageUrl, setRegisteredImageUrl] = useState(null);
  const { user, updateUserFaceData } = useAuth();
  const webcamRef = useRef(null);
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
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
        setImageBlob(blob);
        setStatus('captured'); // Or appropriate status
      });
  }, [webcamRef]);

  const retakeImage = () => {
    setImageBlob(null);
    setRegisteredImageUrl(null); // Also clear registered image if retaking
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
    console.log('[FaceReg] Starting AWS face registration process...');

    try {
      console.log('[FaceReg] Indexing face with AWS Rekognition & saving to DB...');
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

      const imageUrl = URL.createObjectURL(blobToProcess);
      setRegisteredImageUrl(imageUrl);
      setStatus('success');

      console.log('[FaceReg] AWS Face registration complete!');

      if (updateUserFaceData) {
        setTimeout(() => {
          updateUserFaceData(result.faceId, result.faceAttributes);
        }, 100);
      } else {
        console.warn('[FaceReg] updateUserFaceData function not found in AuthContext');
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

  return (
    <div className="face-registration">
      <div className="mx-auto max-w-3xl bg-white rounded-apple-xl shadow-sm border border-apple-gray-200 overflow-hidden">
        <div className="p-6 bg-apple-gray-50 border-b border-apple-gray-200">
          <h2 className="text-xl font-semibold text-apple-gray-900 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-apple-blue-500" />
            Face Registration
          </h2>
          <p className="mt-2 text-apple-gray-600">
            Position your face in the center of the frame and ensure good lighting for the best results.
          </p>
        </div>
        
        <div className="p-6">
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
                  <img src={registeredImageUrl} alt="Registered Face" className="w-full h-full object-cover" />
                ) : (
                  <>
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
              <div className="bg-apple-gray-50 p-4 rounded-apple border border-apple-gray-200">
                <h3 className="font-medium text-apple-gray-900 mb-2">Registration Tips</h3>
                <ul className="text-sm text-apple-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Ensure your face is fully visible</span>
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
              
              {status === 'success' && (
                <div className="mt-4 bg-green-50 p-4 rounded-apple border border-green-200 md:w-64">
                  <h3 className="font-medium text-green-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Registration Complete
                  </h3>
                  <p className="text-sm text-green-800">
                    Your face has been successfully registered. New Face ID: {faceId || 'N/A'}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-apple font-medium hover:bg-green-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;