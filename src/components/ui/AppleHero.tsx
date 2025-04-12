import React from 'react';
import { cn } from '../../utils/cn';
import { AppleButton } from './AppleButton';

interface AppleHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  className?: string;
  centered?: boolean;
  backgroundClassName?: string;
  children?: React.ReactNode;
}

export function AppleHero({
  title,
  subtitle,
  description,
  imageUrl,
  videoUrl,
  primaryCta,
  secondaryCta,
  className,
  centered = true,
  backgroundClassName,
  children,
}: AppleHeroProps) {
  return (
    <div 
      className={cn(
        'relative w-full overflow-hidden py-16 md:py-24',
        backgroundClassName
      )}
    >
      <div 
        className={cn(
          'container mx-auto px-6 relative z-10',
          centered && 'text-center flex flex-col items-center',
          className
        )}
      >
        {subtitle && (
          <p className="text-apple-gray-500 dark:text-apple-gray-400 text-sm md:text-base font-medium mb-2">
            {subtitle}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-apple-gray-900 dark:text-white tracking-tight max-w-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-lg md:text-xl text-apple-gray-600 dark:text-apple-gray-300 max-w-3xl">
            {description}
          </p>
        )}
        
        {(primaryCta || secondaryCta) && (
          <div className={cn('mt-8 flex gap-4', centered ? 'justify-center' : 'justify-start')}>
            {primaryCta && (
              <AppleButton variant="primary" size="lg" onClick={() => window.location.href = primaryCta.href}>
                {primaryCta.text}
              </AppleButton>
            )}
            {secondaryCta && (
              <AppleButton variant="secondary" size="lg" onClick={() => window.location.href = secondaryCta.href}>
                {secondaryCta.text}
              </AppleButton>
            )}
          </div>
        )}
        
        {children}
        
        {videoUrl ? (
          <div className="mt-12 w-full max-w-6xl mx-auto rounded-apple-lg overflow-hidden shadow-apple-xl">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="w-full"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        ) : imageUrl ? (
          <div className="mt-12 w-full max-w-6xl mx-auto rounded-apple-lg overflow-hidden shadow-apple-xl">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-auto"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
} 