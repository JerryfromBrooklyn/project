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
 * Store face data in DynamoDB
 * @param {Object} faceData - Face data object to store
 * @returns {Promise<Object>} Result with success status
 */
export const storeFaceData = async (faceData) => {
  try {
    console.log('[Database] Storing face data in DynamoDB');
    
    if (!faceData.user_id || !faceData.face_id) {
      console.error('[Database] Missing required fields (user_id, face_id)');
      return {
        success: false,
        error: 'Missing required fields'
      };
    }
    
    // Ensure timestamps are set
    if (!faceData.created_at) {
      faceData.created_at = new Date().toISOString();
    }
    if (!faceData.updated_at) {
      faceData.updated_at = new Date().toISOString();
    }
    
    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLES.FACE_DATA,
      Item: faceData
    }));
    
    console.log('[Database] Face data stored successfully');
    
    return {
      success: true,
      data: faceData
    };
  } catch (error) {
    console.error('[Database] Error storing face data:', error);
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
    
    // First try to use DynamoDB Query with the new GSI which is more efficient than scanning
    try {
      // Using QueryCommand with the UserIdCreatedAtIndex GSI for efficient timestamp-sorted retrieval
      const queryCommand = new QueryCommand({
        TableName: TABLES.FACE_DATA,
        IndexName: 'UserIdCreatedAtIndex', // Using the new GSI
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        },
        ScanIndexForward: false // Sort by most recent first (descending)
      });
      
      console.log(`[DB] Executing direct query for userId: ${userId} using UserIdCreatedAtIndex GSI`);
      const queryResponse = await client.send(queryCommand);
      
      if (queryResponse.Items && queryResponse.Items.length > 0) {
        // The items are already sorted by created_at descending due to the GSI
        // Find active records first, then fall back to others
        let activeRecords = queryResponse.Items.filter(item => 
          item.status && item.status.S === 'active'
        );
        
        // Get the most recent active record or the most recent record if no active records
        const record = activeRecords.length > 0 ? activeRecords[0] : queryResponse.Items[0];
        
        console.log(`[DB] Found face data using GSI query, status: ${record.status?.S || 'unknown'}`);
        console.log(`[DB] Selected face record with ID: ${record.faceId?.S}, created at: ${record.created_at?.S}`);
        console.log(`[DB] Record keys: ${Object.keys(record).join(', ')}`);
        console.log(`[DB] Has face_attributes: ${!!record.face_attributes}`);
        
        // Directly inspect the raw face_attributes field to understand its format
        if (record.face_attributes) {
          console.log(`[DB] 🔍 face_attributes format: ${typeof record.face_attributes}`);
          
          // Check if it's a DynamoDB 'S' type (String)
          if (record.face_attributes.S) {
            console.log(`[DB] 🔍 face_attributes is a DynamoDB String (S type)`);
            console.log(`[DB] 🔍 face_attributes length: ${record.face_attributes.S.length}`);
            console.log(`[DB] 🔍 face_attributes preview: ${record.face_attributes.S.substring(0, 50)}...`);
          }
          // Check if it's a DynamoDB 'M' type (Map)
          else if (record.face_attributes.M) {
            console.log(`[DB] 🔍 face_attributes is a DynamoDB Map (M type)`);
            console.log(`[DB] 🔍 face_attributes keys: ${Object.keys(record.face_attributes.M).join(', ')}`);
          }
          else {
            console.log(`[DB] 🔍 face_attributes has unknown format:`, record.face_attributes);
          }
        }
        
        // Extract face attributes if they exist and parse them
        let faceAttributes = null;
        
        // IMPROVED EXTRACTION LOGIC:
        // Try multiple paths to find face attributes in different formats
        
        // 1. First try the direct face_attributes field (string format)
        if (record.face_attributes && record.face_attributes.S) {
          try {
            faceAttributes = JSON.parse(record.face_attributes.S);
            console.log(`[DB] ✅ Successfully parsed face attributes from face_attributes.S field`);
            console.log(`[DB] 📊 Parsed attributes keys: ${Object.keys(faceAttributes).join(', ')}`);
          } catch (parseError) {
            console.error(`[DB] ❌ Error parsing face_attributes.S:`, parseError);
            console.error(`[DB] ❌ Raw value that failed parsing: ${typeof record.face_attributes.S === 'string' ? record.face_attributes.S.substring(0, 100) : 'Not a string'}`);
          }
        } 
        // 2. Try face_attributes as Map format
        else if (record.face_attributes && record.face_attributes.M) {
          console.log(`[DB] 🔄 Found face_attributes as Map, using directly`);
          
          // Convert DynamoDB M type to regular object
          faceAttributes = {};
          
          // Extract each field from the map
          Object.entries(record.face_attributes.M).forEach(([key, value]) => {
            if (value.S) faceAttributes[key] = value.S;
            else if (value.N) faceAttributes[key] = parseFloat(value.N);
            else if (value.BOOL !== undefined) faceAttributes[key] = value.BOOL;
            else if (value.M) {
              // Recursively process nested maps
              faceAttributes[key] = {};
              Object.entries(value.M).forEach(([nestedKey, nestedValue]) => {
                if (nestedValue.S) faceAttributes[key][nestedKey] = nestedValue.S;
                else if (nestedValue.N) faceAttributes[key][nestedKey] = parseFloat(nestedValue.N);
                else if (nestedValue.BOOL !== undefined) faceAttributes[key][nestedKey] = nestedValue.BOOL;
              });
            }
          });
          
          console.log(`[DB] 📊 Extracted Map attributes:`, Object.keys(faceAttributes));
        }
        // 3. Try extracting from face_data.face_detail as fallback
        else if (record.face_data && record.face_data.M && record.face_data.M.face_detail) {
          console.log(`[DB] 🔄 Fallback: Extracting attributes from face_data.face_detail`);
          try {
            const faceDetail = record.face_data.M.face_detail.M;
            
            // Build a new attributes object from the nested structure
            faceAttributes = {
              AgeRange: faceDetail.AgeRange?.M ? {
                Low: parseInt(faceDetail.AgeRange.M.Low?.N || 0, 10),
                High: parseInt(faceDetail.AgeRange.M.High?.N || 0, 10)
              } : null,
              Gender: faceDetail.Gender?.M ? {
                Value: faceDetail.Gender.M.Value?.S || "Unknown",
                Confidence: parseFloat(faceDetail.Gender.M.Confidence?.N || 0)
              } : null,
              Emotions: faceDetail.Emotions?.L ? 
                faceDetail.Emotions.L.map(emotion => ({
                  Type: emotion.M.Type?.S || "Unknown",
                  Confidence: parseFloat(emotion.M.Confidence?.N || 0)
                })) : [],
              Smile: faceDetail.Smile?.M ? {
                Value: faceDetail.Smile.M.Value?.BOOL || false,
                Confidence: parseFloat(faceDetail.Smile.M.Confidence?.N || 0)
              } : null,
              // Add other important attributes
              Confidence: record.face_data.M.confidence?.N ? 
                parseFloat(record.face_data.M.confidence.N) : 0,
              BoundingBox: record.face_data.M.bounding_box?.M ? {
                Width: parseFloat(record.face_data.M.bounding_box.M.Width?.N || 0),
                Height: parseFloat(record.face_data.M.bounding_box.M.Height?.N || 0),
                Left: parseFloat(record.face_data.M.bounding_box.M.Left?.N || 0),
                Top: parseFloat(record.face_data.M.bounding_box.M.Top?.N || 0)
              } : null
            };
            
            console.log(`[DB] 📊 Extracted fallback attributes from face_detail:`, 
              Object.keys(faceAttributes));
            
            // Add the extracted attributes back to the record for future use
            // This ensures we won't need to extract again next time
            try {
              const attributesJson = JSON.stringify(faceAttributes);
              const updateCommand = new UpdateItemCommand({
                TableName: TABLES.FACE_DATA,
                Key: {
                  userId: { S: userId },
                  faceId: { S: record.faceId.S }
                },
                UpdateExpression: "SET face_attributes = :attrs",
                ExpressionAttributeValues: {
                  ":attrs": { S: attributesJson }
                }
              });
              
              await client.send(updateCommand);
              console.log(`[DB] ✅ Successfully added extracted face_attributes to record`);
            } catch (updateError) {
              console.error(`[DB] ⚠️ Failed to update record with extracted attributes:`, updateError);
            }
          } catch (extractError) {
            console.error(`[DB] ❌ Error extracting attributes from face_data:`, extractError);
          }
        }
        // 4. Try building from individual flattened attributes
        else if (record.age_range_low || record.gender || record.primary_emotion) {
          console.log(`[DB] 🔄 Building attributes from flattened fields`);
          
          try {
            faceAttributes = {
              AgeRange: record.age_range_low?.N ? {
                Low: parseInt(record.age_range_low.N, 10),
                High: parseInt(record.age_range_high?.N || record.age_range_low.N, 10)
              } : null,
              Gender: record.gender?.S ? {
                Value: record.gender.S,
                Confidence: parseFloat(record.gender_confidence?.N || "0")
              } : null,
              Emotions: record.primary_emotion?.S ? [
                {
                  Type: record.primary_emotion.S,
                  Confidence: parseFloat(record.primary_emotion_confidence?.N || "0")
                }
              ] : []
            };
            
            console.log(`[DB] 📊 Built attributes from flattened fields:`, 
              Object.keys(faceAttributes));
              
            // Add these as face_attributes for future use
            try {
              const attributesJson = JSON.stringify(faceAttributes);
              const updateCommand = new UpdateItemCommand({
                TableName: TABLES.FACE_DATA,
                Key: {
                  userId: { S: userId },
                  faceId: { S: record.faceId.S }
                },
                UpdateExpression: "SET face_attributes = :attrs",
                ExpressionAttributeValues: {
                  ":attrs": { S: attributesJson }
                }
              });
              
              await client.send(updateCommand);
              console.log(`[DB] ✅ Successfully added built face_attributes to record`);
            } catch (updateError) {
              console.error(`[DB] ⚠️ Failed to update record with built attributes:`, updateError);
            }
          } catch (buildError) {
            console.error(`[DB] ❌ Error building attributes from flattened fields:`, buildError);
          }
        }
        else {
          console.warn(`[DB] ⚠️ No face_attributes found or not in expected format`);
        }
        
        // Construct response with all available data - consistently use snake_case for keys
        return { 
          success: true, 
          data: {
            user_id: record.userId?.S, // Convert camelCase to snake_case
            face_id: record.faceId?.S, // Convert camelCase to snake_case
            status: record.status?.S || 'unknown',
            public_url: record.public_url?.S,
            created_at: record.created_at?.S,
            updated_at: record.updated_at?.S,
            face_attributes: faceAttributes
          }
        };
      }
      
      console.log(`[DB] No records found with GSI query, trying alternative methods`);
    } catch (queryError) {
      console.log(`[DB] GSI Query failed:`, queryError.message);
    }
    
    // If GSI query doesn't work, try regular query with client-side sorting (our existing fix as fallback)
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
      
      console.log(`[DB] Executing fallback query for userId: ${userId}`);
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
        
        console.log(`[DB] Found face data using fallback query, status: ${record.status?.S || 'unknown'}`);
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
        
        // Construct response with all available data - consistently use snake_case
        return { 
          success: true, 
          data: {
            user_id: record.userId?.S, // Convert camelCase to snake_case
            face_id: record.faceId?.S, // Convert camelCase to snake_case
            status: record.status?.S || 'unknown',
            public_url: record.public_url?.S,
            created_at: record.created_at?.S,
            updated_at: record.updated_at?.S,
            face_attributes: faceAttributes
          }
        };
      }
      
      console.log(`[DB] No records found with fallback query, trying alternative methods`);
    } catch (queryError) {
      console.log(`[DB] Fallback Query failed:`, queryError.message);
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
 * Store a face match in DynamoDB
 * @param {Object} matchData - Match data object to store
 * @returns {Promise<Object>} Result with success status
 */
export const storeFaceMatch = async (matchData) => {
  try {
    console.log('[Database] Storing face match in DynamoDB');
    
    if (!matchData.user_id || !matchData.face_id) {
      console.error('[Database] Missing required fields for match');
      return {
        success: false,
        error: 'Missing required fields'
      };
    }
    
    // Generate a match ID if not provided
    if (!matchData.id) {
      matchData.id = `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Ensure timestamps are set
    if (!matchData.created_at) {
      matchData.created_at = new Date().toISOString();
    }
    
    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLES.FACE_MATCHES,
      Item: matchData
    }));
    
    console.log('[Database] Face match stored successfully');
    
    return {
      success: true,
      data: matchData
    };
  } catch (error) {
    console.error('[Database] Error storing face match:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Utility function to directly inspect a DynamoDB item - for debugging
 * @param {string} tableName - The table name
 * @param {object} key - The primary key of the item
 * @returns {Promise<object>} The item from DynamoDB
 */
export const inspectDynamoDBItem = async (tableName, key) => {
  try {
    console.log(`[DB-DEBUG] 🔍 Inspecting item in ${tableName} with key:`, key);
    
    const command = new GetCommand({
      TableName: tableName,
      Key: key
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      console.log(`[DB-DEBUG] ⚠️ No item found with the provided key`);
      return { success: false, error: 'Item not found' };
    }
    
    console.log(`[DB-DEBUG] ✅ Item found:`, response.Item);
    
    // Deep attribute inspection
    let attributesInfo = {};
    for (const [key, value] of Object.entries(response.Item)) {
      let valueInfo = {
        type: typeof value,
        isNull: value === null,
        isUndefined: value === undefined,
        length: typeof value === 'string' ? value.length : null
      };
      
      // Handle special DynamoDB attribute inspections
      if (key === 'face_attributes' || key === 'attributes' || key.includes('attribute')) {
        try {
          if (typeof value === 'string') {
            // Try to parse it if it's a JSON string
            const parsed = JSON.parse(value);
            valueInfo.parsed = {
              type: typeof parsed,
              isObject: typeof parsed === 'object',
              keys: parsed ? Object.keys(parsed) : null,
              preview: JSON.stringify(parsed).substring(0, 100) + '...'
            };
          }
        } catch (e) {
          valueInfo.parseError = e.message;
        }
      }
      
      attributesInfo[key] = valueInfo;
    }
    
    console.log(`[DB-DEBUG] 📊 Attributes analysis:`, attributesInfo);
    
    return { 
      success: true, 
      data: response.Item,
      attributesInfo
    };
  } catch (error) {
    console.error('[DB-DEBUG] ❌ Error inspecting DynamoDB item:', error);
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
  storeFaceMatch,
  inspectDynamoDBItem
}; 