# Design and UX Information Guide

## Overview

This document provides comprehensive guidance for developers working on the Shmong application's user interface. It covers file structures, component hierarchies, design principles, and implementation details to ensure consistent user experience across the application.

## File Structure and Organization

### Component Structure

```
src/
├── components/
│   ├── Dashboard.jsx         # Main dashboard component
│   ├── MyPhotos.jsx          # Photo display component
│   ├── PhotoGrid.jsx         # Reusable photo grid display
│   ├── PhotoManager.js       # Photo data management 
│   ├── PhotoUploader.tsx     # File upload and image preview
│   ├── TrashBin.jsx          # Trash management component
│   ├── UserRegistration.jsx  # User registration flow
│   ├── layout/               # Layout components
│   │   ├── Header.jsx        # Application header
│   │   ├── Footer.jsx        # Application footer
│   │   └── Sidebar.jsx       # Navigation sidebar
│   ├── ui/                   # Reusable UI components
│   │   ├── Button.jsx        # Standard button component
│   │   ├── Card.jsx          # Card container component
│   │   ├── Dialog.jsx        # Modal dialog component
│   │   ├── Dropzone.jsx      # File dropzone component
│   │   ├── Icons.jsx         # Icon components
│   │   ├── ImageViewer.jsx   # Enhanced image viewer
│   │   ├── Loader.jsx        # Loading indicator
│   │   ├── Progress.jsx      # Progress indicator
│   │   └── Toast.jsx         # Toast notification
│   └── workaround/           # Special case components
├── context/
│   ├── AuthContext.jsx       # Authentication context
│   └── ThemeContext.jsx      # Theme preferences
├── hooks/
│   ├── useAuth.js            # Authentication hook
│   ├── usePhotos.js          # Photo management hook
│   └── useUpload.js          # Upload management hook
├── services/
│   ├── FaceStorageService.js # Face ID storage service
│   ├── PhotoService.js       # Photo management service
│   ├── S3Service.js          # S3 interaction service
│   └── UserService.js        # User management service
├── styles/
│   ├── globals.css           # Global styles
│   └── tailwind.config.js    # Tailwind configuration
└── utils/
    ├── formatters.js         # Data formatting utilities
    ├── imageProcessing.js    # Image manipulation utilities
    └── validation.js         # Input validation utilities
```

### Main Pages and Routes

```
src/
├── pages/
│   ├── index.js              # Home/landing page
│   ├── dashboard.js          # Dashboard page
│   ├── login.js              # Login page
│   ├── register.js           # Registration page
│   ├── photos/
│   │   ├── index.js          # My Photos page
│   │   ├── upload.js         # Upload page
│   │   └── [id].js           # Single photo view
│   └── trash.js              # Trash management page
└── App.jsx                   # Main application component
```

## Component Flow and Relationships

### UI Component Hierarchy

```
App
├── AuthProvider
│   └── ThemeProvider
│       ├── Header
│       ├── Sidebar
│       │   └── Navigation
│       ├── Main Content Area
│       │   ├── Dashboard
│       │   │   └── PhotoGrid
│       │   ├── MyPhotos
│       │   │   └── PhotoGrid
│       │   │       └── ImageViewer
│       │   ├── PhotoUploader
│   │   │   ├── Dropzone
│   │   │   ├── Progress
│   │   │   └── ImageViewer
│   │   │   └── TrashBin
│   │   │       └── PhotoGrid
│       │   └── Footer
│       └── Toast Container
```

### Data Flow

```
Services (API calls) ──> Hooks ──> Context ──> Components ──> UI
                  ↑                   ↑
                  │                   │
                  └───────────────────┘
                       (Feedback)
```

## Key Components and Usage

### Dashboard.jsx

The Dashboard component serves as the main entry point after login.

**Key functions:**
- `handleNavigate`: Navigates to different sections
- `fetchUserData`: Retrieves user profile and photos

**Usage example:**
```jsx
// In a page component
import Dashboard from '../components/Dashboard';

function HomePage() {
  return <Dashboard initialTab="photos" />;
}
```

### PhotoUploader.tsx

The PhotoUploader component handles file selection, drag-and-drop, preview, and upload.

**Key functions:**
- `onDrop`: Handles dropped files
- `processUploads`: Processes files for upload
- `handleMetadataChange`: Updates file metadata
- `renderPreview`: Renders file previews

