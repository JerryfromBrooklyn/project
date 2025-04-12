import React from 'react';
import { 
  Home, 
  Upload, 
  Camera, 
  Users, 
  Image,
  Layers,
  Search,
  User
} from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      tooltip: 'Overview and statistics'
    },
    {
      id: 'upload',
      label: 'Upload Photos',
      icon: Upload,
      tooltip: 'Upload and process photos with AI'
    },
    {
      id: 'face-registration',
      label: 'Face Registration',
      icon: Camera,
      tooltip: 'Register faces for recognition'
    },
    {
      id: 'photos',
      label: 'My Photos',
      icon: Image,
      tooltip: 'Browse your photo collection'
    },
    {
      id: 'search',
      label: 'Face Search',
      icon: Search,
      tooltip: 'Search photos by face'
    },
    {
      id: 'people',
      label: 'People',
      icon: Users,
      tooltip: 'Manage recognized people'
    },
    {
      id: 'albums',
      label: 'Albums',
      icon: Layers,
      tooltip: 'View and manage albums'
    }
  ];

  return (
    <div className="border-b border-gray-200">
      <div className="px-4 sm:px-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  transition-colors duration-200 relative group
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                aria-current={isActive ? 'page' : undefined}
                title={tab.tooltip}
              >
                <Icon className={`mr-2 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.label}
                
                {/* Tooltip - only shown on hover */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg">
                  {tab.tooltip}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation; 