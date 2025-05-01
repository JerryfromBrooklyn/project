/**
 * verify-face-matches.js - Verify face matches for a specific user
 * 
 * This script can be run manually to verify and fix face matches for a specific user.
 * It checks if the user's face ID is properly stored in Rekognition and DynamoDB,
 * and ensures all matched photos have the user in their matched_users array.
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
const FACE_MATCH_THRESHOLD = 85.0;

/**
 * Verify face matches for a specific user
 * @param {string} userId - The user ID to verify
 */
async function verifyFaceMatches(userId) {
  if (!userId) {
    console.error('❌ Missing user ID - must provide a user ID');
    return;
  }
  
  console.log(`🔍 Verifying face matches for user: ${userId}`);
  
  try {
    // Step 1: Get user's face data from DynamoDB
    const faceData = await getFaceData(userId);
    
    if (!faceData) {
      console.error(`❌ No face data found for user ${userId}`);
      return;
    }
    
    console.log(`✅ Found face data for user ${userId}`);
    console.log(`   Face ID: ${faceData.faceId}`);
    console.log(`   Created at: ${faceData.createdAt}`);
    
    // Step 2: Verify face ID exists in Rekognition
    const faceExists = await verifyFaceInCollection(faceData.faceId);
    
    if (!faceExists) {
      console.error(`❌ Face ${faceData.faceId} not found in Rekognition collection`);
      // TODO: Implement re-indexing logic if needed
      return;
    }
    
    console.log(`✅ Face verified in Rekognition collection`);
    
    // Step 3: Find all matches for the face
    console.log(`🔍 Finding matches for face ${faceData.faceId}...`);
    const matches = await findAllMatches(faceData.faceId);
    
    if (matches.length === 0) {
      console.log(`   No matches found for user ${userId}`);
      return;
    }
    
    console.log(`✅ Found ${matches.length} potential matches`);
    
    // Step 4: Compare with stored matches
    const storedMatches = faceData.historicalMatches || [];
    console.log(`   User has ${storedMatches.length} stored matches in DynamoDB`);
    
    // Check for missing matches
    const storedMatchIds = new Set(storedMatches.map(match => match.id));
    const currentMatchIds = new Set(matches
      .filter(match => match && match.id)
      .filter(match => match.similarity >= 93) // Use high confidence threshold
      .map(match => match.id));
    
    const missingMatchIds = [...currentMatchIds].filter(id => !storedMatchIds.has(id));
    
    if (missingMatchIds.length > 0) {
      console.log(`⚠️ Found ${missingMatchIds.length} matches missing in DynamoDB`);
      await updateHistoricalMatches(userId, faceData, matches);
    } else {
      console.log(`✅ All current matches are properly stored in DynamoDB`);
    }
    
    // Step 5: Verify photos have user in matched_users
    console.log(`🔍 Verifying matched photos have user in matched_users...`);
    await verifyMatchedPhotos(userId, faceData.faceId, matches);
    
    console.log(`✅ Verification completed for user ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error verifying face matches:`, error);
  }
}

/**
 * Get face data for a user from DynamoDB
 * @param {string} userId - The user ID
 * @returns {Object|null} - The face data or null if not found
 */
async function getFaceData(userId) {
  try {
    const result = await dynamoDB.get({
      TableName: FACE_DATA_TABLE,
      Key: { userId }
    }).promise();
    
    if (!result.Item) {
      return null;
    }
    
    return result.Item;
  } catch (error) {
    console.error(`Error fetching face data:`, error);
    return null;
  }
}

/**
 * Verify a face exists in the Rekognition collection
 * @param {string} faceId - The face ID to verify
 * @returns {boolean} - Whether the face exists
 */
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

