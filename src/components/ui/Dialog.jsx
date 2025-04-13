import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Dialog component with proper visual separation and mobile touch support
 * Implements backdrop blur, animation, and touch-friendly controls
 */
const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  actions = [],
  maxWidth = 'max-w-md',
  showCloseButton = true
}) => {
  // Close on ESC key press
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Dialog container - centered */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <motion.div
              className={`${maxWidth} w-full relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Touch-friendly dialog content */}
              <div className="p-6">
                {/* Header with touch-friendly close button */}
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <h3 className="text-lg font-medium text-gray-900">
                      {title}
                    </h3>
                  )}
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={onClose}
                      aria-label="Close dialog"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Description */}
                {description && (
                  <p className="text-sm text-gray-500 mb-4">
                    {description}
                  </p>
                )}
                
                {/* Content */}
                <div className="my-4">
                  {children}
                </div>
                
                {/* Actions - touch-friendly buttons */}
                {actions.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3 justify-end">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                          action.variant === 'danger'
                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                            : action.variant === 'secondary'
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
                            : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                        }`}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Export both as default and named export for flexibility
export { Dialog };
export default Dialog; 