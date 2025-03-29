import React from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import Layout from '../components/layout/Layout';
import PhotoUploader from '../features/photos/components/PhotoUploader';
import PhotoGrid from '../features/photos/components/PhotoGrid';
import { Link } from 'react-router-dom';

/**
 * Dashboard page component
 */
const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div>
            <Link 
              to="/photos" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View All Photos
            </Link>
          </div>
        </header>

        <section>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Welcome, {user?.email}</h2>
            <p className="text-gray-600 mb-4">
              This is your dashboard where you can upload and manage your photos.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
              <p className="font-medium">Face Detection Enabled</p>
              <p className="mt-1">
                When you upload photos, we'll automatically detect faces and add them to your database.
                This allows you to search and match people across events.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Upload New Photo</h2>
          <PhotoUploader />
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Photos</h2>
            <Link to="/photos" className="text-blue-600 hover:underline text-sm">
              View all photos
            </Link>
          </div>
          <PhotoGrid />
        </section>

        <section>
          <details className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="font-semibold text-gray-700 cursor-pointer">
              Debug Info - Locally Stored Photos
            </summary>
            {/* The LocalStorageDebugPanel will be automatically used here via the PhotosProvider context */}
          </details>
        </section>
      </div>
    </Layout>
  );
};

export default DashboardPage; 