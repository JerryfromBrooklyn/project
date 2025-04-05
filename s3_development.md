# S3 Development and Deployment Guide

## Overview

This document outlines the complete development, build, and deployment workflow for the face recognition application. It covers local development, cloud deployment, testing, and monitoring procedures.

## Development Environment

### Prerequisites

- Node.js 18+ installed
- AWS CLI configured with appropriate credentials
- Access to the following AWS services:
  - S3 (bucket: `shmong`)
  - CloudFront (distribution ID: `E3OEKXFISG92UV`)
  - DynamoDB (table: `shmong-face-data`)
  - Rekognition (collection: defined in environment variables)
  - Lambda (for API endpoints)

### Environment Variables

The application uses the following environment variables:
- `AWS_REGION` (default: `us-east-1`)
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (for AWS service access)
- `COLLECTION_ID` (for Rekognition face collection)
- `FACE_BUCKET_NAME` (default: `shmong-face-data`)

## Build Process

### Automatic Version Increment

The build process automatically increments the build number in the format:
`MAJOR.MINOR.PATCH.BUILD` (example: `1.0.0.033`)

This is handled by the `scripts/increment-build.js` script which is run as a pre-build step.

### Build Commands

```bash
# Standard build
npm run build

# Clean build (kills stray processes first)
npm run clean-start

# Development server
npm run dev
```

### Build Output

The build process generates optimized files in the `dist/` directory:
- HTML entry point (`index.html`)
- CSS assets (`assets/*.css`)
- JavaScript chunks (`assets/*.js`)
- Other static assets

## AWS Deployment Process

### S3 Upload

After building, upload the contents of the `dist/` directory to the S3 bucket:

```bash
aws s3 sync dist/ s3://shmong --delete
```

The `--delete` flag removes old files from the bucket that are not present in the local `dist/` directory.

### CloudFront Invalidation

To ensure users get the latest version without waiting for cache expiration:

```bash
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*"
```

This invalidates all cached paths in the CloudFront distribution, forcing a refresh from the S3 origin.

### Deployment Verification

After deployment, check the application at:
```
https://d3hl8q20rgtlyy.cloudfront.net
```

Verify the version number in the console logs:
```
=================================================
🚀 APPLICATION VERSION: 1.0.0.033 (2025-04-05 6:03:34 AM)
=================================================
```

## Face Recognition Workflow

The face recognition system uses a multi-step process:

1. **User Registration**:
   - Creates initial DynamoDB entry with `faceId: "default"` and `status: "pending"`

2. **Face Indexing**:
   - Captures user's face image
   - Calls AWS Rekognition to index face
   - Receives face ID and attributes from Rekognition

3. **Data Storage**:
   - Updates DynamoDB with actual face ID (`FaceStorageService.js`)
   - Changes status from "pending" to "active"
   - Stores face attributes (age, gender, emotions, etc.)

4. **Verification**:
   - Re-fetches user data from DynamoDB
   - Validates that the face ID is updated

## Logging System

The application uses a comprehensive logging system with emoji indicators:

- ✅ Success messages
- ❌ Error messages
- 🔍 Search and query operations
- 🔷 Process steps
- 🔶 AWS operations
- 📊 Data summaries

### CloudWatch Logging

Critical operations are logged to CloudWatch in structured format:
- `/shmong/face-operations` - Face indexing and recognition
- `/shmong/file-operations` - S3 file uploads
- `/shmong/lambda-operations` - Lambda function calls

## Testing Procedure

### Test Setup

1. Open browser developer tools (F12)
2. Clear browser cache and storage:
   - Application tab → Clear Storage → Check all boxes → Clear Site Data
3. Refresh the page and verify version in console

### Face Registration Test

1. Sign up with a new test account
2. Take a face photo when prompted
3. Monitor console logs for success indicators:
   ```
   [FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: [face-id]
   [FaceStorage] ✅ DynamoDB update SUCCESSFUL for user [user-id]
   ```
4. Verify in the Network tab that there are no CORS errors
5. Check DynamoDB data retrieval in console:
   ```
   [Dashboard] Raw face data after registration: {
     "faceId": { "S": "[face-id]" },
     "status": { "S": "active" },
     ...
   }
   ```

### Common Issues

- **CORS Errors**: Check browser console for CORS-related errors. These indicate direct browser-to-AWS requests that need to be proxied.
- **Face Detection Issues**: If faces aren't detected, check lighting and camera positioning.
- **DynamoDB Query Failures**: Check permissions and table structure if queries are failing.

## Troubleshooting

### AWS Permission Issues

If AWS operations fail with access denied:
1. Check IAM policies for the credentials being used
2. Verify the role has access to S3, DynamoDB, Rekognition, and CloudFront

### Build Failures

If the build process fails:
1. Check for JavaScript errors in the console
2. Verify all dependencies are installed (`npm install`)
3. Check the environment variables are properly set

### Deployment Issues

If deployment seems successful but the changes are not visible:
1. Clear browser cache completely
2. Verify CloudFront invalidation completed successfully
3. Check S3 bucket contents to ensure files were uploaded

## Complete Workflow Example

1. Make code changes to fix an issue
2. Test locally with `npm run dev`
3. Build with `npm run build`
4. Deploy to S3 with `aws s3 sync dist/ s3://shmong --delete`
5. Invalidate CloudFront cache with `aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*"`
6. Verify deployment by checking version number and testing functionality
7. Monitor logs for any errors or issues

## Additional AWS Commands

### Check S3 Bucket Contents

```bash
aws s3 ls s3://shmong/ --recursive
```

### View CloudFront Distribution Status

```bash
aws cloudfront get-distribution --id E3OEKXFISG92UV
```

### Test DynamoDB Access

```bash
aws dynamodb scan --table-name shmong-face-data --limit 5
```

### List CloudWatch Log Groups

```bash
aws logs describe-log-groups --log-group-name-prefix "/shmong"
``` 