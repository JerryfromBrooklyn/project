import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient, CreateCollectionCommand, ListCollectionsCommand, DeleteCollectionCommand } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';
// Load environment variables if running in Node.js directly
if (typeof import.meta === 'undefined') {
    dotenv.config();
}
// Helper function to get environment variables from either Vite or Node
function getEnvVariable(name, defaultValue) {
    // Check if we're in Vite context
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[name] || process.env[name] || defaultValue || '';
    }
    // Otherwise use Node.js process.env
    return process.env[name] || defaultValue || '';
}
// AWS Configuration
export const AWS_REGION = getEnvVariable('VITE_AWS_REGION', 'us-east-1');
export const AWS_ACCESS_KEY_ID = getEnvVariable('VITE_AWS_ACCESS_KEY_ID');
export const AWS_SECRET_ACCESS_KEY = getEnvVariable('VITE_AWS_SECRET_ACCESS_KEY');
// Validate AWS credentials
console.log('[DEBUG] AWS Configuration:');
console.log('[DEBUG] - Region:', AWS_REGION);
console.log('[DEBUG] - Access Key ID:', AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 4)}...` : 'Not set');
console.log('[DEBUG] - Secret Access Key:', AWS_SECRET_ACCESS_KEY ? 'Set (hidden)' : 'Not set');
console.log('[DEBUG] - Collection ID:', getEnvVariable('VITE_AWS_COLLECTION_ID', 'shmong-faces'));
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error('[ERROR] AWS credentials are not properly configured. Face detection and matching will not work.');
}
// Face recognition configuration
export const FACE_MATCH_THRESHOLD = 95; // Set to 95% for optimal balance
export const COLLECTION_ID = getEnvVariable('VITE_AWS_COLLECTION_ID', 'shmong-faces');
// Initialize S3 Client
export const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
// Initialize Rekognition Client
export const rekognitionClient = new RekognitionClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
// Initialize collection on app start
export const initializeCollection = async () => {
    try {
        console.log('Checking for existing face collection...');
        // First check if collection exists
        const listCollections = await rekognitionClient.send(new ListCollectionsCommand({}));
        const collectionExists = listCollections.CollectionIds?.includes(COLLECTION_ID);
        if (!collectionExists) {
            // Delete if exists (to handle edge cases)
            try {
                console.log('Attempting to delete existing collection if present...');
                await rekognitionClient.send(new DeleteCollectionCommand({
                    CollectionId: COLLECTION_ID
                }));
                console.log('Existing collection deleted successfully');
            }
            catch (error) {
                // Ignore errors if collection doesn't exist
                console.log('No existing collection found to delete');
            }
            console.log('Creating new face collection...');
            await rekognitionClient.send(new CreateCollectionCommand({
                CollectionId: COLLECTION_ID,
                Tags: {
                    Environment: 'production',
                    Application: 'shmong'
                }
            }));
            console.log('Face collection created successfully');
        }
        else {
            console.log('Face collection already exists');
        }
        return true;
    }
    catch (error) {
        console.error('Error initializing face collection:', error);
        throw error;
    }
};
// Initialize collection
initializeCollection().catch(console.error);
// Test AWS Rekognition connectivity
export const testRekognitionConnectivity = async () => {
    try {
        console.log('[DEBUG] Testing AWS Rekognition connectivity...');
        const listCollections = await rekognitionClient.send(new ListCollectionsCommand({}));
        console.log('[DEBUG] Successfully connected to AWS Rekognition');
        console.log('[DEBUG] Available collections:', listCollections.CollectionIds);
        return true;
    }
    catch (error) {
        console.error('[ERROR] Failed to connect to AWS Rekognition:', error);
        return false;
    }
};
// Run connectivity test
testRekognitionConnectivity().then(result => {
    if (result) {
        console.log('[INFO] AWS Rekognition is properly configured and working');
    }
    else {
        console.error('[ERROR] AWS Rekognition is not working. Face detection will be disabled.');
    }
});
// AWS Configuration Constants
export const AWS_CONFIG = {
    REGION: "us-east-1",
    REKOGNITION_COLLECTION_ID: "shmong-faces",
    FACE_MATCH_THRESHOLD: 95
};
