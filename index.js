// index.js - Lambda function for user signup with DynamoDB integration
const { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  DescribeUserPoolCommand 
} = require("@aws-sdk/client-cognito-identity-provider");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, CreateLogGroupCommand } = require("@aws-sdk/client-cloudwatch-logs");

// Initialize clients
const region = process.env.AWS_REGION || 'us-east-1';
const userPoolId = process.env.USER_POOL_ID || 'us-east-1_wXi7yGqKw';

const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cloudwatchClient = new CloudWatchLogsClient({ region });

// Function to log to CloudWatch
async function logToCloudWatch(logGroupName, logStreamName, message) {
  try {
    // First try to create log group if it doesn't exist
    try {
      await cloudwatchClient.send(
        new CreateLogGroupCommand({
          logGroupName,
        })
      );
      console.log(`[CloudWatch] Created log group: ${logGroupName}`);
    } catch (error) {
      // Ignore if group already exists
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error(`[CloudWatch] Error creating log group: ${error.message}`);
      }
    }
    
    // Try to create log stream if it doesn't exist
    try {
      await cloudwatchClient.send(
        new CreateLogStreamCommand({
          logGroupName,
          logStreamName,
        })
      );
      console.log(`[CloudWatch] Created log stream: ${logStreamName} in group ${logGroupName}`);
    } catch (error) {
      // Ignore if stream already exists
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error(`[CloudWatch] Error creating log stream: ${error.message}`);
      }
    }

    // Log the message
    const params = {
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message: typeof message === 'string' ? message : JSON.stringify(message, null, 2),
          timestamp: Date.now(),
        },
      ],
    };

    await cloudwatchClient.send(new PutLogEventsCommand(params));
    console.log(`[CloudWatch] Successfully logged event to ${logGroupName}/${logStreamName}`);
  } catch (error) {
    console.error(`[CloudWatch] Failed to log to CloudWatch: ${error.message}`);
  }
}

