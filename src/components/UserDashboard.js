import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserDashboard, refreshUserMatches } from '../services/face-matching/api';
/**
 * UserDashboard component shows all photos the user appears in
 * including photos uploaded before and after they registered.
 */
export const UserDashboard = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        minConfidence: 80,
        page: 1,
        pageSize: 20
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        totalItems: 0
    });
    const { user } = useAuth();
    // Load dashboard data on component mount
    useEffect(() => {
        if (user) {
            loadDashboard();
        }
    }, [user, filters]);
    // Load dashboard data
    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('[DASHBOARD] Loading dashboard data for user:', user.id);
            console.log('[DASHBOARD] Filters:', filters);
            const result = await getUserDashboard(user.id, filters);
            if (!result.success) {
                throw new Error(result.error || 'Failed to load dashboard data');
            }
            console.log('[DASHBOARD] Loaded', result.matches.length, 'matched photos');
            setMatches(result.matches);
            setPagination(result.pagination || pagination);
        }
        catch (error) {
            console.error('[DASHBOARD] Error loading dashboard:', error);
            setError('Failed to load your photos. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    // Refresh matches to find new ones
    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);
            console.log('[DASHBOARD] Refreshing matches for user:', user.id);
            const result = await refreshUserMatches(user.id);
            if (!result.success) {
                throw new Error(result.error || 'Failed to refresh matches');
            }
            console.log('[DASHBOARD] Found', result.newMatchCount, 'new matched photos');
            // Show success message
            if (result.newMatchCount > 0) {
                // Reload dashboard to show new matches
                await loadDashboard();
            }
        }
        catch (error) {
            console.error('[DASHBOARD] Error refreshing matches:', error);
            setError('Failed to refresh matches. Please try again.');
        }
        finally {
            setRefreshing(false);
        }
    };
    // Handle filter changes
    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value,
            // Reset to first page when filters change
            page: name === 'page' ? value : 1
        });
    };
    // Handle page change
    const handlePageChange = (newPage) => {
        handleFilterChange('page', newPage);
    };
    // Format date string
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (_jsxs("div", { className: "user-dashboard p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Your Photos" }), _jsx("button", { onClick: handleRefresh, disabled: refreshing, className: "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: refreshing ? (_jsxs("span", { className: "flex items-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Refreshing..."] })) : "Find New Matches" })] }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-50 text-red-700 rounded-lg", children: _jsx("p", { children: error }) })), _jsx("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg", children: _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("div", { className: "flex-1 min-w-[200px]", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Min. Confidence" }), _jsxs("select", { value: filters.minConfidence, onChange: (e) => handleFilterChange('minConfidence', Number(e.target.value)), className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: 60, children: "60% - Low Confidence" }), _jsx("option", { value: 70, children: "70% - Medium Confidence" }), _jsx("option", { value: 80, children: "80% - High Confidence" }), _jsx("option", { value: 90, children: "90% - Very High Confidence" })] })] }), _jsxs("div", { className: "flex-1 min-w-[200px]", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Page Size" }), _jsxs("select", { value: filters.pageSize, onChange: (e) => handleFilterChange('pageSize', Number(e.target.value)), className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: 10, children: "10 per page" }), _jsx("option", { value: 20, children: "20 per page" }), _jsx("option", { value: 50, children: "50 per page" }), _jsx("option", { value: 100, children: "100 per page" })] })] })] }) }), loading ? (_jsx("div", { className: "flex justify-center items-center p-12", children: _jsxs("svg", { className: "animate-spin h-8 w-8 text-blue-500", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }) })) : matches.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: "No Photos Found" }), _jsx("p", { className: "text-gray-500 mb-6", children: "We haven't found any photos with your face yet." }), _jsx("button", { onClick: handleRefresh, className: "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Refresh Matches" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: matches.map((match) => (_jsxs("div", { className: "bg-white rounded-lg overflow-hidden shadow-md", children: [_jsxs("div", { className: "relative pb-[100%]", children: [_jsx("img", { src: match.photoUrl, alt: "Matched photo", className: "absolute inset-0 w-full h-full object-cover" }), _jsxs("div", { className: "absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded", children: [Math.round(match.confidence), "% match"] })] }), _jsxs("div", { className: "p-3", children: [_jsxs("div", { className: "text-xs text-gray-500 mb-1", children: ["Matched ", formatDate(match.matchedAt)] }), _jsxs("div", { className: "flex items-center mt-2", children: [_jsx("div", { className: "h-6 w-6 rounded-full bg-gray-200 overflow-hidden mr-2", children: match.uploadedBy.avatarUrl ? (_jsx("img", { src: match.uploadedBy.avatarUrl, alt: match.uploadedBy.name })) : (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) })) }), _jsxs("div", { className: "text-xs", children: ["Uploaded by ", _jsx("span", { className: "font-medium", children: match.uploadedBy.name || 'Unknown' })] })] })] })] }, match.id))) }), _jsx("div", { className: "mt-8 flex justify-center", children: _jsxs("nav", { className: "flex items-center", children: [_jsx("button", { onClick: () => handlePageChange(pagination.page - 1), disabled: pagination.page <= 1, className: "px-3 py-1 rounded-md mr-2 border border-gray-300 disabled:opacity-50", children: "Previous" }), _jsxs("span", { className: "px-4 py-1", children: ["Page ", pagination.page, " of ", Math.ceil(pagination.totalItems / pagination.pageSize)] }), _jsx("button", { onClick: () => handlePageChange(pagination.page + 1), disabled: pagination.page >= Math.ceil(pagination.totalItems / pagination.pageSize), className: "px-3 py-1 rounded-md ml-2 border border-gray-300 disabled:opacity-50", children: "Next" })] }) })] }))] }));
};
export default UserDashboard;
