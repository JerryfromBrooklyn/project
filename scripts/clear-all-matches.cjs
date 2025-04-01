// Script to clear all face matches across the entire site 
// Run with: node scripts/clear-all-matches.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gmupwzjxirpkskolsuix.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: Supabase key not found in environment variables.');
  console.error('Make sure you have VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

async function clearAllFaceMatches() {
  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Deleting all records from photo_faces table...');
    const { error, count } = await supabase
      .from('photo_faces')
      .delete({ count: 'exact' });

    if (error) {
      console.error('Error clearing face matches:', error.message);
      return false;
    }

    console.log(`Success! Deleted ${count || 'all'} face match records.`);
    console.log('All face matches have been cleared from the database.');
    return true;
  } catch (err) {
    console.error('Unexpected error:', err.message);
    return false;
  }
}

// Execute the function
clearAllFaceMatches()
  .then(success => {
    if (success) {
      console.log('Operation completed successfully.');
    } else {
      console.log('Operation failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 