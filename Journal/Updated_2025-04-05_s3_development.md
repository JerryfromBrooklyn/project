# Updated AWS Face Recognition Application Documentation (2025-04-05)

## Overview

This document provides comprehensive documentation for the cloud-based face recognition application, incorporating our latest development findings, deployment workflow, and critical system configurations. This journal entry records what was accomplished, lessons learned, and key configuration improvements made to the application.

## Recent Development Activities (2025-04-05)

### Issues Identified and Fixed

1. **DynamoDB Data Retrieval Issue**
   - **Problem**: Face registration created new records instead of updating existing ones
   - **Solution**: Modified `database-utils.js` to sort by timestamp and select the most recent record
   - **Verification**: Successfully validated that the correct Face ID now displays after registration

2. **Database Structure Improvements**
   - Added Global Secondary Index (GSI) called "UserIdCreatedAtIndex" to efficiently query by user and timestamp
   - Standardized field naming to consistently use snake_case
   - Flattened data structure by bringing important attributes to top level
   - Updated the query code to use the new GSI while maintaining fallback compatibility
   - Added key face attributes (age range, gender, primary emotion) as top-level fields

3. **AWS Permissions Issues**
   - **Problem**: `AccessDeniedException` errors for DynamoDB GSI operations
   - **Root Cause**: IAM policy for SHMONG user lacked specific permissions for GSI
   - **Initial Fix**: Updated IAM policy to include GSI resource path:
     ```
     arn:aws:dynamodb:us-east-1:774305584181:table/shmong-face-data/index/*
     ```
   - **Comprehensive Fix**: Applied full development permissions for all AWS services:
     - DynamoDB - Complete table and index access
     - Rekognition - All face detection/indexing features
     - Lambda - Function creation, invocation, and management
     - S3 - Full bucket and object access
     - CloudFront - Distribution and invalidation management
     - API Gateway - API management and invocation
     - Cognito - User pool and identity operations
     - CloudWatch & Logs - Monitoring and log access
     - IAM PassRole - Required for Lambda execution

4. **Deployment Script Enhancements**
   - Fixed PowerShell syntax errors in `deploy.ps1`
   - Added `--no-cli-pager` flag to prevent interactive prompts
   - Enhanced cross-platform compatibility with `deploy-auto.js`
   - Resolved CloudFront invalidation issues

### Lessons Learned

1. **IAM Permission Management**
   - AWS services require granular permissions for cross-service interactions
   - GSIs need explicit resource permissions beyond the base table access
   - For development, broader permissions eliminate roadblocks
   - Production environments should use principle of least privilege

2. **DynamoDB Best Practices**
   - Global Secondary Indexes dramatically improve query performance
   - Consistent field naming (snake_case) simplifies development
   - Timestamp-based sorting ensures the most recent record is retrieved
   - Fallback query mechanisms provide system resilience

3. **Error Handling Improvements**
   - Comprehensive logging with clear emoji indicators
   - Multiple fallback mechanisms when primary operations fail
   - Detailed error reports in CloudWatch for troubleshooting

4. **Cross-Platform Development**
   - PowerShell requires different syntax for AWS CLI commands
   - JSON escaping differs between bash and PowerShell
   - Using Node.js scripts improves cross-platform reliability

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
`MAJOR.MINOR.PATCH.BUILD` (example: `1.0.0.052`)

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

### Automated Deployment

The new automated deployment process uses the `deploy-auto.js` script to ensure consistent deployment across platforms:

```bash
# Run automated deployment (handles OS detection and proper syntax)
npm run deploy:auto
```

This script:
1. Detects the operating system
2. Selects the appropriate deployment command based on OS
3. Handles syntax differences between PowerShell and Bash
4. Provides detailed logging with emoji indicators for status
5. Implements proper error handling and exit codes

### Manual Deployment Steps

If needed, you can perform manual deployment using these steps:

#### S3 Upload

After building, upload the contents of the `dist/` directory to the S3 bucket:

