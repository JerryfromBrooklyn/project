# Shmong Face Matching System - Complete Implementation Guide

## 1. System Overview

The Shmong face matching system is an AWS-based facial recognition platform. Users register their faces and can discover photos containing them, either uploaded by themselves or others. The system uses AWS Rekognition for face detection, indexing, and matching, DynamoDB for data storage, and S3 for photo storage. A comprehensive trash system allows users to hide photos from their view without permanent deletion, and an enhanced image viewer provides interactive photo viewing on both desktop and mobile devices.

### 1.1 Core Functionality

*   **User Registration:** Users register with email, password, and a facial scan
*   **Photo Upload:** Users can upload photos through an intuitive drag-and-drop interface
*   **Face Indexing:** System detects faces in uploaded photos and indexes them
*   **Historical Matching:** When users register, a *background task* searches existing photos for matches
*   **Future Matching:** New photo uploads are automatically matched against registered users
*   **Dashboard View:** Central hub with tabs for Home (user info, registration), Matches, Upload, and Trash
*   **My Photos View:** Displays photos where the user has been matched
*   **Uploads View:** Displays photos uploaded by the user
*   **Enhanced Image Viewer:** Full-screen viewer with zoom, rotation, and download capabilities
*   **Trash System:** Allows soft-deletion (hiding) of photos from either the "My Photos" or "Uploads" view, with options to restore or permanently hide
*   **Mobile Optimization:** Responsive design with touch-friendly controls for mobile users

### 1.2 Key Technical Components

*   **AWS Rekognition:** Powers face detection, storage, and matching
*   **AWS DynamoDB:** Stores user data, photo metadata, face matching relationships, and photo visibility status
*   **AWS S3:** Stores uploaded photos
*   **AWS Lambda:** Processes background tasks for matching and indexing
*   **React Frontend:** Provides user interface (Dashboard, MyPhotos, PhotoManager, PhotoGrid, TrashBin, etc.)
*   **TailwindCSS:** Provides consistent, responsive styling
*   **Framer Motion:** Powers smooth animations and transitions
*   **React Dropzone:** Enables drag-and-drop file uploads
*   **Lucide Icons:** Provides consistent iconography throughout the app

## 2. How the Face Matching & Visibility System Works

### 2.1 The Matching Architecture

```
┌─────────────────┐     Registers     ┌─────────────────┐
│                 │  with face scan   │                 │
│      User       ├──────────────────►│ AWS Rekognition │
│ (user ID: U1)   │  (Fast Response)  │    Collection   │
└────────┬────────┘                   │                 │
         │                            │  ┌───────────┐  │
         │                            │  │user_[U1]  │  │
         │ Triggers Async Task        │  └───────────┘  │
         │                            │                 │
         │                            │  ┌───────────┐  │
         │         Uploads            │  │photo_[P1] │  │
         └─────────Photo (P1)─────────►  └───────────┘  │
                   (Uploader: U1)     │                 │
                                      └────────┬────────┘
                                               │
                                               │ Background Task
                                               │ Searches & Updates
                                               ▼
┌─────────────────┐                   ┌─────────────────┐
│                 │                   │                 │
│ DynamoDB Table  │◄──────────────────┤ DynamoDB Table  │
│ shmong-photos   │    Updates        │ shmong-face-data│
│                 │ matched_users[U2] │ (Stores user IDs)│
│ + user_visibility{U1: VISIBLE}      │                 │
└─────────────────┘                   └─────────────────┘
      ▲                                     │
      │ Shows photos based on               │
      │ visibility setting                  │
┌─────┴───────────┐                         │
│ User Interface  │                         │
│ - Dashboard     │─────────────────────────┘
│ - PhotoGrid     │     User U2 Registered
│ - Image Viewer  │     (Matches Photo P1)
└─────────────────┘
```

### 2.2 The Prefix System Explained

The face matching system uses a prefix system to distinguish between user faces and faces detected in photos:

