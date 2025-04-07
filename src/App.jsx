import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';
import { Login, SignUp, VerifyEmail } from './auth';
import SimpleApp from './SimpleApp';
import Dashboard from './components/Dashboard';
import FaceRegistration from './components/FaceRegistration';
import MyPhotos from './components/MyPhotos';
import PhotoUploader from './components/PhotoUploader';
import PrivateRoute from './components/PrivateRoute';
import BuildInfoBanner from './components/BuildInfoBanner';

console.log('[APP] Initializing App component');

const App = () => {
  console.log('[APP] Rendering App component');
  
  return (
    <AuthProvider>
      {console.log('[APP] AuthProvider rendered')}
      <Router>
        {console.log('[APP] Router rendered')}
        <BuildInfoBanner />
        <div className="pt-6">
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
      </Router>
    </AuthProvider>
  );
};

export default App; 