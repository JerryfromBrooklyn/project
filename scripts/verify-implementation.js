// Verification script for enhanced face matching system
import { createClient } from '@supabase/supabase-js';
import FaceIndexingService from '../src/services/FaceIndexingService.jsx';
import PhotoService from '../src/services/PhotoService.js';

// Setup Supabase client (using environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyImplementation() {
  console.log('🔍 Verifying Enhanced Face Matching Implementation...');
  
  try {
    // Check 1: Verify unassociated_faces table exists
    console.log('\n📋 Checking database tables...');
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) throw new Error(`Database query failed: ${error.message}`);
    
    const hasUnassociatedFacesTable = tables.some(t => t.table_name === 'unassociated_faces');
    console.log(`✅ unassociated_faces table exists: ${hasUnassociatedFacesTable}`);

    // Check 2: Verify photos table has aws_face_ids column
    console.log('\n📋 Checking photos table structure...');
    const { data: columns, columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'photos');
    
    if (columnsError) throw new Error(`Column query failed: ${columnsError.message}`);
    
    const hasAwsFaceIdsColumn = columns.some(c => c.column_name === 'aws_face_ids');
    console.log(`✅ photos.aws_face_ids column exists: ${hasAwsFaceIdsColumn}`);

    // Check 3: Verify FaceIndexingService functions
    console.log('\n📋 Checking FaceIndexingService implementation...');
    const hasGetInitialHistoricalMatches = typeof FaceIndexingService.getInitialHistoricalMatches === 'function';
    console.log(`✅ getInitialHistoricalMatches exists: ${hasGetInitialHistoricalMatches}`);
    
    const hasProcessHistoricalMatching = typeof FaceIndexingService.processHistoricalMatching === 'function';
    console.log(`✅ processHistoricalMatching exists: ${hasProcessHistoricalMatching}`);

    // Check 4: Verify PhotoService integration
    console.log('\n📋 Checking PhotoService integration...');
    const photoServiceCode = PhotoService.uploadPhoto.toString();
    const handlesIndexedFaces = photoServiceCode.includes('indexedFaces') || 
                               photoServiceCode.includes('aws_face_ids');
    console.log(`✅ PhotoService handles indexed faces: ${handlesIndexedFaces}`);

    // Summary
    console.log('\n📊 Implementation Verification Summary:');
    console.log('------------------------------------------');
    console.log(`Database structure: ${hasUnassociatedFacesTable && hasAwsFaceIdsColumn ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Face service functions: ${hasGetInitialHistoricalMatches && hasProcessHistoricalMatching ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Photo service integration: ${handlesIndexedFaces ? '✅ PASS' : '❌ FAIL'}`);
    
    const overallStatus = 
      hasUnassociatedFacesTable && 
      hasAwsFaceIdsColumn && 
      hasGetInitialHistoricalMatches && 
      hasProcessHistoricalMatching && 
      handlesIndexedFaces;
    
    console.log('\n🏁 Overall implementation status:', overallStatus ? '✅ COMPLETE' : '❌ INCOMPLETE');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyImplementation(); 