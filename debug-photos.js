const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');

// Configure AWS client
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USER_ID = 'd4e8e4e8-40b1-7018-fd76-d9284884c8d3'; // collindevonevents@gmail.com
const PHOTOS_TABLE = 'shmong-photos';
const USER_VISIBILITY_TABLE = 'shmong-user-photo-visibility';

// Main function
async function debugPhotos() {
  console.log(`Debugging photos for user ${USER_ID}`);
  
  // 1. First get all photos where the user appears in matched_users
  console.log('\n1. Getting all photos where user appears in matched_users...');
  const allPhotos = await getAllPhotos();
  const matchedPhotos = filterMatchedPhotos(allPhotos);
  
  console.log(`Found ${matchedPhotos.length} photos with user in matched_users out of ${allPhotos.length} total photos`);
  
  // 2. Get the user's visibility settings
  console.log('\n2. Getting visibility settings for the user...');
  const visibilitySettings = await getVisibilitySettings();
  
  console.log(`Found ${Object.keys(visibilitySettings).length} visibility settings for user`);
  
  // 3. Filter by visibility to see what would show up in "My Photos"
  console.log('\n3. Filtering photos that should appear in "My Photos" (VISIBLE only)...');
  const visiblePhotos = filterByVisibility(matchedPhotos, visibilitySettings, 'VISIBLE');
  
  console.log(`Result: ${visiblePhotos.length} photos should appear in "My Photos" tab\n`);
  
  // 4. Output summary
  console.log('SUMMARY:');
  console.log(`Total photos in database: ${allPhotos.length}`);
  console.log(`Photos where user appears in matched_users: ${matchedPhotos.length}`);
  console.log(`Photos explicitly marked as HIDDEN or TRASH: ${Object.values(visibilitySettings).filter(status => status === 'HIDDEN' || status === 'TRASH').length}`);
  console.log(`Photos that should appear in "My Photos" tab: ${visiblePhotos.length}`);
  
  // 5. Save details for further analysis
  const details = {
    user_id: USER_ID,
    total_photos: allPhotos.length,
    matched_photos: matchedPhotos.length,
    visible_photos: visiblePhotos.length,
    visibility_settings: visibilitySettings,
    visible_photo_ids: visiblePhotos.map(p => p.id),
    matched_photo_ids: matchedPhotos.map(p => p.id)
  };
  
  fs.writeFileSync('photo-debug-results.json', JSON.stringify(details, null, 2));
  console.log('\nDetailed results saved to photo-debug-results.json');
}

// Get all photos from DynamoDB
async function getAllPhotos() {
  const params = {
    TableName: PHOTOS_TABLE
  };
  
  const photos = [];
  let lastEvaluatedKey;
  
  do {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    const response = await docClient.send(new ScanCommand(params));
    photos.push(...(response.Items || []));
    lastEvaluatedKey = response.LastEvaluatedKey;
    
    console.log(`  Fetched batch of ${response.Items.length} photos. Total so far: ${photos.length}`);
  } while (lastEvaluatedKey);
  
  return photos;
}

// Filter photos where the user appears in matched_users
function filterMatchedPhotos(photos) {
  return photos.filter(photo => {
    // Check if matched_users exists and is an array
    if (!photo.matched_users || !Array.isArray(photo.matched_users)) {
      return false;
    }
    
    // Check if any matched_user has userId matching our target
    return photo.matched_users.some(match => {
      if (typeof match === 'string') {
        return match === USER_ID;
      } else if (typeof match === 'object' && match !== null) {
        return (match.userId || match.user_id) === USER_ID;
      }
      return false;
    });
  });
}

// Get visibility settings for all the user's photos
async function getVisibilitySettings() {
  try {
    const params = {
      TableName: USER_VISIBILITY_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': USER_ID }
    };
    
    const response = await docClient.send(new ScanCommand({
      TableName: USER_VISIBILITY_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': USER_ID }
    }));
    
    // Create a map of photoId -> status
    const visibilityMap = {};
    
    if (response.Items && response.Items.length > 0) {
      response.Items.forEach(item => {
        visibilityMap[item.photoId] = item.status;
      });
    }
    
    return visibilityMap;
  } catch (error) {
    console.error("Error getting photo visibility:", error);
    return {};
  }
}

// Filter photos by visibility status
function filterByVisibility(photos, visibilityMap, status = 'VISIBLE') {
  return photos.filter(photo => {
    if (!photo.id) {
      return false;
    }
    
    // Get the status from the map
    const photoStatusInMap = visibilityMap[photo.id];
    
    if (status === 'VISIBLE') {
      // For VISIBLE status, only show photos that are explicitly VISIBLE or have no visibility record
      return photoStatusInMap === 'VISIBLE' || photoStatusInMap === undefined;
    } else {
      // For TRASH/HIDDEN queries, require an exact match in the map
      return photoStatusInMap === status;
    }
  });
}

// Run the debug script
debugPhotos().catch(err => {
  console.error('Error debugging photos:', err);
}); 