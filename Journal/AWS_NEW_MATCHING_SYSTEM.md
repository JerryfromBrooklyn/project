# AWS NEW Matching System Documentation

**Last Updated:** 2025-04-05 17:15 PM

---

## 📋 Overview

This document outlines the planned face matching system architecture, implementation strategy, and cost analysis for Shmong's face recognition application. The system enables bidirectional matching between:

1. Registered users and faces detected in batch-uploaded photos
2. Newly uploaded photos and existing registered users 

This functionality will create a robust platform where users can register their face and then be notified when they appear in any uploaded photos, past or future.

---

## 🏗️ System Architecture

### Core Architecture Decision

The matching system will use **AWS Rekognition collection-based indexing** for all detected faces with the following approach:

- **All faces** in uploaded photos will be indexed in the Rekognition collection
- Each indexed face gets a unique `FaceId` assigned by Rekognition
- For registered users, their face is indexed with their `userId` as the `ExternalImageId`
- For faces in uploaded photos, a generated `photoId-facePosition` identifier is used as `ExternalImageId`
- Matches with confidence threshold >98% will be stored in DynamoDB

### Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────────┐
│ Photo Upload│────▶│ Face Detection│────▶│Face Indexing│────▶│ Match Existing │
└─────────────┘     └──────────────┘     └─────────────┘     └───────────────┘
                                                │                    │
                                                ▼                    ▼
                                         ┌─────────────┐     ┌───────────────┐
                                         │  AWS        │     │   DynamoDB    │
                                         │ Rekognition │     │   Matches     │
                                         └─────────────┘     └───────────────┘
                                                ▲                    ▲
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────────┐
│ User        │────▶│ Face         │────▶│Face Indexing│────▶│ Match Against │
│ Registration│     │ Capture      │     │with userId  │     │ Photo Faces   │
└─────────────┘     └──────────────┘     └─────────────┘     └───────────────┘
```

### User Journey Scenarios

#### Scenario 1: User Registers After Photos Exist (Historical Matching)

1. User registers and their face is indexed in Rekognition with their `userId` as `ExternalImageId`
2. System initiates a search for this face against all previously indexed faces in the collection
3. If matches with >98% confidence are found, match records are created in DynamoDB
4. User receives notifications for all historical matches 

#### Scenario 2: Photos Uploaded After User Registration (Future Matching)

1. New photos are uploaded to the system
2. Each detected face in the photos is indexed in Rekognition
3. Each newly indexed face is compared against registered user faces in the collection
4. If matches with >98% confidence are found, match records are created in DynamoDB
5. Relevant users receive notifications about the new matches

---

## 💰 Cost Analysis

### AWS Service Costs (Applicable to Matching)

| Service | Operation | Price | Usage Pattern |
|---------|-----------|-------|---------------|
| **AWS Rekognition** | IndexFaces | $0.001 per face | Each face in uploaded photos + each registered user |
| **AWS Rekognition** | SearchFacesByImage | $0.001 per search | Each search comparing a face |
| **AWS Rekognition** | SearchFaces | $0.001 per search | Each search using a FaceId |
| **AWS DynamoDB** | Write Unit (WCU) | $0.25 per million WCUs | Each match record created |
| **AWS DynamoDB** | Read Unit (RCU) | $0.05 per million RCUs | Reading match data for users |
| **Amazon S3** | Storage | $0.023 per GB/month | Storing photos |
| **AWS Lambda** | Invocation | $0.20 per million requests | Processing matches |

### Scenario Cost Comparison

For a scenario with:
- 250 users registered in the system
- 10,000 photos uploaded per month
- Average of 3 faces per photo
- 30,000 faces indexed per month from photos
- 2% match rate (users appearing in photos)

**Option 1: Don't Index Photo Faces (Search Only)**
- Cost to index registered users: $0.25 (250 × $0.001)
- Cost to search each photo face against collection: $30.00 (30,000 × $0.001)
- Total estimated monthly cost: **$40.63**

**Option 2: Index All Faces (Our Selected Approach)**
- Cost to index all faces (users + photos): $30.25 ((250 + 30,000) × $0.001)
- Cost to search newly registered users: $0.25 (250 × $0.001)
- Cost to search newly indexed photo faces: $0.08 (average based on match rates)
- Total estimated monthly cost: **$30.58**

**Conclusion:** Option 2 (our selected approach) is more cost-effective by ~$10/month in this scenario.

### API Calls Per Operation

| Operation | API Calls Per User | API Calls Per Photo | API Calls Per Face |
|-----------|-------------------|---------------------|-------------------|
| User Registration | 1 IndexFaces | - | - |
| Historical Matching | 1 SearchFaces | - | - |
| Photo Upload | - | 1 DetectFaces | - |
| Photo Face Indexing | - | - | 1 IndexFaces |
| Future Matching | - | - | 1 SearchFaces |
| Match Processing | - | - | ~1 DynamoDB Write |

---

## 🔄 Scale & Limitations

### AWS Rekognition Collection Limits

- **Maximum faces per collection:** 20 million
- **Maximum collections per account:** 1,000
- **Maximum searches per second:** 5 (default, can request increase)

### Scaling Strategy

As the system grows and approaches the 20M face limit, we will implement:

1. **Collection Rotation:**
   - Create new collections when reaching ~18M faces threshold
   - Implement metadata tracking for which collection contains which timeframe of faces
   - Update search logic to search across multiple collections as needed

2. **Quality Filtering:**
   - Implement quality threshold for indexing faces (minimum size, confidence)
   - Filter out low-resolution or low-confidence face detections
   - Option to only index faces above certain size relative to image

3. **Collection Management:**
   - Create automated tooling to monitor collection size
   - Implement policies for potential removal of older indexed faces
   - Add administrative interface for collection management

---

## 🔧 New Database Table: `shmong-face-matches`

A new DynamoDB table will store all face match information:

**Primary Key Structure:**
- `userId` (Partition Key): The registered user's ID
- `matchId` (Sort Key): Composite key combining `photoId` and timestamp

**Attributes:**
- `photoId`: ID of the photo containing the match
- `faceId`: The AWS Rekognition FaceId for the matched face 
- `confidence`: Match confidence score (>98%)
- `matchedAt`: Timestamp when match was discovered
- `photoMetadata`: JSON object containing photo details (location, event, etc.)
- `status`: Match status (new, viewed, hidden)
- `boundingBox`: JSON object with face position in the photo

---

## 🚀 Implementation Plans

### Photo Upload Component Requirements

The bulk photo upload component should support:

1. Multiple file selection via drag-and-drop
2. Directory/folder uploading
3. Progress tracking for large uploads
4. Automatic categorization by timestamp/location
5. Mobile device compatibility
6. Background uploading while using other app features
7. Pause/resume functionality for large uploads
8. Concurrent uploads to maximize bandwidth
9. Ability to handle thousands of files at once

### Recommended Libraries

1. **Uppy.js** (https://uppy.io)
   - Full-featured file uploader with drag-drop, progress, resumable uploads
   - Excellent mobile support and customizable UI
   - AWS S3 integration built-in

2. **Filepond** (https://pqina.nl/filepond/)
   - Modern, accessible file uploader
   - Excellent folder structure support
   - Good mobile interfaces

3. **Dropzone.js** (https://www.dropzone.dev/)
   - Highly configurable
   - Simple integration
   - Supports massive file uploads

---

## 🔄 Implementation Strategy

### Plan A: Phased Implementation (Score: 95/100)

**Phase 1: Core Registration and Matching Infrastructure**
1. Enhance existing face registration system
2. Create new face-matches DynamoDB table
3. Implement historical matching for new registrations
4. Set up notifications system for matches

**Phase 2: Basic Photo Upload and Processing**
1. Implement simple photo upload interface 
2. Create photo processing pipeline
3. Implement face detection and indexing for uploaded photos
4. Build future matching system for new uploads

**Phase 3: Advanced Upload Features**
1. Integrate bulk upload component (Uppy.js recommended)
2. Add progress tracking and background processing
3. Implement folder structure preservation
4. Add management interface for photo collections

**Pros:**
- Incremental value delivery
- Lower initial implementation complexity
- Easier testing and validation of each component
- Reduced risk of system-wide failures

**Cons:**
- Longer time to full feature completion
- Potential rework between phases
- User experience evolves rather than arrives complete

### Plan B: Comprehensive Implementation (Score: 85/100)

Implement the entire matching system and photo upload infrastructure simultaneously:

1. Create new DynamoDB tables and complete AWS infrastructure
2. Implement advanced photo upload with Uppy.js
3. Build face detection, indexing, and matching pipeline
4. Create notification system and user interfaces
5. Launch complete end-to-end solution

**Pros:**
- Complete feature set available at launch
- Avoids multiple user experience changes
- Potentially faster time to complete implementation
- End-to-end testing possible sooner

**Cons:**
- Higher implementation complexity and risk
- Longer time before any value is delivered
- More difficult troubleshooting of integrated system
- Requires more upfront design decisions

### Plan C: API-First Implementation (Score: 80/100)

1. Build AWS Lambda-based API layer for all face operations
2. Create API endpoints for face indexing, searching, and matching
3. Implement service layer for photo processing behind API
4. Develop separate frontend components that consume the API
5. Progressive enhancement of user interfaces

**Pros:**
- Clean separation of concerns
- API documentation becomes usable specification
- Easier to add capabilities without frontend changes
- Better for potential partner/SDK integration

**Cons:**
- Additional complexity in API management
- Potential performance overhead
- More infrastructure to maintain
- Increased initial development time

---

## 🔄 Testing Strategy

Each implementation phase will include:

1. **Unit tests** for core face detection and matching algorithms
2. **Integration tests** for AWS service interactions
3. **Load testing** with simulated large photo batches
4. **Performance optimization** for multi-face processing

---

## 📊 Success Metrics

1. **Match Accuracy Rate:** >98% confidence in facial matches
2. **Processing Speed:** <5 minutes from upload to matches discovered
3. **Scalability:** Successful handling of 1TB+ photo uploads
4. **User Engagement:** >50% of users checking match notifications
5. **Cost Efficiency:** Maintaining <$0.001 average cost per photo processed 