import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, AlertCircle, X, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

// Import AWS clients and services
import { s3Client, PHOTO_BUCKET, COLLECTION_ID } from '../lib/awsClient';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { FaceIndexingService } from '../services/FaceIndexingService.jsx';
import { createPhotoRecord, storeFaceMatch } from '../services/database-utils.js';
import { useAuth } from '../context/AuthContext'; // Assuming useAuth provides the Cognito user

const SimplePhotoUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { user } = useAuth(); // Get authenticated user from AuthContext

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setMessage('');
    setMessageType('info');
    setResult(null);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    // Clean up preview URL when component unmounts
    // TODO: Ensure this cleanup happens correctly on success/error too
    // return () => URL.revokeObjectURL(objectUrl);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      // HEIC might need conversion before Rekognition/S3 upload
      // 'image/heic': ['.heic']
    },
    maxFiles: 1,
    multiple: false
  });
  
  const resetUploader = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setMessage('');
    setMessageType('info');
    setResult(null);
    setUploadProgress(0);
    setUploading(false);
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

    const photoId = uuidv4();
    const fileExtension = file.name.split('.').pop();
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
        ContentType: file.type,
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
        file_type: file.type,
        type: file.type, // Keep for compatibility
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
      if (searchResult.success && searchResult.matches.length > 0) {
        setMessage(`Found ${searchResult.matches.length} potential face matches. Saving matches...`);
        console.log('Rekognition Matches:', searchResult.matches);
        matchCount = searchResult.matches.length;

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

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
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
            {result.data?.url && (
              <img
                src={result.data.url}
                alt="Uploaded photo"
                className="mt-4 rounded-lg max-w-xs mx-auto shadow-sm"
              />
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
          >
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out",
                "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400",
                isDragActive && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/20"
              )}
              style={{ minHeight: '160px' }}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <div className="relative w-32 h-32 mb-4">
                   <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                   <button
                    onClick={(e) => { e.stopPropagation(); resetUploader(); }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
              )}

              {!uploading && !file && (
                isDragActive ? (
                  <p className="text-sm text-blue-600 dark:text-blue-300">Drop the file here ...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag & drop a photo here, or click to select
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Supports JPG, PNG, WEBP
                    </p>
                  </>
                )
              )}
              {file && !uploading && (
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-full px-2">{file.name}</p>
              )}

            </div>

             {/* Progress Bar and Upload Button */}
            {file && (
              <div className="mt-5 text-center">
                 {uploading && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "linear", duration: 0.5 }}
                    />
                  </div>
                )}

                <button
                  onClick={uploadPhoto}
                  disabled={uploading}
                  className={cn(
                    "w-full px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                    "transition-colors duration-150 ease-in-out",
                    uploading
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                      : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  )}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Uploading...
                    </span>
                  ) : (
                    'Upload Photo'
                  )}
                </button>
              </div>
            )}

             {/* Status Messages */}
             <AnimatePresence>
              {message && (
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
                    messageType === 'info' && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  )}
                >
                   {messageType === 'success' && <Check className="w-5 h-5 mr-2 flex-shrink-0" />}
                   {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                   {messageType === 'warning' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                   {messageType === 'info' && !uploading && <Image className="w-5 h-5 mr-2 flex-shrink-0" />}
                   {messageType === 'info' && uploading && <Loader2 className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" />}
                  <span className="flex-grow">{message}</span>
                   {/* Allow dismissing error messages */}
                   {messageType === 'error' && !uploading && (
                    <button onClick={() => setMessage('')} className="-mr-1 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-800/50 focus:outline-none focus:ring-1 focus:ring-red-400">
                      <X size={16} className="text-red-600 dark:text-red-400"/>
                    </button>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimplePhotoUploader; 