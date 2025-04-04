import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  GetUserCommand,
  ListUserPoolsCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_REGION } from '../lib/awsClient';
import { createUserRecord } from './database-utils';

// Define user interface to match the previous Supabase User object shape
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// Auth state
let currentUser: User | null = null;
let currentSession: any = null;
const listeners: ((user: User | null) => void)[] = [];

// Add auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  listeners.push(callback);
  
  // Return an unsubscribe function
  return {
    unsubscribe: () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  };
};

// Notify listeners of auth state changes
const notifyAuthChange = (user: User | null) => {
  currentUser = user;
  listeners.forEach(listener => listener(user));
};

// Get current session
export const getSession = async () => {
  try {
    if (!currentSession) {
      // No active session in memory, check local storage
      const sessionData = localStorage.getItem('aws_auth_session');
      if (sessionData) {
        const sessionObj = JSON.parse(sessionData);
        // Check if token is expired
        if (sessionObj.expiresAt && new Date(sessionObj.expiresAt) > new Date()) {
          currentSession = sessionObj;
          
          // Get user details with the token
          const user = await getCurrentUser();
          if (user) {
            notifyAuthChange(user);
          }
        }
      }
    }
    
    return { data: { session: currentSession }, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    return { data: { session: null }, error };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (!currentSession || !currentSession.accessToken) {
      return null;
    }
    
    const command = new GetUserCommand({
      AccessToken: currentSession.accessToken
    });
    
    const response = await cognitoClient.send(command);
    
    if (!response || !response.UserAttributes) {
      return null;
    }
    
    // Extract user attributes
    const attributes: Record<string, string> = {};
    response.UserAttributes.forEach(attr => {
      if (attr.Name && attr.Value) {
        attributes[attr.Name] = attr.Value;
      }
    });
    
    const user: User = {
      id: attributes.sub || '',
      email: attributes.email || '',
      full_name: attributes.name,
      role: attributes['custom:role'],
      created_at: attributes['custom:created_at'],
      updated_at: attributes['custom:updated_at']
    };
    
    currentUser = user;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Sign in with email and password
export const signInWithPassword = async (email: string, password: string) => {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const response = await cognitoClient.send(command);
    
    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed');
    }
    
    // Store session data
    const session = {
      accessToken: response.AuthenticationResult.AccessToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      idToken: response.AuthenticationResult.IdToken,
      expiresAt: new Date(Date.now() + (response.AuthenticationResult.ExpiresIn || 3600) * 1000).toISOString()
    };
    
    currentSession = session;
    localStorage.setItem('aws_auth_session', JSON.stringify(session));
    
    // Get user details
    const user = await getCurrentUser();
    notifyAuthChange(user);
    
    return { data: { user, session }, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: { user: null, session: null }, error };
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, userData: Record<string, string> = {}) => {
  console.log('[AUTH] Starting sign-up process for email:', email);
  console.log('[AUTH] User data provided:', JSON.stringify(userData, null, 2));
  
  try {
    // Check for empty credentials first, before even trying connectivity test
    const accessKeyAvailable = !!(process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID);
    const secretKeyAvailable = !!(process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY);
    
    if (!accessKeyAvailable || !secretKeyAvailable) {
      console.error('[AUTH] AWS credentials are missing - skipping connectivity test and proceeding to immediate failure');
      throw new Error('AWS credentials are missing. Please add valid AWS credentials to your environment variables.');
    }
    
    if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID) {
      console.error('[AUTH] Cognito configuration is missing - skipping connectivity test and proceeding to immediate failure');
      throw new Error('Cognito configuration is missing. Please add valid Cognito Client ID and User Pool ID to your environment variables.');
    }
    
    console.log('[AUTH] AWS Region:', AWS_REGION);
    console.log('[AUTH] Cognito User Pool ID:', COGNITO_USER_POOL_ID);
    console.log('[AUTH] Cognito Client ID:', COGNITO_CLIENT_ID);
    
    // First perform a simple browser connectivity test to cognito endpoint
    try {
      console.log('[AUTH] Performing browser connectivity test to Cognito endpoint...');
      const cognitoEndpoint = `https://cognito-idp.${AWS_REGION}.amazonaws.com/ping`;
      
      // Use fetch with a short timeout to test connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      console.log('[AUTH] Trying to reach:', cognitoEndpoint);
      
      try {
        const response = await fetch(cognitoEndpoint, { 
          method: 'GET',
          mode: 'no-cors', // This allows us to at least attempt the connection even if we can't read the response
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('[AUTH] Connectivity test succeeded - received response');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('[AUTH] Connectivity test failed:', fetchError);
        if (fetchError.name === 'AbortError') {
          console.error('[AUTH] Connection timed out after 5 seconds');
        }
        throw new Error(`Network connectivity test failed: ${fetchError.message}`);
      }
    } catch (networkTestError) {
      console.error('[AUTH] Browser network test error:', networkTestError);
      // Continue anyway, but log the error
    }
    
    // Skip AWS SDK connectivity test and proceed directly with signup
    console.log('[AUTH] Skipping AWS SDK connectivity test and proceeding directly with signup');
    
    console.log('[AUTH] Preparing user attributes');
    const userAttributes = [
      { Name: 'email', Value: email },
    ];
    
    // Add additional user data
    if (userData.full_name) {
      console.log('[AUTH] Adding full_name attribute:', userData.full_name);
      userAttributes.push({ Name: 'name', Value: userData.full_name });
    }
    
    if (userData.role) {
      console.log('[AUTH] Adding role attribute:', userData.role);
      userAttributes.push({ Name: 'custom:role', Value: userData.role });
    }
    
    // Create the signup command
    console.log('[AUTH] Preparing SignUpCommand with attributes:', JSON.stringify(userAttributes, null, 2));
    
    const command = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: userAttributes
    });
    
    console.log('[AUTH] Sending SignUpCommand to Cognito');
    
    // Add timing for debugging
    const startTime = new Date().getTime();
    
    try {
      // Direct AWS SDK call without Promise.race to see if it's timing out
      console.log('[AUTH] Executing SignUpCommand directly...');
      const response = await cognitoClient.send(command);
      
      const endTime = new Date().getTime();
      
      console.log(`[AUTH] SignUpCommand completed in ${endTime - startTime}ms`);
      console.log('[AUTH] SignUp response:', JSON.stringify(response, null, 2));
      
      if (!response.UserSub) {
        console.error('[AUTH] No UserSub returned from Cognito');
        throw new Error('User registration failed - No user ID returned');
      }
      
      console.log('[AUTH] User successfully registered with Cognito. UserSub:', response.UserSub);
      
      const user: User = {
        id: response.UserSub,
        email,
        full_name: userData.full_name,
        role: userData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[AUTH] Creating user record in DynamoDB (simplified)');
      
      // Skip DynamoDB for now to simplify debugging - just return success
      console.log('[AUTH] Skipping DynamoDB user record creation for debugging');
      
      return { 
        data: { 
          user,
          userConfirmed: response.UserConfirmed 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('[AUTH] Sign-up error during Cognito API call:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('[AUTH] Error name:', error.name);
        console.error('[AUTH] Error message:', error.message);
        console.error('[AUTH] Error stack:', error.stack);
      }
      
      // AWS specific error details
      if ((error as any).$metadata) {
        console.error('[AUTH] AWS error metadata:', JSON.stringify((error as any).$metadata, null, 2));
      }
      
      // Check for network or CORS-related issues
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('network') || 
            errorMsg.includes('cors') || 
            errorMsg.includes('not allowed by access-control-allow-origin') ||
            errorMsg.includes('blocked') ||
            errorMsg.includes('access-control')) {
          console.error('[AUTH] Possible CORS or network issue detected');
          return { 
            data: { user: null, userConfirmed: false },
            error: new Error('Network connection to authentication service blocked. This might be due to CORS policies, network settings, or security software.')
          };
        }
      }
      
      // Try to get more information about the AWS environment
      try {
        console.log('[AUTH] Checking AWS configuration...');
        console.log('[AUTH] AWS Region:', process.env.VITE_AWS_REGION || process.env.AWS_REGION || 'Not set');
        console.log('[AUTH] Cognito User Pool ID:', COGNITO_USER_POOL_ID || 'Not set');
        console.log('[AUTH] Cognito Client ID:', COGNITO_CLIENT_ID || 'Not set');
        
        // Check if credentials are available (don't log the actual values)
        const accessKeyAvailable = !!(process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID);
        const secretKeyAvailable = !!(process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY);
        
        console.log('[AUTH] AWS Access Key available:', accessKeyAvailable);
        console.log('[AUTH] AWS Secret Key available:', secretKeyAvailable);
      } catch (configError) {
        console.error('[AUTH] Error checking AWS configuration:', configError);
      }
      
      return { 
        data: { 
          user: null, 
          userConfirmed: false 
        }, 
        error 
      };
    }
  } catch (error) {
    console.error('[AUTH] Sign-up error:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('[AUTH] Error name:', error.name);
      console.error('[AUTH] Error message:', error.message);
      console.error('[AUTH] Error stack:', error.stack);
    }
    
    // AWS specific error details
    if ((error as any).$metadata) {
      console.error('[AUTH] AWS error metadata:', JSON.stringify((error as any).$metadata, null, 2));
    }
    
    // Check for network or CORS-related issues
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('network') || 
          errorMsg.includes('cors') || 
          errorMsg.includes('not allowed by access-control-allow-origin') ||
          errorMsg.includes('blocked') ||
          errorMsg.includes('access-control')) {
        console.error('[AUTH] Possible CORS or network issue detected');
        return { 
          data: { user: null, userConfirmed: false },
          error: new Error('Network connection to authentication service blocked. This might be due to CORS policies, network settings, or security software.')
        };
      }
    }
    
    // Try to get more information about the AWS environment
    try {
      console.log('[AUTH] Checking AWS configuration...');
      console.log('[AUTH] AWS Region:', process.env.VITE_AWS_REGION || process.env.AWS_REGION || 'Not set');
      console.log('[AUTH] Cognito User Pool ID:', COGNITO_USER_POOL_ID || 'Not set');
      console.log('[AUTH] Cognito Client ID:', COGNITO_CLIENT_ID || 'Not set');
      
      // Check if credentials are available (don't log the actual values)
      const accessKeyAvailable = !!(process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID);
      const secretKeyAvailable = !!(process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY);
      
      console.log('[AUTH] AWS Access Key available:', accessKeyAvailable);
      console.log('[AUTH] AWS Secret Key available:', secretKeyAvailable);
    } catch (configError) {
      console.error('[AUTH] Error checking AWS configuration:', configError);
    }
    
    return { 
      data: { 
        user: null, 
        userConfirmed: false 
      }, 
      error 
    };
  }
};