* **User faces:** Indexed with prefix `user_[userId]`
  * Example: `user_abc123` for user with ID abc123
  
* **Photo faces:** Indexed with prefix `photo_[photoId]`
  * Example: `photo_xyz789` for a face detected in photo xyz789

This naming convention allows the system to:
1. Distinguish between reference faces (users) and detected faces (photos)
2. Efficiently search for matches without ambiguity
3. Maintain a clear relationship between faces and their sources

### 2.3 Matching Process Step-by-Step

#### User Registration & Historical Matching:

1. User registers via frontend (`FaceRegistration.js` modal)
2. Face image sent to `shmong-face-register` Lambda
3. Lambda indexes face with `user_[userId]` prefix in Rekognition
4. Lambda stores user's `faceId` in `shmong-face-data` table
5. Lambda **asynchronously triggers** a background task passing `userId` and `faceId`
6. Registration endpoint returns **quickly** to the user
7. **Background Task:**
   * Searches Rekognition (`SearchFaces`) for faces matching the new user's `faceId` (looking for `photo_` prefixes)
   * For each match, updates the corresponding photo's `matched_users` array in `shmong-photos` to include the new `userId`
   * Updates `historicalMatches` in `shmong-face-data` (optional)
   * Sends a notification to the user upon completion (optional)

#### Photo Upload & Future Matching:

1. User uploads photo using the dropzone interface in `PhotoUploader.tsx`
2. Photo stored in S3, metadata stored in `shmong-photos` (with `user_visibility` map initialized with uploader set to `'VISIBLE'`)
3. Rekognition detects faces, indexed with `photo_[photoId]` prefix
4. System performs immediate matching:
   * For each detected face (`photo_` prefix), searches Rekognition for matching `user_` faces
   * Updates the *new photo's* `matched_users` array with the `userId` of each valid match
5. Matched users will see this photo in their "My Photos" view (via `<MyPhotos />` component)

### 2.4 Photo Visibility & Trash System

The system uses a user-specific visibility map stored in DynamoDB to control what each user sees:

```javascript
// Example DynamoDB item in shmong-photos table
{
  "id": "photo-123",
  "user_id": "user-who-uploaded-it",
  "upload_date": "2023-09-15T14:30:00Z",
  "url": "https://s3.bucket.com/photos/photo-123.jpg",
  "faces": [
    { "id": "face-456", "faceId": "AWS-face-id-1", "boundingBox": {...} },
    { "id": "face-789", "faceId": "AWS-face-id-2", "boundingBox": {...} }
  ],
  "matched_users": ["user-1", "user-2"],
  "user_visibility": {
    "user-1": "VISIBLE",  // This user sees the photo normally
    "user-2": "TRASH",    // This user has moved it to trash
    "user-3": "HIDDEN"    // This user has permanently hidden it
  }
}
```

#### Visibility Control Flow:

1. **Viewing Photos:**
   * `MyPhotos.jsx` and `PhotoManager.js` use `awsPhotoService.getVisiblePhotos()`
   * This function filters out photos where `user_visibility[userId] !== 'VISIBLE'`
   * Result: Users only see photos they haven't trashed or hidden

2. **Trashing Photos:**
   * User clicks trash icon on a photo in grid view or full-screen viewer
   * `userVisibilityService.movePhotosToTrash(photoId, userId)` is called
   * This updates the photo's `user_visibility` map: `user_visibility[userId] = 'TRASH'`
   * Photo immediately disappears from normal view

3. **Managing Trash:**
   * User navigates to Trash tab in Dashboard
   * `TrashBin.jsx` loads trashed photos using `awsPhotoService.fetchPhotosByVisibility(userId, 'all', 'TRASH')`
   * User can filter between "Trashed Uploads" and "Trashed Matches"
   * Options to restore (`user_visibility[userId] = 'VISIBLE'`) or permanently hide (`user_visibility[userId] = 'HIDDEN'`)

## 3. UI Components and User Experience

### 3.1 Dashboard and Navigation

