// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../services/awsAuthService';
import awsAuth from '../services/awsAuthService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for active session on mount
    const checkUser = async () => {
      try {
        console.log('[AUTH_CONTEXT] Checking for existing session...');
        
        // Get the current session and user
        const { data } = await awsAuth.getSession();
        const currentUser = await awsAuth.getCurrentUser();
        
        console.log('[AUTH_CONTEXT] Session check complete', { 
          hasSession: !!data.session, 
          hasUser: !!currentUser 
        });
        
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          console.log('[AUTH_CONTEXT] User already logged in, redirecting to dashboard');
          navigate('/dashboard');
        }

        // Set up listener for auth changes
        const subscription = awsAuth.onAuthStateChange((currentUser) => {
          console.log('[AUTH_CONTEXT] Auth state changed', { hasUser: !!currentUser });
          setUser(currentUser);
          
          if (currentUser) {
            navigate('/dashboard');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AUTH_CONTEXT] Error checking auth state:', error);
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AUTH_CONTEXT] Attempting to sign in with email:', email);
      const result = await awsAuth.signInWithPassword(email, password);
      
      if (result.error) {
        console.error('[AUTH_CONTEXT] Sign-in error:', result.error);
      } else {
        console.log('[AUTH_CONTEXT] Sign-in successful');
      }
      
      return result;
    } catch (error) {
      console.error('[AUTH_CONTEXT] Unexpected error during sign-in:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('An unexpected error occurred during sign-in')
      };
    }
  };

  const signInWithGoogle = async () => {
    navigate('/login', { state: { message: 'Social logins are not available in the current environment.' }});
  };

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    try {
      console.log('[AUTH_CONTEXT] 🚀 Starting AWS signup process...');
      console.log('[AUTH_CONTEXT] Email:', email);
      console.log('[AUTH_CONTEXT] Full Name:', fullName);
      console.log('[AUTH_CONTEXT] User Type:', userType);
      console.log('[AUTH_CONTEXT] AWS Connectivity Status:', navigator.onLine ? 'Online' : 'Offline');
      
      // Log basic browser network status before attempting signup
      console.log('[AUTH_CONTEXT] Browser network status:', {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      const { data, error } = await awsAuth.signUp(email, password, {
        full_name: fullName,
        role: userType
      });

      // Handle signup errors
      if (error) {
        console.error('[AUTH_CONTEXT] ❌ AWS signup failed:', error);
        console.error('[AUTH_CONTEXT] Error type:', error?.constructor?.name);
        
        // Try to identify the specific error category
        let errorCategory = 'Unknown';
        
        if (error instanceof Error) {
          if (error.message.includes('timed out')) {
            errorCategory = 'Timeout';
          } else if (error.message.includes('network')) {
            errorCategory = 'Network';
          } else if (error.message.includes('credentials')) {
            errorCategory = 'Authentication';
          } else if (error.message.includes('already exists')) {
            errorCategory = 'Duplicate';
          }
        }
        
        console.error(`[AUTH_CONTEXT] Error category: ${errorCategory}`);
        return { data: null, error };
      }

      console.log('[AUTH_CONTEXT] SignUp API response:', 
        JSON.stringify({
          success: !error,
          userData: data?.user ? {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.full_name,
            role: data.user.role,
          } : null,
          userConfirmed: data?.userConfirmed,
        }, null, 2)
      );

      if (!data.user) {
        console.error('[AUTH_CONTEXT] ❌ No user data returned from AWS signup');
        return { data: null, error: new Error('No user data returned') };
      }

      console.log('[AUTH_CONTEXT] ✅ User created successfully:', data.user.id);

      // FOR TESTING: Skip email verification and always go to dashboard
      console.log('[AUTH_CONTEXT] TESTING MODE: Bypassing email verification and going directly to dashboard');
      console.log('[AUTH_CONTEXT] Current location before navigation:', window.location.href);
      console.log('[AUTH_CONTEXT] Navigate object available:', !!navigate);
      
      // Try direct navigation first since React Router seems to fail
      console.log('[AUTH_CONTEXT] Trying direct window.location navigation');
      window.location.href = '/dashboard';
      
      // Only try React Router navigation as fallback
      try {
        navigate('/dashboard');
        console.log('[AUTH_CONTEXT] Navigation called to /dashboard');
      } catch (navError) {
        console.error('[AUTH_CONTEXT] Navigation error:', navError);
      }
      
      // No need for timeout check if we're using direct navigation
      return { data: data.user, error: null };
    } catch (error) {
      console.error('[AUTH_CONTEXT] ❌ Unexpected error during signup:', error);
      console.error('[AUTH_CONTEXT] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      
      // Advanced diagnostic information
      console.error('[AUTH_CONTEXT] Is navigator online?', navigator.onLine);
      console.error('[AUTH_CONTEXT] Current URL:', window.location.href);
      console.error('[AUTH_CONTEXT] User agent:', navigator.userAgent);
      
      // Try to identify if this is a browser security or CORS issue
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('CORS') ||
            error.message.includes('cross-origin')) {
          console.error('[AUTH_CONTEXT] This appears to be a CORS or browser security issue');
        }
      }
      
      // Return the error for proper handling in the UI
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('An unexpected error occurred during signup')
      };
    }
  };

  const signOut = async () => {
    await awsAuth.signOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
