// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development, supporting both React and Vite apps
const getEnvVar = (reactKey, viteKey, fallback) => {
  // Try React naming convention first
  if (typeof process !== 'undefined' && process.env && process.env[reactKey]) {
    return process.env[reactKey];
  }
  // Then try Vite naming convention
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  // Then look for Vite with process.env (some builds)
  if (typeof process !== 'undefined' && process.env && process.env[viteKey]) {
    return process.env[viteKey];
  }
  // Fallback value
  return fallback;
};

// Get URL and keys
const supabaseUrl = getEnvVar(
  'REACT_APP_SUPABASE_URL', 
  'VITE_SUPABASE_URL', 
  'https://gmupwzjxirpkskolsuix.supabase.co'
);

// For the anon key (public)
const supabaseAnonKey = getEnvVar(
  'REACT_APP_SUPABASE_ANON_KEY', 
  'VITE_SUPABASE_ANON_KEY', 
  null
);

if (!supabaseAnonKey) {
  console.warn('Supabase anon key is not set. Using fallback key for development only.');
}

// For the service role key (privileged - admin only)
const supabaseServiceKey = getEnvVar(
  'REACT_APP_SUPABASE_SERVICE_KEY', 
  'VITE_SUPABASE_SERVICE_KEY',
  null
);

if (!supabaseServiceKey) {
  console.warn('Supabase service key is not set. Admin operations will fail.');
}

// Initialize with logging to make debugging easier
console.log(`[Supabase] Initializing with URL: ${supabaseUrl}`);
console.log(`[Supabase] Anon key available: ${!!supabaseAnonKey}`);
console.log(`[Supabase] Service key available: ${!!supabaseServiceKey}`);

// Regular client for normal operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'ANON_KEY_MISSING');

// Admin client with service role key for operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'SERVICE_KEY_MISSING', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Add cache for database schema and frequently used data
const schemaCache = {
  tables: null,
  functions: null,
  lastChecked: 0,
  cacheDuration: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Helper method to check if schema cache is valid
export const isSchemaValid = () => {
  return schemaCache.tables && schemaCache.functions && 
    (Date.now() - schemaCache.lastChecked < schemaCache.cacheDuration);
};

// Method to update schema cache
export const updateSchemaCache = (tables, functions) => {
  schemaCache.tables = tables;
  schemaCache.functions = functions;
  schemaCache.lastChecked = Date.now();
};

// Method to get cached schema
export const getCachedSchema = () => {
  return {
    tables: schemaCache.tables,
    functions: schemaCache.functions,
  };
};

// Face ID cache to prevent redundant lookups
const faceIdCache = new Map();

export const getFaceIdFromCache = (userId) => {
  return faceIdCache.get(userId);
};

export const cacheFaceId = (userId, faceId) => {
  faceIdCache.set(userId, faceId);
}; 