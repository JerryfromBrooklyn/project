import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import { docClient } from '../lib/awsClient';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import FaceRegistration from './FaceRegistration';

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
                } else {
                    console.log('[DASHBOARD] Found 0 matches.');
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

    // Function to be called after successful face registration
    const handleRegistrationSuccess = () => {
        console.log('[DASHBOARD] Face registration successful, refreshing user data...');
        console.log('[DASHBOARD] >>> TRIGGERING DASHBOARD DATA REFRESH <<<');
        fetchUserData(); // Re-fetch user data to update face status and matches
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Photo Library</h2>
                            <PhotoManager />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
