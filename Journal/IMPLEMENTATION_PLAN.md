# Face Matching System Implementation Plan

**Last Updated:** 2025-04-05 18:05 PM

## Overview

This document outlines the step-by-step implementation plan for the Shmong face matching system, following a streamlined phased approach. We'll focus first on the core matching functionality before adding additional features like notifications and advanced uploads.

## Photo Upload Solution: Uppy.js

### What is Uppy.js?

Uppy.js is a modern, open-source JavaScript file uploader that was created by Transloadit. It's designed as a modular, next-generation file uploader for web browsers, focusing on reliability, user experience, and extensibility. Uppy is framework-agnostic but provides official plugins for React, Vue, and Angular integration.

### Key Features for Photographer Workflows

1. **Folder Upload Support**: Preserves directory structures when uploading entire photo shoots
2. **Resumable Uploads**: Can pause and resume large uploads (critical for 500+ photo sessions)
3. **Chunked Uploading**: Splits large files into smaller pieces for reliable transfers
4. **Concurrent Uploads**: Processes multiple files simultaneously for faster uploads
5. **Drag & Drop**: Intuitive interface for selecting large batches of photos
6. **Progress Tracking**: Detailed upload progress for individual files and overall batch
7. **Mobile Compatibility**: Works on mobile devices (responsive design)
8. **Image Preview**: Generates thumbnails for selected images
9. **EXIF Preservation**: Maintains photo metadata during upload
10. **Plugin Architecture**: Extensible with custom plugins

### Pros and Cons

**Pros:**
- **Optimized for Large Batches**: Specifically designed for handling thousands of files
- **Reliability**: Robust error handling and retry mechanisms
- **AWS S3 Integration**: Direct integration with S3 for efficient uploads
- **Extensive Documentation**: Well-documented API and plugins
- **Active Community**: Regular updates and bug fixes
- **Cross-Browser Compatibility**: Works in all modern browsers
- **Customizable UI**: Theming support for matching application design
- **Progress Reporting**: Detailed status for multi-file uploads

**Cons:**
- **Bundle Size**: Larger bundle size compared to simpler libraries (but justified by features)
- **Learning Curve**: More complex configuration for advanced features
- **Server Requirements**: Companion server needed for some features (like resumable uploads)
- **Performance Impact**: Can be resource-intensive when handling thousands of files

### Why It's Ideal for Professional Photographers

For photographers uploading 500+ photos per session, Uppy.js offers several critical advantages:

1. **Time Efficiency**: Concurrent uploads maximize bandwidth utilization
2. **Organization**: Preserves folder structures (e.g., by camera, lighting setup, subject)
3. **Reliability**: Resumable uploads mean a connection issue doesn't require starting over
4. **User Experience**: Progress indicators and previews provide feedback for long uploads
5. **Fault Tolerance**: Automatic retries for failed uploads
6. **Workflow Preservation**: Photographers can upload entire directory structures as organized on their computer

### Customization Capabilities

Uppy.js excels at customization through:

1. **Plugin System**: Create custom plugins for specialized needs
2. **Event Hooks**: Add custom logic at various points in the upload lifecycle
3. **UI Customization**: Theme the interface to match your application
4. **Metadata Support**: Add custom metadata to uploads (e.g., shoot information, client details)
5. **Preprocessing**: Transform or validate files before upload
6. **Custom Providers**: Add support for additional storage services

For Shmong's face matching system, we can extend Uppy.js to:
- Extract EXIF data during upload for photo metadata
- Generate preview thumbnails for the dashboard
- Integrate with our AWS S3 storage structure
- Add custom metadata fields relevant to face matching

## Phase 1: Core Matching Infrastructure

**Estimated Timeline: 2 Weeks**

### 1.1 Create New DynamoDB Table

Create the `shmong-face-matches` table with the following schema:

```
Primary Key Structure:
- userId (Partition Key, String): The registered user's ID
- matchId (Sort Key, String): Composite key combining photoId and timestamp

Attributes:
- photoId (String): ID of the photo containing the match
- faceId (String): The AWS Rekognition FaceId for the matched face
- confidence (Number): Match confidence score (>98%)
- matchedAt (String): ISO timestamp when match was discovered
- photoMetadata (String): JSON object containing photo details
- status (String): Match status (new, viewed, hidden)
- boundingBox (String): JSON object with face position in the photo
```

**AWS CLI Command:**
```
aws dynamodb create-table \
    --table-name shmong-face-matches \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=matchId,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=matchId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
```

### 1.2 Enhance Face Registration Service

Update the existing `FaceIndexingService.js` to support historical matching:

1. After successful face indexing, initiate a search for historical matches
2. Create a new `searchForHistoricalMatches` function that:
   - Uses the AWS Rekognition `SearchFaces` API with the newly indexed face ID
   - Filters results with a >98% confidence threshold
   - Formats and stores matches in the `shmong-face-matches` table

### 1.3 Create Face Matching Service

Develop a new `FaceMatchingService.js` file that handles the core matching functionality:

