import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import { docClient, rekognitionClient, COLLECTION_ID } from '../lib/awsClient';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Camera, Upload, User, Sparkles, Bell, Image, Search, LogOut, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import { detectFaces, captureImageFromVideo } from '../services/FaceDetectionService.js';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import PhotoUploader from '../components/PhotoUploader';

// Debug wrapper for component to catch rendering errors
const DashboardDebugWrapper = () => {
    try {
        console.log('[DEBUG] Attempting to render Dashboard component');
        return <DashboardContent />;
    } catch (error) {
        console.error('[DEBUG] Error rendering Dashboard:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
                    <p className="text-gray-700 mb-4">An error occurred while rendering the dashboard:</p>
                    <div className="bg-red-100 p-3 rounded border border-red-300 text-red-800 font-mono text-sm overflow-auto max-h-60">
                        {error.toString()}
                        <br/>
                        {error.stack}
                    </div>
                    <p className="mt-4 text-gray-600">Please check the console for more details.</p>
                </div>
            </div>
        );
    }
};

// New component for face detection testing
const FaceDetectionTest = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [faceResults, setFaceResults] = useState(null);
    const [error, setError] = useState(null);

    // Start the camera
    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
            }
        } catch (err) {
            console.error('Error starting camera:', err);
            setError(`Camera error: ${err.message}`);
        }
    };

    // Stop the camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Capture an image and detect faces
    const captureAndDetect = async () => {
        if (!videoRef.current) return;
        
        try {
            setIsCapturing(true);
            setError(null);
            
            // Capture image from video
            const result = await captureImageFromVideo(videoRef.current);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // Save the image URL for display
            setCapturedImage(result.imageUrl);
            
            // Detect faces in the captured image
            const faceDetectionResult = await detectFaces(result.imageData);
            setFaceResults(faceDetectionResult);
            
        } catch (err) {
            console.error('Error processing image:', err);
            setError(`Processing error: ${err.message}`);
        } finally {
            setIsCapturing(false);
        }
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                    Face Detection Test
                </h2>
            </div>
            
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Video preview */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Camera</h3>
                        <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 mb-3" style={{ minHeight: '240px' }}>
                            {stream ? (
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-500">Camera not active</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex space-x-3">
                            {!stream ? (
                                <button 
                                    onClick={startCamera}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition flex-1"
                                >
                                    Start Camera
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={captureAndDetect}
                                        disabled={isCapturing}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition flex-1 disabled:bg-green-300"
                                    >
                                        {isCapturing ? 'Processing...' : 'Detect Face'}
                                    </button>
                                    <button 
                                        onClick={stopCamera}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition"
                                    >
                                        Stop Camera
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Results area */}
                    <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Results</h3>
                        
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                                <p>{error}</p>
                            </div>
                        )}
                        
                        {capturedImage && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-1">Captured Image:</p>
                                <img 
                                    src={capturedImage} 
                                    alt="Captured Face" 
                                    className="w-full max-w-[240px] h-auto rounded-lg border border-gray-300"
                                />
                            </div>
                        )}
                        
                        {faceResults && (
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Detection Results:</p>
                                
                                {faceResults.success ? (
                                    faceResults.count > 0 ? (
                                        <div className="bg-gray-100 p-4 rounded-lg">
                                            <p className="font-medium text-green-700 mb-2">
                                                ✅ Detected {faceResults.count} face{faceResults.count !== 1 ? 's' : ''}
                                            </p>
                                            
                                            {faceResults.faces.map((face, index) => (
                                                <div key={index} className="mb-3 pb-3 border-b border-gray-300">
                                                    <p><strong>Face #{index + 1}</strong></p>
                                                    <ul className="text-xs space-y-1 text-gray-700">
                                                        <li>Confidence: {face.Confidence.toFixed(2)}%</li>
                                                        {face.AgeRange && (
                                                            <li>Age Range: {face.AgeRange.Low}-{face.AgeRange.High} years</li>
                                                        )}
                                                        {face.Gender && (
                                                            <li>Gender: {face.Gender.Value} ({face.Gender.Confidence.toFixed(2)}%)</li>
                                                        )}
                                                        {face.Emotions && face.Emotions[0] && (
                                                            <li>Emotion: {face.Emotions[0].Type} ({face.Emotions[0].Confidence.toFixed(2)}%)</li>
                                                        )}
                                                        {face.Smile && (
                                                            <li>Smiling: {face.Smile.Value ? 'Yes' : 'No'} ({face.Smile.Confidence.toFixed(2)}%)</li>
                                                        )}
                                                        {face.EyesOpen && (
                                                            <li>Eyes Open: {face.EyesOpen.Value ? 'Yes' : 'No'} ({face.EyesOpen.Confidence.toFixed(2)}%)</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-100 p-4 rounded-lg">
                                            <p className="font-medium text-yellow-700">No faces detected in the image</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-red-100 p-4 rounded-lg">
                                        <p className="font-medium text-red-700">Error: {faceResults.error}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardContent = () => {
    const { user, signOut, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState(null);
    const [faceMatches, setFaceMatches] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRegisteringFace, setIsRegisteringFace] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [registeredFaceId, setRegisteredFaceId] = useState(null);
    const [registrationMessage, setRegistrationMessage] = useState('');

    // State for registered face snapshot and attributes
    const [registeredImageUrl, setRegisteredImageUrl] = useState(null);
    const [faceAttributes, setFaceAttributes] = useState(null);

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        console.log('[DASHBOARD] Fetching user data...');
        try {
            const results = await Promise.allSettled([
                // 1. Get user's face data (assuming it now includes image URL and attributes)
                docClient.send(new QueryCommand({
                    TableName: 'shmong-face-data',
                    KeyConditionExpression: 'userId = :userIdVal',
                    ExpressionAttributeValues: { ':userIdVal': user.id },
                    Limit: 1
                })),
                // 2. Get user's matched photos
                docClient.send(new QueryCommand({
                    TableName: 'shmong-face-matches',
                    IndexName: 'UserIdCreatedAtIndex',
                    KeyConditionExpression: 'userId = :userIdVal',
                    ExpressionAttributeValues: { ':userIdVal': user.id },
                    ScanIndexForward: false
                })),
                // 3. Get user's notifications
                docClient.send(new QueryCommand({
                    TableName: 'shmong-notifications',
                    IndexName: 'UserIdIndex',
                    KeyConditionExpression: 'userId = :userIdVal',
                    ExpressionAttributeValues: { ':userIdVal': user.id },
                    ScanIndexForward: false
                }))
            ]);

            const [faceResult, matchResult, notifResult] = results;

            // Process face data
            if (faceResult.status === 'fulfilled' && faceResult.value.Items && faceResult.value.Items.length > 0) {
                const faceData = faceResult.value.Items[0];
                setRegisteredFaceId(faceData.rekognitionFaceId);
                // Set state for image URL and attributes if they exist
                setRegisteredImageUrl(faceData.registeredImageUrl || null); 
                setFaceAttributes(faceData.faceAttributes || null);
            } else {
                setRegisteredFaceId(null);
                setRegisteredImageUrl(null); 
                setFaceAttributes(null);
                if (faceResult.status === 'rejected') {
                    console.error("[DASHBOARD] Error fetching face data:", faceResult.reason);
                }
            }

            // Process matches
            if (matchResult.status === 'fulfilled') {
                setFaceMatches(matchResult.value.Items || []);
            } else {
                console.error("[DASHBOARD] Error fetching matches:", matchResult.reason);
                setError('Could not fetch face matches.');
            }

            // Process notifications
            if (notifResult.status === 'fulfilled') {
                setNotifications(notifResult.value.Items || []);
            } else {
                console.error("[DASHBOARD] Error fetching notifications:", notifResult.reason);
            }

        } catch (err) {
            console.error('[DASHBOARD] Error in fetchUserData:', err);
            setError(err.message || 'An unexpected error occurred while fetching data.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    // Effect for mount/unmount logging
    useEffect(() => {
        console.log('[Dashboard.jsx] Mounted');
        return () => {
            console.log('[Dashboard.jsx] Unmounted');
            // Clean up object URL if component unmounts
            if (registeredImageUrl && registeredImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(registeredImageUrl);
            }
        };
    }, []);

    // Handler for successful face registration from modal
    const handleFaceRegistrationSuccess = (newFaceId, attributes) => {
        console.log('[DASHBOARD] Face registration successful, new Face ID:', newFaceId);
        setRegisteredFaceId(newFaceId);
        setFaceAttributes(attributes); // Save attributes received from registration
        // Assuming the registration process provides a temporary blob URL for the snapshot
        // Ideally, the backend saves a permanent URL (e.g., S3) and fetchUserData retrieves it.
        // For now, we might not have the URL here unless FaceRegistration passes it back.
        setRegistrationMessage(`Face registered successfully! Face ID: ${newFaceId}`);
        setIsRegisteringFace(false);
        // Optionally re-fetch all data to ensure consistency
        fetchUserData(); 
    };

    // ====================
    // TAB RENDERING LOGIC
    // ====================

    const renderHomeTab = () => {
        if (loading) {
            return <div className="flex justify-center items-center p-10"><Loader className="animate-spin h-8 w-8 text-gray-500" /></div>;
        }
        return (
            <div className="space-y-6">
                <h3 className="text-lg font-medium">Welcome, {user?.full_name || user?.email}!</h3>

                {/* Face Registration Status */} 
                <Card>
                    <CardHeader>
                        <CardTitle>Face Registration Status</CardTitle>
                        <CardDescription>Check your face registration details and manage your facial data.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-start gap-6">
                        {/* Registered Face Image and Attributes */} 
                        {registeredFaceId && registeredImageUrl && (
                            <div className="md:w-1/3">
                                <img 
                                    src={registeredImageUrl} 
                                    alt="Registered Face Snapshot" 
                                    className="rounded-lg shadow-md border border-gray-200 w-full object-cover aspect-square"
                                />
                            </div>
                        )}
                        {registeredFaceId && faceAttributes && (
                            <div className="md:w-2/3 space-y-2">
                                <h4 className="font-semibold text-md mb-2">Detected Attributes:</h4>
                                <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                                    {faceAttributes.AgeRange && <li>Age Range: {faceAttributes.AgeRange.Low} - {faceAttributes.AgeRange.High}</li>}
                                    {faceAttributes.Gender && <li>Gender: {faceAttributes.Gender.Value} (Confidence: {faceAttributes.Gender.Confidence?.toFixed(1)}%)</li>}
                                    {faceAttributes.Smile && <li>Smile: {faceAttributes.Smile.Value ? 'Yes' : 'No'} (Confidence: {faceAttributes.Smile.Confidence?.toFixed(1)}%)</li>}
                                    {faceAttributes.Eyeglasses && <li>Eyeglasses: {faceAttributes.Eyeglasses.Value ? 'Yes' : 'No'} (Confidence: {faceAttributes.Eyeglasses.Confidence?.toFixed(1)}%)</li>}
                                    {faceAttributes.Sunglasses && <li>Sunglasses: {faceAttributes.Sunglasses.Value ? 'Yes' : 'No'} (Confidence: {faceAttributes.Sunglasses.Confidence?.toFixed(1)}%)</li>}
                                    {faceAttributes.Emotions && faceAttributes.Emotions.length > 0 && (
                                        <li>Primary Emotion: {faceAttributes.Emotions[0].Type} (Confidence: {faceAttributes.Emotions[0].Confidence?.toFixed(1)}%)</li>
                                    )}
                                    {/* Add other relevant attributes here */}
                                </ul>
                            </div>
                        )}
                        
                        {/* Status Text and Action Button */} 
                        {!loading && (
                            <div className={`flex-1 ${registeredFaceId ? 'md:w-full' : 'md:w-1/3'} flex flex-col justify-center`}>
                                {registeredFaceId ? (
                                    <div className="text-center md:text-left">
                                        <p className="text-green-600 font-medium flex items-center justify-center md:justify-start">
                                            <CheckCircle className="h-5 w-5 mr-2" /> Face Registered (ID: ...{registeredFaceId.slice(-6)})
                                        </p>
                                        {/* Add a button to re-register or delete if needed */}
                                    </div>
                                ) : (
                                    <div className="text-center md:text-left">
                                        <p className="text-yellow-600 font-medium mb-2 flex items-center justify-center md:justify-start">
                                            <AlertCircle className="h-5 w-5 mr-2" /> No face registered yet.
                                        </p>
                                        <Button onClick={() => setIsRegisteringFace(true)}>
                                            Register Your Face
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats */} 
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
        );
    };

    const renderMatchesTab = () => (
        <div className="space-y-6">
            {faceMatches.length > 0 ? (
                <div className="space-y-6">
                    {faceMatches.map((match, index) => (
                        <div key={match.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                <div className="bg-gray-100 md:w-1/3 p-4">
                                    <img 
                                        src={`https://shmong.s3.amazonaws.com/${match.photo_id}`} 
                                        alt={`Match ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-md" 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Photo+Not+Available';
                                        }}
                                    />
                                </div>
                                <div className="p-4 md:w-2/3">
                                    <h3 className="font-semibold text-lg text-gray-800">Match #{index + 1}</h3>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-sm text-gray-600">Photo ID</p>
                                            <p className="font-medium text-xs text-gray-500">{match.photo_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Match Date</p>
                                            <p className="font-medium">{new Date(match.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Similarity</p>
                                            <p className="font-medium">{Math.round(match.similarity)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Confidence</p>
                                            <p className="font-medium">{Math.round(match.confidence || 0)}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <a 
                                            href={`https://shmong.s3.amazonaws.com/${match.photo_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                                        >
                                            <span>View Full Size</span>
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No Matches Found</h3>
                    <p className="text-gray-600 mb-6">
                        {registeredFaceId 
                            ? "We haven't found you in any festival photos yet." 
                            : "Register your face first to find matches."}
                    </p>
                    {!registeredFaceId && (
                        <button 
                            onClick={() => setIsRegisteringFace(true)}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium hover:bg-emerald-700 transition"
                        >
                            Register Face
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderUploadTab = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Upload Photos</h3>
            <p className="text-sm text-gray-600">
                Upload photos from the event here. We'll process them to find faces and potential matches.
            </p>
            <PhotoUploader /> 
        </div>
    );

    // Add a new face test tab to render the face detection test
    const renderFaceTestTab = () => (
        <div className="space-y-6">
            <FaceDetectionTest />
        </div>
    );

    // ====================
    // MAIN COMPONENT RETURN
    // ====================

    if (authLoading) {
        // ... loading spinner ...
    }

    if (!user) {
        // This should ideally be handled by ProtectedRoute, but as a fallback:
        return <p>Redirecting to login...</p>;
    }

    console.log('[DASHBOARD] Rendering Dashboard component');
    console.log('[DASHBOARD] Auth context:', useAuth()); 
    console.log('[DASHBOARD] User data from auth:', user);
    console.log('[DASHBOARD] User data:', userData);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */} 
            <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name || user?.email || 'User'}!</h1>
                    {registeredFaceId && faceMatches.length > 0 && (
                        <p className="text-green-600 font-medium">
                            We found you in {faceMatches.length} photo{faceMatches.length === 1 ? '' : 's'}!
                        </p>
                    )}
                </div>
                <button 
                    onClick={() => signOut()}
                    className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </button>
            </div>
            
            {/* Main Content */} 
            <main className="p-4 md:p-8">
                {/* Registration Success Message */} 
                {registrationMessage && (
                    <div className="bg-green-100 border-l-4 border-green-400 text-green-700 p-4 mb-4">
                        <p>{registrationMessage}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-indigo-600 font-medium">Loading your data...</p>
                    </div>
                )}
                
                {/* Error State */} 
                {error && !loading && (
                    <div className="bg-red-100 border-l-4 border-red-400 text-red-700 p-4 mb-4">
                        <p>{error}</p>
                    </div>
                )}

                {/* Tab Navigation */} 
                {!loading && !error && (
                    <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
                        <div className="flex border-b">
                            {Object.entries(tabs).map(([key, tab]) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={key}
                                        className={`flex items-center px-6 py-3 font-medium ${activeTab === key ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                        onClick={() => setActiveTab(key)}
                                    >
                                        <IconComponent className={`h-5 w-5 mr-2 ${activeTab === key ? 'text-indigo-700' : 'text-gray-500'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab Content */} 
                {!loading && !error && (
                    <div className="bg-white shadow-md rounded-lg p-6">
                        {tabs[activeTab]?.render()}
                    </div>
                )}
            </main>

            {/* Face Registration Modal */} 
            {isRegisteringFace && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-lg overflow-hidden w-full max-w-lg">
                        <div className="absolute top-0 right-0 p-2">
                            <button 
                                onClick={() => setIsRegisteringFace(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <FaceRegistration 
                            onSuccess={handleFaceRegistrationSuccess}
                            onClose={() => setIsRegisteringFace(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Export the debug wrapper instead of the original component
export default DashboardDebugWrapper;
