import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocClient } from '../services/awsClient';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { motion, AnimatePresence } from 'framer-motion';

// Improved time formatting function
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Just now: less than 1 minute ago
  if (diffMin < 1) {
    return 'Just now';
  }
  
  // Minutes: 1-59 minutes ago
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  
  // Today: same day, show hours ago or time
  if (date.toDateString() === now.toDateString()) {
    if (diffHours < 6) {
      return `${diffHours}h ago`;
    } else {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }
  
  // Yesterday: show "Yesterday, HH:MM"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // This week (less than 7 days): show day of week, HH:MM
  if (diffDays < 7) {
    return `${date.toLocaleDateString([], { weekday: 'short' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Earlier: show date in MMM DD format
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const docClient = getDocClient();
      const { Items = [] } = await docClient.send(new QueryCommand({
        TableName: 'shmong-notifications',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false, // Get most recent first
        Limit: 10
      }));
      
      setNotifications(Items);
      setUnreadCount(Items.filter(item => !item.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!userId || !notificationId) return;
    
    try {
      const docClient = getDocClient();
      await docClient.send(new UpdateCommand({
        TableName: 'shmong-notifications',
        Key: {
          userId,
          id: notificationId
        },
        UpdateExpression: 'SET isRead = :isRead',
        ExpressionAttributeValues: {
          ':isRead': true
        }
      }));
      
      // Update local state
      setNotifications(prev => 
        prev.map(item => 
          item.id === notificationId 
            ? { ...item, isRead: true } 
            : item
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    
    const unreadNotifications = notifications.filter(item => !item.isRead);
    if (unreadNotifications.length === 0) return;
    
    try {
      const docClient = getDocClient();
      
      // Process in batches if necessary (AWS limits)
      for (const notification of unreadNotifications) {
        await docClient.send(new UpdateCommand({
          TableName: 'shmong-notifications',
          Key: {
            userId,
            id: notification.id
          },
          UpdateExpression: 'SET isRead = :isRead',
          ExpressionAttributeValues: {
            ':isRead': true
          }
        }));
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(item => ({ ...item, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'FACE_MATCH') {
      navigate(`/my-photos?photo=${notification.photoId}`);
    } else if (notification.type === 'NEW_PHOTO') {
      navigate(`/my-photos`);
    }
    
    setIsOpen(false);
  };
  
  // Setup polling and handle outside clicks
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Poll for notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      
      return () => clearInterval(interval);
    }
  }, [userId]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { 
        duration: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell icon with badge */}
      <button
        className="relative p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        tabIndex="0"
      >
        <Bell className="h-6 w-6" />
        
        {/* Notification badge with animation */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute -top-1 -right-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1"
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      
      {/* Notification dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-80 max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200"
            style={{ marginRight: '-10px' }}
          >
            {/* Header */}
            <div className="py-3 px-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
            
            {/* Notification list */}
            <div className="overflow-y-auto max-h-[60vh]">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 px-4 text-center text-gray-500">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.li
                      key={notification.id}
                      variants={itemVariants}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 text-center transition-colors"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell; 