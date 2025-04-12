import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  User, 
  Upload, 
  Image as ImageIcon, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Bell
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if the current path matches the tab path
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const tabs = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <Home className="w-5 h-5" />,
      exact: true
    },
    { 
      name: 'Face Registration', 
      path: '/dashboard/face-registration', 
      icon: <User className="w-5 h-5" />
    },
    { 
      name: 'Upload Photos', 
      path: '/dashboard/upload', 
      icon: <Upload className="w-5 h-5" />
    },
    { 
      name: 'My Photos', 
      path: '/dashboard/photos', 
      icon: <ImageIcon className="w-5 h-5" />
    },
    { 
      name: 'Search', 
      path: '/dashboard/search', 
      icon: <Search className="w-5 h-5" />
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Tabs */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">FaceReko</span>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(tab.path) && (tab.exact ? location.pathname === tab.path : true)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {tab.icon}
                    <span className="ml-2">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* User menu */}
            <div className="flex items-center">
              <button
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-medium">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                      {user?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    aria-label="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            <span className="text-xl font-bold text-blue-600">FaceReko</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => {
                  navigate(tab.path);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive(tab.path) && (tab.exact ? location.pathname === tab.path : true)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  {tab.icon}
                  <span className="ml-3">{tab.name}</span>
                </div>
              </button>
            ))}
            
            <div className="border-t border-gray-200 my-3"></div>
            
            <div className="flex items-center px-3 py-2">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-medium">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name || 'User'}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email || ''}</div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Sign out</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Navigation; 