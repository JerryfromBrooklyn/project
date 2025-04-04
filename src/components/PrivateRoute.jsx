import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

/**
 * Component for protecting routes that require authentication
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // When Auth context is done loading, we can stop our local loading state
    if (!loading) {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Checking authentication...</span>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render the protected component
  return children;
};

export default PrivateRoute; 