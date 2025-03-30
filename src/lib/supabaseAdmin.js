/* =========================================================
 * ADMIN SERVICE - RESTRICTED OPERATIONS
 * =========================================================
 * 
 * SECURITY NOTICE:
 * - This file contains operations that use the service role key
 * - These operations should ONLY be called from controlled contexts
 * - DO NOT expose this client directly to components
 * 
 * =========================================================
 */

// COMPATIBILITY LAYER - Forward imports to the new centralized implementation
import { supabaseAdmin } from '../supabaseClient';

// Re-export from the new implementation
export { supabaseAdmin };

/**
 * Creates a bucket in Supabase Storage if it doesn't exist
 * @param {string} bucketName - Name of the bucket to create
 * @returns {Promise<boolean>} - Success status
 */
export const createBucketIfNotExists = async (bucketName) => {
  try {
    // First check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    
    if (!buckets.find(b => b.name === bucketName)) {
      console.log(`[Admin] Creating bucket: ${bucketName}`);
      try {
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: false
        });
        
        if (error) {
          console.error(`[Admin] Error creating bucket ${bucketName}:`, error);
          return false;
        }
        
        console.log(`[Admin] Successfully created bucket: ${bucketName}`);
      } catch (createError) {
        console.error(`[Admin] Bucket creation error: ${createError.message}`);
        return false;
      }
    } else {
      console.log(`[Admin] Bucket ${bucketName} already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('[Admin] Error in bucket operation:', error);
    return false;
  }
};

/**
 * Creates required database tables if they don't exist
 * @returns {Promise<boolean>} - Success status
 */
export const setupRequiredTables = async () => {
  try {
    // Check if user_faces table exists
    const { error: checkError } = await supabaseAdmin.from('user_faces').select('count', { count: 'exact', head: true });
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, create it with SQL
      console.log('[Admin] Creating user_faces table...');
      
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_faces (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            face_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create index on user_id for faster lookups
          CREATE INDEX IF NOT EXISTS user_faces_user_id_idx ON public.user_faces(user_id);
        `
      });
      
      if (createError) {
        console.error('[Admin] Error creating user_faces table:', createError);
        
        // Alternative direct SQL approach if RPC fails
        const { error: sqlError } = await supabaseAdmin.sql(`
          CREATE TABLE IF NOT EXISTS public.user_faces (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            face_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          CREATE INDEX IF NOT EXISTS user_faces_user_id_idx ON public.user_faces(user_id);
        `);
        
        if (sqlError) {
          console.error('[Admin] Error with direct SQL approach:', sqlError);
          return false;
        }
      }
      
      console.log('[Admin] Successfully created user_faces table');
    }
    
    // Check if profiles table needs face_id column
    try {
      const { error: columnCheckError } = await supabaseAdmin
        .from('profiles')
        .select('face_id')
        .limit(1);
        
      if (columnCheckError && columnCheckError.message.includes("face_id")) {
        console.log('[Admin] Adding face_id column to profiles table...');
        
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_id TEXT;`
        });
        
        if (alterError) {
          console.error('[Admin] Error adding face_id column:', alterError);
          
          // Try direct SQL if RPC fails
          const { error: sqlError } = await supabaseAdmin.sql(`
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_id TEXT;
          `);
          
          if (sqlError) {
            console.error('[Admin] Error with direct SQL for column addition:', sqlError);
          } else {
            console.log('[Admin] Successfully added face_id column to profiles');
          }
        } else {
          console.log('[Admin] Successfully added face_id column to profiles');
        }
      }
    } catch (profileError) {
      console.error('[Admin] Error checking profiles table:', profileError);
    }
    
    return true;
  } catch (error) {
    console.error('[Admin] Error in database setup:', error);
    return false;
  }
};

export default {
  createBucketIfNotExists,
  setupRequiredTables,
  supabaseAdmin
}; 