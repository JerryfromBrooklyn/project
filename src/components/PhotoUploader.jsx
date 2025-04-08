import React, { useState } from 'react';
import { useAuth } from '../auth';
import UppyUploader from './UppyUploader';
import { Check, Upload, Clock, AlertTriangle } from 'lucide-react';

const PhotoUploader = () => {
    const { user } = useAuth();
    const [uploadStatus, setUploadStatus] = useState({
        status: 'idle', // idle, uploading, success, error
        message: '',
        uploads: []
    });

    const handleUploadComplete = (fileInfo) => {
        console.log('Upload completed:', fileInfo);
        
        setUploadStatus(prev => ({
            status: 'success',
            message: `Successfully uploaded ${prev.uploads.length + 1} photos.`,
            uploads: [...prev.uploads, fileInfo]
        }));
        
        // You can also trigger AWS Rekognition processing here
        processUploadedImage(fileInfo);
    };

    const processUploadedImage = async (fileInfo) => {
        try {
            // In a real implementation, this would call your backend API
            // to process the uploaded image with AWS Rekognition
            console.log('Processing image with Rekognition:', fileInfo.url);
            
            // Simulate API call to backend
            const response = await fetch('/api/process-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: fileInfo.url,
                    userId: user?.id,
                    metadata: fileInfo.meta
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to process image');
            }
            
            const result = await response.json();
            console.log('Processing result:', result);
            
            // Update upload with processing results
            setUploadStatus(prev => ({
                ...prev,
                uploads: prev.uploads.map(upload => 
                    upload.url === fileInfo.url 
                        ? { ...upload, processed: true, faces: result.faces }
                        : upload
                )
            }));
            
        } catch (error) {
            console.error('Error processing image:', error);
            // Update status to reflect processing error
            setUploadStatus(prev => ({
                ...prev,
                uploads: prev.uploads.map(upload => 
                    upload.url === fileInfo.url 
                        ? { ...upload, processed: false, error: error.message }
                        : upload
                )
            }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Upload Photos</h1>
                    {uploadStatus.status === 'success' && (
                        <div className="flex items-center text-green-600">
                            <Check className="w-5 h-5 mr-2" />
                            <span>{uploadStatus.message}</span>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        Upload your photos here. They will automatically be processed for face recognition.
                    </p>
                    
                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                        <h3 className="text-md font-semibold text-blue-800 mb-2">How it works</h3>
                        <ol className="list-decimal list-inside text-gray-700 space-y-2">
                            <li>Upload one or more photos</li>
                            <li>Our system will automatically detect and recognize faces</li>
                            <li>If your face is registered, you'll be notified when you appear in a photo</li>
                            <li>You can view all your matches in the "My Photos" section</li>
                        </ol>
                    </div>
                    
                    {/* Uppy Uploader Component */}
                    <UppyUploader onUploadComplete={handleUploadComplete} />
                </div>

                {uploadStatus.uploads.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Recently Uploaded Photos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uploadStatus.uploads.map((upload, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                    {upload.url && (
                                        <div className="aspect-square relative">
                                            <img 
                                                src={upload.url} 
                                                alt={upload.filename} 
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2">
                                                {upload.processed ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Processed
                                                    </span>
                                                ) : upload.error ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Processing
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
                                        <p className="text-xs text-gray-500">{(upload.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        
                                        {upload.faces && upload.faces.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs font-medium text-purple-800">
                                                    {upload.faces.length} {upload.faces.length === 1 ? 'face' : 'faces'} detected
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoUploader; 