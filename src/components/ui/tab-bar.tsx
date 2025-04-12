import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface TabItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | null;
}

export interface TabBarProps {
  items: TabItem[];
  className?: string;
  onChange?: (path: string) => void;
  showLabels?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  enableHaptic?: boolean;
  variant?: 'default' | 'floating' | 'minimal';
}

export const TabBar: React.FC<TabBarProps> = ({
  items,
  className,
  onChange,
  showLabels = true,
  activeColor = 'text-apple-blue-500',
  inactiveColor = 'text-apple-gray-500',
  enableHaptic = true,
  variant = 'default',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(location.pathname);
  const [prevTab, setPrevTab] = useState<string | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);

  // Update active tab when route changes
  useEffect(() => {
    // Find the most specific matching route
    let bestMatch = '';
    let bestMatchLength = 0;
    
    for (const item of items) {
      // Exact match
      if (location.pathname === item.path) {
        setActiveTab(item.path);
        return;
      }
      
      // Starts with match (for nested routes)
      if (location.pathname.startsWith(item.path) && item.path.length > bestMatchLength) {
        bestMatch = item.path;
        bestMatchLength = item.path.length;
      }
    }
    
    // If we found a partial match
    if (bestMatch) {
      setActiveTab(bestMatch);
    }
  }, [location.pathname, items]);

  // Haptic feedback function
  const triggerHaptic = () => {
    if (!enableHaptic) return;
    
    if (navigator && navigator.vibrate) {
      navigator.vibrate(10); // Short vibration
    }
  };

  // Handle tab selection
  const handleTabSelect = (path: string) => {
    if (path === activeTab) return;
    
    setPrevTab(activeTab);
    setActiveTab(path);
    triggerHaptic();
    
    navigate(path);
    onChange?.(path);
  };

  // Handle touch start for better tap responsiveness
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartTime(Date.now());
  };
  
  // Handle touch end to reduce perceived latency
  const handleTouchEnd = (path: string) => {
    const touchDuration = touchStartTime ? Date.now() - touchStartTime : 0;
    
    // If it was a quick tap (under 300ms), navigate immediately
    if (touchDuration < 300) {
      handleTabSelect(path);
    }
    
    setTouchStartTime(null);
  };

  // Get styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'floating':
        return 'mx-4 mb-4 rounded-full shadow-xl border border-apple-gray-200 dark:border-apple-gray-700';
      case 'minimal':
        return 'border-t border-transparent';
      default:
        return 'border-t border-apple-gray-200 dark:border-apple-gray-800';
    }
  };

  return (
    <div
      className={cn(
        'ios-tab-bar z-40 bg-white dark:bg-apple-gray-900',
        getVariantStyles(),
        className
      )}
    >
      {items.map((item) => {
        const isActive = activeTab === item.path;
        const direction = prevTab && items.findIndex(i => i.path === prevTab) > items.findIndex(i => i.path === item.path) ? -1 : 1;
        
        return (
          <motion.button
            key={item.path}
            className={cn(
              'ios-tab relative flex flex-1 flex-col items-center justify-center',
              isActive ? activeColor : inactiveColor
            )}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabSelect(item.path)}
            onTouchStart={handleTouchStart}
            onTouchEnd={() => handleTouchEnd(item.path)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`icon-${isActive}`}
                initial={{ 
                  y: 10 * direction, 
                  opacity: 0, 
                  scale: 0.8 
                }}
                animate={{ 
                  y: 0, 
                  opacity: 1, 
                  scale: 1 
                }}
                exit={{ 
                  y: -10 * direction, 
                  opacity: 0, 
                  scale: 0.8 
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 500, 
                  damping: 30, 
                  mass: 0.8 
                }}
                className="ios-tab-icon relative"
              >
                {isActive ? (item.activeIcon || item.icon) : item.icon}
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-apple-red-500 rounded-full px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
            
            {showLabels && (
              <motion.span 
                className="ios-tab-label mt-1"
                animate={{ 
                  scale: isActive ? 1.05 : 1,
                  fontWeight: isActive ? '500' : '400',
                }}
              >
                {item.label}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default TabBar; 