#!/bin/bash

# This script applies fixes to the database permissions through Supabase SQL

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$VITE_SUPABASE_URL" ] && [ -z "$REACT_APP_SUPABASE_URL" ]; then
  echo "Error: Missing Supabase URL. Please set SUPABASE_URL, VITE_SUPABASE_URL, or REACT_APP_SUPABASE_URL in your .env file."
  exit 1
fi

# Run the SQL script using the Supabase CLI
echo "Applying SQL fixes to fix permissions and RLS..."
echo "This requires the Supabase CLI to be installed and authenticated."

if command -v supabase &> /dev/null; then
  # Method 1: Using Supabase CLI
  supabase db execute --file ./disable_all_rls.sql
else
  # Method 2: Using npx
  npx supabase db execute --file ./disable_all_rls.sql
fi

if [ $? -eq 0 ]; then
  echo "SQL fixes applied successfully!"
else
  echo "Failed to apply SQL fixes. Please check errors above."
  
  echo ""
  echo "Alternative approach: Copy the SQL below and execute it in the Supabase dashboard SQL editor:"
  echo "--------------------------------------------------------------------------"
  cat disable_all_rls.sql
  echo "--------------------------------------------------------------------------"
fi

# Run the JavaScript helper script if it exists
if [ -f fix_permissions.js ]; then
  echo "Running JavaScript helper to verify fixes..."
  
  if command -v node &> /dev/null; then
    node fix_permissions.js
  else
    echo "Node.js not found. Skipping verification step."
  fi
fi

echo "Done!" 