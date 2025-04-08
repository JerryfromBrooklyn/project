import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
// Lazy load components to improve initial load time
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
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
// Create a function to check if we're in testing mode 
function isTestingMode() {
    // Check for test mode in localStorage or URL params
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('test') === 'true' || localStorage.getItem('TESTING_MODE') === 'true';
}
function App() {
    // Check if we're in mock mode
    const isMockMode = localStorage.getItem('MOCK_AUTH_MODE') === 'true';
    const isInTestMode = isTestingMode();
    // Function to switch back to regular AWS mode
    const handleRetryAwsConnection = () => {
        localStorage.removeItem('MOCK_AUTH_MODE');
        localStorage.removeItem('TESTING_MODE');
        window.location.reload();
    };
    return (_jsx(Router, { children: _jsxs(AuthProvider, { children: [isMockMode && (_jsxs("div", { className: "bg-yellow-500 text-white text-center py-2 px-4 shadow-md", children: ["\u26A0\uFE0F Running in Local Storage Mode - AWS connectivity issue detected. Data stored locally only.", _jsx("button", { onClick: handleRetryAwsConnection, className: "ml-4 px-2 py-1 bg-white text-yellow-700 rounded text-sm hover:bg-yellow-100", children: "Retry AWS Connection" })] })), isInTestMode && !isMockMode && (_jsx("div", { className: "bg-purple-500 text-white text-center py-2 px-4 shadow-md", children: "\uD83E\uDDEA Running in Testing Mode - Authentication is bypassed" })), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(PublicRoute, { children: _jsx(LandingPage, {}) }) }), _jsx(Route, { path: "/signup", element: _jsx(PublicRoute, { children: _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }), children: _jsx(Signup, {}) }) }) }), _jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }), children: _jsx(Login, {}) }) }) }), _jsx(Route, { path: "/verify-email", element: _jsx(PublicRoute, { children: _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }), children: _jsx(VerifyEmail, {}) }) }) }), _jsx(Route, { path: "/dashboard", element: isInTestMode ? (
                            // In testing mode, allow access to dashboard without authentication
                            _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }), children: _jsx(Dashboard, {}) })) : (
                            // Normal protected route
                            _jsx(ProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" }) }), children: _jsx(Dashboard, {}) }) })) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] })] }) }));
}
export default App;
