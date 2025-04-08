import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { Loader } from 'lucide-react';

/**
 * Component for protecting routes that require authentication
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
  console.log('[PRIVATE_ROUTE] Rendering PrivateRoute component');
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const [storedUser, setStoredUser] = useState(null);
  
  // Check localStorage for authentication as fallback
  useEffect(() => {
    try {
      const storedAuthUser = localStorage.getItem('authUser');
      if (storedAuthUser) {
        setStoredUser(JSON.parse(storedAuthUser));
        console.log('[PRIVATE_ROUTE] Found user in localStorage');
      }
    } catch (error) {
      console.error('[PRIVATE_ROUTE] Error reading from localStorage:', error);
    }
  }, []);
  
  console.log('[PRIVATE_ROUTE] Current path:', location.pathname);
  console.log('[PRIVATE_ROUTE] Auth state - User:', user ? user.id : 'null');
  console.log('[PRIVATE_ROUTE] Local storage user:', storedUser ? storedUser.id : 'null');  
  console.log('[PRIVATE_ROUTE] Auth state - Loading:', loading);
  console.log('[PRIVATE_ROUTE] Local state - IsChecking:', isChecking);
  
  useEffect(() => {
    console.log('[PRIVATE_ROUTE] useEffect triggered, loading state:', loading);
    // When Auth context is done loading, we can stop our local loading state
    if (!loading) {
      console.log('[PRIVATE_ROUTE] Auth context finished loading, setting timer');
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        console.log('[PRIVATE_ROUTE] Timer expired, setting isChecking to false');
        setIsChecking(false);
      }, 500);
      
      return () => {
        console.log('[PRIVATE_ROUTE] Cleaning up timer');
        clearTimeout(timer);
      }
    }
  }, [loading]);
  
  if (isChecking || loading) {
    console.log('[PRIVATE_ROUTE] Still checking authentication, showing loader');
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Checking authentication...</span>
      </div>
    );
  }
  
  // Check both context user and stored user for authentication
  const isAuthenticated = !!user || !!storedUser;
  
  if (!isAuthenticated) {
    console.log('[PRIVATE_ROUTE] No authenticated user found, redirecting to login');
    // Redirect to login if not authenticated and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, render the protected component
  console.log('[PRIVATE_ROUTE] User is authenticated, rendering children');
  return children;
};

export default PrivateRoute; 