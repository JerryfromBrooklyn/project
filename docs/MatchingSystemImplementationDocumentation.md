# Shmong Face Matching System - Complete Implementation Guide

## 1. System Overview

The Shmong face matching system is a powerful AWS-based facial recognition platform that lets users register their faces and automatically discover photos containing them. The system uses AWS Rekognition for face detection, indexing, and matching, along with DynamoDB for data storage and S3 for photo storage.

### 1.1 Core Functionality

* **User Registration:** Users register with email, password, and a facial scan
* **Photo Upload:** Users can upload photos containing faces
* **Face Indexing:** System detects and indexes faces in uploaded photos
* **Historical Matching:** When users register, the system searches all existing photos for matches
* **Future Matching:** New photo uploads are automatically matched against registered users
* **Dashboard View:** Users can see all photos they appear in, *as well as a summary count of their uploaded photos and matched photos.*
* **Photo Manager View:** Users see a count of photos relevant to the current view (uploaded or matched).

### 1.2 Key Technical Components

* **AWS Rekognition:** Powers face detection, storage, and matching
* **AWS DynamoDB:** Stores user data, photo metadata, and face matching relationships
* **AWS S3:** Stores uploaded photos
* **AWS Lambda:** Processes background tasks for matching and indexing
* **React Frontend:** Provides user interface for registration, upload, and viewing matches

## 2. How the Face Matching System Works

### 2.1 The Matching Architecture

The face matching system uses a sophisticated dual-prefix architecture to distinguish between user registration faces and faces detected in photos:

```
┌─────────────────┐     Registers     ┌─────────────────┐
│                 │  with face scan   │                 │
│      User       ├──────────────────►│ AWS Rekognition │
│                 │                   │    Collection   │
└────────┬────────┘                   │                 │
         │                            │  ┌───────────┐  │
         │                            │  │user_[UUID]│  │
         │                            │  └───────────┘  │
         │                            │                 │
         │                            │  ┌───────────┐  │
         │         Uploads            │  │photo_[UUID│  │
         └─────────photos─────────────►  └───────────┘  │
                                      │                 │
                                      └────────┬────────┘
                                               │
                                               │ Searches for
                                               │ matches
                                               ▼
┌─────────────────┐                   ┌─────────────────┐
│                 │                   │                 │
│  User's "My     │◄──────────────────┤  DynamoDB      │
│  Photos" View   │   Shows matches   │  matched_users  │
│                 │                   │                 │
└─────────────────┘                   └─────────────────┘
```

### 2.2 The Prefix System Explained

The core of the system relies on a critical distinction between two types of faces in the Rekognition collection:

1. **User Registration Faces** (`user_` prefix):
   - When a user registers, their face is stored in Rekognition with a `user_[userId]` external ID
   - These faces are considered the canonical representation of a user's identity
   - Example: `user_b428d4f8-70d1-70e7-564d-1e1dc029929b`

2. **Photo Faces** (`photo_` prefix):
   - When a photo is uploaded, detected faces are stored with a `photo_[photoId]` external ID
   - These faces represent instances of faces in uploaded photos
   - Example: `photo_f2520b6d-a689-408c-b53e-546dfe986609`

This prefix system solves several critical problems:
- Prevents users from seeing other users' registration faces in "My Photos"
- Allows proper distinction between a user identity and a photo instance
- Enables accurate bidirectional matching across the system

### 2.3 The Matching Process Step-by-Step

#### User Registration & Historical Matching:

1. User registers via frontend with email, password, and face scan
2. System captures face image and sends to AWS Lambda function or directly processes in frontend service
3. Face is indexed with `user_[userId]` prefix in Rekognition collection
4. User's face ID is stored in DynamoDB `shmong-face-data` table
5. System performs immediate historical matching:
   - Searches Rekognition for faces matching the new user's face (`user_` prefix searching for `photo_` prefix)
   - Updates each matching photo's `matched_users` array to include the new user
   - Stores match information in `historicalMatches` array for the user (in `shmong-face-data`)

#### Photo Upload & Future Matching:

1. User uploads photo through frontend
2. Photo is stored in S3 with a unique photoId
3. Photo metadata is stored in DynamoDB `shmong-photos` table
4. AWS Rekognition detects faces in the photo
5. Each detected face is indexed with `photo_[photoId]` prefix
6. System performs immediate matching:
   - For each detected face (`photo_` prefix), searches Rekognition (`MaxFaces: 1000`, Threshold: 99%) for matching faces
   - Filters search results to find faces with `user_` prefix
   - Updates the *new photo's* `matched_users` array with the `userId` of each valid match
