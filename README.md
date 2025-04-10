# Auth Signup Lambda Function

This Lambda function handles user signup and automatic confirmation for AWS Cognito.

## Features

- Creates new Cognito users
- Automatically confirms users (no verification email required)
- Sets custom attributes (name, role)
- Handles errors and returns proper responses

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a deployment package:
```bash
zip -r function.zip index.mjs package.json node_modules
```

3. Upload to AWS Lambda:
- Go to AWS Lambda console
- Create or update your function
- Upload the `function.zip` file

4. Set environment variables in AWS Lambda:
- `USER_POOL_ID`: Your Cognito User Pool ID
- `CLIENT_ID`: Your Cognito App Client ID

5. Configure API Gateway:
- Create a REST API
- Create a POST method that triggers this Lambda
- Enable CORS
- Deploy the API

## Testing

You can test this function directly in the AWS Lambda Console:

1. Create a test event with the following JSON:
```json
{
  "body": "{\"email\":\"test@example.com\",\"password\":\"Test1234!\",\"fullName\":\"Test User\",\"role\":\"attendee\"}"
}
```

2. Run the test and check the output

## Troubleshooting

- Make sure the Lambda role has permissions to call Cognito services
- Check CloudWatch logs for detailed errors
- Verify your Cognito Pool ID and Client ID are correct

# Shmong Face Matching System

A facial recognition web application that allows festival attendees to register with their face and discover photos they appear in.

## Project Overview

The Shmong Face Matching System enables:
- User registration with facial recognition
- Historical matching of users against previously uploaded photos
- Automatic matching of newly uploaded photos to registered users
- Photo display and management for matched users

## Recent Improvements

### System Standardization and API Enhancement (April 2023)

1. **Collection Name Standardization**
   - Standardized AWS Rekognition collection references to 'shmong-faces' and 'user-faces'
   - Updated default collection in awsClient.js for consistency

2. **Table Name Standardization**
   - Fixed inconsistent DynamoDB table references
   - Ensured consistent use of 'shmong-face-data' instead of 'face_data'

3. **API Endpoint Implementation**
   - Created Lambda functions for critical endpoints (login, register)
   - Configured API Gateway integrations for these endpoints
   - Identified and documented issues preventing full API deployment
   - Set up proper Lambda-API Gateway permissions

4. **Dependency Conflict Resolution**
   - Updated package.json to fix incompatible Uppy package versions
   - Added missing dependencies required by the application

5. **Comprehensive Testing**
   - Created testing scripts (test-face-matching-system.js and simple-api-test.js)
   - Updated tests to use production API endpoints
   - Identified integration issues requiring further work

## Project Structure

- `src/` - Source code for the web application
- `api/` - API endpoints and Lambda functions
- `docs/` - Documentation files
- `scripts/` - Utility scripts for development and deployment
- `lambda/` - AWS Lambda function code

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Run tests:**
```bash
node test-face-matching-system.js
node simple-api-test.js
```

## Documentation

For detailed implementation documentation, see:
- [Matching System Implementation Documentation](./MatchingSystemImplementationDocumentation.md)
- [AWS Migration Guide](./AWS-MIGRATION.md)
- [Test Documentation](./TEST-README.md)

## Known Issues

See the [Matching System Implementation Documentation](./MatchingSystemImplementationDocumentation.md) for a complete list of known issues and troubleshooting information.

## Next Steps

- **Fix API Gateway Configuration Issues:** Resolve the "Missing Authentication Token" errors by investigating API Gateway settings, resource paths, and authorization configuration.
- **Complete End-to-End Testing:** Once API Gateway issues are resolved, perform comprehensive testing of all endpoints.
- **Implement Custom Domain:** Set up a custom domain for the API Gateway to improve usability and integration.
- **Resolve Dependency Conflicts:** Address remaining package conflicts in the frontend dependencies.
- **Add Monitoring:** Implement AWS CloudWatch monitoring for all Lambda functions and API endpoints.

# Photo Matching System

This system automatically finds all matching faces for users across the entire photo collection whenever they sign in. It uses AWS Rekognition's face matching capabilities in an extremely scalable and cost-efficient way.

## Key Features

- **On-Demand Face Matching**: Updates matches when a user signs in (if needed)
- **Highly Scalable**: Uses one Rekognition API call to find all matches
- **Asynchronous Processing**: User experience is never affected
- **Cost Efficient**: Only makes one API call per user per day maximum
- **Auto-Discovery**: Users see new photos that contain them automatically

## How It Works

1. **User Sign-In** 
   - When a user signs in, a Lambda function is triggered
   - It checks if the user has a registered face and if matches need updating

2. **Queue Processing**
   - If an update is needed, a message is added to an SQS queue
   - A background Lambda processes the queue at its own pace

3. **Face Matching**
   - For each user, a SINGLE Rekognition API call finds ALL matching faces
   - The results are filtered to only include actual photos (prefix: photo_)

4. **Database Updates**
   - The system updates two tables:
     - Adds the user to the `matched_users` array in each photo
     - Adds entries to the `user_photos` table for easy retrieval

## Architecture

```
┌──────────┐     ┌─────────────────┐     ┌───────────────┐
│  Sign-In │────▶│ Signin Checker  │────▶│  SQS Queue    │
└──────────┘     │     Lambda      │     └───────┬───────┘
                 └─────────────────┘             │
                                                 │
                                                 ▼
┌────────────┐    ┌─────────────────┐     ┌───────────────┐
│DynamoDB    │◀───│ Match Processor │◀────│  Lambda       │
│Tables      │    │                 │     │  Trigger      │
└────────────┘    └────────┬────────┘     └───────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Rekognition    │
                  │  Face Matching  │
                  └─────────────────┘
```

## Performance & Scaling

- Handles 10M+ photos with no performance degradation
- Single Rekognition API call regardless of collection size
- Throttled to run max once per day per user
- Asynchronous processing never impacts user experience

## Implementation

The system consists of:

1. **user-signin-service.js**: Lambda function that checks if updates are needed
2. **match-processor.js**: Lambda function that handles the face matching
3. **Infrastructure**: SQS queues, IAM roles, CloudWatch alarms

## Cost Efficiency

- Rekognition API: ~$0.001 per call
- Only one call per user per day (maximum)
- Background processing spreads load evenly
- Throttling prevents excessive costs

---

## Deployment

Deploy using the Terraform configuration in `terraform/photo-match-resources.tf`. 