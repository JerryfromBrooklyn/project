# Shmong Face Registration Database Structure

## Overview
The face registration system uses AWS DynamoDB with a hybrid data model that combines:
- Individual columns for frequently queried fields (for efficient filtering and querying)
- JSON blobs for complete data storage (for flexibility and future-proofing)

This design maximizes DynamoDB's strengths while maintaining query performance and flexibility.

## Primary Table: `shmong-face-data`

### Primary Keys
- `userId` (Partition Key): User identifier (String)
- `faceId` (Sort Key): Face identifier from Rekognition (String)

### Timestamps
- `createdAt`: When the record was created (ISO-8601 String)
- `updatedAt`: When the record was last updated (ISO-8601 String)

### Media References
- `imageUrl`: S3 URL to face image (String)
- `imagePath`: S3 path to face image (String)
- `videoUrl`: S3 URL to face video (String) 
- `videoId`: Identifier for video recording (String)

### Video Metadata
- `videoResolution`: Resolution of recorded video e.g. "3840x2160" (String)
- `videoDuration`: Duration in seconds (Number)
- `videoFrameRate`: Frame rate in fps (Number)

### Location Data
- `latitude`: Geographic latitude (Number)
- `longitude`: Geographic longitude (Number)
- `address`: Full address string (String)
- `country`: Country name (String)
- `city`: City or town name (String)
- `locationData`: Complete JSON blob of all location data (String)

### Device & Browser Data
- `ipAddress`: IP address of registration device (String)
- `browser`: Browser type (String)
- `operatingSystem`: OS type (String)
- `language`: Browser language (String)
- `timezone`: Device timezone (String)
- `networkType`: Network connection type (String)
- `isp`: Internet Service Provider (String)
- `deviceData`: Complete JSON blob of all device data (String)

### Demographics & Face Attributes
- `gender`: Detected gender (String)
- `ageRangeLow`: Lower bound of age estimate (Number)
- `ageRangeHigh`: Upper bound of age estimate (Number) 
- `emotion`: Dominant emotion detected (String)
- `emotionConfidence`: Confidence score for emotion (Number)
- `faceLandmarks`: JSON string of facial landmark points (String)
- `faceAttributes`: Complete JSON blob of all face attributes (String)

### Registration Metadata
- `registrationUrl`: URL where registration occurred (String)
- `historicalMatchCount`: Number of historical matches (Number)
- `historicalMatches`: Array of historical face matches (List)

## JSON Blob Fields
The system stores data in both individual columns and consolidated JSON blobs:

### `locationData` JSON Structure
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 10.5,
  "timestamp": 1684567892645,
  "altitude": 12.5,
  "altitudeAccuracy": 5.0,
  "address": "123 Main St, San Francisco, CA 94105",
  "addressDetails": {
    "country": "United States",
    "countryCode": "US",
    "city": "San Francisco",
    "state": "California",
    "postalCode": "94105",
    "street": "Main St",
    "houseNumber": "123"
  }
}
```

### `deviceData` JSON Structure
```json
{
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "language": "en-US",
  "platform": "MacIntel",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "pixelRatio": 2,
  "colorDepth": 24,
  "timezone": "America/New_York",
  "sessionTime": "2025-05-02T12:00:00.000Z",
  "networkType": "4G",
  "downlink": 10.5,
  "rtt": 50,
  "ipAddress": "192.168.1.1",
  "ipCountry": "United States",
  "ipCity": "San Francisco",
  "ipOrganization": "Comcast",
  "cameraLabel": "FaceTime HD Camera",
  "cameraResolution": "3840x2160",
  "cameraFrameRate": 30,
  "hasAudio": true,
  "interaction": {
    "startTime": "2025-05-02T11:58:30.000Z",
    "captureAttempts": 2,
    "totalTimeSpent": 90.5,
    "errors": [
      {
        "time": "2025-05-02T11:59:00.000Z",
        "message": "No faces detected. Please try again in better lighting."
      }
    ]
  }
}
```

### `faceAttributes` JSON Structure
```json
{
  "BoundingBox": {
    "Width": 0.6,
    "Height": 0.8,
    "Left": 0.15,
    "Top": 0.1
  },
  "Landmarks": [
    {"Type": "eyeLeft", "X": 0.394, "Y": 0.452},
    {"Type": "eyeRight", "X": 0.606, "Y": 0.452},
    {"Type": "nose", "X": 0.500, "Y": 0.547},
    {"Type": "mouthLeft", "X": 0.394, "Y": 0.648},
    {"Type": "mouthRight", "X": 0.606, "Y": 0.648}
  ],
  "Pose": {"Roll": 2.5, "Yaw": -3.7, "Pitch": 0.9},
  "Quality": {"Brightness": 75.4, "Sharpness": 89.3},
  "Confidence": 99.8,
  "AgeRange": {"Low": 25, "High": 35},
  "Gender": {"Value": "Male", "Confidence": 98.5},
  "Emotions": [
    {"Type": "HAPPY", "Confidence": 86.7},
    {"Type": "CALM", "Confidence": 10.3},
    {"Type": "SURPRISED", "Confidence": 2.1}
  ]
}
```

## Indexes

### Primary Index
- Partition Key: `userId`
- Sort Key: `faceId`
- Use: Direct lookups of specific faces for specific users

### Global Secondary Indexes (GSIs)

#### `IpAddressIndex`
- Partition Key: `ipAddress`
- Sort Key: `createdAt`
- Use: Find all registrations from the same IP address

## Query Patterns

### Common Query Patterns
1. Get face data for a specific user: Query by `userId`
2. Get all registrations from a specific location: Query by `country` and/or `city`
3. Get all registrations from a specific IP: Query using `IpAddressIndex`
4. Get demographics for analytics: Scan with filters on `gender`, `ageRangeLow`, and `ageRangeHigh`
5. Get registrations by device type: Scan with filters on `browser` and `operatingSystem`

## Design Rationale

### Why This Hybrid Approach
1. **Query Efficiency**: Individual columns allow efficient filtering and querying on specific attributes
2. **Schema Flexibility**: JSON blobs allow storing complete data without schema changes
3. **Performance Optimization**: Most common query fields have dedicated columns
4. **Data Integrity**: Complete data preserved in JSON format even if specific column extraction fails

### Best Practices Applied
1. **Data Locality**: Related data stored together
2. **Sparse Indexes**: Only meaningful attributes used for indexes
3. **Selective Denormalization**: Strategic duplication to optimize query patterns
4. **Size Management**: Large blob data stored in both compact columns and complete JSON 