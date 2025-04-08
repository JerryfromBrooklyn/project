import { createClient } from '@supabase/supabase-js';

// Use environment variables set by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase URL or Anon Key environment variables are not set.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  // You might want to throw an error here or handle it appropriately
  // depending on whether Supabase is critical for all parts of the app.
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!); 
// The '!' asserts that the variables are non-null, handle missing env vars appropriately 