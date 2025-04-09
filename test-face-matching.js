// Test script to verify face matching functionality
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Log setup
const LOG_FILE = 'face-matching-test.log';
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
};

// Clear previous log
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

log('=== Face Matching System Test ===');
log('Testing functionality of face registration, historical matching, and future matching');

// Configuration
const API_ENDPOINT = 'http://localhost:5176'; // Local development server
const TEST_USER_EMAIL = `test-user-${uuidv4().substring(0, 8)}@example.com`;
const TEST_USER_PASSWORD = 'Test123!';

// Step 1: Sign up a new test user
async function signupTestUser() {
  log('\n=== Step 1: Creating test user ===');
  
  try {
    const response = await axios.post(`${API_ENDPOINT}/api/register`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      fullName: 'Test User',
      role: 'attendee'
    });
    
    log(`User created successfully: ${TEST_USER_EMAIL}`);
    return response.data;
  } catch (error) {
    log(`Error creating test user: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Step 2: Login with test user
async function loginTestUser() {
  log('\n=== Step 2: Logging in test user ===');
  
  try {
    const response = await axios.post(`${API_ENDPOINT}/api/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    log('Login successful');
    return response.data;
  } catch (error) {
    log(`Error logging in: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Step 3: Register face for the test user
async function registerFace(authToken, userId) {
  log('\n=== Step 3: Registering face ===');
  
  try {
    // Use a test image for face registration
    const testImagePath = path.join(__dirname, 'test-assets', 'test-face.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      log(`Test image not found at ${testImagePath}`);
      log('Creating a test directory and downloading a sample image...');
      
      // Create test-assets directory if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, 'test-assets'))) {
        fs.mkdirSync(path.join(__dirname, 'test-assets'));
      }
      
      // Download a sample image
      const response = await axios.get('https://randomuser.me/api/portraits/men/1.jpg', {
        responseType: 'arraybuffer'
      });
      
      fs.writeFileSync(testImagePath, Buffer.from(response.data, 'binary'));
      log(`Downloaded sample image to ${testImagePath}`);
    }
    
    // Read image file as base64
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Register face
    const response = await axios.post(
      `${API_ENDPOINT}/api/face/register`, 
      {
        userId,
        imageData: `data:image/jpeg;base64,${base64Image}`
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('Face registered successfully');
    log(`Face ID: ${response.data.faceId || 'Not provided'}`);
    log(`Attributes count: ${response.data.faceAttributes ? Object.keys(response.data.faceAttributes).length : 0}`);
    log(`Historical matches: ${response.data.historicalMatches ? response.data.historicalMatches.length : 0}`);
    
    return response.data;
  } catch (error) {
    log(`Error registering face: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Step 4: Check if face data is properly stored
async function verifyFaceData(authToken, userId) {
  log('\n=== Step 4: Verifying face data storage ===');
  
  try {
    const response = await axios.get(
      `${API_ENDPOINT}/api/user/face-data`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          userId
        }
      }
    );
    
    const faceData = response.data;
    
    if (faceData && faceData.faceId) {
      log('Face data retrieved successfully');
      log(`Face ID: ${faceData.faceId}`);
      log(`Face attributes available: ${faceData.faceAttributes ? 'Yes' : 'No'}`);
      log(`Image URL available: ${faceData.imageUrl ? 'Yes' : 'No'}`);
      return faceData;
    } else {
      log('Face data not found or incomplete');
      return null;
    }
  } catch (error) {
    log(`Error verifying face data: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Step 5: Test historical matches
async function checkHistoricalMatches(authToken, userId) {
  log('\n=== Step 5: Checking historical matches ===');
  
  try {
    const response = await axios.get(
      `${API_ENDPOINT}/api/matches/historical`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          userId
        }
      }
    );
    
    const matches = response.data;
    
    log(`Found ${matches.length || 0} historical matches`);
    
    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        log(`Match ${index + 1}:`);
        log(`  Photo ID: ${match.photoId || 'N/A'}`);
        log(`  Similarity: ${match.similarity || 'N/A'}`);
        log(`  Image URL: ${match.imageUrl ? 'Available' : 'Not available'}`);
      });
    }
    
    return matches;
  } catch (error) {
    log(`Error checking historical matches: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

// Step 6: Upload a test photo to test future matching
async function uploadTestPhoto(authToken) {
  log('\n=== Step 6: Uploading test photo for future matching ===');
  
  try {
    // Use a test image for photo upload
    const testImagePath = path.join(__dirname, 'test-assets', 'test-photo.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      log(`Test photo not found at ${testImagePath}`);
      log('Creating a test directory and downloading a sample photo...');
      
      // Create test-assets directory if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, 'test-assets'))) {
        fs.mkdirSync(path.join(__dirname, 'test-assets'));
      }
      
      // Download a sample group photo
      const response = await axios.get('https://randomuser.me/api/portraits/men/2.jpg', {
        responseType: 'arraybuffer'
      });
      
      fs.writeFileSync(testImagePath, Buffer.from(response.data, 'binary'));
      log(`Downloaded sample photo to ${testImagePath}`);
    }
    
    // Read image file as base64
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Upload photo
    const response = await axios.post(
      `${API_ENDPOINT}/api/photos/upload`, 
      {
        image: `data:image/jpeg;base64,${base64Image}`,
        eventId: 'test-event',
        metadata: {
          location: 'Test Location',
          caption: 'Test Photo for Face Matching'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('Photo uploaded successfully');
    log(`Photo ID: ${response.data.photoId || 'Not provided'}`);
    log(`Face detection initiated: ${response.data.processingStarted ? 'Yes' : 'No'}`);
    
    return response.data;
  } catch (error) {
    log(`Error uploading test photo: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Step 7: Check for matches after photo upload (future matching)
async function checkFutureMatches(authToken, userId) {
  log('\n=== Step 7: Checking future matches ===');
  
  try {
    // Wait a few seconds for processing
    log('Waiting 5 seconds for photo processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const response = await axios.get(
      `${API_ENDPOINT}/api/matches/recent`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          userId,
          since: new Date(Date.now() - 3600000).toISOString() // Last hour
        }
      }
    );
    
    const matches = response.data;
    
    log(`Found ${matches.length || 0} recent matches`);
    
    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        log(`Match ${index + 1}:`);
        log(`  Photo ID: ${match.photoId || 'N/A'}`);
        log(`  Similarity: ${match.similarity || 'N/A'}`);
        log(`  Image URL: ${match.imageUrl ? 'Available' : 'Not available'}`);
      });
    }
    
    return matches;
  } catch (error) {
    log(`Error checking future matches: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

// Main test function
async function runTest() {
  try {
    // Step 1: Sign up test user
    const userData = await signupTestUser();
    const userId = userData.userId || userData.id;
    
    // Step 2: Login
    const authData = await loginTestUser();
    const authToken = authData.token;
    
    // Step 3: Register face
    const faceData = await registerFace(authToken, userId);
    
    // Step 4: Verify face data storage
    const verifiedFaceData = await verifyFaceData(authToken, userId);
    
    // Step 5: Check historical matches
    const historicalMatches = await checkHistoricalMatches(authToken, userId);
    
    // Step 6: Upload test photo
    const photoData = await uploadTestPhoto(authToken);
    
    // Step 7: Check future matches
    const futureMatches = await checkFutureMatches(authToken, userId);
    
    // Final report
    log('\n=== Test Summary ===');
    log(`User creation: ${userData ? 'Success' : 'Failed'}`);
    log(`Face registration: ${faceData ? 'Success' : 'Failed'}`);
    log(`Face data verification: ${verifiedFaceData ? 'Success' : 'Failed'}`);
    log(`Historical matches: ${historicalMatches.length || 0} found`);
    log(`Photo upload: ${photoData ? 'Success' : 'Failed'}`);
    log(`Future matches: ${futureMatches.length || 0} found`);
    
    log('\n=== Test completed ===');
  } catch (error) {
    log(`\n!!! Test failed: ${error.message} !!!`);
  }
}

// Run the test
log('Starting test...');
runTest(); 