import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import VerifyEmail from './auth/VerifyEmail';
import SimpleApp from './SimpleApp';
import Dashboard from './components/Dashboard.js';
import FaceRegistration from './components/FaceRegistration';
import MyPhotos from './components/MyPhotos';
import PhotoUploader from './components/PhotoUploader';
import PrivateRoute from './components/PrivateRoute';
import BuildInfoBanner from './components/BuildInfoBanner';

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
  
  useEffect(() => {
    // Force add banner if component approach doesn't work
    console.log('[APP] Component mounted, forcing banner as backup');
    const existingBanner = document.getElementById('force-banner');
    if (!existingBanner) {
      const forceBanner = document.createElement('div');
      forceBanner.id = 'force-banner';
      forceBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;z-index:999999;height:22px;text-align:center;font-size:12px;padding:2px;font-weight:bold;';
      forceBanner.innerHTML = 'VERSION BANNER (FORCED)';
      document.body.prepend(forceBanner);
    }
  }, []);
  
  return (
    <>
      <BuildInfoBanner />
      <Router>
        {console.log('[APP] Router rendered')}
        <AuthProvider>
          {console.log('[APP] AuthProvider rendered')}
          <div className="pt-6"> {/* Small padding to accommodate the thin banner */}
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
              
              {/* Redirect all other routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </>
  );
};

export default App; 