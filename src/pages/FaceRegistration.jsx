import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import { Camera, Upload, User, UserPlus, CheckCircle, AlertTriangle, UserCheck, Info, X } from 'lucide-react';
import { FaceIndexingService } from '../services/FaceIndexingService';

const FaceRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('webcam');
  const [capturing, setCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [personName, setPersonName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [registeredFaces, setRegisteredFaces] = useState([
    { id: 1, name: 'John Doe', imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg', dateAdded: '2023-10-15' },
    { id: 2, name: 'Jane Smith', imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg', dateAdded: '2023-10-10' }
  ]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Add a new hook for collecting device data
  const useDeviceData = () => {
    const [deviceData, setDeviceData] = useState(null);
    
    useEffect(() => {
      const collectDeviceData = async () => {
        try {
          console.log('Collecting device data...');
          // Start collecting data as soon as component mounts
          const data = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio,
            colorDepth: window.screen.colorDepth,
            orientation: window.screen.orientation?.type || 'unknown',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
          };
          
          // Add browser info
          const browserInfo = /(\w+)\/(\d+\.\d+)/.exec(navigator.userAgent);
          if (browserInfo) {
            data.browserName = browserInfo[1];
            data.browserVersion = browserInfo[2];
          }
          
          console.log('Device data collected successfully');
          setDeviceData(data);
        } catch (error) {
          console.error('Error collecting device data:', error);
          setDeviceData({
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      collectDeviceData();
    }, []);
    
    return deviceData;
  };

  // Add a new hook for collecting location data
  const useLocationData = () => {
    const [locationData, setLocationData] = useState(null);
    
    useEffect(() => {
      let isMounted = true;
      
      const getLocation = async () => {
        try {
          console.log('Requesting geolocation...');
          
          if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
          }
          
          // Request location immediately when component mounts
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              if (!isMounted) return;
              
              const data = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp).toISOString()
              };
              
              // Get the address using reverse geocoding (this could use a third-party API)
              try {
                // Simplified mock geocoding - in a real app, you'd use a geocoding API
                setTimeout(() => {
                  if (!isMounted) return;
                  data.address = `Location near ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
                  setLocationData(data);
                  console.log('Location data with address collected successfully', data);
                }, 500);
              } catch (geocodeError) {
                console.warn('Error getting address:', geocodeError);
                if (isMounted) {
                  setLocationData(data);
                  console.log('Location data collected (without address)');
                }
              }
            },
            (error) => {
              if (!isMounted) return;
              console.warn('Geolocation error:', error);
              setLocationData({
                error: error.message || 'Location access denied',
                timestamp: new Date().toISOString()
              });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } catch (error) {
          if (!isMounted) return;
          console.error('Error accessing geolocation:', error);
          setLocationData({
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      getLocation();
      
      return () => {
        isMounted = false;
      };
    }, []);
    
    return locationData;
  };

  // Handle webcam capture
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCapturing(true);
        
        // Set up MediaRecorder for video recording
        try {
          // Only create recorder if it doesn't exist yet or if it's inactive
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            console.log('Creating MediaRecorder for video recording...');
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const recordedChunks = [];
            
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                recordedChunks.push(e.data);
              }
            };
            
            recorder.onstop = () => {
              // Calculate duration
              const duration = recordingStartTimeRef.current 
                ? (Date.now() - recordingStartTimeRef.current) / 1000
                : null;
              
              // Create blob from chunks
              const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
              console.log(`Video recording completed: ${(videoBlob.size / (1024 * 1024)).toFixed(2)}MB, duration: ${duration}s`);
              
              // Store the video blob and duration
              setRecordedVideoBlob(videoBlob);
              setRecordedVideoDuration(duration);
            };
            
            mediaRecorderRef.current = recorder;
          }
        } catch (recorderError) {
          console.warn('Could not initialize video recording:', recorderError);
        }
        
        // Simulate face detection after 2 seconds
        setTimeout(() => {
          setFaceDetected(true);
          
          // Start recording automatically when face is detected
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
            console.log('Starting video recording...');
            recordingStartTimeRef.current = Date.now();
            mediaRecorderRef.current.start();
            setIsRecording(true);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('Unable to access the webcam. Please make sure you have granted permission.');
    }
  };
  
  const stopWebcam = () => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping video recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCapturing(false);
      setFaceDetected(false);
    }
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && faceDetected) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL (image)
      const imageDataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(imageDataUrl);
      
      // Stop the webcam stream
      stopWebcam();
    }
  };
  
  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Simulate face detection
      setTimeout(() => {
        setFaceDetected(true);
      }, 1000);
    }
  };
  
  // Modify the handleRegisterFace function to use parallel processing
  const handleRegisterFace = async () => {
    if (!personName.trim()) {
      alert('Please enter a name for this person');
      return;
    }
    
    if (!previewUrl) {
      alert('Please capture or upload a photo first');
      return;
    }
    
    setRegistrationStatus('processing');
    console.log('Starting face registration process...');
    
    try {
      // Prepare video data if any was recorded
      let videoData = null;
      if (recordedVideoBlob) {
        console.log('Video data available for upload');
        videoData = {
          videoBlob: recordedVideoBlob,
          duration: recordedVideoDuration,
          frameRate: 30, // Estimated frame rate
          resolution: '640x480' // Camera resolution
        };
      }
      
      // Extract the captured image as a blob
      const imageBlob = await fetch(previewUrl).then(r => r.blob());
      
      // All of these operations will be handled in parallel by the service
      console.log('Calling indexFace with parallel processing...');
      const result = await FaceIndexingService.indexFace(
        personName, // Using name as the user ID for demo
        imageBlob,
        locationData, // This was collected in the background by useLocationData hook
        videoData,
        deviceData // This was collected in the background by useDeviceData hook
      );
      
      if (result.success) {
        setRegistrationStatus('success');
        console.log('Face registration successful!', result);
        
        // If there are pending operations, log them but don't wait for completion
        if (result.pendingOperations) {
          console.log('Background operations are still running...');
          
          // Optionally track completion if needed
          if (result.pendingOperations.videoUpload) {
            result.pendingOperations.videoUpload
              .then(data => console.log('Video upload completed in background:', data))
              .catch(err => console.warn('Video upload error in background:', err));
          }
          
          if (result.pendingOperations.matchUpdates) {
            result.pendingOperations.matchUpdates
              .then(data => console.log('Match updates completed in background:', data))
              .catch(err => console.warn('Match updates error in background:', err));
          }
        }
        
        // Add to registered faces
        const newFace = {
          id: result.faceId || Date.now(),
          name: personName,
          imageUrl: result.imageUrl || previewUrl,
          dateAdded: new Date().toISOString().split('T')[0]
        };
        
        setRegisteredFaces(prev => [newFace, ...prev]);
        
        // Reset form after successful registration
        setTimeout(() => {
          setRegistrationStatus(null);
          setPersonName('');
          setPreviewUrl(null);
          setSelectedFile(null);
          setFaceDetected(false);
          setRecordedVideoBlob(null);
          setRecordedVideoDuration(null);
        }, 3000);
      } else {
        console.error('Face registration failed:', result.error);
        setRegistrationStatus('error');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setRegistrationStatus('error');
    }
  };
  
  const resetForm = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFaceDetected(false);
    setRegistrationStatus(null);
    if (activeTab === 'webcam') {
      startWebcam();
    }
  };
  
  // Cleanup webcam on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Start webcam when tab changes to webcam
  React.useEffect(() => {
    if (activeTab === 'webcam' && !capturing) {
      startWebcam();
    } else if (activeTab !== 'webcam' && capturing) {
      stopWebcam();
    }
  }, [activeTab, capturing]);

  // Use the hooks in the component
  const deviceData = useDeviceData();
  const locationData = useLocationData();

  // Add state for video recording
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [recordedVideoDuration, setRecordedVideoDuration] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex-grow px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserPlus className="h-6 w-6 text-blue-600 mr-2" />
              Face Registration
            </h1>
            <p className="mt-1 text-gray-600">
              Register faces to automatically identify people in your photos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Registration Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Registration Status */}
              {registrationStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-green-800">Registration Complete</h3>
                      <div className="mt-2 text-green-700">
                        <p>
                          Successfully registered {personName} to your face collection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {registrationStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-800">Registration Failed</h3>
                      <div className="mt-2 text-red-700">
                        <p>
                          We couldn't register this face. Please ensure the face is clearly visible and try again.
                        </p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                  <button
                    className={`py-3 px-4 text-sm font-medium flex items-center ${
                      activeTab === 'webcam' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('webcam')}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Use Webcam
                  </button>
                  <button
                    className={`py-3 px-4 text-sm font-medium flex items-center ${
                      activeTab === 'upload' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </button>
                </div>
                
                <div className="p-6">
                  {activeTab === 'webcam' && (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <div className="flex">
                          <Info className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <p className="font-medium text-blue-800">Webcam Instructions</p>
                            <p className="text-blue-700 text-sm mt-1">
                              Position your face clearly in the frame. Make sure there is good lighting and your face is fully visible.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        {!previewUrl ? (
                          <>
                            <div className="relative w-full max-w-md h-80 bg-gray-900 rounded-lg overflow-hidden mb-4">
                              <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover" 
                              />
                              
                              {faceDetected && (
                                <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Face Detected
                                </div>
                              )}

                              <canvas ref={canvasRef} className="hidden" />
                            </div>
                            
                            <button
                              onClick={capturePhoto}
                              disabled={!faceDetected}
                              className={`px-4 py-2 rounded-md flex items-center ${
                                faceDetected 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Capture Photo
                            </button>
                          </>
                        ) : (
                          <div className="w-full max-w-md">
                            <div className="relative mb-4">
                              <img 
                                src={previewUrl} 
                                alt="Captured" 
                                className="w-full h-80 object-cover rounded-lg" 
                              />
                              <button
                                onClick={resetForm}
                                className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-100"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'upload' && (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <div className="flex">
                          <Info className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <p className="font-medium text-blue-800">Photo Requirements</p>
                            <p className="text-blue-700 text-sm mt-1">
                              Upload a clear photo of the person's face. The photo should be well-lit with the face clearly visible.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        {!previewUrl ? (
                          <div className="w-full max-w-md">
                            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-700">
                                  <span className="font-medium">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                  JPEG, PNG or HEIC (MAX. 5MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="w-full max-w-md">
                            <div className="relative mb-4">
                              <img 
                                src={previewUrl} 
                                alt="Uploaded" 
                                className="w-full h-80 object-cover rounded-lg" 
                              />
                              <button
                                onClick={resetForm}
                                className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-100"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              
                              {faceDetected && (
                                <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Face Detected
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {previewUrl && faceDetected && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Person's Name
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          placeholder="Enter name"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleRegisterFace}
                          disabled={registrationStatus === 'processing'}
                          className={`ml-3 px-4 py-2 rounded-md ${
                            registrationStatus === 'processing'
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white flex items-center`}
                        >
                          {registrationStatus === 'processing' ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Register Face
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Registered Faces Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  Registered Faces
                </h2>
                
                {registeredFaces.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">
                    No faces registered yet. Use the form above to add your first face.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {registeredFaces.map(face => (
                      <div key={face.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <div className="w-full h-32 bg-gray-200">
                          <img 
                            src={face.imageUrl} 
                            alt={face.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 truncate">{face.name}</h3>
                          <p className="text-xs text-gray-500">Added: {face.dateAdded}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">How It Works</h2>
                
                <div className="space-y-4 text-sm text-gray-600">
                  <p>
                    Our facial recognition system uses Amazon Rekognition to identify people in your photos.
                  </p>
                  
                  <div className="flex items-start pt-2">
                    <div className="bg-gray-100 rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      1
                    </div>
                    <p className="text-gray-700">
                      Register a face using your webcam or by uploading a clear photo
                    </p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-gray-100 rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <p className="text-gray-700">
                      Your facial data is securely stored in an AWS collection
                    </p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-gray-100 rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <p className="text-gray-700">
                      When you upload photos, we'll automatically identify registered faces
                    </p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-gray-100 rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      4
                    </div>
                    <p className="text-gray-700">
                      Search for photos by person's name or browse by faces
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Tips for Best Results</h2>
                
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Use clear, well-lit photos with the face clearly visible</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Register multiple photos of the same person for better accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Include different angles and expressions in your registration photos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Avoid heavy makeup or accessories that obscure facial features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>For children, consider re-registering periodically as they grow</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration; 