```javascript
import { rekognitionClient } from '../config/aws-config';
import { ddbClient } from '../config/aws-config';
import { 
  SearchFacesCommand, 
  SearchFacesByImageCommand 
} from '@aws-sdk/client-rekognition';
import { 
  PutItemCommand, 
  QueryCommand 
} from '@aws-sdk/client-dynamodb';

export async function searchFaceById(faceId) {
  console.log(`🔍 [FaceMatching] Searching for matches with face ID: ${faceId}`);
  
  const params = {
    CollectionId: import.meta.env.VITE_AWS_COLLECTION_ID,
    FaceId: faceId,
    MaxResults: 100,
    FaceMatchThreshold: 98.0
  };
  
  try {
    const command = new SearchFacesCommand(params);
    const response = await rekognitionClient.send(command);
    
    console.log(`✅ [FaceMatching] Found ${response.FaceMatches.length} matches for face ID: ${faceId}`);
    return response.FaceMatches;
  } catch (error) {
    console.error(`❌ [FaceMatching] Error searching for face matches: ${error.message}`, error);
    throw error;
  }
}

export async function storeMatch(userId, photoId, faceId, matchDetails) {
  const matchId = `${photoId}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  console.log(`💾 [FaceMatching] Storing match for user ${userId} with photo ${photoId}`);
  
  const params = {
    TableName: 'shmong-face-matches',
    Item: {
      userId: { S: userId },
      matchId: { S: matchId },
      photoId: { S: photoId },
      faceId: { S: faceId },
      confidence: { N: matchDetails.Similarity.toString() },
      matchedAt: { S: timestamp },
      status: { S: 'new' },
      boundingBox: { S: JSON.stringify(matchDetails.Face.BoundingBox) },
      photoMetadata: { S: '{}' } // Will be populated in later phases
    }
  };
  
  try {
    const command = new PutItemCommand(params);
    await ddbClient.send(command);
    
    console.log(`✅ [FaceMatching] Successfully stored match record with ID: ${matchId}`);
    return { matchId, timestamp };
  } catch (error) {
    console.error(`❌ [FaceMatching] Error storing match: ${error.message}`, error);
    throw error;
  }
}

export async function getMatchesForUser(userId) {
  console.log(`🔍 [FaceMatching] Retrieving matches for user: ${userId}`);
  
  const params = {
    TableName: 'shmong-face-matches',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': { S: userId }
    }
  };
  
  try {
    const command = new QueryCommand(params);
    const response = await ddbClient.send(command);
    
    const matches = response.Items.map(item => ({
      userId: item.userId.S,
      matchId: item.matchId.S,
      photoId: item.photoId.S,
      faceId: item.faceId.S,
      confidence: parseFloat(item.confidence.N),
      matchedAt: item.matchedAt.S,
      status: item.status.S,
      boundingBox: JSON.parse(item.boundingBox.S),
      photoMetadata: JSON.parse(item.photoMetadata.S)
    }));
    
    console.log(`✅ [FaceMatching] Retrieved ${matches.length} matches for user: ${userId}`);
    return matches;
  } catch (error) {
    console.error(`❌ [FaceMatching] Error getting matches for user: ${error.message}`, error);
    throw error;
  }
}
```

### 1.4 Integrate with Existing Face Registration

Modify the existing face registration flow to trigger historical matching:

1. Update `src/services/FaceIndexingService.jsx` to call the matching service:

```javascript
// Add this function to FaceIndexingService.jsx
import { searchFaceById, storeMatch } from './FaceMatchingService';

