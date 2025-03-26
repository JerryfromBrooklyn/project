import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient, CreateCollectionCommand, ListCollectionsCommand, DeleteCollectionCommand } from '@aws-sdk/client-rekognition';
// AWS Configuration
export const AWS_REGION = 'us-east-1';
export const AWS_ACCESS_KEY_ID = 'AKIA3ISBVSQ26AGWN3OT';
export const AWS_SECRET_ACCESS_KEY = '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';
// Face recognition configuration
export const FACE_MATCH_THRESHOLD = 80; // Increased threshold for better accuracy
export const COLLECTION_ID = 'shmong-faces';
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
