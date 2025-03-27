import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create a Supabase client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase URL or Key missing from .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function makeJerryAdmin() {
  try {
    // First, get Jerry's ID from auth.users using raw SQL
    console.log('Locating Jerry\'s user ID in the database...');
    
    const { data: idResult, error: idError } = await supabase.rpc('execute_sql', {
      query_text: `
        SELECT id FROM auth.users 
        WHERE email = 'jerry@jerry.com' 
        LIMIT 1;
      `
    });
    
    if (idError) {
      throw new Error(`Failed to find Jerry: ${idError.message}`);
    }
    
    if (!idResult || idResult.length === 0) {
      throw new Error('User jerry@jerry.com not found in database');
    }
    
    const jerryId = idResult[0].id;
    console.log(`Found Jerry's user ID: ${jerryId}`);
    
    // Try updating profiles table first
    console.log('Attempting to make Jerry an admin in profiles table...');
    
    const { data: profilesResult, error: profilesError } = await supabase.rpc('execute_sql', {
      query_text: `
        INSERT INTO profiles (id, role, updated_at)
        VALUES ('${jerryId}', 'admin', now())
        ON CONFLICT (id) 
        DO UPDATE SET role = 'admin', updated_at = now()
        RETURNING id, role;
      `
    });
    
    if (!profilesError && profilesResult && profilesResult.length > 0) {
      console.log('Successfully updated profiles table!');
      console.log('Result:', profilesResult[0]);
      return;
    }
    
    // If that fails, try user_profiles
    console.log('Profiles table failed, trying user_profiles table...');
    
    const { data: userProfilesResult, error: userProfilesError } = await supabase.rpc('execute_sql', {
      query_text: `
        INSERT INTO user_profiles (id, role, updated_at)
        VALUES ('${jerryId}', 'admin', now())
        ON CONFLICT (id) 
        DO UPDATE SET role = 'admin', updated_at = now()
        RETURNING id, role;
      `
    });
    
    if (userProfilesError) {
      throw new Error(`Failed to update user_profiles: ${userProfilesError.message}`);
    }
    
    console.log('Successfully updated user_profiles table!');
    console.log('Result:', userProfilesResult[0]);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

makeJerryAdmin().then(() => {
  console.log('Operation completed');
}); 