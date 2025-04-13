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
│       │   │   ├── Dropzone
│       │   │   ├── Progress
│       │   │   └── ImageViewer
│       │   └── TrashBin
│       │       └── PhotoGrid
│       └── Footer
└── Toast Container
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

The PhotoGrid component displays a responsive grid of photos with various interactions.

**Key functions:**
- `handlePhotoClick`: Opens photo in viewer
- `handlePhotoAction`: Handles photo-specific actions
- `renderGridItem`: Renders individual grid items

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
      onPhotoAction={handlePhotoAction}
    />
  );
}
```

### ImageViewer.jsx

The enhanced image viewer provides a full-featured viewing experience.

**Key functions:**
- `handleZoom`: Controls image zoom
- `handleRotate`: Rotates the image
- `handleDownload`: Downloads the current image
- `handleShare`: Shares the current image

**Usage example:**
```jsx
// In a component
import ImageViewer from '../components/ui/ImageViewer';

function PhotoDetail({ photo }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  return (
    <>
      <img 
        src={photo.thumbnailUrl} 
        alt={photo.name}
        onClick={() => setIsViewerOpen(true)}
      />
      
      {isViewerOpen && (
        <ImageViewer
          image={photo}
          onClose={() => setIsViewerOpen(false)}
          onAction={handleViewerAction}
        />
      )}
    </>
  );
}
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

### Form Controls

All form controls should:
- Have associated labels
- Provide validation feedback
- Have proper disabled/loading states
- Use consistent styling

```jsx
// Form control example
<div className="space-y-4">
  <div>
    <label 
      htmlFor="email" 
      className="block text-sm font-medium text-gray-700"
    >
      Email
    </label>
    <input
      id="email"
      type="email"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      aria-invalid={errors.email ? "true" : "false"}
      aria-describedby={errors.email ? "email-error" : undefined}
    />
    {errors.email && (
      <p id="email-error" className="mt-2 text-sm text-red-600">
        {errors.email}
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

- Minimum touch target size: 44px × 44px
- Adequate spacing between touch targets
- Support for touch gestures (swipe, pinch, etc.)
- Avoid hover-only interactions

```jsx
// Touch-friendly button
<button className="p-3 min-w-[44px] min-h-[44px]">
  <Icon />
</button>
```

### Gesture Support

```jsx
// Using gesture support in image viewer
import { useGesture } from '@use-gesture/react';

function ImageViewer({ image }) {
  const [{ zoom, position }, setTransform] = useState({ zoom: 1, position: [0, 0] });
  
  const bind = useGesture({
    onDrag: ({ movement: [mx, my] }) => {
      setTransform(state => ({
        ...state,
        position: [mx, my]
      }));
    },
    onPinch: ({ offset: [d] }) => {
      setTransform(state => ({
        ...state,
        zoom: d
      }));
    }
  });
  
  return (
    <div className="touch-none" {...bind()}>
      <img 
        src={image.url} 
        alt={image.alt}
        style={{
          transform: `scale(${zoom}) translate(${position[0]}px, ${position[1]}px)`
        }}
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

## Conclusion

This document provides the foundation for consistent UX development in the Shmong application. When making changes to the UI, always consider the existing patterns, accessibility requirements, and performance implications. Refer to this guide for standard practices and implementation details to ensure a cohesive user experience. 