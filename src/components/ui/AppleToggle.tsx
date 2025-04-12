import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface AppleToggleProps {
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ios' | 'macos';
  label?: string;
  labelPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

export function AppleToggle({
  defaultChecked,
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  label,
  labelPosition = 'right',
  className,
  id,
  ...props
}: AppleToggleProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
  const isChecked = checked !== undefined ? checked : internalChecked;
  const toggleId = id || React.useId();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (checked === undefined) {
      setInternalChecked(e.target.checked);
    }
    onCheckedChange?.(e.target.checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        const newChecked = !isChecked;
        if (checked === undefined) {
          setInternalChecked(newChecked);
        }
        onCheckedChange?.(newChecked);
      }
    }
  };
  
  // Base styles for the track (background)
  const baseTrackStyles = 'relative transition-colors duration-200 ease-in-out rounded-apple-full';
  
  // Size variants for track
  const trackSizeStyles = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6',
  };
  
  // Base styles for the thumb (circle)
  const baseThumbStyles = 'absolute transform transition-transform duration-200 ease-in-out rounded-apple-full bg-white shadow-apple-sm';
  
  // Size variants for thumb
  const thumbSizeStyles = {
    sm: 'w-3 h-3 top-0.5 left-0.5',
    md: 'w-4 h-4 top-0.5 left-0.5',
    lg: 'w-5 h-5 top-0.5 left-0.5',
  };
  
  // Visual variants
  const variantStyles = {
    default: {
      track: {
        off: 'bg-apple-gray-200 dark:bg-apple-gray-700',
        on: 'bg-apple-blue-500',
      },
      thumb: {
        transform: {
          sm: 'translate-x-4',
          md: 'translate-x-5',
          lg: 'translate-x-6',
        },
      },
    },
    ios: {
      track: {
        off: 'bg-apple-gray-200 dark:bg-apple-gray-700',
        on: 'bg-apple-green-500',
      },
      thumb: {
        transform: {
          sm: 'translate-x-4',
          md: 'translate-x-5',
          lg: 'translate-x-6',
        },
      },
    },
    macos: {
      track: {
        off: 'bg-apple-gray-300 dark:bg-apple-gray-600',
        on: 'bg-apple-blue-500',
      },
      thumb: {
        transform: {
          sm: 'translate-x-4',
          md: 'translate-x-5',
          lg: 'translate-x-6',
        },
      },
    },
  };
  
  const trackStyles = isChecked 
    ? variantStyles[variant].track.on 
    : variantStyles[variant].track.off;
  
  const thumbTransform = isChecked 
    ? variantStyles[variant].thumb.transform[size] 
    : '';
  
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  const labelStyles = 'text-apple-gray-900 dark:text-apple-gray-100 select-none text-sm font-medium';
  
  return (
    <div className={cn('flex items-center', className)}>
      {label && labelPosition === 'left' && (
        <label 
          htmlFor={toggleId} 
          className={cn(labelStyles, 'mr-2', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}
        >
          {label}
        </label>
      )}
      
      <label 
        className={cn('inline-block', disabledStyles)}
        tabIndex={disabled ? undefined : 0}
        onKeyDown={handleKeyDown}
        aria-label={label || 'Toggle'}
        role="switch"
        aria-checked={isChecked ? 'true' : 'false'}
      >
        <input
          type="checkbox"
          id={toggleId}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        
        <div className={cn(
          baseTrackStyles,
          trackSizeStyles[size],
          trackStyles,
          disabledStyles
        )}>
          <div className={cn(
            baseThumbStyles,
            thumbSizeStyles[size],
            thumbTransform
          )} />
        </div>
      </label>
      
      {label && labelPosition === 'right' && (
        <label 
          htmlFor={toggleId} 
          className={cn(labelStyles, 'ml-2', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}
        >
          {label}
        </label>
      )}
    </div>
  );
} 