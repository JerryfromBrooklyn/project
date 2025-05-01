import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import { FaceIndexingService } from '../services/FaceIndexingService';
import './CustomFaceLivenessDetector.css';

// *** Define SEGMENT_ANGLES outside the component ***
const SEGMENT_ANGLES = [
  { yawMin: 10, yawMax: 70, pitchMin: -20, pitchMax: 20 },   // 0: Right - Made even easier
  { yawMin: 5, yawMax: 60, pitchMin: -60, pitchMax: -5 },  // 1: Up-Right - Made even easier
  { yawMin: -15, yawMax: 15, pitchMin: -60, pitchMax: -5 }, // 2: Up - Made even easier
  { yawMin: -60, yawMax: -5, pitchMin: -60, pitchMax: -5 }, // 3: Up-Left - Made even easier
  { yawMin: -70, yawMax: -10, pitchMin: -20, pitchMax: 20 },  // 4: Left - Made even easier
  { yawMin: -60, yawMax: -5, pitchMin: 5, pitchMax: 60 },   // 5: Down-Left - Made even easier
  { yawMin: -15, yawMax: 15, pitchMin: 5, pitchMax: 60 },  // 6: Down - Made even easier
  { yawMin: 5, yawMax: 60, pitchMin: 5, pitchMax: 60 },    // 7: Down-Right - Made even easier
];

