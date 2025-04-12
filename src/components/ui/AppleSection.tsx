import React from 'react';
import { cn } from '../../utils/cn';

interface AppleSectionProps {
  className?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'none';
  centered?: boolean;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AppleSection({
  className,
  children,
  maxWidth = 'lg',
  centered = true,
  spacing = 'lg',
  ...props
}: AppleSectionProps & React.HTMLAttributes<HTMLDivElement>) {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
    none: ''
  };

  const spacingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-20',
    xl: 'py-28'
  };

  return (
    <section
      className={cn(
        'w-full',
        spacing && spacingClasses[spacing],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          maxWidth !== 'none' && maxWidthClasses[maxWidth],
          centered && 'mx-auto px-4 sm:px-6 lg:px-8',
          'w-full'
        )}
      >
        {children}
      </div>
    </section>
  );
}

const AppleSectionContainer = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('container mx-auto px-4', className)}
    {...props}
  />
));

AppleSectionContainer.displayName = 'AppleSectionContainer';

const AppleSectionTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-3xl md:text-4xl font-medium leading-tight tracking-tight text-center mb-6', className)}
    {...props}
  />
));

AppleSectionTitle.displayName = 'AppleSectionTitle';

const AppleSectionSubtitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-lg text-apple-gray-600 dark:text-apple-gray-300 text-center max-w-3xl mx-auto mb-12', className)}
    {...props}
  />
));

AppleSectionSubtitle.displayName = 'AppleSectionSubtitle';

export {
  AppleSectionContainer,
  AppleSectionTitle,
  AppleSectionSubtitle,
}; 