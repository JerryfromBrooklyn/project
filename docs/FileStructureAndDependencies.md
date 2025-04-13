# Shmong Project - File Structure and Dependencies Map

## Project Structure Overview

The Shmong project is organized into a modular structure with clear separation of concerns. Below is a comprehensive map of the file structure and dependencies.

## Directory Structure

```
src/
├── components/           # UI Components Directory
│   ├── Dashboard.jsx     # MAIN DASHBOARD COMPONENT (primary user interface with tabs)
│   ├── MyPhotos.jsx      # Photo gallery component for matched photos
│   ├── PhotoManager.js   # Component for displaying Uploaded Photos
│   ├── PhotoGrid.js      # Reusable grid for displaying photo cards with actions
│   ├── PhotoUploader.tsx # Photo upload and image viewer functionality
│   ├── FaceRegistration.js # Component for face registration modal
│   ├── TrashBin.jsx      # Component for viewing/managing trashed photos
│   ├── SimplePhotoInfoModal.jsx # Modal for displaying photo information
│   ├── Navigation.jsx    # Navigation bar component (If separate from Dashboard tabs)
│   ├── ui/               # Reusable UI components
│   │   ├── Button.jsx    # Button components with consistent styling
│   │   ├── Card.jsx      # Card component for UI elements
│   │   ├── Tabs.jsx      # Tabbed interface components
│   │   └── ...
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components (LandingPage, Dashboard, etc.)
│   └── utils/            # Utility functions and helpers
├── services/             # Business Logic Services
│   ├── FaceIndexingService.js  # AWS Rekognition integration for face indexing
│   ├── faceMatchingService.js  # Core face matching logic
│   ├── awsPhotoService.js      # Photo fetching, upload, processing, and trash management
│   ├── userVisibilityService.js# Handles photo visibility status (VISIBLE, TRASH, HIDDEN)
│   ├── FaceStorageService.js   # Face data storage and retrieval
│   └── PhotoService.js         # Client-side photo operations (download, etc.)
├── types.ts              # TypeScript type definitions
├── config.js             # Application configuration
├── App.jsx               # Main application component (Handles routing)
├── main.jsx              # Application entry point
└── index.css             # Global styles and Tailwind CSS entry point
```

## Key Component: Dashboard

The **Dashboard component (`src/components/Dashboard.jsx`)** is the central UI component of the application. It provides tab-based navigation to different sections:

1. **Home**: User information and face registration
2. **Matches**: Photos where the user has been recognized
3. **Upload**: Interface for uploading and managing photos
4. **Trash**: View and manage trash photos

## Dependency Relationships

### Dashboard Dependencies (`Dashboard.jsx`)

```
Dashboard.jsx
├── Service Dependencies:
│   ├── FaceStorageService.js     # For getting registered face status
│   └── AuthContext.jsx           # For user authentication info
│
├── Component Dependencies:
│   ├── FaceRegistration.js       # Rendered in Home tab for face setup
│   ├── MyPhotos.jsx              # Rendered for 'Matches' tab
│   ├── PhotoManager.js           # Rendered for 'Uploads' tab
│   ├── TrashBin.jsx              # Rendered for 'Trash' tab
│   └── ui/Tabs.jsx               # For tabbed navigation
└── userVisibilityService.js  # For restore/delete handlers
```

### Photo Display Components

```
MyPhotos.jsx (Displays Matched Photos)
├── Service Dependencies:
│   ├── awsPhotoService.js        # Uses getVisiblePhotos(userId, 'matched')
│   ├── userVisibilityService.js  # Uses movePhotosToTrash
│   └── AuthContext.jsx           # For user authentication
├── Component Dependencies:
│   └── PhotoGrid.js              # Renders the photo grid with interactive elements

PhotoManager.js (Displays Uploaded Photos)
├── Service Dependencies:
│   ├── awsPhotoService.js        # Uses fetchUploadedPhotos, getVisiblePhotos
│   ├── userVisibilityService.js  # Uses movePhotosToTrash
│   └── AuthContext.jsx           # For user authentication
├── Component Dependencies:
│   ├── PhotoUploader.tsx         # For uploading new photos
│   └── PhotoGrid.js              # For displaying uploaded photos

PhotoGrid.js (Reusable Grid Component)
├── Service Dependencies:
│   └── PhotoService.js           # For photo downloads (if not handled by parent)
├── Component Dependencies:
│   └── SimplePhotoInfoModal.jsx  # For displaying photo details
├── Utility Dependencies:
│   └── cn.js                     # For conditional class names

PhotoUploader.tsx (Photo Upload + Image Viewer)
├── Service Dependencies:
│   ├── awsPhotoService.js        # For uploading photos and trash function
│   └── AuthContext.jsx           # For user info (optional, may be passed as props)
├── Library Dependencies:
│   ├── react-dropzone            # For drag-and-drop file uploads
│   ├── framer-motion             # For animations
│   └── lucide-react              # For icons
```

