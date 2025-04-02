import { supabase } from '../lib/supabaseClient';

/**
 * Utility functions for database operations that need special privileges
 */

/**
 * Creates the necessary database functions if they don't exist
 * These functions help bypass RLS for specific operations
 */
export async function ensureDatabaseFunctions() {
  try {
    console.log('[DB-UTILS] Checking for required database functions');
    
    // Step 1: Check if the admin_insert_photo function exists
    const { data: functionExists, error: checkError } = await supabase.rpc('function_exists', {
      function_name: 'admin_insert_photo'
    });
    
    if (checkError) {
      console.log('[DB-UTILS] Error checking for function existence:', checkError.message);
      // Continue anyway, we'll try to create it
    }
    
    // If function doesn't exist or we couldn't check, try to create it
    if (!functionExists) {
      console.log('[DB-UTILS] Creating admin_insert_photo function');
      
      // Use raw SQL to create the function
      const { error: createError } = await supabase.rpc('admin_run_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION admin_insert_photo(p_id text, p_matched_users jsonb)
          RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER -- This runs with the privileges of the function creator
          SET search_path = public
          AS $$
          DECLARE
            result jsonb;
          BEGIN
            -- Insert the basic photo record
            INSERT INTO photos (id, matched_users, created_at)
            VALUES (p_id, p_matched_users, NOW())
            RETURNING to_jsonb(photos.*) INTO result;
            
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM, 'code', SQLSTATE);
          END;
          $$;
          
          -- Grant execute permission to authenticated users
          GRANT EXECUTE ON FUNCTION admin_insert_photo(text, jsonb) TO authenticated;
        `
      });
      
      if (createError) {
        console.error('[DB-UTILS] Error creating function:', createError);
        return false;
      }
      
      console.log('[DB-UTILS] Successfully created admin_insert_photo function');
    } else {
      console.log('[DB-UTILS] admin_insert_photo function already exists');
    }
    
    return true;
  } catch (error) {
    console.error('[DB-UTILS] Error setting up database functions:', error);
    return false;
  }
}

/**
 * Creates or updates a photo record, bypassing RLS if necessary
 */
export async function createPhotoRecord(photoId, matchedUsers = []) {
  try {
    console.log(`[DB-UTILS] Creating photo record for ${photoId}`);
    
    // Use the admin function directly since we know it exists
    console.log('[DB-UTILS] Using admin_insert_photo function');
    
    const { data, error } = await supabase.rpc(
      'admin_insert_photo',
      { 
        p_id: photoId,
        p_matched_users: Array.isArray(matchedUsers) ? JSON.stringify(matchedUsers) : '[]'
      }
    );
    
    if (error) {
      console.error('[DB-UTILS] Admin insert failed:', error);
      
      // Fall back to normal insert as last resort
      console.log('[DB-UTILS] Trying standard insert as fallback');
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('photos')
        .insert({
          id: photoId,
          matched_users: matchedUsers || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (fallbackError) {
        console.error('[DB-UTILS] All insert methods failed:', fallbackError);
        return { success: false, error: fallbackError };
      }
      
      console.log('[DB-UTILS] Fallback insert succeeded');
      return { success: true, data: fallbackData };
    }
    
    console.log('[DB-UTILS] Photo created successfully with admin function');
    return { success: true, data };
  } catch (error) {
    console.error('[DB-UTILS] Error creating photo:', error);
    return { success: false, error };
  }
}

// Initialize database functions when this module is imported
(async function init() {
  try {
    // First check if our admin function exists by trying to use it
    console.log('[DB-UTILS] Testing admin_insert_photo function existence...');
    
    // Use a test UUID that won't conflict with real records
    const testId = 'test-' + Date.now();
    
    const { data, error } = await supabase.rpc(
      'admin_insert_photo',
      { 
        p_id: testId,
        p_matched_users: '[]'
      }
    );
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42883') {
        console.warn('[DB-UTILS] admin_insert_photo function not found, attempting to create it');
        await ensureDatabaseFunctions();
      } else {
        console.error('[DB-UTILS] Error testing admin_insert_photo function:', error.message);
      }
    } else {
      console.log('[DB-UTILS] admin_insert_photo function exists and works correctly');
      
      // Clean up test record if it was created
      if (data && data.id) {
        console.log('[DB-UTILS] Cleaning up test record');
        await supabase.from('photos').delete().eq('id', testId);
      }
    }
  } catch (error) {
    console.error('[DB-UTILS] Error during initialization:', error);
  }
})().catch(console.error);

export default {
  ensureDatabaseFunctions,
  createPhotoRecord
}; 