7. *Matched users will see this photo in their "My Photos" view (which calls `awsPhotoService.fetchPhotos`).*

#### Bidirectional Matching Updates:

The system also includes a background process that ensures bidirectional consistency:
- Periodically scans all photos and all users
- For each user, ensures their face ID is properly linked in all matching photos
- Updates `matched_users` arrays to maintain consistency

## 3. Recent Fixes & Improvements

### 3.1 Prefix System Implementation

We recently fixed a critical issue with inconsistent matching by implementing the prefix system. Before this fix:
- Users were seeing inconsistent numbers of matches (Leon saw 13, Fred saw 6)
- User registration faces were appearing in "My Photos" views
- The system couldn't properly distinguish between user identities and photo instances

The fix involved:
1. Updating `faceMatchingService.js` to use the `user_` prefix when registering faces
2. Updating `awsPhotoService.js` to use the `photo_` prefix when indexing photo faces
3. Adding filtering logic to only match appropriate prefixes during search
4. Implementing proper ID extraction by removing prefixes where needed

### 3.2 Syntax Error Fixes

Fixed a syntax error in `faceMatchingService.js` by removing duplicated code that was causing parsing issues during build. This error appeared as:

```
[plugin:vite:import-analysis] Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.
```

### 3.3 Matching Accuracy Improvements

Improved matching accuracy by:
- Using a threshold of 80% for photo matching but 99% for identity verification
- Implementing better handling of confidence scores and similarity metrics
- Properly skipping exact self-matches and suspiciously perfect 100% matches

## 4. Complete Setup Instructions for New AWS Account

### 4.1 AWS Account Setup

1. **Create AWS Account**:
   - Go to https://aws.amazon.com and click "Create an AWS Account"
   - Follow the signup steps and verify your identity
   - Choose the "Free Tier" option

2. **Install AWS CLI**:
   ```bash
   # For Windows (using installer) or
   # For macOS
   brew install awscli
   # For Linux
   pip install awscli
   ```

3. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter default region (e.g., us-east-1)
   # Enter default output format (json)
   ```

### 4.2 Create Required AWS Resources

1. **Create IAM Role and Policy**:

   ```bash
   # Create IAM role for Lambda execution
   aws iam create-role --role-name ShmongLambdaExecRole --assume-role-policy-document file://lambda-trust-policy.json

   # Create IAM policy
   aws iam create-policy --policy-name ShmongLambdaExecPolicy --policy-document file://lambda-exec-policy.json

   # Attach policy to role
   aws iam attach-role-policy --role-name ShmongLambdaExecRole --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ShmongLambdaExecPolicy
   ```

   Contents of `lambda-trust-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "lambda.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```

   Contents of `lambda-exec-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "logs:CreateLogGroup",
           "logs:CreateLogStream",
           "logs:PutLogEvents"
         ],
         "Resource": "arn:aws:logs:*:*:*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "rekognition:CreateCollection",
           "rekognition:DeleteCollection",
           "rekognition:DeleteFaces",
           "rekognition:DetectFaces",
           "rekognition:IndexFaces",
           "rekognition:ListCollections",
           "rekognition:ListFaces",
           "rekognition:SearchFaces",
           "rekognition:SearchFacesByImage"
         ],
         "Resource": "*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:GetItem",
           "dynamodb:PutItem",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem",
           "dynamodb:Scan",
           "dynamodb:Query",
           "dynamodb:BatchGetItem",
           "dynamodb:BatchWriteItem"
         ],
         "Resource": [
           "arn:aws:dynamodb:*:*:table/shmong-users",
           "arn:aws:dynamodb:*:*:table/shmong-photos",
           "arn:aws:dynamodb:*:*:table/shmong-face-data",
           "arn:aws:dynamodb:*:*:table/shmong-face-matches",
           "arn:aws:dynamodb:*:*:table/shmong-notifications"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::shmong/*"
       }
     ]
   }
   ```

