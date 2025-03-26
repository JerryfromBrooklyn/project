import 'cross-fetch';
import { supabase } from '../src/lib/supabaseClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFaceRegistration() {
  try {
    console.log('Testing face registration status...\n');

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

    // 2. Check face_data table
    const { data: faceData, error: faceError } = await supabase
      .from('face_data')
      .select('*')
      .eq('user_id', signInData.user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (faceError) {
      throw faceError;
    }

    if (!faceData) {
      console.log('❌ No face data found in database');
      console.log('\nRecommendation: Register your face using the dashboard');
      return;
    }

    console.log('\n✅ Found face data record:');
    console.log('- User ID:', faceData.user_id);
    console.log('- Created at:', new Date(faceData.created_at).toLocaleString());
    console.log('- Image path:', faceData.face_data.image_path);

    // 3. Check if image exists in storage
    const { data: imageData, error: imageError } = await supabase.storage
      .from('face-data')
      .download(faceData.face_data.image_path);

    if (imageError) {
      console.log('❌ Image file not found in storage');
      throw imageError;
    }

    console.log('✅ Face image exists in storage');

    // 4. Check face_index table
    const { data: indexData, error: indexError } = await supabase
      .from('face_index')
      .select('*')
      .eq('user_id', signInData.user.id)
      .maybeSingle();

    if (indexError) {
      throw indexError;
    }

    if (!indexData) {
      console.log('❌ No face index record found');
      console.log('\nRecommendation: Face needs to be indexed');
    } else {
      console.log('\n✅ Found face index record:');
      console.log('- Face ID:', indexData.face_id);
      console.log('- External ID:', indexData.external_image_id);

      if (indexData.attributes) {
        console.log('\nFace Attributes:');
        const attrs = indexData.attributes;
        if (attrs.age) {
          console.log('- Age range:', attrs.age.low, '-', attrs.age.high);
        }
        if (attrs.gender) {
          console.log('- Gender:', attrs.gender.value, `(${Math.round(attrs.gender.confidence)}% confidence)`);
        }
        if (attrs.smile) {
          console.log('- Smiling:', attrs.smile.value ? 'Yes' : 'No', `(${Math.round(attrs.smile.confidence)}% confidence)`);
        }
        if (attrs.eyesOpen) {
          console.log('- Eyes open:', attrs.eyesOpen.value ? 'Yes' : 'No', `(${Math.round(attrs.eyesOpen.confidence)}% confidence)`);
        }
        if (attrs.emotions?.length) {
          const primaryEmotion = attrs.emotions.reduce((prev, curr) => 
            curr.confidence > prev.confidence ? curr : prev
          );
          console.log('- Primary emotion:', primaryEmotion.type, `(${Math.round(primaryEmotion.confidence)}% confidence)`);
        }
      }
    }

    // Sign out after test
    await supabase.auth.signOut();

    console.log('\nTest complete!');

  } catch (error) {
    console.error('\n❌ Error testing face registration:', error);
    process.exit(1);
  }
}

testFaceRegistration();