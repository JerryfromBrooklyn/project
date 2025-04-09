# Face Matching System Test Suite

This repository contains a comprehensive test suite for the Shmong Face Matching System, designed to verify the functionality of all components and ensure they work together correctly.

## Test Components

The test suite covers the following functionality:

1. **User Registration**: Testing user creation and authentication
2. **Face Registration**: Registering faces with AWS Rekognition
3. **Historical Face Matching**: Verifying that new users are matched against existing faces
4. **Photo Upload**: Testing the upload of new photos
5. **Future Face Matching**: Verifying that new photos are matched against existing users
6. **Error Handling**: Testing edge cases and error scenarios

## Setup and Requirements

Before running the tests, make sure you have:

1. Installed all dependencies:
   ```
   npm install axios uuid @aws-sdk/client-rekognition @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
   ```

2. Started the development server:
   ```
   npm run dev
   ```

3. Configured your AWS credentials properly:
   - Make sure your AWS credentials are set up either via environment variables or AWS CLI configuration
   - The tests expect access to AWS Rekognition, S3, and DynamoDB services

## Running the Tests

To run the comprehensive test suite:

```bash
node test-face-matching-system.js
```

The test will:
- Create a test user
- Register a face for the user
- Check for historical matches
- Upload a test photo
- Check for future matches
- Test error handling scenarios

## Test Logs

Detailed logs of the test execution are stored in the `face-matching-test.log` file, which will show:
- API calls and responses
- AWS service interactions
- Error details
- Test progress and results

## Troubleshooting

If the tests fail, check:

1. **API Endpoint**: Make sure the API_ENDPOINT in the test script matches your actual server address
2. **AWS Credentials**: Ensure your AWS credentials have proper permissions
3. **Collection ID**: Verify that the COLLECTION_ID matches the actual Rekognition collection name
4. **Table Name**: Make sure the FACE_DATA_TABLE matches your actual DynamoDB table name

## Manual Testing

For manual testing of individual components:

1. **Face Registration**:
   ```
   node test-face-registration.js
   ```

2. **Historical Matching**:
   ```
   node test-historical-matching.js
   ```

3. **Photo Upload & Future Matching**:
   ```
   node test-future-matching.js
   ``` 