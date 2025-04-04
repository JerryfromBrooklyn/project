import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AwsMonitoringService } from '../services/AwsMonitoringService';

const AdminAwsMonitor = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentErrors, setRecentErrors] = useState([]);
  const [dbErrors, setDbErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('memory');
  const [serviceFilter, setServiceFilter] = useState('');
  const [operationFilter, setOperationFilter] = useState('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (data && !error) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
      
      setLoading(false);
    };
    
    checkAdminStatus();
  }, [user]);
  
  useEffect(() => {
    if (!isAdmin) return;
    
    // Load in-memory errors
    const errors = AwsMonitoringService.getRecentErrors(serviceFilter || null, operationFilter || null);
    setRecentErrors(errors);
    
    // Load errors from database
    const fetchDbErrors = async () => {
      try {
        let query = supabase
          .from('system_repair_log')
          .select('*')
          .eq('type', 'aws_api_error')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (serviceFilter) {
          query = query.eq('service', serviceFilter);
        }
        
        if (operationFilter) {
          query = query.eq('operation', operationFilter);
        }
        
        const { data, error } = await query;
        
        if (!error && data) {
          setDbErrors(data);
        }
      } catch (error) {
        console.error('Error fetching errors from database:', error);
      }
    };
    
    fetchDbErrors();
    
    // Set up interval to refresh data
    const interval = setInterval(() => {
      if (activeTab === 'memory') {
        const errors = AwsMonitoringService.getRecentErrors(serviceFilter || null, operationFilter || null);
        setRecentErrors(errors);
      } else {
        fetchDbErrors();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAdmin, activeTab, serviceFilter, operationFilter]);
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleString();
  };
  
  const formatTimeSince = (date) => {
    if (!date) return 'N/A';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  if (loading) {
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  
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
      <h2 className="text-xl font-semibold mb-4">AWS API Monitoring</h2>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`px-3 py-1 rounded ${activeTab === 'memory' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('memory')}
        >
          In-Memory Errors
        </button>
        <button
          className={`px-3 py-1 rounded ${activeTab === 'database' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('database')}
        >
          Database Errors
        </button>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Filter by service"
          className="px-3 py-1 border rounded"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by operation"
          className="px-3 py-1 border rounded"
          value={operationFilter}
          onChange={(e) => setOperationFilter(e.target.value)}
        />
        <button
          className="px-3 py-1 bg-gray-200 rounded"
          onClick={() => {
            setServiceFilter('');
            setOperationFilter('');
          }}
        >
          Clear Filters
        </button>
      </div>
      
      {activeTab === 'memory' ? (
        <>
          <h3 className="text-lg font-medium mb-2">Recent In-Memory Errors ({recentErrors.length})</h3>
          {recentErrors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentErrors.map((error) => (
                    <tr key={error.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatTimeSince(error.timestamp)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{error.service}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{error.operation}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{error.code}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No recent errors in memory.</p>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-2">Database Error Log ({dbErrors.length})</h3>
          {dbErrors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dbErrors.map((error) => (
                    <tr key={error.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(error.created_at)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{error.service}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{error.operation}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{error.error_code}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{error.error_message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No errors found in database.</p>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAwsMonitor; 