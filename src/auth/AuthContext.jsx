import { createContext, useContext, useState, useEffect } from 'react';
import cognito from './cognito';

// Create Auth Context
const AuthContext = createContext(null);

console.log('[AUTH_CONTEXT] Creating AuthContext');

// Auth Provider Component
export function AuthProvider({ children }) {
  console.log('[AUTH_CONTEXT] Initializing AuthProvider');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('[AUTH_CONTEXT] Running initialization effect');
    const initialize = async () => {
      console.log('[AUTH_CONTEXT] Starting initialization');
      try {
        // Debug environment variables
        console.log('[AUTH_CONTEXT] Checking environment variables');
        const envVars = cognito.debugEnvVars();
        console.log('[AUTH_CONTEXT] Environment variables:', envVars);
        
        console.log('[AUTH_CONTEXT] Getting current user');
        const currentUser = cognito.getCurrentUser();

        if (currentUser) {
          console.log('[AUTH_CONTEXT] Current user found');
          // Get current session
          console.log('[AUTH_CONTEXT] Getting session for current user');
          currentUser.getSession((err, session) => {
            if (err) {
              console.error('[AUTH_CONTEXT] Session error:', err);
              console.error('[AUTH_CONTEXT] Error code:', err.code);
              console.error('[AUTH_CONTEXT] Error message:', err.message);
              setUser(null);
              setLoading(false);
              return;
            }

            console.log('[AUTH_CONTEXT] Session retrieved, is valid:', session.isValid());
            
            if (session.isValid()) {
              // Get user attributes
              console.log('[AUTH_CONTEXT] Getting user attributes');
              currentUser.getUserAttributes((err, attributes) => {
                if (err) {
                  console.error('[AUTH_CONTEXT] Get user attributes error:', err);
                  console.error('[AUTH_CONTEXT] Error code:', err.code);
                  console.error('[AUTH_CONTEXT] Error message:', err.message);
                  setUser(null);
                  setLoading(false);
                  return;
                }

                // Build user object from attributes
                console.log('[AUTH_CONTEXT] Building user object from attributes');
                const userObj = {
                  id: currentUser.getUsername(),
                };

                // Add attributes to user object
                console.log('[AUTH_CONTEXT] User attributes:');
                attributes.forEach(attr => {
                  const name = attr.getName();
                  const value = attr.getValue();
                  console.log(`[AUTH_CONTEXT] - ${name}: ${value}`);
                  userObj[name] = value;
                });

                console.log('[AUTH_CONTEXT] Setting user state with:', JSON.stringify(userObj));
                setUser(userObj);
                setLoading(false);
              });
            } else {
              // Session not valid
              console.log('[AUTH_CONTEXT] Session not valid, clearing user');
              setUser(null);
              setLoading(false);
            }
          });
        } else {
          // No current user
          console.log('[AUTH_CONTEXT] No current user found');
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AUTH_CONTEXT] Initialization error:', err);
        console.error('[AUTH_CONTEXT] Error stack:', err.stack);
        setError(err.message);
        setUser(null);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Sign up
  const signUp = async (email, password, attributes = {}) => {
    console.log('[AUTH_CONTEXT] Sign up requested');
    console.log('[AUTH_CONTEXT] Email:', email);
    console.log('[AUTH_CONTEXT] Attributes:', JSON.stringify(attributes));
    
    setLoading(true);
    setError(null);

    try {
      console.log('[AUTH_CONTEXT] Calling cognito.signUp');
      const result = await cognito.signUp(email, password, attributes);
      console.log('[AUTH_CONTEXT] Sign up successful:', JSON.stringify(result));
      setLoading(false);
      return { data: result, error: null };
    } catch (err) {
      console.error('[AUTH_CONTEXT] Sign up error:', err);
      console.error('[AUTH_CONTEXT] Error code:', err.code);
      console.error('[AUTH_CONTEXT] Error message:', err.message);
      console.error('[AUTH_CONTEXT] Error stack:', err.stack);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Confirm sign up
  const confirmSignUp = async (email, code) => {
    console.log('[AUTH_CONTEXT] Confirm sign up requested');
    console.log('[AUTH_CONTEXT] Email:', email);
    console.log('[AUTH_CONTEXT] Code provided:', !!code);
    
    setLoading(true);
    setError(null);

    try {
      console.log('[AUTH_CONTEXT] Calling cognito.confirmSignUp');
      const result = await cognito.confirmSignUp(email, code);
      console.log('[AUTH_CONTEXT] Confirm sign up successful:', result);
      setLoading(false);
      return { data: result, error: null };
    } catch (err) {
      console.error('[AUTH_CONTEXT] Confirm sign up error:', err);
      console.error('[AUTH_CONTEXT] Error code:', err.code);
      console.error('[AUTH_CONTEXT] Error message:', err.message);
      console.error('[AUTH_CONTEXT] Error stack:', err.stack);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Sign in
  const signIn = async (email, password) => {
    console.log('[AUTH_CONTEXT] Sign in requested');
    console.log('[AUTH_CONTEXT] Email:', email);
    
    setLoading(true);
    setError(null);

    try {
      console.log('[AUTH_CONTEXT] Calling cognito.signIn');
      const result = await cognito.signIn(email, password);
      console.log('[AUTH_CONTEXT] Sign in successful, user:', JSON.stringify(result.user));
      
      console.log('[AUTH_CONTEXT] Setting user state');
      setUser(result.user);
      setLoading(false);
      return { data: result, error: null };
    } catch (err) {
      console.error('[AUTH_CONTEXT] Sign in error:', err);
      console.error('[AUTH_CONTEXT] Error code:', err.code);
      console.error('[AUTH_CONTEXT] Error message:', err.message);
      console.error('[AUTH_CONTEXT] Error stack:', err.stack);
      setError(err.message);
      setUser(null);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Sign out
  const signOut = () => {
    console.log('[AUTH_CONTEXT] Sign out requested');
    cognito.signOut();
    console.log('[AUTH_CONTEXT] Clearing user state');
    setUser(null);
  };

  // Forgot password
  const forgotPassword = async (email) => {
    console.log('[AUTH_CONTEXT] Forgot password requested');
    console.log('[AUTH_CONTEXT] Email:', email);
    
    setLoading(true);
    setError(null);

    try {
      console.log('[AUTH_CONTEXT] Calling cognito.forgotPassword');
      const result = await cognito.forgotPassword(email);
      console.log('[AUTH_CONTEXT] Forgot password request successful');
      setLoading(false);
      return { data: result, error: null };
    } catch (err) {
      console.error('[AUTH_CONTEXT] Forgot password error:', err);
      console.error('[AUTH_CONTEXT] Error code:', err.code);
      console.error('[AUTH_CONTEXT] Error message:', err.message);
      console.error('[AUTH_CONTEXT] Error stack:', err.stack);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Confirm password
  const confirmPassword = async (email, code, newPassword) => {
    console.log('[AUTH_CONTEXT] Confirm password requested');
    console.log('[AUTH_CONTEXT] Email:', email);
    console.log('[AUTH_CONTEXT] Code provided:', !!code);
    
    setLoading(true);
    setError(null);

    try {
      console.log('[AUTH_CONTEXT] Calling cognito.confirmPassword');
      const result = await cognito.confirmPassword(email, code, newPassword);
      console.log('[AUTH_CONTEXT] Confirm password successful');
      setLoading(false);
      return { data: result, error: null };
    } catch (err) {
      console.error('[AUTH_CONTEXT] Confirm password error:', err);
      console.error('[AUTH_CONTEXT] Error code:', err.code);
      console.error('[AUTH_CONTEXT] Error message:', err.message);
      console.error('[AUTH_CONTEXT] Error stack:', err.stack);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    console.log('[AUTH_CONTEXT] Change password requested');
    
    setLoading(true);
    setError(null);

    try {
      console.log('[AUTH_CONTEXT] Calling cognito.changePassword');
      const result = await cognito.changePassword(oldPassword, newPassword);
      console.log('[AUTH_CONTEXT] Change password successful');
      setLoading(false);
      return { data: result, error: null };
    } catch (err) {
      console.error('[AUTH_CONTEXT] Change password error:', err);
      console.error('[AUTH_CONTEXT] Error code:', err.code);
      console.error('[AUTH_CONTEXT] Error message:', err.message);
      console.error('[AUTH_CONTEXT] Error stack:', err.stack);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Auth value
  const value = {
    user,
    loading,
    error,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    forgotPassword,
    confirmPassword,
    changePassword,
  };

  console.log('[AUTH_CONTEXT] Current auth state:');
  console.log('[AUTH_CONTEXT] - User:', user ? user.id : 'null');
  console.log('[AUTH_CONTEXT] - Loading:', loading);
  console.log('[AUTH_CONTEXT] - Error:', error);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use Auth Context
export function useAuth() {
  console.log('[AUTH_CONTEXT] useAuth hook called');
  const context = useContext(AuthContext);
  if (!context) {
    console.error('[AUTH_CONTEXT] useAuth was called outside of AuthProvider!');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 