**Usage example:**
```jsx
// In a page component
import PhotoUploader from '../components/PhotoUploader';

function UploadPage() {
  return (
    <PhotoUploader 
      maxFileSize={10485760} 
      acceptedFileTypes={['image/jpeg', 'image/png']}
      onUploadComplete={handleComplete}
    />
  );
}
```

### PhotoGrid.jsx

The PhotoGrid component displays a responsive grid of photos with direct thumbnail interaction.

**Key functions:**
- `handlePhotoClick`: Opens photo in viewer when thumbnails are clicked
- `checkMobile`: Detects mobile devices for optimized interactions
- `renderThumbnail`: Renders individual thumbnails with proper event handlers

**Usage example:**
```jsx
// In a page component
import PhotoGrid from '../components/PhotoGrid';

function GalleryPage({ photos }) {
  return (
    <PhotoGrid 
      photos={photos}
      columns={4}
      onPhotoClick={handlePhotoClick}
    />
  );
}
```

**Key implementation details:**
```jsx
// PhotoGrid.jsx - Touch-optimized thumbnail implementation
<motion.div 
  key={photo.id}
  className="relative group rounded-apple-xl overflow-hidden"
  onClick={() => handlePhotoClick(photo)}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
>
  {/* Multiple click handlers for reliable operation */}
  <div 
    className="aspect-square w-full" 
    onClick={(e) => {
      e.stopPropagation();
      handlePhotoClick(photo);
    }}
  >
    <img 
      src={photo.url} 
      alt={photo.title || 'Photo'} 
      style={{ pointerEvents: 'none' }} // Ensures clicks go to parent div
      className="w-full h-full object-cover"
    />
  </div>
</motion.div>
```

### SimplePhotoInfoModal.jsx

The enhanced image viewer modal presents photos and metadata with a focus on usability.

**Key functions:**
- `toggleDetailsView`: Switches between image and details mode
- `handleZoom`, `handleRotate`: Image manipulation controls
- `handleDownload`: Downloads the current image
- `handleShare`: Shares the current image using Web Share API
- `confirmDelete`: Opens the delete confirmation dialog
- `handleDelete`: Moves the photo to trash after confirmation

**Usage example:**
```jsx
// In a component like PhotoGrid or PhotoUploader
import SimplePhotoInfoModal from '../components/SimplePhotoInfoModal';

function PhotoCard({ photo }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <img 
        src={photo.url}
        alt={photo.title || 'Photo'}
        onClick={() => setIsModalOpen(true)}
      />
      
      {isModalOpen && (
        <SimplePhotoInfoModal
          photo={photo} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
```

**Key implementation details:**
```jsx
// SimplePhotoInfoModal.jsx - Bottom toolbar with iOS HIG-compliant button arrangement
<div className="p-3 border-t border-gray-300/70 dark:border-gray-700/70 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm">
  {/* Responsive layout - 2x2 grid on mobile, horizontal on larger screens */}
  <div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-end gap-2.5">
    {/* Toggle between details and image view */}
    <button onClick={toggleDetailsView} className="px-4 py-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg">
      {showDetails ? 'Image' : 'Details'}
    </button>
    
    {/* Share button (uses Web Share API when available) */}
    <button onClick={handleShare} className="px-4 py-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg">
      <Share2 className="w-4 h-4 mr-1.5 inline" />
      Share
    </button>
    
    {/* Download button */}
    <button onClick={handleDownload} className="px-4 py-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg">
      <Download className="w-4 h-4 mr-1.5 inline" />
      Download
    </button>
    
    {/* Delete button - Uses iOS red color, positioned next to Close */}
    <button 
      onClick={confirmDelete} 
      className="px-4 py-2 bg-[#FF3B30] text-white rounded-lg"
    >
      <Trash2 className="w-4 h-4 mr-1.5 inline" />
      Delete
    </button>
    
    {/* Close button - Primary action */}
    <button 
      onClick={onClose} 
      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
    >
      Close
    </button>
  </div>
</div>

{/* iOS-style Delete confirmation sheet */}
{showDeleteConfirmation && (
  <motion.div 
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div 
      className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden m-4"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <div className="px-4 py-4 text-center border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold">Delete Photo</h3>
        <p className="mt-1 text-sm text-gray-500">
          Are you sure you want to move this photo to trash?
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        <button
          className="w-full py-3.5 px-4 text-[#FF3B30] font-medium text-sm"
          onClick={handleDelete}
        >
          Delete Photo
        </button>
        <button
          className="w-full py-3.5 px-4 text-[#007AFF] font-medium text-sm"
          onClick={() => setShowDeleteConfirmation(false)}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
```

