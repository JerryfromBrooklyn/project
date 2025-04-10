const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Update with your region
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Photo IDs to compare
const photoIds = [
  'eff1a18d-742d-4dfe-ac1e-fc8154672fd4', // First photo
  'f2520b6d-a689-408c-b53e-546dfe986609'  // Second photo
];

async function getPhotoData(photoId) {
  try {
    const params = {
      TableName: 'shmong-photos',
      Key: {
        id: photoId
      }
    };
    
    const data = await dynamodb.get(params).promise();
    return data.Item;
  } catch (error) {
    console.error(`Error getting data for photo ${photoId}:`, error);
    return null;
  }
}

async function comparePhotos() {
  console.log('Comparing matched_users arrays between photos...\n');
  
  const results = await Promise.all(photoIds.map(photoId => getPhotoData(photoId)));
  
  results.forEach((photoData, index) => {
    if (photoData) {
      console.log(`Photo ${index + 1} (${photoIds[index]}):`);
      console.log(`- Title: ${photoData.title || 'No title'}`);
      console.log(`- Uploaded by: ${photoData.user_id || 'Unknown'}`);
      
      if (photoData.matched_users && Array.isArray(photoData.matched_users)) {
        console.log(`- Has ${photoData.matched_users.length} matched users:`);
        photoData.matched_users.forEach(match => {
          console.log(`  - User: ${match.userId}, Similarity: ${match.similarity}%`);
        });
      } else {
        console.log('- No matched_users data found');
      }
      console.log('---');
    } else {
      console.log(`Photo ${index + 1} (${photoIds[index]}): No data found`);
      console.log('---');
    }
  });
  
  // Compare matches between photos if both have data
  if (results[0] && results[1] && 
      results[0].matched_users && results[1].matched_users) {
    
    const photo1Users = new Set(results[0].matched_users.map(m => m.userId));
    const photo2Users = new Set(results[1].matched_users.map(m => m.userId));
    
    // Find users in photo 1 but not in photo 2
    const uniqueToPhoto1 = [...photo1Users].filter(userId => !photo2Users.has(userId));
    
    // Find users in photo 2 but not in photo 1
    const uniqueToPhoto2 = [...photo2Users].filter(userId => !photo1Users.has(userId));
    
    console.log('\nDifferences between matched users:');
    if (uniqueToPhoto1.length > 0) {
      console.log(`Users in Photo 1 but not in Photo 2: ${uniqueToPhoto1.join(', ')}`);
    }
    
    if (uniqueToPhoto2.length > 0) {
      console.log(`Users in Photo 2 but not in Photo 1: ${uniqueToPhoto2.join(', ')}`);
    }
    
    if (uniqueToPhoto1.length === 0 && uniqueToPhoto2.length === 0) {
      console.log('Both photos have the same matched users.');
    }
  }
}

comparePhotos().catch(console.error); 