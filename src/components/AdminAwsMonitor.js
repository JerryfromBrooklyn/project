import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
            if (!user)
                return;
            try {
                const { data, error } = await supabase
                    .from('admins')
                    .select('id')
                    .eq('id', user.id)
                    .single();
                if (data && !error) {
                    setIsAdmin(true);
                }
                else {
                    setIsAdmin(false);
                }
            }
            catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            }
            setLoading(false);
        };
        checkAdminStatus();
    }, [user]);
    useEffect(() => {
        if (!isAdmin)
            return;
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
            }
            catch (error) {
                console.error('Error fetching errors from database:', error);
            }
        };
        fetchDbErrors();
        // Set up interval to refresh data
        const interval = setInterval(() => {
            if (activeTab === 'memory') {
                const errors = AwsMonitoringService.getRecentErrors(serviceFilter || null, operationFilter || null);
                setRecentErrors(errors);
            }
            else {
                fetchDbErrors();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [isAdmin, activeTab, serviceFilter, operationFilter]);
    const formatDate = (date) => {
        if (!date)
            return 'N/A';
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleString();
    };
    const formatTimeSince = (date) => {
        if (!date)
            return 'N/A';
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60)
            return `${seconds} seconds ago`;
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400)
            return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };
    if (loading) {
        return (_jsx("div", { className: "p-4 bg-white shadow rounded-lg", children: _jsx("p", { className: "text-gray-600", children: "Loading..." }) }));
    }
    if (!isAdmin) {
        return (_jsxs("div", { className: "p-4 bg-white shadow rounded-lg", children: [_jsx("h2", { className: "text-xl font-semibold text-red-600", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 mt-2", children: "You need administrator privileges to access this page." })] }));
    }
    return (_jsxs("div", { className: "p-4 bg-white shadow rounded-lg", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "AWS API Monitoring" }), _jsxs("div", { className: "mb-4 flex flex-wrap gap-2", children: [_jsx("button", { className: `px-3 py-1 rounded ${activeTab === 'memory' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`, onClick: () => setActiveTab('memory'), children: "In-Memory Errors" }), _jsx("button", { className: `px-3 py-1 rounded ${activeTab === 'database' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`, onClick: () => setActiveTab('database'), children: "Database Errors" })] }), _jsxs("div", { className: "mb-4 flex flex-wrap gap-2", children: [_jsx("input", { type: "text", placeholder: "Filter by service", className: "px-3 py-1 border rounded", value: serviceFilter, onChange: (e) => setServiceFilter(e.target.value) }), _jsx("input", { type: "text", placeholder: "Filter by operation", className: "px-3 py-1 border rounded", value: operationFilter, onChange: (e) => setOperationFilter(e.target.value) }), _jsx("button", { className: "px-3 py-1 bg-gray-200 rounded", onClick: () => {
                            setServiceFilter('');
                            setOperationFilter('');
                        }, children: "Clear Filters" })] }), activeTab === 'memory' ? (_jsxs(_Fragment, { children: [_jsxs("h3", { className: "text-lg font-medium mb-2", children: ["Recent In-Memory Errors (", recentErrors.length, ")"] }), recentErrors.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Time" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Service" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Operation" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Error Code" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Message" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: recentErrors.map((error) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-500", children: formatTimeSince(error.timestamp) }), _jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-900", children: error.service }), _jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-900", children: error.operation }), _jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-900", children: error.code }), _jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: error.message })] }, error.id))) })] }) })) : (_jsx("p", { className: "text-gray-600", children: "No recent errors in memory." }))] })) : (_jsxs(_Fragment, { children: [_jsxs("h3", { className: "text-lg font-medium mb-2", children: ["Database Error Log (", dbErrors.length, ")"] }), dbErrors.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Time" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Service" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Operation" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Error Code" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Message" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: dbErrors.map((error) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-500", children: formatDate(error.created_at) }), _jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-900", children: error.service }), _jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-900", children: error.operation }), _jsx("td", { className: "px-4 py-2 whitespace-nowrap text-sm text-gray-900", children: error.error_code }), _jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: error.error_message })] }, error.id))) })] }) })) : (_jsx("p", { className: "text-gray-600", children: "No errors found in database." }))] }))] }));
};
export default AdminAwsMonitor;
