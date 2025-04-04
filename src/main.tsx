import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { testRekognitionConnectivity } from './lib/awsClient';

// Verify AWS configuration
testRekognitionConnectivity().then(result => {
  if (result) {
    console.log('[INFO] AWS is properly configured');
  } else {
    console.error('[ERROR] AWS is not configured correctly. AWS services will not work properly.');
    
    // Show a notification to the developer
    if (import.meta.env.DEV) {
      console.error(`
========================================
AWS CONFIGURATION ERROR
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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)