import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize the DynamoDB client
const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';

let client = null;
let docClient = null;

// Create a client with AWS credentials
export const getDynamoClient = () => {
  if (!client) {
    // Configure the client
    client = new DynamoDBClient({ 
      region: REGION,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
      }
    });
  }
  return client;
};

// Create a DynamoDB document client
export const getDocClient = () => {
  if (!docClient) {
    const client = getDynamoClient();
    docClient = DynamoDBDocumentClient.from(client);
  }
  return docClient;
};

// Helper function to query a table
export const queryTable = async (params) => {
  const docClient = getDocClient();
  try {
    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    throw error;
  }
};

// Helper function to update an item
export const updateItem = async (params) => {
  const docClient = getDocClient();
  try {
    return await docClient.send(new UpdateCommand(params));
  } catch (error) {
    console.error('Error updating item in DynamoDB:', error);
    throw error;
  }
}; 