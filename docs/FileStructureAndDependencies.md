# Shmong Project - File Structure and Dependencies Map

## Project Structure Overview

The Shmong project is organized into a modular structure with clear separation of concerns. Below is a comprehensive map of the file structure and dependencies.

```
src/
├── components/           # UI Components Directory
│   ├── Dashboard.jsx     # MAIN DASHBOARD COMPONENT (primary user interface)
│   ├── AppleDashboard.tsx # Alternative Apple-styled dashboard
│   ├── MyPhotos.jsx      # Photo gallery component
│   ├── Navigation.jsx    # Navigation bar component
│   ├── Card.tsx          # Card component for UI elements
│   ├── AppleGlassCard.tsx # Apple-styled card component
│   ├── LandingPage.tsx   # Landing page component
│   ├── AppleLandingPage.tsx # Apple-styled landing page
│   └── ui/               # Reusable UI components
├── services/             # Business Logic Services
│   ├── FaceIndexingService.js  # AWS Rekognition integration for face indexing
│   ├── faceMatchingService.js  # Core face matching logic
│   ├── awsPhotoService.js      # Photo upload and processing
│   ├── PhotoService.ts         # Photo handling service (TypeScript version)
│   ├── FaceStorageService.js   # Face data storage and retrieval
│   ├── BackgroundJobService.js # Background job processing
│   └── rekognitionService.ts   # TypeScript wrapper for Rekognition
├── lib/                  # Shared Libraries
│   ├── awsClient.js      # AWS SDK configuration
│   ├── awsClient.ts      # TypeScript version of AWS client
│   ├── setupDatabase.js  # Database initialization
│   ├── bufferPolyfill.js # Buffer polyfill for browser compatibility
│   ├── supabaseClient.ts # Supabase client configuration
│   ├── utils.js          # JavaScript utilities
│   └── utils.ts          # TypeScript utilities
├── utils/                # Helper Functions
├── pages/                # Route-based Page Components
├── auth/                 # Authentication Code
├── App.jsx               # Main application component
├── App.tsx               # TypeScript version of App component
├── App.js                # JavaScript version of App component
├── main.jsx              # Application entry point
├── main.tsx              # TypeScript entry point
└── index.css             # Global styles
```

## Key Component: Dashboard

The **Dashboard component (located in `src/components/Dashboard.jsx`)** is the central UI component of the application. This is where users interact with the face matching system, view their photos, and manage their face registration.

## Dependency Relationships

### Dashboard Dependencies

```
Dashboard.jsx
├── Service Dependencies:
│   ├── FaceIndexingService.js    # For face registration and search
│   ├── awsPhotoService.js        # For photo management
│   └── FaceStorageService.js     # For face data management
│
├── Component Dependencies:
│   ├── MyPhotos.jsx              # To display user's photos
│   ├── Navigation.jsx            # For navigation UI
│   └── Various UI components     # From the ui/ directory
│
└── External Dependencies:
    ├── AWS Rekognition           # Through FaceIndexingService
    ├── AWS S3                    # Through awsPhotoService
    └── AWS DynamoDB              # For data storage
```

### Service Inter-dependencies

```
FaceIndexingService.js
├── Depends on:
│   ├── lib/awsClient.js          # For AWS SDK configuration
│   └── FaceStorageService.js     # For storing face data
│
└── Used by:
    ├── Dashboard.jsx             # For user registration
    ├── awsPhotoService.js        # For photo face detection
    └── faceMatchingService.js    # For face matching algorithms

awsPhotoService.js
├── Depends on:
│   ├── lib/awsClient.js          # For AWS SDK configuration
│   ├── FaceIndexingService.js    # For face detection in photos
│   └── FaceStorageService.js     # For face data retrieval
│
└── Used by:
    ├── Dashboard.jsx             # For photo uploads and management
    └── MyPhotos.jsx              # For displaying photos

FaceStorageService.js
├── Depends on:
│   ├── lib/awsClient.js          # For AWS SDK configuration
│   └── lib/setupDatabase.js      # For database initialization
│
└── Used by:
    ├── FaceIndexingService.js    # For storing face data
    ├── awsPhotoService.js        # For retrieving face data
    └── faceMatchingService.js    # For matching algorithms
```

## Application Flow

1. The application initializes through `main.jsx` or `main.tsx`
2. The App component (`App.jsx` or `App.tsx` or `App.js`) renders the appropriate route
3. For authenticated users, the **Dashboard component** (`src/components/Dashboard.jsx`) is loaded
4. The Dashboard interacts with various services to provide face registration, photo upload, and matching functionalities
5. The MyPhotos component displays the user's uploaded photos and any matches found

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