import React, { useState, useEffect } from 'react';
import { logPhotoMatchResults } from './browser-console-logger';

/**
 * A component that shows photo match statistics in the UI
 * Displays new matches, total matches, and processing status
 */
const PhotoMatchStats = ({ userId, className = '' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // Listen for both events - login:success from previous implementation and photo:match:update from new one
  useEffect(() => {
    const handlePhotoMatchUpdate = (event) => {
      console.log('📷 [PhotoMatchStats] Received photo match update event:', event.detail);
      
      if (event.detail?.results?.matchesUpdated || event.detail?.matchCheckResults?.matchesUpdated) {
        const results = event.detail.results || event.detail.matchCheckResults;
        setLoading(true);
        setVisible(true);
        
        // Display results immediately from the lambda response
        setStats({
          matchesAdded: 0, // Will be updated when we query for actual count
          totalMatches: results.totalMatches || 0,
          processing: true,
          timestamp: new Date().toISOString()
        });
        
        // Schedule a check for new matches in 10 seconds
        setTimeout(() => {
          checkForNewMatches();
        }, 10000);
      }
    };
    
    // Listen for both event names to ensure backward compatibility
    window.addEventListener('login:success', handlePhotoMatchUpdate);
    window.addEventListener('photo:match:update', handlePhotoMatchUpdate);
    
    // Cleanup listeners
    return () => {
      window.removeEventListener('login:success', handlePhotoMatchUpdate);
      window.removeEventListener('photo:match:update', handlePhotoMatchUpdate);
    };
  }, [userId]);

  // Add handler for the update complete event
  useEffect(() => {
    // This function will be called when the update is complete
    const handleUpdateComplete = (event) => {
      console.log('📷 [PhotoMatchStats] Received update complete event:', event.detail);
      
      if (event.detail?.results) {
        const results = event.detail.results;
        
        // Update the stats with actual match counts
        setStats({
          matchesAdded: results.matchesAdded || 0,
          totalMatches: results.totalMatches || 0,
          timestamp: new Date().toISOString()
        });
        
        setLoading(false);
        setVisible(true);
      }
    };
    
    // Listen for the update complete event
    window.addEventListener('photo:match:update:complete', handleUpdateComplete);
    
    // Cleanup
    return () => {
      window.removeEventListener('photo:match:update:complete', handleUpdateComplete);
    };
  }, []);

  // Function to check for new matches - USING REAL API ONLY
  const checkForNewMatches = async () => {
    try {
      console.log('📷 [PhotoMatchStats] Checking for real user matches');
      
      // Make actual API call to get real match data
      const response = await fetch(`/api/user-photos/${userId}/stats`);
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const matchData = await response.json();
      console.log('📷 [PhotoMatchStats] Received real match data:', matchData);
      
      // Update state with real match data from API
      setStats(matchData);
      setLoading(false);
      
      // Show notification if we have real new matches
      if (matchData.matchesAdded > 0) {
        setVisible(true);
      }
    } catch (error) {
      console.error('📷 [PhotoMatchStats] Error fetching real match data:', error);
      setLoading(false);
    }
  };
  
  // Function to close the stats panel
  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={`photo-match-stats ${stats?.matchesAdded > 0 ? 'photo-match-stats--new-matches' : ''} ${className}`}>
      <div className="photo-match-stats__header">
        <h3>Photo Match Update</h3>
        <button 
          className="photo-match-stats__close" 
          onClick={handleClose}
          aria-label="Close photo match stats"
        >
          ×
        </button>
      </div>
      
      <div className="photo-match-stats__content">
        {loading ? (
          <div className="photo-match-stats__loading">
            <div className="spinner"></div>
            <p>Finding photos with you...</p>
          </div>
        ) : stats ? (
          <>
            <div className="photo-match-stats__item">
              <span className="photo-match-stats__label">New Matches:</span>
              <span className="photo-match-stats__value">{stats.matchesAdded || 0}</span>
            </div>
            <div className="photo-match-stats__item">
              <span className="photo-match-stats__label">Total Matches:</span>
              <span className="photo-match-stats__value">{stats.totalMatches || 0}</span>
            </div>
            {stats.timestamp && (
              <div className="photo-match-stats__timestamp">
                Updated: {new Date(stats.timestamp).toLocaleTimeString()}
              </div>
            )}
          </>
        ) : (
          <p>No match data available</p>
        )}
      </div>
    </div>
  );
};

export default PhotoMatchStats; 