## UI/UX Implementation Guidelines

### Design System

The application uses a consistent design system based on TailwindCSS with custom theme extensions.

#### Colors

```javascript
// Primary palette
const colors = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    900: '#312e81',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};
```

#### Typography

```css
/* Font hierarchy */
h1 { @apply text-2xl font-bold text-neutral-900; }
h2 { @apply text-xl font-semibold text-neutral-900; }
h3 { @apply text-lg font-medium text-neutral-800; }
body { @apply text-base text-neutral-700; }
small { @apply text-sm text-neutral-600; }

/* For dark mode */
.dark h1 { @apply text-white; }
.dark h2 { @apply text-white; }
.dark h3 { @apply text-neutral-200; }
.dark body { @apply text-neutral-300; }
.dark small { @apply text-neutral-400; }
```

#### Component Styling

- Use Tailwind utility classes directly in JSX
- Use consistent spacing scale (0.5rem, 1rem, 1.5rem, 2rem)
- Prefer relative units (em, rem) over pixels
- Use `sm:`, `md:`, `lg:` breakpoints for responsive design

```jsx
// Button example with TailwindCSS
<button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
  Submit
</button>
```

### Responsive Design

The application follows a mobile-first approach with consistent breakpoints:

- `sm`: 640px and above
- `md`: 768px and above
- `lg`: 1024px and above
- `xl`: 1280px and above

```jsx
// Responsive grid example
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>
```

### Accessibility Guidelines

All components should adhere to WCAG 2.1 Level AA standards:

1. **Keyboard Navigation**
   - All interactive elements must be focusable
   - Focus styles must be visible
   - Logical tab order

2. **Screen Reader Support**
   - Images need alt text
   - Form elements need labels
   - ARIA attributes for custom components

3. **Color and Contrast**
   - Minimum contrast ratio of 4.5:1 for text
   - Don't rely solely on color to convey information

```jsx
// Accessible button example
<button
  className="px-4 py-2 bg-primary-600 text-white rounded-md"
  aria-label="Upload photos"
  onClick={handleUpload}
  disabled={isUploading}
>
  {isUploading ? (
    <>
      <span className="sr-only">Uploading...</span>
      <Spinner className="mr-2" />
    </>
  ) : (
    "Upload"
  )}
</button>
```

## Common UI Patterns and Implementation

### Modals and Dialogs

```jsx
// Dialog.jsx usage
import Dialog from '../components/ui/Dialog';

function PhotoActions({ photo }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Delete Photo
      </button>
      
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        description="Are you sure you want to move this photo to trash?"
        actions={[
          {
            label: "Cancel",
            onClick: () => setIsOpen(false),
            variant: "secondary"
          },
          {
            label: "Delete",
            onClick: handleDelete,
            variant: "danger"
          }
        ]}
      />
    </>
  );
}
```

### iOS-style Confirmation Sheets

For iOS-like confirmation dialogs, especially for destructive actions, use this pattern:

```jsx
// iOS-style confirmation sheet
function IOSConfirmationSheet({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = '#FF3B30' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden m-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="px-4 py-4 text-center border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <button
                className="w-full py-3.5 px-4 font-medium text-sm"
                style={{ color: confirmColor }}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
              <button
                className="w-full py-3.5 px-4 text-[#007AFF] font-medium text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Usage
function DeletePhotoButton({ photo }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleDelete = async () => {
    await movePhotoToTrash(photo.id);
    setShowConfirmation(false);
  };
  
  return (
    <>
      <button 
        onClick={() => setShowConfirmation(true)}
        className="bg-[#FF3B30] text-white px-4 py-2 rounded-lg"
      >
        <Trash2 className="w-4 h-4 mr-1.5 inline" />
        Delete
      </button>
      
      <IOSConfirmationSheet
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Photo"
        message="Are you sure you want to move this photo to trash?"
        confirmText="Delete Photo"
      />
    </>
  );
}
```

### Form Controls

All form controls should:
- Have associated labels using `htmlFor` pointing to the input `id`.
- Provide validation feedback (e.g., highlighting required fields or showing error messages).
- Have proper disabled/loading states visually indicated.
- Use consistent styling, including focus states (`focus:ring-primary-500`).

