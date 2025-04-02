import React, { useState, useEffect } from 'react';

const PhotoFixBanner = ({ supabase }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, checking, fixing, success, error
  const [results, setResults] = useState({ fixed: 0, alreadyMatched: 0, failed: 0 });
  const [message, setMessage] = useState('');
  const [expandDetails, setExpandDetails] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Run the photo fix on component mount
    const fixPhotos = async () => {
      if (!supabase) return;
      
      try {
        // Get current user
        setStatus('checking');
        setIsVisible(true);
        addLog('Checking user authentication...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          addLog('Not logged in, skipping photo match fix');
          setMessage('Please log in to check for photo matches');
          setStatus('error');
          return;
        }
        
        const userId = user.id;
        addLog(`User ID: ${userId.substring(0, 8)}...`);
        
        // These are the specific photos from the logs
        const specificPhotoIds = [
          '811d2222-0264-4676-b589-c7535e573e7f',
          'ee3010c6-b991-42e4-8b01-d7994e44035d',
          'b4362c15-e685-4f9e-9353-68f684989952'
        ];
        
        // Check if any photos need fixing
        addLog('Checking for photos that need fixing...');
        let needsFix = false;
        let needsFixCount = 0;
        let photoStatus = {};
        
        for (const photoId of specificPhotoIds) {
          const shortId = photoId.substring(0, 8);
          addLog(`Checking photo ${shortId}...`);
          
          // Check if the photo exists and if user is already matched
          const { data: photo, error: photoError } = await supabase
            .from('photos')
            .select('matched_users')
            .eq('id', photoId)
            .single();
            
          if (photoError) {
            addLog(`Photo ${shortId} not found`);
            photoStatus[photoId] = 'not_found';
            continue;
          }
          
          // Check if user is already matched
          const matchedUsers = Array.isArray(photo.matched_users) ? photo.matched_users : [];
          const userMatched = matchedUsers.some(match => 
            match.userId === userId || match.user_id === userId
          );
          
          if (userMatched) {
            addLog(`User already matched to photo ${shortId}`);
            photoStatus[photoId] = 'already_matched';
            results.alreadyMatched++;
          } else {
            addLog(`Photo ${shortId} needs fixing`);
            photoStatus[photoId] = 'needs_fix';
            needsFix = true;
            needsFixCount++;
          }
        }
        
        if (!needsFix) {
          addLog('No photos need fixing');
          setMessage('All photos are already properly matched!');
          setStatus('success');
          return;
        }
        
        // Some photos need fixing
        setStatus('fixing');
        setMessage(`Fixing ${needsFixCount} photos...`);
        
        // Fix each photo that needs it
        for (const photoId of specificPhotoIds) {
          if (photoStatus[photoId] !== 'needs_fix') continue;
          
          const shortId = photoId.substring(0, 8);
          addLog(`Fixing photo ${shortId}...`);
          
          // Fix the photo using debug_force_update_photo
          const { data: result, error: updateError } = await supabase.rpc(
            'debug_force_update_photo',
            { 
              p_id: photoId,
              user_id: userId
            }
          );
          
          if (updateError) {
            addLog(`Error fixing photo ${shortId}: ${updateError.message}`);
            results.failed++;
          } else {
            addLog(`Successfully fixed photo ${shortId}`);
            results.fixed++;
          }
        }
        
        // Update results
        setResults({...results});
        
        if (results.fixed > 0) {
          setMessage(`Fixed ${results.fixed} photos! Reload to see them in your gallery.`);
          setStatus('success');
        } else if (results.failed > 0) {
          setMessage(`Failed to fix ${results.failed} photos. Please try again later.`);
          setStatus('error');
        } else {
          setMessage('No changes needed. Your photos are already matched correctly.');
          setStatus('success');
        }
      } catch (err) {
        addLog(`Error: ${err.message}`);
        setMessage('Error fixing photos. Please try again later.');
        setStatus('error');
      }
    };
    
    // Start the fix process after a short delay
    const timer = setTimeout(fixPhotos, 1000);
    return () => clearTimeout(timer);
  }, [supabase]);
  
  // Helper to add a log with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };
  
  // Handle reload button click
  const handleReload = () => {
    window.location.reload();
  };
  
  // Don't render anything if not visible
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-4 right-4 max-w-md bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">
          {status === 'checking' && 'Checking Photo Matches...'}
          {status === 'fixing' && 'Fixing Photo Matches...'}
          {status === 'success' && 'Photo Fix Complete'}
          {status === 'error' && 'Photo Fix Error'}
        </h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-gray-700">{message}</p>
        
        {status === 'success' && results.fixed > 0 && (
          <button
            onClick={handleReload}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
          >
            Reload Page
          </button>
        )}
      </div>
      
      {(status === 'success' || status === 'error') && (
        <div className="text-xs text-gray-500 mt-1">
          <div className="flex justify-between">
            <button 
              onClick={() => setExpandDetails(!expandDetails)}
              className="text-blue-500 hover:text-blue-700"
            >
              {expandDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <div>
              Fixed: {results.fixed} | Already Matched: {results.alreadyMatched} | Failed: {results.failed}
            </div>
          </div>
          
          {expandDetails && (
            <div className="mt-2 bg-gray-100 p-2 rounded-sm max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-nowrap font-mono text-xs">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoFixBanner; 