// Confirm sign up (verification code)
export const confirmSignUp = async (email: string, code: string) => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    });
    
    await cognitoClient.send(command);
    
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Confirm sign up error:', error);
    return { data: { success: false }, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    if (currentSession && currentSession.accessToken) {
      const command = new GlobalSignOutCommand({
        AccessToken: currentSession.accessToken
      });
      
      await cognitoClient.send(command);
    }
    
    // Clear local session data
    currentSession = null;
    localStorage.removeItem('aws_auth_session');
    
    // Notify listeners
    notifyAuthChange(null);
    
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

// Test AWS connectivity - can be used to check if AWS services are reachable
export const testAwsConnectivity = async () => {
  console.log('[AUTH] Testing AWS Cognito connectivity...');
  try {
    console.log('[AUTH] AWS Region:', AWS_REGION);
    console.log('[AUTH] Cognito User Pool ID:', COGNITO_USER_POOL_ID);
    console.log('[AUTH] Cognito Client ID:', COGNITO_CLIENT_ID);

    // Check for empty credentials
    const accessKeyAvailable = !!(process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID);
    const secretKeyAvailable = !!(process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY);
    console.log('[AUTH] AWS Access Key available:', accessKeyAvailable);
    console.log('[AUTH] AWS Secret Key available:', secretKeyAvailable);

    if (!accessKeyAvailable || !secretKeyAvailable) {
      console.error('[AUTH] AWS credentials are missing');
      return { 
        success: false, 
        error: 'AWS credentials are missing' 
      };
    }

    if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID) {
      console.error('[AUTH] Cognito configuration is missing');
      return { 
        success: false, 
        error: 'Cognito configuration is missing' 
      };
    }

    // Instead of using ListUserPoolsCommand which might require extra permissions,
    // we'll just try to use the SignUpCommand directly with invalid data to check connectivity
    // This will fail with a validation error, but that means we can reach AWS
    const command = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: 'test-connectivity-' + Date.now(),
      Password: 'Password1!',
      UserAttributes: []
    });
    
    const startTime = new Date().getTime();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection to AWS Cognito timed out after 10 seconds'));
      }, 10000);
    });
    
    // Race between the actual request and the timeout
    try {
      await Promise.race([
        cognitoClient.send(command),
        timeoutPromise
      ]);
      
      // This should never be reached because the SignUp will fail with validation errors
      console.error('[AUTH] Unexpected success in connectivity test');
    } catch (err) {
      // Check if this is a timeout error or AWS validation error
      if (err instanceof Error && err.message.includes('timed out')) {
        throw err; // Re-throw timeout errors
      }
      
      // If we get ANY response from AWS (even an error), it means connectivity is working
      console.log('[AUTH] Received response from AWS (expected validation error):', err);
      // Check if this is an AWS service error or a network error
      if ((err as any).$metadata && (err as any).$metadata.httpStatusCode) {
        // This is an AWS service error, which means we successfully connected to AWS
        console.log('[AUTH] Successfully connected to AWS (got HTTP status code)');
        const endTime = new Date().getTime();
        console.log(`[AUTH] AWS Cognito connectivity test completed successfully in ${endTime - startTime}ms`);
        return { success: true, latency: endTime - startTime };
      } else {
        // This is some other error, might be network related
        console.error('[AUTH] Network or other error during connectivity test:', err);
        throw err;
      }
    }
    
    // This code shouldn't be reached
    return { success: false, error: 'Unknown error in connectivity test' };
  } catch (error) {
    console.error('[AUTH] AWS Cognito connectivity test failed:', error);
    if (error instanceof Error) {
      console.error('[AUTH] Error name:', error.name);
      console.error('[AUTH] Error message:', error.message);
      console.error('[AUTH] Error stack:', error.stack);
    }
    
    // Check for specific error types
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Network Error')) {
      errorMessage = 'Network error connecting to AWS. Please check your internet connection.';
    } else if (errorMessage.includes('timed out')) {
      errorMessage = 'Connection to AWS timed out. The service might be unavailable.';
    } else if (errorMessage.includes('credentials')) {
      errorMessage = 'Invalid AWS credentials. Please check your access keys.';
    } else if (errorMessage.includes('SSL')) {
      errorMessage = 'SSL/TLS error connecting to AWS. Check your network security settings.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: error
    };
  }
};

