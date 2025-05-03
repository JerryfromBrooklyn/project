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
│   ├── awsPhotoService.js      # Photo upload, metadata processing (incl. event data), Rekognition analysis, DB saving
│   ├── userVisibilityService.js# Handles photo visibility status (VISIBLE, TRASH, HIDDEN)
│   ├── FaceStorageService.js   # Face data storage and retrieval, image analysis functions
│   └── PhotoService.js         # Client-side photo operations (download, etc.)
├── types.ts              # TypeScript type definitions
├── config.js             # Application configuration
├── App.jsx               # Main application component (Handles routing)
├── main.jsx              # Application entry point
└── index.css             # Global styles and Tailwind CSS entry point
```

## Key Component: Dashboard

The **Dashboard component (`src/pages/Dashboard.tsx`)** is the central UI component of the application. It provides tab-based navigation to different sections:

1. **Home**: User information and face registration
2. **Photos**: Photos where the user has been recognized (Previously 'Matches')
3. **Upload**: Interface for uploading and managing photos
4. **Trash**: View and manage trash photos
5. **Events**: *Temporarily unavailable* - This tab is currently hidden or displays a placeholder while functionality is being improved.

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
│   └── SimplePhotoInfoModal.jsx  # Modal for displaying photo details (incl. Event Info, Analysis, Faces)
├── Utility Dependencies:
│   └── cn.js                     # For conditional class names

PhotoUploader.tsx (Photo Upload + Image Viewer)
├── Service Dependencies:
│   ├── awsPhotoService.js        # For uploading photos (incl. formatted event metadata) and trash function
│   └── AuthContext.jsx           # For user info (optional, may be passed as props)
├── Component Dependencies:
│   └── SimplePhotoInfoModal.jsx  # Image viewer/details modal used here and in PhotoGrid
│
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
│   ├── FaceStorageService.js     # For getting user face data & image analysis
│   └── userVisibilityService.js  # For filtering based on visibility
│
└── Used by:
    ├── MyPhotos.jsx
    ├── PhotoManager.js
    ├── PhotoUploader.tsx         # Sends formatted metadata including event details
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
│   └── (Contains image analysis logic - analyzeImageWithDetectLabels, determineSkinTone)
│
└── Used by:
    ├── FaceIndexingService.js
    ├── Dashboard.jsx
    ├── awsPhotoService.js
    ├── faceMatchingService.js
    └── SimplePhotoInfoModal.jsx  # For fetching complete photo data including analysis
```

## Application Flow

1. The application initializes through `main.jsx`
2. The App component (`App.jsx`) sets up routing and context providers (`AuthContext`)
3. For authenticated users, the **Dashboard component** (`src/pages/Dashboard.tsx`) is loaded
4. The Dashboard displays tabs: Home, Photos (Matches), Upload, Trash. The Events tab is temporarily hidden/disabled.
5. The Home tab shows user info and face registration status/actions
6. The Photos tab renders the `<MyPhotos />` component, which fetches and displays matched photos using `awsPhotoService`
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
2. `SimplePhotoInfoModal.jsx` opens, showing the image initially.
3. User can:
   - Toggle to the 'Details' view to see metadata, analysis, etc.
   - Toggle back to the 'Image' view.
   - Use the **Share** button (triggers native Web Share API).
   - Use the **Download** button.
   - Use the **Close** button.
4. On mobile, the action buttons (Details/Image, Share, Download, Close) are arranged in a responsive 2x2 grid. On larger screens, they appear in a horizontal row.
5. User clicks close ('X' icon or Close button) to return to the previous screen.

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

## Critical Implementation Notes and Common Pitfalls

### DynamoDB Pagination Requirements

When working with the AWS services, especially in `awsPhotoService.js`, always implement proper pagination for DynamoDB operations:

```javascript
// CORRECT: Implementing pagination for DynamoDB scans/queries
let allItems = [];
let lastEvaluatedKey;

do {
  const scanParams = {
    TableName: PHOTOS_TABLE,
    ExclusiveStartKey: lastEvaluatedKey
  };
  
  const response = await docClient.send(new ScanCommand(scanParams));
  allItems = [...allItems, ...response.Items];
  lastEvaluatedKey = response.LastEvaluatedKey;
  
} while (lastEvaluatedKey);
```

Failing to implement pagination will result in incomplete data retrieval, as DynamoDB limits each response to 1MB. This has caused issues where only a subset of photos (typically 10-20) were displayed even though users had many more matching photos in the database.

### Common Pitfalls to Avoid

1. **Missing DynamoDB Pagination**: Always use `LastEvaluatedKey` to fetch all results from DynamoDB operations.

2. **Incorrect File Extensions**: Ensure JSX files have `.jsx` or `.tsx` extensions, not `.js`.

3. **Visibility Filtering Order**: Apply visibility filtering (`filterPhotosByVisibility`) AFTER retrieving all photos, not before.

4. **Missing Error Handling**: Add proper error handling, especially for asynchronous operations.

5. **Inefficient Matching**: The current implementation scans the entire photos table. Consider using GSIs (Global Secondary Indexes) for more efficient querying.

6. **Data Structure Inconsistencies**: Some photo objects have different property names for the same data (`user_id` vs `userId`, etc.). Normalize these or handle all variations.

### Recent Fixes

The `fetchPhotos` method in `awsPhotoService.js` was recently updated to properly paginate through all DynamoDB results, fixing an issue where users only saw a subset of their matched photos (typically around 14 photos instead of the full set of 50+ photos).

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