The Dashboard provides a tabbed interface for navigating the application:

1. **Home Tab**: Displays user information and face registration status
2. **Matches Tab**: Shows photos where the user has been recognized
3. **Upload Tab**: Provides interface for uploading and managing photos
4. **Trash Tab**: Allows users to view and manage trashed photos

The Dashboard is implemented in `Dashboard.jsx` and serves as the central navigation hub for the application.

### 3.2 Enhanced PhotoGrid Component

The PhotoGrid component (`PhotoGrid.js`) provides a visually appealing and interactive way to display photos:

- **Responsive Grid Layout**: Adapts to different screen sizes
- **Hover Actions**: Reveals action buttons on hover
- **Quick Actions**: Download, share, view info, and trash options
- **Animation Effects**: Smooth transitions when photos are added or removed
- **Empty State Handling**: Displays appropriate messages when no photos are available
- **Match Count Badges**: Shows the number of matched faces in each photo

```jsx
// PhotoGrid.js key structure
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {photos.map(photo => (
    <motion.div 
      key={photo.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      {/* Photo thumbnail - clickable */}
      <div className="aspect-square" onClick={() => handlePhotoClick(photo)}>
        <img src={photo.url} alt={photo.title} />
      </div>
      
      {/* Face/match count badge */}
      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-blue-500/80">
        <Users className="w-4 h-4" />
        {photo.matched_users?.length || photo.faces?.length} 
      </div>
      
      {/* Hover overlay with action buttons */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100">
        <div className="flex justify-between">
          {/* Download, Share, Info, Trash buttons */}
        </div>
      </div>
    </motion.div>
  ))}
</div>
```

### 3.3 Full-Screen Image Viewer

The image viewer in `PhotoUploader.tsx` provides a rich viewing experience:

- **Top Control Bar**: Contains buttons for download, info, trash, and close
- **Image Display**: Shows the full image with support for zooming and rotation
- **Bottom Info Bar**: Displays file information and additional controls
- **Mobile Optimization**: Touch-friendly controls and responsive layout
- **Native Integration**: Uses Web Share API when available for sharing

```jsx
// Image Viewer Modal in PhotoUploader.tsx
<motion.div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col touch-none">
  {/* Top Controls */}
  <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
    <h2 className="text-lg font-medium text-white truncate max-w-[200px] sm:max-w-sm">
      {viewerImage.file.name}
    </h2>
    <div className="flex items-center space-x-2">
      {/* Download, Info, Trash, Close buttons */}
    </div>
  </div>
  
  {/* Image Container with touch support */}
  <div className="flex-1 flex items-center justify-center overflow-hidden touch-pan-y">
    <div 
      style={{
        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease'
      }}
    >
      <img
        src={viewerImage.previewUrl || viewerImage.s3Url}
        alt={viewerImage.file.name}
        className="max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] object-contain"
        draggable={false}
      />
    </div>
  </div>
  
  {/* Bottom Controls */}
  <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/70 to-transparent">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* File info */}
      <div className="text-white text-sm">
        {(viewerImage.file.size / 1024 / 1024).toFixed(2)} MB • 
        {viewerImage.file.type.split('/')[1].toUpperCase()}
      </div>
      
      {/* Control buttons */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
        {/* Zoom, Rotate, Fullscreen, Share buttons */}
      </div>
    </div>
  </div>
</motion.div>
```

### 3.4 PhotoUploader Component

The PhotoUploader component provides a smooth upload experience:

- **Drag and Drop Interface**: User-friendly file selection
- **Upload Progress Visualization**: Real-time progress indicators
- **Image Preview Grid**: Shows thumbnails of uploaded photos
- **Metadata Form**: Collects additional information about the uploads
- **Storage Usage Indicator**: Shows used storage space

