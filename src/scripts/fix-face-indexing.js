/**
 * fix-face-indexing.js - A script to repair and enhance face indexing
 * 
 * This script:
 * 1. Finds all users with registered faces
 * 2. For each user, verifies their face is properly indexed in Rekognition
 * 3. Ensures all potential matches are found and stored in DynamoDB
 * 4. Updates photo records to include proper matched_users arrays
 */

const AWS = require('aws-sdk');
const { configureAWS } = require('../lib/awsConfig');

// Initialize AWS services
configureAWS();

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const rekognition = new AWS.Rekognition({ region: 'us-east-1' });

// Constants
const FACE_COLLECTION_ID = 'shmong-faces';
const FACE_DATA_TABLE = 'shmong-face-data';
const PHOTOS_TABLE = 'shmong-photos';
const USERS_TABLE = 'shmong-users';
const FACE_MATCH_THRESHOLD = 85.0; // Minimum similarity score to consider a match

// Main function
async function fixFaceIndexing() {
  try {
    console.log(`🔧 Starting face indexing repair script...`);
    
    // Step 1: Get all face records from DynamoDB
    console.log(`📊 Scanning ${FACE_DATA_TABLE} for face records...`);
    const faceRecords = await getAllFaceRecords();
    console.log(`✅ Found ${faceRecords.length} face records`);
    
    // Organize face records by user
    const userFaceMap = {};
    for (const record of faceRecords) {
      if (!userFaceMap[record.userId]) {
        userFaceMap[record.userId] = [];
      }
      userFaceMap[record.userId].push(record);
    }
    
    const userCount = Object.keys(userFaceMap).length;
    console.log(`👤 Found ${userCount} unique users with face data`);
    
    // Step 2: Process each user
    let processedUsers = 0;
    for (const userId in userFaceMap) {
      processedUsers++;
      console.log(`\n👤 Processing user ${processedUsers}/${userCount}: ${userId}`);
      
      // Get the user's face records (may have multiple)
      const userFaces = userFaceMap[userId];
      console.log(`   User has ${userFaces.length} face records`);
      
      // Sort by creation date (newest first)
      userFaces.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Use the most recent face record
      const latestFace = userFaces[0];
      console.log(`   Latest face ID: ${latestFace.faceId}`);
      
      // Step 3: Verify face exists in Rekognition collection
      console.log(`   Verifying face ${latestFace.faceId} in Rekognition...`);
      const faceExists = await verifyFaceInCollection(latestFace.faceId);
      
      if (!faceExists) {
        console.log(`❌ Face ${latestFace.faceId} not found in Rekognition collection`);
        
        if (latestFace.imagePath) {
          console.log(`   Found image path ${latestFace.imagePath}, attempting to re-index...`);
          // TODO: Implement re-indexing logic with S3 image retrieval
          console.log(`   ⚠️ Re-indexing not implemented in this version`);
        } else {
          console.log(`❌ No image path found, cannot re-index face`);
        }
        
        // Skip to next user
        continue;
      }
      
      console.log(`✅ Face verified in Rekognition collection`);
      
      // Step 4: Find all potential matches for this face
      console.log(`🔍 Searching for matches for face ${latestFace.faceId}...`);
      const matches = await findAllMatches(latestFace.faceId);
      console.log(`✅ Found ${matches.length} potential matches`);
      
      if (matches.length === 0) {
        console.log(`   No matches found, skipping to next user`);
        continue;
      }
      
      // Step 5: Process matches and update DynamoDB
      console.log(`📝 Processing matches and updating DynamoDB...`);
      await updateUserFaceMatches(userId, latestFace.faceId, matches);
      
      // Step 6: Update matched photos to include this user
      console.log(`🖼️ Updating matched photos records...`);
      await updateMatchedPhotos(userId, latestFace.faceId, matches);
      
      console.log(`✅ User ${userId} processing complete`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Face indexing repair completed for ${processedUsers} users`);
    
  } catch (error) {
    console.error(`❌ Error in fixFaceIndexing:`, error);
  }
}

// Helper functions

// Get all face records from DynamoDB
async function getAllFaceRecords() {
  const records = [];
  let lastEvaluatedKey;
  
  do {
    const params = {
      TableName: FACE_DATA_TABLE,
      Limit: 100,
      ExclusiveStartKey: lastEvaluatedKey
    };
    
    const response = await dynamoDB.scan(params).promise();
    records.push(...response.Items);
    lastEvaluatedKey = response.LastEvaluatedKey;
    
    console.log(`   Scanned ${records.length} face records so far...`);
    
  } while (lastEvaluatedKey);
  
  return records;
}

// Verify a face exists in the Rekognition collection
async function verifyFaceInCollection(faceId) {
  try {
    const response = await rekognition.describeFaces({
      CollectionId: FACE_COLLECTION_ID,
      FaceIds: [faceId]
    }).promise();
    
    return response.Faces && response.Faces.length > 0;
  } catch (error) {
    console.error(`Error verifying face ${faceId}:`, error);
    return false;
  }
}

// Find all potential matches for a face
async function findAllMatches(faceId) {
  try {
    const response = await rekognition.searchFaces({
      CollectionId: FACE_COLLECTION_ID,
      FaceId: faceId,
      MaxFaces: 1000,
      FaceMatchThreshold: FACE_MATCH_THRESHOLD
    }).promise();
    
    if (!response.FaceMatches) {
      return [];
    }
    
    // Process matches to extract useful information
    return Promise.all(response.FaceMatches.map(async match => {
      try {
        const externalId = match.Face.ExternalImageId;
        let photoId = externalId;
        let matchType = 'unknown';
        
        // Handle photo_ prefix
        if (externalId.startsWith('photo_')) {
          photoId = externalId.substring(6);
          matchType = 'photo';
        }
        // Handle user_ prefix
        else if (externalId.startsWith('user_')) {
          photoId = externalId.substring(5);
          matchType = 'user';
        }
        
        const similarityScore = match.Similarity;
        
        // Skip exact self-matches
        if (similarityScore === 100 && match.Face.FaceId === faceId) {
          return null;
        }
        
        // For photo matches, get details from the photos table
        if (matchType === 'photo') {
          try {
            const photoData = await dynamoDB.get({
              TableName: PHOTOS_TABLE,
              Key: { id: photoId }
            }).promise();
            
            if (photoData.Item) {
              return {
                id: photoId,
                similarity: similarityScore,
                imageUrl: photoData.Item.imageUrl || photoData.Item.public_url,
                owner: photoData.Item.userId || photoData.Item.user_id,
                eventId: photoData.Item.eventId || photoData.Item.event_id,
                createdAt: photoData.Item.createdAt || photoData.Item.created_at,
                matchType: 'photo'
              };
            }
          } catch (photoError) {
            console.error(`   Error fetching photo details for ${photoId}:`, photoError);
          }
        }
        
        // Return basic match info if photo details not available
        return {
          id: photoId,
          similarity: similarityScore,
          matchType: matchType,
          externalId: externalId
        };
      } catch (matchError) {
        console.error(`   Error processing match:`, matchError);
        return null;
      }
    }));
  } catch (error) {
    console.error(`Error finding matches for face ${faceId}:`, error);
    return [];
  }
}

// Update user face record with matches
async function updateUserFaceMatches(userId, faceId, matches) {
  try {
    // Filter out null values and sort by similarity
    const validMatches = matches
      .filter(match => match !== null)
      .filter(match => match && match.id && match.similarity)
      .sort((a, b) => b.similarity - a.similarity);
    
    // Limit to top 150 matches to avoid exceeding DynamoDB item size limits
    const topMatches = validMatches.slice(0, 150);
    
    console.log(`   Updating user ${userId} with ${topMatches.length} processed matches`);
    
    // Get the current face record to preserve other fields
    const currentRecord = await dynamoDB.get({
      TableName: FACE_DATA_TABLE,
      Key: { userId }
    }).promise();
    
    if (!currentRecord.Item) {
      console.error(`❌ Could not find face record for user ${userId}`);
      return;
    }
    
    // Update the record with new matches
    await dynamoDB.update({
      TableName: FACE_DATA_TABLE,
      Key: { userId },
      UpdateExpression: 'SET historicalMatches = :matches, updatedAt = :now',
      ExpressionAttributeValues: {
        ':matches': topMatches,
        ':now': new Date().toISOString()
      }
    }).promise();
    
    console.log(`✅ Updated face record for user ${userId} with ${topMatches.length} matches`);
    
  } catch (error) {
    console.error(`❌ Error updating face matches for user ${userId}:`, error);
  }
}

// Update photo records to include the user in matched_users
async function updateMatchedPhotos(userId, faceId, matches) {
  try {
    // Filter for photo matches only
    const photoMatches = matches
      .filter(match => match !== null)
      .filter(match => match.matchType === 'photo' && match.id);
    
    console.log(`   Found ${photoMatches.length} photo matches to update`);
    
    let updatedCount = 0;
    
    for (const match of photoMatches) {
      try {
        // Get the current photo data
        const photoData = await dynamoDB.get({
          TableName: PHOTOS_TABLE,
          Key: { id: match.id }
        }).promise();
        
        if (!photoData.Item) {
          console.log(`   Photo ${match.id} not found, skipping`);
          continue;
        }
        
        // Ensure matched_users is an array
        let matchedUsers = Array.isArray(photoData.Item.matched_users) 
          ? photoData.Item.matched_users 
          : [];
        
        // Check if user already in matched_users
        const alreadyMatched = matchedUsers.some(entry => {
          if (typeof entry === 'object' && entry !== null) {
            return (entry.userId === userId || entry.user_id === userId);
          } else if (typeof entry === 'string') {
            return entry === userId;
          }
          return false;
        });
        
        if (alreadyMatched) {
          console.log(`   User ${userId} already in matched_users for photo ${match.id}`);
          continue;
        }
        
        // Add user to matched_users
        matchedUsers.push({
          userId: userId,
          faceId: faceId,
          similarity: match.similarity,
          matchedAt: new Date().toISOString()
        });
        
        // Update the photo
        await dynamoDB.update({
          TableName: PHOTOS_TABLE,
          Key: { id: match.id },
          UpdateExpression: 'SET matched_users = :users, updated_at = :now',
          ExpressionAttributeValues: {
            ':users': matchedUsers,
            ':now': new Date().toISOString()
          }
        }).promise();
        
        updatedCount++;
        
      } catch (photoError) {
        console.error(`   Error updating photo ${match.id}:`, photoError);
      }
    }
    
    console.log(`✅ Updated ${updatedCount} photo records to include user ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error updating matched photos for user ${userId}:`, error);
  }
}

// Run the script
fixFaceIndexing()
  .then(() => console.log(`Script completed`))
  .catch(err => console.error(`Script failed with error:`, err));

module.exports = {
  fixFaceIndexing
}; 