```jsx
// Form control example with validation highlight
<div className="space-y-4">
  <div>
    <label 
      htmlFor="eventName" 
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      Event Name*
    </label>
    <input
      id="eventName"
      type="text"
      className={`w-full px-4 py-3 rounded-xl border ${metadata.eventName?.trim() ? 'border-green-300 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'} focus:border-transparent`}
      value={metadata.eventName || ""}
      onChange={(e) => setMetadata({...metadata, eventName: e.target.value})}
      aria-required="true"
      aria-invalid={!metadata.eventName?.trim()}
      aria-describedby={!metadata.eventName?.trim() ? "event-name-error" : undefined}
    />
    {!metadata.eventName?.trim() && (
      <p id="event-name-error" className="mt-1 text-xs text-red-500">
        Event name is required
      </p>
    )}
  </div>
</div>
```

### Toast Notifications

```jsx
// Using toast notifications
import { useToast } from '../context/ToastContext';

function UploadButton() {
  const { showToast } = useToast();
  
  const handleUpload = async () => {
    try {
      await uploadFile(file);
      showToast({
        type: 'success',
        title: 'Upload Complete',
        message: 'Your file has been uploaded successfully.'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message
      });
    }
  };
  
  return <button onClick={handleUpload}>Upload</button>;
}
```

## Animation Guidelines

The application uses Framer Motion for animations with consistent patterns:

### Page Transitions

```jsx
// Page transition
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

### List Animations

```jsx
// List animations
<motion.ul>
  {items.map(item => (
    <motion.li
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {item.content}
    </motion.li>
  ))}
