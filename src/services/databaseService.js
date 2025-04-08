import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, // To save items
UpdateCommand, // To update items (like linking user)
QueryCommand // To find items (like user by faceId or photos by userId)
 } from "@aws-sdk/lib-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
// Load region from environment variable, default to us-east-1
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
// Create a DynamoDB client
const dbClient = new DynamoDBClient({
    region: AWS_REGION,
    credentials: fromEnv(),
});
// Create a DocumentClient to work with JSON-like objects
const docClient = DynamoDBDocumentClient.from(dbClient);
const USERS_TABLE = "Users";
const PHOTOS_TABLE = "Photos";
const DETECTED_FACES_TABLE = "DetectedFaces";
/**
 * Saves details about a detected face to the DetectedFaces table.
 */
export async function saveDetectedFaceToDB(photoId, anonymousFaceId, boundingBox) {
    console.log(`DB: Saving detected face ${anonymousFaceId} for photo ${photoId}`);
    const command = new PutCommand({
        TableName: DETECTED_FACES_TABLE,
        Item: {
            photoId: photoId, // Partition Key
            anonymousRekognitionFaceId: anonymousFaceId, // Sort Key
            boundingBox: boundingBox, // Store the bounding box object
            userId: null, // Initially not linked to any user
            createdAt: new Date().toISOString(),
        },
        ConditionExpression: "attribute_not_exists(anonymousRekognitionFaceId)", // Prevent overwriting if it somehow exists (optional)
    });
    try {
        await docClient.send(command);
        console.log(`DB: Successfully saved detected face ${anonymousFaceId}`);
    }
    catch (error) {
        // Handle potential condition check failure gracefully if needed
        if (error.name === 'ConditionalCheckFailedException') {
            console.warn(`DB: Detected face ${anonymousFaceId} for photo ${photoId} already exists.`);
        }
        else {
            console.error(`DB Error saving detected face ${anonymousFaceId}:`, error);
            throw error; // Re-throw other errors
        }
    }
}
/**
 * Links a detected face (anonymous) to a registered user by updating the userId.
 */