### Service Inter-dependencies

```
awsPhotoService.js
├── Depends on:
│   ├── lib/awsClient.js          # For AWS SDK configuration
│   ├── FaceStorageService.js     # For getting user face data
│   └── userVisibilityService.js  # For filtering based on visibility
│
└── Used by:
    ├── MyPhotos.jsx
    ├── PhotoManager.js
    ├── PhotoUploader.tsx
    └── TrashBin.jsx

userVisibilityService.js
├── Depends on:
│   └── lib/awsClient.js          # For DynamoDB client
│
└── Used by:
    ├── MyPhotos.jsx
    ├── PhotoManager.js
    ├── TrashBin.jsx
    ├── Dashboard.tsx             # For handling restore/delete actions
    └── awsPhotoService.js        # For visibility filtering

FaceIndexingService.js
├── Depends on:
│   ├── lib/awsClient.js
│   └── FaceStorageService.js
│
└── Used by:
    ├── FaceRegistration.js
    ├── awsPhotoService.js        # For photo face detection/indexing
    └── faceMatchingService.js

FaceStorageService.js
├── Depends on:
│   └── lib/awsClient.js          # For AWS SDK or Storage API
│
└── Used by:
    ├── FaceIndexingService.js
    ├── Dashboard.jsx
    ├── awsPhotoService.js
    └── faceMatchingService.js
```

## Application Flow

1. The application initializes through `main.jsx`
2. The App component (`App.jsx`) sets up routing and context providers (`AuthContext`)
3. For authenticated users, the **Dashboard component** (`src/components/Dashboard.jsx`) is loaded
4. The Dashboard displays tabs: Home, Matches, Upload, Trash
5. The Home tab shows user info and face registration status/actions
6. The Matches tab renders the `<MyPhotos />` component, which fetches and displays matched photos using `awsPhotoService`
7. The Upload tab renders the `<PhotoManager />` component with the `<PhotoUploader />` component
8. The Trash tab renders the `<TrashBin />` component, showing trashed items with options to toggle between uploads and matches

## User Interaction Flows

### Photo Upload Flow

1. User navigates to Upload tab
2. User interacts with the dropzone in `PhotoUploader.tsx`:
   - Drags and drops files
   - Clicks to select files
3. Uploaded files display with preview and progress indicators
4. User can enter metadata in the form
5. Upload completes and photos appear in the grid

### Image Viewing Flow

1. User clicks on a thumbnail in `PhotoGrid.js` or `PhotoUploader.tsx`
2. Full-screen image viewer opens with controls:
   - Top bar: Download, Info, Trash, Close buttons
   - Bottom bar: File info, zoom controls, rotation, fullscreen toggle
3. User can:
   - Zoom in/out
   - Rotate the image
   - Toggle fullscreen mode
   - Download or share the image
   - Move the image to trash
   - View image information
4. User clicks close to return to the previous screen

### Trash Management Flow

1. User navigates to Trash tab
2. `TrashBin.jsx` loads with toggle between "Trashed Uploads" and "Trashed Matches"
3. User can:
   - Select photos
   - Restore selected photos
   - Permanently hide selected photos
4. Changes are reflected immediately in the UI

## Key UI Components and Functions

### Dashboard

```jsx
// Dashboard.jsx
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="trash">Trash</TabsTrigger>
      </TabsList>
      
      <TabsContent value="home">
        <HomeContent />
        <FaceRegistration />
      </TabsContent>
      
      <TabsContent value="matches">
        <MyPhotos />
      </TabsContent>
      
      <TabsContent value="upload">
        <PhotoManager />
      </TabsContent>
      
      <TabsContent value="trash">
        <TrashBin />
      </TabsContent>
    </Tabs>
  );
};
```

### PhotoGrid

```jsx
// PhotoGrid.js - Key functionality
const PhotoGrid = ({ photos, onDelete, onShare, onDownload, onTrash }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Photo card rendering with hover effects
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <motion.div key={photo.id} /* animation props */>
            {/* Photo card with hover effects and action buttons */}
            <div className="aspect-square rounded-apple-xl overflow-hidden">
              <img src={photo.url} alt={photo.title} />
            </div>
            
            {/* Hover overlay with action buttons */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100">
              <div className="flex justify-between items-center">
                {/* Download, Share buttons */}
                {/* Info, Trash buttons */}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Photo info modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <SimplePhotoInfoModal 
            photo={selectedPhoto} 
            onClose={() => setSelectedPhoto(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};
```

