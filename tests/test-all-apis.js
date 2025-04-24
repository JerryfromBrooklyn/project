const fetch = require('node-fetch');

// API Gateway base URL
const API_BASE_URL = 'https://dwqg3yjx8i.execute-api.us-east-1.amazonaws.com/prod';

// Test user ID
const TEST_USER_ID = 'a4f85438-2021-70f4-8254-368539c97353';

// Test endpoints
const endpoints = [
  { 
    name: 'Face Registration', 
    method: 'POST',
    url: `${API_BASE_URL}/api/face/register`,
    body: {
      userId: TEST_USER_ID,
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEB'
    } 
  },
  { 
    name: 'User Face Data', 
    method: 'GET',
    url: `${API_BASE_URL}/api/user/face-data?userId=${TEST_USER_ID}` 
  },
  { 
    name: 'Historical Matches', 
    method: 'GET',
    url: `${API_BASE_URL}/api/matches/historical?userId=${TEST_USER_ID}` 
  },
  { 
    name: 'Recent Matches', 
    method: 'GET',
    url: `${API_BASE_URL}/api/matches/recent?userId=${TEST_USER_ID}` 
  },
  { 
    name: 'Login', 
    method: 'POST',
    url: `${API_BASE_URL}/api/login`,
    body: {
      email: 'sdfsdaf@aol.com',
      password: 'test-password'
    } 
  }
];

console.log('=== Testing All API Endpoints for CORS Headers ===\n');

// Test all endpoints
async function testAllEndpoints() {
  let allSuccess = true;
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name} Endpoint (${endpoint.method} ${endpoint.url})`);
    
    try {
      // First test OPTIONS for CORS
      console.log(`  Testing OPTIONS request...`);
      const optionsResponse = await fetch(endpoint.url, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': endpoint.method,
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });
      
      console.log(`  OPTIONS Status: ${optionsResponse.status}`);
      
      // Check CORS headers
      const corsHeadersPresent = 
        optionsResponse.headers.has('access-control-allow-origin') &&
        optionsResponse.headers.has('access-control-allow-methods') &&
        optionsResponse.headers.has('access-control-allow-headers');
        
      if (corsHeadersPresent) {
        console.log('  ✅ CORS headers are present');
      } else {
        console.log('  ❌ CORS headers are missing');
        console.log('  Headers received:');
        optionsResponse.headers.forEach((value, name) => {
          console.log(`    ${name}: ${value}`);
        });
        allSuccess = false;
      }
      
      // Now test actual request
      console.log(`  Testing ${endpoint.method} request...`);
      const requestOptions = {
        method: endpoint.method,
        headers: {
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json'
        }
      };
      
      // Add body for POST requests
      if (endpoint.method === 'POST' && endpoint.body) {
        requestOptions.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(endpoint.url, requestOptions);
      console.log(`  ${endpoint.method} Status: ${response.status}`);
      
      // Check response headers for CORS
      if (response.headers.has('access-control-allow-origin')) {
        console.log('  ✅ CORS headers are present in response');
      } else {
        console.log('  ❌ CORS headers are missing in response');
        allSuccess = false;
      }
      
      // Try to parse response body
      try {
        const data = await response.json();
        console.log('  Response body:', data);
      } catch (error) {
        console.log('  Could not parse response body as JSON');
      }
      
    } catch (error) {
      console.error(`  Error testing ${endpoint.name}:`, error.message);
      allSuccess = false;
    }
    
    console.log(''); // Blank line for readability
  }
  
  console.log('=== Test Summary ===');
  console.log(allSuccess ? 
    '✅ All endpoints have CORS headers configured properly' : 
    '❌ Some endpoints are missing CORS headers');
}

// Run the tests
testAllEndpoints().catch(error => {
  console.error('Error in test:', error);
}); 