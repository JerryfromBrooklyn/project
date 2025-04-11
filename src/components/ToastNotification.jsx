import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className={`
            p-4 rounded-lg shadow-lg flex items-start
            ${type === 'success' ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : ''}
            ${type === 'error' ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' : ''}
            ${type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' : ''}
            ${type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' : ''}
          `}>
            <div className="flex-1 mr-2">{message}</div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification; 