import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
// Only import dotenv in Node.js environments
import 'cross-fetch';
import dotenv from 'dotenv';

// Detect environment
const isNode = typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;
const isBrowser = typeof window !== 'undefined';

// Load environment variables synchronously in Node.js environment
if (isNode) {
    try {
        dotenv.config();
        console.log('Loaded environment variables with dotenv');
    } catch (e) {
        console.warn('Could not load dotenv in Node.js environment:', e);
    }
}

// Debug log environment variables (but mask sensitive values) - Only in Node environment
if (isNode) {
    console.log('[ENV DEBUG] Environment variables loaded:');
    console.log('[ENV DEBUG] AWS_REGION:', process.env.AWS_REGION || process.env.VITE_AWS_REGION || '(not set)');
    console.log('[ENV DEBUG] AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID ? '(set)' : '(not set)');
    console.log('[ENV DEBUG] AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY ? '(set)' : '(not set)');
}

// Helper function to get environment variables from either Vite or Node.js process
const getEnvVar = (key, defaultValue = '') => {
    // For Vite in browser
    if (isBrowser && typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || defaultValue;
    }
    // For Node.js 
    if (isNode) {
        return process.env[key] || defaultValue;
    }
    // Fallback
    return defaultValue;
};

// Try both VITE_* and non-VITE_* versions of environment variables
export const AWS_REGION = getEnvVar('VITE_AWS_REGION') || getEnvVar('AWS_REGION') || 'us-east-1';
export const AWS_ACCESS_KEY_ID = getEnvVar('VITE_AWS_ACCESS_KEY_ID') || getEnvVar('AWS_ACCESS_KEY_ID');
export const AWS_SECRET_ACCESS_KEY = getEnvVar('VITE_AWS_SECRET_ACCESS_KEY') || getEnvVar('AWS_SECRET_ACCESS_KEY');

// Rekognition configuration
export const COLLECTION_ID = getEnvVar('VITE_AWS_COLLECTION_ID') || getEnvVar('REKOGNITION_COLLECTION_ID') || 'shmong-faces';
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
    console.error('[ERROR] Please check your .env file or environment variables.');
    console.error('[ERROR] Required environment variables:');
    console.error('[ERROR] AWS_ACCESS_KEY_ID or VITE_AWS_ACCESS_KEY_ID');
    console.error('[ERROR] AWS_SECRET_ACCESS_KEY or VITE_AWS_SECRET_ACCESS_KEY');
    console.error('[ERROR] AWS_REGION or VITE_AWS_REGION (defaults to us-east-1)');
}

// Create shared client instances with authentication
const credentials = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
} : undefined;

console.log('[AWS CLIENT] Creating AWS clients with region:', AWS_REGION);
console.log('[AWS CLIENT] Using explicit credentials:', !!credentials);
console.log('[AWS CLIENT] If credentials are undefined, AWS SDK will use the credentials provider chain');

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

console.log('[AWS CLIENT] Creating Rekognition client...');
export const rekognitionClient = new RekognitionClient({
    region: AWS_REGION,
    credentials
});
console.log('[AWS CLIENT] Rekognition client created successfully');

console.log('[AWS CLIENT] Creating S3 client...');
export const s3Client = new S3Client({
    region: AWS_REGION,
    credentials
});
console.log('[AWS CLIENT] S3 client created successfully');

// Function to get current credentials - useful for credentials refresh
export const getCredentials = () => credentials;

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

// Add a function to validate AWS configuration is correct
export const validateAwsConfig = async () => {
    try {
        console.log('[AWS CLIENT] Validating AWS configuration...');
        const result = {
            accessKeyConfigured: !!AWS_ACCESS_KEY_ID,
            secretKeyConfigured: !!AWS_SECRET_ACCESS_KEY,
            region: AWS_REGION,
            cognito: {
                userPoolId: COGNITO_USER_POOL_ID,
                userPoolIdConfigured: !!COGNITO_USER_POOL_ID,
                clientId: COGNITO_CLIENT_ID,
                clientIdConfigured: !!COGNITO_CLIENT_ID,
                identityPoolId: COGNITO_IDENTITY_POOL_ID,
                identityPoolIdConfigured: !!COGNITO_IDENTITY_POOL_ID
            },
            rekognition: {
                collectionId: COLLECTION_ID,
                collectionIdConfigured: !!COLLECTION_ID
            },
            s3Buckets: {
                faceLivenessOutputBucket: FACE_DATA_BUCKET,
                faceLivenessOutputBucketConfigured: !!FACE_DATA_BUCKET
            },
            dynamodbTables: {
                usersTable: USERS_TABLE,
                usersTableConfigured: !!USERS_TABLE
            }
        };

        // Test Rekognition connectivity
        const rekognitionConnected = await testRekognitionConnectivity();
        result.rekognition.connected = rekognitionConnected;

        return {
            success: true,
            ...result
        };
    } catch (error) {
        console.error('[AWS CLIENT] Validation error:', error);
        return {
            success: false,
            error: error.message,
            errorType: error.name,
            errorStack: error.stack
        };
    }
};

