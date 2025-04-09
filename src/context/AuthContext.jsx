import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  getSession, 
  getCurrentUser, 
  signOut as awsSignOut, 
  onAuthStateChange 
} from '../services/awsAuthService';
import { storeFaceId } from '../services/FaceStorageService';

// Create context
const AuthContext = createContext(null);

// Export hook for using the Auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: sessionData, error: sessionError } = await getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (sessionData.session) {
          setSession(sessionData.session);
          
          // Get user details
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener
    const subscription = onAuthStateChange((userData) => {
      setUser(userData);
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await awsSignOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced function to update face data in user state and persist to database
  const updateUserFaceData = useCallback(async (faceId, attributes, historicalMatches = []) => {
    console.log('[AuthContext] Updating user state with new face data:', { 
      faceId: faceId, 
      attributesCount: attributes ? Object.keys(attributes).length : 0 
    });
    
    // First update the user state for immediate UI feedback
    setUser(currentUser => {
      if (!currentUser) return null; // Should not happen if called after login
      const updatedUser = {
        ...currentUser,
        faceId: faceId, // Add/Update faceId
        faceAttributes: attributes // Add/Update attributes
      };
      console.log('[AuthContext] User faceAttributes after update:', JSON.stringify(updatedUser.faceAttributes, null, 2));
      return updatedUser;
    });
    
    // Then persist the data to DynamoDB to ensure it's available after sign-out/sign-in
    try {
      if (user?.id && faceId) {
        console.log('[AuthContext] Persisting face data to DynamoDB for user:', user.id);
        const storageResult = await storeFaceId(user.id, faceId, attributes);
        
        if (storageResult.success) {
          console.log('[AuthContext] Face data successfully stored in DynamoDB. Image URL:', storageResult.imageUrl);
        } else {
          console.error('[AuthContext] Error storing face data in DynamoDB:', storageResult.error);
          // Even if DynamoDB storage fails, we've already updated the local state
          // so the UI will show the face data for the current session
        }
      }
    } catch (error) {
      console.error('[AuthContext] Exception storing face data:', error);
    }
  }, [user]); // Now depends on user for the ID

  // Auth context value
  const value = {
    user,
    session,
    loading,
    error,
    signOut,
    updateUserFaceData, // <-- Add function to context value
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 