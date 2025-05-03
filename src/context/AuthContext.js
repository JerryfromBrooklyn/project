import { jsx as _jsx } from "react/jsx-runtime";
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import awsAuth from '../services/awsAuthService';
import BackgroundJobService from '../services/BackgroundJobService';

// Helper functions to persist user state
const saveUserToStorage = (user) => {
    if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('authUser');
    }
};

const loadUserFromStorage = () => {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('[AUTH_CONTEXT] Error parsing stored user:', e);
            return null;
        }
    }
    return null;
};

const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    // Initialize with stored user if available
    const [user, setUser] = useState(() => loadUserFromStorage());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Wrapper to update both state and localStorage
    const updateUser = (newUser) => {
        console.log('[AUTH_CONTEXT] Updating user state:', newUser ? newUser.id : 'null');
        setUser(newUser);
        saveUserToStorage(newUser);
    };

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
                
                // Only update if we found a user
                if (currentUser) {
                    updateUser(currentUser);
                } else if (!loadUserFromStorage()) {
                    // Only clear if we don't have a stored user
                    updateUser(null);
                }
                
                setLoading(false);
                
                // Check if current path is a legal page
                const currentPath = window.location.pathname;
                const isLegalPage = 
                    currentPath === '/terms-of-service-and-privacy-policy' || 
                    currentPath === '/biometrics-policy';
                
                // Only redirect to dashboard if not on a legal page
                if (currentUser && !isLegalPage) {
                    console.log('[AUTH_CONTEXT] User already logged in, redirecting to dashboard');
                    navigate('/dashboard');
                } else if (isLegalPage) {
                    console.log('[AUTH_CONTEXT] On legal page, not redirecting');
                }
                
                // Set up listener for auth changes
                const subscription = awsAuth.onAuthStateChange((currentUser) => {
                    console.log('[AUTH_CONTEXT] Auth state changed', { hasUser: !!currentUser });
                    updateUser(currentUser);
                    
                    // Also check for legal pages before redirecting here
                    const currentPath = window.location.pathname;
                    const isLegalPage = 
                        currentPath === '/terms-of-service-and-privacy-policy' || 
                        currentPath === '/biometrics-policy';
                    
                    if (currentUser && !isLegalPage) {
                        navigate('/dashboard');
                    }
                });
                
                return () => {
                    subscription.unsubscribe();
                };
            }
            catch (error) {
                console.error('[AUTH_CONTEXT] Error checking auth state:', error);
                setLoading(false);
            }
        };
        checkUser();
    }, [navigate]);

    // NEW Effect: Redirect to dashboard when user logs in
    useEffect(() => {
        console.log(`[AUTH_CONTEXT] Redirect Effect Triggered: loading=${loading}, user=${!!user}`);
        
        // Get current path to check if it's a legal document page
        const currentPath = window.location.pathname;
        const isLegalPage = 
            currentPath === '/terms-of-service-and-privacy-policy' || 
            currentPath === '/biometrics-policy';
            
        console.log(`[AUTH_CONTEXT] Current path: ${currentPath}, isLegalPage: ${isLegalPage}`);
            
        // Only redirect if loading is finished AND we have a user object AND not on a legal page
        if (!loading && user && !isLegalPage) {
            console.log('[AUTH_CONTEXT] User detected after load, redirecting to /dashboard');
            navigate('/dashboard', { replace: true });
        } else if (isLegalPage) {
            console.log('[AUTH_CONTEXT] On legal page, not redirecting');
        }
    }, [user, loading, navigate]);

    const signIn = async (email, password) => {
        try {
            console.log('[AUTH_CONTEXT] Attempting to sign in with email:', email);
            const result = await awsAuth.signInWithPassword(email, password);
            if (result.error) {
                console.error('[AUTH_CONTEXT] Sign-in error:', result.error);
            }
            else {
                console.log('[AUTH_CONTEXT] Sign-in successful');
                updateUser(result.data.user);
                
                // Run face matching for the user after successful sign-in using the direct Rekognition method
                console.log('🔍🔍🔍 [AUTH_CONTEXT] Running face matching for user after sign-in:', result.data.user.id);
                try {
                    // Use the more efficient method that directly calls Rekognition API
                    const matchResult = await BackgroundJobService.runUserMatchesWithRekognition(result.data.user.id);
                    console.log('🔥 [AUTH_CONTEXT] Face matching completed:', matchResult);
                } catch (matchError) {
                    console.error('🔥 [AUTH_CONTEXT] Error running face matching:', matchError);
                }
            }
            return result;
        }
        catch (error) {
            console.error('[AUTH_CONTEXT] Unexpected error during sign-in:', error);
            return {
                data: null,
                error: error instanceof Error ? error : new Error('An unexpected error occurred during sign-in')
            };
        }
    };
    
    const signInWithGoogle = async () => {
        navigate('/login', { state: { message: 'Social logins are not available in the current environment.' } });
    };
    
    const signUp = async (email, password, userAttributes = {}) => {
        try {
            console.log('[AUTH_CONTEXT] 🚀 Starting AWS signup process...');
            console.log('[AUTH_CONTEXT] Email:', email);
            console.log('[AUTH_CONTEXT] User Attributes:', userAttributes);
            console.log('[AUTH_CONTEXT] AWS Connectivity Status:', navigator.onLine ? 'Online' : 'Offline');
            // Log basic browser network status before attempting signup
            console.log('[AUTH_CONTEXT] Browser network status:', {
                online: navigator.onLine,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
            
            const { data, error } = await awsAuth.signUp(email, password, userAttributes);
            // Handle signup errors
            if (error) {
                console.error('[AUTH_CONTEXT] ❌ AWS signup failed:', error);
                console.error('[AUTH_CONTEXT] Error type:', error?.constructor?.name);
                // Try to identify the specific error category
                let errorCategory = 'Unknown';
                if (error instanceof Error) {
                    if (error.message.includes('timed out')) {
                        errorCategory = 'Timeout';
                    }
                    else if (error.message.includes('network')) {
                        errorCategory = 'Network';
                    }
                    else if (error.message.includes('credentials')) {
                        errorCategory = 'Authentication';
                    }
                    else if (error.message.includes('already exists')) {
                        errorCategory = 'Duplicate';
                    }
                }
                console.error(`[AUTH_CONTEXT] Error category: ${errorCategory}`);
                return { data: null, error };
            }
            console.log('[AUTH_CONTEXT] SignUp API response:', JSON.stringify({
                success: !error,
                userData: data?.user ? {
                    id: data.user.id,
                    email: data.user.email,
                    fullName: data.user.name,
                    role: data.user.custom_role,
                } : null,
                userConfirmed: data?.userConfirmed,
            }, null, 2));
            if (!data.user) {
                console.error('[AUTH_CONTEXT] ❌ No user data returned from AWS signup');
                return { data: null, error: new Error('No user data returned') };
            }
            console.log('[AUTH_CONTEXT] ✅ User created successfully:', data.user.id);
            
            // Update our local user state with the newly created user
            updateUser(data.user);
            
            // Run face matching for the new user after successful signup
            console.log('🔍🔍🔍 [AUTH_CONTEXT] Running face matching for new user after signup:', data.user.id);
            try {
                const matchResult = await BackgroundJobService.runOneTimeFaceMatchingJobForUser(data.user.id);
                console.log('🔥 [AUTH_CONTEXT] Face matching for new user completed:', matchResult);
            } catch (matchError) {
                console.error('🔥 [AUTH_CONTEXT] Error running face matching for new user:', matchError);
            }
            
            // FOR TESTING: Skip email verification and go to dashboard using React Router
            console.log('[AUTH_CONTEXT] TESTING MODE: Bypassing email verification and going directly to dashboard');
            console.log('[AUTH_CONTEXT] Current location before navigation:', window.location.href);
            console.log('[AUTH_CONTEXT] Navigate object available:', !!navigate);
            
            // Use React Router for navigation with replace:true (avoids history issues)
            try {
                navigate('/dashboard', { replace: true });
                console.log('[AUTH_CONTEXT] Navigation called to /dashboard');
            }
            catch (navError) {
                console.error('[AUTH_CONTEXT] Navigation error:', navError);
            }
            
            return { data: data.user, error: null };
        }
        catch (error) {
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
        updateUser(null);
        navigate('/');
    };
    
    return (_jsx(AuthContext.Provider, { value: { user, loading, signIn, signInWithGoogle, signUp, signOut }, children: children }));
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
