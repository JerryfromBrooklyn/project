import React, { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import AwsS3 from '@uppy/aws-s3';
import { Check, Upload, Clock, AlertTriangle, XCircle } from 'lucide-react';

// Import Uppy CSS
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

const PhotoUploader = () => {
    const [uploadResults, setUploadResults] = useState([]);
    const [error, setError] = useState(null);

    // Configure Uppy instance
    const [uppy] = useState(() => {
        const uppyInstance = new Uppy({
            // debug: true, 
            autoProceed: false, 
            restrictions: {
                maxFileSize: 15 * 1024 * 1024, // 15MB limit per photo
                allowedFileTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
            },
            meta: { 
                // Add any global metadata if needed
                // E.g., eventId: 'festival-2024' 
            }
        });

        // Configure AWS S3 plugin
        uppyInstance.use(AwsS3, {
            // Fetch pre-signed URL from our backend
            getUploadParameters: async (file) => {
                console.log('[Uppy] Requesting upload parameters for:', file.name);
                setError(null); // Clear previous errors
                try {
                    const response = await fetch('/api/get-upload-credentials', { // ** YOU NEED TO CREATE THIS BACKEND ENDPOINT **
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            contentType: file.type,
                            metadata: file.meta // Pass file-specific metadata
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                        console.error('[Uppy] Failed to get upload parameters:', errorData);
                        throw new Error(errorData.message || 'Failed to get upload parameters from server.');
                    }

                    const data = await response.json();
                    console.log('[Uppy] Received upload parameters:', data);

                    if (!data.url) {
                         throw new Error('Invalid response from server: Missing presigned URL.');
                    }

                    return {
                        method: 'PUT',
                        url: data.url, // The pre-signed URL from server
                        fields: {}, // Usually empty for pre-signed PUT URLs to S3
                        headers: {
                           'Content-Type': file.type,
                           // Add any other headers required by S3/your setup if necessary
                        },
                    };
                } catch (err) {
                    console.error('[Uppy] Error fetching upload parameters:', err);
                    setError(`Network error: Could not get upload credentials. ${err.message}`);
                    // Notify Uppy about the error for this specific file
                    uppyInstance.info(`Failed to get upload credentials for ${file.name}: ${err.message}`, 'error', 5000);
                    // Throwing the error signals failure to Uppy for this file
                    throw err; 
                }
            },
        });

        // Uppy Event Listeners
        uppyInstance.on('upload-success', (file, response) => {
            console.log('[Uppy] File uploaded successfully:', file.name, response.uploadURL);
            // response.uploadURL will be null for AwsS3 PUT uploads, but the request succeeded.
            // The important part is that the file is now in S3.
            // We can store the S3 key/URL based on what our backend provided in getUploadParameters
            // (if the backend returned the final key/URL). We might need to update this logic
            // based on the exact response from /api/get-upload-credentials.

            setUploadResults(prev => [
                ...prev,
                { 
                    id: file.id,
                    name: file.name,
                    size: file.size,
                    status: 'uploaded', 
                    // s3Key: file.meta.key // Assuming backend adds the S3 key to meta
                }
            ]);
            
            // ** TODO: Trigger backend processing (face detection) for the uploaded file **
            // This usually involves sending the S3 object key (which you should get from 
            // your /api/get-upload-credentials endpoint response) to another backend endpoint.
            // e.g., fetch('/api/process-s3-image', { method: 'POST', body: JSON.stringify({ s3Key: file.meta.key }) })
            console.log(`[Uppy] TODO: Trigger backend processing for ${file.name} (key: ${file.meta?.key})`);
        });

        uppyInstance.on('upload-error', (file, error, response) => {
            console.error('[Uppy] Upload error:', file.name, error, response);
            setError(`Upload failed for ${file.name}: ${error.message}`);
             setUploadResults(prev => [
                ...prev,
                { id: file.id, name: file.name, size: file.size, status: 'error', message: error.message }
            ]);
        });

        uppyInstance.on('complete', (result) => {
            console.log('[Uppy] Upload batch complete:', result);
            if (result.failed.length === 0) {
                console.log('[Uppy] All files uploaded successfully!');
                // Maybe show a success message for the batch
            } else {
                console.warn(`[Uppy] Upload complete with ${result.failed.length} failures.`);
                setError(`Some files failed to upload. Check details below or in the console.`);
            }
        });
        
        return uppyInstance;
    });

    useEffect(() => {
        // Clean up Uppy instance when component unmounts
        return () => uppy.close({ reason: 'unmount' });
    }, [uppy]);

    
    // Removed the previous local state handling for uploadStatus as Uppy manages file states

    return (
        <div className="">
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                    <p><strong>Upload Error:</strong> {error}</p>
                </div>
            )}

            <Dashboard
                uppy={uppy}
                plugins={[]} // Add plugin names here if using any UI plugins like Webcam
                height={450}
                theme="light" // or "dark"
                proudlyDisplayPoweredByUppy={false}
                note="Images only (JPEG, PNG, HEIC, WEBP), up to 15MB"
                // You can customize other Dashboard props here
            />

            {/* Display upload results/status (optional enhancement) */}
            {uploadResults.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Summary</h2>
                    <div className="space-y-2">
                        {uploadResults.map((file) => (
                            <div key={file.id} className={`p-3 rounded-md border ${file.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 truncate mr-4">{file.name}</span>
                                    {file.status === 'uploaded' && <Check className="w-5 h-5 text-green-600" />}
                                    {file.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                                </div>
                                {file.status === 'error' && (
                                    <p className="text-xs text-red-600 mt-1">Error: {file.message}</p>
                                )}
                                <p className="text-xs text-gray-500">({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoUploader; 