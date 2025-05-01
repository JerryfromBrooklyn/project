import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import { docClient } from '../lib/awsClient';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { motion, AnimatePresence } from 'framer-motion';
import FaceRegistration from '../components/FaceLivenessDetector';
import {
  User, LogOut, Camera, Image as ImageIcon, Upload, Trash2,
  Check, AlertTriangle, RefreshCw, Search, Info
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceProcessing, setFaceProcessing] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [canvasRef, setCanvasRef] = useState(null);
  const [matches, setMatches] = useState([]);
  const [registeredFace, setRegisteredFace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showFaceLiveness, setShowFaceLiveness] = useState(false);

  // Fetch user's face data and matched photos on load
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Clear previous data to ensure refresh
      setRegisteredFace(null);
      setMatches([]);
      
      // Get user's face data
      try {
        const { Items: faceItems } = await docClient.send(new QueryCommand({
          TableName: 'shmong-face-data',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': user.id
          },
          Limit: 1
        }));
        
        if (faceItems && faceItems.length > 0) {
          setRegisteredFace(unmarshall(faceItems[0]));
        }
      } catch (err) {
        console.error('[DASHBOARD] Error fetching face data:', err);
      }
      
      // Get user's matched photos
      try {
        const { Items: matchItems } = await docClient.send(new QueryCommand({
          TableName: 'shmong-face-matches',
          IndexName: 'UserIdCreatedAtIndex',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': user.id
          },
          ScanIndexForward: false // Latest first
        }));
        
        if (matchItems && matchItems.length > 0) {
          const processedMatches = matchItems.map(item => unmarshall(item));
          setMatches(processedMatches);
        }
      } catch (err) {
        console.error('[DASHBOARD] Error fetching matches:', err);
      }
    } catch (error) {
      console.error('[DASHBOARD] Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  const navigateToFaceRegistration = () => {
    setShowFaceLiveness(true);
  };

  const navigateToPhotos = () => {
    navigate('/my-photos');
  };

  const navigateToUpload = () => {
    navigate('/upload');
  };

  const navigateToTrash = () => {
    setActiveTab('trash');
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setFaceProcessing(true);
      setErrorMessage(null);

      if (!videoRef) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });

      videoRef.srcObject = stream;
      videoRef.play();

      // Wait for video to load before capturing
      videoRef.onloadedmetadata = () => {
        setTimeout(captureFace, 2000);
      };
    } catch (err) {
      console.error('Error accessing camera:', err);
      setErrorMessage('Could not access camera. Please make sure camera access is allowed.');
      setCameraActive(false);
      setFaceProcessing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef && videoRef.srcObject) {
      const tracks = videoRef.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFace = async () => {
    try {
      if (!videoRef || !canvasRef) return;

      const context = canvasRef.getContext('2d');
      canvasRef.width = videoRef.videoWidth;
      canvasRef.height = videoRef.videoHeight;
      context.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);

      // Convert canvas to blob
      const blob = await new Promise(resolve => 
        canvasRef.toBlob(resolve, 'image/jpeg', 0.9)
      );
      
      // Convert blob to buffer
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      await detectFace(uint8Array);
      
      // Stop the camera after processing
      stopCamera();
      
    } catch (err) {
      console.error('Error capturing face:', err);
      setErrorMessage('Error processing face. Please try again.');
      setFaceProcessing(false);
    }
  };

  const detectFace = async (imageBytes) => {
    try {
      // Create AWS Rekognition client
      const client = new RekognitionClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        }
      });

      // Search faces by image
      const command = new SearchFacesByImageCommand({
        CollectionId: "user-faces",
        Image: {
          Bytes: imageBytes
        },
        MaxFaces: 1,
        FaceMatchThreshold: 80
      });

      const response = await client.send(command);

      if (response.FaceMatches && response.FaceMatches.length > 0) {
        setFaceDetected(true);
        setFaceData({
          similarity: response.FaceMatches[0].Similarity,
          faceId: response.FaceMatches[0].Face.FaceId,
          confidence: response.FaceMatches[0].Face.Confidence
        });
      } else {
        setFaceDetected(false);
        setFaceData(null);
      }
    } catch (err) {
      console.error('Error with Rekognition:', err);
      setErrorMessage('Error detecting face. Please try again.');
      setFaceDetected(false);
      setFaceData(null);
    } finally {
      setFaceProcessing(false);
    }
  };

  // Function to be called after successful face registration
  const handleRegistrationSuccess = () => {
    fetchUserData();
  };

  // Wrapper for tab content to add animation
  const TabContent = ({ show, children }) => (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">Shmong</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchUserData}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                aria-label="Refresh"
                title="Refresh data"
              >
                <RefreshCw size={20} />
              </button>
              
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut size={16} className="mr-1" />
                <span>Sign Out</span>
              </button>
              
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800">
                  <User size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'home', label: 'Home', icon: User },
              { id: 'matches', label: 'Matches', icon: Search, count: matches.length },
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'trash', label: 'Trash', icon: Trash2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center px-4 py-3 border-b-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Home Tab */}
        <TabContent show={activeTab === 'home' && !loading}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {/* User Information Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <User size={24} />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">{user?.name || user?.email}</h2>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">User ID</span>
                      <span className="text-gray-900 font-mono">{user?.id.substring(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account Status</span>
                      <span className="flex items-center text-green-600">
                        <Check size={14} className="mr-1" />
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Face Registration</span>
                      <span className={`flex items-center ${registeredFace ? 'text-green-600' : 'text-amber-600'}`}>
                        {registeredFace 
                          ? <><Check size={14} className="mr-1" /> Registered</>
                          : <><AlertTriangle size={14} className="mr-1" /> Not Registered</>
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Face Registration Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">Face Registration</h3>
                  <p className="text-indigo-100 text-sm">
                    Register your face to find yourself in photos
                  </p>
                </div>
                <div className="p-6">
                  {registeredFace ? (
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-full md:w-1/3">
                        {registeredFace.image_url && (
                          <div className="rounded-lg overflow-hidden border-2 border-indigo-100">
                            <img 
                              src={registeredFace.image_url} 
                              alt="Registered Face" 
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                      <div className="w-full md:w-2/3">
                        <p className="text-indigo-800 font-medium mb-2">Registration Info</p>
                        <p className="text-sm text-gray-600 mb-1">
                          Registered: {new Date(registeredFace.created_at).toLocaleString()}
                        </p>
                        
                        {!cameraActive && !faceProcessing && !faceData && (
                          <button
                            onClick={startCamera}
                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Camera size={16} className="mr-2" />
                            Verify Identity
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="mb-4 w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mx-auto">
                        <Camera size={32} />
                      </div>
                      <p className="text-gray-700 mb-4">
                        You haven't registered your face yet. Register to find photos of you!
                      </p>
                      <button
                        onClick={() => setShowFaceLiveness(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Camera size={16} className="mr-2" />
                        Register Face
                      </button>
                      {showFaceLiveness && (
                        <FaceRegistration 
                          onSuccess={handleRegistrationSuccess} 
                          onClose={() => setShowFaceLiveness(false)}
                        />
                      )}
                    </div>
                  )}

                  {(cameraActive || faceProcessing) && (
                    <div className="text-center my-4">
                      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg border-2 border-indigo-200 mb-4">
                        <video 
                          ref={ref => setVideoRef(ref)} 
                          className="w-full h-auto" 
                          autoPlay 
                          playsInline 
                          muted
                        />
                        {faceProcessing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <canvas ref={ref => setCanvasRef(ref)} className="hidden" />
                      <p className="text-sm text-indigo-700">Processing your face...</p>
                    </div>
                  )}

                  {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start"
                    >
                      <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  {faceData && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-green-50 rounded-md"
                    >
                      <h3 className="text-md font-semibold text-green-800 mb-2 flex items-center">
                        <Check size={16} className="mr-2" />
                        Face Recognition Results
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded-md">
                          <p className="text-xs text-gray-500">Match Similarity</p>
                          <p className="text-lg font-semibold text-green-700">{Math.round(faceData.similarity)}%</p>
                        </div>
                        <div className="bg-white p-2 rounded-md">
                          <p className="text-xs text-gray-500">Confidence</p>
                          <p className="text-lg font-semibold text-green-700">{Math.round(faceData.confidence)}%</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2">
              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { 
                    title: 'Register Face', 
                    icon: Camera, 
                    description: 'Register your face to get matched in photos',
                    action: navigateToFaceRegistration,
                    color: 'from-purple-500 to-indigo-600',
                    disabled: !!registeredFace
                  },
                  { 
                    title: 'View Matches', 
                    icon: Search, 
                    description: `${matches.length} photos found with you`,
                    action: navigateToPhotos,
                    color: 'from-emerald-500 to-green-600',
                    highlight: matches.length > 0
                  },
                  { 
                    title: 'Upload Photos', 
                    icon: Upload, 
                    description: 'Add new photos to the collection',
                    action: navigateToUpload,
                    color: 'from-blue-500 to-cyan-600',
                  }
                ].map((card, index) => (
                  <motion.div 
                    key={card.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + (index * 0.05) }}
                    className="relative overflow-hidden"
                  >
                    <button
                      onClick={card.action}
                      disabled={card.disabled}
                      className={`w-full h-full text-left rounded-xl p-5 ${
                        card.disabled 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : `bg-gradient-to-br ${card.color} hover:shadow-md transform hover:-translate-y-1 transition-all duration-200`
                      }`}
                    >
                      <div className={`${card.disabled ? 'text-gray-400' : 'text-white'}`}>
                        <card.icon size={24} className="mb-3" />
                        <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                        <p className="text-sm opacity-90">{card.description}</p>
                      </div>
                      
                      {card.highlight && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{matches.length}</span>
                        </div>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Recent Matches */}
              {matches.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Matches</h3>
                    <button 
                      onClick={navigateToPhotos}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                    >
                      View All
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {matches.slice(0, 6).map((match, index) => (
                        <motion.div 
                          key={match.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: 0.3 + (index * 0.05) }}
                          className="group relative bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-square">
                            <img 
                              src={`https://shmong.s3.amazonaws.com/${match.photo_id}`} 
                              alt={`Match ${index + 1}`}
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300x200?text=Photo+Not+Available';
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <div className="flex items-center bg-white/90 rounded-lg p-2">
                                <div className="mr-2 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Check size={16} className="text-green-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-green-800 font-semibold">
                                    {Math.round(match.similarity)}% Match
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(match.matched_at || match.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tips and Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                    <Info size={20} className="text-blue-800" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-blue-800">Getting Started Tips</h3>
                    <ul className="mt-2 text-sm text-blue-700 space-y-2">
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-blue-500" />
                        Register your face to enable matching in photos
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-blue-500" />
                        Upload photos to contribute to the collection
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-blue-500" />
                        Check your matches regularly as new photos are added
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </TabContent>

        {/* Matches Tab (Placeholder) */}
        <TabContent show={activeTab === 'matches' && !loading}>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Matches</h2>
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={24} className="text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No matches found</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Register your face and upload photos to start finding yourself in the collection.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={navigateToPhotos}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Search size={16} className="mr-2" />
                  View All Matches
                </button>
              </div>
            )}
          </div>
        </TabContent>

        {/* Upload Tab (Placeholder) */}
        <TabContent show={activeTab === 'upload' && !loading}>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Photos</h2>
            <div className="text-center">
              <button
                onClick={navigateToUpload}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Upload size={16} className="mr-2" />
                Go to Photo Uploader
              </button>
            </div>
          </div>
        </TabContent>

        {/* Trash Tab (Placeholder) */}
        <TabContent show={activeTab === 'trash' && !loading}>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trash Bin</h2>
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                View, restore, or permanently delete your trashed photos.
              </p>
              <button
                onClick={navigateToTrash}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Trash2 size={16} className="mr-2" />
                Open Trash Bin
              </button>
            </div>
          </div>
        </TabContent>
      </main>
    </div>
  );
};

export default Dashboard;
