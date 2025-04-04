// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../services/awsAuthService';
import awsAuth, { testAwsConnectivity } from '../services/awsAuthService';
import { checkTableExists } from '../services/database-utils';
import { USERS_TABLE } from '../lib/awsClient';

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
        // Check if the users table exists
        console.log('[AUTH_CONTEXT] Checking if DynamoDB users table exists...');
        const tableCheck = await checkTableExists(USERS_TABLE);
        
        if (!tableCheck.success || !tableCheck.exists) {
          console.error(`[AUTH_CONTEXT] DynamoDB table check failed for table ${USERS_TABLE}:`, 
            tableCheck.success ? 'Table does not exist' : tableCheck.error);
        } else {
          console.log(`[AUTH_CONTEXT] DynamoDB table ${USERS_TABLE} exists and is accessible`);
        }
        
        const { data } = await awsAuth.getSession();
        const currentUser = await awsAuth.getCurrentUser();
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          navigate('/dashboard');
        }

        // Set up listener for auth changes
        const subscription = awsAuth.onAuthStateChange((currentUser) => {
          setUser(currentUser);
          
          if (currentUser) {
            navigate('/dashboard');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth state:', error);
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await awsAuth.signInWithPassword(email, password);
      
      if (!error && data.user) {
        navigate('/dashboard');
      }
      
      return { data: data.user, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    // Not directly supported with AWS Cognito without using Hosted UI
    // This would need a more complex implementation with Cognito Hosted UI
    console.warn('Google sign-in requires Cognito Hosted UI configuration');
    
    // For now, we'll redirect to the login page with a message
    navigate('/login', { state: { message: 'Social logins are not available. Please use email/password.' }});
  };

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    try {
      console.log('[AUTH_CONTEXT] Starting signup process...');
      console.log('[AUTH_CONTEXT] Email:', email);
      console.log('[AUTH_CONTEXT] Full Name:', fullName);
      console.log('[AUTH_CONTEXT] User Type:', userType);
      
      // Try primary signup method
      console.log('[AUTH_CONTEXT] Trying primary AWS SDK signup method...');
      const { data, error } = await awsAuth.signUp(email, password, {
        full_name: fullName,
        role: userType
      });

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
          error: error ? { name: error.name, message: error.message } : null
        }, null, 2)
      );

      // If AWS SDK method fails, try the fetch method
      if (error) {
        console.error('[AUTH_CONTEXT] Primary signup failed, trying fallback fetch method...');
        
        const fetchResult = await awsAuth.signUpWithFetch(email, password, {
          full_name: fullName,
          role: userType
        });
        
        console.log('[AUTH_CONTEXT] Fetch method result:', 
          JSON.stringify({
            success: !fetchResult.error,
            userData: fetchResult.data?.user || null,
            error: fetchResult.error ? 
              { name: fetchResult.error.name, message: fetchResult.error.message } : null
          }, null, 2)
        );
        
        // If both methods fail, return the original error
        if (fetchResult.error) {
          console.error('[AUTH_CONTEXT] Both signup methods failed');
          return { data: null, error };
        }
        
        // If fetch method succeeds, use its data
        const successData = fetchResult.data;
        
        if (!successData.user) {
          console.error('[AUTH_CONTEXT] No user data returned from fetch signup');
          return { data: null, error: new Error('No user data returned') };
        }
        
        console.log('[AUTH_CONTEXT] User created successfully with fetch method');
        navigate('/verify-email', { state: { email } });
        return { data: successData.user, error: null };
      }

      if (!data.user) {
        console.error('[AUTH_CONTEXT] No user data returned from primary signup');
        return { data: null, error: new Error('No user data returned') };
      }

      console.log('[AUTH_CONTEXT] User created successfully:', data.user.id);

      // User needs to verify their email if not auto-confirmed
      if (!data.userConfirmed) {
        console.log('[AUTH_CONTEXT] User needs email verification. Redirecting to verification page...');
        navigate('/verify-email', { state: { email } });
        return { data: data.user, error: null };
      }

      console.log('[AUTH_CONTEXT] User is confirmed, navigating to dashboard');
      navigate('/dashboard');
      
      return { data: data.user, error: null };
    } catch (error) {
      console.error('[AUTH_CONTEXT] Unexpected error during signup:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('[AUTH_CONTEXT] Error name:', error.name);
        console.error('[AUTH_CONTEXT] Error message:', error.message);
        console.error('[AUTH_CONTEXT] Error stack:', error.stack);
      }
      
      return { data: null, error: error as Error };
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
