import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import 'cross-fetch';
// Load environment variables in Node.js environment
if (typeof process !== 'undefined') {
    dotenv.config();
}
// Function to safely get environment variables
const getEnvVar = (key) => {
    // Check for Vite environment variables (browser)
    if (typeof import.meta === 'object' && import.meta !== null) {
        // @ts-ignore - Vite-specific environment usage
        if (import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    }
    // Fallback to Node.js process environment
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return '';
};
// Get environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
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
