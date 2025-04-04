# AWS Migration Guide

This document outlines the changes made to migrate the application from Supabase to AWS services.

## Overview

The following AWS services are now used in place of Supabase:

1. **Authentication**: Amazon Cognito (replaces Supabase Auth)
2. **Database**: Amazon DynamoDB (replaces Supabase PostgreSQL)
3. **Storage**: Amazon S3 (replaces Supabase Storage)
4. **Face Recognition**: Amazon Rekognition (was already in use)

## Key Changes

### 1. Authentication

- Implemented AWS Cognito user authentication
- Created login, signup, and email verification flows
- Updated the AuthContext to use Cognito

### 2. Database

- Replaced Supabase PostgreSQL with DynamoDB
- Created tables for:
  - Users (`shmong-users`)
  - Photos (`shmong-photos`)
  - Face Data (`shmong-face-data`)
  - Face Matches (`shmong-face-matches`)

### 3. Storage

- Replaced Supabase Storage with S3
- Created buckets for:
  - Face Data (`shmong-face-data`)
  - Photos (`shmong-photos`)

### 4. Real-time Updates

- Replaced Supabase's realtime subscriptions with polling
- Implemented periodic data fetching for photo updates
- Added refresh functionality where needed

## Configuration

To run the application with AWS, you need to set the following environment variables in your `.env` file:

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

## AWS Resources Setup

Before running the application, you need to create the following AWS resources:

### 1. Cognito User Pool

1. Create a User Pool in the AWS Console
2. Configure email verification
3. Create an App Client
4. Note the User Pool ID and Client ID

### 2. DynamoDB Tables

Create the following tables:

1. `shmong-users`:
   - Partition Key: `id` (String)
   - Additional fields: `email`, `full_name`, `role`

2. `shmong-photos`:
   - Partition Key: `id` (String)
   - Sort Key: `user_id` (String)
   - Additional fields: `url`, `file_path`, `matched_users`

3. `shmong-face-data`:
   - Partition Key: `user_id` (String)
   - Sort Key: `face_id` (String)
   - Additional fields: `bounding_box`, `confidence`

4. `shmong-face-matches`:
   - Partition Key: `user_id` (String)
   - Sort Key: `target_user_id` (String)
   - Additional fields: `similarity`, `matched_at`

### 3. S3 Buckets

Create the following buckets:

1. `shmong-face-data`:
   - Enable CORS for the domain
   - Set public read access if needed

2. `shmong-photos`:
   - Enable CORS for the domain
   - Set public read access if needed

### 4. Rekognition Collection

Create a face collection:

```bash
aws rekognition create-collection --collection-id "shmong-faces" --region "us-east-1"
```

## Running the Setup Script

To automate the creation of AWS resources, use the setup script:

```bash
npm run setup-aws
```

This will create all required AWS resources if they don't already exist.

## Testing the Migration

After setting up AWS resources, test the following key flows:

1. Sign up and verify email
2. Log in
3. Register a face
4. Upload a photo
5. View photos
6. Check face matching

## Troubleshooting

Common issues and solutions:

1. **Authentication failures**: Verify AWS Cognito settings and environment variables
2. **Missing images**: Check S3 bucket permissions and CORS settings
3. **Face matching issues**: Verify Rekognition collection ID and permissions
4. **Data retrieval issues**: Check DynamoDB table structures and access roles 