// Call this after successful face indexing
async function handleHistoricalMatching(userId, faceId) {
  console.log(`🔍 [FaceIndexing] Starting historical matching for user: ${userId}, faceId: ${faceId}`);
  
  try {
    // Search for matches with the newly indexed face
    const matches = await searchFaceById(faceId);
    
    // Filter out matches with ExternalImageId that starts with "photo-"
    // These are faces from uploaded photos, not registered users
    const photoMatches = matches.filter(match => 
      match.Face.ExternalImageId && 
      match.Face.ExternalImageId.startsWith('photo-')
    );
    
    console.log(`✅ [FaceIndexing] Found ${photoMatches.length} potential historical matches`);
    
    // Store each match in DynamoDB
    const storePromises = photoMatches.map(match => {
      const photoId = match.Face.ExternalImageId.split('-')[1]; // Extract photoId from ExternalImageId
      return storeMatch(userId, photoId, faceId, match);
    });
    
    await Promise.all(storePromises);
    
    return photoMatches.length;
  } catch (error) {
    console.error(`❌ [FaceIndexing] Error in historical matching: ${error.message}`, error);
    return 0;
  }
}
```

2. Call this function after successful face indexing in the `indexUserFace` function

### 1.5 Testing Historical Matching

Develop comprehensive tests for the historical matching functionality:

1. Unit tests for `FaceMatchingService.js`
2. Integration tests with AWS Rekognition 
3. End-to-end tests for the registration and matching flow

## Phase 2: Basic Photo Upload and Processing

**Estimated Timeline: 3 Weeks**

### 2.1 Simple Photo Upload Interface

Create a basic photo upload interface with standard HTML form elements:

1. Create a `PhotoUpload.jsx` component
2. Implement a simple form with file input allowing multiple selections
3. Add basic progress tracking
4. Implement direct S3 uploads with presigned URLs

### 2.2 Photo Processing Pipeline

Develop a processing pipeline for uploaded photos:

1. Create a `ProcessPhoto.js` Lambda function that:
   - Accepts S3 event triggers when new photos are uploaded
   - Uses Rekognition's `DetectFaces` API to find faces in photos
   - Extracts EXIF metadata from photos
   - Indexes each detected face in the Rekognition collection
   - Generates appropriate ExternalImageId values (e.g., "photo-{photoId}-{position}")
   - Searches for matching registered users 
   - Stores matches in the DynamoDB table

### 2.3 Basic Match Display UI

Implement a simple UI for displaying matches:

1. Create a `Matches.jsx` page component
2. Build a `MatchList.jsx` component for listing matches
3. Implement a `MatchDetail.jsx` component for viewing match details

## Phase 3: Advanced Upload Features with Uppy.js

**Estimated Timeline: 3 Weeks**

### 3.1 Integrate Uppy.js

Implement advanced photo uploading with Uppy.js:

1. Install Uppy packages:
```
npm install @uppy/core @uppy/dashboard @uppy/drag-drop @uppy/progress-bar @uppy/aws-s3 @uppy/aws-s3-multipart @uppy/file-input @uppy/react
```

2. Create an `AdvancedPhotoUploader.jsx` component:
```jsx
import React from 'react';
import { Dashboard, useUppy } from '@uppy/react';
import Uppy from '@uppy/core';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import XHRUpload from '@uppy/xhr-upload';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

// Helper function to get presigned URLs for S3 uploads
async function getPresignedUrl(file) {
  // Implementation will connect to our backend
  // which generates S3 presigned URLs
}

export default function AdvancedPhotoUploader() {
  const uppy = useUppy(() => {
    return new Uppy({
      id: 'uppy',
      autoProceed: false,
      debug: true,
      restrictions: {
        maxFileSize: 100 * 1024 * 1024, // 100MB limit
        maxNumberOfFiles: 1000,
        allowedFileTypes: ['image/*']
      },
      onBeforeUpload: (files) => {
        // This is where we can add preprocessing
        // For example, we could extract EXIF data here
        return files;
      }
    })
    .use(AwsS3Multipart, {
      // Configuration for multipart uploading to S3
      companionUrl: '/', // Will be replaced with actual backend endpoint
      createMultipartUpload: getPresignedUrl,
      limit: 6, // Number of concurrent uploads
    })
    .on('upload-success', (file, response) => {
      console.log(`✅ [Uppy] File uploaded successfully: ${file.name}`, response);
      // Here we would trigger the face detection/matching process
    })
    .on('complete', (result) => {
      console.log(`✅ [Uppy] Upload complete: ${result.successful.length} files successful, ${result.failed.length} files failed`);
    });
  });

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Upload Photos</h2>
      <Dashboard
        uppy={uppy}
        plugins={['Webcam']}
        metaFields={[
          { id: 'name', name: 'Event Name', placeholder: 'What event are these photos from?' },
          { id: 'location', name: 'Location', placeholder: 'Where were these photos taken?' }
        ]}
        height={450}
        width="100%"
        showProgressDetails={true}
        proudlyDisplayPoweredByUppy={false}
        note="Upload up to 1000 photos at once (max 100MB per file)"
      />
    </div>
  );
}
```

### 3.2 Add Folder Structure Preservation

1. Configure Uppy to maintain folder paths:
```javascript
// Add this to the Uppy configuration
preservePathDir: true,
```

2. Modify S3 upload logic to use folder paths in object keys

### 3.3 Implement Background Processing

1. Create upload queue management system
2. Add offline support with IndexedDB for queued uploads 
3. Use Web Workers for heavy processing tasks

### 3.4 Build Management Interface

Implement photo management features:

1. Create a photo browser component
2. Add album/collection organization
3. Implement batch operations (delete, process, etc.)

## Testing and Deployment Strategy

For each phase:

1. **Unit Testing:** Test individual components and functions
2. **Integration Testing:** Test interactions between components and AWS services
3. **Load Testing:** Simulate high-volume uploads and matching operations
4. **Deployment:** Use the existing deployment pipeline (`npm run deploy-auto`)
5. **Documentation:** Update THE_MATRIX.md and other documentation

## Conclusion

This phased approach prioritizes the core matching functionality first, allowing us to validate the matching system before investing in more complex features. The notification system has been deferred to focus on getting the essential functionality working.

By selecting Uppy.js for our photo upload component, we're providing a solution specifically designed for high-volume photography workflows, with support for folder preservation, resumable uploads, and excellent progress reporting. 