2. **Create DynamoDB Tables**:

   ```bash
   # Create Users table
   aws dynamodb create-table \
     --table-name shmong-users \
     --attribute-definitions AttributeName=id,AttributeType=S \
     --key-schema AttributeName=id,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST

   # Create Photos table
   aws dynamodb create-table \
     --table-name shmong-photos \
     --attribute-definitions AttributeName=id,AttributeType=S AttributeName=user_id,AttributeType=S \
     --key-schema AttributeName=id,KeyType=HASH \
     --global-secondary-indexes '[{"IndexName":"UserIdIndex","KeySchema":[{"AttributeName":"user_id","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
     --billing-mode PAY_PER_REQUEST

   # Create Face Data table
   aws dynamodb create-table \
     --table-name shmong-face-data \
     --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=faceId,AttributeType=S \
     --key-schema AttributeName=userId,KeyType=HASH \
     --global-secondary-indexes '[{"IndexName":"FaceIdIndex","KeySchema":[{"AttributeName":"faceId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
     --billing-mode PAY_PER_REQUEST
     
   # Create Notifications table
   aws dynamodb create-table \
     --table-name shmong-notifications \
     --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S \
     --key-schema AttributeName=id,KeyType=HASH \
     --global-secondary-indexes '[{"IndexName":"UserIdIndex","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
     --billing-mode PAY_PER_REQUEST
   ```

3. **Create S3 Bucket**:

   ```bash
   # Create S3 bucket for photos
   aws s3 mb s3://shmong --region us-east-1
   
   # Set CORS policy for bucket
   aws s3api put-bucket-cors --bucket shmong --cors-configuration file://s3-cors-config.json
   ```

   Contents of `s3-cors-config.json`:
   ```json
   {
     "CORSRules": [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": ["ETag"]
       }
     ]
   }
   ```

4. **Create Rekognition Collection**:

   ```bash
   # Create face collection
   aws rekognition create-collection --collection-id shmong-faces --region us-east-1
   ```

### 4.3 Set Up Lambda Functions

