// Simple test for the Lambda auth function

// CloudFront distribution URL with API path
const API_URL = 'https://d3hl8q20rgtlyy.cloudfront.net/api/';

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

// Make the API call using native fetch (Node.js 18+)
fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  return response.json().catch(e => {
    console.error('Failed to parse JSON response:', e);
    return { error: 'Invalid JSON response' };
  });
})
.then(data => {
  console.log('API Response:', data);
  
  if (data.success) {
    console.log('Test successful! User created with ID:', data.userId);
    console.log('This user can now be used to sign in through the application');
    console.log('Email:', testEmail);
    console.log('Password: Test1234!');
  } else {
    console.error('Test failed:', data.message || 'Unknown error');
  }
})
.catch(error => {
  console.error('Error calling Lambda API:', error);
}); 