import React from 'react';
import { cn } from '../../utils/cn';

export interface AppleTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  variant?: 'large-title' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subheadline' | 'footnote' | 'caption1' | 'caption2';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'blue' | 'green' | 'red' | 'yellow';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  className?: string;
}

export function AppleText({
  children,
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  align = 'left',
  truncate = false,
  className,
  ...props
}: AppleTextProps) {
  
  const variantStyles = {
    'large-title': 'text-4xl leading-tight font-apple',
    'title1': 'text-3xl leading-tight font-apple',
    'title2': 'text-2xl leading-tight font-apple',
    'title3': 'text-xl leading-tight font-apple',
    'headline': 'text-lg leading-normal font-apple-text',
    'body': 'text-base leading-normal font-apple-text',
    'callout': 'text-base italic leading-normal font-apple-text',
    'subheadline': 'text-sm leading-normal font-apple-text',
    'footnote': 'text-xs leading-normal font-apple-text',
    'caption1': 'text-xs leading-normal font-apple-text',
    'caption2': 'text-[11px] leading-normal font-apple-text',
  };
  
  const weightStyles = {
    'regular': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
  };
  
  const colorStyles = {
    'primary': 'text-apple-gray-900 dark:text-apple-gray-100',
    'secondary': 'text-apple-gray-500 dark:text-apple-gray-400',
    'tertiary': 'text-apple-gray-400 dark:text-apple-gray-500',
    'blue': 'text-apple-blue-500 dark:text-apple-blue-400',
    'green': 'text-apple-green-500 dark:text-apple-green-400',
    'red': 'text-apple-red-500 dark:text-apple-red-400',
    'yellow': 'text-apple-yellow-500 dark:text-apple-yellow-400',
  };
  
  const alignStyles = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
  };
  
  const truncateStyle = truncate ? 'truncate' : '';
  
  return (
    <p
      className={cn(
        variantStyles[variant],
        weightStyles[weight],
        colorStyles[color],
        alignStyles[align],
        truncateStyle,
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
} 