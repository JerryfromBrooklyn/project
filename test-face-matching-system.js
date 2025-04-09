/**
 * Comprehensive Face Matching System Testing Script
 * 
 * This script performs end-to-end testing of the face matching system:
 * 1. User registration
 * 2. Face registration
 * 3. Historical face matching
 * 4. Photo upload
 * 5. Future face matching
 * 6. Error handling & edge cases
 */

// Required modules
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// AWS SDK requires - using conditional requires to handle potential missing dependencies
let AWS = null;
let rekognitionClient = null;
let dynamoDBClient = null;
let unmarshall = null;

try {
  AWS = require('@aws-sdk/client-rekognition');
  const DYNAMODB = require('@aws-sdk/client-dynamodb');
  const UTIL_DYNAMODB = require('@aws-sdk/util-dynamodb');
  
  rekognitionClient = new AWS.RekognitionClient({
    region: 'us-east-1',
  });
  
  dynamoDBClient = new DYNAMODB.DynamoDBClient({
    region: 'us-east-1',
  });
  
  unmarshall = UTIL_DYNAMODB.unmarshall;
  
} catch (error) {
  console.warn('AWS SDK modules not available:', error.message);
  console.warn('Some test functionality will be limited.');
}

// Configuration
const CONFIG = {
  // Network settings
  API_ENDPOINT: 'http://localhost:5177',
  AWS_REGION: 'us-east-1',
  
  // AWS resources
  COLLECTION_ID: 'shmong-faces',
  FACE_DATA_TABLE: 'shmong-face-data',
  
  // Test parameters
  SIMILARITY_THRESHOLD: 80,
  WAIT_TIME_MS: 5000,
  
  // Test assets
  TEST_IMAGES_DIR: path.join(__dirname, 'test-assets'),
  SAMPLE_FACE_URL: 'https://randomuser.me/api/portraits/men/1.jpg',
  SAMPLE_PHOTO_URL: 'https://randomuser.me/api/portraits/men/2.jpg',
  
  // Logging
  LOG_FILE: 'face-matching-test.log',
  LOG_LEVEL: 'debug', // 'debug', 'info', 'warn', 'error'
  
  // AWS SDK is available
  HAS_AWS_SDK: !!AWS && !!rekognitionClient && !!dynamoDBClient
};

// Add a try-catch block around the main script code
try {
  console.log('Starting face matching system test...');

  // Check for required modules
  console.log('Checking for required modules...');
  
  if (typeof fs === 'undefined') {
    console.error('fs module is not available');
  } else {
    console.log('fs module is available');
  }
  
  if (typeof path === 'undefined') {
    console.error('path module is not available');
  } else {
    console.log('path module is available');
  }
  
  if (typeof AWS === 'undefined') {
    console.error('AWS module is not available');
  } else {
    console.log('AWS module is available');
  }
  
  // Modify the setupLogging function to add console.log
  function setupLogging() {
    console.log('Setting up logging...');
    // Clear previous log if it exists
    if (fs.existsSync(CONFIG.LOG_FILE)) {
      fs.unlinkSync(CONFIG.LOG_FILE);
    }
    
    // Create log directory if needed
    const logDir = path.dirname(CONFIG.LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    try {
      logStream = fs.createWriteStream(CONFIG.LOG_FILE, { flags: 'a' });
      console.log('Log stream created successfully');
    } catch (error) {
      console.error('Error creating log stream:', error);
    }
    
    log('info', '=== Face Matching System Test ===');
    log('info', `Test started at: ${new Date().toISOString()}`);
    log('info', `Using API endpoint: ${CONFIG.API_ENDPOINT}`);
    log('info', `Using AWS region: ${CONFIG.AWS_REGION}`);
    log('info', `Using Rekognition collection: ${CONFIG.COLLECTION_ID}`);
    log('info', `Using DynamoDB table: ${CONFIG.FACE_DATA_TABLE}`);
  }

  // Add error handling in the log function
  function log(level, message, data = null) {
    try {
      if (LOG_LEVELS[level] < LOG_LEVELS[CONFIG.LOG_LEVEL]) {
        return;
      }
      
      const timestamp = new Date().toISOString();
      const logPrefix = `[${timestamp}] [${level.toUpperCase()}]`;
      const logMessage = `${logPrefix} ${message}`;
      
      // Log to console
      console.log(logMessage);
      if (data) {
        console.log(data);
      }
      
      // Log to file
      if (logStream) {
        logStream.write(`${logMessage}\n`);
        if (data) {
          logStream.write(`${JSON.stringify(data, null, 2)}\n`);
        }
      } else {
        console.warn('Log stream not initialized');
      }
    } catch (error) {
      console.error('Error in logging function:', error);
    }
  }

  // Main test function
  async function runTests() {
    let testUser = null;
    let authToken = null;
    let faceId = null;
    
    try {
      // Setup
      setupLogging();
      
      // Log AWS SDK status
      log('info', `AWS SDK available: ${CONFIG.HAS_AWS_SDK}`);
      if (!CONFIG.HAS_AWS_SDK) {
        log('warn', 'Some tests will be skipped because AWS SDK is not available');
        log('warn', 'Install required dependencies with: npm install @aws-sdk/client-rekognition @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb');
      }
      
      await prepareTestEnvironment();
      
      // User registration
      testUser = await createTestUser();
      
      // User login
      const loginResult = await loginTestUser(testUser);
      authToken = loginResult.authToken;
      
      // Face registration
      const faceRegResult = await registerFace(authToken, testUser.userId);
      faceId = faceRegResult.faceId;
      
      // Face data verification using REST API only (no AWS SDK required)
      const faceData = await verifyFaceData(authToken, testUser.userId);
      
      // Historical matches using REST API only
      const historicalMatches = await checkHistoricalMatches(authToken, testUser.userId);
      
      // Photo upload using REST API only
      const photoUploadResult = await uploadTestPhoto(authToken);
      
      // Future matches using REST API only
      const futureMatches = await checkFutureMatches(authToken, testUser.userId);
      
      // Error handling using REST API only
      await testErrorHandling(authToken);
      
      // Test summary
      log('info', '=== Test Summary ===');
      log('info', `User creation: ${testUser ? 'Success' : 'Failed'}`);
      log('info', `Face registration: ${faceId ? 'Success' : 'Failed'}`);
      log('info', `Face data verification: ${faceData ? 'Success' : 'Failed'}`);
      log('info', `Historical matches: ${historicalMatches.length || 0} found`);
      log('info', `Photo upload: ${photoUploadResult ? 'Success' : 'Failed'}`);
      log('info', `Future matches: ${futureMatches.length || 0} found`);
      
      log('info', '=== Test completed successfully ===');
      return true;
    } catch (error) {
      log('error', `Test failed during stage: ${error.stage || 'unknown'}`, error.details || error.message);
      console.error('Test error:', error);
      log('info', '=== Test failed ===');
      return false;
    } finally {
      if (logStream) {
        logStream.end();
      }
    }
  }

} catch (error) {
  console.error('Error during script initialization:', error);
} 