1. **Create Lambda Functions**:

   ```bash
   # Create function directory
   mkdir -p lambda/shmong-face-register
   
   # Create package.json
   echo '{
     "name": "shmong-face-register",
     "version": "1.0.0",
     "dependencies": {
       "aws-sdk": "^2.1040.0"
     }
   }' > lambda/shmong-face-register/package.json
   
   # Install dependencies
   cd lambda/shmong-face-register && npm install && cd ../..
   ```

   Create the Lambda handler file (`lambda/shmong-face-register/index.js`):
   ```javascript
   const AWS = require('aws-sdk');
   const rekognition = new AWS.Rekognition();
   const dynamoDB = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     try {
       // Parse request body
       const body = JSON.parse(event.body);
       const { userId, imageData } = body;
       
       if (!userId || !imageData) {
         return {
           statusCode: 400,
           headers: {
             "Access-Control-Allow-Origin": "*",
             "Access-Control-Allow-Headers": "Content-Type",
             "Access-Control-Allow-Methods": "OPTIONS,POST"
           },
           body: JSON.stringify({ error: "Missing required parameters" })
         };
       }
       
       // Decode base64 image
       const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), 'base64');
       
       // Index face in Rekognition
       const indexParams = {
         CollectionId: 'shmong-faces',
         Image: { Bytes: buffer },
         ExternalImageId: `user_${userId}`,
         MaxFaces: 1,
         QualityFilter: "AUTO",
         DetectionAttributes: ["DEFAULT"]
       };
       
       const indexResponse = await rekognition.indexFaces(indexParams).promise();
       
       if (!indexResponse.FaceRecords || indexResponse.FaceRecords.length === 0) {
         return {
           statusCode: 400,
           headers: {
             "Access-Control-Allow-Origin": "*",
             "Access-Control-Allow-Headers": "Content-Type",
             "Access-Control-Allow-Methods": "OPTIONS,POST"
           },
           body: JSON.stringify({ error: "No face detected in image" })
         };
       }
       
       const faceId = indexResponse.FaceRecords[0].Face.FaceId;
       
       // Store face ID in DynamoDB
       const dbParams = {
         TableName: 'shmong-face-data',
         Item: {
           userId: userId,
           faceId: faceId,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           historicalMatches: []
         }
       };
       
       await dynamoDB.put(dbParams).promise();
       
       // Find historical matches
       const searchParams = {
         CollectionId: 'shmong-faces',
         FaceId: faceId,
         FaceMatchThreshold: 80.0,
         MaxFaces: 1000
       };
       
       const searchResult = await rekognition.searchFaces(searchParams).promise();
       
       let matchCount = 0;
       
       if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
         // Process matches
         for (const match of searchResult.FaceMatches) {
           // Skip self-match
           if (match.Face.FaceId === faceId) continue;
           
           const externalId = match.Face.ExternalImageId;
           
           // Only process photo_ matches (not user_ matches)
           if (externalId && externalId.startsWith('photo_')) {
             const photoId = externalId.substring(6); // Remove 'photo_' prefix
             
             // Get photo
             const photoParams = {
               TableName: 'shmong-photos',
               Key: { id: photoId }
             };
             
             try {
               const photoData = await dynamoDB.get(photoParams).promise();
               
               if (photoData.Item) {
                 // Update matched_users array
                 let matchedUsers = photoData.Item.matched_users || [];
                 
                 if (typeof matchedUsers === 'string') {
                   try {
                     matchedUsers = JSON.parse(matchedUsers);
                   } catch (e) {
                     matchedUsers = [];
                   }
                 }
                 
                 if (!Array.isArray(matchedUsers)) {
                   matchedUsers = [];
                 }
                 
                 // Check if user already exists in matched_users
                 const userIndex = matchedUsers.findIndex(m => 
                   (m.userId && m.userId === userId) || 
                   (m.user_id && m.user_id === userId) ||
                   (typeof m === 'string' && m === userId)
                 );
                 
                 if (userIndex === -1) {
                   // Add user to matched_users
                   matchedUsers.push({
                     userId: userId,
                     faceId: faceId,
                     similarity: match.Similarity,
                     matchedAt: new Date().toISOString()
                   });
                   
                   // Update photo
                   const updateParams = {
                     TableName: 'shmong-photos',
                     Key: { id: photoId },
                     UpdateExpression: 'SET matched_users = :matchedUsers, updated_at = :updatedAt',
                     ExpressionAttributeValues: {
                       ':matchedUsers': matchedUsers,
                       ':updatedAt': new Date().toISOString()
                     }
                   };
                   
                   await dynamoDB.update(updateParams).promise();
                   matchCount++;
                 }
               }
             } catch (photoError) {
               console.error('Error processing photo:', photoError);
             }
           }
         }
       }
       
       return {
         statusCode: 200,
         headers: {
           "Access-Control-Allow-Origin": "*",
           "Access-Control-Allow-Headers": "Content-Type",
           "Access-Control-Allow-Methods": "OPTIONS,POST"
         },
         body: JSON.stringify({ 
           success: true,
           faceId: faceId,
           matchCount: matchCount
         })
       };
     } catch (error) {
       console.error('Error:', error);
       return {
         statusCode: 500,
         headers: {
           "Access-Control-Allow-Origin": "*",
           "Access-Control-Allow-Headers": "Content-Type",
           "Access-Control-Allow-Methods": "OPTIONS,POST"
         },
         body: JSON.stringify({ error: error.message })
       };
     }
   };
   ```

2. **Deploy Lambda Function**:

   ```bash
   # Create zip package
   cd lambda/shmong-face-register && zip -r function.zip . && cd ../..
   
   # Deploy Lambda function
   aws lambda create-function \
     --function-name shmong-face-register \
     --runtime nodejs14.x \
     --role arn:aws:iam::YOUR_ACCOUNT_ID:role/ShmongLambdaExecRole \
     --handler index.handler \
     --zip-file fileb://lambda/shmong-face-register/function.zip \
     --timeout 30 \
     --memory-size 256
   ```

3. **Create API Gateway**:

   ```bash
   # Create HTTP API
   aws apigatewayv2 create-api --name shmong-api --protocol-type HTTP
   
   # Get the API ID
   API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='shmong-api'].ApiId" --output text)
   
   # Create route for face registration
   aws apigatewayv2 create-route \
     --api-id $API_ID \
     --route-key "POST /api/register-face" \
     --target "integrations/$INTEGRATION_ID"
     
   # Create Lambda integration
   INTEGRATION_ID=$(aws apigatewayv2 create-integration \
     --api-id $API_ID \
     --integration-type AWS_PROXY \
     --integration-uri arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:shmong-face-register \
     --payload-format-version 2.0 \
     --query "IntegrationId" \
     --output text)
     
   # Update route with integration
   aws apigatewayv2 update-route \
     --api-id $API_ID \
     --route-id $ROUTE_ID \
     --target "integrations/$INTEGRATION_ID"
     
   # Deploy API
   aws apigatewayv2 create-deployment \
     --api-id $API_ID \
     --stage-name prod
   ```

