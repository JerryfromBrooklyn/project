import React from 'react';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  console.log('[DASHBOARD] Rendering Dashboard component');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  console.log('[DASHBOARD] User data:', user);

  const handleSignOut = () => {
    console.log('[DASHBOARD] Sign out button clicked');
    signOut();
  };

  const navigateToFaceRegistration = () => {
    console.log('[DASHBOARD] Navigating to face registration');
    navigate('/register-face');
  };

  const navigateToPhotos = () => {
    console.log('[DASHBOARD] Navigating to photos');
    navigate('/my-photos');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">User Information</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.name || 'Not provided'}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Created:</strong> {new Date().toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button 
            onClick={navigateToFaceRegistration}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-md text-center font-semibold"
          >
            Register Face
          </button>
          
          <button 
            onClick={navigateToPhotos}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-md text-center font-semibold"
          >
            My Photos & Matches
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Authentication Status</h3>
            <p className="text-green-600">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Successfully authenticated with AWS Cognito
            </p>
            <p className="mt-2 text-sm text-gray-600">
              You now have access to all features of the application.
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Next Steps</h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>Register your face to enable matching</li>
              <li>Upload photos to find matches</li>
              <li>View your match history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 