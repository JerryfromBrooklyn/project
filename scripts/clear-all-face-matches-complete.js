// Comprehensive script to clear face matches from ALL storage locations
// Run with: node scripts/clear-all-face-matches-complete.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gmupwzjxirpkskolsuix.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: Supabase key not found in environment variables.');
  console.error('Make sure you have VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

async function clearAllFaceMatchesCompletely() {
  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('\n=== STEP 1: Clearing photo_faces database table ===');
    const { error: deleteError, count: deleteCount } = await supabase
      .from('photo_faces')
      .delete({ count: 'exact' });

    if (deleteError) {
      console.error('Error clearing photo_faces table:', deleteError.message);
    } else {
      console.log(`✓ Success! Deleted ${deleteCount || 'all'} face match records from photo_faces table.`);
    }

    console.log('\n=== STEP 2: Clearing match data from photo metadata ===');
    
    // First get all photos that have face data in metadata
    const { data: photosWithMetadata, error: metadataQueryError } = await supabase
      .from('photos')
      .select('id, metadata')
      .or('metadata->faces.neq.null,metadata->aws_face_data.neq.null,metadata->rekognition.neq.null')
      .limit(1000); // Limit to prevent overwhelming the DB

    if (metadataQueryError) {
      console.error('Error querying photos with face metadata:', metadataQueryError.message);
    } else {
      console.log(`Found ${photosWithMetadata?.length || 0} photos with face match metadata.`);
      
      if (photosWithMetadata && photosWithMetadata.length > 0) {
        console.log('Updating photos to remove face match data from metadata...');
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process photos in batches to avoid overwhelming the database
        const batchSize = 20;
        const batches = Math.ceil(photosWithMetadata.length / batchSize);
        
        for (let i = 0; i < batches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, photosWithMetadata.length);
          const batch = photosWithMetadata.slice(start, end);
          
          console.log(`Processing batch ${i+1}/${batches} (${batch.length} photos)...`);
          
          const promises = batch.map(async (photo) => {
            // Make a clean copy of metadata without face data
            const cleanMetadata = { ...photo.metadata };
            
            // Remove all face-related fields
            delete cleanMetadata.faces;
            delete cleanMetadata.aws_face_data;
            delete cleanMetadata.rekognition;
            delete cleanMetadata.face_data;
            delete cleanMetadata.face_details;
            delete cleanMetadata.face_matches;
            
            // Update the photo with clean metadata
            const { error: updateError } = await supabase
              .from('photos')
              .update({ metadata: cleanMetadata })
              .eq('id', photo.id);
              
            if (updateError) {
              console.error(`Error updating photo ${photo.id}:`, updateError.message);
              errorCount++;
              return false;
            } else {
              successCount++;
              return true;
            }
          });
          
          // Wait for all updates in this batch to complete
          await Promise.all(promises);
        }
        
        console.log(`✓ Updated ${successCount} photos successfully. ${errorCount} photos failed to update.`);
      }
    }
    
    // Also check simple_photos table if it exists
    try {
      const { data: simplePhotosWithMetadata, error: simpleMetadataQueryError } = await supabase
        .from('simple_photos')
        .select('id, metadata')
        .or('metadata->faces.neq.null,metadata->aws_face_data.neq.null,metadata->rekognition.neq.null')
        .limit(1000);
        
      if (!simpleMetadataQueryError && simplePhotosWithMetadata && simplePhotosWithMetadata.length > 0) {
        console.log(`\nFound ${simplePhotosWithMetadata.length} simple_photos with face match metadata.`);
        console.log('Updating simple_photos to remove face match data from metadata...');
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process photos in batches
        const batchSize = 20;
        const batches = Math.ceil(simplePhotosWithMetadata.length / batchSize);
        
        for (let i = 0; i < batches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, simplePhotosWithMetadata.length);
          const batch = simplePhotosWithMetadata.slice(start, end);
          
          console.log(`Processing batch ${i+1}/${batches} (${batch.length} simple_photos)...`);
          
          const promises = batch.map(async (photo) => {
            // Make a clean copy of metadata without face data
            const cleanMetadata = { ...photo.metadata };
            
            // Remove all face-related fields
            delete cleanMetadata.faces;
            delete cleanMetadata.aws_face_data;
            delete cleanMetadata.rekognition;
            delete cleanMetadata.face_data;
            delete cleanMetadata.face_details;
            delete cleanMetadata.face_matches;
            
            // Update the photo with clean metadata
            const { error: updateError } = await supabase
              .from('simple_photos')
              .update({ metadata: cleanMetadata })
              .eq('id', photo.id);
              
            if (updateError) {
              console.error(`Error updating simple_photo ${photo.id}:`, updateError.message);
              errorCount++;
              return false;
            } else {
              successCount++;
              return true;
            }
          });
          
          // Wait for all updates in this batch to complete
          await Promise.all(promises);
        }
        
        console.log(`✓ Updated ${successCount} simple_photos successfully. ${errorCount} simple_photos failed to update.`);
      }
    } catch (simplePhotosError) {
      console.log('Note: simple_photos table not found or does not have metadata column. Skipping.');
    }
    
    console.log('\n=== STEP 3: Note about localStorage ===');
    console.log('localStorage can only be cleared in the browser context.');
    console.log('To clear localStorage, each user needs to run this JavaScript in their browser console:');
    console.log('');
    console.log('  // Get current user ID');
    console.log('  supabase.auth.getUser().then(({ data }) => {');
    console.log('    const userId = data.user.id;');
    console.log('    const key = `face_matches_${userId}`;');
    console.log('    localStorage.removeItem(key);');
    console.log('    console.log(`Cleared face matches from localStorage for user ${userId}`);');
    console.log('  });');
    console.log('');
    
    console.log('\nAll face match data has been cleared from the server-side storage!');
    console.log('Remember to instruct users to clear their localStorage as well.');
    
    return true;
  } catch (err) {
    console.error('Unexpected error:', err.message);
    return false;
  }
}

// Execute the function
clearAllFaceMatchesCompletely()
  .then(success => {
    if (success) {
      console.log('\nOperation completed successfully!');
      console.log('\nNEXT STEPS:');
      console.log('1. Verify all photos display with "Unknown" confidence initially');
      console.log('2. If users still see matches immediately, check for other metadata fields we missed');
      console.log('3. Remember that the thresholds are now set to: AWS=95%, Display=97%');
    } else {
      console.log('\nOperation failed or completed with errors.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 