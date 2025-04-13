/**
 * Application Configuration
 * Contains environment-specific settings and API endpoints
 */

// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'https://api.example.com/v1';

// AWS Configuration
export const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'us-east-1';
export const S3_BUCKET = process.env.REACT_APP_S3_BUCKET || 'photos-storage-bucket';

// Auth Configuration
export const AUTH_CONFIG = {
  domain: process.env.REACT_APP_AUTH_DOMAIN || 'auth.example.com',
  clientId: process.env.REACT_APP_AUTH_CLIENT_ID,
  redirectUri: process.env.REACT_APP_AUTH_REDIRECT_URI || window.location.origin
};

// Feature flags
export const FEATURES = {
  enableFaceRecognition: process.env.REACT_APP_ENABLE_FACE_RECOGNITION !== 'false',
  enableTrashBin: true
};

// Other application constants
export const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB in bytes
export const TRASH_RETENTION_DAYS = 30; 