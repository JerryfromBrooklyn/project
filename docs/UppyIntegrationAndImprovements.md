# Uppy Integration and Improvements

## Overview
This document outlines the integration of Uppy for file uploads and the improvements made to the existing upload flow.

## UI Implementation Details

### Dashboard Component
The main UI is implemented using Uppy's Dashboard component, which provides a complete interface for file uploads:

```javascript
<Dashboard
  uppy={uppy}
  plugins={['ImageEditor', 'Dropbox', 'GoogleDrive', 'Url']}
  width="100%"
  height={400}
  showProgressDetails={true}
  proudlyDisplayPoweredByUppy={false}
  note="Supported formats: JPG, PNG, WebP, RAW • Max 100MB per file"
  metaFields={[
    { id: 'folderPath', name: 'Folder Path', placeholder: 'Optional folder path' }
  ]}
/>
```

### Cloud Storage Integration
The application integrates with various cloud storage providers:

1. **Dropbox Integration**
```javascript
.use(DropboxPlugin, {
  companionUrl: process.env.REACT_APP_COMPANION_URL,
  companionHeaders: {
    Authorization: `Bearer ${user?.accessToken}`,
  },
  companionAllowedHosts: ['localhost:3020', 'localhost:3000']
})
```

2. **Google Drive Integration**
```javascript
.use(GoogleDrivePlugin, {
  companionUrl: process.env.REACT_APP_COMPANION_URL,
  companionHeaders: {
    Authorization: `Bearer ${user?.accessToken}`,
  },
  companionAllowedHosts: ['localhost:3020', 'localhost:3000']
})
```

3. **URL Import**
```javascript
.use(UrlPlugin, {
  companionUrl: process.env.REACT_APP_COMPANION_URL,
  companionHeaders: {
    Authorization: `Bearer ${user?.accessToken}`,
  }
})
```

### UI Features

1. **Drag and Drop Zone**
- Built-in drag and drop functionality
- Visual feedback during drag
- File type validation on drop
- Multiple file support

2. **File Browser**
- Native file picker integration
- Folder upload support
- File filtering by type
- Preview generation

3. **Progress UI**
```javascript
// Progress tracking
uppy.on('upload-progress', (file, progress) => {
  const progressPercentage = (progress.bytesUploaded / progress.bytesTotal) * 100;
  // Update UI with progress
});

// Progress bar implementation
<div className="h-2 bg-apple-gray-100 rounded-full overflow-hidden">
  <div 
    className="h-full bg-apple-blue-500 transition-all duration-300"
    style={{ width: `${progressPercentage}%` }}
  />
</div>
```

4. **Status Indicators**
- Upload progress
- Success/error states
- File count
- Total size
- Remaining storage

### Storage Usage Display
```javascript
<div className="flex items-center justify-between mb-2">
  <span className="text-sm font-medium text-gray-700">Storage Usage</span>
  <span className="text-sm text-gray-500">
    {(totalStorage / 1024 / 1024 / 1024).toFixed(2)}GB of 10GB
  </span>
</div>
```

### View Modes
The UI supports different view modes for uploaded files:
1. **Grid View**
   - Thumbnail previews
   - Quick actions
   - Status indicators

2. **List View**
   - Detailed file information
   - Progress tracking
   - Action buttons

### Error Handling UI
```javascript
uppy.on('upload-error', (file, error) => {
  // Display error in UI
  <div className="bg-red-50 p-4 rounded-md">
    <p className="text-red-700">{error.message}</p>
  </div>
});
```

### Companion Server Requirements
To enable cloud integrations, the Companion server needs:

1. **Environment Variables**
```env
COMPANION_HOST=localhost:3020
COMPANION_PROTOCOL=http
COMPANION_SECRET=your_secret
DROPBOX_KEY=your_dropbox_key
DROPBOX_SECRET=your_dropbox_secret
GOOGLE_KEY=your_google_key
GOOGLE_SECRET=your_google_secret
```