// Function to write user to DynamoDB
async function saveUserToDynamoDB(userId, email, fullName, role) {
  try {
    const userItem = {
      id: userId,
      email: email,
      full_name: fullName,
      role: role || 'attendee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Log the user data we're about to save
    console.log(`[DB] Saving user data to DynamoDB:`, JSON.stringify(userItem, null, 2));
    
    await docClient.send(new PutCommand({
      TableName: "shmong-users",
      Item: userItem
    }));
    
    console.log(`User ${userId} saved to DynamoDB successfully`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/user-operations",
      `user-creation-${userId}-${Date.now()}`,
      {
        operation: "CREATE_USER",
        userId,
        email,
        role,
        timestamp: new Date().toISOString(),
        success: true
      }
    );
    
    return true;
  } catch (error) {
    console.error("Error saving user to DynamoDB:", error);
    
    // Log failure to CloudWatch
    await logToCloudWatch(
      "/shmong/user-operations",
      `user-creation-errors-${Date.now()}`,
      {
        operation: "CREATE_USER",
        userId,
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      }
    );
    
    return false;
  }
}

// Function to write default face mapping (blank) for the user
async function createInitialFaceMapping(userId) {
  try {
    const faceItem = {
      userId: userId,
      faceId: 'default',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Log the face data we're about to save
    console.log(`[DB] Creating initial face mapping:`, JSON.stringify(faceItem, null, 2));
    
    await docClient.send(new PutCommand({
      TableName: "shmong-face-data",
      Item: faceItem
    }));
    
    console.log(`Initial face mapping created for user ${userId}`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations",
      `face-creation-${userId}-${Date.now()}`,
      {
        operation: "CREATE_INITIAL_FACE",
        userId,
        faceId: 'default',
        status: 'pending',
        timestamp: new Date().toISOString(),
        success: true
      }
    );
    
    return true;
  } catch (error) {
    console.error("Error creating face mapping:", error);
    
    // Log failure to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations",
      `face-creation-errors-${Date.now()}`,
      {
        operation: "CREATE_INITIAL_FACE",
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      }
    );
    
    return false;
  }
}

exports.handler = async (event) => {
  // Log the incoming event for debugging
  console.log('Received event:', JSON.stringify(event, null, 4));
  
  // Create request ID for tracking in logs
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  // Log to CloudWatch
  await logToCloudWatch(
    "/shmong/lambda-events",
    `auth-signup-invocations-${Date.now()}`,
    {
      requestId,
      event,
      timestamp: new Date().toISOString()
    }
  );
  
  // Parse the body from the Lambda URL event
  let body;
  if (event.body) {
    body = JSON.parse(event.body);
  } else if (event.email) {
    // Handle direct invocations with parameters
    body = event;
  } else {
    // Handle malformed request
    const errorResponse = {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({ 
        success: false, 
        message: 'Missing required parameters'
      })
    };
    
    // Log error to CloudWatch
    await logToCloudWatch(
      "/shmong/lambda-errors",
      `auth-signup-errors-${Date.now()}`,
      {
        requestId,
        error: "Missing required parameters",
        event,
        timestamp: new Date().toISOString()
      }
    );
    
    return errorResponse;
  }
  
  // Extract parameters
  const { email, password, fullName, role } = body;
  
  if (!email || !password) {
    const errorResponse = {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({ 
        success: false, 
        message: 'Email and password are required'
      })
    };
    
    // Log error to CloudWatch
    await logToCloudWatch(
      "/shmong/lambda-errors",
      `auth-signup-errors-${Date.now()}`,
      {
        requestId,
        error: "Email and password are required",
        timestamp: new Date().toISOString()
      }
    );
    
    return errorResponse;
  }
  
  // Log that we're beginning the signup process
  console.log('Processing signup request:', {
    email, 
    fullName, 
    role,
    userPoolId,
    region
  });
  
  try {
    // Get user pool details for client validation
    const describePoolParams = {
      UserPoolId: userPoolId
    };
    
    const userPoolDetails = await cognitoClient.send(
      new DescribeUserPoolCommand(describePoolParams)
    );
    
    console.log('User Pool details:', JSON.stringify(userPoolDetails.UserPool, null, 4));
    
    // Create user params
    const createUserParams = {
      UserPoolId: userPoolId,
      Username: email,
      TemporaryPassword: 'Password1!',
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        },
        {
          Name: 'name',
          Value: fullName || email.split('@')[0]
        }
      ],
      MessageAction: 'SUPPRESS' // Don't send welcome email
    };
    
    console.log('Creating user with AdminCreateUser');
    console.log('AdminCreateUser params:', JSON.stringify(createUserParams, null, 4));
    
    try {
      // Create the user
      const createUserResult = await cognitoClient.send(
        new AdminCreateUserCommand(createUserParams)
      );
      
      console.log('User created successfully:', JSON.stringify(createUserResult, null, 4));
      
      // Extract generated user ID (sub)
      const userId = createUserResult.User.Attributes.find(
        attr => attr.Name === 'sub'
      ).Value;
      
      // Set the permanent password for the user
      console.log('Setting permanent password');
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: userId,
        Password: password,
        Permanent: true
      }));
      
      console.log('Password set successfully');
      
      // Save user data to DynamoDB
      await saveUserToDynamoDB(userId, email, fullName, role);
      
      // Create initial face mapping
      await createInitialFaceMapping(userId);
      
      // Log success to CloudWatch
      await logToCloudWatch(
        "/shmong/user-operations",
        `user-signup-success-${Date.now()}`,
        {
          requestId,
          userId,
          email,
          role,
          timestamp: new Date().toISOString(),
          success: true
        }
      );
      
      // Return success response
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        body: JSON.stringify({
          success: true,
          message: 'User successfully registered and confirmed',
          userId: userId
        })
      };
    } catch (userCreationError) {
      console.error('Detailed user creation error:', userCreationError);
      
      // Log error to CloudWatch
      await logToCloudWatch(
        "/shmong/lambda-errors",
        `user-creation-errors-${Date.now()}`,
        {
          requestId,
          error: userCreationError.message,
          errorName: userCreationError.name,
          timestamp: new Date().toISOString()
        }
      );
      
      if (userCreationError.name === 'UsernameExistsException') {
        return {
          statusCode: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
          },
          body: JSON.stringify({
            success: false,
            message: 'A user with this email already exists'
          })
        };
      }
      
      throw userCreationError;
    }
  } catch (error) {
    console.error('Error:', error);
    
    // Log error to CloudWatch
    await logToCloudWatch(
      "/shmong/lambda-errors",
      `auth-signup-errors-${Date.now()}`,
      {
        requestId,
        error: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }
    );
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'An error occurred during sign-up'
      })
    };
  }
}; 