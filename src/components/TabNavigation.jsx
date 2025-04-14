import React from 'react';
import { 
  Home, 
  Upload, 
  Camera, 
  Image as ImageIcon,
  Calendar,
  Trash2
} from 'lucide-react';
import { cn } from '../utils/cn';

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
    <div className="w-full bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-screen-md mx-auto flex items-center justify-center px-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 px-2 sm:px-4 transition-colors duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-800',
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={tab.tooltip}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              aria-label={tab.label}
            >
              <Icon className={cn(
                  'w-5 h-5 mb-0.5 transition-colors',
                  isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                )} />
              <span className={cn(
                  'text-xs font-medium truncate transition-colors',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                )}>
                  {tab.label}
                </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation; 