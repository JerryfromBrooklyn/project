/* =========================================================
 * SERVICE ROLE INITIALIZATION
 * =========================================================
 * 
 * This file initializes required resources using the service role key
 * to ensure proper permissions for all operations.
 */

import { supabaseAdmin, createBucketIfNotExists } from './supabaseAdmin';

// Required storage buckets for the application
const REQUIRED_BUCKETS = [
  'user-data',   // For storing user face IDs
  'photos',      // For storing uploaded photos
  'face-data'    // For storing face recognition data
];

/**
 * Initializes all required storage buckets and database resources
 * @returns {Promise<boolean>} - Success status
 */
export const initializeServiceResources = async () => {
  console.log('[Admin] Starting service resources initialization...');
  
  try {
    // Create all required buckets
    for (const bucket of REQUIRED_BUCKETS) {
      await createBucketIfNotExists(bucket);
    }
    
    // Ensure required database tables exist
    await ensureDatabaseTables();
    
    console.log('[Admin] Service resources initialization complete');
    return true;
  } catch (error) {
    console.error('[Admin] Error during service resources initialization:', error);
    return false;
  }
};

/**
 * Ensures all required database tables exist
 * @returns {Promise<boolean>} - Success status
 */
const ensureDatabaseTables = async () => {
  try {
    // Try to query user_faces table to check if it exists
    const { error: userFacesError } = await supabaseAdmin
      .from('user_faces')
      .select('count', { count: 'exact', head: true });
      
    // Create user_faces table if it doesn't exist
    if (userFacesError && userFacesError.code === '42P01') {
      console.log('[Admin] Creating user_faces table...');
      
      try {
        const { error } = await supabaseAdmin.sql(`
          CREATE TABLE IF NOT EXISTS public.user_faces (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            face_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          CREATE INDEX IF NOT EXISTS user_faces_user_id_idx ON public.user_faces(user_id);
        `);
        
        if (error) {
          console.error('[Admin] Error creating user_faces table:', error);
        } else {
          console.log('[Admin] user_faces table created successfully');
        }
      } catch (sqlError) {
        console.error('[Admin] SQL error creating user_faces table:', sqlError);
      }
    }
    
    // Check if profiles table has face_id column
    try {
      const { error: columnCheckError } = await supabaseAdmin
        .from('profiles')
        .select('face_id')
        .limit(1);
        
      if (columnCheckError && columnCheckError.message.includes("face_id")) {
        console.log('[Admin] Adding face_id column to profiles table...');
        
        const { error } = await supabaseAdmin.sql(`
          ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_id TEXT;
        `);
        
        if (error) {
          console.error('[Admin] Error adding face_id column:', error);
        } else {
          console.log('[Admin] face_id column added to profiles table');
        }
      }
    } catch (profileError) {
      console.error('[Admin] Error checking profiles table:', profileError);
    }
    
    return true;
  } catch (error) {
    console.error('[Admin] Database initialization error:', error);
    return false;
  }
};

export default { initializeServiceResources }; 