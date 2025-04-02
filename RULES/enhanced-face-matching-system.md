# Enhanced Face Matching System: Technical Requirements

## Overview

This document outlines the technical requirements for an enhanced face matching system that combines both upload-time and registration-time face matching. The system indexes all faces detected in photos (even unregistered ones) and enables new users to instantly match with historical photos upon registration.

## Core Principles

1. **Complete Face Indexing**: Index ALL faces detected in uploaded photos, regardless of whether they belong to registered users.
2. **Dual Matching Flow**: Support both upload-time matching and registration-time matching.
3. **Historical Match Discovery**: Enable new users to immediately discover their faces in historical photos.
4. **Consistent User Experience**: Maintain a seamless experience across all matching methods.

## System Architecture

### AWS Rekognition Integration

The system leverages AWS Rekognition APIs for face detection, indexing, and matching:

1. **IndexFaces**: Used to add faces to the AWS collection
   - Used during user registration
   - Used for every face detected in uploaded photos
   
2. **SearchFaces**: Used to find matches for an indexed face
   - Used during user registration to find historical photos
   
3. **SearchFacesByImage**: Used to search by image rather than by face ID
   - Used for verification and alternative matching

### Data Model

1. **User Record**:
   ```json
   {
     "userId": "unique-user-id",
     "faceId": "aws-assigned-face-id",
     "registrationDate": "timestamp"
   }
   ```

2. **Photo Record**:
   ```json
   {
     "photoId": "unique-photo-id",
     "uploadedBy": "user-id",
     "uploadDate": "timestamp",
     "faces": [
       {
         "faceId": "aws-face-id-1",
         "boundingBox": { "left": 0.1, "top": 0.2, "width": 0.3, "height": 0.4 },
         "confidence": 99.8,
         "claimedBy": "user-id" // may be null if unclaimed
       }
     ],
     "matched_users": [
       {
         "userId": "matched-user-id",
         "faceId": "aws-face-id",
         "similarity": 99.8,
         "confidence": 98.7
       }
     ]
   }
   ```

## Process Flows

### Photo Upload Flow

1. User uploads a photo
2. System detects all faces in the photo
3. For each detected face:
   a. Call AWS IndexFaces to add the face to the collection
   b. Store the returned FaceId in the photo's faces array
   c. Search for matching registered users (SearchFaces)
   d. Update photo's matched_users array with any matches
4. Store the photo in the database with all face and match information

### User Registration Flow

1. User uploads their profile photo for registration
2. System calls IndexFaces to add the user's face to the collection
3. Store the AWS-assigned FaceId in the user's profile
4. Call SearchFaces with the user's FaceId to find all matching faces in the collection
5. For each matching face:
   a. Locate photos containing this face
   b. Update those photos' matched_users array to include the new user
   c. Mark those faces as "claimed" by setting claimedBy to the user's ID
6. Return all matched photos to show the user immediately

### Match Viewing Flow

1. User requests to see their matching photos
2. System queries the database for photos where:
   a. The user's ID appears in the matched_users array OR
   b. The user's ID matches the claimedBy field of any face in the photo
3. Return these photos to the user, sorted by match confidence/similarity

## Scaling Considerations

1. **AWS Collection Size**: 
   - Monitor collection size as it will grow substantially with all faces indexed
   - AWS limits collections to ~20 million faces
   - Plan for collection partitioning if necessary

2. **Cost Optimization**:
   - AWS charges per IndexFaces and SearchFaces API call
   - Consider batch processing uploads during non-peak hours
   - Implement face detection confidence thresholds to avoid indexing low-quality faces

3. **Performance**:
   - Implement caching for frequent match queries
   - Consider database indexing strategies for match lookups
   - Implement background processing for large upload batches

## Implementation Strategy

1. **Phase 1**: Implement the upload-time indexing of all faces
2. **Phase 2**: Implement the registration-time matching against historical photos
3. **Phase 3**: Optimize database queries and implement caching
4. **Phase 4**: Add administrative tools for managing the face collection

## Success Metrics

1. User satisfaction with match discovery
2. System performance under load
3. AWS cost efficiency
4. Match accuracy and relevance

## Conclusion

This enhanced matching system provides a significantly improved user experience by allowing new users to instantly discover their presence in historical photos. While it requires more AWS resources and careful database design, the benefits to user engagement justify the implementation. 