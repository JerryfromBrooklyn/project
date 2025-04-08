import { jsx as _jsx } from "react/jsx-runtime";
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
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" }) }));
    }
    // Redirect to login if not authenticated
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Render child routes when authenticated
    return _jsx(Outlet, {});
};
export default ProtectedRoute;
