import * as faceMatchingService from '../services/faceMatchingService'; // Adjust path if needed
import * as databaseService from '../services/databaseService'; // Adjust path if needed
import { randomUUID } from 'crypto'; // For generating user IDs
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const USER_TABLE = 'shmong-users';
const SALT_ROUNDS = 10;

// --- Helper Function for Responses ---
const createResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*", // Allow requests from any origin (adjust for production)
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        body: JSON.stringify(body),
    };
};

// --- Lambda Handler --- 
export const handler = async (event) => {
    try {
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

        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (error) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid request body' })
            };
        }

        // Validate request parameters
        const { email, password, fullName, role = 'attendee' } = requestBody;
        if (!email || !password || !fullName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email, password, and fullName are required' })
            };
        }

        // Check if user already exists
        const checkParams = {
            TableName: USER_TABLE,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase()
            }
        };

        const existingUser = await dynamoDB.query(checkParams).promise();
        if (existingUser.Items && existingUser.Items.length > 0) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ message: 'User with this email already exists' })
            };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Generate unique user ID
        const userId = uuidv4();
        const timestamp = new Date().toISOString();

        // Create new user
        const newUser = {
            userId,
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        // Save user to DynamoDB
        const putParams = {
            TableName: USER_TABLE,
            Item: newUser
        };

        await dynamoDB.put(putParams).promise();

        // Return successful response
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'User registered successfully',
                user: {
                    userId,
                    email: email.toLowerCase(),
                    fullName,
                    role
                }
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        
        // Return error response
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: process.env.DEBUG === 'true' ? error.message : undefined
            })
        };
    }
};
