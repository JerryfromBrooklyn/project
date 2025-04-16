// Script to fix visibility records for all matched photos
// This will ensure all users can see their photo matches

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  BatchWriteCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

// AWS Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Table names
const PHOTOS_TABLE = 'shmong-photos';
const USER_VISIBILITY_TABLE = 'shmong-user-photo-visibility';

// Initialize DynamoDB clients
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

const docClient = DynamoDBDocumentClient.from(client);

// Check if required credentials are present
if (!accessKeyId || !secretAccessKey) {
  console.error('❌ AWS credentials not found in environment variables!');
  console.error('Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set.');
  process.exit(1);
}

async function scanAllPhotos() {
  console.log('🔍 Scanning all photos in DynamoDB...');
  
  const allPhotos = [];
  let lastEvaluatedKey = undefined;
  let totalScanned = 0;
  
  do {
    const scanParams = {
      TableName: PHOTOS_TABLE,
      ProjectionExpression: "id, matched_users",
      Limit: 100,
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
    };
    
    try {
      const result = await docClient.send(new ScanCommand(scanParams));
      const photos = result.Items || [];
      
      allPhotos.push(...photos);
      lastEvaluatedKey = result.LastEvaluatedKey;
      
      totalScanned += photos.length;
      process.stdout.write(`\r📷 Scanned ${totalScanned} photos...`);
      
    } catch (error) {
      console.error('\n❌ Error scanning photos:', error);
      break;
    }
  } while (lastEvaluatedKey);
  
  console.log(`\n✅ Completed scan. Found ${allPhotos.length} photos in total.`);
  return allPhotos;
}

async function getExistingVisibilityRecords() {
  console.log('🔍 Fetching existing visibility records to avoid duplicates...');
  
  const existingRecords = new Set();
  let lastEvaluatedKey = undefined;
  let totalScanned = 0;
  
  do {
    const scanParams = {
      TableName: USER_VISIBILITY_TABLE,
      ProjectionExpression: "userId, photoId",
      Limit: 100,
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
    };
    
    try {
      const result = await docClient.send(new ScanCommand(scanParams));
      const records = result.Items || [];
      
      records.forEach(record => {
        existingRecords.add(`${record.userId}:${record.photoId}`);
      });
      
      lastEvaluatedKey = result.LastEvaluatedKey;
      
      totalScanned += records.length;
      process.stdout.write(`\r👁️  Scanned ${totalScanned} visibility records...`);
      
    } catch (error) {
      console.error('\n❌ Error scanning visibility records:', error);
      break;
    }
  } while (lastEvaluatedKey);
  
  console.log(`\n✅ Found ${existingRecords.size} existing visibility records.`);
  return existingRecords;
}

async function createVisibilityRecords(photos, existingRecords) {
  console.log('📝 Creating missing visibility records...');
  
  const now = new Date().toISOString();
  const recordsToCreate = [];
  const batchSize = 25; // DynamoDB batch write limit
  
  // Process each photo
  photos.forEach(photo => {
    if (!photo.id) {
      console.warn('⚠️ Found photo without ID, skipping');
      return;
    }
    
    // Extract matched users
    let matchedUsers = photo.matched_users || [];
    
    // Handle different possible data formats
    if (!Array.isArray(matchedUsers)) {
      console.warn(`⚠️ Unexpected matched_users format for photo ${photo.id}, skipping`);
      return;
    }
    
    // Process each matched user
    matchedUsers.forEach(match => {
      let userId = null;
      
      // Handle different user ID formats
      if (typeof match === 'string') {
        userId = match;
      } else if (typeof match === 'object' && match !== null) {
        userId = match.userId || match.user_id;
        
        // Handle Map structures from DynamoDB native format
        if (match.M && (match.M.userId || match.M.user_id)) {
          userId = match.M.userId?.S || match.M.user_id?.S;
        }
      }
      
      // Skip invalid user IDs
      if (!userId || userId.length < 10 || userId.startsWith('photo_') || userId.startsWith('p')) {
        return;
      }
      
      // Skip if record already exists
      const recordKey = `${userId}:${photo.id}`;
      if (existingRecords.has(recordKey)) {
        return;
      }
      
      // Add record to batch
      recordsToCreate.push({
        PutRequest: {
          Item: {
            userId,
            photoId: photo.id,
            status: 'VISIBLE',
            updatedAt: now
          }
        }
      });
    });
  });
  
  console.log(`🔄 Creating ${recordsToCreate.length} missing visibility records in batches of ${batchSize}...`);
  
  // Split into batches of 25 (DynamoDB batch limit)
  const batches = [];
  for (let i = 0; i < recordsToCreate.length; i += batchSize) {
    batches.push(recordsToCreate.slice(i, i + batchSize));
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [USER_VISIBILITY_TABLE]: batch
        }
      }));
      
      successCount += batch.length;
      process.stdout.write(`\r✅ Progress: ${Math.round((i + 1) * 100 / batches.length)}% (${successCount}/${recordsToCreate.length})`);
      
    } catch (error) {
      console.error(`\n❌ Error processing batch ${i + 1}:`, error);
      errorCount += batch.length;
    }
    
    // Small delay to avoid throttling
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`\n\n📊 Summary:`);
  console.log(`✅ Successfully created ${successCount} visibility records`);
  
  if (errorCount > 0) {
    console.log(`❌ Failed to create ${errorCount} visibility records`);
  }
  
  return { successCount, errorCount };
}

async function main() {
  console.log('🚀 Starting photo visibility fix script...');
  console.log('⚙️  Using AWS region:', region);
  
  try {
    // Get all photos with their matched users
    const photos = await scanAllPhotos();
    
    // Get existing visibility records to avoid duplicates
    const existingRecords = await getExistingVisibilityRecords();
    
    // Create missing visibility records
    await createVisibilityRecords(photos, existingRecords);
    
    console.log('\n✅ Script completed successfully!');
    console.log('👁️  All users should now be able to see their matched photos.');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 