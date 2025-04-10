const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Fred's user ID
const FRED_USER_ID = '749824e8-b011-7008-69ba-fbd51a255bb9';
const PHOTOS_TABLE = 'shmong-photos';
const FACE_DATA_TABLE = 'shmong-face-data';

async function diagnoseFredMatches() {
  console.log('🔍 Starting comprehensive diagnosis for Fred\'s account matches');
  console.log(`🧑 Fred's User ID: ${FRED_USER_ID}`);
  
  // STEP 1: Check if Fred has a face registered - use scan instead of get since we need both userId and faceId
  console.log('\n🔍 STEP 1: Checking if Fred has a registered face...');
  let fredFaceId;
  
  try {
    const faceDataParams = {
      TableName: FACE_DATA_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": FRED_USER_ID }
    };
    
    const faceData = await dynamoDB.scan(faceDataParams).promise();
    
    if (faceData.Items && faceData.Items.length > 0) {
      fredFaceId = faceData.Items[0].faceId;
      console.log(`✅ Fred has a registered face ID: ${fredFaceId}`);
    } else {
      console.log('❌ ERROR: Fred does not have a registered face!');
      return;
    }
  } catch (error) {
    console.error('❌ Error checking Fred\'s face registration:', error);
    return;
  }

  // STEP 2: Get ALL photos in the system
  console.log('\n🔍 STEP 2: Checking all photos in the system...');
  try {
    const scanParams = {
      TableName: PHOTOS_TABLE
    };
    
    const scanResult = await dynamoDB.scan(scanParams).promise();
    const allPhotos = scanResult.Items || [];
    
    console.log(`Found ${allPhotos.length} total photos in the system`);

    // STEP 3: Find photos with Fred in the matched_users array
    console.log('\n🔍 STEP 3: Finding photos with Fred in matched_users array...');
    const fredPhotos = allPhotos.filter(photo => {
      if (!photo.matched_users) return false;
      
      // Handle both string and array formats
      let matchedUsers = photo.matched_users;
      if (typeof matchedUsers === 'string') {
        try {
          matchedUsers = JSON.parse(matchedUsers);
        } catch (e) {
          console.log(`❌ WARNING: Invalid JSON in matched_users for photo ${photo.id}`);
          return false;
        }
      }
      
      if (!Array.isArray(matchedUsers)) {
        console.log(`❌ WARNING: matched_users is not an array for photo ${photo.id}`);
        return false;
      }
      
      return matchedUsers.some(match => {
        if (typeof match === 'string') return match === FRED_USER_ID;
        if (match && typeof match === 'object') {
          return match.userId === FRED_USER_ID || match.user_id === FRED_USER_ID;
        }
        return false;
      });
    });
    
    console.log(`✅ Found ${fredPhotos.length} photos with Fred in matched_users array`);
    if (fredPhotos.length > 0) {
      console.log(`Photo IDs: ${fredPhotos.map(p => p.id).join(', ')}`);
    }
    
    // STEP 4: Examine photos by uploader
    console.log('\n🔍 STEP 4: Breaking down photos by uploader...');
    const photosByUploader = {};
    
    allPhotos.forEach(photo => {
      const uploader = photo.user_id || photo.uploaded_by || 'unknown';
      photosByUploader[uploader] = photosByUploader[uploader] || [];
      photosByUploader[uploader].push(photo.id);
    });
    
    for (const [uploader, photos] of Object.entries(photosByUploader)) {
      console.log(`Uploader ${uploader}: ${photos.length} photos`);
    }
    
    // STEP 5: Check if Fred's face is in faces array but not matched_users
    console.log('\n🔍 STEP 5: Finding photos that have Fred\'s face but he\'s missing from matched_users...');
    let missingMatches = 0;
    
    for (const photo of allPhotos) {
      // Skip if Fred is already in matched_users
      if (fredPhotos.some(fp => fp.id === photo.id)) continue;
      
      // Check if Fred's faceId appears in the photo's faces array
      if (photo.faces && Array.isArray(photo.faces)) {
        for (const face of photo.faces) {
          const faceId = typeof face === 'object' ? face.faceId : face;
          
          // If this face belongs to Fred but he's not in matched_users - found an issue!
          if (faceId === fredFaceId) {
            console.log(`❌ ISSUE FOUND! Photo ${photo.id} has Fred's face but he's missing from matched_users`);
            console.log(`   Uploader: ${photo.user_id || photo.uploaded_by}`);
            console.log(`   matched_users: ${JSON.stringify(photo.matched_users)}`);
            missingMatches++;
          }
        }
      }
    }
    
    if (missingMatches === 0) {
      console.log('✅ No photos found with Fred\'s face missing from matched_users');
    } else {
      console.log(`❌ Found ${missingMatches} photos with Fred's face missing from matched_users`);
    }
    
    // STEP 6: Check Fred's historicalMatches data
    console.log('\n🔍 STEP 6: Checking Fred\'s historicalMatches data...');
    
    // Get Fred's face data
    const fredFaceDataParams = {
      TableName: FACE_DATA_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": FRED_USER_ID }
    };
    
    const fredFaceDataResult = await dynamoDB.scan(fredFaceDataParams).promise();
    const faceDataItem = fredFaceDataResult.Items && fredFaceDataResult.Items.length > 0 ? fredFaceDataResult.Items[0] : null;
    
    if (faceDataItem && faceDataItem.historicalMatches && Array.isArray(faceDataItem.historicalMatches)) {
      console.log(`✅ Fred has ${faceDataItem.historicalMatches.length} historicalMatches entries`);
      
      if (faceDataItem.historicalMatches.length > 0) {
        console.log(`First few historical matches: ${JSON.stringify(faceDataItem.historicalMatches.slice(0, 3))}`);
      }
    } else {
      console.log('❌ WARNING: Fred has no historicalMatches array or it\'s empty');
    }
    
    // STEP 7: Check for recently uploaded photos that should have matched
    console.log('\n🔍 STEP 7: Checking for recent photos that should have matched Fred...');
    
    // Sort photos by created_at or updated_at to find recent ones
    const recentPhotos = [...allPhotos].sort((a, b) => {
      const aDate = a.created_at || a.updated_at || '2000-01-01';
      const bDate = b.created_at || b.updated_at || '2000-01-01';
      return new Date(bDate) - new Date(aDate); // Descending order
    }).slice(0, 10); // Get 10 most recent
    
    console.log(`Examining ${recentPhotos.length} most recent photos...`);
    
    for (const photo of recentPhotos) {
      console.log(`Photo ${photo.id} - Created: ${photo.created_at || 'unknown'}, Uploader: ${photo.user_id || photo.uploaded_by || 'unknown'}`);
      console.log(`  Has faces: ${!!(photo.faces && photo.faces.length)}, Face count: ${photo.faces ? photo.faces.length : 0}`);
      console.log(`  Has Fred in matched_users: ${fredPhotos.some(fp => fp.id === photo.id)}`);
    }
    
    // STEP 8: Fix recommendation
    console.log('\n🔧 DIAGNOSIS SUMMARY:');
    
    if (fredPhotos.length <= 6) {
      console.log(`❌ ISSUE: Fred only has ${fredPhotos.length} photos in matched_users arrays`);
      
      if (missingMatches > 0) {
        console.log(`❌ ISSUE: ${missingMatches} photos have Fred's face but he's missing from matched_users`);
        console.log('   This indicates the real-time matching process is failing');
      }
      
      console.log('\n🛠️ RECOMMENDED SOLUTION:');
      console.log('1. The bidirectional matching update process is not running automatically.');
      console.log('   Create a script to run the following:');
      console.log('');
      console.log('   // Import FaceMatchingService');
      console.log('   const FaceMatchingService = require(\'./src/services/faceMatchingService\');');
      console.log('   ');
      console.log('   // Update Fred\'s matches');
      console.log(`   FaceMatchingService.updateBidirectionalMatches('${FRED_USER_ID}')`);
      console.log('     .then(result => console.log(result));');
      console.log('');
      console.log('2. Check the upload photo process in awsPhotoService.js:');
      console.log('   - Ensure it properly filters matches with user_ prefix (not photo_ prefix)');
      console.log('   - Confirm it\'s adding users to matched_users correctly');
      console.log('   - Verify that no restrictive filters are excluding valid matches');
    } else {
      console.log(`✅ Fred has ${fredPhotos.length} photos in matched_users arrays, which seems sufficient`);
      console.log('The issue may be with how the "My Photos" UI is retrieving or displaying the photos.');
      console.log('Check for client-side filtering that might be limiting the displayed photos to 6.');
    }
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseFredMatches().catch(console.error); 