import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  QueryCommand, 
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand
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
    console.log(`[DB] Getting face data for user ${userId} from DynamoDB`);
    
    // First try to use DynamoDB Query which is more efficient than scanning
    try {
      // Using QueryCommand with userId as the primary key for efficiency
      const queryCommand = new QueryCommand({
        TableName: TABLES.FACE_DATA,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        },
        ScanIndexForward: false // Sort by most recent first (descending)
      });
      
      console.log(`[DB] Executing direct query for userId: ${userId}`);
      const queryResponse = await client.send(queryCommand);
      
      if (queryResponse.Items && queryResponse.Items.length > 0) {
        // Sort the items explicitly by timestamp to guarantee we get the most recent
        const sortedItems = [...queryResponse.Items].sort((a, b) => {
          const aTime = a.updated_at?.S || a.created_at?.S || '';
          const bTime = b.updated_at?.S || b.created_at?.S || '';
          // Sort in descending order (most recent first)
          return bTime.localeCompare(aTime);
        });
        
        // Find active records first, then fall back to others
        let activeRecords = sortedItems.filter(item => 
          item.status && item.status.S === 'active'
        );
        
        // Get the most recent active record or the most recent record if no active records
        const record = activeRecords.length > 0 ? activeRecords[0] : sortedItems[0];
        
        console.log(`[DB] Found face data using efficient query, status: ${record.status?.S || 'unknown'}`);
        console.log(`[DB] Selected face record with ID: ${record.faceId?.S}, created at: ${record.created_at?.S}`);
        
        // Extract face attributes if they exist and parse them
        let faceAttributes = null;
        if (record.face_attributes && record.face_attributes.S) {
          try {
            faceAttributes = JSON.parse(record.face_attributes.S);
            console.log(`[DB] Successfully parsed face attributes for user ${userId}`);
          } catch (parseError) {
            console.error(`[DB] Error parsing face attributes:`, parseError);
          }
        }
        
        // Construct response with all available data
        return { 
          success: true, 
          data: {
            userId: record.userId?.S,
            faceId: record.faceId?.S,
            status: record.status?.S || 'unknown',
            public_url: record.public_url?.S,
            created_at: record.created_at?.S,
            updated_at: record.updated_at?.S,
            face_attributes: faceAttributes
          }
        };
      }
      
      console.log(`[DB] No records found with direct query, trying alternative methods`);
    } catch (queryError) {
      console.log(`[DB] Query failed:`, queryError.message);
    }
    
    // If direct query doesn't work, try with document client
    try {
      console.log(`[DB] Trying document client query`);
      const docQueryCommand = new DocQueryCommand({
        TableName: TABLES.FACE_DATA,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      });
      
      const docResponse = await docClient.send(docQueryCommand);
      
      if (docResponse.Items && docResponse.Items.length > 0) {
        const item = docResponse.Items[0];
        console.log(`[DB] Found face data with document client query`);
        
        // Parse face attributes if needed
        if (typeof item.face_attributes === 'string') {
          try {
            item.face_attributes = JSON.parse(item.face_attributes);
          } catch (parseError) {
            console.error(`[DB] Error parsing face attributes in doc client:`, parseError);
          }
        }
        
        return { 
          success: true, 
          data: item 
        };
      }
    } catch (docError) {
      console.log(`[DB] Document client query failed:`, docError.message);
    }
    
    // If direct queries fail, try the API Gateway endpoint as fallback
    try {
      console.log(`[DB] Trying API Gateway for face data lookup`);
      
      const response = await fetch(
        "https://60x98imf4a.execute-api.us-east-1.amazonaws.com/prod/scan-dynamodb", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            tableName: TABLES.FACE_DATA,
            filterExpression: "userId = :userId",
            expressionValues: {
              ":userId": userId
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Gateway error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.items && result.items.length > 0) {
        const item = result.items[0];
        console.log(`[DB] Found face data via API Gateway`);
        
        // Parse face attributes if they're available as a string
        if (typeof item.face_attributes === 'string') {
          try {
            item.face_attributes = JSON.parse(item.face_attributes);
          } catch (parseError) {
            console.error(`[DB] Error parsing face attributes from API Gateway:`, parseError);
          }
        }
        
        return { 
          success: true, 
          data: item 
        };
      }
    } catch (apiError) {
      console.error(`[DB] API Gateway request failed:`, apiError);
    }
    
    // Last resort: full scan with client-side filtering
    // This is inefficient and should only be used as a fallback
    console.log(`[DB] All optimized queries failed, doing full scan as last resort`);
    
    try {
      const fullScanCommand = new ScanCommand({
        TableName: TABLES.FACE_DATA
      });
      
      const fullScanResponse = await client.send(fullScanCommand);
      console.log(`[DB] Full scan retrieved ${fullScanResponse.Items?.length || 0} items`);
      
      // Log one item to see the structure
      if (fullScanResponse.Items && fullScanResponse.Items.length > 0) {
        const sampleItem = fullScanResponse.Items[0];
        const keys = Object.keys(sampleItem);
        console.log(`[DB] Sample item structure: ${JSON.stringify(keys)}`);
      }
      
      // Look for matching items
      if (fullScanResponse.Items && fullScanResponse.Items.length > 0) {
        console.log(`[DB] Examining scan results for matches`);
        
        // First try to find active record for this user
        const matchingActiveItems = fullScanResponse.Items.filter(item => 
          (item.userId?.S === userId || item.user_id?.S === userId) &&
          item.status?.S === 'active'
        );
        
        // If no active record, look for any record for this user
        const matchingItems = matchingActiveItems.length > 0 ? 
          matchingActiveItems : 
          fullScanResponse.Items.filter(item => 
            item.userId?.S === userId || item.user_id?.S === userId
          );
        
        if (matchingItems.length > 0) {
          const item = matchingItems[0];
          console.log(`[DB] Found matching face data through full scan`);
          
          // Parse face attributes if they exist
          let faceAttributes = null;
          if (item.face_attributes?.S) {
            try {
              faceAttributes = JSON.parse(item.face_attributes.S);
            } catch (parseError) {
              console.error(`[DB] Error parsing face attributes from scan:`, parseError);
            }
          }
          
          return {
            success: true,
            data: {
              userId: item.userId?.S || item.user_id?.S,
              faceId: item.faceId?.S,
              status: item.status?.S || 'unknown',
              public_url: item.public_url?.S,
              created_at: item.created_at?.S,
              updated_at: item.updated_at?.S,
              face_attributes: faceAttributes
            }
          };
        }
      }
    } catch (fullScanError) {
      console.error('[DB] Full scan failed:', fullScanError);
    }
    
    return {
      success: false,
      error: 'No face data found for user'
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