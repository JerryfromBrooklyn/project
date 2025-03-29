import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

/**
 * Header component with navigation and user actions
 */
const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Photo App
        </Link>
        
        <nav className="hidden md:flex space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
            Home
          </Link>
          {user && (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                Dashboard
              </Link>
              <Link to="/photos" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                Photos
              </Link>
            </>
          )}
          <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
            About
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {user.email}
              </div>
              <button 
                onClick={signOut}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link to="/login" className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 