##### For Linux/macOS:
```bash
aws s3 sync dist/ s3://shmong --delete
```

##### For Windows PowerShell:
```powershell
aws s3 sync dist/ s3://shmong --delete
```

The `--delete` flag removes old files from the bucket that are not present in the local `dist/` directory.

#### CloudFront Invalidation

To ensure users get the latest version without waiting for cache expiration:

##### For Linux/macOS:
```bash
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*"
```

##### For Windows PowerShell:
```powershell
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*" --no-cli-pager
```

The `--no-cli-pager` flag prevents interactive prompts in PowerShell.

### Deployment Verification

After deployment, check the application at:
```
https://d3hl8q20rgtlyy.cloudfront.net
```

Verify the version number in the console logs:
```
=================================================
🚀 APPLICATION VERSION: 1.0.0.052 (2025-04-05 7:53:54 AM)
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
   - Creates record with consistent field naming (snake_case)
   - Includes timestamp for sorting and retrieval

4. **Data Retrieval**:
   - Primary method: Query GSI "UserIdCreatedAtIndex" sorted by timestamp
   - Fallback: Scan with filter expression if GSI query fails
   - Selects the most recent record based on timestamps

## Logging System

The application uses a comprehensive logging system with emoji indicators:

- ✅ Success messages
- ❌ Error messages
- 🔍 Search and query operations
- 🔷 Process steps
- 🔶 AWS operations
- 📊 Data summaries

### Console Logging

Detailed information is logged to the browser console for debugging:
```javascript
[AWS CLIENT] Creating AWS clients with region: us-east-1
[STARTUP] 🔍 AWS Environment Variables Status: {...}
[AuthContext] Found user in localStorage: 2428b4e8-8081-707e-2622-5cca84aad3a4
[DB] Getting face data for user 2428b4e8-8081-707e-2622-5cca84aad3a4 from DynamoDB
```

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
3. For development environments, apply the full access policy:
   ```
   # Apply comprehensive development permissions
   aws iam put-user-policy --user-name SHMONG --policy-name ShmongFullDevAccess --policy-document file://full-dev-access.json
   ```

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
4. Deploy with cross-platform script: `npm run deploy:auto`
5. Verify deployment by checking version number and testing functionality
6. Monitor logs for any errors or issues

## AWS Commands Reference

### IAM Management

#### Check User Policies
```bash
aws iam list-user-policies --user-name SHMONG
```

#### Get Policy Details
```bash
aws iam get-user-policy --user-name SHMONG --policy-name ShmongFullDevAccess
```

#### Update User Policy
```bash
aws iam put-user-policy --user-name SHMONG --policy-name ShmongFullDevAccess --policy-document file://policy-file.json
```

### DynamoDB Operations

#### Check Table Structure
```bash
aws dynamodb describe-table --table-name shmong-face-data
```

#### Scan Table Content
```bash
aws dynamodb scan --table-name shmong-face-data --limit 5
```

#### Check GSI Configuration
```bash
aws dynamodb describe-table --table-name shmong-face-data --query "Table.GlobalSecondaryIndexes"
```

### S3 Bucket Operations

```bash
aws s3 ls s3://shmong/ --recursive
```

### CloudFront Management

```bash
aws cloudfront get-distribution --id E3OEKXFISG92UV
```

### Lambda Function Testing

```bash
aws lambda invoke --function-name update-face-data --payload "{\"operation\":\"TEST\",\"userId\":\"test-user\"}" response.json
```

### CloudWatch Logs

```bash
aws logs describe-log-groups --log-group-name-prefix "/shmong"
```

## Next Steps

1. **Monitoring Dashboard**: Create CloudWatch dashboard for key metrics
2. **Error Rate Alerts**: Set up CloudWatch alarms for error conditions
3. **Performance Optimization**: Tune DynamoDB capacity for cost efficiency
4. **Security Enhancements**: Refine IAM permissions for production 