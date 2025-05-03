import { Suspense, lazy, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';

// Lazy load components to improve initial load time
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const LegalDocument = lazy(() => import('./pages/LegalDocument'));

interface ProtectedRouteProps {
  children: ReactNode;
}

interface PublicRouteProps {
  children: ReactNode;
}

// Protected route component
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public route component that redirects to dashboard if user is logged in
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
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

  // Check if the current route is a legal document page
  const isLegalPage = () => {
    const path = window.location.pathname;
    return path === '/terms-of-service-and-privacy-policy' || path === '/biometrics-policy';
  };

  return (
    <Router>
      {isLegalPage() ? (
        // Legal document routes - completely outside of AuthProvider
        <Routes>
          <Route 
            path="/terms-of-service-and-privacy-policy" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              </div>}>
                <LegalDocument docPath="/docs/terms-of-service-and-privacy-policy.md" title="Terms of Service & Privacy Policy" />
              </Suspense>
            } 
          />
          <Route 
            path="/biometrics-policy" 
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              </div>}>
                <LegalDocument docPath="/docs/biometrics-policy.md" title="Biometrics Policy" />
              </Suspense>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        // All other routes inside AuthProvider
        <AuthProvider>
          {/* Mock mode banner with retry option */}
          {isMockMode && (
            <div className="bg-yellow-500 text-white text-center py-2 px-4 shadow-md">
              ⚠️ Running in Local Storage Mode - AWS connectivity issue detected. Data stored locally only.
              <button 
                onClick={handleRetryAwsConnection}
                className="ml-4 px-2 py-1 bg-white text-yellow-700 rounded text-sm hover:bg-yellow-100"
              >
                Retry AWS Connection
              </button>
            </div>
          )}
          {isInTestMode && !isMockMode && (
            <div className="bg-purple-500 text-white text-center py-2 px-4 shadow-md">
              🧪 Running in Testing Mode - Authentication is bypassed
            </div>
          )}
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                  </div>}>
                    <Signup />
                  </Suspense>
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                  </div>}>
                    <Login />
                  </Suspense>
                </PublicRoute>
              } 
            />
            <Route 
              path="/verify-email" 
              element={
                <PublicRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                  </div>}>
                    <VerifyEmail />
                  </Suspense>
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isInTestMode ? (
                  // In testing mode, allow access to dashboard without authentication
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                    </div>
                  }>
                    <Dashboard />
                  </Suspense>
                ) : (
                  // Normal protected route
                  <ProtectedRoute>
                    <Suspense fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                      </div>
                    }>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                )
              } 
            />
            <Route 
              path="/terms-of-service-and-privacy-policy" 
              element={<Navigate to="/terms-of-service-and-privacy-policy" replace />} 
            />
            <Route 
              path="/biometrics-policy" 
              element={<Navigate to="/biometrics-policy" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      )}
    </Router>
  );
}

export default App;