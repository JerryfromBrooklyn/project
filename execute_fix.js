/**
 * Face Registration System Fix Tool
 * 
 * This script runs SQL commands to fix face registration
 * and historical matching issues.
 */

// Get reference to the Supabase client - using the global instance
const supabase = window.supabase;

// User ID from URL or localStorage
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId') || 
               localStorage.getItem('userId') || 
               (supabase.auth.user()?.id);

// Face ID from URL or localStorage
const faceId = urlParams.get('faceId') || 
               localStorage.getItem('faceId');

async function runFix() {
  console.log('Starting face registration system fix...');
  
  try {
    // Step 1: Check if user exists
    if (!userId) {
      throw new Error('No user ID found. Please login or provide userId in URL.');
    }
    
    console.log('Using user ID:', userId);
    
    // Step 2: Get the most recent face registration if no specific faceId provided
    let targetFaceId = faceId;
    
    if (!targetFaceId) {
      console.log('No face ID provided, searching for most recent registration...');
      
      const { data: faceData, error: faceError } = await supabase
        .from('face_data')
        .select('face_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (faceError) {
        console.error('Error fetching face data:', faceError);
        throw new Error('Could not find face registration for this user.');
      }
      
      targetFaceId = faceData?.face_id;
      
      if (!targetFaceId) {
        throw new Error('No face ID found for this user.');
      }
    }
    
    console.log('Using face ID:', targetFaceId);
    
    // Step 3: Run the fix_face_registration_and_run_matching function
    console.log('Running face registration fix and historical matching...');
    
    const { data: fixResult, error: fixError } = await supabase.rpc(
      'fix_face_registration_and_run_matching',
      {
        p_user_id: userId,
        p_face_id: targetFaceId
      }
    );
    
    if (fixError) {
      console.error('Error running fix:', fixError);
      throw new Error(`Failed to run fix: ${fixError.message}`);
    }
    
    console.log('Fix completed successfully:', fixResult);
    
    // Display results
    showResults({
      success: true,
      userId,
      faceId: targetFaceId,
      matchCount: fixResult.historical_matching.matchCount,
      message: fixResult.message
    });
    
  } catch (error) {
    console.error('Error in fix process:', error);
    
    // Display error
    showResults({
      success: false,
      error: error.message
    });
  }
}

function showResults(results) {
  // Create results element if it doesn't exist
  let resultsEl = document.getElementById('fix-results');
  
  if (!resultsEl) {
    resultsEl = document.createElement('div');
    resultsEl.id = 'fix-results';
    resultsEl.style.padding = '20px';
    resultsEl.style.margin = '20px auto';
    resultsEl.style.maxWidth = '600px';
    resultsEl.style.backgroundColor = '#f8f9fa';
    resultsEl.style.borderRadius = '8px';
    resultsEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    document.body.appendChild(resultsEl);
  }
  
  // Display results
  if (results.success) {
    resultsEl.innerHTML = `
      <h3 style="color: #28a745;">✅ Fix Completed Successfully</h3>
      <p><strong>User ID:</strong> ${results.userId}</p>
      <p><strong>Face ID:</strong> ${results.faceId}</p>
      <p><strong>Historical Matches Found:</strong> ${results.matchCount}</p>
      <p><strong>Message:</strong> ${results.message}</p>
      <p style="margin-top: 20px;">
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </p>
    `;
  } else {
    resultsEl.innerHTML = `
      <h3 style="color: #dc3545;">❌ Fix Failed</h3>
      <p><strong>Error:</strong> ${results.error}</p>
      <p style="margin-top: 20px;">
        <button onclick="runFix()" style="padding: 8px 16px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
          Try Again
        </button>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </p>
    `;
  }
}

// Add a button to the page
function createFixButton() {
  const button = document.createElement('button');
  button.innerText = 'Fix Face Registration System';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.padding = '12px 20px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  button.style.cursor = 'pointer';
  button.style.zIndex = '9999';
  
  button.addEventListener('click', runFix);
  
  document.body.appendChild(button);
}

// Auto-run or create button
if (urlParams.get('autorun') === 'true') {
  // Wait for page to load fully
  window.addEventListener('load', () => {
    setTimeout(runFix, 1000);
  });
} else {
  createFixButton();
}

// Export the function to make it available globally
window.runFaceFix = runFix; 