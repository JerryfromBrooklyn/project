import React from 'react';
import { motion } from 'framer-motion';

/**
 * Touch-optimized Button component with proper sizing for mobile
 * Features:
 * - Minimum touch target size (44x44px)
 * - Animation feedback
 * - Accessible focus states
 * - Loading state
 * - Various style variants
 */
export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md', 
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  // Size classes with touch-friendly minimums
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[40px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    outline: 'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
  };
  
  // Loading spinner component
  const Spinner = () => (
    <svg 
      className="animate-spin h-5 w-5" 
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
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        relative rounded-md font-medium transition-colors duration-200
        inline-flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
      
      <span className={`flex items-center ${isLoading ? 'opacity-0' : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </span>
    </motion.button>
  );
}; 