import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDocClient } from '../services/awsClient';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ToastNotification from './ToastNotification';
import { Home, Upload, User, Menu, X, LogOut, Images } from 'lucide-react';

const Layout = ({ children }) => {
  const [unreadPhotoMatches, setUnreadPhotoMatches] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Fetch unread photo matches count
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadMatches = async () => {
      try {
        const docClient = getDocClient();
        const { Items = [] } = await docClient.send(
          new QueryCommand({
            TableName: 'shmong-notifications',
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            FilterExpression: 'isRead = :isRead',
            ExpressionAttributeValues: {
              ':userId': user.id,
              ':isRead': false
            }
          })
        );
        
        setUnreadPhotoMatches(Items.length);
        
        // Show toast notification if there are new matches
        if (Items.length > 0 && !sessionStorage.getItem('notificationShown')) {
          setToastMessage(`You have ${Items.length} new photo matches!`);
          setToastType('success');
          setShowToast(true);
          sessionStorage.setItem('notificationShown', 'true');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchUnreadMatches();
    
    // Set up polling for new matches
    const intervalId = setInterval(fetchUnreadMatches, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  // Desktop navigation
  const DesktopNav = () => (
    <header className="hidden md:block bg-white border-b border-border-light sticky top-0 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-semibold text-text-primary">
            Shmong<span className="text-primary">.tv</span>
          </Link>
          
          {user && (
            <nav className="ml-10 flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/dashboard')
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:text-primary hover:bg-primary-light/50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/upload"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/upload')
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:text-primary hover:bg-primary-light/50'
                }`}
              >
                Upload
              </Link>
              <Link
                to="/my-photos"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/my-photos')
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:text-primary hover:bg-primary-light/50'
                }`}
              >
                My Photos
              </Link>
            </nav>
          )}
        </div>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <NotificationBell userId={user.id} count={unreadPhotoMatches} />
            <div className="relative group">
              <button className="flex items-center space-x-2 text-text-secondary hover:text-primary">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
                  {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <span className="font-medium">{user.firstName || user.email}</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-ios-lg shadow-lg border border-border-light opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 ease-in-out z-50">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-primary-light hover:text-primary"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-text-secondary hover:text-primary">
              Sign in
            </Link>
            <Link to="/signup" className="ios-button-primary ios-button-sm">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
  
  // Mobile navigation
  const MobileNav = () => (
    <>
      {/* Mobile header */}
      <header className="md:hidden bg-white sticky top-0 z-40 pt-safe border-b border-border-light">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-text-secondary focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h1 className="ml-2 text-lg font-semibold text-text-primary">
              Shmong<span className="text-primary">.tv</span>
            </h1>
          </div>
          
          {user && (
            <NotificationBell userId={user.id} count={unreadPhotoMatches} />
          )}
        </div>
      </header>
      
      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-white pt-safe pb-safe overflow-y-auto flex flex-col">
            {/* User info */}
            {user && (
              <div className="px-6 pt-6 pb-4 border-b border-border-light">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary text-lg font-medium">
                    {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-text-primary">
                      {user.firstName || 'User'}
                    </h3>
                    <p className="text-sm text-text-tertiary truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Nav links */}
            <div className="px-2 pt-2 pb-3 flex-1">
              {user ? (
                <nav className="space-y-1">
                  <Link
                    to="/dashboard"
                    className={`flex items-center px-3 py-3 rounded-ios-lg text-base font-medium ${
                      isActive('/dashboard')
                        ? 'bg-primary-light text-primary'
                        : 'text-text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    Dashboard
                  </Link>
                  <Link
                    to="/upload"
                    className={`flex items-center px-3 py-3 rounded-ios-lg text-base font-medium ${
                      isActive('/upload')
                        ? 'bg-primary-light text-primary'
                        : 'text-text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Upload className="w-5 h-5 mr-3" />
                    Upload Photos
                  </Link>
                  <Link
                    to="/my-photos"
                    className={`flex items-center px-3 py-3 rounded-ios-lg text-base font-medium ${
                      isActive('/my-photos')
                        ? 'bg-primary-light text-primary'
                        : 'text-text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Images className="w-5 h-5 mr-3" />
                    My Photos
                    {unreadPhotoMatches > 0 && (
                      <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full">
                        {unreadPhotoMatches}
                      </span>
                    )}
                  </Link>
                </nav>
              ) : (
                <div className="space-y-4 p-4">
                  <Link
                    to="/login"
                    className="block w-full ios-button-secondary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full ios-button-primary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
            
            {/* Sign out button */}
            {user && (
              <div className="px-2 pb-4 pt-2 border-t border-border-light">
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-3 rounded-ios-lg text-base font-medium text-danger"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-light pb-safe z-40">
          <div className="grid grid-cols-3 h-16">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center ${
                isActive('/dashboard') ? 'text-primary' : 'text-text-tertiary'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              to="/upload"
              className={`flex flex-col items-center justify-center ${
                isActive('/upload') ? 'text-primary' : 'text-text-tertiary'
              }`}
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs mt-1">Upload</span>
            </Link>
            <Link
              to="/my-photos"
              className={`flex flex-col items-center justify-center relative ${
                isActive('/my-photos') ? 'text-primary' : 'text-text-tertiary'
              }`}
            >
              <Images className="w-6 h-6" />
              <span className="text-xs mt-1">My Photos</span>
              {unreadPhotoMatches > 0 && (
                <span className="absolute top-1 right-1/4 bg-danger text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadPhotoMatches}
                </span>
              )}
            </Link>
          </div>
        </nav>
      )}
    </>
  );
  
  return (
    <div className="min-h-screen flex flex-col bg-app-bg">
      <DesktopNav />
      <MobileNav />
      
      <main className={`flex-1 pt-4 pb-4 ${user ? 'md:pt-6 md:pb-12 pb-24' : ''}`}>
        <div className="container mx-auto px-4">
          {children}
        </div>
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