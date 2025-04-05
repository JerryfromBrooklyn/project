// index-dynamo.mjs - Lambda function for user signup with DynamoDB integration
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  DescribeUserPoolCommand 
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Initialize clients
const region = process.env.AWS_REGION || 'us-east-1';
const userPoolId = process.env.USER_POOL_ID || 'us-east-1_wXi7yGqKw';

const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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
    
    await docClient.send(new PutCommand({
      TableName: "shmong-users",
      Item: userItem
    }));
    
    console.log(`User ${userId} saved to DynamoDB successfully`);
    return true;
  } catch (error) {
    console.error("Error saving user to DynamoDB:", error);
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
    
    await docClient.send(new PutCommand({
      TableName: "shmong-face-data",
      Item: faceItem
    }));
    
    console.log(`Initial face mapping created for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error creating face mapping:", error);
    return false;
  }
}

export const handler = async (event) => {
  // Log the incoming event for debugging
  console.log('Received event:', JSON.stringify(event, null, 4));
  
  // Parse the body from the Lambda URL event
  let body;
  if (event.body) {
    body = JSON.parse(event.body);
  } else if (event.email) {
    // Handle direct invocations with parameters
    body = event;
  } else {
    // Handle malformed request
    return {
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
  }
  
  // Extract parameters
  const { email, password, fullName, role } = body;
  
  if (!email || !password) {
    return {
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