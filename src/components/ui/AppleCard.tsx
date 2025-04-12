import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { cardHover } from '../../utils/motion';

export interface AppleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'elevated' | 'outlined' | 'glass' | 'bordered' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  hoverEffect?: boolean;
  isHoverable?: boolean;
  isInteractive?: boolean;
  className?: string;
  showHoverAnimation?: boolean;
}

export function AppleCard({
  children,
  variant = 'default',
  padding = 'md',
  radius = 'md',
  hoverEffect = false,
  isHoverable = false,
  isInteractive = false,
  showHoverAnimation = true,
  className,
  ...props
}: AppleCardProps) {
  
  const baseStyles = 'rounded-apple overflow-hidden transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white dark:bg-apple-gray-800 shadow-apple',
    interactive: 'bg-white dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 cursor-pointer',
    elevated: 'bg-white dark:bg-apple-gray-800 shadow-apple-lg',
    outlined: 'bg-transparent border border-apple-gray-200 dark:border-apple-gray-700',
    glass: 'bg-white/70 dark:bg-apple-gray-800/70 border border-white/20 dark:border-apple-gray-700/20 backdrop-blur-lg',
    bordered: 'bg-white dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700',
    flat: 'bg-apple-gray-50 dark:bg-apple-gray-900',
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const radiusStyles = {
    none: 'rounded-none',
    sm: 'rounded-apple-sm',
    md: 'rounded-apple',
    lg: 'rounded-apple-lg',
    full: 'rounded-full',
  };
  
  const hoverStyles = isHoverable 
    ? 'hover:shadow-apple-lg hover:translate-y-[-2px]' 
    : '';
  
  const interactiveStyles = isInteractive 
    ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue-500 focus-visible:ring-offset-2' 
    : '';

  const MotionDiv = motion.div;
  
  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: showHoverAnimation ? 1.02 : 1 },
  };
  
  return (
    <MotionDiv
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        radiusStyles[radius],
        variant === 'interactive' ? hoverEffectStyles : '',
        className
      )}
      variants={variant === 'interactive' ? cardVariants : undefined}
      initial="initial"
      whileHover={variant === 'interactive' ? "hover" : undefined}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 17 
      }}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}

interface AppleCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function AppleCardHeader({ 
  children, 
  className,
  ...props 
}: AppleCardHeaderProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 py-5 border-b border-apple-gray-100 dark:border-apple-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AppleCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function AppleCardTitle({ 
  children, 
  className,
  ...props 
}: AppleCardTitleProps & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-medium text-apple-gray-900 dark:text-white tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

interface AppleCardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function AppleCardDescription({ className, children }: AppleCardDescriptionProps) {
  return (
    <p className={cn('text-apple-gray-600 dark:text-apple-gray-300', className)}>
      {children}
    </p>
  );
}

interface AppleCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AppleCardContent({ 
  children, 
  className,
  ...props 
}: AppleCardContentProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AppleCardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function AppleCardFooter({ className, children }: AppleCardFooterProps) {
  return (
    <div className={cn('mt-6 flex items-center', className)}>
      {children}
    </div>
  );
}