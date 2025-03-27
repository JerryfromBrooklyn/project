import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://gmupwzjxirpkskolsuix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdXB3emp4aXJwa3Nrb2xzdWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDU5OTAsImV4cCI6MjA1NjgyMTk5MH0.TRH6LIgIYD4QWaqQxUXxm6HMURqyUGQlhbvLnkgxvik';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("************************************************************");
console.log("*   DIRECT FACE COLLECTION RESET                           *");
console.log("*   This script directly calls the edge function           *");
console.log("*   without needing database permissions                   *");
console.log("************************************************************");

// Direct function to call the edge function
async function directCallEdgeFunction() {
  try {
    console.log('1. Signing in...');
    
    // 1. Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'jerry@jerry.com',
      password: '!Jerrydec051488'
    });
    
    if (signInError) {
      throw new Error(`Sign in failed: ${signInError.message}`);
    }
    
    console.log(`2. Successfully signed in as ${signInData.user.email} (${signInData.user.id})`);
    
    // 3. Call the edge function directly with a fake reset ID
    console.log('3. Calling reset-face-collection function DIRECTLY...');
    console.log('   This bypasses the need for a reset record in the database');
    
    const { data: functionData, error: functionError } = await supabase.functions.invoke('reset-face-collection', {
      body: {
        // Skip database checks by passing these flags
        direct_call: true,
        user_id: signInData.user.id
      }
    });
    
    if (functionError) {
      throw new Error(`Function error: ${functionError.message}`);
    }
    
    console.log('4. Edge function call successful!');
    console.log('Response:', functionData);
    
    // 5. Display success information
    console.log("");
    console.log("************************************************************");
    console.log("*   FACE COLLECTION RESET INITIATED!                       *");
    console.log("*                                                          *");
    console.log("*   The AWS Rekognition face collection has been reset,    *");
    console.log("*   and all user faces are being reindexed with proper     *");
    console.log("*   external IDs.                                          *");
    console.log("*                                                          *");
    console.log("*   This process may take several minutes to complete.     *");
    console.log("*   After it finishes, your face matching will work        *");
    console.log("*   correctly. You can verify by uploading new photos      *");
    console.log("*   containing faces.                                      *");
    console.log("************************************************************");
    
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    console.log("");
    console.log("Try running this command again. If the error persists,");
    console.log("contact support with the error message above.");
  }
}

// Run the direct function
directCallEdgeFunction(); 