import { supabase } from '../src/lib/supabaseClient';
import { rekognitionClient } from '../src/config/aws-config';
import { DeleteCollectionCommand, CreateCollectionCommand } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupFaces() {
  try {
    console.log('Starting face collection cleanup...\n');

    // 1. Sign in with test credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'jerry@jerry.com',
      password: process.env.TEST_USER_PASSWORD || '!Jerrydec051488'
    });

    if (signInError) {
      throw signInError;
    }

    if (!signInData.user) {
      console.log('❌ Failed to authenticate test user');
      console.log('\nPlease check your test credentials in .env file');
      return;
    }

    console.log('✅ Authenticated as:', signInData.user.email);

    // 2. Delete existing collection
    console.log('\nDeleting existing collection...');
    try {
      await rekognitionClient.send(
        new DeleteCollectionCommand({
          CollectionId: 'shmong-faces'
        })
      );
      console.log('✅ Existing collection deleted');
    } catch (error) {
      console.log('No existing collection to delete');
    }

    // 3. Create new collection
    console.log('\nCreating new collection...');
    await rekognitionClient.send(
      new CreateCollectionCommand({
        CollectionId: 'shmong-faces',
        Tags: {
          Environment: 'production',
          Application: 'shmong'
        }
      })
    );
    console.log('✅ New collection created');

    // 4. Clear face_index table
    console.log('\nClearing face_index table...');
    const { error: indexError } = await supabase
      .from('face_index')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (indexError) throw indexError;
    console.log('✅ Face index table cleared');

    // 5. Clear face_data table
    console.log('\nClearing face_data table...');
    const { error: dataError } = await supabase
      .from('face_data')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (dataError) throw dataError;
    console.log('✅ Face data table cleared');

    // 6. Clear face-data storage bucket
    console.log('\nClearing face-data storage bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('face-data')
      .list();

    if (listError) throw listError;

    if (files && files.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('face-data')
        .remove(files.map(file => file.name));

      if (deleteError) throw deleteError;
    }
    console.log('✅ Storage bucket cleared');

    // 7. Sign out
    await supabase.auth.signOut();

    console.log('\nCleanup complete! You can now re-register faces.');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupFaces();