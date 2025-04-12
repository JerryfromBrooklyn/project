import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { animationVariants } from '../../lib/utils';

interface NavBarProps {
  title?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  transparent?: boolean;
  translucent?: boolean;
  hideTitle?: boolean;
  animate?: boolean;
  className?: string;
  titleClassName?: string;
}

export const NavBar: React.FC<NavBarProps> = ({
  title,
  leftAction,
  rightAction,
  transparent = false,
  translucent = true,
  hideTitle = false,
  animate = true,
  className,
  titleClassName,
}) => {
  const renderTitle = () => {
    if (hideTitle) return null;
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          {...(animate ? animationVariants.fadeIn : {})}
        >
          <h1 
            className={cn(
              "text-lg font-semibold truncate max-w-[200px] text-apple-gray-900 dark:text-white",
              titleClassName
            )}
          >
            {title}
          </h1>
        </motion.div>
      </AnimatePresence>
    );
  };

  const NavBarVariant = () => {
    if (transparent) {
      return "bg-transparent";
    }
    
    if (translucent) {
      return "ios-glass";
    }
    
    return "bg-white dark:bg-apple-dark-500 border-b border-apple-gray-200 dark:border-apple-dark-300";
  };

  return (
    <div className={cn(
      "ios-navbar",
      NavBarVariant(),
      className
    )}>
      <div className="w-full flex items-center justify-between">
        <div className="flex-1">
          {leftAction}
        </div>
        
        {renderTitle()}
        
        <div className="flex-1 flex justify-end">
          {rightAction}
        </div>
      </div>
    </div>
  );
};

// NavBar effect wrapper for the top safe area
export const NavBarSpacer: React.FC<{ height?: number }> = ({ height = 16 }) => {
  return <div className={`h-[${height}px] pt-safe`} />;
}; 