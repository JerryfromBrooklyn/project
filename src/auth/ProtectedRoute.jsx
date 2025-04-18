import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

/**
 * Protected route component that redirects to login if user is not authenticated
 * @returns {JSX.Element} Route content or redirect
 */
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  // Show loading state if auth is still initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Render child routes when authenticated
  return <Outlet />;
};

export default ProtectedRoute; 