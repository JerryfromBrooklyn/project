// Simple test using native Node.js http module
const https = require('https');

// API Gateway URL
const API_URL = 'https://1utzocuwp7.execute-api.us-east-1.amazonaws.com/default/signup';

// Generate a unique test email
const testEmail = `test${Date.now()}@example.com`;

// Test user data
const testData = {
  email: testEmail,
  password: 'Test1234!',
  fullName: 'Test User',
  role: 'attendee'
};

console.log('=== LAMBDA AUTH TEST ===');
console.log('Testing with API URL:', API_URL);
console.log('Test data:', testData);

// Prepare the request data
const data = JSON.stringify(testData);
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

// Extract hostname and path from API_URL
const url = new URL(API_URL);
options.hostname = url.hostname;
options.path = url.pathname;

// Make the HTTP request
const req = https.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  let responseData = '';
  
  // Collect response data
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  // Process complete response
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(responseData);
      console.log('API Response:', parsedData);
      
      if (parsedData.success) {
        console.log('Test successful! User created with ID:', parsedData.userId);
        console.log('This user can now be used to sign in through the application');
        console.log('Email:', testEmail);
        console.log('Password: Test1234!');
      } else {
        console.error('Test failed:', parsedData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      console.log('Raw response:', responseData);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Error calling Lambda API:', error);
});

// Send the request data
req.write(data);
req.end(); 