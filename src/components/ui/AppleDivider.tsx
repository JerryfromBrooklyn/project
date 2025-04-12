import React from 'react';
import { cn } from '../../utils/cn';

export interface AppleDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'subtle' | 'invisible';
  className?: string;
  text?: string;
}

export function AppleDivider({
  orientation = 'horizontal',
  variant = 'default',
  className,
  text,
  ...props
}: AppleDividerProps) {
  
  const variantStyles = {
    default: 'bg-apple-gray-200 dark:bg-apple-gray-700',
    subtle: 'bg-apple-gray-100 dark:bg-apple-gray-800',
    invisible: 'invisible',
  };
  
  const orientationStyles = orientation === 'horizontal'
    ? 'w-full h-px my-2'
    : 'h-full w-px mx-2';
  
  if (text) {
    return (
      <div 
        className={cn(
          'flex items-center w-full my-4',
          className
        )}
        {...props}
      >
        <div className={cn('flex-grow', variantStyles[variant], 'h-px')} />
        <span className="px-3 text-sm text-apple-gray-500 dark:text-apple-gray-400 font-apple-text">
          {text}
        </span>
        <div className={cn('flex-grow', variantStyles[variant], 'h-px')} />
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        orientationStyles,
        variantStyles[variant],
        className
      )}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
} 