```jsx
// PhotoUploader.tsx upload interface
<div
  {...getRootProps()}
  className={cn(
    "mt-4 p-10 border-2 border-dashed rounded-apple-xl text-center transition-colors",
    isDragActive 
      ? "border-apple-blue-500 bg-apple-blue-50" 
      : "border-apple-gray-200 bg-apple-gray-50"
  )}
>
  <input {...getInputProps()} />
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
    <Upload className="w-8 h-8 text-apple-gray-500" />
  </div>
  <p className="text-apple-gray-500 mb-2">
    {isDragActive
      ? "Drop the photos or folders here"
      : "Drag and drop photos or folders here, or click to select"}
  </p>
  <p className="text-apple-gray-400 text-sm">
    Supported formats: JPG, PNG, WebP, RAW • Max 100MB per file
  </p>
</div>
```

### 3.5 TrashBin Component

The TrashBin component manages trashed photos with a user-friendly interface:

- **View Toggle**: Switch between "Trashed Uploads" and "Trashed Matches"
- **Selection Capability**: Select multiple photos for batch actions
- **Action Buttons**: Restore or permanently hide selected photos
- **Empty State Handling**: Displays a message when the trash is empty
- **Consistent Grid View**: Uses the same PhotoGrid component for display

```jsx
// TrashBin.jsx core functionality
const TrashBin = () => {
  const [activeView, setActiveView] = useState('uploaded');
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  
  // Fetch trashed photos based on activeView
  useEffect(() => {
    fetchTrashedPhotos();
  }, [activeView]);
  
  return (
    <div>
      {/* View toggle */}
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setActiveView('uploaded')}>
          Trashed Uploads
        </button>
        <button onClick={() => setActiveView('matched')}>
          Trashed Matches
        </button>
      </div>
      
      {/* Action buttons for selected photos */}
      <div className="flex space-x-4 mb-4">
        <button onClick={handleRestore}>
          Restore Selected
        </button>
        <button onClick={handleDelete}>
          Permanently Hide Selected
        </button>
      </div>
      
      {/* Photos grid with selection capability */}
      <PhotoGrid
        photos={photos}
        onSelect={handleSelectPhoto}
        selectedIds={selectedPhotos}
      />
    </div>
  );
};
```

### 3.6 Mobile Experience

The application is fully responsive and optimized for mobile devices:

- **Responsive Layouts**: Adapts to different screen sizes
- **Touch-Friendly Controls**: Larger tap targets for mobile
- **Swipe Support**: Natural gesture support for image navigation
- **Native Integration**: Uses Web Share API for native sharing on mobile
- **Simplified Controls**: Contextual controls based on device capabilities
- **Performance Optimization**: Lazy loading and efficient rendering for mobile

Mobile optimizations include:

1. **Simplified Grids**: Changes column count based on screen size
2. **Touch Controls**: Supports pinch-to-zoom and swipe gestures
3. **Adaptive Layouts**: Stacks controls vertically on smaller screens
4. **Native Interactions**: Uses device capabilities when available

## 4. Technical Implementation Details

### 4.1 Photo Visibility System (DynamoDB)

Photos in the system have a user-specific visibility status stored in a map:

```javascript
// Example DynamoDB structure in shmong-photos table
{
  "id": "photo-123",
  "user_id": "uploader-id",
  "url": "https://s3.bucket/photos/photo-123.jpg",
  "faces": [...],
  "matched_users": ["user-1", "user-2"],
  "user_visibility": {
    "user-1": "VISIBLE",   // This user sees the photo
    "user-2": "TRASH",     // This user moved it to trash
    "user-3": "HIDDEN"     // This user permanently hid it
  }
}
```

This design allows each user to have a personalized view of the photo collection without affecting other users.

### 4.2 Trash System Implementation

The trash system architecture relies on the user_visibility map:

1. **Moving to Trash**: `user_visibility[userId] = "TRASH"`
2. **Restoring**: `user_visibility[userId] = "VISIBLE"`
3. **Permanently Hiding**: `user_visibility[userId] = "HIDDEN"`
4. **Viewing Photos**: Only show photos where `user_visibility[userId] === "VISIBLE"`
5. **Viewing Trash**: Show photos where `user_visibility[userId] === "TRASH"`

