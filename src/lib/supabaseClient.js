/* =========================================================
 * CRITICAL SECURITY NOTICE - DO NOT MODIFY UNLESS AUTHORIZED
 * =========================================================
 * 
 * ROW LEVEL SECURITY (RLS) CONFIGURATION:
 * 
 * - RLS has been DELIBERATELY DISABLED on database tables
 * - DO NOT ENABLE RLS POLICIES until project completion
 * - Enabling RLS prematurely will BREAK admin functionality
 *   and face matching features
 * 
 * When the project is complete, a comprehensive security review
 * will establish appropriate RLS policies that maintain functionality
 * while ensuring data protection.
 * 
 * Any changes to this configuration require security team approval.
 * =========================================================
 */

// COMPATIBILITY LAYER - Forward all imports to the new centralized supabaseClient
import { 
  supabase, 
  supabaseAdmin, 
  getFaceIdFromCache, 
  cacheFaceId, 
  isSchemaValid, 
  getCachedSchema, 
  updateSchemaCache 
} from '../supabaseClient';

// Re-export everything from the new implementation
export { 
  supabase, 
  supabaseAdmin, 
  getFaceIdFromCache, 
  cacheFaceId,
  isSchemaValid, 
  getCachedSchema, 
  updateSchemaCache 
};

// Default export for compatibility
export default supabase; 