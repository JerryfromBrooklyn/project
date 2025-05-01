import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './auth/SignUp';
import VerifyEmail from './auth/VerifyEmail';
import SimpleApp from './SimpleApp';
import Dashboard from './pages/Dashboard';
import FaceRegistration from './components/FaceRegistration.jsx';
import MyPhotos from './pages/MyPhotos';
import { PhotoUploader } from './components/PhotoUploader.jsx';
import Notifications from './pages/Notifications';
import SimpleTest from './components/SimpleTest';

// AWS Configuration for Rekognition
// These would typically be in .env files and injected during build
if (!process.env.REACT_APP_AWS_ACCESS_KEY_ID) {
  process.env.REACT_APP_AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'; // Replace with your AWS key
}
if (!process.env.REACT_APP_AWS_SECRET_ACCESS_KEY) {
  process.env.REACT_APP_AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'; // Replace with your AWS secret
}
if (!process.env.REACT_APP_AWS_REGION) {
  process.env.REACT_APP_AWS_REGION = 'us-east-1'; // Default region
}
if (!process.env.REACT_APP_S3_BUCKET) {
  process.env.REACT_APP_S3_BUCKET = 'shmong'; // Your S3 bucket name
}
if (!process.env.REACT_APP_REKOGNITION_COLLECTION) {
  process.env.REACT_APP_REKOGNITION_COLLECTION = 'user-faces'; // Your Rekognition collection
}

console.log('[APP] Initializing App component');

const App = () => {
  console.log('[APP] Rendering App component');
  
  return (
    <>
      <SimpleTest />
      <AuthProvider>
        {console.log('[APP] AuthProvider rendered')}
        <Router>
          {console.log('[APP] Router rendered')}
          <div>
            <Routes>
              {console.log('[APP] Setting up routes')}
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              
              {/* Protected routes */}
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/app" element={<PrivateRoute><SimpleApp /></PrivateRoute>} />
              <Route path="/register-face" element={<PrivateRoute><FaceRegistration /></PrivateRoute>} />
              <Route path="/my-photos" element={<PrivateRoute><MyPhotos /></PrivateRoute>} />
              <Route path="/upload" element={<PrivateRoute><PhotoUploader /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
              
              {/* Redirect all other routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </>
  );
};

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default App; 