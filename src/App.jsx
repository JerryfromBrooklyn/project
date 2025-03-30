import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import PhotosProvider from './features/photos/PhotosProvider';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PhotosPage from './pages/PhotosPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PhotosProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/photos" element={
              <ProtectedRoute>
                <PhotosPage />
              </ProtectedRoute>
            } />
            {/* Redirect all other routes to dashboard or login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PhotosProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 