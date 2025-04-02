import 'cross-fetch';
import { supabase } from '../src/lib/supabaseClient';
import { FaceIndexingService } from '../src/services/FaceIndexingService.jsx';
import { rekognitionClient } from '../src/config/aws-config';
import { DetectFacesCommand, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFaceRecognition() {
  try {
    console.log('Starting face recognition test...\n');

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

    // 2. Get the user's registered face data
    const { data: faceData, error: faceError } = await supabase
      .from('face_data')
      .select('face_data')
      .eq('user_id', signInData.user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (faceError) {
      throw faceError;
    }

    if (!faceData) {
      console.log('❌ No registered face data found');
      return;
    }

    console.log('✅ Found registered face data');

    // 3. Download the registered face image
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('face-data')
      .download(faceData.face_data.image_path);

    if (downloadError) {
      throw downloadError;
    }

    console.log('✅ Successfully downloaded registered face image');

    // 4. Convert to bytes for AWS Rekognition
    const arrayBuffer = await imageData.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

    // 5. Test face detection
    console.log('\nTesting face detection...');
    const detectCommand = new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ['ALL']
    });

    const detectResponse = await rekognitionClient.send(detectCommand);
    
    if (!detectResponse.FaceDetails?.length) {
      console.log('❌ No faces detected in registered image');
      return;
    }

    console.log(`✅ Detected ${detectResponse.FaceDetails.length} face(s) in registered image`);
    console.log('Face detection confidence:', detectResponse.FaceDetails[0].Confidence);

    // 6. Test face search
    console.log('\nTesting face search...');
    const searchCommand = new SearchFacesByImageCommand({
      CollectionId: 'shmong-faces',
      Image: { Bytes: imageBytes },
      MaxFaces: 5,
      FaceMatchThreshold: 80
    });

    const searchResponse = await rekognitionClient.send(searchCommand);
    
    if (!searchResponse.FaceMatches?.length) {
      console.log('❌ No face matches found');
      console.log('\nPossible issues:');
      console.log('1. Face may not be properly indexed');
      console.log('2. Face collection may need to be reindexed');
      console.log('3. Match threshold may be too high');
      
      // 7. Check face index
      console.log('\nChecking face index...');
      const { data: indexData, error: indexError } = await supabase
        .from('face_index')
        .select('*')
        .eq('user_id', signInData.user.id)
        .maybeSingle();

      if (indexError) {
        console.log('❌ Error checking face index:', indexError.message);
      } else if (!indexData) {
        console.log('❌ No face index found');
        console.log('\nRecommendation: Try re-registering your face');
      } else {
        console.log('✅ Face index exists');
        console.log('Face ID:', indexData.face_id);
        console.log('\nRecommendation: Try running the reindex-faces script');
      }
    } else {
      console.log('✅ Found face matches!');
      searchResponse.FaceMatches.forEach((match, index) => {
        console.log(`\nMatch ${index + 1}:`);
        console.log('Face ID:', match.Face?.FaceId);
        console.log('Similarity:', match.Similarity);
      });
    }

    // Sign out after test
    await supabase.auth.signOut();

  } catch (error) {
    console.error('\n❌ Error during face recognition test:', error);
    process.exit(1);
  }
}

testFaceRecognition();