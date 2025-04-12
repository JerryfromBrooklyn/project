import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface AppleInputProps 
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  isFullWidth?: boolean;
}

export const AppleInput = forwardRef<HTMLInputElement, AppleInputProps>(
  ({
    variant = 'default',
    size = 'md',
    label,
    error,
    leftIcon,
    rightIcon,
    helperText,
    isFullWidth = false,
    className,
    disabled,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId();

    const baseStyles = 'rounded-apple-sm font-apple-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-apple-blue-500 disabled:opacity-60 disabled:cursor-not-allowed';
    
    const variantStyles = {
      default: 'bg-white border border-apple-gray-300 focus:border-apple-blue-500 dark:bg-apple-gray-800 dark:border-apple-gray-600 dark:focus:border-apple-blue-500',
      filled: 'bg-apple-gray-100 border border-transparent focus:bg-white focus:border-apple-blue-500 dark:bg-apple-gray-700 dark:focus:bg-apple-gray-800',
      outlined: 'bg-transparent border border-apple-gray-300 focus:border-apple-blue-500 dark:border-apple-gray-600 dark:focus:border-apple-blue-500',
    };
    
    const sizeStyles = {
      sm: 'text-sm h-8 px-3',
      md: 'text-base h-10 px-4',
      lg: 'text-lg h-12 px-5',
    };
    
    const errorStyles = error ? 'border-apple-red-500 focus:border-apple-red-500 focus:ring-apple-red-500/20' : '';
    
    const widthStyles = isFullWidth ? 'w-full' : '';

    const leftIconStyles = leftIcon ? 'pl-10' : '';
    const rightIconStyles = rightIcon ? 'pr-10' : '';
    
    return (
      <div className={cn(widthStyles, 'flex flex-col gap-1')}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-sm font-medium text-apple-gray-900 dark:text-apple-gray-200"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-apple-gray-500">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[size],
              errorStyles,
              leftIconStyles,
              rightIconStyles,
              widthStyles,
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-apple-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={`${inputId}-error`} 
            className="text-sm text-apple-red-500 mt-1"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="text-sm text-apple-gray-500 dark:text-apple-gray-400 mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AppleInput.displayName = 'AppleInput'; 