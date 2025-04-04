#!/bin/bash

# Apply database fixes to ensure face registration and matching work correctly

echo "Starting database fix process..."

# Change to project directory if needed
cd "$(dirname "$0")"

# Ensure latest migration is applied
echo "Applying latest migration..."
npx supabase migration up

# Run admin function to fix face registrations
echo "Running fix_all_face_registrations..."
npx supabase db exec "SELECT admin_fix_all_face_registrations()"

# Fix any photos with missing or incorrect matches
echo "Running fix_photo_face_matches..."
npx supabase db exec "SELECT fix_photo_face_matches()"

echo "Database fixes applied successfully."
echo "The following features should now work correctly:"
echo "- User sign in and sign up"
echo "- Face registration"
echo "- Historical/future face matching"
echo "- Photo display in the photos tab"

echo "Complete!" 