/**
 * Find all matches for a face in the Rekognition collection
 * @param {string} faceId - The face ID
 * @returns {Array} - Array of matches
 */
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
    
    return Promise.all(response.FaceMatches.map(async match => {
      try {
        const externalId = match.Face.ExternalImageId;
        let photoId = externalId;
        let matchType = 'unknown';
        
        if (externalId.startsWith('photo_')) {
          photoId = externalId.substring(6);
          matchType = 'photo';
        } else if (externalId.startsWith('user_')) {
          photoId = externalId.substring(5);
          matchType = 'user';
        }
        
        const similarityScore = match.Similarity;
        
        // Skip self-matches
        if (similarityScore === 100 && match.Face.FaceId === faceId) {
          return null;
        }
        
        // For photo matches, get details
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
            console.error(`   Error fetching photo details:`, photoError);
          }
        }
        
        return {
          id: photoId,
          similarity: similarityScore,
          matchType,
          externalId
        };
      } catch (matchError) {
        console.error(`   Error processing match:`, matchError);
        return null;
      }
    }));
  } catch (error) {
    console.error(`Error finding matches:`, error);
    return [];
  }
}

/**
 * Update historical matches for a user
 * @param {string} userId - The user ID
 * @param {Object} faceData - The user's face data
 * @param {Array} matches - The current matches
 */
async function updateHistoricalMatches(userId, faceData, matches) {
  try {
    // Filter and sort matches
    const validMatches = matches
      .filter(match => match !== null)
      .filter(match => match && match.id && match.similarity)
      .filter(match => match.similarity >= 93) // Use high confidence threshold
      .sort((a, b) => b.similarity - a.similarity);
    
    // Limit to top 150 matches to avoid DynamoDB limits
    const topMatches = validMatches.slice(0, 150);
    
    console.log(`   Updating user ${userId} with ${topMatches.length} matches in DynamoDB`);
    
    // Update the record
    await dynamoDB.update({
      TableName: FACE_DATA_TABLE,
      Key: { userId },
      UpdateExpression: 'SET historicalMatches = :matches, updatedAt = :now',
      ExpressionAttributeValues: {
        ':matches': topMatches,
        ':now': new Date().toISOString()
      }
    }).promise();
    
    console.log(`✅ Updated face record with ${topMatches.length} matches`);
    
  } catch (error) {
    console.error(`❌ Error updating historical matches:`, error);
  }
}

/**
 * Verify matched photos have the user in their matched_users array
 * @param {string} userId - The user ID
 * @param {string} faceId - The face ID
 * @param {Array} matches - The matches to verify
 */
async function verifyMatchedPhotos(userId, faceId, matches) {
  try {
    // Filter for photo matches
    const photoMatches = matches
      .filter(match => match !== null)
      .filter(match => match.matchType === 'photo' && match.id);
    
    console.log(`   Found ${photoMatches.length} photo matches to verify`);
    
    let updatedCount = 0;
    
    for (const match of photoMatches) {
      try {
        // Get the current photo data
        const photoData = await dynamoDB.get({
          TableName: PHOTOS_TABLE,
          Key: { id: match.id }
        }).promise();
        
        if (!photoData.Item) {
          continue;
        }
        
        // Check if user is in matched_users
        let matchedUsers = photoData.Item.matched_users || [];
        if (!Array.isArray(matchedUsers)) {
          matchedUsers = [];
        }
        
        const userIncluded = matchedUsers.some(entry => {
          if (typeof entry === 'object' && entry !== null) {
            return (entry.userId === userId || entry.user_id === userId);
          } else if (typeof entry === 'string') {
            return entry === userId;
          }
          return false;
        });
        
        if (!userIncluded) {
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
        }
      } catch (photoError) {
        console.error(`   Error updating photo:`, photoError);
      }
    }
    
    if (updatedCount > 0) {
      console.log(`✅ Updated ${updatedCount} photos to include user in matched_users`);
    } else {
      console.log(`✅ All photo records already have user in matched_users`);
    }
    
  } catch (error) {
    console.error(`❌ Error verifying matched photos:`, error);
  }
}

// Check for command line arguments
const userId = process.argv[2];
if (userId) {
  verifyFaceMatches(userId)
    .then(() => console.log('Verification completed'))
    .catch(err => console.error('Verification failed with error:', err));
} else {
  console.log('Usage: node verify-face-matches.js <userId>');
}

module.exports = {
  verifyFaceMatches
}; 