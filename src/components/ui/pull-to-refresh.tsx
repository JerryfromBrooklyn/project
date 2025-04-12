import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useAnimation } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<any>;
  children: ReactNode;
  pullDownThreshold?: number;
  maxPullDownDistance?: number;
  refreshingContent?: ReactNode;
  pullingContent?: ReactNode;
  className?: string;
  pulledClassName?: string;
  transitionDuration?: number;
  backgroundColor?: string;
  loadingIndicatorColor?: string;
  enableHapticFeedback?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
  refreshingContent,
  pullingContent,
  className = '',
  pulledClassName = '',
  transitionDuration = 300,
  backgroundColor = 'transparent',
  loadingIndicatorColor = '#0A84FF',
  enableHapticFeedback = true,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pulled, setPulled] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const scrollY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Transform scrollY to rotation for spinner
  const rotate = useTransform(scrollY, [0, pullDownThreshold], [0, 180]);
  const opacity = useTransform(scrollY, [0, pullDownThreshold * 0.4, pullDownThreshold], [0, 0.5, 1]);
  const scale = useTransform(scrollY, [0, pullDownThreshold * 0.4, pullDownThreshold], [0.8, 0.9, 1]);
  
  // Add spring physics for smoother, more iOS-like animations
  const springScrollY = useSpring(scrollY, { 
    stiffness: 300, 
    damping: 30, 
    mass: 0.5 
  });

  // Function to trigger haptic feedback if available
  const triggerHapticFeedback = () => {
    if (!enableHapticFeedback) return;
    
    if (navigator && navigator.vibrate) {
      navigator.vibrate(10); // Short vibration
    }
    
    // iOS specific haptic feedback through webkitAudioContext if available
    const context = window.AudioContext || (window as any).webkitAudioContext;
    if (context) {
      try {
        const audioCtx = new context();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 180;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.015);
      } catch (e) {
        console.log('Haptic feedback error:', e);
      }
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (refreshing) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      setPulled(true);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (refreshing || !pulled) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow pulling down
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
      // Apply resistance to make pull feel more natural (decreases with distance)
      const resistance = 1 - Math.min(diff / (maxPullDownDistance * 3), 0.5);
      const newScrollY = Math.min(diff * resistance, maxPullDownDistance);
      
      // Update motion value
      scrollY.set(newScrollY);
      setPullDistance(newScrollY);
      
      // Prevent default to avoid scrolling the page
      e.preventDefault();
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    if (refreshing || !pulled) return;
    
    if (pullDistance >= pullDownThreshold) {
      // Trigger refresh
      setRefreshing(true);
      triggerHapticFeedback();
      
      // Animate to threshold position
      await controls.start({
        translateY: pullDownThreshold,
        transition: { type: 'spring', stiffness: 400, damping: 30 }
      });
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        // Reset after refreshing
        setRefreshing(false);
        
        // Animate back to initial position
        await controls.start({
          translateY: 0,
          transition: { 
            type: 'spring', 
            stiffness: 400, 
            damping: 40, 
            mass: 0.8 
          }
        });
        
        scrollY.set(0);
        setPullDistance(0);
        setPulled(false);
      }
    } else {
      // Animate back to initial position if not pulled enough
      await controls.start({
        translateY: 0,
        transition: { type: 'spring', stiffness: 500, damping: 30 }
      });
      
      scrollY.set(0);
      setPullDistance(0);
      setPulled(false);
    }
  };

  // Update translateY based on scrollY
  useEffect(() => {
    if (!refreshing && pulled) {
      controls.start({
        translateY: pullDistance,
        transition: { type: 'tween', duration: 0 }
      });
    }
  }, [controls, pullDistance, refreshing, pulled]);

  // Determine which content to show in the pull area
  const renderPullContent = () => {
    if (refreshing) {
      return refreshingContent || (
        <div className="ios-pull-indicator">
          <div className="ios-spinner">
            <svg 
              className="animate-spin" 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={loadingIndicatorColor} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>
      );
    }
    
    return pullingContent || (
      <motion.div 
        className="ios-pull-indicator"
        style={{ 
          opacity, 
          scale 
        }}
      >
        <motion.div 
          className="ios-pull-spinner"
          style={{ 
            rotate,
            borderColor: `${loadingIndicatorColor} transparent transparent transparent`
          }}
        />
      </motion.div>
    );
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      <motion.div 
        className={`absolute inset-x-0 -top-16 h-16 flex items-center justify-center pointer-events-none ${pulled ? pulledClassName : ''}`}
        animate={controls}
      >
        {renderPullContent()}
      </motion.div>
      
      <motion.div 
        className="min-h-full"
        animate={controls}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh; 