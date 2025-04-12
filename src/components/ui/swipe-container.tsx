import React, { useState, useRef, ReactNode, useEffect } from 'react';
import { motion, PanInfo, useAnimation, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SwipeContainerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  leftActionColor?: string;
  rightActionColor?: string;
  swipeThreshold?: number;
  dragElastic?: number;
  className?: string;
  disableSwipeGesture?: boolean;
  swipeLeftThreshold?: number;
  swipeRightThreshold?: number;
  swipeIndicatorOpacity?: number;
  actionWidth?: number;
  enableHapticFeedback?: boolean;
}

const SwipeContainer: React.FC<SwipeContainerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  leftActionColor = '#FF3B30',
  rightActionColor = '#34C759',
  swipeThreshold = 0.4,
  dragElastic = 0.8,
  className = '',
  disableSwipeGesture = false,
  swipeLeftThreshold,
  swipeRightThreshold,
  swipeIndicatorOpacity = 0.3,
  actionWidth = 80,
  enableHapticFeedback = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const x = useMotionValue(0);
  
  // Add springy physics for more natural iOS-like feel
  const springX = useSpring(x, { 
    stiffness: 400, 
    damping: 40 
  });
  
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate actual thresholds based on container width
  const leftThreshold = swipeLeftThreshold || containerWidth * swipeThreshold;
  const rightThreshold = swipeRightThreshold || containerWidth * swipeThreshold;
  
  // Calculate opacity for action indicators based on drag position
  const leftActionOpacity = useTransform(
    x, 
    [0, rightThreshold / 2, rightThreshold], 
    [0, swipeIndicatorOpacity, 1]
  );
  
  const rightActionOpacity = useTransform(
    x, 
    [-leftThreshold, -leftThreshold / 2, 0], 
    [1, swipeIndicatorOpacity, 0]
  );
  
  // Function to trigger haptic feedback
  const triggerHapticFeedback = () => {
    if (!enableHapticFeedback) return;
    
    if (navigator && navigator.vibrate) {
      navigator.vibrate(8); // Short vibration
    }
  };
  
  // Get container dimensions on mount
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      
      const updateDimensions = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);
  
  // Handle drag end
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    if (disableSwipeGesture) {
      controls.start({ x: 0 });
      return;
    }
    
    const { offset } = info;
    
    // Handle right swipe (positive x direction)
    if (offset.x > rightThreshold && onSwipeRight) {
      controls.start({ 
        x: containerWidth, 
        transition: { 
          type: 'spring', 
          stiffness: 400, 
          damping: 40 
        } 
      }).then(() => {
        triggerHapticFeedback();
        onSwipeRight();
        controls.start({ x: 0 });
      });
    } 
    // Handle left swipe (negative x direction)
    else if (offset.x < -leftThreshold && onSwipeLeft) {
      controls.start({ 
        x: -containerWidth, 
        transition: { 
          type: 'spring', 
          stiffness: 400, 
          damping: 40 
        } 
      }).then(() => {
        triggerHapticFeedback();
        onSwipeLeft();
        controls.start({ x: 0 });
      });
    } 
    // Return to center if not swiped far enough
    else {
      controls.start({ 
        x: 0, 
        transition: { 
          type: 'spring', 
          stiffness: 500, 
          damping: 50 
        } 
      });
    }
  };
  
  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      ref={containerRef}
    >
      {/* Left action background */}
      {onSwipeLeft && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4"
          style={{ 
            opacity: rightActionOpacity,
            width: actionWidth,
            backgroundColor: leftActionColor
          }}
        >
          {leftAction || (
            <div className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Right action background */}
      {onSwipeRight && (
        <motion.div 
          className="absolute inset-y-0 left-0 flex items-center justify-start px-4"
          style={{ 
            opacity: leftActionOpacity,
            width: actionWidth,
            backgroundColor: rightActionColor
          }}
        >
          {rightAction || (
            <div className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Content */}
      <motion.div
        drag={!disableSwipeGesture ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={dragElastic}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x: springX }}
        className="bg-white dark:bg-apple-gray-800 w-full z-10 cursor-default"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeContainer; 