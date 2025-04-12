import React from 'react';
import { cn } from '../../utils/cn';

interface AppleFeatureProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  reversed?: boolean;
  imageWidth?: string;
  className?: string;
}

export function AppleFeature({
  title,
  description,
  icon,
  image,
  reversed = false,
  imageWidth = 'w-full',
  className,
}: AppleFeatureProps) {
  return (
    <div className={cn(
      'flex flex-col md:flex-row items-center gap-8 md:gap-12',
      reversed && 'md:flex-row-reverse',
      className
    )}>
      <div className="flex-1 max-w-xl">
        {icon && (
          <div className="mb-6 text-apple-blue">{icon}</div>
        )}
        <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-apple-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-base md:text-lg text-apple-gray-600 dark:text-apple-gray-300">
          {description}
        </p>
      </div>
      {image && (
        <div className={cn('flex-1 relative', imageWidth)}>
          <img 
            src={image} 
            alt={title} 
            className="rounded-apple-2xl shadow-apple-md" 
          />
        </div>
      )}
    </div>
  );
}

interface AppleFeatureGridProps {
  title?: string;
  subtitle?: string;
  features: {
    title: string;
    description: string;
    icon?: React.ReactNode;
    image?: string;
  }[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AppleFeatureGrid({
  title,
  subtitle,
  features,
  columns = 3,
  className,
}: AppleFeatureGridProps) {
  return (
    <div className={className}>
      {(title || subtitle) && (
        <div className="text-center mb-12 md:mb-16">
          {title && (
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-apple-gray-900 dark:text-white mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg md:text-xl text-apple-gray-600 dark:text-apple-gray-300 max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className={cn(
        'grid gap-8 md:gap-10',
        columns === 2 && 'md:grid-cols-2',
        columns === 3 && 'md:grid-cols-3',
        columns === 4 && 'md:grid-cols-2 lg:grid-cols-4'
      )}>
        {features.map((feature, i) => (
          <div key={i} className="flex flex-col">
            {feature.image && (
              <div className="mb-6 overflow-hidden rounded-apple-xl">
                <img 
                  src={feature.image} 
                  alt={feature.title} 
                  className="w-full h-auto object-cover aspect-[4/3]" 
                />
              </div>
            )}
            {feature.icon && (
              <div className="mb-4 text-apple-blue">{feature.icon}</div>
            )}
            <h3 className="text-xl font-medium tracking-tight text-apple-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-base text-apple-gray-600 dark:text-apple-gray-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 