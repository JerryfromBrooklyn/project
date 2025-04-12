import React from 'react';
import { cn } from '../../utils/cn';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
type HeadingWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
type HeadingAlign = 'left' | 'center' | 'right';

interface AppleHeadingProps {
  className?: string;
  children: React.ReactNode;
  as?: HeadingLevel;
  size?: HeadingSize;
  weight?: HeadingWeight;
  align?: HeadingAlign;
  gradient?: boolean;
  color?: string;
}

export function AppleHeading({
  className,
  children,
  as: Component = 'h2',
  size = 'xl',
  weight = 'semibold',
  align = 'left',
  gradient = false,
  color,
  ...props
}: AppleHeadingProps & React.HTMLAttributes<HTMLHeadingElement>) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl tracking-tight',
    '2xl': 'text-2xl tracking-tight',
    '3xl': 'text-3xl tracking-tight',
    '4xl': 'text-4xl sm:text-5xl tracking-tight'
  };

  const weightClasses = {
    light: 'font-light',
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  const colorClass = color || 'text-apple-gray-900 dark:text-white';
  
  const gradientClass = gradient 
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-apple-blue-500 to-apple-blue-700' 
    : '';

  return (
    <Component
      className={cn(
        'font-apple leading-tight',
        sizeClasses[size],
        weightClasses[weight],
        alignClasses[align],
        gradient ? gradientClass : colorClass,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
} 