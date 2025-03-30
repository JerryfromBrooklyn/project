/* =========================================================
 * DATABASE AND STORAGE SETUP
 * =========================================================
 * 
 * This file initializes required database tables and storage buckets
 * using the service role key from supabaseAdmin.js
 * 
 * =========================================================
 */

import { createBucketIfNotExists, setupRequiredTables } from './supabaseAdmin';

// List of buckets we need
const REQUIRED_BUCKETS = [
  'user-data',
  'photos',
  'face-data'
];

/**
 * Initializes all required database resources
 */
export const initializeResources = async () => {
  console.log('[Setup] Starting database and storage initialization...');
  
  try {
    // Create all required buckets
    for (const bucket of REQUIRED_BUCKETS) {
      await createBucketIfNotExists(bucket);
    }
    
    // Setup required database tables
    await setupRequiredTables();
    
    console.log('[Setup] Database and storage initialization complete');
    return true;
  } catch (error) {
    console.error('[Setup] Error during initialization:', error);
    return false;
  }
};

export default { initializeResources }; 