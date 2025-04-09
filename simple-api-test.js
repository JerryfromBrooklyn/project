/**
 * Simplified API Test for Face Matching System
 * 
 * This script performs basic testing of the API endpoints
 * without relying on AWS SDK dependencies.
 */

const fs = require('fs');
const axios = require('axios');

// Configuration
const API_ENDPOINT = 'http://localhost:5177'; // Update if your server runs on a different port
const LOG_FILE = 'api-test-results.log';

// Initialize log file
fs.writeFileSync(LOG_FILE, `API Test Started at ${new Date().toISOString()}\n\n`);

/**
 * Log to console and file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Test API endpoint
 */
async function testEndpoint(method, endpoint, body = null, headers = {}) {
  try {
    log(`Testing ${method} ${endpoint}...`);
    
    const options = {
      method,
      url: `${API_ENDPOINT}${endpoint}`,
      headers,
      validateStatus: () => true, // Don't throw on error status codes
    };
    
    if (body) {
      options.data = body;
    }
    
    const response = await axios(options);
    
    log(`Status: ${response.status}`);
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    log(`Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  log('=== Starting API Tests ===');
  
  // Test 1: Check if login endpoint exists
  const loginTest = await testEndpoint('POST', '/api/login', {
    email: 'test@example.com',
    password: 'testpassword'
  });
  
  // Test 2: Check if register endpoint exists
  const registerTest = await testEndpoint('POST', '/api/register', {
    email: 'newuser@example.com',
    password: 'password123',
    fullName: 'Test User',
    role: 'attendee'
  });
  
  // Test 3: Check if face registration endpoint exists
  const faceRegTest = await testEndpoint('POST', '/api/face/register', {
    userId: 'test-user-id',
    imageData: 'test-image-data'
  });
  
  // Test 4: Check if face data endpoint exists
  const faceDataTest = await testEndpoint('GET', '/api/user/face-data?userId=test-user-id');
  
  // Test 5: Check if historical matches endpoint exists
  const historicalMatchesTest = await testEndpoint('GET', '/api/matches/historical?userId=test-user-id');
  
  // Test 6: Check if recent matches endpoint exists
  const recentMatchesTest = await testEndpoint('GET', '/api/matches/recent?userId=test-user-id');
  
  // Test 7: Check if photo upload endpoint exists
  const photoUploadTest = await testEndpoint('POST', '/api/photos/upload', {
    image: 'test-image-data',
    eventId: 'test-event'
  });
  
  // Summary
  log('\n=== Test Summary ===');
  log(`Login endpoint: ${loginTest.success ? 'Found' : 'Not found'} (${loginTest.status})`);
  log(`Register endpoint: ${registerTest.success ? 'Found' : 'Not found'} (${registerTest.status})`);
  log(`Face registration endpoint: ${faceRegTest.success ? 'Found' : 'Not found'} (${faceRegTest.status})`);
  log(`Face data endpoint: ${faceDataTest.success ? 'Found' : 'Not found'} (${faceDataTest.status})`);
  log(`Historical matches endpoint: ${historicalMatchesTest.success ? 'Found' : 'Not found'} (${historicalMatchesTest.status})`);
  log(`Recent matches endpoint: ${recentMatchesTest.success ? 'Found' : 'Not found'} (${recentMatchesTest.status})`);
  log(`Photo upload endpoint: ${photoUploadTest.success ? 'Found' : 'Not found'} (${photoUploadTest.status})`);
  
  // Overall result
  const totalTests = 7;
  const successfulTests = [
    loginTest.success,
    registerTest.success,
    faceRegTest.success,
    faceDataTest.success,
    historicalMatchesTest.success,
    recentMatchesTest.success,
    photoUploadTest.success
  ].filter(Boolean).length;
  
  log(`\nOverall Result: ${successfulTests}/${totalTests} endpoints available`);
  
  if (successfulTests === totalTests) {
    log('✅ All API endpoints are available!');
  } else {
    log('❌ Some API endpoints are missing or not responding correctly.');
  }
  
  log('\n=== Test Completed ===');
}

// Run the tests
runTests().catch(error => {
  log(`Error running tests: ${error.message}`);
}); 