import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import { docClient } from '../lib/awsClient';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

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
    const [matches, setMatches] = useState([]);
    const [registeredFace, setRegisteredFace] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch user's face data and matched photos on load
    useEffect(() => {
        if (user?.id) {
            fetchUserData();
        }
    }, [user?.id]);
    
    const fetchUserData = async () => {
        try {
            setLoading(true);
            console.log('[DASHBOARD] Fetching user data...');
            
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
                    console.log('[DASHBOARD] Face data found');
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
                    console.log(`[DASHBOARD] Found ${matchItems.length} matches`);
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

    useEffect(() => {
        console.log('[Dashboard.js] Mounted');
    }, []);

    console.log('[DASHBOARD] User data:', user);

    const handleSignOut = () => {
        console.log('[DASHBOARD] Sign out button clicked');
        signOut();
    };

    const navigateToFaceRegistration = () => {
        console.log('[DASHBOARD] Navigating to face registration');
        navigate('/register-face');
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
            console.log('Rekognition response:', response);

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

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                        {matches.length > 0 && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                                We found you in {matches.length} photo{matches.length === 1 ? '' : 's'}!
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={handleSignOut}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <h2 className="text-lg font-semibold text-blue-800 mb-2">User Information</h2>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Name:</strong> {user?.name || 'Not provided'}</p>
                    <p><strong>User ID:</strong> {user?.id}</p>
                    <p><strong>Created:</strong> {new Date().toLocaleString()}</p>
                </div>

                <div className="mb-8 p-4 bg-purple-50 rounded-md">
                    <h2 className="text-lg font-semibold text-purple-800 mb-3">Face Recognition</h2>
                    
                    {registeredFace ? (
                        <div className="flex flex-col md:flex-row gap-4 items-start mb-4">
                            <div className="md:w-1/3">
                                {registeredFace.image_url && (
                                    <div className="rounded-lg overflow-hidden border-2 border-purple-300">
                                        <img 
                                            src={registeredFace.image_url} 
                                            alt="Registered Face" 
                                            className="w-full h-auto"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="md:w-2/3">
                                <p className="text-purple-800 font-medium">Face Registration Info</p>
                                <p className="text-sm text-gray-600 mb-1">Face ID: <span className="font-mono text-xs">{registeredFace.face_id}</span></p>
                                <p className="text-sm text-gray-600 mb-3">Registered: {new Date(registeredFace.created_at).toLocaleString()}</p>
                                
                                {!cameraActive && !faceProcessing && !faceData && (
                                    <button
                                        onClick={startCamera}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
                                    >
                                        Verify Identity
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-purple-700 mb-4">You haven't registered your face yet. Register to find photos of you!</p>
                            <button
                                onClick={navigateToFaceRegistration}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-md font-medium"
                            >
                                Register Face
                            </button>
                        </div>
                    )}

                    {(cameraActive || faceProcessing) && (
                        <div className="text-center my-4">
                            <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg border-2 border-purple-300 mb-4">
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
                            <p className="text-sm text-purple-700">Processing your face...</p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                            {errorMessage}
                        </div>
                    )}

                    {faceData && (
                        <div className="mt-4 p-4 bg-green-100 rounded-md">
                            <h3 className="text-md font-semibold text-green-800 mb-2">Face Recognition Results</h3>
                            <p className="text-green-700"><strong>Match:</strong> {Math.round(faceData.similarity)}% similarity</p>
                            <p className="text-green-700"><strong>Confidence:</strong> {Math.round(faceData.confidence)}%</p>
                            <p className="text-green-700"><strong>Face ID:</strong> {faceData.faceId}</p>
                        </div>
                    )}
                </div>

                {matches.length > 0 && (
                    <div className="mb-8 p-4 bg-green-50 rounded-md">
                        <h2 className="text-lg font-semibold text-green-800 mb-3">
                            Your Matched Photos ({matches.length})
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {matches.slice(0, 3).map((match, index) => (
                                <div key={match.id || index} className="bg-white rounded-md shadow-sm overflow-hidden border border-gray-200">
                                    <img 
                                        src={`https://shmong.s3.amazonaws.com/${match.photo_id}`} 
                                        alt={`Match ${index + 1}`}
                                        className="w-full h-32 object-cover" 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Photo+Not+Available';
                                        }}
                                    />
                                    <div className="p-2">
                                        <p className="text-xs text-gray-500">Match: {Math.round(match.similarity)}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {matches.length > 3 && (
                            <div className="text-center mt-3">
                                <button 
                                    onClick={navigateToPhotos}
                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                >
                                    View all {matches.length} photos →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button 
                        onClick={navigateToFaceRegistration}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-md text-center font-semibold"
                    >
                        Register Face
                    </button>
                    <button 
                        onClick={navigateToPhotos}
                        className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-md text-center font-semibold"
                    >
                        My Photos & Matches
                    </button>
                    <button 
                        onClick={navigateToUpload}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-md text-center font-semibold md:col-span-2"
                    >
                        Upload New Photos
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-md">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Authentication Status</h3>
                        <p className="text-green-600">
                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            Successfully authenticated with AWS Cognito
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                            You now have access to all features of the application.
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                        <h3 className="text-lg font-semibold text-purple-800 mb-2">Next Steps</h3>
                        <ul className="list-disc list-inside text-gray-700">
                            <li>Register your face to enable matching</li>
                            <li>Upload photos to find matches</li>
                            <li>View your match history</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
