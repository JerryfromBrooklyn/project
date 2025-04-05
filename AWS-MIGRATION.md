# AWS Migration Guide: Face Recognition Photo System

This document outlines the AWS infrastructure setup, migration steps, and configuration details for the Face Recognition Photo System. This guide is intended for developers working on the project and provides a comprehensive overview of the AWS services used, database structure, and common issues with their solutions.

## Tech Stack Overview

### Frontend
- **Framework**: React.js with Vite
- **UI Library**: Custom components with TailwindCSS
- **State Management**: React Context API
- **Build Tool**: Vite
- **Deployment**: S3 + CloudFront

### Backend
- **Authentication**: AWS Cognito
- **API Layer**: AWS API Gateway + Lambda
- **Database**: DynamoDB
- **Storage**: S3
- **Face Recognition**: AWS Rekognition
- **CDN**: CloudFront

### Development Tools
- **Version Control**: Git
- **CI/CD**: AWS CloudFormation
- **Testing**: Manual + AWS Console
- **Logging**: CloudWatch

## Database Structure

### DynamoDB Tables

#### 1. shmong-users
This table stores user profile information.

| Attribute   | Type   | Description                    | Key Type    |
|-------------|--------|--------------------------------|-------------|
| id          | String | Cognito User ID                | Partition   |
| email       | String | User's email address           |             |
| full_name   | String | User's full name               |             |
| role        | String | User role (attendee, admin)    |             |
| created_at  | String | ISO timestamp of creation      |             |
| updated_at  | String | ISO timestamp of last update   |             |

#### 2. shmong-face-data
This table stores face recognition data linked to users.

| Attribute   | Type   | Description                   | Key Type    |
|-------------|--------|-------------------------------|-------------|
| userId      | String | User ID (from Cognito)        | Partition   |
| faceId      | String | AWS Rekognition Face ID       | Sort        |
| status      | String | Status (pending, active)      |             |
| created_at  | String | ISO timestamp of creation     |             |
| updated_at  | String | ISO timestamp of last update  |             |

#### 3. shmong-photos
This table stores information about uploaded photos.

| Attribute   | Type   | Description                    | Key Type    |
|-------------|--------|--------------------------------|-------------|
| id          | String | Generated unique ID            | Partition   |
| user_id     | String | ID of user who uploaded photo  | GSI Key     |
| s3_key      | String | S3 object key                  |             |
| public_url  | String | Public URL for the photo       |             |
| created_at  | String | ISO timestamp of creation      |             |
| updated_at  | String | ISO timestamp of last update   |             |

#### 4. shmong-face-matches
This table stores matches between faces and photos.

| Attribute     | Type   | Description                    | Key Type    |
|---------------|--------|--------------------------------|-------------|
| id            | String | Generated unique ID            | Partition   |
| face_id       | String | AWS Rekognition Face ID        | GSI Key     |
| photo_id      | String | ID of the matched photo        | GSI Key     |
| similarity    | Number | Confidence score (0-100)       |             |
| created_at    | String | ISO timestamp of creation      |             |

## AWS Service Configuration

### 1. DynamoDB Setup
We created multiple DynamoDB tables for storing application data. The key considerations were:
- Choosing appropriate partition and sort keys for efficient querying
- Setting up GSIs (Global Secondary Indexes) for common query patterns
- Using on-demand capacity for cost efficiency during development

**Migration Challenge**: Our initial schema design had inconsistent key names (`user_id` vs `userId`), which caused query errors. We implemented a robust multi-strategy approach in our code to handle both formats.

**Implementation Time**: 5 hours for initial setup, 3 hours for debugging schema issues.

### 2. Cognito Configuration
We set up AWS Cognito for user authentication with the following features:
- User pool with email sign-in
- Custom Lambda triggers for post-signup actions
- Admin-initiated user creation

**Migration Challenge**: Integrating Lambda with Cognito required specific IAM permissions and policy updates.

**Implementation Time**: 4 hours for initial setup, 2 hours for Lambda integration.

### 3. Lambda Functions

The application uses several Lambda functions:

#### auth-signup-function
- **Purpose**: Handles user signup and creates records in both Cognito and DynamoDB
- **Runtime**: Node.js 18.x
- **Configuration**: 
  - Memory: 128MB
  - Timeout: 10 seconds
  - Environment Variables: USER_POOL_ID, REGION

**Migration Challenge**: Initially the Lambda function only created Cognito users but didn't add corresponding DynamoDB records, which caused "User not found" errors. We expanded the function to write to both Cognito and DynamoDB simultaneously.

