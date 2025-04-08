import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import Uppy from '@uppy/core';
import { Dashboard, DashboardModal } from '@uppy/react';
import AwsS3 from '@uppy/aws-s3';
import StatusBar from '@uppy/status-bar';

// Import Uppy styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

const UppyUploader = ({ onUploadComplete }) => {
    const { user } = useAuth();
    const [uppy, setUppy] = useState(null);
    const [uploadStats, setUploadStats] = useState({
        successCount: 0,
        failureCount: 0,
        totalBytes: 0,
        processedBytes: 0,
    });
    const [metadataFields, setMetadataFields] = useState({
        eventName: '',
        location: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        // Initialize Uppy instance
        const uppyInstance = new Uppy({
            debug: true,
            autoProceed: false,
            restrictions: {
                maxFileSize: 100 * 1024 * 1024, // 100MB
                maxNumberOfFiles: 50,
                allowedFileTypes: ['.jpg', '.jpeg', '.png', '.webp', '.raw', '.cr2', '.nef', '.arw', '.rw2']
            },
            meta: {
                userId: user?.id,
                ...metadataFields
            }
        });

        // Add AWS S3 plugin
        uppyInstance.use(AwsS3, {
            companionUrl: process.env.REACT_APP_COMPANION_URL || '/companion',
            // If using presigned URLs for direct uploads
            getUploadParameters(file) {
                // Here we would fetch a presigned URL from our backend
                return fetch('/api/s3/presigned', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        userId: user?.id,
                        metaData: {
                            ...file.meta,
                            userId: user?.id,
                            uploadDate: new Date().toISOString()
                        }
                    })
                }).then(response => response.json())
                .then(data => {
                    return {
                        method: 'PUT',
                        url: data.url,
                        fields: data.fields || {}, // May be empty for presigned URLs
                        headers: data.headers || {}
                    };
                });
            }
        });

        // Setup event listeners
        uppyInstance.on('upload-success', (file, response) => {
            console.log('Upload success:', file.name, response);
            setUploadStats(prev => ({
                ...prev,
                successCount: prev.successCount + 1,
                processedBytes: prev.processedBytes + file.size
            }));

            // If you need to process the uploaded file (e.g., store in DB)
            const uploadedUrl = response.uploadURL || `https://s3.amazonaws.com/${response.body.bucket}/${response.body.key}`;
            console.log('File URL:', uploadedUrl);

            // Notify parent component if needed
            if (onUploadComplete) {
                onUploadComplete({
                    url: uploadedUrl,
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                    meta: file.meta
                });
            }
        });

        uppyInstance.on('upload-error', (file, error, response) => {
            console.error('Upload error:', file.name, error, response);
            setUploadStats(prev => ({
                ...prev,
                failureCount: prev.failureCount + 1,
                processedBytes: prev.processedBytes + file.size
            }));
        });

        uppyInstance.on('file-added', (file) => {
            setUploadStats(prev => ({
                ...prev,
                totalBytes: prev.totalBytes + file.size
            }));
            
            // Add file-specific metadata if needed
            uppyInstance.setFileMeta(file.id, {
                ...metadataFields,
                timestamp: new Date().toISOString(),
                userId: user?.id
            });
        });

        uppyInstance.on('file-removed', (file) => {
            setUploadStats(prev => ({
                ...prev,
                totalBytes: Math.max(0, prev.totalBytes - file.size)
            }));
        });

        uppyInstance.on('upload-progress', (file, progress) => {
            // Update progress if needed
            const { bytesUploaded, bytesTotal } = progress;
            console.log(`Progress for ${file.name}: ${bytesUploaded} / ${bytesTotal}`);
        });

        uppyInstance.on('complete', (result) => {
            console.log('Upload complete:', result);
            // Maybe trigger further processing or navigate away
        });

        // Save the instance 
        setUppy(uppyInstance);

        // Cleanup on component unmount
        return () => {
            uppyInstance.close({ reason: 'unmount' });
        };
    }, [user, metadataFields, onUploadComplete]);

    // Handle metadata changes
    const handleMetadataChange = (e) => {
        const { name, value } = e.target;
        
        setMetadataFields(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
            
            // Update Uppy meta if it's initialized
            if (uppy) {
                uppy.setMeta({
                    userId: user?.id,
                    ...updated
                });
            }
            
            return updated;
        });
    };

    return (
        <div className="uppy-container">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Photos</h2>
                
                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Name
                            </label>
                            <input
                                type="text"
                                name="eventName"
                                value={metadataFields.eventName}
                                onChange={handleMetadataChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter event name"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={metadataFields.location}
                                onChange={handleMetadataChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter location"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={metadataFields.date}
                                onChange={handleMetadataChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {uppy && (
                    <>
                        <Dashboard
                            uppy={uppy}
                            plugins={['StatusBar']}
                            metaFields={[
                                { id: 'eventName', name: 'Event Name', placeholder: 'Event name' },
                                { id: 'location', name: 'Location', placeholder: 'Location' },
                                { id: 'date', name: 'Date', placeholder: 'Date' }
                            ]}
                            width="100%"
                            height={400}
                            showProgressDetails={true}
                            proudlyDisplayPoweredByUppy={false}
                            note="Images will be processed for face recognition"
                        />
                        
                        <div className="mt-4">
                            <StatusBar
                                uppy={uppy}
                                hideUploadButton={false}
                                hideAfterFinish={false}
                            />
                        </div>
                    </>
                )}
                
                {uploadStats.successCount > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-md">
                        <h3 className="text-md font-semibold text-green-800 mb-2">Upload Summary</h3>
                        <p className="text-green-700">
                            <strong>Successful uploads:</strong> {uploadStats.successCount}
                        </p>
                        {uploadStats.failureCount > 0 && (
                            <p className="text-red-600">
                                <strong>Failed uploads:</strong> {uploadStats.failureCount}
                            </p>
                        )}
                        <p className="text-gray-600">
                            <strong>Total size:</strong> {(uploadStats.totalBytes / (1024 * 1024)).toFixed(2)} MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UppyUploader; 