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
    } catch (error) {
      console.error('[DASHBOARD] Error loading dashboard:', error);
      setError('Failed to load your photos. Please try again.');
    } finally {
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
    } catch (error) {
      console.error('[DASHBOARD] Error refreshing matches:', error);
      setError('Failed to refresh matches. Please try again.');
    } finally {
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

  return (
    <div className="user-dashboard p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Photos</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {refreshing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </span>
          ) : "Find New Matches"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min. Confidence
            </label>
            <select
              value={filters.minConfidence}
              onChange={(e) => handleFilterChange('minConfidence', Number(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={60}>60% - Low Confidence</option>
              <option value={70}>70% - Medium Confidence</option>
              <option value={80}>80% - High Confidence</option>
              <option value={90}>90% - Very High Confidence</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Size
            </label>
            <select
              value={filters.pageSize}
              onChange={(e) => handleFilterChange('pageSize', Number(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Photos Found</h3>
          <p className="text-gray-500 mb-6">We haven't found any photos with your face yet.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh Matches
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="relative pb-[100%]">
                  <img
                    src={match.photoUrl}
                    alt="Matched photo"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Confidence badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {Math.round(match.confidence)}% match
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Matched {formatDate(match.matchedAt)}
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200 overflow-hidden mr-2">
                      {match.uploadedBy.avatarUrl ? (
                        <img src={match.uploadedBy.avatarUrl} alt={match.uploadedBy.name} />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs">
                      Uploaded by <span className="font-medium">{match.uploadedBy.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded-md mr-2 border border-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-1">
                Page {pagination.page} of {Math.ceil(pagination.totalItems / pagination.pageSize)}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.totalItems / pagination.pageSize)}
                className="px-3 py-1 rounded-md ml-2 border border-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDashboard; 