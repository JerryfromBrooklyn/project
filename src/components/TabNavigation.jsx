import React from 'react';
import { 
  Home, 
  Upload, 
  Camera, 
  Image as ImageIcon,
  Calendar,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      tooltip: 'Overview and Face Registration',
      color: 'blue'
    },
    {
      id: 'photos',
      label: 'My Photos',
      icon: ImageIcon,
      tooltip: 'View your matched photos',
      color: 'amber'
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      tooltip: 'Upload new photos',
      color: 'green'
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      tooltip: 'Browse photos by event',
      color: 'indigo'
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      tooltip: 'View and restore hidden items',
      color: 'gray'
    }
  ];

  return (
    <div className="bg-apple-gray-100 rounded-lg p-1 w-full md:w-auto">
      <nav className="flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                isActive 
                  ? 'bg-white text-apple-gray-900 shadow-sm' 
                  : 'text-apple-gray-600 hover:text-apple-gray-800 hover:bg-apple-gray-50'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={tab.tooltip}
              role="tab"
              tabIndex={0}
              aria-label={tab.tooltip}
            >
              <Icon className={cn('w-4 h-4 mr-1.5', isActive ? `text-${tab.color}-500` : 'text-apple-gray-400')} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation; 