// Helper to debug Face Liveness session issues
export const debugFaceLivenessSession = async (sessionId) => {
    try {
        if (!sessionId) {
            return {
                success: false,
                error: "No session ID provided"
            };
        }
        
        console.log('[AWS CLIENT] Debugging Face Liveness session:', sessionId);
        
        // Import dynamically to avoid issues with Vite/bundling
        const { GetFaceLivenessSessionResultsCommand } = await import('@aws-sdk/client-rekognition');
        
        // Create command
        const command = new GetFaceLivenessSessionResultsCommand({
            SessionId: sessionId
        });
        
        // Send the command
        console.log('[AWS CLIENT] Sending GetFaceLivenessSessionResults command');
        const response = await rekognitionClient.send(command);
        
        return {
            success: true,
            sessionExists: true,
            status: response.Status,
            confidence: response.Confidence,
            hasReferenceImage: !!response.ReferenceImage,
            hasAuditImages: !!(response.AuditImages && response.AuditImages.length > 0),
            auditImagesCount: response.AuditImages?.length || 0,
            rawResponse: response
        };
    } catch (error) {
        console.error('[AWS CLIENT] Face Liveness session debug error:', error);
        
        return {
            success: false,
            sessionExists: false,
            error: error.message,
            errorName: error.name,
            errorType: error.$metadata?.httpStatusCode === 404 ? 'SESSION_NOT_FOUND' : 
                       error.$metadata?.httpStatusCode === 403 ? 'PERMISSION_DENIED' : 
                       'UNKNOWN_ERROR',
            httpStatusCode: error.$metadata?.httpStatusCode,
            requestId: error.$metadata?.requestId
        };
    }
};

// Helper function to check camera availability and capabilities
export const checkCameraForFaceLiveness = async () => {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.mediaDevices) {
        console.warn('[AWS CLIENT] mediaDevices API not available');
        return { 
            available: false, 
            error: 'Camera API not supported in this environment'
        };
    }

    try {
        console.log('[AWS CLIENT] Checking camera availability for Face Liveness');
        const constraints = { 
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        };
        
        console.log('[AWS CLIENT] Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const videoTracks = stream.getVideoTracks();
        console.log('[AWS CLIENT] Camera access granted with tracks:', videoTracks.length);
        
        // Log track information
        const trackInfo = videoTracks.map(track => ({
            label: track.label,
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            settings: track.getSettings ? track.getSettings() : null,
            constraints: track.getConstraints ? track.getConstraints() : null
        }));
        
        // Always stop the tracks
        videoTracks.forEach(track => track.stop());
        
        return {
            available: true,
            trackCount: videoTracks.length,
            tracks: trackInfo
        };
    } catch (error) {
        console.error('[AWS CLIENT] Camera check failed:', error);
        
        let errorType = 'unknown';
        let errorMessage = 'Unknown camera error';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorType = 'permission_denied';
            errorMessage = 'Camera permission was denied by the user';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorType = 'device_not_found';
            errorMessage = 'No camera device found on this system';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorType = 'device_in_use';
            errorMessage = 'Camera is already in use by another application';
        } else if (error.name === 'OverconstrainedError') {
            errorType = 'constraints_error';
            errorMessage = 'Camera constraints cannot be satisfied';
        }
        
        return {
            available: false,
            error: errorMessage,
            errorType: errorType,
            errorName: error.name,
            errorMessage: error.message
        };
    }
};

// Update the exported object with new functions
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
    FACE_MATCHES_TABLE,
    // Helper functions
    testRekognitionConnectivity,
    validateAwsConfig,
    debugFaceLivenessSession,
    checkCameraForFaceLiveness
};