export async function linkDetectedFaceToUser(anonymousFaceId, matchedCanonicalFaceId) {
    console.log(`DB: Attempting to link anonymous face ${anonymousFaceId} to user with canonical face ${matchedCanonicalFaceId}`);
    // 1. Find the user based on their canonical FaceId
    // Note: This requires an index on rekognitionFaceId in the Users table for efficiency.
    // For this example, we assume you might query/scan, but an index is better.
    // Creating the index via CLI: aws dynamodb update-table --table-name Users --attribute-definitions AttributeName=rekognitionFaceId,AttributeType=S --global-secondary-index-updates '[{"Create":{"IndexName": "RekognitionFaceIdIndex","KeySchema":[{"AttributeName":"rekognitionFaceId","KeyType":"HASH"}],"Projection":{"ProjectionType":"KEYS_ONLY"},"ProvisionedThroughput": {"ReadCapacityUnits": 1,"WriteCapacityUnits": 1}}}]'
    let userIdToLink = null;
    try {
        // --- This Scan is INEFFICIENT! Use a GSI in production --- >>
        /*
        const scanCommand = new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: "rekognitionFaceId = :faceId",
            ExpressionAttributeValues: {
                ":faceId": matchedCanonicalFaceId,
            },
            ProjectionExpression: "userId",
        });
        const scanResult = await docClient.send(scanCommand);
        if (scanResult.Items && scanResult.Items.length > 0) {
            userIdToLink = scanResult.Items[0].userId;
        }
        */
        // << --- End Inefficient Scan ---
        // Placeholder: Replace with efficient GSI Query
        console.warn("DB TODO: Replace placeholder user lookup with efficient GSI query on Users table (RekognitionFaceIdIndex).");
        // Example GSI Query (if index exists):
        /*
        const queryCommand = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: "RekognitionFaceIdIndex",
            KeyConditionExpression: "rekognitionFaceId = :faceId",
            ExpressionAttributeValues: {
                ":faceId": matchedCanonicalFaceId,
            },
            ProjectionExpression: "userId",
            Limit: 1
        });
        const queryResult = await docClient.send(queryCommand);
        if (queryResult.Items && queryResult.Items.length > 0) {
            userIdToLink = queryResult.Items[0].userId;
            console.log(`DB: Found userId ${userIdToLink} for canonicalFaceId ${matchedCanonicalFaceId}`);
        }
        */
        // Dummy value for now to allow testing the update part
        // REMOVE THIS IN PRODUCTION
        if (matchedCanonicalFaceId.startsWith('dummy-canonical-')) {
            userIdToLink = matchedCanonicalFaceId.replace('dummy-canonical-', 'user-for-');
            console.log(`DB: Using DUMMY userId ${userIdToLink} for linking`);
        }
    }
    catch (error) {
        console.error(`DB Error finding user for canonical face ${matchedCanonicalFaceId}:`, error);
        // Don't proceed if we can't find the user
        return;
    }
    if (!userIdToLink) {
        console.warn(`DB: No user found with canonical FaceId ${matchedCanonicalFaceId}. Cannot link anonymous face ${anonymousFaceId}.`);
        return;
    }
    // 2. Find the DetectedFaces item(s) to update.
    // Since the primary key is photoId + anonymousRekognitionFaceId, we need photoId.
    // This function *doesn't know* the photoId directly.
    // We need to find the photoId associated with the anonymousFaceId first.
    // This requires *another index* on DetectedFaces table GSI: anonymousRekognitionFaceId-index
    // CLI: aws dynamodb update-table --table-name DetectedFaces --attribute-definitions AttributeName=anonymousRekognitionFaceId,AttributeType=S --global-secondary-index-updates '[{"Create":{"IndexName": "AnonymousFaceIdIndex","KeySchema":[{"AttributeName":"anonymousRekognitionFaceId","KeyType":"HASH"}],"Projection":{"ProjectionType":"INCLUDE", "NonKeyAttributes":["photoId"]},"ProvisionedThroughput": {"ReadCapacityUnits": 1,"WriteCapacityUnits": 1}}}]'
    let itemsToUpdate = [];
    try {
        // --- Query GSI to find photoId(s) for the anonymous face --- >>
        console.warn("DB TODO: Replace placeholder detected face lookup with efficient GSI query on DetectedFaces table (AnonymousFaceIdIndex).");
        // Example GSI Query (if index exists):
        /*
        const findItemsQuery = new QueryCommand({
            TableName: DETECTED_FACES_TABLE,
            IndexName: "AnonymousFaceIdIndex",
            KeyConditionExpression: "anonymousRekognitionFaceId = :anonFaceId",
            ExpressionAttributeValues: {
                ":anonFaceId": anonymousFaceId,
            },
            ProjectionExpression: "photoId, anonymousRekognitionFaceId" // Get keys needed for update
        });
        const findResult = await docClient.send(findItemsQuery);
        if (findResult.Items && findResult.Items.length > 0) {
            itemsToUpdate = findResult.Items as { photoId: string; anonymousRekognitionFaceId: string }[];
            console.log(`DB: Found ${itemsToUpdate.length} DetectedFaces items for anonymousId ${anonymousFaceId}`);
        }
        */
        // Dummy value for now - assumes we know the photoId magically
        // REMOVE THIS IN PRODUCTION
        if (anonymousFaceId.startsWith('dummy-anon-')) {
            itemsToUpdate.push({ photoId: 'photo-for-' + anonymousFaceId, anonymousRekognitionFaceId: anonymousFaceId });
            console.log(`DB: Using DUMMY photoId ${itemsToUpdate[0].photoId} for linking`);
        }
    }
    catch (error) {
        console.error(`DB Error finding items for anonymous face ${anonymousFaceId}:`, error);
        return; // Can't update if we can't find the items
    }
    if (itemsToUpdate.length === 0) {
        console.warn(`DB: No DetectedFaces items found for anonymousId ${anonymousFaceId}. Cannot link.`);
        return;
    }
    // 3. Update each found item
    for (const item of itemsToUpdate) {
        const updateCommand = new UpdateCommand({
            TableName: DETECTED_FACES_TABLE,
            Key: {
                photoId: item.photoId, // Partition Key
                anonymousRekognitionFaceId: item.anonymousRekognitionFaceId, // Sort Key
            },
            UpdateExpression: "set userId = :uid",
            ExpressionAttributeValues: {
                ":uid": userIdToLink,
            },
            ConditionExpression: "attribute_exists(anonymousRekognitionFaceId)", // Only update if it exists
            ReturnValues: "UPDATED_NEW",
        });
        try {
            const result = await docClient.send(updateCommand);
            console.log(`DB: Successfully linked anonymous face ${item.anonymousRekognitionFaceId} in photo ${item.photoId} to userId ${userIdToLink}`, result.Attributes);
        }
        catch (updateError) {
            if (updateError.name === 'ConditionalCheckFailedException') {
                console.warn(`DB: Update condition failed for linking ${item.anonymousRekognitionFaceId} in photo ${item.photoId}. Item might have been deleted.`);
            }
            else {
                console.error(`DB Error updating item for linking face ${item.anonymousRekognitionFaceId} in photo ${item.photoId}:`, updateError);
                // Optionally continue to next item or stop
            }
        }
    }
}
// --- NEW Functions for User Management --- >>
/**
 * Creates a new user record in the Users table.
 */
