import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  QueryCommand, 
  UpdateItemCommand,
  DeleteItemCommand 
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand as DocQueryCommand, 
  UpdateCommand,
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../lib/awsClient';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Create document client for easier data handling
const docClient = DynamoDBDocumentClient.from(client);

// Table names
const TABLES = {
  USERS: 'shmong-users',
  PHOTOS: 'shmong-photos',
  FACE_DATA: 'shmong-face-data',
  FACE_MATCHES: 'shmong-face-matches'
};

/**
 * Create a photo record in the photos table
 * @param {object} photoData - The photo data object
 * @returns {Promise<object>} Result with success status
 */
export const createPhotoRecord = async (photoData) => {
  try {
    // Add timestamps if not present
    const timestamp = new Date().toISOString();
    const photoWithTimestamps = {
      ...photoData,
      created_at: photoData.created_at || timestamp,
      updated_at: photoData.updated_at || timestamp,
      id: photoData.id || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    const command = new PutCommand({
      TableName: TABLES.PHOTOS,
      Item: photoWithTimestamps
    });
    
    await docClient.send(command);
    
    return { 
      success: true, 
      data: photoWithTimestamps 
    };
  } catch (error) {
    console.error('[DB] Error creating photo record:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get a photo record by ID
 * @param {string} photoId - The photo ID
 * @returns {Promise<object>} Result with photo data
 */
export const getPhotoById = async (photoId) => {
  try {
    const command = new GetCommand({
      TableName: TABLES.PHOTOS,
      Key: { id: photoId }
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      return { 
        success: false, 
        error: 'Photo not found' 
      };
    }
    
    return { 
      success: true, 
      data: response.Item 
    };
  } catch (error) {
    console.error('[DB] Error getting photo:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get photos by user ID
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of photos to return
 * @returns {Promise<object>} Result with array of photos
 */
export const getPhotosByUserId = async (userId, limit = 100) => {
  try {
    const command = new DocQueryCommand({
      TableName: TABLES.PHOTOS,
      IndexName: 'user_id-index',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit,
      ScanIndexForward: false // Sort by most recent first
    });
    
    const response = await docClient.send(command);
    
    return { 
      success: true, 
      data: response.Items || [] 
    };
  } catch (error) {
    console.error('[DB] Error getting user photos:', error);
    return { 
      success: false, 
      error: error.message,
      data: [] 
    };
  }
};

/**
 * Update a photo record
 * @param {string} photoId - The photo ID
 * @param {object} updates - The fields to update
 * @returns {Promise<object>} Result with success status
 */
export const updatePhotoRecord = async (photoId, updates) => {
  try {
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();
    
    // Build expressions for each update field
    Object.entries(updates).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });
    
    const command = new UpdateCommand({
      TableName: TABLES.PHOTOS,
      Key: { id: photoId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await docClient.send(command);
    
    return { 
      success: true, 
      data: response.Attributes 
    };
  } catch (error) {
    console.error('[DB] Error updating photo:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Store face data for a user
 * @param {string} userId - The user ID
 * @param {object} faceData - The face data object
 * @returns {Promise<object>} Result with success status
 */
export const storeFaceData = async (userId, faceData) => {
  try {
    const timestamp = new Date().toISOString();
    
    const item = {
      user_id: userId,
      face_data: faceData,
      created_at: timestamp,
      updated_at: timestamp,
      id: `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    const command = new PutCommand({
      TableName: TABLES.FACE_DATA,
      Item: item
    });
    
    await docClient.send(command);
    
    return { 
      success: true, 
      data: item 
    };
  } catch (error) {
    console.error('[DB] Error storing face data:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get face data for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Result with face data
 */
export const getFaceData = async (userId) => {
  try {
    const command = new DocQueryCommand({
      TableName: TABLES.FACE_DATA,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: 1,
      ScanIndexForward: false // Get most recent
    });
    
    const response = await docClient.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      return { 
        success: false, 
        error: 'Face data not found' 
      };
    }
    
    return { 
      success: true, 
      data: response.Items[0].face_data 
    };
  } catch (error) {
    console.error('[DB] Error getting face data:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Create a user record
 * @param {object} userData - The user data object
 * @returns {Promise<object>} Result with success status
 */
export const createUserRecord = async (userData) => {
  try {
    // Add timestamps if not present
    const timestamp = new Date().toISOString();
    const userWithTimestamps = {
      ...userData,
      created_at: userData.created_at || timestamp,
      updated_at: userData.updated_at || timestamp
    };
    
    const command = new PutCommand({
      TableName: TABLES.USERS,
      Item: userWithTimestamps
    });
    
    await docClient.send(command);
    
    return { 
      success: true, 
      data: userWithTimestamps 
    };
  } catch (error) {
    console.error('[DB] Error creating user record:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get a user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Result with user data
 */
export const getUserById = async (userId) => {
  try {
    const command = new GetCommand({
      TableName: TABLES.USERS,
      Key: { id: userId }
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      return { 
        success: false, 
        error: 'User not found' 
      };
    }
    
    return { 
      success: true, 
      data: response.Item 
    };
  } catch (error) {
    console.error('[DB] Error getting user:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Store a face match record
 * @param {object} matchData - The match data object
 * @returns {Promise<object>} Result with success status
 */
export const storeFaceMatch = async (matchData) => {
  try {
    const timestamp = new Date().toISOString();
    
    const item = {
      ...matchData,
      created_at: timestamp,
      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    const command = new PutCommand({
      TableName: TABLES.FACE_MATCHES,
      Item: item
    });
    
    await docClient.send(command);
    
    return { 
      success: true, 
      data: item 
    };
  } catch (error) {
    console.error('[DB] Error storing face match:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export default {
  createPhotoRecord,
  getPhotoById,
  getPhotosByUserId,
  updatePhotoRecord,
  storeFaceData,
  getFaceData,
  createUserRecord,
  getUserById,
  storeFaceMatch
}; 