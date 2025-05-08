/**
 * Migration script to update existing matched_users data in DynamoDB
 * to use the new format (JSON string instead of comma-separated)
 * 
 * Run with: node migrate-matched-users.js
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const { v4: uuid } = require('uuid');

// Configure AWS
const configureAWS = () => {
  const accessKeyId = process.env.COMPANION_AWS_KEY;
  const secretAccessKey = process.env.COMPANION_AWS_SECRET;
  const region = process.env.COMPANION_AWS_REGION || 'us-east-1';
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ AWS credentials not configured');
    return false;
  }
  
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region
  });
  
  return true;
};

// Constants
const PHOTOS_TABLE = process.env.DYNAMODB_PHOTOS_TABLE || 'shmong-photos';

async function migrateMatchedUsers() {
  console.log('🔄 Starting migration of matched_users data...');
  
  if (!configureAWS()) {
    console.error('❌ Could not configure AWS. Exiting.');
    return;
  }
  
  // Initialize DynamoDB document client
  const docClient = new AWS.DynamoDB.DocumentClient();
  
  // Scan all items in the photos table
  const scanParams = {
    TableName: PHOTOS_TABLE
  };
  
  try {
    // Get all items
    let allItems = [];
    let scanResult;
    
    do {
      scanResult = await docClient.scan(scanParams).promise();
      allItems.push(...scanResult.Items);
      scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;
    } while (scanResult.LastEvaluatedKey);
    
    console.log(`📋 Found ${allItems.length} photos to check for migration`);
    
    // Items that need updating
    const itemsToUpdate = [];
    
    // Filter items that need updating (have matched_users as string but not JSON)
    for (const item of allItems) {
      if (item.matched_users && typeof item.matched_users === 'string') {
        // Check if it's already valid JSON
        try {
          JSON.parse(item.matched_users);
          console.log(`✅ Item ${item.id} already has valid JSON in matched_users`);
        } catch (e) {
          // Not valid JSON, needs migration
          itemsToUpdate.push(item);
        }
      }
    }
    
    console.log(`🔄 Found ${itemsToUpdate.length} photos to migrate`);
    
    // Process each item
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of itemsToUpdate) {
      try {
        // Get the current matched_users value
        const currentValue = item.matched_users;
        
        // Create an array from comma-separated string if applicable
        let matchedUsers = [];
        
        if (currentValue.includes(',')) {
          matchedUsers = currentValue.split(',')
            .filter(Boolean)
            .map(userId => ({ 
              userId, 
              faceId: null,
              similarity: 100,
              matchedAt: item.created_at || new Date().toISOString()
            }));
        } else if (currentValue.trim() !== '') {
          // Single value
          matchedUsers = [{
            userId: currentValue,
            faceId: null,
            similarity: 100,
            matchedAt: item.created_at || new Date().toISOString()
          }];
        }
        
        // Update the item with new format
        const updateParams = {
          TableName: PHOTOS_TABLE,
          Key: { id: item.id },
          UpdateExpression: 'SET matched_users = :mu, matched_users_list = :ml, matched_users_string = :ms',
          ExpressionAttributeValues: {
            ':mu': JSON.stringify(matchedUsers),
            ':ml': matchedUsers,
            ':ms': currentValue // Preserve the original string in matched_users_string
          }
        };
        
        await docClient.update(updateParams).promise();
        console.log(`✅ Successfully migrated item ${item.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating item ${item.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('🏁 Migration complete!');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed migrations: ${errorCount}`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

// Run the migration
migrateMatchedUsers().catch(error => {
  console.error('❌ Unhandled error during migration:', error);
}); 