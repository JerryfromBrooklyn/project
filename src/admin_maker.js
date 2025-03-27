// Simple script to make Jerry an admin by directly using the REST API
// Run with: node src/admin_maker.js

const SUPABASE_URL = 'https://gmupwzjxirpkskolsuix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdXB3emp4aXJwa3Nrb2xzdWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDU5OTAsImV4cCI6MjA1NjgyMTk5MH0.TRH6LIgIYD4QWaqQxUXxm6HMURqy'; 

// Email and password are from the .env file
const email = 'jerry@jerry.com';
const password = '!Jerrydec051488';

async function makeAdmin() {
  try {
    console.log('Signing in as Jerry...');
    
    // Step 1: Sign in to get access token and user ID
    const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({ email, password })
    });
    
    const signInData = await signInResponse.json();
    
    if (!signInResponse.ok) {
      throw new Error(`Sign in failed: ${JSON.stringify(signInData)}`);
    }
    
    const { access_token, user } = signInData;
    console.log(`Signed in successfully. User ID: ${user.id}`);
    
    // Step 2: Try to update or insert into profiles table
    console.log('Updating profiles table...');
    
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${access_token}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      })
    });
    
    if (profilesResponse.ok) {
      console.log('Successfully updated profiles table!');
      return;
    }
    
    const profilesError = await profilesResponse.text();
    console.log(`Failed to update profiles: ${profilesError}`);
    
    // Step 3: If profiles fails, try user_profiles
    console.log('Trying user_profiles table instead...');
    
    const userProfilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${access_token}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      })
    });
    
    if (userProfilesResponse.ok) {
      console.log('Successfully updated user_profiles table!');
      return;
    }
    
    const userProfilesError = await userProfilesResponse.text();
    throw new Error(`Failed to update user_profiles: ${userProfilesError}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

makeAdmin().then(() => console.log('Operation completed')); 