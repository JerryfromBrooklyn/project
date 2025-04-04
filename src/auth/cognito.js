import { 
  CognitoUserPool, 
  CognitoUserAttribute, 
  CognitoUser, 
  AuthenticationDetails 
} from 'amazon-cognito-identity-js';

// Get environment variables in browser-compatible way
const getEnvVar = (name, defaultValue = '') => {
  // For browser context with Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || defaultValue;
  }
  // For Node.js context
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || defaultValue;
  }
  return defaultValue;
};

// Cognito configuration from environment variables
const poolData = {
  UserPoolId: getEnvVar('VITE_COGNITO_USER_POOL_ID', 'us-east-1_wXi7yGqKw'),
  ClientId: getEnvVar('VITE_COGNITO_CLIENT_ID', '6dj7z4am73up31kt5qgdg22c68')
};

console.log('[COGNITO] Initializing with pool data:', JSON.stringify({
  UserPoolId: poolData.UserPoolId,
  ClientId: poolData.ClientId
}));

// Create user pool instance
const userPool = new CognitoUserPool(poolData);

// Get current authenticated user (if any)
export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

// Sign up a new user
export const signUp = (email, password, attributes = {}) => {
  return new Promise((resolve, reject) => {
    // Prepare attributes
    const attributeList = [];
    
    // Add attributes if provided
    Object.keys(attributes).forEach(key => {
      const attribute = new CognitoUserAttribute({
        Name: key,
        Value: attributes[key]
      });
      attributeList.push(attribute);
    });
    
    // Always add email as an attribute
    if (!attributes.email) {
      const emailAttribute = new CognitoUserAttribute({
        Name: 'email',
        Value: email
      });
      attributeList.push(emailAttribute);
    }
    
    // Sign up the user
    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        console.error('Sign up error:', err);
        reject(err);
        return;
      }
      
      const cognitoUser = result.user;
      console.log('Sign up successful. Username:', cognitoUser.getUsername());
      
      resolve({
        user: cognitoUser,
        userConfirmed: result.userConfirmed,
        userSub: result.userSub
      });
    });
  });
};

// Confirm sign up (verification code)
export const confirmSignUp = (email, code) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error('Confirm sign up error:', err);
        reject(err);
        return;
      }
      
      console.log('Confirm sign up successful. Result:', result);
      resolve(result);
    });
  });
};

// Sign in a user
export const signIn = (email, password) => {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: email,
      Password: password
    };
    
    const authenticationDetails = new AuthenticationDetails(authenticationData);
    
    const userData = {
      Username: email,
      Pool: userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        console.log('Sign in successful. Session:', session);
        
        // Get user attributes
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            console.error('Get user attributes error:', err);
            // Still resolve with session but no attributes
            resolve({
              session,
              user: {
                email,
                id: cognitoUser.getUsername()
              }
            });
            return;
          }
          
          // Build user object from attributes
          const user = {
            email,
            id: cognitoUser.getUsername()
          };
          
          // Add attributes to user object
          attributes.forEach(attr => {
            user[attr.getName()] = attr.getValue();
          });
          
          resolve({
            session,
            user
          });
        });
      },
      onFailure: (err) => {
        console.error('Sign in error:', err);
        reject(err);
      }
    });
  });
};

// Sign out a user
export const signOut = () => {
  const cognitoUser = userPool.getCurrentUser();
  
  if (cognitoUser) {
    cognitoUser.signOut();
    console.log('User signed out');
    return true;
  }
  
  return false;
};

// Forgot password
export const forgotPassword = (email) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.forgotPassword({
      onSuccess: (data) => {
        console.log('Forgot password successful. Data:', data);
        resolve(data);
      },
      onFailure: (err) => {
        console.error('Forgot password error:', err);
        reject(err);
      }
    });
  });
};

// Confirm new password after reset
export const confirmPassword = (email, verificationCode, newPassword) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.confirmPassword(verificationCode, newPassword, {
      onSuccess: () => {
        console.log('Password confirmed successfully');
        resolve(true);
      },
      onFailure: (err) => {
        console.error('Confirm password error:', err);
        reject(err);
      }
    });
  });
};

// Change password (when signed in)
export const changePassword = (oldPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (!cognitoUser) {
      reject(new Error('No user is currently signed in'));
      return;
    }
    
    cognitoUser.getSession((err) => {
      if (err) {
        reject(err);
        return;
      }
      
      cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
        if (err) {
          console.error('Change password error:', err);
          reject(err);
          return;
        }
        
        console.log('Password changed successfully');
        resolve(result);
      });
    });
  });
};

// Add a method to help debug environment variables
export const debugEnvVars = () => {
  console.log('[COGNITO:DEBUG] Environment variable check:');
  console.log('[COGNITO:DEBUG] UserPoolId:', poolData.UserPoolId);
  console.log('[COGNITO:DEBUG] ClientId:', poolData.ClientId);
  
  // Check import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    console.log('[COGNITO:DEBUG] import.meta.env.VITE_COGNITO_USER_POOL_ID:', import.meta.env.VITE_COGNITO_USER_POOL_ID);
    console.log('[COGNITO:DEBUG] import.meta.env.VITE_COGNITO_CLIENT_ID:', import.meta.env.VITE_COGNITO_CLIENT_ID);
  }
  
  // Check process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    console.log('[COGNITO:DEBUG] process.env.VITE_COGNITO_USER_POOL_ID:', process.env.VITE_COGNITO_USER_POOL_ID);
    console.log('[COGNITO:DEBUG] process.env.VITE_COGNITO_CLIENT_ID:', process.env.VITE_COGNITO_CLIENT_ID);
  }
  
  return {
    userPoolId: poolData.UserPoolId,
    clientId: poolData.ClientId
  };
};

export default {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  forgotPassword,
  confirmPassword,
  changePassword,
  getCurrentUser,
  debugEnvVars
}; 