Key service functions:

```javascript
// userVisibilityService.js
export const movePhotosToTrash = async (photoIds, userId) => {
  // Update DynamoDB items to set user_visibility[userId] = "TRASH"
};

export const restorePhotosFromTrash = async (photoIds, userId) => {
  // Update DynamoDB items to set user_visibility[userId] = "VISIBLE"
};

export const permanentlyHidePhotos = async (photoIds, userId) => {
  // Update DynamoDB items to set user_visibility[userId] = "HIDDEN"
};
```

### 4.3 Image Viewer Implementation

The image viewer uses several technologies for a smooth experience:

1. **Framer Motion**: For animations and transitions
2. **FileReader API**: For generating image previews
3. **Web Share API**: For native sharing on supported devices
4. **Fullscreen API**: For toggle fullscreen viewing
5. **Touch Events**: For mobile gesture support

Key features:

```jsx
// In PhotoUploader.tsx
// Generate preview URLs for images
const generatePreviewUrl = useCallback((file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}, []);

// Handle image download
const handleDownload = async (upload: UploadItem) => {
  const url = upload.s3Url || upload.previewUrl;
  const a = document.createElement('a');
  a.href = url;
  a.download = upload.file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Toggle fullscreen
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// Native sharing (with fallback)
const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: viewerImage.file.name,
      url: viewerImage.s3Url
    }).catch(() => {
      // Fallback to download if sharing fails
      handleDownload(viewerImage);
    });
  } else {
    // Fallback for browsers without Web Share API
    handleDownload(viewerImage);
  }
};
```

## 5. Recent Improvements

### 5.1 Enhanced Image Viewer

The image viewer has been enhanced with:

1. **Interactive Controls**: Zoom, rotate, fullscreen toggle
2. **Mobile Optimization**: Touch-friendly design and controls
3. **Top/Bottom Control Bars**: Accessible actions with gradient backgrounds
4. **Improved Image Sizing**: Better fit for different screen sizes
5. **Download Integration**: Better handling of file downloads
6. **Native Sharing**: Integration with the Web Share API

### 5.2 Mobile User Experience

Mobile optimizations include:

1. **Responsive Layouts**: Adaptive grids and flexbox layouts
2. **Touch Event Handling**: Support for gestures like pinch-to-zoom
3. **Device-Specific Features**: Integration with native capabilities
4. **Performance Enhancements**: Optimized rendering and loading
5. **Simplified Controls**: Context-appropriate UI for smaller screens

### 5.3 UI Consistency and Animation

UI improvements include:

1. **Consistent Component Styles**: Unified design language
2. **Animation Patterns**: Standardized transitions and effects
3. **Loading States**: Better feedback during async operations
4. **Error Handling**: Improved error messaging and recovery
5. **Empty States**: Helpful messaging when no content is available

## 6. Next Steps & Future Enhancements

1. **Implement Asynchronous Historical Matching:** Create and deploy the background Lambda (`shmong-historical-matcher`) to improve registration performance.
2. **Enhanced Notifications:** Add notifications for completed background tasks.
3. **Additional Image Viewer Features:** Add basic editing capabilities (crop, filter, adjust).
4. **Advanced Search & Filter:** Implement more powerful search capabilities.
5. **Performance Optimization:** Further improve loading times and responsiveness.
6. **Accessibility Improvements:** Enhance keyboard navigation and screen reader support.
7. **Advanced Trash Management:** Add auto-restoration and custom retention periods.
8. **Expanded Sharing Options:** More flexible sharing capabilities with permissions.

## 7. Conclusion

The Shmong face matching system provides a comprehensive solution for photo management with facial recognition. The enhanced user interface with the modern image viewer and mobile-optimized experience delivers a seamless photo management solution for users across all devices.

The combination of powerful AWS backend services with a refined React frontend creates a robust yet user-friendly application that efficiently handles photo uploads, face matching, and visibility management. 