2. **OAuth Configuration**
- Dropbox app configuration
- Google Cloud project setup
- Proper redirect URIs
- CORS settings

### Mobile Responsiveness
The UI is fully responsive with:
- Touch-friendly controls
- Adaptive layouts
- Proper spacing for touch targets
- Mobile-optimized previews

## Current Implementation
The current implementation uses Uppy with a hybrid approach:
- Uppy handles the UI and file management
- `awsPhotoService` handles S3 upload parameters
- Image editing capabilities are integrated
- Progress tracking and error handling are in place

## Key Features
1. **File Upload**
   - Multipart upload support
   - Concurrent uploads (6 files at once)
   - Automatic retries
   - Progress tracking
   - File type validation
   - Size limits (100MB per file)

2. **Image Processing**
   - Built-in image editor
   - Quality control (0.9)
   - Cropping capabilities
   - Preview before upload

3. **User Interface**
   - Drag and drop support
   - File previews
   - Progress bars
   - Error messages
   - Success notifications

## Technical Details

### Configuration
```javascript
const uppyInstance = new Uppy({
  id: 'photo-uploader',
  autoProceed: false,
  restrictions: {
    maxFileSize: 100 * 1024 * 1024,
    allowedFileTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.raw', '.cr2', '.nef', '.arw', '.rw2']
  },
  meta: {
    userId: user?.id
  }
})
```

### Plugins
1. **AwsS3Multipart**
   - Handles S3 uploads
   - Concurrent uploads
   - Retry mechanism
   - Progress tracking

2. **ImageEditor**
   - Image cropping
   - Quality adjustment
   - Preview functionality

### Event Handling
```javascript
uppyInstance.on('file-added', (file) => {
  // Handle new files
});

uppyInstance.on('upload-progress', (file, progress) => {
  // Track upload progress
});

uppyInstance.on('upload-success', async (file, response) => {
  // Handle successful uploads
});

uppyInstance.on('upload-error', (file, error) => {
  // Handle upload errors
});
```

## Improvements Over Previous Implementation

1. **Upload Reliability**
   - Multipart upload support
   - Automatic retries
   - Better error handling
   - Progress tracking

2. **User Experience**
   - Better UI components
   - Image editing before upload
   - Real-time progress
   - Better error messages

3. **Performance**
   - Concurrent uploads
   - Chunked uploads
   - Better memory management
   - Faster uploads for large files

4. **Features**
   - Image editing
   - File previews
   - Drag and drop
   - Progress tracking
   - Error handling

## Integration with Existing System

### Metadata Handling
```javascript
{
  user_id: user?.id,
  uploadedBy: user?.id,
  uploaded_by: user?.id,
  externalAlbumLink: metadata.albumLink
}
```

### S3 Integration
- Uses existing S3 bucket
- Maintains current file structure
- Preserves metadata
- Handles visibility settings

## Future Improvements

1. **Performance Optimization**
   - Use Uppy's native S3 upload
   - Implement direct upload to S3
   - Reduce server load

2. **UI Enhancements**
   - Custom theme
   - Better progress indicators
   - More file information
   - Better error messages

3. **Feature Additions**
   - Batch processing
   - More image editing options
   - File organization
   - Better metadata handling

## Best Practices

1. **File Handling**
   - Validate file types
   - Check file sizes
   - Handle errors gracefully
   - Clean up resources

2. **User Experience**
   - Show clear progress
   - Provide feedback
   - Handle errors clearly
   - Support retries

3. **Performance**
   - Use multipart uploads
   - Implement retries
   - Handle large files
   - Manage memory

## Troubleshooting

1. **Common Issues**
   - File size limits
   - Network errors
   - S3 permissions
   - Memory issues

2. **Solutions**
   - Check file size
   - Verify permissions
   - Monitor memory
   - Handle retries

## Conclusion
The Uppy integration provides a robust, user-friendly file upload solution with improved reliability and features over the previous implementation. Future improvements can further enhance performance and user experience. 