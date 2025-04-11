import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocClient } from '../services/awsClient';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      
      try {
        const docClient = getDocClient();
        const { Items = [] } = await docClient.send(new QueryCommand({
          TableName: 'shmong-notifications',
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          ScanIndexForward: false, // Most recent first
          Limit: 5
        }));
        
        const notifs = Items.map(item => ({
          ...item,
          createdAt: new Date(item.created_at).toLocaleString()
        }));
        
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
    
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userId]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!userId) return;
    
    try {
      const docClient = getDocClient();
      await docClient.send(new UpdateCommand({
        TableName: 'shmong-notifications',
        Key: { id: notificationId },
        UpdateExpression: 'SET #read = :read',
        ExpressionAttributeNames: { '#read': 'read' },
        ExpressionAttributeValues: { ':read': true }
      }));
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'HISTORICAL_MATCH' || notification.type === 'NEW_MATCH') {
      navigate('/my-photos');
    }
    
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={async () => {
                    // Mark all as read logic
                    for (const notification of notifications.filter(n => !n.read)) {
                      await markAsRead(notification.id);
                    }
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="py-4 px-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.createdAt}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button 
                className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:underline p-2"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
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