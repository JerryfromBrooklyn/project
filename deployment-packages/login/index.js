const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize AWS clients
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const USER_TABLE = 'shmong-users';
const JWT_SECRET = process.env.JWT_SECRET || 'shmong-jwt-secret-key';

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Invalid request body',
          error: 'The request body could not be parsed as JSON'
        })
      };
    }

    // Validate request parameters
    const { email, password } = requestBody;
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Email and password are required',
          error: 'Missing required fields'
        })
      };
    }

    // Find user by email
    const queryParams = {
      TableName: USER_TABLE,
      IndexName: 'EmailIndex', // Using the GSI on email
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    console.log('Querying users by email:', email);
    const userResult = await dynamoDB.query(queryParams).promise();
    
    // Check if user exists
    if (!userResult.Items || userResult.Items.length === 0) {
      console.log('User not found with email:', email);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          message: 'Authentication failed',
          error: 'Invalid email or password'
        })
      };
    }

    const user = userResult.Items[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          message: 'Authentication failed',
          error: 'Invalid email or password'
        })
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name || '',
        hasFaceRegistered: !!user.rekognitionFaceId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return successful response with token and user data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          hasFaceRegistered: !!user.rekognitionFaceId
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: process.env.DEBUG === 'true' ? error.message : 'An unexpected error occurred'
      })
    };
  }
}; 