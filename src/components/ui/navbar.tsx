import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface NavbarProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBack?: () => void;
  backPath?: string;
  rightItems?: React.ReactNode;
  leftItems?: React.ReactNode;
  transparent?: boolean;
  largeTitleEnabled?: boolean;
  showBorder?: boolean;
  children?: React.ReactNode;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  hideTitle?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  titleClassName?: string;
  centerTitle?: boolean;
  largeTitle?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backButtonLabel,
  onBack,
  backPath,
  rightItems,
  leftItems,
  transparent = false,
  largeTitleEnabled = false,
  showBorder = true,
  children,
  className,
  scrollContainerRef,
  hideTitle = false,
  showCloseButton = false,
  onClose,
  titleClassName,
  centerTitle = false,
  largeTitle,
}) => {
  const navigate = useNavigate();
  const [showShadow, setShowShadow] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const defaultScrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = scrollContainerRef || defaultScrollContainerRef;

  // Set up scroll animations for large title effect
  const { scrollY } = useScroll({
    container: scrollRef,
  });
  
  // Transform values based on scroll position
  const headerOpacity = useTransform(scrollY, [0, 40], [transparent ? 0 : 1, 1]);
  const borderOpacity = useTransform(scrollY, [0, 40], [transparent ? 0 : 0.5, 1]);
  const titleOpacity = useTransform(scrollY, [40, 80], [0, 1]);
  const largeTitleOpacity = useTransform(scrollY, [0, 60], [1, 0]);
  const largeTitleScale = useTransform(scrollY, [0, 60], [1, 0.8]);
  const largeTitleY = useTransform(scrollY, [0, 60], [0, -20]);

  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  // Handle close button click
  const handleCloseClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // Track scroll for shadow effect
  useEffect(() => {
    if (!scrollRef.current) return;

    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollPosition = scrollRef.current.scrollTop;
        setShowShadow(scrollPosition > 0);
        setScrolledDown(scrollPosition > 60);
      }
    };

    const currentRef = scrollRef.current;
    currentRef?.addEventListener('scroll', handleScroll);
    return () => currentRef?.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  return (
    <>
      {/* Fixed Header */}
      <motion.header
        className={cn(
          'ios-navbar pt-ios-safe',
          showBorder && 'border-b border-apple-gray-200 dark:border-apple-gray-800',
          showShadow && !transparent && 'shadow-sm',
          className
        )}
        style={{
          opacity: transparent ? headerOpacity : 1,
          borderOpacity,
        }}
      >
        <div className="ios-navbar-content">
          {/* Left side */}
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button 
                onClick={handleBackClick}
                className="ios-back-button flex items-center pl-1"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
                {backButtonLabel && (
                  <span className="text-sm font-medium">{backButtonLabel}</span>
                )}
              </button>
            )}
            {showCloseButton && (
              <button 
                onClick={handleCloseClick}
                className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {leftItems}
          </div>

          {/* Center Title */}
          <AnimatePresence>
            {!hideTitle && (
              <motion.div 
                className={cn(
                  "absolute left-0 right-0 mx-auto text-center pointer-events-none",
                  centerTitle ? "flex justify-center items-center" : "hidden",
                  titleClassName
                )}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: largeTitleEnabled ? titleOpacity : 1,
                  transition: { duration: 0.2 }
                }}
                exit={{ opacity: 0 }}
              >
                <h1 className="ios-navbar-title truncate max-w-[60%] mx-auto">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                    {subtitle}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {rightItems}
          </div>
        </div>

        {/* Custom header content */}
        {children}
      </motion.header>

      {/* Large title (shown when scrolled to top) */}
      {largeTitleEnabled && (
        <div 
          ref={defaultScrollContainerRef}
          className="pt-16 h-full overflow-y-auto"
        >
          <motion.div
            className="px-4 pt-6 pb-2"
            style={{
              opacity: largeTitleOpacity,
              scale: largeTitleScale,
              y: largeTitleY,
            }}
          >
            {largeTitle || (
              <h1 className="ios-large-title text-3xl font-bold">
                {title}
              </h1>
            )}
          </motion.div>
          
          {/* Page content */}
          <div className="px-4">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 