### 4.4 Connect Frontend to AWS Backend

1. **Create AWS Client Configuration File**:

Create `src/lib/awsClient.js`:

```javascript
import { Rekognition } from '@aws-sdk/client-rekognition';
import { S3 } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Configuration
export const AWS_REGION = 'us-east-1';
export const PHOTO_BUCKET = 'shmong';
export const COLLECTION_ID = 'shmong-faces';
export const PHOTOS_TABLE = 'shmong-photos';
export const USERS_TABLE = 'shmong-users';
export const FACE_DATA_TABLE = 'shmong-face-data';
export const NOTIFICATIONS_TABLE = 'shmong-notifications';

// Initialize clients
export const rekognitionClient = new Rekognition({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

export const s3Client = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

export const dynamoClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

// Create a DocumentClient to simplify working with DynamoDB
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export default {
  rekognitionClient,
  s3Client,
  dynamoClient,
  docClient
};
```

2. **Create `.env` File**:

Create `.env` at project root:

```
REACT_APP_AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
REACT_APP_AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
REACT_APP_AWS_REGION=us-east-1
REACT_APP_API_ENDPOINT=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod
```

## 5. Troubleshooting & FAQ

### 5.1 Common Issues

#### Missing Matches Issue
**Problem**: Users are seeing different numbers of matched photos (e.g., Leon sees 13 photos but Fred sees 6)

**Solution**: 
1. Check if the prefix system is correctly implemented (`user_` for registration, `photo_` for uploads)
2. Verify `matched_users` arrays in the DynamoDB photos table 
3. Run a retroactive matching script to update all matched_users arrays

Example check script:
```javascript
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function compareMatchedUsers(photoId1, photoId2) {
  const params1 = {
    TableName: 'shmong-photos',
    Key: { id: photoId1 }
  };
  
  const params2 = {
    TableName: 'shmong-photos',
    Key: { id: photoId2 }
  };
  
  const [photo1, photo2] = await Promise.all([
    dynamodb.get(params1).promise(),
    dynamodb.get(params2).promise()
  ]);
  
  console.log('Photo 1 matched_users:', photo1.Item.matched_users);
  console.log('Photo 2 matched_users:', photo2.Item.matched_users);
  
  // Compare arrays
  const users1 = new Set(photo1.Item.matched_users.map(m => m.userId));
  const users2 = new Set(photo2.Item.matched_users.map(m => m.userId));
  
  console.log('Users in Photo 1 but not Photo 2:', 
    [...users1].filter(u => !users2.has(u)));
  console.log('Users in Photo 2 but not Photo 1:', 
    [...users2].filter(u => !users1.has(u)));
}

compareMatchedUsers('photoId1', 'photoId2');
```

#### Syntax Error in faceMatchingService.js
**Problem**: Build fails with syntax error in faceMatchingService.js

**Solution**: Fix duplicate code blocks and ensure service is only defined once.

#### Performance Issues
**Problem**: Slow dashboard loading or matching

**Solution**: 
1. Use pagination for photo retrieval
2. Implement lazy loading for images
3. Add caching for frequently accessed data
4. Optimize Lambda configuration (memory allocation)

### 5.2 AWS Rekognition Limitations

1. **Collection Size**: Limited to 20 million faces per collection
2. **Image Requirements**:
   - Max file size: 5MB (JPEG/PNG)
   - Min face size: 50x50 pixels
   - Max image resolution: 1920x1080
3. **API Limits**:
   - IndexFaces: 50 TPS (transactions per second) 
   - SearchFaces: 5 TPS
   - SearchFacesByImage: 5 TPS

### 5.3 Cost Optimization

1. **Reduce Rekognition API Calls**:
   - Batch process photos when possible
   - Implement a queue system for large uploads

2. **DynamoDB Optimization**:
   - Use sparse indexes
   - Enable on-demand capacity for unpredictable workloads
   - Use TTL for temporary data

3. **S3 Cost Reduction**:
   - Implement lifecycle policies for old/unused photos
   - Use compression for stored images

## 6. Next Steps & Future Enhancements

1. **Improved Error Handling**:
   - Add detailed error logging and reporting
   - Implement retry mechanisms for API failures

2. **Authentication Enhancement**:
   - Implement AWS Cognito for user management
   - Add multi-factor authentication

3. **Advanced Features**:
   - Add photo grouping by events
   - Implement user-controlled privacy settings
   - Add sharing capabilities for matched photos