**Implementation Time**: 6 hours (including debugging and fixes)

### 4. S3 and CloudFront Setup

- **S3 Bucket**: shmong - Hosts frontend application code
- **CloudFront Distribution**: d3hl8q20rgtlyy.cloudfront.net - Serves the website with HTTPS

**CORS Configuration**: 
A critical part of our setup was properly configuring CORS to allow cross-origin requests. We added the following CORS configuration to the S3 bucket:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://d3hl8q20rgtlyy.cloudfront.net", "http://localhost:5173"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

**CloudFront Configuration**:
- **Origin**: S3 website endpoint
- **Behaviors**: Default (*) with:
  - CORS headers allowed
  - All HTTP methods allowed
  - Cache based on: None (no cache)
  - Compression: Enabled

**Migration Challenge**: CORS issues were a significant challenge. We solved them by:
1. Setting up proper CORS headers in S3
2. Configuring CloudFront to forward all headers to the origin
3. Creating specific behaviors for API endpoints
4. Using CloudFront for both frontend and API access to maintain same-origin requests

**Implementation Time**: 8 hours (primarily for CORS debugging)

## Development Workflow

### Building and Deploying to CloudFront

For developing with the application, we **must** use CloudFront due to CORS restrictions. The local development workflow is:

1. Make changes to the code
2. Build the application:
   ```
   npm run build
   ```
3. Upload to S3:
   ```
   aws s3 sync dist/ s3://shmong --delete
   ```
4. Invalidate CloudFront cache:
   ```
   aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*"
   ```
5. Wait 1-2 minutes for CloudFront propagation
6. Access the application at https://d3hl8q20rgtlyy.cloudfront.net

**Important**: Always deploy through CloudFront, never directly access S3 URLs. This prevents CORS issues and ensures proper API integration.

## Database Interaction Pattern

The application follows this pattern for database access:

1. **Service Layer**: JavaScript services that handle specific domain logic
2. **Data Access Layer**: Utilities that interact with DynamoDB via AWS SDK v3
3. **Error Handling**: Comprehensive error catching and reporting

Example:
```javascript
// Query for face data with multiple fallback methods
export const getFaceData = async (userId) => {
  try {
    // Try scan first with attribute containment
    const scanCommand = new ScanCommand({
      TableName: TABLES.FACE_DATA,
      FilterExpression: 'contains(#userId, :userId)',
      ExpressionAttributeNames: { '#userId': 'userId' },
      ExpressionAttributeValues: { ':userId': userId },
      Limit: 1
    });
    
    // If that fails, try query with user_id key format
    // If that fails, try full scan with string matching
    
    // Return standardized response format
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Common Issues and Solutions

### 1. CORS Errors
**Problem**: "Access to fetch at X from origin Y has been blocked by CORS policy"
**Solution**: 
- Double-check S3 bucket CORS configuration
- Ensure CloudFront forwards all necessary headers 
- Use the same domain for API and frontend (CloudFront)
- For local development, use proxy configuration

### 2. DynamoDB Query Errors
**Problem**: "Query condition missed key schema element"
**Solution**:
- Verify table key structure in AWS Console
- Use multi-strategy retrieval approach (scan, query, etc.)
- Ensure attribute names match exactly what's in the DB
- Consider using scan for flexibility during development

### 3. Session Persistence
**Problem**: Users logged out on page refresh
**Solution**:
- Store user session in localStorage
- Check localStorage on application startup
- Implement a dual-check strategy in AuthContext

### 4. Face Data Display
**Problem**: Face attributes not showing despite successful recognition
**Solution**:
- Implement robust attribute extraction with support for multiple formats
- Add detailed logging of response structure
- Create flexible rendering components that handle various data formats

## Migration Timeline

The entire migration to AWS took approximately 3 days:

- **Day 1**: Initial setup of S3, CloudFront, Cognito, and DynamoDB tables
- **Day 2**: Lambda integration, API Gateway configuration, fixing authentication issues
- **Day 3**: CORS troubleshooting, face recognition integration, final testing

The most time-consuming aspects were:
1. CORS configuration (8 hours)
2. DynamoDB schema design and query issues (5 hours)
3. Lambda integration with all services (6 hours)

## Conclusion

This AWS migration has successfully created a scalable, secure face recognition application using serverless components. By following the architecture and development patterns outlined in this document, developers can effectively work with the system and avoid common pitfalls.

For any further modifications to the infrastructure, be sure to update this document accordingly to maintain a comprehensive reference for the project. 