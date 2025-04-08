import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
    console.log('[PRIVATE_ROUTE] Current path:', location.pathname);
    console.log('[PRIVATE_ROUTE] Auth state - User:', user ? user.id : 'null');
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
            };
        }
    }, [loading]);
    if (isChecking || loading) {
        console.log('[PRIVATE_ROUTE] Still checking authentication, showing loader');
        return (_jsxs("div", { className: "flex items-center justify-center h-screen", children: [_jsx(Loader, { className: "h-8 w-8 text-blue-500 animate-spin" }), _jsx("span", { className: "ml-2 text-gray-600", children: "Checking authentication..." })] }));
    }
    if (!user) {
        console.log('[PRIVATE_ROUTE] No authenticated user found, redirecting to login');
        // Redirect to login if not authenticated and save the location they were trying to access
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    // User is authenticated, render the protected component
    console.log('[PRIVATE_ROUTE] User is authenticated, rendering children');
    return children;
};
export default PrivateRoute;
