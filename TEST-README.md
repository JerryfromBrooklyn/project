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

## Recent Test Updates (April 2023)

### New Test Scripts

Two new test scripts have been added to verify the standardization and API enhancement improvements:

1. **Simple API Test**:
   ```
   node simple-api-test.js
   ```
   This script verifies that all API endpoints are correctly configured and responding as expected, with a focus on testing the API Gateway resources that were created to match front-end expectations.

2. **Face Matching System Test**:
   ```
   node test-face-matching-system.js
   ```
   This comprehensive test script tests the entire system workflow, from user registration to photo matching, with a focus on verifying the collection name and table name standardization.

### Test Results Summary

The latest tests revealed:

- **API Endpoint Status**:
  - All API endpoints are returning 403 "Missing Authentication Token" errors despite proper configuration
  - API Gateway integrations have been set up but endpoints are not accessible
  - Lambda functions for all endpoints have been created and deployed
  - Further investigation of API Gateway configuration is needed

- **Collection Names**:
  - Successfully verified 'shmong-faces' and 'user-faces' collections are correctly referenced and used
  - No more references to non-existent collections ('face-registration' and 'user-photos')

- **Table Names**:
  - Successfully confirmed consistent use of 'shmong-face-data' throughout all components
  - No more references to 'face_data' causing potential data mismatches

- **Dependencies**:
  - Package conflicts remain and need further resolution
  - Added missing dependencies improve system stability but more work needed

- **AWS Infrastructure**:
  - DynamoDB tables verified and active
  - Rekognition collections verified and active
  - Lambda functions created and deployed successfully
  - API Gateway resource paths defined correctly but integration issues persist

### Next Test Steps

To resolve the API Gateway issues, the following test approaches are recommended:

1. **Test API Directly in AWS Console**:
   - Use the API Gateway Test feature in the AWS Console to test each endpoint
   - Check if the Lambda functions are being triggered when called through the console
   
2. **Check API Gateway Logs**:
   - Enable CloudWatch logging for API Gateway
   - Analyze logs for error messages that might explain the "Missing Authentication Token" errors
   
3. **Try Different API Configuration**:
   - Create a new REST API with simpler path structure
   - Test with non-proxy integrations
   - Set up binary media types if dealing with image data

### Test Logs

The test results are logged in:
- `api-test-results.log` for the simple API tests
- `face-matching-test.log` for the comprehensive system tests

Review these logs for detailed information on test execution and results. 