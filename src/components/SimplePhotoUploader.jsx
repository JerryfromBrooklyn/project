import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Check, AlertCircle, X, Image, Loader2, Camera, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

// Import Uppy v4.x components
import Uppy from '@uppy/core';
import { Dashboard, DashboardModal } from '@uppy/react';
import Webcam from '@uppy/webcam';
import ImageEditor from '@uppy/image-editor';
import StatusBar from '@uppy/status-bar';

// Import CSS
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

// Import AWS clients and services
import { s3Client, PHOTO_BUCKET, COLLECTION_ID } from '../lib/awsClient';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { FaceIndexingService } from '../services/FaceIndexingService.jsx';
import { createPhotoRecord, storeFaceMatch } from '../services/database-utils.js';
import { useAuth } from '../context/AuthContext';

const SimplePhotoUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { user } = useAuth(); // Get authenticated user from AuthContext
  const [isMobile, setIsMobile] = useState(false);
  const [uppyInstance, setUppyInstance] = useState(null);
  const [showUppyDashboard, setShowUppyDashboard] = useState(false);
  const [matchedFaces, setMatchedFaces] = useState([]);

  // Detect if using a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      console.log('[PhotoUploader] Device detected as:', isMobileDevice ? 'Mobile' : 'Desktop');
    };
    
    checkMobile();
  }, []);

  // Initialize Uppy when component mounts
  useEffect(() => {
    const uppy = new Uppy({
      id: 'photoUploader',
      autoProceed: false,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxNumberOfFiles: 1,
        allowedFileTypes: ['image/*']
      },
      meta: {
        userId: user?.id
      }
    })
    .use(Webcam, {
      modes: ['picture'],
      mirror: true,
      facingMode: 'user'
    })
    .use(ImageEditor, {
      id: 'ImageEditor',
      quality: 0.9,
      cropperOptions: {
        viewMode: 1,
        background: false,
        autoCropArea: 1,
        responsive: true
      }
    });

    uppy.on('file-added', (file) => {
      console.log('[Uppy] File added:', file.name);
      setMessage(`File "${file.name}" selected`);
      setMessageType('info');
      
      // Create preview URL
      setPreviewUrl(URL.createObjectURL(file.data));
      setFile(file.data);
    });

    uppy.on('upload', (data) => {
      console.log('[Uppy] Starting manual upload');
      // Prevent actual upload through Uppy, we'll handle it ourselves
      uppy.cancelAll();
      
      // Manually trigger our upload process
      uploadPhoto();
    });

    uppy.on('file-removed', (file) => {
      resetUploader();
    });

    uppy.on('cancel-all', () => {
      console.log('[Uppy] Upload cancelled');
    });

    setUppyInstance(uppy);

    // Cleanup on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      uppy.close();
    };
  }, [user?.id]);
  
  const resetUploader = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    if (uppyInstance) {
      uppyInstance.cancelAll();
      uppyInstance.reset();
    }
    
    setFile(null);
    setPreviewUrl(null);
    setMessage('');
    setMessageType('info');
    setResult(null);
    setUploadProgress(0);
    setUploading(false);
    setShowUppyDashboard(false);
    setMatchedFaces([]);
  };

  const uploadPhoto = async () => {
    if (!file) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }
    if (!user) {
      setMessage('Error: User not authenticated');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage('Starting upload...');
    setMessageType('info');
    setResult(null);
    setMatchedFaces([]);

    const photoId = uuidv4();
    const fileExtension = file.name ? file.name.split('.').pop() : 'jpg';
    const s3Key = `${user.id}/${photoId}.${fileExtension}`; // Use Cognito user ID (sub)
    let s3Url = '';
    let fileBytes = null;

    try {
      // 1. Convert file to buffer/bytes
      setMessage('Preparing file...');
      setUploadProgress(10);
      const arrayBuffer = await file.arrayBuffer();
      fileBytes = new Uint8Array(arrayBuffer);

      // 2. Upload to S3
      setMessage(`Uploading to S3 bucket: ${PHOTO_BUCKET}...`);
      setUploadProgress(25);
      const putCommand = new PutObjectCommand({
        Bucket: PHOTO_BUCKET,
        Key: s3Key,
        Body: fileBytes,
        ContentType: file.type || 'image/jpeg',
        // ACL: 'public-read', // Or configure bucket policy for public access if needed
      });
      await s3Client.send(putCommand);
      s3Url = `https://${PHOTO_BUCKET}.s3.amazonaws.com/${s3Key}`; // Construct basic S3 URL
      console.log('S3 Upload successful:', s3Url);
      setUploadProgress(50);

      // 3. Create Photo Record in DynamoDB
      setMessage('Saving photo metadata...');
      setUploadProgress(60);
      const photoData = {
        id: photoId,
        user_id: user.id,
        uploaded_by: user.id, // Store Cognito user ID
        s3_bucket: PHOTO_BUCKET,
        s3_key: s3Key,
        storage_path: s3Key, // Keep for compatibility if needed
        public_url: s3Url, // Store S3 URL
        url: s3Url,        // Keep for compatibility
        file_size: file.size,
        size: file.size,   // Keep for compatibility
        file_type: file.type || 'image/jpeg',
        type: file.type || 'image/jpeg', // Keep for compatibility
        rekognition_status: 'PENDING', // Initial status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const dbResult = await createPhotoRecord(photoData);
      if (!dbResult.success) {
        throw new Error(`Failed to save photo metadata: ${dbResult.error}`);
      }
      console.log('DynamoDB record created:', dbResult.data);
      setUploadProgress(75);

      // 4. Search for Faces using Rekognition
      setMessage('Analyzing photo for faces...');
      setUploadProgress(85);
      const searchResult = await FaceIndexingService.searchFaceByImage(fileBytes, user.id);

      let matchCount = 0;
      if (searchResult.success && searchResult.matches && searchResult.matches.length > 0) {
        setMessage(`Found ${searchResult.matches.length} potential face matches. Saving matches...`);
        console.log('Rekognition Matches:', searchResult.matches);
        matchCount = searchResult.matches.length;
        setMatchedFaces(searchResult.matches);

        // 5. Store Matches in DynamoDB
        for (const match of searchResult.matches) {
          await storeFaceMatch({
            photo_id: photoId, // Link match to the uploaded photo
            user_id: user.id,  // The user who uploaded the photo
            matched_user_id: match.user_id, // The user ID associated with the matched face
            matched_face_id: match.face_id,
            similarity: match.similarity,
            rekognition_bounding_box: match.bounding_box,
            rekognition_confidence: match.confidence,
            matched_at: new Date().toISOString(),
          });
        }
        console.log('Face matches stored successfully.');
      } else if (searchResult.success) {
        setMessage('Photo analyzed. No matching faces found.');
        console.log('No Rekognition matches found.');
      } else {
        // Log error but continue - upload is still successful
        console.error('Rekognition search failed:', searchResult.error);
        setMessage('Photo uploaded, but face analysis failed.');
        setMessageType('warning');
      }
      setUploadProgress(100);

      // 6. Final Success
      setMessage(`Upload complete! ${matchCount > 0 ? `${matchCount} face(s) matched.` : 'No faces matched.'}`);
      setMessageType('success');
      setResult({
        success: true,
        data: {
          photoId: photoId,
          url: s3Url,
          matchCount: matchCount,
          matches: matchCount > 0 ? searchResult.matches : []
        }
      });

    } catch (error) {
      console.error('Upload process failed:', error);
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
      setResult({ success: false, error: error.message });
      // Optionally: attempt to delete S3 object if DB record failed? Needs careful handling.
    } finally {
      setUploading(false);
    }
  };

  const handleUppyDashboardOpen = () => {
    setShowUppyDashboard(true);
  };

  const handleUppyDashboardClose = () => {
    setShowUppyDashboard(false);
  };

  const handleUploadButtonClick = () => {
    if (uppyInstance) {
      uppyInstance.upload();
    } else {
      uploadPhoto();
    }
  };

  // Render matched faces information
  const renderMatchedFaces = () => {
    if (!matchedFaces || matchedFaces.length === 0) return null;
    
    return (
      <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-md font-medium text-blue-800 mb-2">
          Matched {matchedFaces.length} registered user{matchedFaces.length !== 1 ? 's' : ''}
        </h3>
        <ul className="space-y-2">
          {matchedFaces.map((match, index) => (
            <li key={index} className="text-sm flex items-center justify-between">
              <span className="text-blue-700">User {index + 1}</span>
              <span className="font-medium text-blue-800">{Math.round(match.similarity)}% match</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload New Photo</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Photos will be analyzed for faces using AWS Rekognition.
          </p>
        </div>
        
        <AnimatePresence mode="wait">
          {/* Show upload result/success message */}
          {result && result.success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center p-4"
            >
              <Check className="w-16 h-16 mx-auto text-green-500 bg-green-100 dark:bg-green-900 rounded-full p-3 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload Successful!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
              
              {/* Show matched faces information */}
              {renderMatchedFaces()}
              
              {result.data?.url && (
                <div className="mt-4 max-w-sm mx-auto">
                  <img
                    src={result.data.url}
                    alt="Uploaded photo"
                    className="rounded-lg shadow-sm w-full object-cover"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}
              <button
                onClick={resetUploader}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Upload Another Photo
              </button>
            </motion.div>
          ) : (
             /* Show uploader UI */
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Uppy Dashboard Modal */}
              {uppyInstance && (
                <DashboardModal
                  uppy={uppyInstance}
                  open={showUppyDashboard}
                  onRequestClose={handleUppyDashboardClose}
                  proudlyDisplayPoweredByUppy={false}
                  showLinkToFileInput={false}
                  showProgressDetails={true}
                  note="Images only, up to 10MB"
                  height={550}
                  metaFields={[
                    { id: 'name', name: 'Name', placeholder: 'Optional file name' },
                  ]}
                  thumbnailWidth={280}
                  closeModalOnClickOutside
                  closeAfterFinish={true}
                  locale={{
                    strings: {
                      dropPasteFiles: 'Drop files here, %{browseFiles} or %{browseFolders}',
                      browse: 'browse',
                      myDevice: 'My Device',
                      takePicture: 'Take Photo',
                      recording: 'Recording',
                      startRecording: 'Begin video recording',
                      stopRecording: 'Stop video recording',
                      smile: 'Smile!',
                      takePicture: 'Take a picture',
                      smile: 'Smile!',
                      uploadComplete: 'Upload complete',
                      uploadFailed: 'Upload failed',
                      uploadPaused: 'Upload paused',
                      uploading: 'Uploading',
                      complete: 'Complete',
                    }
                  }}
                />
              )}

              {/* Upload Options Buttons */}
              {!file && !previewUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleUppyDashboardOpen}
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <FileUp className="w-10 h-10 text-blue-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Upload from Device
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Drag & drop or click to browse
                    </span>
                  </button>

                  <button
                    onClick={handleUppyDashboardOpen}
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <Camera className="w-10 h-10 text-green-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Take a Photo
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Use your device camera
                    </span>
                  </button>
                </div>
              )}

              {/* Preview Area */}
              {(file || previewUrl) && !uploading && (
                <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-auto max-w-full max-h-[300px] object-contain rounded-lg shadow-sm"
                    />
                    <button
                      onClick={resetUploader}
                      className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 focus:outline-none"
                      aria-label="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="mt-4 w-full flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                      {file?.name || 'Camera capture'}
                    </p>
                    
                    <button
                      onClick={handleUploadButtonClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium focus:outline-none"
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>
              )}

               {/* Progress Bar */}
              {uploading && (
                <div className="p-6 flex flex-col items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                    <motion.div
                      className="bg-blue-600 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "linear", duration: 0.5 }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {message}
                  </p>
                </div>
              )}

               {/* Status Messages */}
               <AnimatePresence>
                {message && !uploading && messageType !== 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "mt-4 flex items-start p-3 rounded-md text-sm",
                      messageType === 'success' && "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700",
                      messageType === 'error' && "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700",
                      messageType === 'warning' && "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700",
                    )}
                  >
                     {messageType === 'success' && <Check className="w-5 h-5 mr-2 flex-shrink-0" />}
                     {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                     {messageType === 'warning' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                    <span className="flex-grow">{message}</span>
                     {/* Allow dismissing error messages */}
                     {messageType === 'error' && (
                      <button onClick={() => setMessage('')} className="-mr-1 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-800/50 focus:outline-none focus:ring-1 focus:ring-red-400">
                        <X size={16} className="text-red-600 dark:text-red-400"/>
                      </button>
                     )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Help Text */}
              {!file && !previewUrl && (
                <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  <p>Supported formats: JPEG, PNG, WebP</p>
                  <p className="mt-1">Maximum file size: 10MB</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SimplePhotoUploader; 