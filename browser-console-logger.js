/**
 * Browser Console Logger
 * 
 * A utility for structured, collapsible logging to the browser console
 * to keep the console clean and organized.
 */

/**
 * Log a collapsible section in the browser console
 * @param {string} title - Section title
 * @param {Object} data - Data to log in the section
 * @param {string} [type='log'] - Log type (log, info, warn, error)
 */
export const logSection = (title, data, type = 'log') => {
  if (typeof window === 'undefined' || !window.console) return;
  
  // Create styling for the group header
  const styles = {
    log: 'color: #333; font-weight: bold; background: #f5f5f5; padding: 2px 5px; border-radius: 3px;',
    info: 'color: #fff; font-weight: bold; background: #0077cc; padding: 2px 5px; border-radius: 3px;',
    warn: 'color: #fff; font-weight: bold; background: #ff9900; padding: 2px 5px; border-radius: 3px;',
    error: 'color: #fff; font-weight: bold; background: #cc0000; padding: 2px 5px; border-radius: 3px;',
  };
  
  // Use appropriate console method
  const consoleMethod = type === 'error' ? 'error' : 
                        type === 'warn' ? 'warn' : 
                        type === 'info' ? 'info' : 'log';
  
  // Create a collapsible group
  console.groupCollapsed(`%c${title}`, styles[type]);
  
  // If data is an object with multiple properties, log each property in its own section
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 3) {
    // Log a summary first
    console[consoleMethod]('Summary:', {
      type: data.type || 'N/A',
      timestamp: data.timestamp || new Date().toISOString(),
      items: Array.isArray(data.items) ? `${data.items.length} items` : 'N/A'
    });
    
    // Log each property in its own collapsed section
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object') {
        console.groupCollapsed(`${key}:`);
        console[consoleMethod](value);
        console.groupEnd();
      } else {
        console[consoleMethod](`${key}:`, value);
      }
    }
  } else {
    // Log data directly if it's simple
    console[consoleMethod](data);
  }
  
  console.groupEnd();
};

/**
 * Log photo matching results in a structured way
 * @param {Object} matchResults - Photo matching results
 */
export const logPhotoMatchResults = (matchResults) => {
  if (!matchResults) return;
  
  const timestamp = new Date().toISOString();
  const title = `📷 Photo Match Results (${timestamp})`;
  
  // Create a summary 
  const summary = {
    timestamp,
    totalMatches: matchResults.totalMatches || 0,
    newMatches: matchResults.matchesAdded || 0,
    processingTime: matchResults.timing?.total ? `${matchResults.timing.total}ms` : 'N/A',
    success: matchResults.success ? '✅' : '❌'
  };
  
  logSection(title, {
    summary,
    details: matchResults,
    timing: matchResults.timing || {},
    errors: matchResults.errors || []
  }, matchResults.errors?.length > 0 ? 'warn' : 'info');
  
  // Log a simple success message at root level if there are new matches
  if (matchResults.matchesAdded > 0) {
    console.info(`✅ Found ${matchResults.matchesAdded} new photo matches!`);
  }
};

/**
 * Log sign-in match check results
 * @param {Object} checkResults - Sign-in match check results
 */
export const logSigninMatchCheck = (checkResults) => {
  if (!checkResults) return;
  
  const title = `🔍 Photo Match Check`;
  const status = 
    checkResults.matchesUpdated ? 'UPDATING MATCHES' :
    checkResults.noFaceRegistered ? 'NO FACE REGISTERED' :
    checkResults.recentlyUpdated ? 'ALREADY UP TO DATE' :
    'UNKNOWN';
  
  logSection(title, {
    status,
    timing: checkResults.timing || {},
    async: checkResults.async,
    errors: checkResults.errors || []
  }, checkResults.errors?.length > 0 ? 'warn' : 'info');
};

/**
 * Log errors in a structured way
 * @param {string} title - Error title
 * @param {Error|Object} error - Error object
 */
export const logError = (title, error) => {
  const errorObj = error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    name: error.name
  } : error;
  
  logSection(`❌ ${title}`, errorObj, 'error');
};

export default {
  logSection,
  logPhotoMatchResults,
  logSigninMatchCheck,
  logError
}; 