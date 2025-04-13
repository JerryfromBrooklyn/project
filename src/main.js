import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { testRekognitionConnectivity } from './lib/awsClient';
// Import version and cache busting utilities
import { checkVersion, APP_VERSION } from './utils/version';
import './utils/cacheBuster';

// ULTRA DEBUG MODE - Add a visible timestamp that proves new code is loaded
const now = new Date();
const debugTimestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
console.log(`%c[LOAD] 🔄 APP LOADED/RELOADED AT: ${debugTimestamp}`, 'background: #ff0000; color: white; font-size: 20px; padding: 10px;');

// Create a visible debug element to confirm code loading
const createDebugElement = () => {
  // Remove any existing debug element
  const existingDebug = document.getElementById('debug-timestamp');
  if (existingDebug) {
    existingDebug.remove();
  }
  
  // Create a new debug element
  const debugEl = document.createElement('div');
  debugEl.id = 'debug-timestamp';
  debugEl.style.position = 'fixed';
  debugEl.style.top = '0';
  debugEl.style.right = '0';
  debugEl.style.backgroundColor = 'red';
  debugEl.style.color = 'white';
  debugEl.style.padding = '5px';
  debugEl.style.zIndex = '9999';
  debugEl.style.fontSize = '12px';
  debugEl.textContent = `LOADED: ${debugTimestamp}`;
  
  // Add it to the document after a slight delay to ensure DOM is ready
  setTimeout(() => {
    document.body.appendChild(debugEl);
  }, 500);
};

// Execute our debug element creator
createDebugElement();

// Force clear cache on application startup
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      console.log(`[CACHE] Deleting cache: ${cacheName}`);
      caches.delete(cacheName);
    });
    console.log('[CACHE] All caches cleared');
  });
}

// Set the build timestamp for cache busting
const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP || Date.now().toString();
if (typeof window !== 'undefined') {
    window.__APP_VERSION__ = APP_VERSION;
    window.__BUILD_TIMESTAMP__ = buildTimestamp;
}

// Log version information
console.log(`[STARTUP] 🚀 App Version: ${APP_VERSION} (Build: ${buildTimestamp})`);

// Log environment information (non-sensitive)
const awsEnvStatus = {
    region: import.meta.env.VITE_AWS_REGION ? 'SET' : 'MISSING',
    cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ? 'SET' : 'MISSING',
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ? 'SET' : 'MISSING',
    accessKeyAvailable: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretKeyAvailable: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD
};
console.log('[STARTUP] 🔍 AWS Environment Variables Status:', awsEnvStatus);
// Log any missing critical AWS configurations
const missingVars = [];
if (!awsEnvStatus.region)
    missingVars.push('VITE_AWS_REGION');
if (!awsEnvStatus.cognitoUserPoolId)
    missingVars.push('VITE_COGNITO_USER_POOL_ID');
if (!awsEnvStatus.cognitoClientId)
    missingVars.push('VITE_COGNITO_CLIENT_ID');
if (!awsEnvStatus.accessKeyAvailable)
    missingVars.push('VITE_AWS_ACCESS_KEY_ID');
if (!awsEnvStatus.secretKeyAvailable)
    missingVars.push('VITE_AWS_SECRET_ACCESS_KEY');
if (missingVars.length > 0) {
    console.error(`[STARTUP] ⚠️ MISSING CRITICAL AWS ENVIRONMENT VARIABLES: ${missingVars.join(', ')}`);
    console.error('[STARTUP] Authentication with AWS services will fail without these variables!');
}
// Browser capabilities check
console.log('[STARTUP] Browser online status:', navigator.onLine);
console.log('[STARTUP] Browser user agent:', navigator.userAgent);

// Verify AWS configuration
testRekognitionConnectivity().then(result => {
    if (result) {
        console.log('[INFO] ✅ AWS is properly configured');
    }
    else {
        console.error('[ERROR] ❌ AWS is not configured correctly. AWS services will not work properly.');
        // Show a notification to the developer
        if (import.meta.env.DEV) {
            console.error(`
========================================
⚠️ AWS CONFIGURATION ERROR ⚠️
========================================
Missing or invalid AWS credentials. 
AWS services will not work properly.

Please ensure you have set the following environment variables:
- VITE_AWS_REGION
- VITE_AWS_ACCESS_KEY_ID
- VITE_AWS_SECRET_ACCESS_KEY
- VITE_AWS_COLLECTION_ID
- VITE_COGNITO_USER_POOL_ID
- VITE_COGNITO_CLIENT_ID
- VITE_COGNITO_IDENTITY_POOL_ID

Check your .env file or environment configuration.
========================================
      `);
        }
    }
});

// Check for version changes (important for cache busting)
checkVersion().catch(console.error);

// Add a listener for when the app becomes online again to check for updates
window.addEventListener('online', () => {
    checkVersion().catch(console.error);
});

ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
