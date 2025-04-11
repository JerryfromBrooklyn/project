import React, { useState, useEffect } from 'react';
import { getDocClient } from '../services/awsClient';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Bell, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const docClient = getDocClient();
        const { Items = [] } = await docClient.send(new QueryCommand({
          TableName: 'shmong-notifications',
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': user.id
          },
          ScanIndexForward: false // Most recent first
        }));
        
        setNotifications(Items.map(item => ({
          ...item,
          createdAt: new Date(item.created_at).toLocaleString()
        })));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id]);
  
  const markAsRead = async (notificationId) => {
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
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'HISTORICAL_MATCH' || notification.type === 'NEW_MATCH') {
      navigate('/my-photos');
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            Notifications
          </h1>
        </div>
        
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all as read
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any notifications yet. When new matches are found, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.title}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                  {notification.createdAt}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
              {!notification.read && (
                <div className="mt-2 flex justify-end">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    New
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 