const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file
require('dotenv').config();

// Get Supabase URL and API key from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase URL or API key. Please check your environment variables.');
  process.exit(1);
}

// Use service role key if available for admin operations, otherwise use anon key
const API_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, API_KEY);

// Read SQL file content
const sqlFilePath = path.join(__dirname, 'disable_all_rls.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split SQL content into separate statements
const statements = sqlContent
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

async function executeSQLStatements() {
  try {
    console.log('Starting permissions fix...');
    
    // Check if we can execute SQL directly using RPC
    const { data: hasExecuteSql, error: rpcCheckError } = await supabase.rpc('execute_sql', { 
      sql_query: 'SELECT 1 as test' 
    }).select('test');
    
    const canExecuteSQL = !rpcCheckError && hasExecuteSql;
    
    if (canExecuteSQL) {
      console.log('Using execute_sql RPC function to apply changes...');
      
      // Execute each statement using the execute_sql RPC function
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('execute_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error);
          } else {
            console.log(`Statement ${i + 1} executed successfully.`);
          }
        } catch (err) {
          console.error(`Error processing statement ${i + 1}:`, err);
        }
      }
    } else {
      console.error('Cannot execute SQL directly. Please run the SQL manually in the Supabase dashboard.');
      console.log('SQL to execute:');
      console.log(sqlContent);
    }
    
    console.log('Checking RLS status on photos table...');
    const { data: photoSettings, error: photoError } = await supabase
      .from('photos')
      .select('count(*)')
      .limit(1);
      
    if (photoError) {
      console.error('Error accessing photos table:', photoError);
      console.log('RLS may still be enabled or there are permission issues.');
    } else {
      console.log('Successfully accessed photos table: RLS disabled or you have sufficient permissions.');
    }
    
    console.log('Checking permissions on users table...');
    const { data: userSettings, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', '3594c5c0-676d-4732-89be-ed7372696853')
      .limit(1);
      
    if (userError) {
      console.error('Error accessing users table:', userError);
      console.log('RLS may still be enabled on users table or there are permission issues.');
    } else {
      console.log('Successfully accessed users table: RLS disabled or you have sufficient permissions.');
      if (userSettings && userSettings.length > 0) {
        console.log(`User role: ${userSettings[0].role}`);
      }
    }
    
    console.log('Verifying admin_create_photo function...');
    const { error: functionError } = await supabase.rpc('admin_create_photo', {
      p_id: '00000000-0000-0000-0000-000000000000',
      p_uploaded_by: '3594c5c0-676d-4732-89be-ed7372696853',
      p_path: 'test_path',
      p_url: 'test_url'
    });
    
    if (functionError && !functionError.message.includes('duplicate key')) {
      console.error('Error testing admin_create_photo function:', functionError);
    } else {
      console.log('admin_create_photo function is working properly.');
    }
    
    console.log('Permissions fix completed!');

  } catch (err) {
    console.error('Unhandled error during SQL execution:', err);
  }
}

executeSQLStatements(); 