// src/components/FaceRegistration.tsx

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, RotateCcw, Check, Video, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { rekognitionClient } from '../config/aws-config';
import { DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { FaceIndexingService } from '../services/FaceIndexingService';

interface FaceRegistrationProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const FaceRegistration: React.FC<FaceRegistrationProps> = ({ onSuccess, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [faceDetected, setFaceDetected] = useState(false);
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
      } catch (err) {
        console.error('Error getting video devices:', err);
        setError('Unable to access camera devices');
      }
    };

    getVideoDevices();
  }, []);

  useEffect(() => {
    if (!capturedImage && webcamRef.current && webcamRef.current.video) {
      const checkForFace = async () => {
        setIsCheckingFace(true);
        try {
          const video = webcamRef.current?.video;
          if (!video) return;

          // Create canvas with proper dimensions
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw current video frame
          ctx.drawImage(video, 0, 0);
          
          // Convert to blob with proper type
          const blob = await new Promise<Blob | null>((resolve) => {
            try {
              canvas.toBlob(resolve, 'image/jpeg', 0.9);
            } catch (err) {
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
          
          // Detect faces
          console.log('Detecting faces in webcam frame...');
          const command = new DetectFacesCommand({
            Image: { Bytes: imageBytes },
            Attributes: ['ALL']
          });

          const response = await rekognitionClient.send(command);
          const hasFaces = !!(response.FaceDetails && response.FaceDetails.length > 0);
          console.log('Face detection result:', hasFaces ? 'Face detected' : 'No face detected');
          setFaceDetected(hasFaces);
        } catch (err) {
          console.error('Error checking for face:', err);
          setFaceDetected(false);
        } finally {
          setIsCheckingFace(false);
        }
      };

      const interval = setInterval(checkForFace, 1000);
      return () => clearInterval(interval);
    }
  }, [capturedImage]);

  const capture = useCallback(() => {
    if (!faceDetected) {
      console.log('No face detected, cannot capture');
      setError('Please position your face in the frame');
      return;
    }

    console.log('Capturing image...');
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      console.log('Image captured successfully');
      setCapturedImage(screenshot);
      setError(null);
    } else {
      console.error('Failed to capture image');
      setError('Failed to capture image');
    }
  }, [faceDetected]);

  const retake = () => {
    console.log('Retaking photo...');
    setCapturedImage(null);
    setError(null);
    setFaceDetected(false);
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Changing camera device to:', event.target.value);
    setSelectedDeviceId(event.target.value);
    setCapturedImage(null);
    setError(null);
    setFaceDetected(false);
  };

  const handleRegistration = async () => {
    if (!capturedImage || !user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Starting face registration process...');

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);

      // Detect face attributes with AWS Rekognition
      console.log('Detecting face attributes...');
      const detectCommand = new DetectFacesCommand({
        Image: { Bytes: imageBytes },
        Attributes: ['ALL']
      });

      const detectResponse = await rekognitionClient.send(detectCommand);
      
      if (!detectResponse.FaceDetails?.length) {
        throw new Error('No face detected in the image');
      }

      const faceAttributes = detectResponse.FaceDetails[0];
      console.log('Face attributes detected successfully');

      // Upload to Supabase storage
      console.log('Uploading image to storage...');
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('face-data')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;
      console.log('Image uploaded successfully');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('face-data')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to retrieve public URL');
      }

      // Save face data reference with attributes
      console.log('Saving face data...');
      const { error: dbError } = await supabase
        .from('face_data')
        .upsert({
          user_id: user.id,
          face_data: {
            image_path: filePath,
            public_url: publicUrl,
            attributes: {
              age: {
                low: faceAttributes.AgeRange?.Low || 0,
                high: faceAttributes.AgeRange?.High || 0
              },
              smile: {
                value: faceAttributes.Smile?.Value || false,
                confidence: faceAttributes.Smile?.Confidence || 0
              },
              eyeglasses: {
                value: faceAttributes.Eyeglasses?.Value || false,
                confidence: faceAttributes.Eyeglasses?.Confidence || 0
              },
              sunglasses: {
                value: faceAttributes.Sunglasses?.Value || false,
                confidence: faceAttributes.Sunglasses?.Confidence || 0
              },
              gender: {
                value: faceAttributes.Gender?.Value || '',
                confidence: faceAttributes.Gender?.Confidence || 0
              },
              eyesOpen: {
                value: faceAttributes.EyesOpen?.Value || false,
                confidence: faceAttributes.EyesOpen?.Confidence || 0
              },
              mouthOpen: {
                value: faceAttributes.MouthOpen?.Value || false,
                confidence: faceAttributes.MouthOpen?.Confidence || 0
              },
              quality: {
                brightness: faceAttributes.Quality?.Brightness || 0,
                sharpness: faceAttributes.Quality?.Sharpness || 0
              },
              emotions: faceAttributes.Emotions?.map(emotion => ({
                type: emotion.Type,
                confidence: emotion.Confidence
              })) || [],
              landmarks: faceAttributes.Landmarks,
              pose: faceAttributes.Pose,
              beard: {
                value: faceAttributes.Beard?.Value || false,
                confidence: faceAttributes.Beard?.Confidence || 0
              },
              mustache: {
                value: faceAttributes.Mustache?.Value || false,
                confidence: faceAttributes.Mustache?.Confidence || 0
              },
              overallConfidence: faceAttributes.Confidence
            }
          }
        });

      if (dbError) throw dbError;
      console.log('Face data saved successfully');

      // Index the face with AWS Rekognition
      console.log('Indexing face...');
      const indexResult = await FaceIndexingService.indexFace(imageBytes, user.id);
      
      if (!indexResult.success) {
        throw new Error(indexResult.error || 'Failed to index face');
      }

      console.log('Face indexed successfully');
      console.log('Face registration complete!');

      onSuccess();
    } catch (err) {
      console.error('Face registration error:', err);
      setError((err as Error).message || 'Failed to register face');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-apple-2xl shadow-apple-lg overflow-hidden max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-apple-gray-900">
              Face Registration
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-apple-gray-100 text-apple-gray-500"
            >
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
                className="ios-input"
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
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
                <div className={cn(
                  "absolute inset-0 border-4 transition-colors duration-300",
                  faceDetected ? "border-apple-green-500" : "border-white/20"
                )} />
                {!isCheckingFace && !faceDetected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="text-white text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p>No face detected</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            {capturedImage ? (
              <>
                <button
                  onClick={retake}
                  className="ios-button-secondary flex items-center"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Retake
                </button>
                <button
                  onClick={handleRegistration}
                  disabled={loading}
                  className={cn(
                    "ios-button-primary flex-1",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Confirm & Register
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={capture}
                disabled={!faceDetected}
                className={cn(
                  "ios-button-primary flex-1",
                  !faceDetected && "opacity-50 cursor-not-allowed"
                )}
              >
                <Camera className="w-5 h-5 mr-2" />
                {faceDetected ? "Capture Photo" : "Position Your Face"}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
