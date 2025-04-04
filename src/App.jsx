import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import SimpleApp from './SimpleApp';
import FaceRegistration from './components/FaceRegistration';
import MyPhotos from './components/MyPhotos';
import PhotoUploader from './components/PhotoUploader';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><SimpleApp /></PrivateRoute>} />
          <Route path="/register-face" element={<PrivateRoute><FaceRegistration /></PrivateRoute>} />
          <Route path="/my-photos" element={<PrivateRoute><MyPhotos /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><PhotoUploader /></PrivateRoute>} />
          
          {/* Redirect all other routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 