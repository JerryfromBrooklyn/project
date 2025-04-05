import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// REMOVE Supabase import
// import { supabase } from '../lib/supabaseClient';
// IMPORT AWS Auth Service
import awsAuthService from '../services/awsAuthService';
import { useNavigate } from 'react-router-dom';
// Import the Lambda auth service
import { signUp as lambdaSignUp } from '../services/lambdaAuthService';

// REMOVE TypeScript Interface definition
// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<{ data: { user: User | null }, error: any }>;
//   signInWithGoogle: () => Promise<void>;
//   signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{ data: { user: User | null }, error: any }>;
//   signOut: () => Promise<{ error: any }>;
// }

const AuthContext = createContext(undefined); // REMOVED <AuthContextType | undefined>

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Initialize auth state from localStorage on mount (run only once)
    useEffect(() => {
        console.log('[AuthContext] Initializing - checking for stored user');
        
        try {
            // First check localStorage for previously stored user
            const storedUserJSON = localStorage.getItem('currentUser');
            
            if (storedUserJSON) {
                try {
                    const storedUser = JSON.parse(storedUserJSON);
                    console.log('[AuthContext] Found user in localStorage:', storedUser.id);
                    // Set user state directly from localStorage
                    setUser(storedUser);
                    setLoading(false);
                } catch (parseError) {
                    console.error('[AuthContext] Error parsing stored user:', parseError);
                    localStorage.removeItem('currentUser'); // Remove invalid data
                }
            } else {
                console.log('[AuthContext] No stored user found in localStorage');
                setLoading(false);
            }
        } catch (error) {
            console.error('[AuthContext] Error initializing auth:', error);
            setLoading(false);
        }
    }, []); // Empty dependency array ensures this runs once on mount

    useEffect(() => {
        let unsubscribe = null;

        // Check for active session on mount using AWS Auth Service
        const checkUserSession = async () => {
            setLoading(true);
            try {
                // First check if we have a user in localStorage
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('[AuthContext] Found user in localStorage:', parsedUser.id);
                    setUser(parsedUser);
                    setLoading(false);
                    return;
                }
                
                // If no stored user, check AWS auth service
                const { data, error } = await awsAuthService.getSession();
                const currentUser = data?.session?.user || null;
                setUser(currentUser);

                // Set up listener for auth changes using AWS Auth Service
                unsubscribe = awsAuthService.onAuthStateChange((currentUserUpdate) => {
                    console.log('[AuthContext] AWS Auth state changed:', currentUserUpdate ? currentUserUpdate.id : 'null');
                    setUser(currentUserUpdate);
                    
                    // If user logged in, store in localStorage for persistence
                    if (currentUserUpdate) {
                        localStorage.setItem('currentUser', JSON.stringify(currentUserUpdate));
                    } else {
                        localStorage.removeItem('currentUser');
                    }
                });

            } catch (error) {
                console.error('[AuthContext] Error checking AWS auth state:', error);
                setUser(null); // Ensure user is null on error
            } finally {
                setLoading(false);
            }
        };

        checkUserSession();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) {
                console.log('[AuthContext] Unsubscribing from AWS auth changes.');
                unsubscribe.unsubscribe();
            }
        };
    }, []);

    // Sign in using AWS Cognito
    const signIn = useCallback(async (email /*: string*/, password /*: string*/) => { // Removed type annotations
        setLoading(true);
        try {
            const { data, error } = await awsAuthService.signInWithPassword(email, password);
            if (error) {
                 console.error('[AuthContext] AWS Sign in error:', error);
                setUser(null);
                // Return error for UI handling
                 return { data: { user: null }, error };
             }
            // User state will be updated by the onAuthStateChange listener
            console.log('[AuthContext] AWS Sign in successful, user state updated by listener.');
            navigate('/dashboard'); // Navigate after successful sign-in
             return { data: { user: data?.user || null }, error: null };
        } catch (error) {
            console.error('[AuthContext] Unexpected error during AWS sign in:', error);
            setUser(null);
            return { data: { user: null }, error };
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Google Sign in - Placeholder for Cognito Hosted UI / Amplify
    const signInWithGoogle = useCallback(async () => {
        console.warn('[AuthContext] signInWithGoogle is not implemented for standard AWS Cognito SDK.');
        alert('Google Sign-In requires configuration with Cognito Hosted UI or AWS Amplify Auth.');
        // Implementation would involve redirecting to Cognito Hosted UI
        // Or using Amplify Auth.federatedSignIn({ provider: 'Google' })
        return Promise.resolve(); // Return empty promise
    }, []);

    // Sign up with Lambda service that uses our new API Gateway endpoint
    const signUp = useCallback(async (email, password, fullName, userType) => {
        console.log('[AuthContext] Starting signup with Lambda auth service');
        setLoading(true);
        
        try {
            // Call the Lambda auth service
            const result = await lambdaSignUp(email, password, {
                full_name: fullName,
                role: userType || 'attendee'
            });
            
            if (result.error) {
                console.error('[AuthContext] Lambda sign up error:', result.error);
                return { data: null, error: result.error };
            }
            
            console.log('[AuthContext] Lambda sign up successful:', result.data.user);
            
            // Set the user in context immediately after successful signup
            setUser(result.data.user);
            
            // Also store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(result.data.user));
            
            // Navigate to dashboard
            navigate('/dashboard');
            
            return { 
                data: { 
                    user: result.data.user,
                    userConfirmed: result.data.userConfirmed
                }, 
                error: null 
            };
        } catch (error) {
            console.error('[AuthContext] Unexpected error during Lambda sign up:', error);
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Sign out using AWS Cognito
    const signOut = useCallback(async () => {
        setLoading(true);
        try {
            await awsAuthService.signOut();
            setUser(null);
            // Clear from localStorage
            localStorage.removeItem('currentUser');
            navigate('/');
        } catch (error) {
            console.error('[AuthContext] Error signing out:', error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Provide context value
    const value = { // REMOVED : AuthContextType
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut
    };

    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}

// Custom hook to use the Auth context
export const useAuth = () => { // REMOVED : AuthContextType
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
