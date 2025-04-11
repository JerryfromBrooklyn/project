import React, { useEffect } from 'react';
import { X, Check, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper functions for toast styling
const getBorderColor = (type) => {
  switch (type) {
    case 'success':
      return 'border-green-500/20 dark:border-green-500/30';
    case 'error':
      return 'border-red-500/20 dark:border-red-500/30';
    case 'warning':
      return 'border-amber-500/20 dark:border-amber-500/30';
    case 'info':
    default:
      return 'border-blue-500/20 dark:border-blue-500/30';
  }
};

const getBgColor = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20';
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20';
    case 'info':
    default:
      return 'bg-blue-50 dark:bg-blue-900/20';
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-amber-500';
    case 'info':
    default:
      return 'text-blue-500';
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return <Check className="h-5 w-5" />;
    case 'error':
      return <AlertOctagon className="h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    case 'info':
    default:
      return <Info className="h-5 w-5" />;
  }
};

const ToastNotification = ({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose,
  autoClose = true,
  duration = 5000 
}) => {
  useEffect(() => {
    let timer;
    if (isVisible && autoClose) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [isVisible, autoClose, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
          className="fixed top-4 right-4 z-50 max-w-md w-full sm:max-w-xs"
          role="alert"
          aria-live="assertive"
        >
          <div 
            className={`relative overflow-hidden backdrop-blur-sm border ${getBorderColor(type)} ${getBgColor(type)} rounded-xl shadow-lg shadow-black/5 p-4 flex items-start gap-3`}
          >
            <div className={`flex-shrink-0 ${getIconColor(type)}`}>
              {getIcon(type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
            </div>
            
            <button 
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Progress bar at the bottom */}
            {autoClose && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification; 