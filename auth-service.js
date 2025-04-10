/**
 * Handles user login
 * @param {Object} credentials - User credentials
 * @returns {Object} - Login response with token
 */
async function loginUser(credentials) {
  try {
    // ... existing login code ...
    
    // After successful authentication:
    const userId = user.id;
    
    // Import the browser logger if we're in a browser environment
    let consoleLogger = null;
    if (typeof window !== 'undefined') {
      try {
        consoleLogger = await import('./browser-console-logger.js');
      } catch (e) {
        console.log('Browser console logger not available:', e.message);
      }
    }
    
    // Non-blocking check if face matches need updating
    // Call the user-signin-checker Lambda function asynchronously
    const lambda = new AWS.Lambda();
    const invokeResponse = await lambda.invoke({
      FunctionName: 'user-signin-checker',
      InvocationType: 'RequestResponse', // Change to RequestResponse to get results
      Payload: JSON.stringify({ userId })
    }).promise().catch(err => {
      console.error('Error invoking match checker:', err);
      // Don't fail login if the match checker fails
      if (consoleLogger) {
        consoleLogger.logError('Match Checker Error', err);
      }
      return { 
        Payload: JSON.stringify({ 
          success: false, 
          error: err.message 
        }) 
      };
    });
    
    // Parse the response payload if available
    let matchCheckResults = null;
    if (invokeResponse && invokeResponse.Payload) {
      try {
        matchCheckResults = JSON.parse(invokeResponse.Payload);
        
        // Log match check results to browser console in a structured way
        if (consoleLogger) {
          consoleLogger.logSigninMatchCheck(matchCheckResults);
        }
        
        // Also add a simple message for users when matches are being updated
        if (matchCheckResults.matchesUpdated) {
          console.info(`Finding any new photos with you... Updates will appear next time you refresh.`);
        }
      } catch (e) {
        console.error('Error parsing match checker response:', e);
      }
    }
    
    return {
      user,
      token,
      matchCheckResults, // Include match check results in login response
      // ... other response data ...
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
} 