import React from 'react';
import { cn } from '../../utils/cn';

interface FeatureItem {
  icon?: React.ReactNode;
  iconUrl?: string;
  title: string;
  description: string;
}

interface AppleFeatureGridProps {
  features: FeatureItem[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AppleFeatureGrid({
  features,
  title,
  subtitle,
  columns = 3,
  className,
}: AppleFeatureGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('py-16 md:py-24', className)}>
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

      <div className={cn('grid gap-8 md:gap-12', gridCols[columns])}>
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-apple-gray-900 shadow-apple-md rounded-apple-lg p-8 transition-all duration-300 hover:shadow-apple-lg"
          >
            {feature.icon && (
              <div className="text-apple-blue mb-6">
                {feature.icon}
              </div>
            )}
            {feature.iconUrl && (
              <div className="mb-6">
                <img 
                  src={feature.iconUrl} 
                  alt={`${feature.title} icon`} 
                  className="w-12 h-12"
                />
              </div>
            )}
            <h3 className="text-xl font-medium text-apple-gray-900 dark:text-white mb-3">
              {feature.title}
            </h3>
            <p className="text-apple-gray-600 dark:text-apple-gray-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 