export async function createUser(userId, email, passwordHash) {
    console.log(`DB: Creating user ${userId} with email ${email}`);
    const command = new PutCommand({
        TableName: USERS_TABLE,
        Item: {
            userId: userId, // Partition Key
            email: email,
            passwordHash: passwordHash,
            rekognitionFaceId: null, // Initially null
            createdAt: new Date().toISOString(),
            // Add other user profile fields as needed (e.g., name)
        },
        ConditionExpression: "attribute_not_exists(userId)", // Ensure userId is unique
    });
    try {
        await docClient.send(command);
        console.log(`DB: Successfully created user ${userId}`);
    }
    catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            // This shouldn't happen if userId is a UUID, but handle just in case
            console.error(`DB Error: User ID ${userId} already exists.`);
            throw new Error(`User ID conflict for ${userId}`);
        }
        else {
            console.error(`DB Error creating user ${userId}:`, error);
            throw error; // Re-throw other errors
        }
    }
}
/**
 * Finds a user by their email address.
 * NOTE: Requires a GSI on the email attribute for efficiency.
 * GSI Creation CLI (Run this manually or via console):
 * aws dynamodb update-table --table-name Users --attribute-definitions AttributeName=email,AttributeType=S --global-secondary-index-updates '[{"Create":{"IndexName": "EmailIndex","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput": {"ReadCapacityUnits": 1,"WriteCapacityUnits": 1}}}]'
 */
export async function findUserByEmail(email) {
    console.log(`DB: Searching for user with email ${email}`);
    // IMPORTANT: Querying the GSI is much more efficient than a Scan
    const command = new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "EmailIndex", // Assumes GSI named "EmailIndex" exists with email as partition key
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: {
            ":e": email,
        },
        Limit: 1 // We only expect one user per email
    });
    try {
        const result = await docClient.send(command);
        if (result.Items && result.Items.length > 0) {
            console.log(`DB: Found user with email ${email}`);
            return result.Items[0]; // Return the full user item
        }
        else {
            console.log(`DB: No user found with email ${email}`);
            return null;
        }
    }
    catch (error) {
        // Handle case where the index doesn't exist yet or other errors
        if (error.name === 'ValidationException' && error.message.includes('Index not found')) {
            console.error("DB Error: EmailIndex does not exist on Users table. Cannot efficiently query by email. Please create the GSI.");
            // Optionally fall back to a Scan (INEFFICIENT!) for development, but log error.
            // throw new Error("EmailIndex not found on Users table."); 
            return null; // Or handle differently
        }
        else {
            console.error(`DB Error finding user by email ${email}:`, error);
            throw error;
        }
    }
}
/**
 * Updates a user record to add their canonical Rekognition Face ID.
 */
export async function saveUserRekognitionFaceId(userId, canonicalFaceId) {
    console.log(`DB: Saving canonicalFaceId ${canonicalFaceId} for user ${userId}`);
    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: {
            userId: userId, // Primary key of the user to update
        },
        UpdateExpression: "set rekognitionFaceId = :fid",
        ExpressionAttributeValues: {
            ":fid": canonicalFaceId,
        },
        ConditionExpression: "attribute_exists(userId)", // Ensure the user actually exists
        ReturnValues: "UPDATED_NEW",
    });
    try {
        await docClient.send(command);
        console.log(`DB: Successfully updated rekognitionFaceId for user ${userId}`);
    }
    catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.error(`DB Error: User ${userId} not found when trying to save face ID.`);
            throw new Error(`User not found: ${userId}`);
        }
        else {
            console.error(`DB Error updating rekognitionFaceId for user ${userId}:`, error);
            throw error; // Re-throw other errors
        }
    }
}
// --- TODO: Add functions for --- >>
// - findUserById(userId): Promise<User | null> // Useful for getting user details after login/auth
// - savePhoto(photoId, s3Url, uploaderId): Promise<void>
// - findDetectedFacesByUserId(userId): Promise<DetectedFace[]>
// - findPhotosByIds(photoIds: string[]): Promise<Photo[]>
// << ----------------------------- 
