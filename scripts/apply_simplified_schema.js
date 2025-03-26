/**
 * Helper script to apply the simplified database schema and migrate existing data
 * 
 * This script:
 * 1. Disables RLS policies
 * 2. Replaces the materialized view with a regular view
 * 3. Updates functions to remove SECURITY DEFINER
 * 4. Verifies data integrity
 * 
 * Run with: node scripts/apply_simplified_schema.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('Starting database schema migration...');
    
    // Step 1: Backup data (optional - this is just a sample to show how we could do it in JS)
    console.log('Backing up important data...');
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error('Error backing up users:', usersError);
    } else {
      fs.writeFileSync(
        path.join(__dirname, 'backup_users.json'), 
        JSON.stringify(usersData, null, 2)
      );
      console.log(`Backed up ${usersData.length} users`);
    }
    
    const { data: photosData, error: photosError } = await supabase.from('photos').select('*');
    if (photosError) {
      console.error('Error backing up photos:', photosError);
    } else {
      fs.writeFileSync(
        path.join(__dirname, 'backup_photos.json'), 
        JSON.stringify(photosData, null, 2)
      );
      console.log(`Backed up ${photosData.length} photos`);
    }
    
    const { data: faceData, error: faceError } = await supabase.from('face_data').select('*');
    if (faceError) {
      console.error('Error backing up face data:', faceError);
    } else {
      fs.writeFileSync(
        path.join(__dirname, 'backup_face_data.json'), 
        JSON.stringify(faceData, null, 2)
      );
      console.log(`Backed up ${faceData.length} face records`);
    }
    
    // Step 2: Apply the migration using raw SQL
    console.log('Applying migration...');
    
    // Disable RLS for all tables
    const disableRlsQueries = [
      'ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS public.face_data DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS public.unassociated_faces DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS public.user_storage DISABLE ROW LEVEL SECURITY;'
    ];
    
    for (const query of disableRlsQueries) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: query });
      if (error) {
        console.error(`Error executing query "${query}":`, error);
      } else {
        console.log(`Successfully executed: ${query}`);
      }
    }
    
    // Drop problematic materialized view
    const dropMvQuery = 'DROP MATERIALIZED VIEW IF EXISTS public.mv_user_matched_photos;';
    const { error: dropMvError } = await supabase.rpc('execute_sql', { sql_query: dropMvQuery });
    if (dropMvError) {
      console.error('Error dropping materialized view:', dropMvError);
    } else {
      console.log('Successfully dropped materialized view');
    }
    
    // Create new regular view
    const createViewQuery = `
      CREATE OR REPLACE VIEW public.user_matched_photos AS
      SELECT 
        p.*,
        jsonb_array_elements(p.matched_users)->>'userId' as matched_user_id
      FROM 
        public.photos p
      WHERE 
        jsonb_array_length(p.matched_users) > 0;
    `;
    
    const { error: createViewError } = await supabase.rpc('execute_sql', { sql_query: createViewQuery });
    if (createViewError) {
      console.error('Error creating view:', createViewError);
    } else {
      console.log('Successfully created regular view');
    }
    
    // Update functions to remove SECURITY DEFINER
    const updateFunctionsQueries = [
      `
      CREATE OR REPLACE FUNCTION public.get_photos_needing_face_indexing()
      RETURNS TABLE (
        id UUID,
        storage_path TEXT,
        has_faces BOOLEAN
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          p.id, 
          p.storage_path, 
          (CASE WHEN jsonb_array_length(COALESCE(p.faces, '[]'::jsonb)) > 0 THEN true ELSE false END) as has_faces
        FROM 
          public.photos p
        WHERE 
          p.face_ids IS NULL OR p.face_ids = '{}' OR array_length(p.face_ids, 1) IS NULL;
      END;
      $$ LANGUAGE plpgsql;
      `,
      `
      CREATE OR REPLACE FUNCTION public.update_photo_face_ids(
        photo_id UUID,
        new_face_ids TEXT[]
      )
      RETURNS VOID AS $$
      BEGIN
        UPDATE public.photos
        SET face_ids = new_face_ids
        WHERE id = photo_id;
      END;
      $$ LANGUAGE plpgsql;
      `,
      `
      CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql;
      `
    ];
    
    for (const query of updateFunctionsQueries) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: query });
      if (error) {
        console.error(`Error updating function:`, error);
      } else {
        console.log(`Successfully updated function`);
      }
    }
    
    // Step 3: Verify results
    console.log('Verifying migration...');
    
    // Check new view
    const { data: viewData, error: viewError } = await supabase
      .from('user_matched_photos')
      .select('id, matched_user_id')
      .limit(5);
      
    if (viewError) {
      console.error('Error querying view:', viewError);
    } else {
      console.log('View working correctly with sample data:', viewData);
    }
    
    // Check data integrity
    const { data: postPhotosData, error: postPhotosError } = await supabase
      .from('photos')
      .select('count');
      
    if (postPhotosError) {
      console.error('Error checking photos count:', postPhotosError);
    } else {
      console.log(`Photos count after migration: ${postPhotosData[0]?.count}`);
      if (photosData && postPhotosData && photosData.length.toString() === postPhotosData[0]?.count) {
        console.log('✅ Photos data integrity verified');
      } else {
        console.warn('⚠️ Photos count mismatch - should investigate');
      }
    }
    
    console.log('Migration complete!');
    console.log('Remember to implement application-level security if needed since RLS is now disabled.');
    
  } catch (err) {
    console.error('Unhandled error during migration:', err);
    process.exit(1);
  }
}

main(); 