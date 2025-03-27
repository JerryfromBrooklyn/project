import { createClient } from '@supabase/supabase-js';

// Use the values from the .env file
const SUPABASE_URL = 'https://gmupwzjxirpkskolsuix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdXB3emp4aXJwa3Nrb2xzdWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDU5OTAsImV4cCI6MjA1NjgyMTk5MH0.TRH6LIgIYD4QWaqQxUXxm6HMURqyUGQlhbvLnkgxvik';
const EMAIL = 'jerry@jerry.com';
const PASSWORD = '!Jerrydec051488';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function makeJerryAdmin() {
  try {
    // Step 1: Sign in as Jerry
    console.log(`Signing in as ${EMAIL}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    });

    if (signInError) {
      throw new Error(`Sign in failed: ${signInError.message}`);
    }

    if (!signInData || !signInData.user) {
      throw new Error('Failed to get user data after sign in');
    }

    console.log(`Signed in successfully. User ID: ${signInData.user.id}`);

    // Step 2: Update Jerry's profile to have admin role
    console.log('Updating profiles table...');
    
    // Try profiles table first
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: signInData.user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      });

    if (!updateError) {
      console.log('Successfully set Jerry as admin in profiles table!');
      return;
    }

    console.log(`Failed on profiles table: ${updateError.message}`);
    console.log('Trying user_profiles table instead...');

    // If that fails, try user_profiles
    const { error: userProfilesError } = await supabase
      .from('user_profiles')
      .upsert({
        id: signInData.user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      });

    if (userProfilesError) {
      throw new Error(`Failed on user_profiles table: ${userProfilesError.message}`);
    }

    console.log('Successfully set Jerry as admin in user_profiles table!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the function
makeJerryAdmin().then(() => {
  console.log('Script execution completed.');
}); 