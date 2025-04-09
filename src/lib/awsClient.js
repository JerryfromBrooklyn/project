import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
// Only import dotenv in Node.js environments
import 'cross-fetch';

// Load environment variables in Node.js environment (not browser)
if (typeof process !== 'undefined' && !process.browser && typeof require !== 'undefined') {
    try {
        // Dynamic import for dotenv in Node.js only
        const dotenv = require('dotenv');
        dotenv.config();
    } catch (e) {
        console.warn('Could not load dotenv in Node.js environment:', e);
    }
}

// Helper function to get environment variables from either Vite or Node.js process
const getEnvVar = (key, defaultValue = '') => {
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || process.env[key] || defaultValue;
    }
    // For Node.js
    return process.env[key] || defaultValue;
};

// Environment variables
export const AWS_REGION = getEnvVar('VITE_AWS_REGION', 'us-east-1');
export const AWS_ACCESS_KEY_ID = getEnvVar('VITE_AWS_ACCESS_KEY_ID');
export const AWS_SECRET_ACCESS_KEY = getEnvVar('VITE_AWS_SECRET_ACCESS_KEY');

// Rekognition configuration
export const COLLECTION_ID = getEnvVar('VITE_AWS_COLLECTION_ID', 'shmong-faces');
export const FACE_MATCH_THRESHOLD = 80; // Minimum confidence score for face matches

// Cognito configuration
export const COGNITO_USER_POOL_ID = getEnvVar('VITE_COGNITO_USER_POOL_ID', 'us-east-1_wXi7yGqKw');
export const COGNITO_CLIENT_ID = getEnvVar('VITE_COGNITO_CLIENT_ID');
export const COGNITO_IDENTITY_POOL_ID = getEnvVar('VITE_COGNITO_IDENTITY_POOL_ID');

// S3 buckets
export const FACE_DATA_BUCKET = 'shmong-face-data';
export const PHOTO_BUCKET = 'shmong';

// DynamoDB tables
export const USERS_TABLE = 'shmong-users';
export const PHOTOS_TABLE = 'shmong-photos';
export const FACE_DATA_TABLE = 'shmong-face-data';
export const FACE_MATCHES_TABLE = 'shmong-face-matches';

// Check for missing credentials
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error('[ERROR] AWS credentials are not properly configured. AWS services will not work properly.');
}

// Create shared client instances with authentication
const credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
};
console.log('[AWS CLIENT] Creating AWS clients with region:', AWS_REGION);

// Create client instances with additional logging
console.log('[AWS CLIENT] Creating Cognito client...');
export const cognitoClient = new CognitoIdentityProviderClient({
    region: AWS_REGION,
    credentials
});
console.log('[AWS CLIENT] Cognito client created successfully');

// Create other client instances
console.log('[AWS CLIENT] Creating DynamoDB client...');
export const dynamoClient = new DynamoDBClient({
    region: AWS_REGION,
    credentials
});

// Create DynamoDB Document Client
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
        wrapNumbers: false,
    },
});
export const rekognitionClient = new RekognitionClient({
    region: AWS_REGION,
    credentials
});
export const s3Client = new S3Client({
    region: AWS_REGION,
    credentials
});

// Function to get current credentials - useful for credentials refresh
export const getCredentials = () => credentials;
export default {
    dynamoClient,
    docClient,
    rekognitionClient,
    s3Client,
    cognitoClient,
    getCredentials,
    // Configuration
    AWS_REGION,
    COLLECTION_ID,
    FACE_MATCH_THRESHOLD,
    COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID,
    COGNITO_IDENTITY_POOL_ID,
    // Buckets & Tables
    FACE_DATA_BUCKET,
    PHOTO_BUCKET,
    USERS_TABLE,
    PHOTOS_TABLE,
    FACE_DATA_TABLE,
    FACE_MATCHES_TABLE
};

// Test AWS connectivity
export const testRekognitionConnectivity = async () => {
    try {
        // Import dynamically to avoid issues with Vite/bundling
        const { ListCollectionsCommand } = await import('@aws-sdk/client-rekognition');
        const command = new ListCollectionsCommand({});
        const response = await rekognitionClient.send(command);
        return !!response.CollectionIds;
    }
    catch (error) {
        console.error('[ERROR] AWS Rekognition connectivity test failed:', error);
        return false;
    }
};