</motion.ul>
```

### Hover Effects

```jsx
// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  Click Me
</motion.button>
```

## Mobile Experience Guidelines

### Touch Optimization

- **Minimum touch target size: 44px × 44px** - Ensure all interactive elements are at least this size on mobile
- **Adequate spacing between touch targets** - Provide at least 8px spacing between touchable elements
- **Robust click handling** for thumbnails and buttons:
  - Use multiple click handlers to prevent dead zones
  - Apply `pointer-events: none` to nested elements like images to ensure parent click handlers fire
  - Use `stopPropagation()` to prevent event bubbling issues
  - Set explicit `z-index` values to ensure proper layering of interactive elements
- **Visual feedback on touch** - Provide immediate visual feedback for touch interactions
- **Avoid hover-only interactions** - Never rely solely on hover effects for critical functionality
- **Device detection** - Implement runtime detection of mobile devices to adapt interaction patterns:

```jsx
// Mobile device detection example
useEffect(() => {
  const checkMobile = () => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth < 768;
    setIsMobile(isMobileDevice || isSmallScreen);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

- **Responsive Controls**: Action buttons in modals (like the photo viewer) should adapt their layout for easier tapping on smaller screens:
  - Use a grid layout (2×2 or 3×2) on mobile screens
  - Switch to a horizontal row on larger screens
  - Position destructive actions (like Delete) next to primary actions (like Close) following iOS HIG

### iOS-specific UI Guidelines

When implementing iOS-style interfaces:

- **Colors**: Use Apple's standard interface colors
  - Blue (#007AFF) for primary actions
  - Red (#FF3B30) for destructive actions
  - Gray (#8E8E93) for secondary/neutral actions
- **Button Styles**:
  - Use rounded buttons with consistent padding (px-4 py-2)
  - Maintain minimum 44×44px touch targets
  - Group related actions together (especially Destructive + Close buttons)
- **Confirmation Sheets**:
  - Use slide-up sheet animations for confirmation dialogs
  - Position Cancel button at the bottom
  - Use standard red color for destructive actions
  - Add subtle backdrop blur effects
- **Safe Areas**:
  - Respect iOS safe areas, especially on notched devices
  - Add bottom padding to avoid conflicts with home indicator

```jsx
// Touch-friendly button
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg">
  <Icon className="w-5 h-5" />
  <span className="ml-2">Label</span>
</button>
```

### Gesture Support

```jsx
// Using gesture support in image viewer
import { useGesture } from '@use-gesture/react';

function ImageViewer({ image }) {
  const [{ zoom, position }, setTransform] = useState({ zoom: 1, position: [0, 0] });
  
  const bind = useGesture({
    onDrag: ({ movement: [mx, my], first, last }) => {
      // Add clear visual feedback during drag
      if (first) {
        document.body.classList.add('dragging');
      }
      
      setTransform(state => ({
        ...state,
        position: [mx, my]
      }));
      
      if (last) {
        document.body.classList.remove('dragging');
      }
    },
    onPinch: ({ offset: [d], first, last }) => {
      // Prevent pinch-to-zoom conflict with browser gestures
      if (first) {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      }
      
      setTransform(state => ({
        ...state,
        zoom: Math.max(0.5, Math.min(4, d))
      }));
      
      if (last) {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
    }
  });
  
  return (
    <div className="touch-none h-full w-full" {...bind()}>
      <img 
        src={image.url} 
        alt={image.alt}
        style={{
          transform: `scale(${zoom}) translate(${position[0]}px, ${position[1]}px)`,
          touchAction: 'none', // Prevent browser handling of gestures
          WebkitUserSelect: 'none', // Prevent selection issues on iOS
        }}
        className="w-full h-full object-contain pointer-events-none" // Ensure parent gets gesture events
      />
    </div>
  );
}
```

## Component Customization Patterns

### Component Props Pattern

```jsx
// Button.jsx - Customizable through props
function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  className = '',
  ...props 
}) {
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`
        rounded-md font-medium transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <Spinner className="mr-2" />
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
```

### Composition Pattern

```jsx
// Card.jsx - Customizable through composition
function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Usage
function ProfileCard({ user }) {
  return (
    <Card>
      <Card.Header>
        <h2>{user.name}</h2>
      </Card.Header>
      <Card.Body>
        <p>{user.bio}</p>
      </Card.Body>
      <Card.Footer>
        <Button>View Profile</Button>
      </Card.Footer>
    </Card>
  );
}
```

## UI/UX Replacement Guidelines

### File Replacement Strategy

1. **Identify Dependencies**
   - Use `grep_search` to find all imports of the component
   - Check for direct and indirect dependencies

2. **Create Replacement Component**
   - Create new component in same location
   - Match the original component's prop interface exactly

3. **Implement New Functionality**
   - Add new features and styling
   - Ensure all original functionality is preserved
   - Maintain accessibility

4. **Replace References**
   - Update import statements in dependent files
   - Test each dependent component individually

### Styling Replacement

When updating styles:

1. **Maintain Responsive Behavior**
   - Keep existing breakpoint behavior
   - Test on mobile, tablet, and desktop

2. **Preserve Accessibility**
   - Maintain keyboard navigation
   - Preserve ARIA attributes
   - Ensure adequate color contrast

3. **Match Design System**
   - Use design tokens from the application theme
   - Follow spacing scale
   - Use consistent animations

### Example: Replacing a Button Component

```jsx
// Original Button
function OldButton({ onClick, children, disabled }) {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// New Button (enhanced but compatible)
function NewButton({ onClick, children, disabled, variant = 'primary', size = 'md' }) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`
        rounded-md font-medium transition-colors
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## Testing UI Changes

### Visual Regression Testing

```jsx
// Component test with Storybook
// Button.stories.jsx
import Button from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select', options: ['primary', 'secondary', 'danger'] }
    },
    size: {
      control: { type: 'select', options: ['sm', 'md', 'lg'] }
    },
    isLoading: {
      control: { type: 'boolean' }
    }
  }
};

const Template = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Button',
  variant: 'primary',
  size: 'md',
  isLoading: false
};

export const Secondary = Template.bind({});
Secondary.args = {
  children: 'Secondary Button',
  variant: 'secondary',
  size: 'md',
  isLoading: false
};

export const Loading = Template.bind({});
Loading.args = {
  children: 'Loading Button',
  variant: 'primary',
  size: 'md',
  isLoading: true
};
```

### Accessibility Testing

```javascript
// Example accessibility test with Jest and Testing Library
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  test('has correct ARIA attributes when disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
  
  test('has sufficient color contrast', () => {
    // This would use an actual contrast checker in a real test
    // For example, with axe-core
    const { container } = render(<Button>Test Button</Button>);
    expect(container).toHaveNoViolations();
  });
});
```

## Troubleshooting Common UX Issues

### Performance Issues

1. **Identify the Problem**
   - Use React DevTools Profiler
   - Check for unnecessary re-renders

2. **Common Solutions**
   - Memoize expensive components with `React.memo`
   - Use `useCallback` for event handlers
   - Use `useMemo` for derived data
   - Implement virtual scrolling for long lists

### Layout Shifts

1. **Identify the Problem**
   - Use browser DevTools Layout tab
   - Check for elements changing size after load

2. **Common Solutions**
   - Specify image dimensions in advance
   - Use skeleton loaders during data fetch
   - Set minimum heights for dynamic content
   - Use CSS contain property

```jsx
// Preventing layout shift with skeleton loader
function PhotoCard({ photo, isLoading }) {
  return (
    <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
      {isLoading ? (
        <div className="animate-pulse w-full h-full bg-gray-200" />
      ) : (
        <img 
          src={photo.url} 
          alt={photo.alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}
```

### Touch Interaction Issues

If thumbnails or buttons aren't responding properly to touch/click events:

1. **Identify the Problem**
   - Use browser DevTools to inspect event handling
   - Check for overlapping elements with higher z-index
   - Verify pointer-events settings on nested elements
   - Test on real mobile devices, not just simulators

2. **Common Solutions**
   - Add multiple click handlers at different levels
   - Ensure sufficient padding for touch targets (min 44×44px)
   - Set `pointer-events: none` on images inside click targets
   - Use `stopPropagation()` to prevent event bubbling issues
   - Add explicit `z-index` values to ensure proper layering
   - Test with actual touch events, not just mouse clicks

```jsx
// Example of robust touch handling for a thumbnail
<div 
  className="relative aspect-square" 
  onClick={handleClick} // Primary handler
>
  <div 
    className="absolute inset-0" 
    onClick={(e) => { // Backup handler
      e.stopPropagation();
      handleClick();
    }}
  >
    <img 
      src={imageUrl} 
      alt={alt} 
      className="w-full h-full object-cover"
      style={{ pointerEvents: 'none' }} // Ensures parent gets the click
    />
  </div>
</div>
```

## Conclusion

This document provides the foundation for consistent UX development in the Shmong application. When making changes to the UI, always consider the existing patterns, accessibility requirements, and performance implications. Refer to this guide for standard practices and implementation details to ensure a cohesive user experience.

## Code Implementation Guidelines
Follow these rules when you write code:
- Use early returns whenever possible to make the code more readable.
- Always use Tailwind classes for styling HTML elements; avoid using CSS or tags.
- Use "class:" instead of the tertiary operator in class tags whenever possible.
- Use descriptive variable and function/const names. Also, event functions should be named with a "handle" prefix, like "handleClick" for onClick and "handleKeyDown" for onKeyDown.
- Implement accessibility features on elements. For example, a tag should have a tabindex="0", aria-label, on:click, and on:keydown, and similar attributes.
- Use consts instead of functions, for example, "const toggle = () =>". Also, define a type if possible.
- When working with React components that use JSX syntax, always use the `.jsx` extension for JavaScript files or `.tsx` for TypeScript files. Vite requires these extensions for proper parsing of JSX syntax. 

## Main UI Components

### Landing Page (src/pages/LandingPage.tsx)
- **Purpose**: Introduces new users to the service and provides authentication options
- **Key Components**:
  - Header with navigation
  - Hero section with value proposition
  - Features showcase with illustrations
  - Authentication forms (login/signup)
  - Footer with links and additional information

### Recent Updates (April 2025)
- **HIG Alignment**: Applied extensive refinements based on Apple's Human Interface Guidelines to multiple components, including `LandingPage.tsx` and `SimplePhotoInfoModal.jsx`.
  - **Layout/Spacing**: Standardized section padding, horizontal padding, and grid gaps.
  - **Typography**: Adjusted heading and body text sizes for better hierarchy.
  - **Color/Buttons**: Standardized button styling using Tailwind classes. Default primary buttons use HIG-standard blue (`bg-blue-500`). Modal buttons updated for responsiveness (2x2 grid on mobile).
  - **Cards/Sections**: Simplified styling with consistent rounding, borders, and subtle shadows. Modal sections use slightly inset backgrounds (`bg-white dark:bg-gray-900/50`).
  - **Animations**: Refined animations in the iPhone mockup on the landing page.
- **File Structure**: Removed `LandingPage.js`; `LandingPage.tsx` is the active source file.
- **Image Viewer/Modal**: Enhanced `SimplePhotoInfoModal.jsx`:
    - Added a "Share" button using the Web Share API.
    - Implemented a toggle between Image-only and Details view.
    - Refined layout and styling for better HIG compliance and responsiveness.
    - Removed nested scrollbar in the detailed labels list.
- **Events Tab**: Temporarily deprecated/hidden the Events tab due to ongoing development.

### Dashboard (src/pages/Dashboard.tsx)
- **Purpose**: Displays user's photos and provides navigation options
- **Key Components**:
  - Navigation Tabs (Home, Photos, Upload, Trash)
  - PhotoGrid for displaying photos
  - FaceRegistration (on Home tab)
  - PhotoUploader (on Upload tab)
  - TrashBin (on Trash tab)
- **Data Handling**: Fetches user data, photo counts, and manages active tab state.