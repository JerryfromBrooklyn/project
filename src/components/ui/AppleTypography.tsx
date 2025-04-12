import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface AppleHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

const AppleHeading = forwardRef<HTMLHeadingElement, AppleHeadingProps>(
  ({ className, as: Component = 'h2', size = 'xl', weight = 'semibold', children, ...props }, ref) => {
    const Comp = Component as any;
    
    return (
      <Comp
        ref={ref}
        className={cn(
          'tracking-tight font-sf-pro',
          {
            'text-sm': size === 'xs',
            'text-base': size === 'sm',
            'text-lg': size === 'md',
            'text-xl': size === 'lg',
            'text-2xl': size === 'xl',
            'text-3xl': size === '2xl',
            'text-4xl': size === '3xl',
            'text-5xl': size === '4xl',
            'font-normal': weight === 'regular',
            'font-medium': weight === 'medium',
            'font-semibold': weight === 'semibold',
            'font-bold': weight === 'bold',
          },
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

AppleHeading.displayName = 'AppleHeading';

export interface AppleTextProps extends HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'primary' | 'white';
  leading?: 'tight' | 'normal' | 'relaxed';
}

const AppleText = forwardRef<HTMLParagraphElement, AppleTextProps>(
  ({ 
    className, 
    as: Component = 'p', 
    size = 'md', 
    weight = 'regular', 
    color = 'default',
    leading = 'normal',
    children, 
    ...props 
  }, ref) => {
    const Comp = Component as any;
    
    return (
      <Comp
        ref={ref}
        className={cn(
          'font-sf-pro',
          {
            'text-xs': size === 'xs',
            'text-sm': size === 'sm',
            'text-base': size === 'md',
            'text-lg': size === 'lg',
            'text-xl': size === 'xl',
            'font-normal': weight === 'regular',
            'font-medium': weight === 'medium',
            'font-semibold': weight === 'semibold',
            'font-bold': weight === 'bold',
            'text-apple-gray-900 dark:text-apple-gray-50': color === 'default',
            'text-apple-gray-600 dark:text-apple-gray-400': color === 'muted',
            'text-apple-blue dark:text-apple-blue-400': color === 'primary',
            'text-white': color === 'white',
            'leading-tight': leading === 'tight',
            'leading-normal': leading === 'normal',
            'leading-relaxed': leading === 'relaxed',
          },
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

AppleText.displayName = 'AppleText';

export interface AppleDisplayProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'div';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'medium' | 'semibold' | 'bold';
}

const AppleDisplay = forwardRef<HTMLHeadingElement, AppleDisplayProps>(
  ({ 
    className, 
    as: Component = 'h1', 
    size = 'lg', 
    weight = 'bold', 
    children, 
    ...props 
  }, ref) => {
    const Comp = Component as any;
    
    return (
      <Comp
        ref={ref}
        className={cn(
          'tracking-tight font-sf-pro',
          {
            'text-4xl sm:text-5xl': size === 'sm',
            'text-5xl sm:text-6xl': size === 'md',
            'text-6xl sm:text-7xl': size === 'lg',
            'text-7xl sm:text-8xl': size === 'xl',
            'font-medium': weight === 'medium',
            'font-semibold': weight === 'semibold',
            'font-bold': weight === 'bold',
          },
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

AppleDisplay.displayName = 'AppleDisplay';

export { AppleHeading, AppleText, AppleDisplay }; 