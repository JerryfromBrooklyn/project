import React, { useMemo, useState, useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/router';
import * as Haptics from 'expo-haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface TabItem {
  key: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  tooltip?: string;
  color?: string;
}

export interface TabBarProps {
  items: TabItem[];
  onChange: (key: string) => void;
  activeKey?: string;
  variant?: 'default' | 'contained' | 'pill';
  showLabels?: boolean;
  className?: string;
  itemClassName?: string;
}

const tabBarVariants = cva(
  'flex w-full justify-around items-center bg-background border-t border-border px-1 pt-1 pb-2 fixed bottom-0 left-0 right-0 z-50',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        contained: 'rounded-t-xl shadow-lg mx-auto max-w-md',
        pill: 'rounded-full max-w-xs mx-auto mb-4 shadow-lg px-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabItemVariants = cva(
  'relative flex flex-col items-center justify-center px-2 py-1 rounded-md transition-all duration-150 select-none',
  {
    variants: {
      variant: {
        default: 'hover:bg-accent/10 active:bg-accent/20',
        contained: 'hover:bg-accent/10 active:bg-accent/20',
        pill: 'hover:bg-accent/10 active:bg-accent/20',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        active: true,
        variant: 'default',
        className: 'text-primary',
      },
      {
        active: false,
        variant: 'default',
        className: 'text-muted-foreground',
      },
      {
        active: true,
        variant: 'contained',
        className: 'text-primary bg-accent/15',
      },
      {
        active: false,
        variant: 'contained',
        className: 'text-muted-foreground',
      },
      {
        active: true,
        variant: 'pill',
        className: 'bg-primary text-primary-foreground',
      },
      {
        active: false,
        variant: 'pill',
        className: 'text-muted-foreground',
      },
    ],
    defaultVariants: {
      variant: 'default',
      active: false,
    },
  }
);

const TabBar: React.FC<TabBarProps> = ({
  items,
  onChange,
  activeKey,
  variant = 'default',
  showLabels = true,
  className = '',
  itemClassName = '',
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(activeKey || items[0]?.key);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  
  // Get the current path from router
  const currentPath = router.pathname;

  // Update active tab based on router path
  useEffect(() => {
    const matchedItem = items.find(item => item.path === currentPath);
    if (matchedItem) {
      setActiveTab(matchedItem.key);
    }
  }, [currentPath, items]);

  // Use activeKey as active tab if provided
  useEffect(() => {
    if (activeKey) {
      setActiveTab(activeKey);
    }
  }, [activeKey]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent, item: TabItem) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);
    
    // If it's a tap (minimal movement) and not a swipe
    if (deltaX < 10 && deltaY < 10) {
      handleTabChange(item);
    }
  };

  const handleTabChange = (item: TabItem) => {
    if (item.key === activeTab) return;
    
    setActiveTab(item.key);
    onChange(item.key);
    
    // Haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not supported, ignore
    }
    
    // Navigate to path if provided
    if (item.path) {
      router.push(item.path);
    }
  };

  const renderTabItem = (item: TabItem, index: number) => {
    const isActive = item.key === activeTab;
    const colorClass = item.color || (isActive ? 'text-primary' : 'text-muted-foreground');
    
    return (
      <motion.button
        key={item.key}
        aria-label={item.title}
        title={item.tooltip || item.title}
        className={tabItemVariants({ variant, active: isActive, className: itemClassName })}
        onClick={() => handleTabChange(item)}
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => handleTouchEnd(e, item)}
        whileTap={{ scale: 0.95 }}
        tabIndex={0}
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
      >
        <div className={`relative ${colorClass}`}>
          {item.icon}
          
          {/* Active indicator */}
          {isActive && variant !== 'pill' && (
            <motion.div 
              layoutId="tab-indicator"
              className={`absolute -bottom-1 left-0 right-0 h-0.5 w-full bg-current rounded-full`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>
        
        {showLabels && (
          <span 
            className={`mt-1 text-xs font-medium ${isActive ? colorClass : 'text-muted-foreground'}`}
          >
            {item.title}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <nav 
      className={tabBarVariants({ variant, className })}
      aria-label="Navigation tabs"
    >
      {items.map(renderTabItem)}
    </nav>
  );
};

export default TabBar; 