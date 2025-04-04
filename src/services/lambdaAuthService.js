// src/services/lambdaAuthService.js

// API Gateway URL
const API_URL = 'https://1utzocuwp7.execute-api.us-east-1.amazonaws.com/default/signup';
console.log('[LAMBDA-AUTH] Initialized with API URL:', API_URL);

// Check if we're in a development environment
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
    
    // For development environments, we need to handle CORS issues
    if (isDevelopment) {
      try {
        // Try the direct request with a timeout
        console.log('[LAMBDA-AUTH] Development environment detected, trying direct request with timeout');
        
        // Create a promise that resolves with the fetch result
        const fetchPromise = fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify(requestBody)
        }).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }
          return response.json();
        });
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 5000);
        });
        
        // Race the fetch against the timeout
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('[LAMBDA-AUTH] Direct API call succeeded:', result);
        
        // Format and return the user object
        const userId = result.userId || email;
        const user = {
          id: userId,
          email,
          full_name: userData.full_name,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return { 
          data: { 
            user,
            userConfirmed: true
          }, 
          error: null 
        };
      } catch (error) {
        console.warn('[LAMBDA-AUTH] Direct API call failed:', error.message);
        console.log('[LAMBDA-AUTH] Using development bypass for CORS issue');
        
        // For development, simulate a successful response
        if (window.confirm('CORS error detected (expected in development). Create simulated user?')) {
          // Simulate successful processing
          // In production, this would come from the Lambda function
          const simulatedUser = {
            id: `dev-${Date.now()}`,
            email,
            full_name: userData.full_name,
            role: userData.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('[LAMBDA-AUTH] Created simulated user for development:', simulatedUser);
          
          return { 
            data: { 
              user: simulatedUser,
              userConfirmed: true
            }, 
            error: null 
          };
        } else {
          // User declined simulation
          throw new Error('Development user creation cancelled');
        }
      }
    } else {
      // Production environment - make the normal API call
      console.log('[LAMBDA-AUTH] Production environment, making direct API call');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      
      return { 
        data: { 
          user,
          userConfirmed: true
        }, 
        error: null 
      };
    }
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