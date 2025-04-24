const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Test user ID from the existing user we found earlier
const TEST_USER_ID = 'a4f85438-2021-70f4-8254-368539c97353';

// Small base64 image for testing
const TEST_IMAGE_DATA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAQABADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/wD/2Q==';

console.log('=== Testing Face Registration Lambda Function ===');

// Step 1: First verify the user exists in DynamoDB
console.log(`Step 1: Verifying user ${TEST_USER_ID} exists in DynamoDB...`);

dynamoDB.get({
  TableName: 'shmong-users',
  Key: { id: TEST_USER_ID }
}).promise()
  .then(userData => {
    if (!userData.Item) {
      console.error('Test failed: User not found in DynamoDB');
      process.exit(1);
    }
    console.log('User found in DynamoDB:', userData.Item);
    
    // Step 2: Create properly formatted Lambda test event
    const lambdaEvent = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,  // Using userId in the request parameter
        imageData: TEST_IMAGE_DATA
      })
    };
    
    console.log('Step 2: Invoking Lambda function with test event...');
    console.log('Request body:', JSON.parse(lambdaEvent.body));
    
    // Step 3: Invoke Lambda function directly
    return lambda.invoke({
      FunctionName: 'shmong-face-register',
      Payload: JSON.stringify(lambdaEvent)
    }).promise();
  })
  .then(lambdaResponse => {
    console.log('Step 3: Lambda response received');
    
    // Parse the Lambda response
    const response = JSON.parse(lambdaResponse.Payload);
    console.log('Lambda status code:', response.statusCode);
    console.log('Lambda response body:', JSON.parse(response.body));
    
    if (response.statusCode === 200) {
      console.log('✅ Test succeeded: Face registration Lambda function is working correctly');
    } else {
      console.log('❌ Test failed: Lambda function returned non-200 status code');
    }
  })
  .catch(error => {
    console.error('Error during test:', error);
    console.log('❌ Test failed due to error');
  }); 