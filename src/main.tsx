import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { testRekognitionConnectivity } from './config/aws-config';

// Verify AWS configuration
testRekognitionConnectivity().then(result => {
  if (result) {
    console.log('[INFO] AWS Rekognition is properly configured');
  } else {
    console.error('[ERROR] AWS Rekognition is not configured correctly. Face detection and matching will not work.');
    
    // Show a notification to the developer
    if (import.meta.env.DEV) {
      console.error(`
========================================
AWS CONFIGURATION ERROR
========================================
Missing or invalid AWS credentials. 
Face detection and matching will not work.

Please ensure you have set the following environment variables:
- VITE_AWS_REGION
- VITE_AWS_ACCESS_KEY_ID
- VITE_AWS_SECRET_ACCESS_KEY
- VITE_AWS_COLLECTION_ID

Check your .env file or environment configuration.
========================================
      `);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)