4. **Performance Optimization**:
   - Implement Redis caching for frequent queries
   - Add serverless background jobs for matching
   - Optimize photo storage with compression

## 7. API Reference

### 7.1 Face Registration API

**Endpoint**: `POST /api/register-face`

**Request**:
```json
{
  "userId": "user-uuid-here",
  "imageData": "base64-encoded-image-data"
}
```

**Response**:
```json
{
  "success": true,
  "faceId": "rekognition-face-id",
  "matchCount": 5
}
```

### 7.2 Photo Upload API

**Endpoint**: `POST /api/upload-photo`

**Request**:
```json
{
  "userId": "user-uuid-here",
  "imageData": "base64-encoded-image-data",
  "metadata": {
    "title": "Beach Day",
    "location": {
      "lat": 34.052235,
      "lng": -118.243683
    },
    "event_details": {
      "name": "Summer Party",
      "date": "2023-07-15"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "photoId": "generated-photo-uuid",
  "url": "s3-photo-url",
  "faceCount": 3,
  "matchedUsers": [
    {
      "userId": "matched-user-uuid",
      "similarity": 99.8
    }
  ]
}
```

## 8. Conclusion

The Shmong Face Matching System provides a robust and scalable architecture for facial recognition and matching. By following the setup instructions and understanding the core matching principles outlined in this document, developers can deploy this system on a new AWS account and extend its functionality as needed.

*The system now displays photo counts on the Dashboard and relevant manager views.*

Remember that the key to successful face matching is the prefix system (`user_` and `photo_`) and proper handling of the `matched_users` arrays in the DynamoDB photos table.

For detailed code implementation, refer to:
1. `src/services/faceMatchingService.js` - Core face matching logic
2. `src/services/awsPhotoService.js` - Photo upload and processing
3. `src/services/FaceStorageService.js` - Face data storage and retrieval 

## 9. Project Structure and Dependencies

### 9.1 Key Directory Structure

The application is organized with the following directory structure:

```
src/
├── components/           # UI components including the Dashboard
│   ├── Dashboard.jsx     # Main dashboard component for user interface
│   ├── AppleDashboard.tsx # Apple-styled dashboard alternative
│   ├── MyPhotos.jsx      # User's photo gallery component
│   ├── Navigation.jsx    # Navigation component
│   └── ui/               # Reusable UI components
├── services/             # Core business logic services
│   ├── FaceIndexingService.js  # AWS Rekognition integration for face indexing
│   ├── faceMatchingService.js  # Face matching logic
│   ├── awsPhotoService.js      # Photo upload and processing
│   ├── FaceStorageService.js   # Face data storage and retrieval
│   └── BackgroundJobService.js # Background processing tasks
├── lib/                  # Shared utilities and configurations
│   ├── awsClient.js      # AWS SDK client configuration
│   └── setupDatabase.js  # Database initialization
├── utils/                # Helper utilities
├── pages/                # Route-based page components
└── auth/                 # Authentication-related code
```

### 9.2 Key Component Dependencies

The Dashboard component, located in `src/components/Dashboard.jsx`, is the central user interface for the application. It has the following key dependencies:

```
Dashboard.jsx
├── depends on services:
│   ├── FaceIndexingService.js
│   ├── awsPhotoService.js
│   └── FaceStorageService.js
├── renders components:
│   ├── MyPhotos.jsx
│   ├── Navigation.jsx
│   └── various UI components from ui/
```

The system also offers an alternative Apple-styled dashboard in `src/components/AppleDashboard.tsx`, which provides a different visual design while maintaining the same core functionality.

### 9.3 Service Dependencies

Core services and their dependencies:

```
FaceIndexingService.js
├── AWS Rekognition
├── AWS DynamoDB
└── FaceStorageService.js

awsPhotoService.js
├── AWS S3
├── AWS DynamoDB
└── FaceIndexingService.js

faceMatchingService.js
├── FaceIndexingService.js
└── FaceStorageService.js
```

### 9.4 Dashboard-Specific Information

The user interface is primarily driven by the Dashboard component located in `src/components/Dashboard.jsx`. This component:

1. Displays a summary of user statistics (photos uploaded, matches found)
2. Provides access to the user's photo gallery
3. Offers face registration functionality
4. Shows notifications of new matches

The Dashboard relies heavily on the face matching infrastructure described earlier in this document. All UI interactions with the facial recognition system are coordinated through this component. 