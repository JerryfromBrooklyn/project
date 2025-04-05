import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  getSession, 
  getCurrentUser, 
  signOut as awsSignOut, 
  onAuthStateChange 
} from '../services/awsAuthService';

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

  // --- ADD Function to update face data in user state ---
  const updateUserFaceData = useCallback((faceId, attributes) => {
    console.log('[AuthContext] Updating user state with new face data:', { faceId, attributes });
    setUser(currentUser => {
      if (!currentUser) return null; // Should not happen if called after login
      const updatedUser = {
        ...currentUser,
        faceId: faceId, // Add/Update faceId
        faceAttributes: attributes // Add/Update attributes
      };
      // Log the attributes specifically after setting them in context
      console.log('[AuthContext] User faceAttributes after update:', JSON.stringify(updatedUser.faceAttributes, null, 2));
      return updatedUser;
    });
    // Optional: Consider triggering a background refetch from DB here if needed
    // for absolute consistency, but updating context state directly is faster for UI.
  }, []); // No dependencies needed if only using setUser

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