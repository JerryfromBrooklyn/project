// Auth0 Authentication Implementation
// This provides integration with Auth0 authentication service
// Requires Auth0 account and configuration

import { Auth0Client } from '@auth0/auth0-spa-js';

// Initialize Auth0 client
// Replace with your actual Auth0 configuration
const auth0 = new Auth0Client({
  domain: 'YOUR_AUTH0_DOMAIN.auth0.com',
  client_id: 'YOUR_AUTH0_CLIENT_ID',
  redirect_uri: window.location.origin,
  cacheLocation: 'localstorage'
});

// Current user state
let currentUser = null;

// Setup auth change listeners
const listeners = [];

// Subscribe to auth changes
export const onAuthStateChange = (callback) => {
  listeners.push(callback);
  
  // Immediately call with current state
  if (currentUser) {
    callback(currentUser);
  }
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners of auth state change
const notifyAuthChange = (user) => {
  currentUser = user;
  listeners.forEach(callback => callback(user));
};

// Check if user is authenticated on page load
export const checkSession = async () => {
  try {
    // Check if there's an existing session
    const isAuthenticated = await auth0.isAuthenticated();
    
    if (isAuthenticated) {
      // Get user information
      const user = await auth0.getUser();
      
      if (user) {
        // Transform Auth0 user to match your User interface
        const transformedUser = {
          id: user.sub,
          email: user.email,
          full_name: user.name,
          role: user.app_metadata?.role || 'user',
          created_at: user.created_at,
          updated_at: user.updated_at
        };
        
        notifyAuthChange(transformedUser);
        return transformedUser;
      }
    }
    
    notifyAuthChange(null);
    return null;
  } catch (error) {
    console.error('[AUTH0] Check session error:', error);
    notifyAuthChange(null);
    return null;
  }
};

// Sign up (or sign in) with redirect
export const signUp = async () => {
  await auth0.loginWithRedirect({
    authorizationParams: {
      screen_hint: 'signup'
    }
  });
  
  // This function redirects, so the code below won't execute immediately
  // Return a placeholder response for consistency with other auth providers
  return {
    data: {
      user: null,
      userConfirmed: false
    },
    error: null
  };
};

// Sign in with redirect
export const signInWithRedirect = async () => {
  await auth0.loginWithRedirect();
  
  // This function redirects, so the code below won't execute immediately
  return {
    data: {
      user: null,
      session: null
    },
    error: null
  };
};

// Handle redirect callback (call this on your callback page)
export const handleRedirectCallback = async () => {
  try {
    // Handle the redirect callback
    await auth0.handleRedirectCallback();
    
    // Get user information
    const user = await auth0.getUser();
    
    if (user) {
      // Transform Auth0 user to match your User interface
      const transformedUser = {
        id: user.sub,
        email: user.email,
        full_name: user.name,
        role: user.app_metadata?.role || 'user',
        created_at: user.created_at,
        updated_at: user.updated_at
      };
      
      // Get tokens
      const token = await auth0.getTokenSilently();
      
      const session = {
        accessToken: token,
        refreshToken: null, // Auth0 SPA SDK manages refresh internally
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // Approximate
      };
      
      notifyAuthChange(transformedUser);
      
      return {
        data: {
          user: transformedUser,
          session
        },
        error: null
      };
    }
    
    return {
      data: {
        user: null,
        session: null
      },
      error: new Error('Failed to get user information')
    };
  } catch (error) {
    console.error('[AUTH0] Redirect callback error:', error);
    return {
      data: {
        user: null,
        session: null
      },
      error
    };
  }
};

// Sign out
export const signOut = async () => {
  try {
    // Auth0 logout
    await auth0.logout({
      returnTo: window.location.origin
    });
    
    notifyAuthChange(null);
    return { error: null };
  } catch (error) {
    console.error('[AUTH0] Sign out error:', error);
    return { error };
  }
};

export default {
  signUp,
  signInWithRedirect,
  handleRedirectCallback,
  signOut,
  onAuthStateChange,
  checkSession
}; 