import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, AlertCircle, X, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

// Conditionally import supabase if it exists
let supabase;
try {
  supabase = require('../lib/supabaseClient').supabase || require('../supabaseClient').supabase;
} catch (error) {
  console.warn('Supabase client not available - running in demo mode');
}

const SimplePhotoUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if we're in demo mode
    if (!supabase) {
      setIsDemoMode(true);
      setMessage('Running in demo mode - uploads will only be simulated');
      setMessageType('info');
    }
  }, []);

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
    return () => URL.revokeObjectURL(objectUrl);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic']
    },
    maxFiles: 1,
    multiple: false
  });
  
  const resetUploader = () => {
    setFile(null);
    setPreviewUrl(null);
    setMessage('');
    setMessageType('info');
    setResult(null);
    setUploadProgress(0);
  };

  const uploadPhoto = async () => {
    if (!file) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setMessage('Starting upload...');
      setMessageType('info');

      // If in demo mode, simulate the upload
      if (isDemoMode) {
        // Simulate upload progress
        let progress = 10;
        const progressInterval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(progressInterval);
            setMessage('Upload completed successfully (demo mode)');
            setMessageType('success');
            setResult({
              success: true,
              photoId: uuidv4(),
              url: previewUrl,
              note: 'This is a simulated upload in demo mode'
            });
            setUploading(false);
          }
        }, 500);
        
        return;
      }

      // Normal upload flow with Supabase
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Error: User not authenticated');
        setMessageType('error');
        setUploading(false);
        return;
      }

      // Generate a unique ID
      const photoId = uuidv4();
      
      // Create storage path
      const storagePath = `${user.id}/${photoId}-${file.name}`;
      
      setMessage('Uploading file to storage...');
      setUploadProgress(30);
      
      // Upload file to storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file, { upsert: true });
      
      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      
      setUploadProgress(50);
      setMessage('Getting public URL...');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(storagePath);
      
      setUploadProgress(70);
      setMessage('Creating database record...');
      
      // Minimal record to avoid permissions issues
      const minimalRecord = {
        id: photoId,
        uploaded_by: user.id,
        user_id: user.id,
        storage_path: storagePath,
        public_url: publicUrl,
        url: publicUrl,
        file_size: file.size,
        size: file.size,
        file_type: file.type,
        type: file.type,
        created_at: new Date().toISOString()
      };
      
      // Insert with minimal data
      const { data, error } = await supabase
        .from('photos')
        .insert(minimalRecord);
      
      if (error) {
        console.error('DB insert error:', error);
        setMessage(`Database insert failed. Trying alternative method...`);
        setMessageType('warning');
        
        // Try RPC method as fallback
        try {
          const { error: rpcError } = await supabase.rpc(
            'simple_photo_insert',
            {
              p_id: photoId,
              p_user_id: user.id,
              p_storage_path: storagePath,
              p_public_url: publicUrl,
              p_file_size: file.size,
              p_file_type: file.type
            }
          );
          
          if (rpcError) {
            throw new Error(`RPC insert failed: ${rpcError.message}`);
          }
        } catch (rpcFailError) {
          console.error('RPC fallback failed:', rpcFailError);
          
          // Final fallback: just return the file info even if DB insert fails
          setMessage('Database record creation failed, but file was uploaded successfully');
          setMessageType('warning');
          setResult({
            success: true,
            photoId,
            url: publicUrl,
            note: 'File uploaded but database record failed'
          });
          setUploading(false);
          setUploadProgress(100);
          return;
        }
      }
      
      setUploadProgress(100);
      setMessage('Upload completed successfully!');
      setMessageType('success');
      setResult({
        success: true,
        photoId,
        url: publicUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Simple Photo Uploader</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload photos quickly and easily
        </p>
      </div>
      
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-5">
              {/* File Upload Area */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 transition-colors duration-200 text-center cursor-pointer relative overflow-hidden",
                  isDragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700",
                  isDragReject && "border-red-400 bg-red-50 dark:bg-red-900/20",
                  file && "border-green-400 bg-green-50 dark:bg-green-900/20"
                )}
              >
                <input {...getInputProps()} />
                
                {/* Preview Image (if file is selected) */}
                {previewUrl && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-32 max-w-full object-contain rounded-lg" 
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetUploader();
                      }}
                      className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 p-1 rounded-full text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex flex-col items-center justify-center h-24">
                  {!previewUrl && (
                    <>
                      <Upload 
                        className={cn(
                          "h-10 w-10 mb-2",
                          isDragActive ? "text-blue-500" : "text-gray-400 dark:text-gray-500",
                          isDragReject && "text-red-500"
                        )}
                      />
                      
                      {isDragActive ? (
                        <p className="text-sm font-medium text-blue-500">Drop the photo here...</p>
                      ) : isDragReject ? (
                        <p className="text-sm font-medium text-red-500">This file type is not supported</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Drag & drop a photo or click to browse
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Supports JPEG, PNG, WebP, and HEIC
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Message */}
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm",
                      messageType === 'error' && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                      messageType === 'success' && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                      messageType === 'warning' && "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                      messageType === 'info' && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    )}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Progress Bar */}
              {uploading && (
                <div className="relative pt-1">
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 8 }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
                    </div>
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {uploadProgress}%
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <button
                onClick={uploadPhoto}
                disabled={!file || uploading}
                className={cn(
                  "w-full py-3 px-4 rounded-xl font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  !file 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500" 
                    : uploading
                      ? "bg-blue-400 text-white cursor-not-allowed dark:bg-blue-600"
                      : "bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                )}
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload Photo'
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="pt-2"
          >
            <div className={cn(
              "rounded-xl overflow-hidden border",
              result.success 
                ? "border-green-200 dark:border-green-900" 
                : "border-red-200 dark:border-red-900"
            )}>
              {/* Result header */}
              <div className={cn(
                "p-4 flex items-center",
                result.success 
                  ? "bg-green-50 dark:bg-green-900/20" 
                  : "bg-red-50 dark:bg-red-900/20"
              )}>
                {result.success ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800 dark:text-green-300">
                        Upload Successful
                      </h3>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Photo ID: {result.photoId}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center mr-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-300">
                        Upload Failed
                      </h3>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Please try again
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Result content */}
              {result.success ? (
                <div className="p-4">
                  <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img 
                      src={result.url} 
                      alt="Uploaded" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Full Size
                    </a>
                    
                    <button
                      onClick={resetUploader}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Upload Another
                    </button>
                  </div>
                  
                  {result.note && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg">
                      {result.note}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    {result.error}
                  </p>
                  
                  <button
                    onClick={resetUploader}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default SimplePhotoUploader; 