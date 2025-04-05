// src/services/lambdaAuthService.js

// CloudFront distribution URL for secure HTTPS access with /api/ path
const API_URL = 'https://d3hl8q20rgtlyy.cloudfront.net/api/';
console.log('[LAMBDA-AUTH] Initialized with CloudFront API URL:', API_URL);

// Check if we're in a development environment (localhost) or production (S3 website)
const isDevelopment = window.location.hostname === 'localhost';

// Sign up with email and password
export const signUp = async (email, password, userData = {}) => {
  console.log('[LAMBDA-AUTH] Starting sign-up process for email:', email);
  console.log('[LAMBDA-AUTH] User data:', JSON.stringify(userData));
  
  try {
    console.log('[LAMBDA-AUTH] Preparing API request');
    const requestBody = {
      email,
      password,
      fullName: userData.full_name,
      role: userData.role
    };
    console.log('[LAMBDA-AUTH] Request body:', JSON.stringify(requestBody));
    
    // Make a direct API call to Lambda Function URL
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Log response headers for debugging
    console.log('[LAMBDA-AUTH] Response status:', response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('[LAMBDA-AUTH] Error response:', errorData);
      } catch (e) {
        console.error('[LAMBDA-AUTH] Error parsing response:', e);
        errorData = { message: `API error: ${response.status}` };
      }
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    // Parse successful response
    const data = await response.json();
    console.log('[LAMBDA-AUTH] Signup response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Signup failed');
    }
    
    // Create user object
    const user = {
      id: data.userId,
      email,
      full_name: userData.full_name,
      role: userData.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('[LAMBDA-AUTH] Created user object:', user);
    return { 
      data: { 
        user,
        userConfirmed: true
      }, 
      error: null 
    };
  } catch (error) {
    console.error('[LAMBDA-AUTH] Signup error:', error);
    console.error('[LAMBDA-AUTH] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return {
      data: { user: null, userConfirmed: false },
      error
    };
  }
};

export default {
  signUp
}; 