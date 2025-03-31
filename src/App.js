/* =========================================================
 * CRITICAL SECURITY NOTICE - DO NOT MODIFY UNLESS AUTHORIZED
 * =========================================================
 * 
 * ROW LEVEL SECURITY (RLS) CONFIGURATION:
 * 
 * - RLS has been DELIBERATELY DISABLED on database tables
 * - DO NOT ENABLE RLS POLICIES until project completion
 * - Enabling RLS prematurely will BREAK admin functionality
 *   and face matching features
 * 
 * When the project is complete, a comprehensive security review
 * will establish appropriate RLS policies that maintain functionality
 * while ensuring data protection.
 * 
 * Any changes to this configuration require security team approval.
 * =========================================================
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { initializeServiceResources } from './lib/serviceRoleInit';
import BackgroundTaskService from './services/BackgroundTaskService';

// Lazy load dashboard to improve initial load time
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Lazy load emergency tools
const EmergencyTools = lazy(() => import('./pages/EmergencyTools'));

// Initialize database and storage resources on app load
const initializeApp = async () => {
  console.log('[App] Initializing application resources...');
  try {
    await initializeServiceResources();
    console.log('[App] Application resources initialized successfully');
  } catch (error) {
    console.error('[App] Error initializing application resources:', error);
  }
};

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return children;
};
// Public route component that redirects to dashboard if user is logged in
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }));
    }
    if (user) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return children;
};
function App() {
    useEffect(() => {
        // Initialize service resources when the app loads
        initializeApp();
        
        // Initialize background task processor
        BackgroundTaskService.initialize({
            batchSize: 20,
            checkInterval: 60000, // Check every minute
            autoStart: true
        });
        
        // Clean up when component unmounts
        return () => {
            BackgroundTaskService.stop();
        };
    }, []);

    return (_jsx(Router, { children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(PublicRoute, { children: _jsx(LandingPage, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }), children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }));
}
export default App;
