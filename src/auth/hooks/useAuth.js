import { useContext } from 'react';
import { AuthContext } from '../AuthProvider';

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context with user, session, loading state, and auth methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth; 