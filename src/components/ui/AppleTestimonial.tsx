import React from 'react';
import { cn } from '../../utils/cn';

interface AppleTestimonialProps {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  className?: string;
}

export function AppleTestimonial({
  quote,
  author,
  role,
  avatar,
  className,
}: AppleTestimonialProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="text-apple-blue mb-6">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M14.4 24H7.2C7.2 16.8 12 10.8 19.2 10.8V16.8C16.8 16.8 14.4 18 14.4 21.6V24ZM32.4 24H25.2C25.2 16.8 30 10.8 37.2 10.8V16.8C34.8 16.8 32.4 18 32.4 21.6V24Z" 
            fill="currentColor"
          />
        </svg>
      </div>
      <blockquote className="text-xl md:text-2xl font-medium text-apple-gray-900 dark:text-white mb-6 max-w-3xl">
        "{quote}"
      </blockquote>
      <div className="flex flex-col items-center">
        {avatar && (
          <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
            <img src={avatar} alt={author} className="w-full h-full object-cover" />
          </div>
        )}
        <cite className="not-italic font-medium text-apple-gray-900 dark:text-white">
          {author}
        </cite>
        {role && (
          <p className="text-apple-gray-600 dark:text-apple-gray-300 text-sm mt-1">
            {role}
          </p>
        )}
      </div>
    </div>
  );
}

interface AppleTestimonialGridProps {
  title?: string;
  subtitle?: string;
  testimonials: AppleTestimonialProps[];
  className?: string;
}

export function AppleTestimonialGrid({
  title,
  subtitle,
  testimonials,
  className,
}: AppleTestimonialGridProps) {
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
      <div className="grid gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-apple-gray-900 shadow-apple-md rounded-apple-lg p-8 hover:shadow-apple-lg transition-shadow duration-300"
          >
            <AppleTestimonial {...testimonial} />
          </div>
        ))}
      </div>
    </div>
  );
} 