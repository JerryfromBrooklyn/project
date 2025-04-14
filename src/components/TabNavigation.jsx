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
    <div className="sticky top-14 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <nav className="max-w-screen-lg mx-auto flex items-center justify-around px-2 py-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center justify-center py-2 px-3 transition-colors duration-150 relative',
                isActive ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={tab.tooltip}
              role="tab"
              tabIndex={0}
              aria-label={tab.tooltip}
            >
              <div className="flex flex-col items-center">
                <Icon className={cn(
                  'w-5 h-5 mb-1 transition-transform',
                  isActive ? `text-${tab.color}-500 scale-110` : 'text-gray-500 dark:text-gray-400'
                )} />
                <span className={cn(
                  'text-xs font-medium truncate',
                  isActive ? `text-${tab.color}-500` : 'text-gray-500 dark:text-gray-400'
                )}>
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <span className="absolute -bottom-1 w-10 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation; 