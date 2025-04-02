import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import PhotosProvider from './features/photos/PhotosProvider';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PhotosPage from './pages/PhotosPage';
import PhotoFixBanner from './components/PhotoFixBanner';

// Auto-fix for photo matching issues
const autoFixPhotoMatches = async (supabase) => {
  console.log('🔧 Auto-fixing photo matching issues...');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ Not logged in, skipping photo match fix');
      return;
    }
    
    const userId = user.id;
    console.log(`🔍 Checking matches for user: ${userId}`);
    
    // These are the 3 specific photos from the logs
    const specificPhotoIds = [
      '811d2222-0264-4676-b589-c7535e573e7f',
      'ee3010c6-b991-42e4-8b01-d7994e44035d',
      'b4362c15-e685-4f9e-9353-68f684989952'
    ];
    
    // Track results
    const results = {
      fixed: 0,
      alreadyMatched: 0,
      failed: 0
    };
    
    // Get user's face ID
    const { data: faceData } = await supabase
      .from('face_data')
      .select('face_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .maybeSingle();
    
    console.log(`📋 User face data:`, faceData);
    
    // Process each photo
    for (const photoId of specificPhotoIds) {
      // Check if the photo exists and user is already matched
      const { data: photo, error: photoError } = await supabase
        .from('photos')
        .select('matched_users')
        .eq('id', photoId)
        .single();
      
      if (photoError) {
        console.log(`⚠️ Photo ${photoId} not found, skipping`);
        results.failed++;
        continue;
      }
      
      // Check if user is already matched
      const matchedUsers = Array.isArray(photo.matched_users) ? photo.matched_users : [];
      const userMatched = matchedUsers.some(match => 
        match.userId === userId || match.user_id === userId
      );
      
      if (userMatched) {
        console.log(`✅ User already matched to photo ${photoId}`);
        results.alreadyMatched++;
        continue;
      }
      
      // Fix the match using the debug function
      console.log(`🔧 Fixing match for photo ${photoId}...`);
      const { data: result, error: updateError } = await supabase.rpc(
        'debug_force_update_photo',
        { 
          p_id: photoId,
          user_id: userId
        }
      );
      
      if (updateError) {
        console.error(`❌ Error updating photo ${photoId}:`, updateError.message);
        results.failed++;
      } else {
        console.log(`✅ Successfully fixed photo ${photoId}`);
        results.fixed++;
      }
    }
    
    console.log(`✅ Auto-fix complete: ${results.fixed} fixed, ${results.alreadyMatched} already matched, ${results.failed} failed`);
    
    // If any photos were fixed, reload the page to refresh the view
    if (results.fixed > 0) {
      console.log('🔄 Reloading page to show fixed photos...');
      setTimeout(() => window.location.reload(), 1500);
    }
  } catch (err) {
    console.error('❌ Error during auto-fix:', err);
  }
};

function App() {
  // Get supabase from window after it's initialized
  useEffect(() => {
    // Will be used by PhotoFixBanner when rendered
    const checkSupabase = () => {
      return window.supabase !== undefined;
    };
    
    // For debugging
    if (checkSupabase()) {
      console.log('✅ Supabase is available on window object');
    } else {
      console.log('⚠️ Supabase not yet available on window object');
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Add the PhotoFixBanner component here with window.supabase */}
        {window.supabase && <PhotoFixBanner supabase={window.supabase} />}
        
        <PhotosProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PhotosProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 