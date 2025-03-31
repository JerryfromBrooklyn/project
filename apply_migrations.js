const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection parameters
const supabaseUrl = process.env.SUPABASE_URL || 'https://gmupwzjxirpkskolsuix.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Paths to migration files
const migrationFiles = [
  'supabase/migrations/20240401000001_face_matching_functions.sql',
  'supabase/migrations/20240401000002_face_collection_reset.sql'
];

async function applyMigrations() {
  console.log('Starting migration application...');
  
  for (const filePath of migrationFiles) {
    try {
      console.log(`Processing migration file: ${filePath}`);
      
      // Read SQL file content
      const sql = fs.readFileSync(path.resolve(filePath), 'utf8');
      
      // Split the file into individual SQL statements
      const statements = sql
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      console.log(`Found ${statements.length} SQL statements in ${filePath}`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i+1}/${statements.length}...`);
        
        // Add semicolon back for execution
        const { error } = await supabase.rpc('exec_sql', { sql: `${statement};` });
        
        if (error) {
          console.error(`Error executing statement ${i+1}: ${error.message}`);
          console.error('Statement:', statement);
          // Continue with other statements
        } else {
          console.log(`Successfully executed statement ${i+1}`);
        }
      }
      
      console.log(`Completed migration file: ${filePath}`);
    } catch (error) {
      console.error(`Error processing migration file ${filePath}:`, error);
    }
  }
  
  console.log('Migration application completed.');
}

// Execute the migrations
applyMigrations()
  .catch(error => {
    console.error('Migration application failed:', error);
    process.exit(1);
  }); 