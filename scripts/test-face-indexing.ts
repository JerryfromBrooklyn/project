import 'cross-fetch';
import { supabase } from '../src/lib/supabaseClient';
import { FaceIndexingService } from '../src/services/FaceIndexingService';
import { rekognitionClient } from '../src/config/aws-config';
import { ListFacesCommand } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFaceIndexing() {
  try {
    console.log('Starting face indexing test...\n');

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
      return;
    }

    console.log('✅ Authenticated as:', signInData.user.email);

    // 2. Check face collection
    console.log('\nChecking face collection...');
    const listFacesCommand = new ListFacesCommand({
      CollectionId: 'shmong-faces'
    });

    const listFacesResponse = await rekognitionClient.send(listFacesCommand);
    console.log(`Found ${listFacesResponse.Faces?.length || 0} faces in collection`);

    // 3. Check face data in Supabase
    console.log('\nChecking face data in database...');
    const { data: faceData, error: faceError } = await supabase
      .from('face_data')
      .select('*')
      .eq('user_id', signInData.user.id)
      .order('created_at', { ascending: false });

    if (faceError) {
      throw faceError;
    }

    console.log(`Found ${faceData?.length || 0} face records in database`);

    // 4. Check face index table
    console.log('\nChecking face index table...');
    const { data: indexData, error: indexError } = await supabase
      .from('face_index')
      .select('*')
      .eq('user_id', signInData.user.id);

    if (indexError) {
      throw indexError;
    }

    console.log(`Found ${indexData?.length || 0} face index records`);

    // 5. Compare data
    if (faceData?.length && (!listFacesResponse.Faces?.length || !indexData?.length)) {
      console.log('\n⚠️  Data mismatch detected:');
      console.log(`- Database face records: ${faceData.length}`);
      console.log(`- AWS face collection: ${listFacesResponse.Faces?.length || 0}`);
      console.log(`- Face index records: ${indexData?.length || 0}`);
      console.log('\nRecommendation: Run reindex-faces script to sync data');
    }

    // 6. Check latest face registration
    if (faceData?.length) {
      const latestFace = faceData[0];
      console.log('\nChecking latest face registration:');
      console.log('Registration date:', new Date(latestFace.created_at).toLocaleString());
      
      // Download and test the image
      console.log('\nTesting latest registered image...');
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('face-data')
        .download(latestFace.face_data.image_path);

      if (downloadError) {
        throw downloadError;
      }

      const arrayBuffer = await imageData.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);

      // Test indexing the face
      console.log('Testing face indexing...');
      const indexResult = await FaceIndexingService.indexFace(imageBytes, latestFace.user_id);

      if (!indexResult.success) {
        console.log('❌ Face indexing failed:', indexResult.error);
      } else {
        console.log('✅ Face indexing successful');
        console.log('Face ID:', indexResult.faceId);
        
        if (indexResult.attributes) {
          console.log('\nFace attributes:');
          console.log('- Age range:', indexResult.attributes.AgeRange?.Low, '-', indexResult.attributes.AgeRange?.High);
          console.log('- Gender:', indexResult.attributes.Gender?.Value, `(${Math.round(indexResult.attributes.Gender?.Confidence || 0)}% confidence)`);
          console.log('- Smile:', indexResult.attributes.Smile?.Value ? 'Yes' : 'No');
          console.log('- Eyes open:', indexResult.attributes.EyesOpen?.Value ? 'Yes' : 'No');
          
          const primaryEmotion = indexResult.attributes.Emotions?.reduce((prev, curr) => 
            (curr.Confidence > prev.Confidence) ? curr : prev
          );
          if (primaryEmotion) {
            console.log('- Primary emotion:', primaryEmotion.Type, `(${Math.round(primaryEmotion.Confidence)}% confidence)`);
          }
        }
      }
    }

    // Sign out after test
    await supabase.auth.signOut();

    console.log('\nTest complete!');

  } catch (error) {
    console.error('\n❌ Error during face indexing test:', error);
    process.exit(1);
  }
}

testFaceIndexing();