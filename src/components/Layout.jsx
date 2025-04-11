import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDocClient } from '../services/awsClient';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ToastNotification from './ToastNotification';

const Layout = ({ children }) => {
  const [unreadPhotoMatches, setUnreadPhotoMatches] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Fetch unread photo matches count
  useEffect(() => {
    const fetchUnreadMatches = async () => {
      if (!user?.id) return;
      
      try {
        const docClient = getDocClient();
        const { Items = [] } = await docClient.send(new QueryCommand({
          TableName: 'shmong-notifications',
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'user_id = :userId',
          FilterExpression: '#type IN (:type1, :type2) AND #read = :read',
          ExpressionAttributeNames: {
            '#type': 'type',
            '#read': 'read'
          },
          ExpressionAttributeValues: {
            ':userId': user.id,
            ':type1': 'HISTORICAL_MATCH',
            ':type2': 'NEW_MATCH',
            ':read': false
          }
        }));
        
        setUnreadPhotoMatches(Items.length);
        
        // Show toast notification on sign-in if there are unread matches
        if (Items.length > 0 && location.pathname === '/dashboard' && !showToast) {
          setToastMessage(`You have ${Items.length} new photo ${Items.length === 1 ? 'match' : 'matches'}!`);
          setToastType('success');
          setShowToast(true);
        }
      } catch (error) {
        console.error("Error fetching unread matches:", error);
      }
    };
    
    fetchUnreadMatches();
  }, [user?.id, location.pathname, showToast]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="font-bold text-xl text-blue-600 dark:text-blue-400">
              FaceMatch
            </Link>
            
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/my-photos"
                  className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                    location.pathname === '/my-photos'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  My Photos
                  {unreadPhotoMatches > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadPhotoMatches > 9 ? '9+' : unreadPhotoMatches}
                    </span>
                  )}
                </Link>
                
                <Link
                  to="/upload"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/upload'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Upload
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {user && <NotificationBell userId={user.id} />}
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.email}
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      <ToastNotification
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default Layout; 