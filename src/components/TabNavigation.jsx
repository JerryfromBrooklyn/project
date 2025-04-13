import React from 'react';
import { 
  Home, 
  Upload, 
  Camera, 
  Image as ImageIcon,
  Calendar,
  Trash2
} from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      tooltip: 'Overview and statistics',
      color: 'blue',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      tooltip: 'Upload and process photos with AI',
      color: 'green',
      bgColor: 'bg-green-100'
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: ImageIcon,
      tooltip: 'Browse your photo collection',
      color: 'amber',
      bgColor: 'bg-amber-100'
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      tooltip: 'View event photos',
      color: 'indigo',
      bgColor: 'bg-indigo-100'
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      tooltip: 'View and restore deleted items',
      color: 'gray',
      bgColor: 'bg-gray-100'
    }
  ];

  // Native share functionality
  const handleShare = (url, title) => {
    if (navigator.share) {
      navigator.share({
        title: title || 'Shared from Photo App',
        url: url
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = title || 'download';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="border-b border-gray-200">
      <div className="px-2 sm:px-4">
        <nav className="flex flex-wrap justify-center sm:justify-between gap-1 sm:gap-0" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm flex flex-col items-center
                  transition-all duration-200 relative group rounded-lg mx-0.5
                  ${isActive 
                    ? `border-b-2 border-${tab.color}-500 text-${tab.color}-700 ${tab.bgColor}` 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                `}
                aria-current={isActive ? 'page' : undefined}
                title={tab.tooltip}
                role="tab"
                tabIndex={0}
                aria-label={tab.tooltip}
              >
                <div className={`relative rounded-full p-1.5 ${isActive ? tab.bgColor : ''}`}>
                  <Icon className={`h-5 w-5 ${isActive ? `text-${tab.color}-500` : 'text-gray-400 group-hover:text-gray-500'}`} />
                </div>
                <span className="text-[11px] sm:text-xs mt-1 whitespace-nowrap">{tab.label}</span>
                
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