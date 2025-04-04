import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminSetUserPasswordCommand,
  ListUserPoolsCommand,
  DescribeUserPoolCommand
} from '@aws-sdk/client-cognito-identity-provider';

// Initialize Cognito client with explicit region
const cognito = new CognitoIdentityProviderClient({ 
  region: 'us-east-1'
});

// Use correct Cognito details from your console
const USER_POOL_ID = 'us-east-1_wXi7yGqKw';
const CLIENT_ID = '6dj7z4am73up31kt5qgdg22c68';

// CORS headers to include in all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Requested-With,Accept',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Parse request body - handle both direct input and API Gateway proxy
    let requestData;
    
    // Log the event to help debug
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    if (event.body) {
      // API Gateway proxy request - body is a JSON string
      requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else if (event.email || event.httpMethod) {
      // Direct invocation with JSON object or test from API Gateway console
      requestData = event;
    } else {
      // No recognizable format
      throw new Error('Invalid request format. Expecting event.body or direct JSON input');
    }
    
    // Extract values regardless of input format
    const email = requestData.email;
    const password = requestData.password;
    const fullName = requestData.fullName;
    const role = requestData.role;
    
    // Log request details
    console.log('Processing signup request:', {
      email,
      fullName,
      role,
      userPoolId: USER_POOL_ID,
      region: 'us-east-1'
    });
    
    // First, get details about the user pool to check password policies
    try {
      const describePoolCommand = new DescribeUserPoolCommand({ UserPoolId: USER_POOL_ID });
      const poolDetails = await cognito.send(describePoolCommand);
      console.log('User Pool details:', JSON.stringify({
        name: poolDetails.UserPool.Name,
        policies: poolDetails.UserPool.Policies,
        schema: poolDetails.UserPool.SchemaAttributes?.map(attr => attr.Name)
      }, null, 2));
    } catch (poolError) {
      console.error('Error getting user pool details:', JSON.stringify(poolError, null, 2));
    }
    
    // Input validation
    if (!email || !password || !fullName) {
      console.log('Validation failed: Missing required fields');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          message: 'Missing required fields' 
        }),
      };
    }
    
    // Ensure strong password that meets most Cognito requirements
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Password must be at least 8 characters long'
        }),
      };
    }
    
    // Create user using AdminCreateUser
    console.log('Creating user with AdminCreateUser');
    
    const createUserParams = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      TemporaryPassword: 'Password1!', // Using a known-good temp password
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
          Value: fullName
        }
      ],
      MessageAction: 'SUPPRESS' // Don't send emails
    };
    
    // Only add custom role if needed
    /* The schema doesn't have custom:role defined, removing this to fix InvalidParameterException
    if (role) {
      createUserParams.UserAttributes.push({
        Name: 'custom:role',
        Value: role
      });
    }
    */
    
    console.log('AdminCreateUser params:', JSON.stringify(createUserParams, null, 2));
    
    try {
      const createUserCommand = new AdminCreateUserCommand(createUserParams);
      const createUserResponse = await cognito.send(createUserCommand);
      console.log('User created successfully:', JSON.stringify(createUserResponse, null, 2));
      
      // Set the permanent password
      const setPasswordParams = {
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true
      };
      
      console.log('Setting permanent password');
      const setPasswordCommand = new AdminSetUserPasswordCommand(setPasswordParams);
      await cognito.send(setPasswordCommand);
      console.log('Password set successfully');
      
      // Return success response
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'User successfully registered and confirmed',
          userId: createUserResponse.User.Username
        }),
      };
    } catch (userCreationError) {
      console.error('Detailed user creation error:', JSON.stringify(userCreationError, null, 2));
      
      // Check for specific errors
      if (userCreationError.name === 'InvalidPasswordException') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: 'Password does not meet requirements: ' + userCreationError.message
          }),
        };
      }
      
      if (userCreationError.name === 'UsernameExistsException') {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: 'Email address already in use'
          }),
        };
      }
      
      // Rethrow to be caught by the main error handler
      throw userCreationError;
    }
  } catch (error) {
    console.error('Error processing request:', JSON.stringify(error, null, 2));
    
    // General error response
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal server error',
        errorType: error.name || 'Unknown',
        errorDetails: error.__type || 'See CloudWatch logs for details'
      }),
    };
  }
}; 