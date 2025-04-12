import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface AppleFeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  gradient?: boolean;
}

const AppleFeatureCard = forwardRef<HTMLDivElement, AppleFeatureCardProps>(
  ({ className, title, description, icon, gradient = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col p-6 rounded-apple-xl overflow-hidden transition-all duration-300',
          gradient
            ? 'bg-gradient-to-br from-white to-apple-gray-100 dark:from-apple-gray-800 dark:to-apple-gray-900 shadow-apple-lg hover:shadow-apple-xl hover:-translate-y-1'
            : 'bg-white dark:bg-apple-gray-800 shadow-apple-md hover:shadow-apple-lg hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-apple-md bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-medium leading-tight tracking-tight mb-2 text-apple-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-apple-gray-600 dark:text-apple-gray-400">
          {description}
        </p>
      </div>
    );
  }
);

AppleFeatureCard.displayName = 'AppleFeatureCard';

export { AppleFeatureCard }; 