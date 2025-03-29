/* =========================================================
 * CRITICAL SECURITY NOTICE - DO NOT MODIFY UNLESS AUTHORIZED
 * =========================================================
 * 
 * ROW LEVEL SECURITY (RLS) CONFIGURATION:
 * 
 * - RLS has been DELIBERATELY DISABLED on database tables
 * - DO NOT ENABLE RLS POLICIES until project completion
 * - Enabling RLS prematurely will BREAK admin functionality
 *   and face matching features
 * 
 * When the project is complete, a comprehensive security review
 * will establish appropriate RLS policies that maintain functionality
 * while ensuring data protection.
 * 
 * Any changes to this configuration require security team approval.
 * =========================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import 'cross-fetch';
// Load environment variables in Node.js environment
if (typeof process !== 'undefined') {
    dotenv.config();
}
// Get environment variables from either Vite or Node.js process
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gmupwzjxirpkskolsuix.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdXB3empwaXJwa3Nrb2xzdWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQyMjE0NDgsImV4cCI6MjAyOTc5NzQ0OH0.q0G1M55xuYJl9jUz8KxcyD6Kx5FJ8c3LpZ5f9QCIx8k';

/**
 * Initialize the Supabase client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
