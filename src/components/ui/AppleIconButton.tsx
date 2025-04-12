import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface AppleIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function AppleIconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  label,
  ...props
}: AppleIconButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apple-blue-500";
  
  const variantStyles = {
    primary: "bg-apple-blue text-white hover:bg-apple-blue-600 active:bg-apple-blue-700 shadow-apple-sm",
    secondary: "bg-apple-gray-100 text-apple-gray-900 hover:bg-apple-gray-200 active:bg-apple-gray-300 dark:bg-apple-gray-800 dark:text-white dark:hover:bg-apple-gray-700 dark:active:bg-apple-gray-600",
    outline: "border border-apple-gray-300 text-apple-gray-700 hover:bg-apple-gray-50 active:bg-apple-gray-100 dark:border-apple-gray-600 dark:text-apple-gray-200 dark:hover:bg-apple-gray-800 dark:active:bg-apple-gray-700",
    ghost: "text-apple-gray-700 hover:bg-apple-gray-100 active:bg-apple-gray-200 dark:text-apple-gray-300 dark:hover:bg-apple-gray-800 dark:active:bg-apple-gray-700"
  };
  
  const sizeStyles = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg"
  };
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
} 