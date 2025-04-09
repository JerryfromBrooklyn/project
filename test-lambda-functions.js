const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Test user ID
const TEST_USER_ID = 'a4f85438-2021-70f4-8254-368539c97353';

// Small base64 image for testing
const TEST_IMAGE_DATA = 'data:image/jpeg;base64,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';

// Tests to run
const tests = [
  {
    name: 'Face Register Test',
    function: 'shmong-face-register',
    payload: {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: TEST_USER_ID,
        imageData: TEST_IMAGE_DATA
      })
    }
  },
  {
    name: 'User Face Data Test',
    function: 'shmong-user-face-data',
    payload: {
      httpMethod: 'GET',
      queryStringParameters: {
        userId: TEST_USER_ID
      }
    }
  },
  {
    name: 'Historical Matches Test',
    function: 'shmong-historical-matches',
    payload: {
      httpMethod: 'GET',
      queryStringParameters: {
        userId: TEST_USER_ID
      }
    }
  },
  {
    name: 'Recent Matches Test',
    function: 'shmong-recent-matches',
    payload: {
      httpMethod: 'GET',
      queryStringParameters: {
        userId: TEST_USER_ID
      }
    }
  },
  {
    name: 'Login Test',
    function: 'shmong-login',
    payload: {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'sdfsdaf@aol.com',
        password: 'testpassword'
      })
    }
  }
];

// Run all tests in sequence
async function runTests() {
  console.log('=== SHMONG Lambda Function Tests ===\n');
  
  // First verify the test user exists
  console.log(`Verifying user ${TEST_USER_ID} exists in DynamoDB...`);
  
  try {
    const userData = await dynamoDB.get({
      TableName: 'shmong-users',
      Key: { id: TEST_USER_ID }
    }).promise();
    
    if (userData.Item) {
      console.log('User found:', userData.Item);
    } else {
      console.error('Test user not found! Please create a test user before running this script.');
      return;
    }
  } catch (err) {
    console.error('Error accessing DynamoDB:', err);
    return;
  }
  
  // Run each test
  for (const test of tests) {
    console.log(`\n=== Running Test: ${test.name} ===`);
    console.log(`Lambda Function: ${test.function}`);
    console.log('Payload:', JSON.stringify(test.payload, null, 2));
    
    try {
      const response = await lambda.invoke({
        FunctionName: test.function,
        Payload: JSON.stringify(test.payload)
      }).promise();
      
      console.log('Response Status Code:', response.StatusCode);
      
      if (response.Payload) {
        const payload = JSON.parse(response.Payload);
        console.log('Response Payload:', JSON.stringify(payload, null, 2));
        
        if (payload.statusCode >= 200 && payload.statusCode < 300) {
          console.log(`✅ ${test.name} PASSED!`);
        } else {
          console.log(`❌ ${test.name} FAILED: Status ${payload.statusCode}`);
        }
      }
    } catch (err) {
      console.error(`Error invoking ${test.function}:`, err);
      console.log(`❌ ${test.name} FAILED due to error`);
    }
  }
  
  console.log('\n=== Tests Complete ===');
}

// Execute tests
runTests().catch(err => {
  console.error('Unexpected error:', err);
}); 