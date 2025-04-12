import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface AppleTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const AppleTextField = forwardRef<HTMLInputElement, AppleTextFieldProps>(
  ({ className, label, error, hint, fullWidth = false, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className={cn('flex flex-col', fullWidth ? 'w-full' : 'max-w-xs')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="mb-1.5 text-sm font-medium text-apple-gray-800"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'block rounded-apple-lg px-3 py-2 text-sm',
            'border border-apple-gray-300 placeholder-apple-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue',
            'transition-all duration-200',
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-red-500"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p 
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs text-apple-gray-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

AppleTextField.displayName = 'AppleTextField';

export { AppleTextField };

export interface AppleTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const AppleTextArea = forwardRef<HTMLTextAreaElement, AppleTextAreaProps>(
  ({ className, label, error, hint, fullWidth = false, id, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className={cn('flex flex-col', fullWidth ? 'w-full' : 'max-w-xs')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="mb-1.5 text-sm font-medium text-apple-gray-800"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={cn(
            'block rounded-apple-lg px-3 py-2 text-sm',
            'border border-apple-gray-300 placeholder-apple-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue',
            'transition-all duration-200',
            'resize-y',
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-red-500"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p 
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs text-apple-gray-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

AppleTextArea.displayName = 'AppleTextArea'; 