import React from 'react';
import { cn } from '../../utils/cn';

interface AppleGradientProps {
  variant?: 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'gray';
  intensity?: 'light' | 'medium' | 'strong';
  className?: string;
  children?: React.ReactNode;
}

export function AppleGradient({
  variant = 'blue',
  intensity = 'medium',
  className,
  children,
  ...props
}: AppleGradientProps & React.HTMLAttributes<HTMLDivElement>) {
  const gradientMap = {
    blue: {
      light: 'bg-gradient-to-br from-blue-400/20 via-blue-500/10 to-purple-500/20',
      medium: 'bg-gradient-to-br from-blue-400/40 via-blue-500/30 to-purple-500/40',
      strong: 'bg-gradient-to-br from-blue-400/60 via-blue-500/50 to-purple-500/60',
    },
    purple: {
      light: 'bg-gradient-to-br from-purple-400/20 via-purple-500/10 to-pink-500/20',
      medium: 'bg-gradient-to-br from-purple-400/40 via-purple-500/30 to-pink-500/40',
      strong: 'bg-gradient-to-br from-purple-400/60 via-purple-500/50 to-pink-500/60',
    },
    pink: {
      light: 'bg-gradient-to-br from-pink-400/20 via-pink-500/10 to-red-500/20',
      medium: 'bg-gradient-to-br from-pink-400/40 via-pink-500/30 to-red-500/40',
      strong: 'bg-gradient-to-br from-pink-400/60 via-pink-500/50 to-red-500/60',
    },
    orange: {
      light: 'bg-gradient-to-br from-orange-400/20 via-orange-500/10 to-red-500/20',
      medium: 'bg-gradient-to-br from-orange-400/40 via-orange-500/30 to-red-500/40',
      strong: 'bg-gradient-to-br from-orange-400/60 via-orange-500/50 to-red-500/60',
    },
    green: {
      light: 'bg-gradient-to-br from-green-400/20 via-green-500/10 to-teal-500/20',
      medium: 'bg-gradient-to-br from-green-400/40 via-green-500/30 to-teal-500/40',
      strong: 'bg-gradient-to-br from-green-400/60 via-green-500/50 to-teal-500/60',
    },
    gray: {
      light: 'bg-gradient-to-br from-gray-400/20 via-gray-500/10 to-gray-600/20',
      medium: 'bg-gradient-to-br from-gray-400/40 via-gray-500/30 to-gray-600/40',
      strong: 'bg-gradient-to-br from-gray-400/60 via-gray-500/50 to-gray-600/60',
    },
  };

  return (
    <div
      className={cn(
        'absolute inset-0 -z-10',
        gradientMap[variant][intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 