// Firebase Authentication Implementation
// This is a simplified example to replace AWS Cognito with Firebase Auth

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';

// Your Firebase configuration
// Replace with your actual Firebase project details
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Flag to bypass email verification for testing
export const BYPASS_EMAIL_VERIFICATION = true;

// Sign up with email and password
export const signUp = async (email, password, userData = {}) => {
  console.log('[FIREBASE] Starting sign-up process for email:', email);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send verification email (unless bypassed for testing)
    if (!BYPASS_EMAIL_VERIFICATION) {
      await sendEmailVerification(user);
      console.log('[FIREBASE] Verification email sent');
    } else {
      console.log('[FIREBASE] Email verification bypassed for testing');
    }
    
    // Store additional user data in your database (if needed)
    // This would replace the createUserRecord functionality
    
    return { 
      data: { 
        user: {
          id: user.uid,
          email: user.email,
          full_name: userData.full_name,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        userConfirmed: BYPASS_EMAIL_VERIFICATION 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('[FIREBASE] Sign-up error:', error);
    return { 
      data: { user: null, userConfirmed: false }, 
      error 
    };
  }
};

// Sign in with email and password
export const signInWithPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    return {
      data: {
        user: {
          id: user.uid,
          email: user.email,
          // Add any other user properties you need
        },
        session: {
          accessToken: await user.getIdToken(),
          refreshToken: user.refreshToken,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
        }
      },
      error: null
    };
  } catch (error) {
    console.error('[FIREBASE] Sign in error:', error);
    return { data: { user: null, session: null }, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('[FIREBASE] Sign out error:', error);
    return { error };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('[FIREBASE] Password reset error:', error);
    return { data: { success: false }, error };
  }
};

export default {
  signUp,
  signInWithPassword,
  signOut,
  resetPassword
}; 