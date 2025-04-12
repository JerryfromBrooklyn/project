import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface AppleCarouselProps {
  className?: string;
  children: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  loop?: boolean;
}

export function AppleCarousel({
  className,
  children,
  autoPlay = false,
  interval = 5000,
  showIndicators = true,
  showArrows = true,
  loop = true,
  ...props
}: AppleCarouselProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoPlay, currentIndex]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      handleNext();
    }, interval);
  };

  const handleNext = () => {
    setDirection('right');
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      return nextIndex >= children.length ? (loop ? 0 : prevIndex) : nextIndex;
    });
  };

  const handlePrev = () => {
    setDirection('left');
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex - 1;
      return nextIndex < 0 ? (loop ? children.length - 1 : prevIndex) : nextIndex;
    });
  };

  const handleIndicatorClick = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
  };

  // Variants for animation
  const variants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 500 : -500,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -500 : 500,
      opacity: 0
    })
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-apple-lg',
        className
      )}
      {...props}
    >
      {/* Main carousel content */}
      <div className="relative h-full w-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 }
            }}
            className="absolute h-full w-full"
          >
            {children[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {showArrows && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-apple-full bg-white/70 p-2 shadow-apple-sm backdrop-blur-sm transition-all hover:bg-white dark:bg-apple-gray-800/70 dark:hover:bg-apple-gray-800"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-apple-full bg-white/70 p-2 shadow-apple-sm backdrop-blur-sm transition-all hover:bg-white dark:bg-apple-gray-800/70 dark:hover:bg-apple-gray-800"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && (
        <div className="absolute bottom-4 left-0 flex w-full justify-center space-x-2">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                currentIndex === index 
                  ? 'bg-apple-blue-500 w-4' 
                  : 'bg-apple-gray-300 dark:bg-apple-gray-700 hover:bg-apple-gray-400 dark:hover:bg-apple-gray-600'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 