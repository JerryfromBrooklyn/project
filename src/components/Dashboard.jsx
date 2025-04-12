import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, User, Sparkles, Bell, Image, Search, LogOut, Home, Users, Settings, Trash } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import TrashBin from './TrashBin';
import MyPhotos from './MyPhotos';

const Dashboard = () => {
    console.log('[DASHBOARD] Rendering Dashboard component');
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceProcessing, setFaceProcessing] = useState(false);
    const [faceData, setFaceData] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [videoRef, setVideoRef] = useState(null);
    const [canvasRef, setCanvasRef] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [registeredFace, setRegisteredFace] = useState(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);

    // Fetch user's face data and notifications on load
    const fetchUserData = useCallback(async () => {
        setLoading(true);
        console.log('[DASHBOARD] Fetching user data (Face & Notifications)...');
        if (!user || !user.id) {
            console.error('[DASHBOARD] Cannot fetch data: User ID is missing.');
            setLoading(false);
            return; 
        }
        try {
            console.log('[DASHBOARD] Querying shmong-face-data with user ID:', user.id);
            const { Items: faceItems } = await docClient.send(new QueryCommand({
                TableName: 'shmong-face-data',
                KeyConditionExpression: 'user_id = :userId',
                ExpressionAttributeValues: {
                    ':userId': user.id
                },
                Limit: 1
            }));
            
            if (faceItems && faceItems.length > 0) {
                console.log('[DASHBOARD] Face data found');
                setRegisteredFace(faceItems[0]);
            } else {
                console.log('[DASHBOARD] No registered face found.');
                setRegisteredFace(null);
            }
            
            console.log('[DASHBOARD] Querying shmong-notifications GSI with user ID:', user.id);
        } catch (error) {
            console.error('[DASHBOARD] Error fetching user data:', error);
            if (error.name === 'ValidationException') {
                console.error('[DASHBOARD] Validation Error Details - Code:', error.code, 'Message:', error.message, 'Metadata:', error.$metadata);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        console.log('[Dashboard.jsx] Mounted');
        if (user?.id) {
            fetchUserData();
        }
    }, [user?.id, fetchUserData]);

    console.log('[DASHBOARD] User data:', user);

    const handleSignOut = () => {
        console.log('[DASHBOARD] Sign out button clicked');
        signOut();
    };

    const navigateToFaceRegistration = () => {
        console.log('[DASHBOARD] Opening face registration modal');
        setShowRegistrationModal(true);
    };

    const handleRegistrationSuccess = () => {
        console.log('[DASHBOARD] Face registration successful, refreshing data');
        setShowRegistrationModal(false);
        // Refetch user data to get updated face registration info
        fetchUserData().then(() => {
            console.log('[DASHBOARD] Face registration successful:', {
                faceId: registeredFace?.face_id,
                attributesCount: registeredFace?.faceAttributes ? Object.keys(registeredFace.faceAttributes).length : 0,
            });
            console.log('[DASHBOARD] Raw face attributes received:', registeredFace?.faceAttributes);
        });
    };

    const handleRegistrationClose = () => {
        console.log('[DASHBOARD] Face registration modal closed');
        setShowRegistrationModal(false);
    };

    const navigateToPhotos = () => {
        console.log('[DASHBOARD] Navigating to photos');
        navigate('/my-photos');
    };

    const navigateToUpload = () => {
        console.log('[DASHBOARD] Navigating to upload');
        navigate('/upload');
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
            console.log('[DASHBOARD] Detecting face with Rekognition...');
            
            // Use the pre-configured rekognitionClient from awsClient.js
            const command = new SearchFacesByImageCommand({
                CollectionId: COLLECTION_ID,
                Image: {
                    Bytes: imageBytes
                },
                MaxFaces: 1,
                FaceMatchThreshold: 80
            });

            const response = await rekognitionClient.send(command);
            console.log('[DASHBOARD] Rekognition response:', response);

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
            console.error('[DASHBOARD] Error with Rekognition:', err);
            setErrorMessage('Error detecting face. Please try again.');
            setFaceDetected(false);
            setFaceData(null);
        } finally {
            setFaceProcessing(false);
        }
    };

    const renderHomeTab = () => (
        <div className="space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    User Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{user?.name || 'Not provided'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">User ID</p>
                        <p className="font-medium text-xs text-gray-500">{user?.id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Joined</p>
                        <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                        <Camera className="h-5 w-5 mr-2" />
                        Face Recognition
                    </h2>
                </div>
                
                <div className="p-6">
                    {registeredFace ? (
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0">
                                {registeredFace.image_url && (
                                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-indigo-300">
                                        <img 
                                            src={registeredFace.image_url} 
                                            alt="Registered Face" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-md font-semibold text-gray-800 mb-2">Registered Face Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-sm text-gray-600">Face ID</p>
                                        <p className="font-medium text-xs text-gray-500">{registeredFace.face_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Registration Date</p>
                                        <p className="font-medium">{new Date(registeredFace.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Matches Found</p>
                                        <p className="font-medium">--</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p className="font-medium text-green-600 flex items-center">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Active
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <button 
                                        onClick={!cameraActive ? startCamera : null}
                                        disabled={cameraActive || faceProcessing}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                    >
                                        Verify Identity
                                    </button>
                                    <button 
                                        onClick={navigateToPhotos}
                                        className="ml-3 bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50 transition"
                                    >
                                        View My Photos
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                <Camera className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Face Not Registered</h3>
                            <p className="text-gray-600 mb-6">
                                Register your face to enable matching with festival photos.
                            </p>
                            <button 
                                onClick={navigateToFaceRegistration}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition"
                            >
                                Register Face
                            </button>
                        </div>
                    )}
                    
                    {/* Camera View */}
                    {(cameraActive || faceProcessing) && (
                        <div className="mt-6">
                            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg border-2 border-indigo-300 mb-4">
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
                            <p className="text-sm text-indigo-700 text-center">Processing your face...</p>
                        </div>
                    )}
                    
                    {/* Face Detection Results */}
                    {faceData && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h3 className="text-md font-semibold text-green-800 mb-2 flex items-center">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Identity Verified
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <p className="text-sm text-gray-600">Match</p>
                                    <p className="font-medium text-green-700">{Math.round(faceData.similarity)}% similarity</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Confidence</p>
                                    <p className="font-medium text-green-700">{Math.round(faceData.confidence)}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                            {errorMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center">
                            <Bell className="h-5 w-5 mr-2" />
                            Recent Notifications
                        </h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {notifications.slice(0, 3).map(notification => (
                            <div key={notification.id} className="p-3 bg-blue-50 rounded-md">
                                <h3 className="font-medium text-blue-800">{notification.title}</h3>
                                <p className="text-sm text-blue-600">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderUploadTab = () => (
        <div className="space-y-6">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Photos
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        Upload your photos to find matches with other festival attendees.
                    </p>
                    <button 
                        onClick={navigateToUpload}
                        className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 transition flex items-center justify-center"
                    >
                        <Upload className="h-5 w-5 mr-2" />
                        Go to Upload Page
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            {/* Header with User Info */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name || user?.email || 'User'}!</h1>
                </div>
                <button 
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
                <div className="flex border-b">
                    <button 
                        className={`flex items-center px-6 py-3 font-medium ${activeTab === 'home' ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('home')}
                    >
                        <User className={`h-5 w-5 mr-2 ${activeTab === 'home' ? 'text-indigo-700' : 'text-gray-500'}`} />
                        Home
                    </button>
                    <button 
                        className={`flex items-center px-6 py-3 font-medium ${activeTab === 'matches' ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('matches')}
                    >
                        <Image className={`h-5 w-5 mr-2 ${activeTab === 'matches' ? 'text-emerald-700' : 'text-gray-500'}`} />
                        Matches
                    </button>
                    <button 
                        className={`flex items-center px-6 py-3 font-medium ${activeTab === 'upload' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload className={`h-5 w-5 mr-2 ${activeTab === 'upload' ? 'text-blue-700' : 'text-gray-500'}`} />
                        Upload
                    </button>
                    <button 
                        className={`flex items-center px-6 py-3 font-medium ${activeTab === 'trash' ? 'bg-red-100 text-red-700 border-b-2 border-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('trash')}
                    >
                        <Trash className={`h-5 w-5 mr-2 ${activeTab === 'trash' ? 'text-red-700' : 'text-gray-500'}`} />
                        Trash
                    </button>
                </div>
            </div>
            
            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-indigo-600 font-medium">Loading your data...</p>
                </div>
            )}
            
            {/* Tab Content */}
            {!loading && (
                <>
                    {activeTab === 'home' && renderHomeTab()}
                    {activeTab === 'matches' && <MyPhotos />}
                    {activeTab === 'upload' && renderUploadTab()}
                    {activeTab === 'trash' && (
                        <TrashBin userId={user?.id} />
                    )}
                </>
            )}

            {/* Face Registration Modal */}
            {showRegistrationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-lg overflow-hidden w-full max-w-lg">
                        <div className="absolute top-0 right-0 p-2">
                            <button 
                                onClick={handleRegistrationClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <FaceRegistration 
                            onSuccess={handleRegistrationSuccess}
                            onClose={handleRegistrationClose}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
