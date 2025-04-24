const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

// API Gateway base URL
const API_BASE_URL = 'https://dwqg3yjx8i.execute-api.us-east-1.amazonaws.com/prod';

// Test user ID
const TEST_USER_ID = 'a4f85438-2021-70f4-8254-368539c97353';

// Small base64 image for testing
const TEST_IMAGE_DATA = 'data:image/jpeg;base64,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';

// Ansi color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Log function with sections
const log = {
  section: (title) => {
    console.log(`\n${colors.fg.cyan}${colors.bright}========== ${title} ==========${colors.reset}\n`);
  },
  info: (message) => {
    console.log(`${colors.fg.blue}[INFO]${colors.reset} ${message}`);
  },
  success: (message) => {
    console.log(`${colors.fg.green}[SUCCESS]${colors.reset} ${message}`);
  },
  warning: (message) => {
    console.log(`${colors.fg.yellow}[WARNING]${colors.reset} ${message}`);
  },
  error: (message) => {
    console.log(`${colors.fg.red}[ERROR]${colors.reset} ${message}`);
  },
  details: (obj) => {
    console.log(JSON.stringify(obj, null, 2));
  }
};

// Function to test an API endpoint
async function testEndpoint(name, method, url, body = null) {
  log.info(`Testing ${name} (${method} ${url})`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5177'
    }
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    
    const corsEnabled = headers['access-control-allow-origin'] === '*';
    
    log.info(`Status: ${response.status}`);
    log.info(`CORS Headers: ${corsEnabled ? 'Present' : 'Missing'}`);
    
    try {
      const data = await response.json();
      log.info('Response data:');
      log.details(data);
      
      return { 
        success: response.status >= 200 && response.status < 300, 
        status: response.status, 
        data,
        headers 
      };
    } catch (err) {
      log.error('Failed to parse response as JSON');
      return { success: false, status: response.status, headers };
    }
  } catch (err) {
    log.error(`Request failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Main test function
async function runTests() {
  log.section('SHMONG Face Recognition System Test');
  
  // Step 1: Test login endpoint
  log.section('Step 1: Testing Login Endpoint');
  const loginResult = await testEndpoint('Login', 'POST', `${API_BASE_URL}/api/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  
  // Step 2: Test face registration endpoint
  log.section('Step 2: Testing Face Registration Endpoint');
  const registrationResult = await testEndpoint('Face Registration', 'POST', `${API_BASE_URL}/api/face/register`, {
    userId: TEST_USER_ID,
    imageData: TEST_IMAGE_DATA
  });
  
  if (registrationResult.success) {
    log.success('Face registration successful');
    log.info(`Matched ${registrationResult.data.matchCount} photos`);
    
    if (registrationResult.data.faceDetails) {
      log.info('Face details:');
      log.details(registrationResult.data.faceDetails);
    }
  } else if (registrationResult.data && registrationResult.data.message === 'No face detected in the image') {
    log.warning('Face registration needs a better quality image');
  } else {
    log.error('Face registration failed');
  }
  
  // Step 3: Test user face data endpoint
  log.section('Step 3: Testing User Face Data Endpoint');
  const faceDataResult = await testEndpoint('User Face Data', 'GET', `${API_BASE_URL}/api/user/face-data?userId=${TEST_USER_ID}`);
  
  if (faceDataResult.success && faceDataResult.data.hasFaceRegistered) {
    log.success('User has a registered face');
    
    if (faceDataResult.data.faceData && faceDataResult.data.faceData.stats) {
      log.info(`Total matches: ${faceDataResult.data.faceData.stats.totalMatches}`);
      log.info(`Recent matches: ${faceDataResult.data.faceData.stats.recentMatches}`);
      
      if (faceDataResult.data.faceData.stats.lastMatchDate) {
        log.info(`Last match date: ${faceDataResult.data.faceData.stats.lastMatchDate}`);
      }
    }
  } else if (faceDataResult.success) {
    log.warning('User does not have a registered face');
  } else {
    log.error('Failed to retrieve user face data');
  }
  
  // Step 4: Test historical matches endpoint
  log.section('Step 4: Testing Historical Matches Endpoint');
  const historicalResult = await testEndpoint('Historical Matches', 'GET', `${API_BASE_URL}/api/matches/historical?userId=${TEST_USER_ID}`);
  
  if (historicalResult.success) {
    const matchCount = historicalResult.data.matchCount || 0;
    
    if (matchCount > 0) {
      log.success(`Found ${matchCount} historical matches`);
      log.info('First match preview:');
      log.details(historicalResult.data.matches[0]);
    } else {
      log.warning('No historical matches found');
    }
  } else {
    log.error('Failed to retrieve historical matches');
  }
  
  // Step 5: Test recent matches endpoint
  log.section('Step 5: Testing Recent Matches Endpoint');
  const recentResult = await testEndpoint('Recent Matches', 'GET', `${API_BASE_URL}/api/matches/recent?userId=${TEST_USER_ID}`);
  
  if (recentResult.success) {
    const matchCount = recentResult.data.matchCount || 0;
    
    if (matchCount > 0) {
      log.success(`Found ${matchCount} recent matches`);
      log.info('First match preview:');
      log.details(recentResult.data.matches[0]);
    } else {
      log.warning('No recent matches found');
    }
  } else {
    log.error('Failed to retrieve recent matches');
  }
  
  // Summary
  log.section('Test Summary');
  log.info('Login endpoint: ' + (loginResult.success ? 'WORKING' : 'FAILING'));
  log.info('Face registration endpoint: ' + (registrationResult.success ? 'WORKING' : 'FAILING'));
  log.info('User face data endpoint: ' + (faceDataResult.success ? 'WORKING' : 'FAILING'));
  log.info('Historical matches endpoint: ' + (historicalResult.success ? 'WORKING' : 'FAILING'));
  log.info('Recent matches endpoint: ' + (recentResult.success ? 'WORKING' : 'FAILING'));
  
  const allSuccess = 
    loginResult.success && 
    registrationResult.success && 
    faceDataResult.success && 
    historicalResult.success && 
    recentResult.success;
  
  if (allSuccess) {
    log.success('All endpoints are working correctly!');
  } else {
    log.warning('Some endpoints are not working correctly.');
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Test error: ${error.message}`);
}); 