// Simple Lambda function to update face data in DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand,
  ScanCommand 
} = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Lambda received event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse request body
    let body = event.body ? 
      (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : 
      event;
    
    const userId = body.userId;
    const faceId = body.faceId;
    
    if (!userId || !faceId) {
      return formatResponse(400, {
        success: false,
        error: 'Missing required parameters: userId and faceId'
      });
    }
    
    console.log(`Update requested for user ${userId} with faceId ${faceId}`);
    
    // First, look for existing records
    const scanCommand = new ScanCommand({
      TableName: 'shmong-face-data',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });
    
    const scanResult = await docClient.send(scanCommand);
    console.log(`Scan found ${scanResult.Items?.length || 0} matching items`);
    
    // Create record data
    const timestamp = new Date().toISOString();
    const recordData = {
      userId: userId,
      faceId: faceId,
      status: 'active',
      updated_at: timestamp
    };
    
    // If there's an existing record, preserve created_at
    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log('Found existing record, will update');
      recordData.created_at = scanResult.Items[0].created_at || timestamp;
    } else {
      console.log('No existing record found, will create new');
      recordData.created_at = timestamp;
    }
    
    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: 'shmong-face-data',
      Item: recordData
    });
    
    await docClient.send(putCommand);
    console.log('DynamoDB update successful');
    
    return formatResponse(200, {
      success: true,
      userId: userId,
      faceId: faceId,
      message: 'Face data updated successfully'
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return formatResponse(500, {
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
};

function formatResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    },
    body: JSON.stringify(body)
  };
} 