### PhotoUploader

```tsx
// PhotoUploader.tsx - Key functionality
const PhotoUploader = ({ onUploadComplete, onError }) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [viewerImage, setViewerImage] = useState<UploadItem | null>(null);
  
  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      // Process dropped files
      // Generate previews
      // Show metadata form
    },
    // Configuration options
  });
  
  return (
    <div>
      {/* Dropzone */}
      <div {...getRootProps()} className="border-dashed border-2 p-10 text-center">
        <input {...getInputProps()} />
        <p>Drag and drop photos, or click to select</p>
      </div>
      
      {/* Upload list/grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {uploads.map((upload) => (
          <div key={upload.id} className="relative">
            {/* Thumbnail that opens viewer when clicked */}
            <div onClick={() => setViewerImage(upload)}>
              <img src={upload.previewUrl} alt={upload.file.name} />
            </div>
            
            {/* Progress indicator, status, etc. */}
          </div>
        ))}
      </div>
      
      {/* Image viewer modal */}
      <AnimatePresence>
        {viewerImage && (
          <motion.div className="fixed inset-0 z-50 bg-black/90">
            {/* Image viewer with controls */}
            {/* Top bar with actions */}
            {/* Image with zoom/rotate */}
            {/* Bottom bar with info */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## Technology Stack

- Frontend: React with JavaScript/TypeScript
- Cloud Services: AWS (S3, Rekognition, DynamoDB)
- UI Libraries:
  - TailwindCSS for styling
  - Framer Motion for animations
  - Lucide for icons
  - React Dropzone for file uploads

## Important Design Patterns

1. **Component Composition**:
   - PhotoGrid is a reusable component used by both MyPhotos and TrashBin
   - Each component has a single responsibility

2. **Context and Services**:
   - AuthContext for user authentication
   - Service layer for business logic
   - Clear separation of UI and data concerns

3. **Responsive Design**:
   - Mobile-first approach using TailwindCSS breakpoints
   - Adaptive layouts for different screen sizes
   - Touch-friendly controls for mobile

4. **Animations and Transitions**:
   - Framer Motion for smooth animations
   - Consistent animation patterns for modals, lists, and UI interactions

5. **Visibility Control**:
   - User-specific visibility system
   - Photos can be VISIBLE, TRASH, or HIDDEN per user
   - Consistent filtering across components

## Important Notes

- The **Dashboard component (`Dashboard.jsx`)** acts as the main container and tab navigator.
- **`MyPhotos.jsx`** is now responsible for displaying matched photos.
- **`PhotoManager.js`** displays uploaded photos and overall counts.
- **`PhotoGrid.js`** is a reusable component for displaying photo cards.
- **`awsPhotoService.js`** and **`userVisibilityService.js`** handle core photo fetching, filtering, and visibility management.
- Search and complex filtering have been removed from `MyPhotos` and `PhotoManager` for simplification.
- Photo sorting (newest first) is implemented in fetching/display components.
- Face registration includes a **synchronous historical matching** step that can be slow (planned for asynchronous improvement).
- **File extensions**: Components using JSX syntax **must** have `.jsx` or `.tsx` extensions. Vite requires these extensions for correctly parsing JSX, otherwise build errors will occur (as seen with `LandingPage.js` vs `LandingPage.tsx`). Regular JavaScript files without JSX should use the `.js` extension. `LandingPage.js` was removed due to this requirement.

## Alternative Dashboards

The system also provides an alternative Apple-styled dashboard in `src/components/AppleDashboard.tsx`, which provides the same core functionality with a different visual design.

## Technology Stack

- Frontend: React with both JavaScript and TypeScript
- Cloud Services: AWS (S3, Rekognition, DynamoDB)
- Optional Backend: Supabase (as indicated by supabaseClient.ts)

## Important Notes

- The **Dashboard component is the primary UI entry point** for users interacting with the face matching system
- Multiple service implementations exist with both JavaScript and TypeScript versions
- The application follows a service-oriented architecture with clear separation between UI components and business logic services 

## Component Dependencies

### Page Components
- `LandingPage` (in `src/pages/LandingPage.tsx`)
  - Dependencies: `AuthForms`, `Header`, UI components
  - Description: Entry point for unauthenticated users, contains marketing content and authentication forms

- `Dashboard` (in `src/pages/Dashboard.tsx`)
  - Dependencies: `PhotoUploader`, `PhotoGrid`, `Header`, `UserMenu`, `FaceRegistration`, `TrashBin`
  - Services: `awsPhotoService`, `userVisibilityService`
  - Description: Main interface after login where users manage photos and face registration 