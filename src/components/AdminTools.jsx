import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminTools = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user has admin role
    const checkAdmin = async () => {
      try {
        if (user?.email) {
          // This is a simplified placeholder - in a real app,
          // you would check against a database or API
          const adminEmails = ['admin@example.com']; // Replace with your admin emails
          setIsAdmin(adminEmails.includes(user.email.toLowerCase()));
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  if (!isAdmin) {
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You need administrator privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
      
      <div className="space-y-4">
        <div className="p-3 border rounded-md">
          <h3 className="font-medium">User Management</h3>
          <button className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Manage Users
          </button>
        </div>
        
        <div className="p-3 border rounded-md">
          <h3 className="font-medium">System Status</h3>
          <button className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
            View Status
          </button>
        </div>
        
        <div className="p-3 border rounded-md">
          <h3 className="font-medium">Logs</h3>
          <button className="mt-2 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTools; 