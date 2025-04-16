// Lambda function to update face data in DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// CloudWatch logging client
const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, CreateLogGroupCommand } = require('@aws-sdk/client-cloudwatch-logs');
const cloudwatchClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Log to CloudWatch
async function logToCloudWatch(logGroupName, logStreamName, message) {
  try {
    // Create log group if needed
    try {
      await cloudwatchClient.send(new CreateLogGroupCommand({ logGroupName }));
      console.log(`Created log group: ${logGroupName}`);
    } catch (e) {
      // Ignore if it already exists
      if (e.name !== 'ResourceAlreadyExistsException') {
        console.error(`Error creating log group: ${e.message}`);
      }
    }
    
    // Create log stream if needed
    try {
      await cloudwatchClient.send(new CreateLogStreamCommand({
        logGroupName,
        logStreamName
      }));
      console.log(`Created log stream: ${logStreamName} in ${logGroupName}`);
    } catch (e) {
      // Ignore if it already exists
      if (e.name !== 'ResourceAlreadyExistsException') {
        console.error(`Error creating log stream: ${e.message}`);
      }
    }
    
    // Write log entry
    const params = {
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message: typeof message === 'string' ? message : JSON.stringify(message),
          timestamp: Date.now()
        }
      ]
    };
    
    await cloudwatchClient.send(new PutLogEventsCommand(params));
    console.log(`Logged to CloudWatch: ${logGroupName}/${logStreamName}`);
  } catch (error) {
    console.error(`Failed to log to CloudWatch: ${error.message}`);
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Lambda received event:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  try {
    // Enhanced logging to troubleshoot request format
    console.log('Event type:', typeof event);
    console.log('Event keys:', Object.keys(event));
    if (event.body) {
      console.log('Body type:', typeof event.body);
      console.log('Raw body:', event.body);
    }
    
    // Parse event body if it's a string (API Gateway integration)
    let body;
    
    if (event.body) {
      // API Gateway event format
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log('Parsed body from API Gateway:', JSON.stringify(body, null, 2));
      } catch (parseError) {
        console.error('Error parsing event body:', parseError);
        throw new Error(`Invalid JSON in request body: ${event.body}`);
      }
    } else {
      // Direct Lambda invocation format
      body = event;
      console.log('Using direct event as body:', JSON.stringify(body, null, 2));
    }
    
    // Extract parameters with additional logging
    const userId = body.userId;
    const faceId = body.faceId;
    const status = body.status || 'active';
    const publicUrl = body.publicUrl;
    const faceAttributes = body.faceAttributes;
    
    console.log('Extracted parameters:', { userId, faceId, status });
    
    if (!userId || !faceId) {
      throw new Error('Missing required parameters (userId, faceId)');
    }
    
    console.log(`Updating face data for user ${userId} with face ID ${faceId}`);
    
    // Log operation to CloudWatch
    await logToCloudWatch(
      '/shmong/face-operations',
      `lambda-update-${userId}-${Date.now()}`,
      {
        operation: 'LAMBDA_UPDATE_FACE_DATA',
        userId,
        faceId,
        timestamp: new Date().toISOString()
      }
    );
    
    // First try to find any existing records
    const scanCommand = new ScanCommand({
      TableName: 'shmong-face-data',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });
    
    const scanResult = await docClient.send(scanCommand);
    console.log(`Scan found ${scanResult.Items?.length || 0} items`);
    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log('Found user records:', JSON.stringify(scanResult.Items, null, 2));
    }
    
    // Structure for the updated or new record
    const itemData = {
      userId: userId,
      faceId: faceId,
      status: status,
      public_url: publicUrl,
      face_attributes: faceAttributes ? JSON.stringify(faceAttributes) : '{}',
      updated_at: new Date().toISOString()
    };
    
    // If found existing record, preserve any fields we're not explicitly updating
    if (scanResult.Items && scanResult.Items.length > 0) {
      const existingItem = scanResult.Items[0];
      console.log('Found existing item:', JSON.stringify(existingItem, null, 2));
      
      // Preserve created_at from existing record
      if (existingItem.created_at) {
        itemData.created_at = existingItem.created_at;
      } else {
        itemData.created_at = new Date().toISOString();
      }
      
      // Preserve any other fields from existing record
      for (const [key, value] of Object.entries(existingItem)) {
        if (!itemData.hasOwnProperty(key) && key !== 'updated_at') {
          itemData[key] = value;
        }
      }
    } else {
      // New record, add created_at
      itemData.created_at = new Date().toISOString();
    }
    
    console.log('Saving item to DynamoDB:', JSON.stringify(itemData, null, 2));
    
    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: 'shmong-face-data',
      Item: itemData
    });
    
    await docClient.send(putCommand);
    console.log(`Successfully updated face data for user ${userId}`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      '/shmong/face-operations',
      `lambda-success-${userId}-${Date.now()}`,
      {
        operation: 'LAMBDA_UPDATE_FACE_DATA',
        userId,
        faceId,
        status: 'success',
        timestamp: new Date().toISOString()
      }
    );
    
    // Return success response
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        success: true,
        userId,
        faceId,
        message: 'Face data updated successfully'
      })
    };
    
    console.log('Returning response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error updating face data:', error);
    
    // Log error to CloudWatch
    try {
      await logToCloudWatch(
        '/shmong/face-operations',
        `lambda-error-${Date.now()}`,
        {
          operation: 'LAMBDA_UPDATE_FACE_DATA',
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      );
    } catch (logError) {
      console.error('Error logging to CloudWatch:', logError);
    }
    
    // Return error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Error updating face data'
      })
    };
  }
}; 