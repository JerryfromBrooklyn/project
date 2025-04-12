// Import polyfills first
import './polyfills.js';

// Import Buffer from the 'buffer' package (ES module way)
// REMOVED: import { Buffer as BufferPolyfill } from 'buffer';

// Polyfill for Node.js global variable in browser
if (typeof window !== 'undefined') {
  window.global = window.global || window;
  window.process = window.process || { env: {} }; // Ensure process exists
  // Buffer should be polyfilled by polyfills.js or plugins
  // REMOVED: window.Buffer = window.Buffer || BufferPolyfill;
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { testRekognitionConnectivity } from './lib/awsClient';
import BackgroundJobService from './services/BackgroundJobService'; // Import background job service

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
if (!awsEnvStatus.region) missingVars.push('VITE_AWS_REGION');
if (!awsEnvStatus.cognitoUserPoolId) missingVars.push('VITE_COGNITO_USER_POOL_ID');
if (!awsEnvStatus.cognitoClientId) missingVars.push('VITE_COGNITO_CLIENT_ID');
if (!awsEnvStatus.accessKeyAvailable) missingVars.push('VITE_AWS_ACCESS_KEY_ID');
if (!awsEnvStatus.secretKeyAvailable) missingVars.push('VITE_AWS_SECRET_ACCESS_KEY');

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
  } else {
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

// Add type definition for the custom property if you intend to use it
declare global {
  interface Window {
    runFaceMatching?: () => Promise<any>; // Add global method to trigger face matching
  }
}

// Add a global method to run the face matching job on demand
window.runFaceMatching = async () => {
  console.log('[GLOBAL] 🔄 Running face matching job on demand...');
  return await BackgroundJobService.runOneTimeFaceMatchingJob();
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)