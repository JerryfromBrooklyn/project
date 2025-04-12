import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | boolean;
}

interface TabBarProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  items,
  activeTab,
  onChange,
  className
}) => {
  return (
    <div className={cn("ios-tabbar", className)}>
      {items.map((item) => {
        const isActive = item.id === activeTab;
        
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "ios-tab tap-highlight-none",
              isActive && "ios-tab-active"
            )}
            aria-label={item.label}
            tabIndex={0}
          >
            <div className="relative">
              {isActive ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex justify-center"
                >
                  {item.activeIcon || item.icon}
                </motion.div>
              ) : (
                <div className="flex justify-center">
                  {item.icon}
                </div>
              )}
              
              {/* Badge */}
              {item.badge && (
                <span className="ios-badge">
                  {typeof item.badge === 'number' ? item.badge : null}
                </span>
              )}
            </div>
            
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// TabBar effect wrapper for the bottom safe area
export const TabBarSpacer: React.FC = () => {
  return <div className="h-16 pb-safe" />;
}; 