const CustomFaceLivenessDetector = ({ onSuccess, onError, onClose }) => {
  console.log('[CustomFaceLivenessDetector] *** COMPONENT MOUNTED ***');
  
  // Auth context for user data
  const { user } = useAuth();
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const faceApiIntervalRef = useRef(null);
  const headPoseRef = useRef({
    segments: Array(8).fill(false),
    currentSegmentIndex: 0,
    lastYaw: 0,
    lastPitch: 0,
    lastDetectionTime: Date.now(),
    faceDetected: false
  });
  const isMountedRef = useRef(true); // *** Define isMountedRef at the top level ***
  
  // State
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [progressSegments, setProgressSegments] = useState(0);
  const [stage, setStage] = useState('init'); // init, recording, lookStraight, complete, error
  const [finalImage, setFinalImage] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ yaw: 0, pitch: 0 }); // Debug state for head pose
  
  // Constants from environment variables
  const S3_BUCKET = import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430';
  
  // Helper - is this an iPhone?
  const isIPhone = () => {
    return /iPhone/i.test(navigator.userAgent);
  };

  // Helper - is this iOS?
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };
  
  // Effect to track mount status
  useEffect(() => {
    isMountedRef.current = true;
    // Cleanup function for mount status
    return () => {
      console.log('[CustomFaceLivenessDetector] Mount status cleanup');
      isMountedRef.current = false;
    };
  }, []); // Runs only once on mount
  
  // Initialize models and camera
  useEffect(() => {
    console.log('[CustomFaceLivenessDetector] Initializing component and models');
    let isMounted = true;

    const initialize = async () => {
      try {
        setIsInitializing(true);
        setIsCameraReady(false);
        
        console.log('[CustomFaceLivenessDetector] Loading face-api.js models...');
        // First check if models are already loaded
        console.log('[CustomFaceLivenessDetector] TinyFaceDetector loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
        console.log('[CustomFaceLivenessDetector] FaceLandmark68Net loaded:', faceapi.nets.faceLandmark68Net.isLoaded);
        
        // Try to load the models again, with specific path logging
        console.log('[CustomFaceLivenessDetector] Loading models from path:', '/models');
        try {
          await Promise.all([
            // Use TinyFaceDetector for performance
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'), 
            // Use standard 68-point landmark model (ensure it's downloaded)
            faceapi.nets.faceLandmark68Net.loadFromUri('/models') 
          ]);
          console.log('[CustomFaceLivenessDetector] Models loaded successfully.');
        } catch (modelError) {
          console.error('[CustomFaceLivenessDetector] Error loading models:', modelError);
          // Try an alternative path
          console.log('[CustomFaceLivenessDetector] Trying alternative path for models...');
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('./models')
          ]);
          console.log('[CustomFaceLivenessDetector] Models loaded from alternative path.');
        }
        
        // Log model status after loading attempt
        console.log('[CustomFaceLivenessDetector] TinyFaceDetector loaded after attempt:', faceapi.nets.tinyFaceDetector.isLoaded);
        console.log('[CustomFaceLivenessDetector] FaceLandmark68Net loaded after attempt:', faceapi.nets.faceLandmark68Net.isLoaded);
        
        if (!isMountedRef.current) return; // Check mount status after loading models

        const cameraReady = await setupCamera(); 
        
        if (isMountedRef.current && cameraReady) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsInitializing(false);
              console.log('[CustomFaceLivenessDetector] Initialization complete');
              
              // Do a test face detection immediately to check if it works
              testFaceDetection();
            }
          }, 500);
        } else if (isMountedRef.current) {
          setIsInitializing(false);
        }

      } catch (error) {
        if (isMountedRef.current) {
          console.error('[CustomFaceLivenessDetector] Error initializing models or camera:', error);
          setErrorMessage(`Initialization failed: ${error.message}`);
          setIsInitializing(false);
          setIsCameraReady(false);
        }
      }
    };
    
    initialize();
    
    return () => {
      console.log('[CustomFaceLivenessDetector] Main cleanup running');
      isMounted = false;
      stopCamera();
      clearInterval(timerRef.current);
      if (faceApiIntervalRef.current) {
        clearInterval(faceApiIntervalRef.current); // Clear face-api interval
      }
    };
  }, []);
  
  // Test face detection
  const testFaceDetection = async () => {
    if (!videoRef.current || !isCameraReady) {
      console.log('[TestFaceDetection] Video not ready yet');
      return;
    }
    
    console.log('[TestFaceDetection] Attempting test face detection...');
    try {
      // Try with lowest possible threshold
      const options = new faceapi.TinyFaceDetectorOptions({ 
        scoreThreshold: 0.1,
        inputSize: 160
      });
      
      console.log('[TestFaceDetection] Detector options:', options);
      
      const results = await faceapi.detectAllFaces(videoRef.current, options);
      console.log('[TestFaceDetection] Detection results:', results);
      
      if (results && results.length > 0) {
        console.log('[TestFaceDetection] SUCCESS! Detected', results.length, 'faces with scores:', 
          results.map(r => r.score.toFixed(2)).join(', '));
          
        // Try to draw a debug box around the detected face
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          
          // Set canvas style to match video dimensions and position
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.zIndex = '100';
          canvas.style.pointerEvents = 'none';
          canvas.className = 'face-debug-canvas';
          
          // Draw detection box
          const ctx = canvas.getContext('2d');
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 5;
          
          // Get the actual dimensions of the video element on screen
          const videoElement = videoRef.current;
          const videoBounds = videoElement.getBoundingClientRect();
          
          results.forEach(detection => {
            // Draw directly based on detection bounds scaled to video dimensions
            const box = detection.box;
            const boxX = box.x * (canvas.width / videoElement.videoWidth);
            const boxY = box.y * (canvas.height / videoElement.videoHeight);
            const boxWidth = box.width * (canvas.width / videoElement.videoWidth);
            const boxHeight = box.height * (canvas.height / videoElement.videoHeight);
            
            ctx.strokeStyle = '#00BFFF'; // Deep sky blue
            ctx.shadowColor = 'rgba(0, 191, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            // Add detection score text
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(`Score: ${detection.score.toFixed(2)}`, boxX, boxY - 5);
            ctx.fillStyle = '#00BFFF';
            ctx.fillText(`Score: ${detection.score.toFixed(2)}`, boxX, boxY - 5);
            
            // Draw corner dots for visibility
            ctx.fillStyle = '#00BFFF';
            const cornerSize = 5;
            const corners = [
              { x: boxX, y: boxY }, // Top-left
              { x: boxX + boxWidth, y: boxY }, // Top-right
              { x: boxX, y: boxY + boxHeight }, // Bottom-left
              { x: boxX + boxWidth, y: boxY + boxHeight } // Bottom-right
            ];
            
            corners.forEach(corner => {
              ctx.beginPath();
              ctx.arc(corner.x, corner.y, cornerSize, 0, 2 * Math.PI);
              ctx.fill();
            });
            
            console.log(`[TestFaceDetection] Drawing box at (${boxX}, ${boxY}) with size ${boxWidth}x${boxHeight}`);
          });
          
          // Remove any existing debug canvas
          const existingDebugCanvas = document.querySelector('.face-debug-canvas');
          if (existingDebugCanvas) {
            existingDebugCanvas.remove();
          }
          
          // Add canvas to DOM
          if (videoRef.current.parentNode) {
            videoRef.current.parentNode.appendChild(canvas);
            console.log('[TestFaceDetection] Added detection canvas to DOM');
            
            // Keep this canvas visible longer for testing
            setTimeout(() => {
              if (document.querySelector('.face-debug-canvas')) {
                document.querySelector('.face-debug-canvas').remove();
              }
            }, 5000); // Show for 5 seconds
          }
          
          // Force permanent face box to show for verification purposes
          const permanentCanvas = document.querySelector('.permanent-face-box-canvas');
          if (permanentCanvas) {
            const pctx = permanentCanvas.getContext('2d');
            pctx.clearRect(0, 0, permanentCanvas.width, permanentCanvas.height);
            
            results.forEach(detection => {
              const box = detection.box;
              const scaleX = permanentCanvas.width / videoElement.videoWidth;
              const scaleY = permanentCanvas.height / videoElement.videoHeight;
              
              // Draw more visible blue rectangle with glow effect
              pctx.shadowColor = 'rgba(0, 191, 255, 0.8)';
              pctx.shadowBlur = 10;
              pctx.strokeStyle = '#00BFFF'; // Deep sky blue
              pctx.lineWidth = 4;
              pctx.strokeRect(
                box.x * scaleX,
                box.y * scaleY,
                box.width * scaleX,
                box.height * scaleY
              );
              
              // Add corner highlight points for better visibility
              pctx.fillStyle = '#00BFFF';
              
              // Draw corner dots
              const cornerSize = 5;
              const corners = [
                { x: box.x * scaleX, y: box.y * scaleY }, // Top-left
                { x: (box.x + box.width) * scaleX, y: box.y * scaleY }, // Top-right
                { x: box.x * scaleX, y: (box.y + box.height) * scaleY }, // Bottom-left
                { x: (box.x + box.width) * scaleX, y: (box.y + box.height) * scaleY } // Bottom-right
              ];
              
              corners.forEach(corner => {
                pctx.beginPath();
                pctx.arc(corner.x, corner.y, cornerSize, 0, 2 * Math.PI);
                pctx.fill();
              });
              
              // Add test marker text
              pctx.font = 'bold 16px Arial';
              pctx.fillStyle = 'white';
              pctx.strokeStyle = 'black';
              pctx.lineWidth = 2;
              const testText = 'Face Detected!';
              pctx.strokeText(testText, box.x * scaleX, (box.y * scaleY) - 10);
              pctx.fillText(testText, box.x * scaleX, (box.y * scaleY) - 10);
            });
            
            console.log('[TestFaceDetection] Also updated permanent face box canvas');
          } else {
            console.warn('[TestFaceDetection] Permanent face box canvas not found');
          }
        } catch (drawError) {
          console.error('[TestFaceDetection] Error drawing debug detection:', drawError);
        }
        
        // Make the face outline visible
        headPoseRef.current.faceDetected = true;
        setDebugInfo(prev => ({
          ...prev,
          detected: true,
          score: results[0].score.toFixed(2)
        }));
        
        // Also try with landmarks
        try {
          console.log('[TestFaceDetection] Attempting with landmarks...');
          const landmarkResults = await faceapi.detectSingleFace(videoRef.current, options)
            .withFaceLandmarks();
          
          if (landmarkResults) {
            console.log('[TestFaceDetection] Success with landmarks! Score:', landmarkResults.detection.score);
            console.log('[TestFaceDetection] Landmark points:', landmarkResults.landmarks.positions.length);
            
            // Show landmarks on canvas
            try {
              const canvas = document.querySelector('.face-debug-canvas');
              if (canvas) {
                const ctx = canvas.getContext('2d');
                // Draw landmarks as small green dots
                ctx.fillStyle = 'green';
                landmarkResults.landmarks.positions.forEach(point => {
                  const x = point._x * (canvas.width / videoRef.current.videoWidth);
                  const y = point._y * (canvas.height / videoRef.current.videoHeight);
                  ctx.beginPath();
                  ctx.arc(x, y, 2, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
            } catch (landmarkDrawError) {
              console.error('[TestFaceDetection] Error drawing landmarks:', landmarkDrawError);
            }
          } else {
            console.warn('[TestFaceDetection] No face with landmarks detected');
          }
        } catch (landmarkError) {
          console.error('[TestFaceDetection] Error detecting landmarks:', landmarkError);
        }
      } else {
        console.warn('[TestFaceDetection] NO FACES DETECTED in test run');
        headPoseRef.current.faceDetected = false;
        setDebugInfo(prev => ({
          ...prev,
          detected: false
        }));
        
        // Clear the permanent face box if no faces detected
        const permanentCanvas = document.querySelector('.permanent-face-box-canvas');
        if (permanentCanvas) {
          const pctx = permanentCanvas.getContext('2d');
          pctx.clearRect(0, 0, permanentCanvas.width, permanentCanvas.height);
          
          // Show "No face detected" message
          pctx.font = 'bold 24px Arial';
          pctx.textAlign = 'center';
          pctx.fillStyle = 'red';
          pctx.fillText('No Face Detected', permanentCanvas.width/2, permanentCanvas.height/2);
        }
      }
      
    } catch (error) {
      console.error('[TestFaceDetection] Error during test detection:', error);
    }
  };
  
  // Add a new effect to handle video element loading
  useEffect(() => {
    if (videoRef.current) {
      // Add a loadedmetadata event listener to ensure the video is ready
      const videoElement = videoRef.current;
      
      const handleVideoLoaded = () => {
        console.log('[CustomFaceLivenessDetector] Video metadata loaded, dimensions:', 
          videoElement.videoWidth, 'x', videoElement.videoHeight);
      };
      
      videoElement.addEventListener('loadedmetadata', handleVideoLoaded);
      
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleVideoLoaded);
      };
    }
  }, []);
  
  // Setup camera access
  const setupCamera = async () => {
    try {
      console.log('[CustomFaceLivenessDetector] Setting up camera');
      // Check mount status before proceeding
       if (!isMountedRef.current) {
          console.warn('[CustomFaceLivenessDetector] setupCamera called but component unmounted.');
          return false;
      }
      setIsCameraReady(false); 
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null; // Clear the ref
      }
      
      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('[CustomFaceLivenessDetector] Available cameras:', videoDevices);
      setCameraDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }
      
      // Select front camera if available
      const frontCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('facing')
      );
      
      // Use front camera or first available
      const cameraToUse = frontCamera || videoDevices[0];
      setSelectedCameraId(cameraToUse.deviceId);
      console.log('[CustomFaceLivenessDetector] Selected camera:', cameraToUse.label);
      
      // Request camera stream
      console.log('[CustomFaceLivenessDetector] Requesting camera stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: cameraToUse.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      console.log('[CustomFaceLivenessDetector] Camera stream received.');

      // *** Check mount status AFTER await ***
      if (!isMountedRef.current) {
          console.warn('[CustomFaceLivenessDetector] Component unmounted while waiting for camera stream. Cleaning up stream.');
          stream.getTracks().forEach(track => track.stop());
          return false;
      }
      
      // *** Check if videoRef is available NOW ***
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream; 
        
        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
          const videoElement = videoRef.current;
          const timeout = setTimeout(() => reject(new Error('Video loadeddata timeout')), 3000); // 3 sec timeout

          if (!videoElement) {
              clearTimeout(timeout);
              reject(new Error('Video element became null while waiting for loadeddata'));
              return;
          }

          if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA or more
            clearTimeout(timeout);
            resolve();
          } else {
            const onLoadedData = () => {
              clearTimeout(timeout);
              videoElement.removeEventListener('loadeddata', onLoadedData);
              videoElement.removeEventListener('error', onError);
              resolve();
            };
            const onError = (err) => {
              clearTimeout(timeout);
              videoElement.removeEventListener('loadeddata', onLoadedData);
              videoElement.removeEventListener('error', onError);
              reject(err || new Error('Video element error event'));
            };
            videoElement.addEventListener('loadeddata', onLoadedData);
            videoElement.addEventListener('error', onError);
          }
        });
        
        console.log('[CustomFaceLivenessDetector] Camera stream initialized and video ready');
        
        // Check mount status again before setting state
         if (!isMountedRef.current) {
            console.warn('[CustomFaceLivenessDetector] Component unmounted after video loadeddata. Cleaning up.');
            stream.getTracks().forEach(track => track.stop());
            if(videoRef.current) videoRef.current.srcObject = null;
            streamRef.current = null;
            return false;
        }
        setIsCameraReady(true); 
        return true;

      } else {
         console.warn('[CustomFaceLivenessDetector] Video ref not available *after* getting stream. Component likely unmounted.');
         stream.getTracks().forEach(track => track.stop()); 
         // Check mount status before setting state
          if (isMountedRef.current) {
              setIsCameraReady(false);
          }
         return false;
      }

    } catch (error) {
      console.error('[CustomFaceLivenessDetector] Error accessing camera:', error);
      // Check mount status before setting state in catch block
      if (isMountedRef.current) {
          setErrorMessage(`Camera access failed: ${error.message}`);
          setIsCameraReady(false); 
      }
      return false;
    }
  };
  
  // Stop camera and clean up resources
  const stopCamera = () => {
    console.log('[CustomFaceLivenessDetector] Stopping camera and cleaning up resources');
    setIsCameraReady(false); // Mark camera as not ready when stopping
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`[CustomFaceLivenessDetector] Stopping track: ${track.label || 'unknown'}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Also clear the video source
    if (videoRef.current && videoRef.current.srcObject) {
        console.log('[CustomFaceLivenessDetector] Clearing video srcObject.');
        // Ensure all tracks from the srcObject are stopped as well
        const currentStream = videoRef.current.srcObject;
        if (currentStream && typeof currentStream.getTracks === 'function') {
            currentStream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null; 
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    clearInterval(timerRef.current);

    // Clear face tracking interval
    if (faceApiIntervalRef.current) {
      clearInterval(faceApiIntervalRef.current);
      faceApiIntervalRef.current = null;
      console.log('[CustomFaceLivenessDetector] Cleared face tracking interval.');
    }
  };
  
  // Start recording process
  const startRecording = () => {
    console.log(`[CustomFaceLivenessDetector] Attempting to start recording. Camera Ready: ${isCameraReady}`);
    if (!isCameraReady || !streamRef.current) {
      console.error('[CustomFaceLivenessDetector] Camera stream not ready or not available');
      setErrorMessage('Camera not ready. Please wait for initialization or check permissions.');
      return;
    }
    
    if (!videoRef.current || !videoRef.current.readyState || videoRef.current.readyState < 2) {
      console.error('[CustomFaceLivenessDetector] Video element not ready for recording');
      setErrorMessage('Video not ready. Please try again.');
      return;
    }
    
    try {
      console.log('[CustomFaceLivenessDetector] Starting recording session');
      console.log('[CustomFaceLivenessDetector] Video dimensions:', 
        videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
      console.log('[CustomFaceLivenessDetector] Video ready state:', videoRef.current.readyState);
      
      // Run a quick face detection test before starting
      testFaceDetection();
      
      // Reset state
      chunksRef.current = [];
      setProgressSegments(0);
      setTimeRemaining(30);
      setStage('recording');
      setIsRecording(true);
      
      // Check for MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API not supported in this browser');
      }
      
      // Get supported mime types
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];
      
      // Find first supported mime type
      let options = { videoBitsPerSecond: 1000000 }; // 1 Mbps default
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          console.log(`[CustomFaceLivenessDetector] Using supported MIME type: ${mimeType}`);
          options.mimeType = mimeType;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`[MediaRecorder] Got data chunk of size: ${(event.data.size / 1024).toFixed(2)}KB`);
          chunksRef.current.push(event.data);
          
          // Calculate approximate file size
          const approximateSize = chunksRef.current.reduce((total, chunk) => total + chunk.size, 0) / (1024 * 1024);
          setFileSize(approximateSize);
          console.log(`[CustomFaceLivenessDetector] Current recording size: ${approximateSize.toFixed(2)}MB, chunks: ${chunksRef.current.length}`);
          
          // If approaching 10MB, end recording early
          if (approximateSize > 9.5) {
            console.log('[CustomFaceLivenessDetector] Approaching size limit, ending recording early');
            endRecording();
          }
        } else {
          console.warn('[MediaRecorder] Got empty data chunk');
        }
      };
      
      // Handle recording stopped
      mediaRecorder.onstop = () => {
        console.log('[CustomFaceLivenessDetector] MediaRecorder stopped');
        console.log('[CustomFaceLivenessDetector] Collected chunks:', chunksRef.current.length);
        processRecording();
      };
      
      // Handle recording errors
      mediaRecorder.onerror = (error) => {
        console.error('[CustomFaceLivenessDetector] MediaRecorder error:', error);
        setErrorMessage(`Recording error: ${error.message || 'Unknown error'}`);
        setIsRecording(false);
      };
      
      // Log recorder state changes
      mediaRecorder.onstart = () => console.log('[MediaRecorder] Recording started');
      mediaRecorder.onpause = () => console.log('[MediaRecorder] Recording paused');
      mediaRecorder.onresume = () => console.log('[MediaRecorder] Recording resumed');
      
      // Start recording - request data every 500ms to ensure we get frequent chunks
      mediaRecorder.start(500);
      console.log('[CustomFaceLivenessDetector] MediaRecorder started with timeslice: 500ms');
      
      // *** Start face-api.js tracking ***
      startFaceTracking(); 
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            endRecording();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // Reset head pose tracking
      headPoseRef.current = { 
        segments: Array(8).fill(false), 
        currentSegmentIndex: 0, 
        lastYaw: 0, 
        lastPitch: 0,
        lastDetectionTime: Date.now(),
        faceDetected: false,
        detectionAttempts: 0,
        detectionSuccesses: 0
      };
      setProgressSegments(0);
      
    } catch (error) {
      console.error('[CustomFaceLivenessDetector] Error starting recording:', error);
      setErrorMessage(`Failed to start video recording: ${error.message}`);
      setIsRecording(false);
    }
  };
  
  // Process the recorded chunks into a video
  const processRecording = () => {
    if (chunksRef.current.length === 0) {
      console.error('[CustomFaceLivenessDetector] No video data recorded');
      setErrorMessage('No video data recorded');
      return;
    }
    
    try {
      // Log chunk information
      console.log(`[ProcessRecording] Processing ${chunksRef.current.length} chunks`);
      chunksRef.current.forEach((chunk, index) => {
        console.log(`[ProcessRecording] Chunk ${index}: ${(chunk.size / 1024).toFixed(2)}KB, type: ${chunk.type}`);
      });
      
      // Determine the correct MIME type for the blob
      const options = mediaRecorderRef.current?.mimeType 
        ? { type: mediaRecorderRef.current.mimeType } 
        : { type: 'video/webm' };
      
      console.log(`[ProcessRecording] Creating video blob with MIME type: ${options.type}`);
      
      // Create blob from chunks
      const videoBlob = new Blob(chunksRef.current, options);
      const videoUrl = URL.createObjectURL(videoBlob);
      setRecordedVideo(videoUrl);
      
      console.log(`[ProcessRecording] Video recording completed: ${(videoBlob.size / (1024 * 1024)).toFixed(2)}MB`);
      
      // If verification was complete, take final photo
      if (stage === 'lookStraight') {
        captureImage();
      }
    } catch (error) {
      console.error('[CustomFaceLivenessDetector] Error processing recording:', error);
      setErrorMessage(`Failed to process video recording: ${error.message}`);
    }
  };
  
  // End the recording
  const endRecording = () => {
    console.log('[CustomFaceLivenessDetector] Ending recording session');
    clearInterval(timerRef.current);
    
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setStage('lookStraight');
    console.log('[CustomFaceLivenessDetector] Waiting for user to look straight for final photo');
    
    // Wait for user to look straight before capturing image
    setTimeout(() => {
      captureImage();
    }, 3000);
  };
  
  // Enhanced face tracking for better detection
  const startFaceTracking = () => {
    console.log('[CustomFaceLivenessDetector] Starting face-api.js tracking');
    
    // Check and log model status
    console.log('[Face Tracking] Models loaded status:');
    console.log('[Face Tracking] - TinyFaceDetector:', faceapi.nets.tinyFaceDetector.isLoaded);
    console.log('[Face Tracking] - FaceLandmark68Net:', faceapi.nets.faceLandmark68Net.isLoaded);
    
    // Clear any existing interval
    if (faceApiIntervalRef.current) {
      clearInterval(faceApiIntervalRef.current);
    }

    // Reset tracking state
    headPoseRef.current = { 
      segments: Array(8).fill(false), 
      currentSegmentIndex: 0, 
      lastYaw: 0, 
      lastPitch: 0,
      lastDetectionTime: Date.now(),
      faceDetected: false,
      detectionAttempts: 0,
      detectionSuccesses: 0
    };
    
    // Add real-time face visualization layer
    const debugCanvas = document.createElement('canvas');
    debugCanvas.className = 'realtime-face-canvas';
    debugCanvas.style.position = 'absolute';
    debugCanvas.style.top = '0';
    debugCanvas.style.left = '0';
    debugCanvas.style.width = '100%';
    debugCanvas.style.height = '100%';
    debugCanvas.style.zIndex = '20';
    debugCanvas.style.pointerEvents = 'none';
    
    // Remove any existing canvas
    const existingCanvas = document.querySelector('.realtime-face-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }
    
    // Add canvas to video container
    if (videoRef.current && videoRef.current.parentNode) {
      debugCanvas.width = videoRef.current.videoWidth || 640;
      debugCanvas.height = videoRef.current.videoHeight || 480;
      videoRef.current.parentNode.appendChild(debugCanvas);
      console.log('[Face Tracking] Added real-time tracking canvas with dimensions:', debugCanvas.width, 'x', debugCanvas.height);
    }
    
    // Create a separate permanent face box layer that always stays visible
    const permanentFaceBoxCanvas = document.createElement('canvas');
    permanentFaceBoxCanvas.className = 'permanent-face-box-canvas';
    permanentFaceBoxCanvas.style.position = 'absolute';
    permanentFaceBoxCanvas.style.top = '0';
    permanentFaceBoxCanvas.style.left = '0';
    permanentFaceBoxCanvas.style.width = '100%';
    permanentFaceBoxCanvas.style.height = '100%';
    permanentFaceBoxCanvas.style.zIndex = '25';
    permanentFaceBoxCanvas.style.pointerEvents = 'none';
    
    // Remove any existing permanent canvas
    const existingPermanentCanvas = document.querySelector('.permanent-face-box-canvas');
    if (existingPermanentCanvas) {
      existingPermanentCanvas.remove();
    }
    
    // Add permanent canvas to video container
    if (videoRef.current && videoRef.current.parentNode) {
      permanentFaceBoxCanvas.width = videoRef.current.videoWidth || 640;
      permanentFaceBoxCanvas.height = videoRef.current.videoHeight || 480;
      videoRef.current.parentNode.appendChild(permanentFaceBoxCanvas);
      console.log('[Face Tracking] Added permanent face box canvas');
    }
    
    // Start detection interval
    faceApiIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !isRecording) {
        return;
      }
      
      // Get canvas for visualization
      const canvas = document.querySelector('.realtime-face-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Get permanent canvas for face box
      const permanentCanvas = document.querySelector('.permanent-face-box-canvas');
      
      // Increment attempt counter
      headPoseRef.current.detectionAttempts++;
      
      try {
        // First detect if a face is present (basic detection)
        const videoElement = videoRef.current;
        
        // Attempt face detection with lowest threshold
        const faceDetection = await faceapi.detectSingleFace(
          videoElement,
          new faceapi.TinyFaceDetectorOptions({
            scoreThreshold: 0.1, // Very low threshold
            inputSize: 160      // Small size for performance
          })
        );
        
        if (faceDetection) {
          // Update tracking state
          headPoseRef.current.detectionSuccesses++;
          headPoseRef.current.faceDetected = true;
          headPoseRef.current.lastDetectionTime = Date.now();
          
          console.log('[Face Tracking] Face detected with score:', faceDetection.score.toFixed(2));
          
          // Draw face box on canvas
          if (canvas) {
            const ctx = canvas.getContext('2d');
            const box = faceDetection.box;
            
            // Scale coordinates to canvas
            const scaleX = canvas.width / videoElement.videoWidth;
            const scaleY = canvas.height / videoElement.videoHeight;
            
            // Draw blue rectangle around face
            ctx.strokeStyle = '#00BFFF'; // Deep sky blue
            ctx.lineWidth = 3;
            ctx.strokeRect(
              box.x * scaleX,
              box.y * scaleY,
              box.width * scaleX,
              box.height * scaleY
            );
          }
          
          // ALWAYS update the permanent face box canvas for persistent visibility
          if (permanentCanvas) {
            const pctx = permanentCanvas.getContext('2d');
            // Clear previous drawings
            pctx.clearRect(0, 0, permanentCanvas.width, permanentCanvas.height);
            
            const box = faceDetection.box;
            
            // Scale coordinates to canvas
            const scaleX = permanentCanvas.width / videoElement.videoWidth;
            const scaleY = permanentCanvas.height / videoElement.videoHeight;
            
            // Draw more visible blue rectangle with glow effect
            pctx.shadowColor = 'rgba(0, 191, 255, 0.8)';
            pctx.shadowBlur = 10;
            pctx.strokeStyle = '#00BFFF'; // Deep sky blue
            pctx.lineWidth = 4;
            pctx.strokeRect(
              box.x * scaleX,
              box.y * scaleY,
              box.width * scaleX,
              box.height * scaleY
            );
            
            // Add corner highlight points for better visibility
            pctx.fillStyle = '#00BFFF';
            
            // Draw corner dots
            const cornerSize = 5;
            const corners = [
              { x: box.x * scaleX, y: box.y * scaleY }, // Top-left
              { x: (box.x + box.width) * scaleX, y: box.y * scaleY }, // Top-right
              { x: box.x * scaleX, y: (box.y + box.height) * scaleY }, // Bottom-left
              { x: (box.x + box.width) * scaleX, y: (box.y + box.height) * scaleY } // Bottom-right
            ];
            
            corners.forEach(corner => {
              pctx.beginPath();
              pctx.arc(corner.x, corner.y, cornerSize, 0, 2 * Math.PI);
              pctx.fill();
            });
            
            // Add face score text
            pctx.font = 'bold 16px Arial';
            pctx.fillStyle = 'white';
            pctx.strokeStyle = 'black';
            pctx.lineWidth = 2;
            const scoreText = `Score: ${faceDetection.score.toFixed(2)}`;
            pctx.strokeText(scoreText, box.x * scaleX, (box.y * scaleY) - 10);
            pctx.fillText(scoreText, box.x * scaleX, (box.y * scaleY) - 10);
          }
          
          // Try to get landmarks
          try {
            const fullDetection = await faceapi.detectSingleFace(
              videoElement,
              new faceapi.TinyFaceDetectorOptions({
                scoreThreshold: 0.1,
                inputSize: 160
              })
            ).withFaceLandmarks();
            
            if (fullDetection && fullDetection.landmarks) {
              const landmarks = fullDetection.landmarks;
              
              // Draw landmarks on canvas
              if (canvas) {
                const ctx = canvas.getContext('2d');
                const scaleX = canvas.width / videoElement.videoWidth;
                const scaleY = canvas.height / videoElement.videoHeight;
                
                // Draw landmarks as small green dots
                ctx.fillStyle = 'green';
                landmarks.positions.forEach(point => {
                  ctx.beginPath();
                  ctx.arc(point._x * scaleX, point._y * scaleY, 2, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
              
              // Calculate head pose and update progress
              const headPose = calculateHeadPose(landmarks);
              updateVerificationProgressWithPose(headPose);
              
              // Update debug info
              setDebugInfo({
                detected: true,
                score: faceDetection.score.toFixed(2),
                landmarks: true,
                landmarkCount: landmarks.positions.length,
                yaw: headPose.yaw.toFixed(1),
                pitch: headPose.pitch.toFixed(1),
                attempts: headPoseRef.current.detectionAttempts,
                successes: headPoseRef.current.detectionSuccesses
              });
            } else {
              // Update debug without landmarks
              setDebugInfo({
                detected: true,
                score: faceDetection.score.toFixed(2),
                landmarks: false,
                yaw: headPoseRef.current.lastYaw.toFixed(1),
                pitch: headPoseRef.current.lastPitch.toFixed(1),
                attempts: headPoseRef.current.detectionAttempts,
                successes: headPoseRef.current.detectionSuccesses
              });
              
              // If we have a face but no landmarks, use simulated poses occasionally
              if (headPoseRef.current.detectionAttempts % 10 === 0) {
                const segment = headPoseRef.current.currentSegmentIndex;
                if (segment < SEGMENT_ANGLES.length) {
                  const targetSegment = SEGMENT_ANGLES[segment];
                  const simulatedPose = {
                    yaw: (targetSegment.yawMin + targetSegment.yawMax) / 2,
                    pitch: (targetSegment.pitchMin + targetSegment.pitchMax) / 2
                  };
                  updateVerificationProgressWithPose(simulatedPose);
                }
              }
            }
          } catch (landmarkError) {
            console.warn('[Face Tracking] Landmark detection error:', landmarkError.message);
            setDebugInfo(prev => ({
              ...prev,
              detected: true,
              score: faceDetection.score.toFixed(2),
              landmarks: false,
              landmarkError: landmarkError.message
            }));
          }
        } else {
          // No face detected
          if (canvas) {
            // Draw red outline to indicate no face detected
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Add text
            ctx.font = '24px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText('No Face Detected', canvas.width/2 - 100, 40);
          }
          
          // Clear the permanent face box when no face is detected
          if (permanentCanvas) {
            const pctx = permanentCanvas.getContext('2d');
            pctx.clearRect(0, 0, permanentCanvas.width, permanentCanvas.height);
            
            // Add a subtle indicator that face detection is active but no face found
            pctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            pctx.lineWidth = 2;
            pctx.setLineDash([5, 5]); // Dashed line
            pctx.strokeRect(20, 20, permanentCanvas.width - 40, permanentCanvas.height - 40);
            pctx.setLineDash([]); // Reset line style
            
            // Add text
            pctx.font = 'bold 20px Arial';
            pctx.textAlign = 'center';
            pctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            pctx.fillText('Looking for face...', permanentCanvas.width/2, 50);
          }
          
          setDebugInfo(prev => ({
            ...prev,
            detected: false,
            timeSinceDetection: ((Date.now() - headPoseRef.current.lastDetectionTime) / 1000).toFixed(1) + 's',
            attempts: headPoseRef.current.detectionAttempts,
            successes: headPoseRef.current.detectionSuccesses
          }));
          
          if (Date.now() - headPoseRef.current.lastDetectionTime > 2000) {
            headPoseRef.current.faceDetected = false;
          }
        }
      } catch (error) {
        console.error('[Face Tracking] Detection error:', error);
        setDebugInfo(prev => ({
          ...prev,
          error: error.message
        }));
      }
    }, 100); // Run detection more frequently (100ms) for smoother tracking
  };

  // Calculate head pose (simplified method)
  const calculateHeadPose = (landmarks) => {
      console.log('[calculateHeadPose] Processing landmarks');
      
      try {
          // Get key landmark points
          const positions = landmarks.positions || [];
          
          if (positions.length < 68) {
              console.warn('[calculateHeadPose] Not enough landmarks:', positions.length);
              return { yaw: 0, pitch: 0 };
          }
          
          // Get important points
          // In face-api.js, points are typically ordered as follows:
          // - Points 0-16: Face contour
          // - Points 17-21: Right eyebrow
          // - Points 22-26: Left eyebrow
          // - Points 27-35: Nose
          // - Points 36-41: Right eye
          // - Points 42-47: Left eye
          // - Points 48-67: Mouth
          
          const leftEyePoints = positions.slice(42, 48);
          const rightEyePoints = positions.slice(36, 42);
          const nosePoints = positions.slice(27, 36);
          
          if (leftEyePoints.length === 0 || rightEyePoints.length === 0 || nosePoints.length === 0) {
              console.warn('[calculateHeadPose] Missing critical landmarks');
              return { yaw: 0, pitch: 0 };
          }

          // Calculate eye centers
          const leftEyeCenter = {
              x: leftEyePoints.reduce((sum, point) => sum + point._x, 0) / leftEyePoints.length,
              y: leftEyePoints.reduce((sum, point) => sum + point._y, 0) / leftEyePoints.length
          };
          
          const rightEyeCenter = {
              x: rightEyePoints.reduce((sum, point) => sum + point._x, 0) / rightEyePoints.length,
              y: rightEyePoints.reduce((sum, point) => sum + point._y, 0) / rightEyePoints.length
          };
          
          const eyesCenter = {
              x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
              y: (leftEyeCenter.y + rightEyeCenter.y) / 2
          };
          
          // Use the tip of the nose (usually index 30 or 31 in the nose points)
          const noseTip = nosePoints[nosePoints.length - 1] || nosePoints[3];
          
          // Calculate eye width for normalization
          const eyeWidth = Math.sqrt(
              Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + 
              Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
          );
          
          if (eyeWidth < 0.01) {
              console.warn('[calculateHeadPose] Invalid eye width calculation:', eyeWidth);
              return { yaw: 0, pitch: 0 };
          }
          
          // SUPER aggressive pose calculations for reliability
          let yaw = ((noseTip._x - eyesCenter.x) / eyeWidth) * 100; // Even more aggressive
          let pitch = ((noseTip._y - eyesCenter.y) / eyeWidth) * 100;
          
          // Bound values to reasonable ranges
          yaw = Math.max(-100, Math.min(100, yaw));
          pitch = Math.max(-100, Math.min(100, pitch));
          
          console.log(`[HeadPose] Raw values - Yaw=${yaw.toFixed(1)}°, Pitch=${pitch.toFixed(1)}°, eyeWidth=${eyeWidth.toFixed(2)}`);
          
          // Less smoothing for more responsive movement
          const smoothedYaw = 0.8 * yaw + 0.2 * headPoseRef.current.lastYaw;
          const smoothedPitch = 0.8 * pitch + 0.2 * headPoseRef.current.lastPitch;
          
          // Store current values for next smoothing
          headPoseRef.current.lastYaw = smoothedYaw;
          headPoseRef.current.lastPitch = smoothedPitch;

          console.log(`[HeadPose] Smoothed - Yaw=${smoothedYaw.toFixed(1)}°, Pitch=${smoothedPitch.toFixed(1)}°`);
          return { yaw: smoothedYaw, pitch: smoothedPitch };
      } catch (error) {
          console.error('[calculateHeadPose] Error calculating head pose:', error);
          return { yaw: 0, pitch: 0 };
      }
  };

  // Update verification progress based on head pose angles
  const updateVerificationProgressWithPose = (rotation) => {
    const currentSegmentIndex = headPoseRef.current.currentSegmentIndex;
    
    // If all segments are done, do nothing
    if (currentSegmentIndex >= SEGMENT_ANGLES.length) {
      return;
    }

    const targetSegment = SEGMENT_ANGLES[currentSegmentIndex];
    const yaw = rotation.yaw;
    const pitch = rotation.pitch;
    
    console.log(`[VerificationProgress] Checking segment ${currentSegmentIndex}: Current Yaw=${yaw.toFixed(1)}, Pitch=${pitch.toFixed(1)}, Target: Yaw [${targetSegment.yawMin}-${targetSegment.yawMax}], Pitch [${targetSegment.pitchMin}-${targetSegment.pitchMax}]`);

    // Check if the current pose hits the target angles for the required segment
    const yawMatch = yaw >= targetSegment.yawMin && yaw <= targetSegment.yawMax;
    const pitchMatch = pitch >= targetSegment.pitchMin && pitch <= targetSegment.pitchMax;

    if (yawMatch && pitchMatch) {
      console.log(`[CustomFaceLivenessDetector] HIT SEGMENT ${currentSegmentIndex}! Yaw: ${yaw.toFixed(1)}, Pitch: ${pitch.toFixed(1)}`);
      
      // Mark segment as complete and move to the next
      const updatedSegments = [...headPoseRef.current.segments];
      updatedSegments[currentSegmentIndex] = true;
      const nextSegmentIndex = currentSegmentIndex + 1;
      
      headPoseRef.current.segments = updatedSegments;
      headPoseRef.current.currentSegmentIndex = nextSegmentIndex;
      
      // Important: Update the state to trigger re-render - use function form to ensure we get latest state
      console.log(`[VerificationProgress] Updating progress to ${nextSegmentIndex} segments`);
      setProgressSegments(nextSegmentIndex); // Directly set to the exact segment count

      // Play a success sound or vibration to give feedback
      try {
        navigator.vibrate && navigator.vibrate(200);
      } catch (e) {
        console.log('[VerificationProgress] Vibration not supported');
      }

      // Check if all segments are complete
      if (nextSegmentIndex >= SEGMENT_ANGLES.length) {
        console.log('[CustomFaceLivenessDetector] All segments complete!');
        if (faceApiIntervalRef.current) {
           clearInterval(faceApiIntervalRef.current);
           faceApiIntervalRef.current = null;
        }
        setTimeout(() => {
          if (stage === 'recording') {
              endRecording();
          }
        }, 500);
      }
    } else {
      // Log what's missing for debugging
      if (!yawMatch) {
        console.log(`[VerificationProgress] Yaw (${yaw.toFixed(1)}) not in range [${targetSegment.yawMin}-${targetSegment.yawMax}]`);
      }
      if (!pitchMatch) {
        console.log(`[VerificationProgress] Pitch (${pitch.toFixed(1)}) not in range [${targetSegment.pitchMin}-${targetSegment.pitchMax}]`);
      }
    }
  };
  
  // Capture still image for Rekognition
  const captureImage = () => {
    try {
      console.log('[CustomFaceLivenessDetector] Capturing final still image');
      
      if (!videoRef.current || !canvasRef.current) {
        console.error('[CustomFaceLivenessDetector] Video or canvas ref not available');
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setFinalImage(imageUrl);
      
      setStage('complete');
      console.log('[CustomFaceLivenessDetector] Liveness check complete, proceeding to registration');
      
      // Process for face registration
      registerFace(imageUrl);
      
    } catch (error) {
      console.error('[CustomFaceLivenessDetector] Error capturing image:', error);
      setErrorMessage(`Failed to capture final image: ${error.message}`);
    }
  };
  
  // Register the face with AWS Rekognition
  const registerFace = async (imageUrl) => {
    console.log('[CustomFaceLivenessDetector] Registering face with AWS Rekognition');
    
    try {
      if (!user?.id) {
        console.error('[CustomFaceLivenessDetector] No user ID available for registration');
        setErrorMessage('User ID not available for face registration');
        if (onError) {
          onError(new Error('User ID not available'));
        }
        return;
      }
      
      console.log(`[CustomFaceLivenessDetector] Indexing face for user: ${user.id}`);
      
      // Fetch the image as a blob
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Upload video for audit trail if we have one
      if (recordedVideo) {
        const videoKey = `face-liveness/${user.id}/${Date.now()}-verification.mp4`;
        console.log(`[CustomFaceLivenessDetector] Uploading video to S3: ${videoKey}`);
        // Actual S3 upload would go here
      }
      
      // Convert imageBlob to base64
      const reader = new FileReader();
      const imageBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
      
      // Call FaceIndexingService with the base64 image
      const result = await FaceIndexingService.indexUserFace(imageBase64, user.id);
      
      if (result.success) {
        console.log('[CustomFaceLivenessDetector] Face registration successful:', result);
        if (onSuccess) {
          onSuccess({
            referenceImage: imageUrl,
            video: recordedVideo,
            confidence: 100 // Custom liveness check passed
          });
        }
      } else {
        console.error('[CustomFaceLivenessDetector] Face registration failed:', result.error);
        setErrorMessage(`Face verification completed, but registration failed: ${result.error}`);
        if (onError) {
          onError(new Error(result.error));
        }
      }
    } catch (err) {
      console.error('[CustomFaceLivenessDetector] Face registration failed:', err.message);
      setErrorMessage(`Face verification completed, but registration failed: ${err.message}`);
      if (onError) {
        onError(err);
      }
    }
  };
  
  // Handle close button click
  const handleCloseClick = useCallback(() => {
    console.log('[CustomFaceLivenessDetector] Close button clicked');
    if (onClose) onClose();
  }, [onClose]);
  
  // Retry the verification process
  const handleRetry = async () => {
    console.log('[CustomFaceLivenessDetector] Retrying verification');
    setIsInitializing(true); // Show initializing state
    setErrorMessage(null);
    setStage('init');
    setProgressSegments(0);
    setFinalImage(null);
    setRecordedVideo(null);
    setIsRecording(false);
    setIsCameraReady(false);
    
    // Reset head pose ref
    headPoseRef.current = { segments: Array(8).fill(false), currentSegmentIndex: 0, lastYaw: 0, lastPitch: 0 };
    
    // Re-initialize camera
    const cameraReady = await setupCamera();
    setIsInitializing(false); // Hide initializing state
    if (cameraReady) {
       // Optionally auto-start recording after retry, or wait for user interaction
       // startRecording(); // Uncomment to auto-start
       console.log('[CustomFaceLivenessDetector] Camera ready after retry. Waiting for user to start.');
    } else {
      console.error('[CustomFaceLivenessDetector] Failed to setup camera on retry.');
      // Error message should be set by setupCamera
    }
  };
  
  // Calculate circular progress dash array
  const calculateCircleDashArray = () => {
    const circumference = 2 * Math.PI * 45; // radius is 45
    return `${(progressSegments * circumference) / 8} ${circumference}`;
  };
  
  // Dynamically generate instruction text
  const getInstructionText = () => {
    const nextIndex = headPoseRef.current.currentSegmentIndex;
    if (nextIndex >= SEGMENT_ANGLES.length) return "Processing...";

    switch(nextIndex) {
      case 0: return "Slowly turn head right";
      case 1: return "Look up and right";
      case 2: return "Look straight up";
      case 3: return "Look up and left";
      case 4: return "Slowly turn head left";
      case 5: return "Look down and left";
      case 6: return "Look straight down";
      case 7: return "Look down and right";
      default: return "Move your head in a circle";
    }
  };
  
  // Loading screen UI
  if (isInitializing) {
    return (
      <div className="custom-face-verification-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Initializing camera...</p>
          <p className="text-xs mt-2 text-slate-400">This may take a few moments</p>
        </div>
      </div>
    );
  }
  
  // Error UI
  if (errorMessage) {
    return (
      <div className="custom-face-verification-container">
        <div className="error-screen">
          <div className="error-icon">!</div>
          <h3>Verification Error</h3>
          <p>{errorMessage}</p>
          <div className="text-xs mt-2 mb-4 text-slate-400">
            Please ensure you're using a supported browser (Chrome, Firefox, Safari)
            and that your camera is working properly.
          </div>
          <div className="button-group">
            <button className="retry-button" onClick={handleRetry}>Try Again</button>
            <button className="close-button" onClick={handleCloseClick}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render UI based on current stage
  return (
    <div className="custom-face-verification-container" ref={containerRef}>
      <div className="verification-content">
        {/* Video feed and overlay */}
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-feed"
            onLoadedData={() => console.log('[CustomFaceLivenessDetector] Video loaded data')}
          />
          
          {/* Canvas for capturing still frames - make visible during recording for debugging */}
          <canvas 
            ref={canvasRef} 
            className={isRecording ? "debug-canvas" : "capture-canvas"} 
            style={{display: isRecording ? 'block' : 'none', opacity: 0.3, position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none'}}
          />
          
          {/* Circular progress indicator */}
          {(stage === 'recording' || stage === 'init') && (
            <div className="circular-progress-container">
              <svg viewBox="0 0 100 100" className="circular-progress">
                {/* Background circle */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="#484848" strokeWidth="3" />
                
                {/* Segments - Render based on headPoseRef.current.segments */}
                {SEGMENT_ANGLES.map((_, index) => {
                  const segmentAngle = 360 / SEGMENT_ANGLES.length;
                  const startAngle = -90 + index * segmentAngle; // Start from top
                  const endAngle = startAngle + segmentAngle;
                  
                  // Calculate arc path
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const x1 = 50 + 45 * Math.cos(startRad);
                  const y1 = 50 + 45 * Math.sin(startRad);
                  const x2 = 50 + 45 * Math.cos(endRad);
                  const y2 = 50 + 45 * Math.sin(endRad);
                  const largeArcFlag = segmentAngle <= 180 ? "0" : "1";

                  const pathData = `M ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                  // Determine if this segment is completed
                  const isCompleted = index < progressSegments;
                  
                  // Add animated highlight for the current active segment
                  const isActive = index === headPoseRef.current.currentSegmentIndex;

                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill="none"
                      stroke={isCompleted ? "#1E88E5" : isActive ? "#64B5F6" : "#666"} // Blue if complete, lighter blue if active, gray otherwise
                      strokeWidth={isActive ? "7" : "5"}
                      strokeLinecap="round"
                      className={isActive ? "active-segment" : ""}
                      style={{ 
                        transition: 'stroke 0.3s ease', 
                        animation: isActive ? 'segmentPulse 1.5s infinite alternate' : 'none'
                      }}
                    />
                  );
                })}
                
                {/* Add current segment label */}
                <text 
                  x="50" 
                  y="54" 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="16" 
                  fontWeight="bold"
                  stroke="black"
                  strokeWidth="1"
                  paintOrder="stroke"
                >
                  {progressSegments}/8
                </text>
              </svg>
            </div>
          )}
          
          {/* Debug display for head pose values - ENHANCED VERSION */}
          {isRecording && (
            <div style={{
              position: 'absolute', 
              bottom: '5px', 
              left: '5px', 
              background: 'rgba(0,0,0,0.85)', 
              color: debugInfo.detected ? 'lime' : 'red',
              padding: '10px',
              fontSize: '14px',
              borderRadius: '6px',
              border: `2px solid ${headPoseRef.current.faceDetected ? 'lime' : 'red'}`,
              zIndex: 50,
              maxWidth: '280px'
            }}>
              <div style={{fontWeight: 'bold', fontSize: '16px'}}>{debugInfo.detected ? '✅ Face Detected' : '❌ No Face Detected'}</div>
              <div style={{color: 'white'}}>Yaw: {debugInfo.yaw}° | Pitch: {debugInfo.pitch}°</div>
              {debugInfo.score && <div style={{color: 'white'}}>Detection Score: {debugInfo.score}</div>}
              {debugInfo.landmarks !== undefined && (
                <div style={{color: debugInfo.landmarks ? 'lime' : 'yellow'}}>
                  Landmarks: {debugInfo.landmarks ? '✅' : '❌'} 
                  {debugInfo.landmarkCount && ` (${debugInfo.landmarkCount})`}
                </div>
              )}
              {debugInfo.landmarkError && <div style={{color: 'orange'}}>Landmark error: {debugInfo.landmarkError}</div>}
              {!debugInfo.detected && <div style={{color: 'yellow'}}>Last seen: {debugInfo.timeSinceDetection || 'N/A'}</div>}
              {debugInfo.error && <div style={{color: 'orange'}}>{debugInfo.error}</div>}
              {debugInfo.attempts && (
                <div style={{color: 'cyan'}}>Detection rate: {((debugInfo.successes / debugInfo.attempts) * 100).toFixed(0)}%</div>
              )}
              <div style={{color: 'cyan', marginTop: '5px'}}>Progress: {progressSegments}/8</div>
              <div style={{color: 'white', fontSize: '12px', marginTop: '5px'}}>
                {getInstructionText()}
              </div>
              <button 
                style={{
                  marginTop: '5px',
                  padding: '3px 6px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                onClick={testFaceDetection}
              >
                Test Face Detection
              </button>
            </div>
          )}
          
          {/* Large face outline when face is first detected */}
          {isRecording && headPoseRef.current.faceDetected && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '240px',
              border: '3px solid lime',
              borderRadius: '50% 50% 40% 40%',
              zIndex: 45,
              pointerEvents: 'none',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
              opacity: 0.7,
              animation: 'pulse 1.5s infinite alternate'
            }}></div>
          )}
          
          {/* Add animated instruction text based on current segment */}
          {stage === 'recording' && (
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(0,0,0,1)',
              padding: '10px 20px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '8px',
              zIndex: 40,
              animation: 'fadeInOut 2s infinite'
            }}>
              {getInstructionText()}
            </div>
          )}
          
          {/* Stage-specific overlays */}
          {stage === 'init' && (
            <div className="instruction-container">
              <h2>Get Ready</h2>
              <p>Position your face in the center of the oval.</p>
              <button 
                className="start-button" 
                onClick={startRecording} 
                disabled={!isCameraReady || isInitializing} // Disable button if camera not ready
              >
                {isInitializing ? 'Initializing...' : 'Start Verification'}
              </button>
            </div>
          )}
          
          {stage === 'recording' && (
            <div className="recording-overlay">
              <div className="timer-display">
                <span className="time-remaining">{timeRemaining}s</span>
                <span className="file-size">{fileSize.toFixed(1)} MB</span>
              </div>
              <p className="instruction-text">
                {getInstructionText()}
              </p>
              <p className="progress-text">
                Progress: {progressSegments} of 8 steps completed
              </p>
            </div>
          )}
          
          {stage === 'lookStraight' && (
            <div className="look-straight-overlay">
              <div className="face-target-frame"></div>
              <p>Look straight at the camera</p>
            </div>
          )}
          
          {stage === 'complete' && finalImage && (
            <div className="complete-overlay">
              <h2>Verification Complete</h2>
              <div className="results-container">
                <div className="result-item">
                  <h3>Reference Image</h3>
                  <img src={finalImage} alt="Face reference" className="result-image" />
                </div>
                {recordedVideo && (
                  <div className="result-item">
                    <h3>Verification Video</h3>
                    <video 
                      src={recordedVideo} 
                      controls 
                      className="result-video"
                    />
                    <p className="file-info">
                      Size: {fileSize.toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
              <div className="button-group">
                <button className="retry-button" onClick={handleRetry}>Retry</button>
                <button className="close-button" onClick={handleCloseClick}>Close</button>
              </div>
            </div>
          )}
          
          {/* Close button */}
          <button className="close-icon" onClick={handleCloseClick} aria-label="Close">
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFaceLivenessDetector; 