const fetch = require('node-fetch');

// Test user ID from the existing user we found earlier
const TEST_USER_ID = 'a4f85438-2021-70f4-8254-368539c97353';

// Small base64 image for testing
const TEST_IMAGE_DATA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAQABADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/wD/2Q==';

// API Gateway URL for the face registration endpoint
const API_ENDPOINT = 'https://dwqg3yjx8i.execute-api.us-east-1.amazonaws.com/prod/api/face/register';

console.log('=== Testing Face Registration API Endpoint ===');
console.log(`API Endpoint: ${API_ENDPOINT}`);

// Create request body
const requestBody = {
  userId: TEST_USER_ID,
  imageData: TEST_IMAGE_DATA
};

console.log('Request body:', requestBody);

// First, test with OPTIONS request to check CORS
console.log('\nStep 1: Testing OPTIONS request (CORS preflight)...');
fetch(API_ENDPOINT, {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
})
.then(response => {
  console.log('OPTIONS Status:', response.status);
  console.log('OPTIONS Headers:');
  response.headers.forEach((value, name) => {
    console.log(`${name}: ${value}`);
  });
  
  const corsHeadersPresent = 
    response.headers.has('access-control-allow-origin') &&
    response.headers.has('access-control-allow-methods') &&
    response.headers.has('access-control-allow-headers');
    
  if (corsHeadersPresent) {
    console.log('✅ CORS headers are present');
  } else {
    console.log('❌ CORS headers are missing');
  }
  
  // Step 2: Send actual POST request
  console.log('\nStep 2: Testing POST request...');
  return fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000'
    },
    body: JSON.stringify(requestBody)
  });
})
.then(response => {
  console.log('POST Status:', response.status);
  console.log('POST Headers:');
  response.headers.forEach((value, name) => {
    console.log(`${name}: ${value}`);
  });
  
  return response.json()
    .then(data => {
      console.log('Response body:', data);
      
      if (response.status === 200) {
        console.log('✅ API request succeeded');
      } else {
        console.log('❌ API request failed');
      }
    });
})
.catch(error => {
  console.error('Error during test:', error);
  console.log('❌ Test failed due to error');
}); 