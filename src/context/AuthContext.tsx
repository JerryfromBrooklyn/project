// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as SupabaseUser, Session } from '@supabase/supabase-js'; // Keep if using Supabase
import {
    getSession as getCognitoSession,
    getCurrentUser as getCognitoUser,
    signInWithPassword as cognitoSignIn,
    signUp as cognitoSignUp,
    signOut as cognitoSignOut,
    onAuthStateChange as onCognitoAuthStateChange,
    // BYPASS_EMAIL_VERIFICATION // Import if needed
} from '../services/awsAuthService'; // Assuming awsAuthService is primary

// Define a User type consistent with your application needs
// This might combine Supabase and Cognito details if needed
export type User = {
    id: string;
    email?: string | null;
    full_name?: string | null;
    role?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    // Add any other fields you need from Cognito or your DB
};

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    // Adjust signIn return type to match awsAuthService implementation
    signIn: (email: string, password: string) => Promise<{ data: { user: User | null, session: any | null }, error: Error | null }>;
    signInWithGoogle?: () => Promise<void>; // Optional
    signUp: (email: string, password: string, userData?: any) => Promise<{ data: { user: User | null, userConfirmed: boolean }, error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
    // Add other methods as needed
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
        const { data } = await getCognitoSession();
        const currentUser = await getCognitoUser();
        
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
        const subscription = onCognitoAuthStateChange((currentUser) => {
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

  // NEW Effect: Redirect to dashboard when user logs in
  useEffect(() => {
    console.log(`[AUTH_CONTEXT] Redirect Effect Triggered: loading=${loading}, user=${!!user}`); // Add log here
    // Only redirect if loading is finished AND we have a user object
    if (!loading && user) {
      console.log('[AUTH_CONTEXT] User detected after load, redirecting to /dashboard');
      navigate('/dashboard', { replace: true });
    }
     // Optional: Add logic here to redirect to /login if !loading and !user?
     // ...
  }, [user, loading, navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AUTH_CONTEXT] Attempting to sign in with email:', email);
      const result = await cognitoSignIn(email, password);
      
      if (result.error) {
        console.error('[AUTH_CONTEXT] Sign-in error:', result.error);
      } else {
        console.log('[AUTH_CONTEXT] Sign-in successful');
        setUser(result.data.user);
      }
      
      return result as { data: { user: User | null, session: any | null }, error: Error | null };
    } catch (error) {
      console.error('[AUTH_CONTEXT] Unexpected error during sign-in:', error);
      return { 
        data: { user: null, session: null }, 
        error: error instanceof Error ? error : new Error('An unexpected error occurred during sign-in')
      };
    }
  };

  const signInWithGoogle = async () => {
    navigate('/login', { state: { message: 'Social logins are not available in the current environment.' }});
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      console.log('[AUTH_CONTEXT] Calling cognitoSignUp with:', email, '******', userData);
      const result = await cognitoSignUp(email, password, userData);
      
      // Update user state if successful signup
      if (result.data?.user && !result.error) {
        console.log('[AUTH_CONTEXT] Setting user after successful signup:', result.data.user.id);
        setUser(result.data.user);
        
        // Navigate to dashboard with replace:true
        navigate('/dashboard', { replace: true });
      }
      
      return result as { data: { user: User | null, userConfirmed: boolean }, error: Error | null };
    } catch (error) {
      console.error('[AUTH_CONTEXT] Error during signup:', error);
      return { 
        data: { user: null, userConfirmed: false }, 
        error: error instanceof Error ? error : new Error('An unexpected error occurred during signup')
      };
    }
  };

  const signOut = async () => {
    const result = await cognitoSignOut();
    setUser(null);
    navigate('/');
    return result as { error: Error | null };
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
