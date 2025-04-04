# AWS Migration Guide

This document provides guidance on migrating from Supabase to AWS services.

## Overview

We have migrated the application from Supabase to AWS services:

- **Authentication**: Switched from Supabase Auth to AWS Cognito
- **Storage**: Switched from Supabase Storage to AWS S3
- **Database**: Switched from Supabase PostgreSQL to AWS DynamoDB
- **Face Recognition**: AWS Rekognition (unchanged)

## Setup Instructions

### Prerequisites

1. Install AWS CLI and configure with appropriate credentials
2. Create an AWS account if you don't have one
3. Install required Node.js dependencies

### Environment Variables

Create a `.env` file based on the `.env.sample` template:

```
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
VITE_AWS_COLLECTION_ID=shmong-faces

# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id
```

### Setting Up AWS Resources

Run the setup script to create required AWS resources:

```bash
npm run setup-aws
```

This script will:
1. Create a Rekognition Collection for face recognition
2. Create required DynamoDB tables
3. Create an S3 bucket with the proper CORS configuration

### Setting Up Amazon Cognito (Manual Steps)

Cognito setup must be done manually in the AWS Console:

1. **Create a User Pool**:
   - Go to AWS Console > Cognito > User Pools > Create user pool
   - Choose "Email" as sign-in option
   - Configure required attributes (email, name)
   - Set password policy
   - Configure app client for authentication (without client secret)
   - Set callback URLs to your application domains
   - Note the User Pool ID and Client ID for your .env file

2. **Create an Identity Pool** (if needed for more AWS services access):
   - Go to AWS Console > Cognito > Identity Pools > Create identity pool
   - Enable access to unauthenticated identities if needed
   - Configure authentication providers with your User Pool ID and Client ID
   - Create roles with appropriate permissions
   - Note the Identity Pool ID for your .env file

## Code Structure Changes

The migration involved the following major changes:

1. Created new AWS authentication service in `src/services/awsAuthService.ts`
2. Updated `AuthContext.tsx` to use AWS Cognito for authentication
3. Created `src/lib/awsClient.ts` for central AWS configuration
4. Updated storage operations to use S3 in `src/services/FaceStorageService.js`
5. Created DynamoDB utilities in `src/services/database-utils.js`
6. Added email verification support for Cognito in `src/pages/VerifyEmail.tsx`

## Testing

After setup, verify that the following functions work properly:

- User registration and login
- Face detection and matching
- Photo uploads and retrieval
- User profile management

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify Cognito User Pool and Client IDs in your .env file
   - Check Cognito user pool policies and password requirements

2. **Storage Errors**:
   - Ensure S3 bucket exists and has proper CORS configuration
   - Verify IAM permissions for S3 access

3. **Database Errors**:
   - Check DynamoDB table names and indexes
   - Verify IAM permissions for DynamoDB access

4. **Face Recognition Errors**:
   - Ensure AWS Rekognition collection exists
   - Check IAM permissions for Rekognition access

### Logs and Debugging

- Check browser console for client-side errors
- Enable AWS CloudWatch logging for deeper insight into service issues
- Use AWS CloudTrail to track API calls and identify permission issues

## Migration Notes

- Social logins through Google need separate implementation with Cognito Hosted UI
- DynamoDB uses a different data model compared to PostgreSQL; review the table structures
- S3 URLs are temporary signed URLs by default; adjust expiration as needed
- Cognito requires email verification for new accounts

## Rollback Plan

In case of critical issues, temporary rollback to Supabase is possible by:

1. Restoring Supabase dependencies in package.json
2. Restoring the original configuration files
3. Uncommenting Supabase code paths
4. Removing AWS-specific components

## Support

For questions or issues, please contact the development team. 