// Add a fallback direct API implementation for debugging
export const signUpWithFetch = async (email: string, password: string, userData: Record<string, string> = {}) => {
  console.log('[AUTH] Starting sign-up with direct fetch API');
  
  try {
    const cognitoEndpoint = `https://cognito-idp.${AWS_REGION}.amazonaws.com/`;
    
    console.log('[AUTH] Using endpoint:', cognitoEndpoint);
    console.log('[AUTH] Using client ID:', COGNITO_CLIENT_ID);
    
    const userAttributes = [];
    if (userData.full_name) {
      userAttributes.push({ Name: 'name', Value: userData.full_name });
    }
    if (userData.role) {
      userAttributes.push({ Name: 'custom:role', Value: userData.role });
    }
    userAttributes.push({ Name: 'email', Value: email });
    
    const payload = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: userAttributes
    };
    
    console.log('[AUTH] Preparing fetch request...');
    
    // Create AWS sig4 headers (simplified for debugging)
    const headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp'
    };
    
    console.log('[AUTH] Sending direct fetch request to Cognito...');
    
    try {
      const response = await fetch(cognitoEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      console.log('[AUTH] Fetch response status:', response.status);
      const responseData = await response.json();
      console.log('[AUTH] Fetch response data:', JSON.stringify(responseData, null, 2));
      
      return {
        data: {
          user: {
            id: responseData.UserSub || 'unknown',
            email: email,
            full_name: userData.full_name,
            role: userData.role
          },
          userConfirmed: responseData.UserConfirmed || false
        },
        error: null
      };
    } catch (fetchError) {
      console.error('[AUTH] Fetch error:', fetchError);
      return {
        data: { user: null, userConfirmed: false },
        error: fetchError instanceof Error ? fetchError : new Error('Fetch error')
      };
    }
  } catch (error) {
    console.error('[AUTH] Error in signUpWithFetch:', error);
    return {
      data: { user: null, userConfirmed: false },
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
};

export default {
  getSession,
  getCurrentUser,
  signInWithPassword,
  signUp,
  signUpWithFetch,
  confirmSignUp,
  signOut,
  onAuthStateChange
}; 