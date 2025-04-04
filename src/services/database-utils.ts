import { 
  DynamoDBClient, 
  PutItemCommand, 
  QueryCommand,
  GetItemCommand,
  ListTablesCommand
} from '@aws-sdk/client-dynamodb';
import { dynamoDBClient, USERS_TABLE } from '../lib/awsClient';
import { marshallItem, unmarshallItem } from '../utils/dynamoUtils';

// Interface to represent a user record
interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create a user record in DynamoDB with extensive error logging
 */
export const createUserRecord = async (user: UserRecord) => {
  console.log('[DATABASE] 📝 Creating user record with data:', JSON.stringify(user, null, 2));
  
  try {
    // Perform connectivity test to DynamoDB first
    console.log('[DATABASE] Testing DynamoDB connectivity before writing...');
    try {
      const tableCheck = await dynamoDBClient.send(new ListTablesCommand({}));
      console.log(`[DATABASE] Successfully connected to DynamoDB! Available tables:`, 
        JSON.stringify(tableCheck.TableNames || [], null, 2));
    } catch (connError) {
      console.error('[DATABASE] ❌ Failed to connect to DynamoDB:', connError);
      return { success: false, error: 'DynamoDB connection failed', details: connError };
    }
    
    // Check if the aws configuration is valid
    if (!dynamoDBClient) {
      console.error('[DATABASE] ❌ DynamoDB client is not initialized');
      return { success: false, error: 'DynamoDB client is not initialized' };
    }
    
    if (!USERS_TABLE) {
      console.error('[DATABASE] ❌ USERS_TABLE name is not defined');
      return { success: false, error: 'USERS_TABLE name is not defined' };
    }
    
    console.log(`[DATABASE] Using table: ${USERS_TABLE}`);
    
    // Check if user already exists
    try {
      const checkParams = {
        TableName: USERS_TABLE,
        Key: {
          id: { S: user.id }
        }
      };
      
      console.log('[DATABASE] Checking if user already exists:', JSON.stringify(checkParams, null, 2));
      
      const existingUser = await dynamoDBClient.send(new GetItemCommand(checkParams));
      
      if (existingUser.Item) {
        console.log('[DATABASE] ℹ️ User already exists:', JSON.stringify(existingUser.Item, null, 2));
        return { success: true, data: unmarshallItem(existingUser.Item) };
      }
    } catch (checkError) {
      console.error('[DATABASE] ⚠️ Error checking for existing user:', checkError);
      // Continue to create user anyway
    }
    
    // Marshall the user data for DynamoDB
    const marshalledItem = marshallItem(user);
    
    console.log('[DATABASE] Marshalled item:', JSON.stringify(marshalledItem, null, 2));
    
    // Create the PutItem command
    const params = {
      TableName: USERS_TABLE,
      Item: marshalledItem
    };

    console.log('[DATABASE] Executing PutItemCommand with params:', JSON.stringify(params, null, 2));
    
    // Add timing for database operation
    const startTime = new Date().getTime();
    
    // Send the command to DynamoDB
    const result = await dynamoDBClient.send(new PutItemCommand(params));
    
    const endTime = new Date().getTime();
    console.log(`[DATABASE] ✅ User record created successfully in ${endTime - startTime}ms`);
    console.log('[DATABASE] DynamoDB response:', JSON.stringify(result, null, 2));
    
    return { success: true, data: user };
  } catch (error) {
    // Detailed error logging
    console.error('[DATABASE] ❌ Failed to create user record:', error);
    
    if (error instanceof Error) {
      console.error('[DATABASE] Error name:', error.name);
      console.error('[DATABASE] Error message:', error.message);
      console.error('[DATABASE] Error stack:', error.stack);
    }
    
    // Check for specific AWS errors
    if ((error as any).$metadata) {
      console.error('[DATABASE] AWS Metadata:', JSON.stringify((error as any).$metadata, null, 2));
      console.error('[DATABASE] HTTP Status Code:', (error as any).$metadata.httpStatusCode);
      
      if ((error as any).$metadata.httpStatusCode === 403) {
        console.error('[DATABASE] ⚠️ PERMISSION DENIED! Your AWS credentials lack permission to write to DynamoDB.');
      }
    }
    
    // Classification of error types for easier diagnosis
    let errorCategory = 'Unknown';
    let errorDetails = '';
    
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        errorCategory = 'Network';
        errorDetails = 'Network connectivity issue - check internet connection';
      } else if (error.message.includes('credentials')) {
        errorCategory = 'Authentication';
        errorDetails = 'Invalid AWS credentials or missing permissions';
      } else if (error.message.includes('validation')) {
        errorCategory = 'Validation';
        errorDetails = 'Invalid data format for DynamoDB';
      } else if (error.message.includes('ResourceNotFoundException')) {
        errorCategory = 'Resource';
        errorDetails = `Table ${USERS_TABLE} doesn't exist`;
      }
    }
    
    console.error(`[DATABASE] Error category: ${errorCategory}`);
    if (errorDetails) console.error(`[DATABASE] Error details: ${errorDetails}`);
    
    // Additional troubleshooting info
    try {
      console.log('[DATABASE] Checking DynamoDB connection...');
      const tables = await dynamoDBClient.send(new ListTablesCommand({}));
      console.log('[DATABASE] DynamoDB connection check result:', JSON.stringify(tables, null, 2));
      
      if (tables.TableNames?.includes(USERS_TABLE)) {
        console.log(`[DATABASE] ✅ Table ${USERS_TABLE} exists!`);
      } else {
        console.error(`[DATABASE] ❌ Table ${USERS_TABLE} NOT FOUND in available tables`);
      }
    } catch (connectionError) {
      console.error('[DATABASE] Failed to check DynamoDB connection:', connectionError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error',
      errorCategory,
      errorDetails,
      details: error 
    };
  }
};

/**
 * Get a user record by ID
 */
export const getUserRecord = async (userId: string) => {
  console.log(`[DATABASE] Getting user record for ID: ${userId}`);
  
  try {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        id: { S: userId }
      }
    };
    
    const result = await dynamoDBClient.send(new GetItemCommand(params));
    
    if (!result.Item) {
      console.log(`[DATABASE] User record not found for ID: ${userId}`);
      return { success: false, error: 'User not found' };
    }
    
    console.log('[DATABASE] User record found:', JSON.stringify(result.Item, null, 2));
    
    return { success: true, data: unmarshallItem(result.Item) };
  } catch (error) {
    console.error('[DATABASE] Failed to get user record:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
};

/**
 * Check if a DynamoDB table exists
 */
export const checkTableExists = async (tableName: string) => {
  try {
    console.log(`[DATABASE] Checking if table exists: ${tableName}`);
    
    const command = new ListTablesCommand({});
    const response = await dynamoDBClient.send(command);
    
    console.log('[DATABASE] Tables found:', JSON.stringify(response.TableNames, null, 2));
    
    return { success: true, exists: response.TableNames?.includes(tableName) };
  } catch (error) {
    console.error('[DATABASE] Failed to check table existence:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
};

export default {
  createUserRecord,
  getUserRecord,
  checkTableExists
}; 