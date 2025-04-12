import React from 'react';
import { cn } from '../../utils/cn';

export interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isFullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function AppleButton({
  children,
  variant = 'primary',
  size = 'md',
  isFullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: AppleButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-apple-text rounded-apple-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-apple-blue-500';

  const variantStyles = {
    primary: 'bg-apple-blue-500 text-white hover:bg-apple-blue-600 active:bg-apple-blue-700 disabled:bg-apple-gray-200 disabled:text-apple-gray-500',
    secondary: 'bg-apple-gray-100 text-apple-gray-900 hover:bg-apple-gray-200 active:bg-apple-gray-300 disabled:bg-apple-gray-50 disabled:text-apple-gray-400 border border-apple-gray-200',
    tertiary: 'bg-transparent text-apple-blue-500 hover:text-apple-blue-600 active:text-apple-blue-700 disabled:text-apple-gray-400',
    danger: 'bg-apple-red-500 text-white hover:bg-apple-red-600 active:bg-apple-red-700 disabled:bg-apple-gray-200 disabled:text-apple-gray-500',
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-base px-4 py-2 gap-2',
    lg: 'text-lg px-6 py-2.5 gap-2.5',
  };

  const widthStyles = isFullWidth ? 'w-full' : '';

  const loadingStyles = isLoading ? 'cursor-wait opacity-80' : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        loadingStyles,
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {icon && iconPosition === 'left' && !isLoading && (
        <span className="mr-1">{icon}</span>
      )}

      {children}

      {icon && iconPosition === 'right' && (
        <span className="ml-1">{icon}</span>
      )}
    </button>
  );
} 