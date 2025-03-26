import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import 'cross-fetch';

// Load environment variables in Node.js environment
if (typeof process !== 'undefined') {
  dotenv.config();
}

// Get environment variables from either Vite or Node.js process
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence
    storageKey: 'shmong_auth', // Custom storage key
    storage: typeof window !== 'undefined' ? window.localStorage : undefined // Use localStorage in browser
  }
});