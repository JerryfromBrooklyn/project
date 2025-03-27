import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create a Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Key. Make sure they are in your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function makeJerryAdmin() {
  try {
    console.log('Fetching Jerry\'s email information...');
    
    // First, get Jerry's auth info to get the user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }
    
    if (!user) {
      throw new Error('Not logged in. Please log in as Jerry first');
    }
    
    console.log(`Found user: ${user.email} with ID: ${user.id}`);
    
    if (user.email !== 'jerry@jerry.com') {
      throw new Error(`Current user (${user.email}) is not Jerry. Please log in as jerry@jerry.com`);
    }
    
    // Try to update profiles table first
    console.log('Attempting to update profiles table...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
      
    if (!profilesError) {
      console.log('Successfully updated profiles table!');
      return;
    }
    
    console.log(`Profiles table error: ${profilesError.message}`);
    console.log('Attempting to update user_profiles table instead...');
    
    // If that fails, try user_profiles
    const { error: userProfilesError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (userProfilesError) {
      throw new Error(`user_profiles table error: ${userProfilesError.message}`);
    }
    
    console.log('Successfully updated user_profiles table!');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

makeJerryAdmin().then(() => {
  console.log('Operation completed');
}); 