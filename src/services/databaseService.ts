import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand, // To save items
    UpdateCommand, // To update items (like linking user)
    QueryCommand, // To find items (like user by faceId or photos by userId)
    ScanCommand,
    GetCommand, // Added for single item fetch
    BatchGetCommand // Added for batch item fetch
} from "@aws-sdk/lib-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { AttributeValue } from '@aws-sdk/client-dynamodb';

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
export async function saveDetectedFaceToDB(
    photoId: string,
    anonymousFaceId: string,
    boundingBox: any
): Promise<void> {
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
    } catch (error: any) {
        // Handle potential condition check failure gracefully if needed
        if (error.name === 'ConditionalCheckFailedException') {
            console.warn(`DB: Detected face ${anonymousFaceId} for photo ${photoId} already exists.`);
        } else {
            console.error(`DB Error saving detected face ${anonymousFaceId}:`, error);
            throw error; // Re-throw other errors
        }
    }
}

/**
 * Links a detected face (anonymous) to a registered user by updating the userId.
 */
export async function linkDetectedFaceToUser(
    anonymousFaceId: string,
    matchedCanonicalFaceId: string
): Promise<void> {
    console.log(`DB: Attempting to link anonymous face ${anonymousFaceId} to user with canonical face ${matchedCanonicalFaceId}`);

    let userIdToLink: string | null = null;
    try {
        // Query GSI on Users table
        const userQueryCmd = new QueryCommand({
           TableName: USERS_TABLE,
           IndexName: "RekognitionFaceIdIndex",
           KeyConditionExpression: "rekognitionFaceId = :faceId",
           ExpressionAttributeValues: { ":faceId": matchedCanonicalFaceId },
           ProjectionExpression: "userId",
           Limit: 1
       });
       const userQueryResult = await docClient.send(userQueryCmd);
       if (userQueryResult.Items && userQueryResult.Items.length > 0) {
           userIdToLink = userQueryResult.Items[0].userId;
           console.log(`DB: Found userId ${userIdToLink} for canonicalFaceId ${matchedCanonicalFaceId}`);
       }
    } catch (error: any) {
        if (error.name === 'ValidationException' && error.message.includes('Index not found')) {
             console.error("DB Error: RekognitionFaceIdIndex does not exist on Users table. Cannot efficiently query by FaceId. Please create the GSI.");
        } else {
            console.error(`DB Error finding user for canonical face ${matchedCanonicalFaceId}:`, error);
        }
        return; // Don't proceed if we can't find the user
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

    let itemsToUpdate: { photoId: string; anonymousRekognitionFaceId: string }[] = [];
    try {
        const findItemsQuery = new QueryCommand({
            TableName: DETECTED_FACES_TABLE,
            IndexName: "AnonymousFaceIdIndex",
            KeyConditionExpression: "anonymousRekognitionFaceId = :anonFaceId",
            ExpressionAttributeValues: { ":anonFaceId": anonymousFaceId },
            ProjectionExpression: "photoId, anonymousRekognitionFaceId"
        });
        const findResult = await docClient.send(findItemsQuery);
        if (findResult.Items && findResult.Items.length > 0) {
            itemsToUpdate = findResult.Items as { photoId: string; anonymousRekognitionFaceId: string }[];
            console.log(`DB: Found ${itemsToUpdate.length} DetectedFaces items for anonymousId ${anonymousFaceId}`);
        }
    } catch (error: any) {
        if (error.name === 'ValidationException' && error.message.includes('Index not found')) {
             console.error("DB Error: AnonymousFaceIdIndex does not exist on DetectedFaces table. Cannot efficiently query by anonymousFaceId. Please create the GSI.");
        } else {
            console.error(`DB Error finding items for anonymous face ${anonymousFaceId}:`, error);
        }
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
        } catch (updateError: any) {
             if (updateError.name === 'ConditionalCheckFailedException') {
                 console.warn(`DB: Update condition failed for linking ${item.anonymousRekognitionFaceId} in photo ${item.photoId}. Item might have been deleted.`);
             } else {
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
export async function createUser(userId: string, email: string, passwordHash: string, rekognitionFaceId: string | null = null): Promise<void> {
    console.log(`DB: Creating user ${userId} with email ${email}`);
    const command = new PutCommand({
        TableName: USERS_TABLE,
        Item: {
            userId: userId,
            email: email,
            passwordHash: passwordHash,
            rekognitionFaceId: rekognitionFaceId,
            createdAt: new Date().toISOString(),
        },
        ConditionExpression: "attribute_not_exists(userId)",
    });

    try {
        await docClient.send(command);
        console.log(`DB: Successfully created user ${userId}`);
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.error(`DB Error: User ID ${userId} already exists.`);
            throw new Error(`User ID conflict for ${userId}`); 
        } else {
            console.error(`DB Error creating user ${userId}:`, error);
            throw error;
        }
    }
}

/**
 * Finds a user by their email address.
 * NOTE: Requires a GSI on the email attribute for efficiency.
 * GSI Creation CLI (Run this manually or via console):
 * aws dynamodb update-table --table-name Users --attribute-definitions AttributeName=email,AttributeType=S --global-secondary-index-updates '[{"Create":{"IndexName": "EmailIndex","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput": {"ReadCapacityUnits": 1,"WriteCapacityUnits": 1}}}]'
 */
export async function findUserByEmail(email: string): Promise<any | null> { // Replace 'any' with a User type/interface if defined
    console.log(`DB: Searching for user with email ${email} using EmailIndex`);
    const command = new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "EmailIndex", 
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: { ":e": email },
        Limit: 1
    });

    try {
        const result = await docClient.send(command);
        if (result.Items && result.Items.length > 0) {
            console.log(`DB: Found user with email ${email}`);
            return result.Items[0]; // DocumentClient automatically unmarshalls
        } else {
            console.log(`DB: No user found with email ${email}`);
            return null;
        }
    } catch (error: any) {
         if (error.name === 'ValidationException' && error.message.includes('Index not found')) {
             console.error("DB Error: EmailIndex does not exist on Users table. Cannot efficiently query by email. Please create the GSI.");
             return null; 
         } else {
            console.error(`DB Error finding user by email ${email}:`, error);
            throw error;
         }
    }
}

/**
 * Updates a user record to add their canonical Rekognition Face ID.
 */
export async function saveUserRekognitionFaceId(userId: string, canonicalFaceId: string): Promise<void> {
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
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.error(`DB Error: User ${userId} not found when trying to save face ID.`);
             throw new Error(`User not found: ${userId}`);
        } else {
            console.error(`DB Error updating rekognitionFaceId for user ${userId}:`, error);
            throw error; // Re-throw other errors
        }
    }
}

// --- Placeholder/TODO Functions from previous steps --- >>

// Example: findUserById - Fetches a user by their primary userId
export async function findUserById(userId: string): Promise<any | null> {
  console.log(`DB: Fetching user by ID ${userId}`);
  const command = new GetCommand({ // Use GetCommand for single item fetch by primary key
      TableName: USERS_TABLE,
      Key: { userId: userId }
  });
  try {
    const result = await docClient.send(command);
    if (result.Item) {
        console.log(`DB: Found user ${userId}`);
        return result.Item; // DocumentClient unmarshalls automatically
    } else {
        console.log(`DB: User ${userId} not found.`);
        return null;
    }
  } catch (error) {
    console.error(`DB Error finding user by ID ${userId}:`, error);
    throw error;
  }
}

// Example: savePhoto - Saves basic photo metadata
export async function savePhoto(photoId: string, s3Url: string, uploaderId: string): Promise<void> {
  console.log(`DB: Saving photo metadata for ${photoId}`);
   const command = new PutCommand({
        TableName: PHOTOS_TABLE,
        Item: {
            photoId: photoId, // Partition Key
            s3Url: s3Url,
            uploaderId: uploaderId,
            createdAt: new Date().toISOString(),
            // Initialize other potentially searchable fields as null or default if needed
            event_details: null,
            venue: null,
            location: null,
            tags: [],
            faces: [],
            matched_users: []
        },
        ConditionExpression: "attribute_not_exists(photoId)", 
    });
    try {
        await docClient.send(command);
        console.log(`DB: Successfully saved photo ${photoId}`);
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.error(`DB Error: Photo ID ${photoId} already exists.`);
            throw new Error(`Photo ID conflict for ${photoId}`); 
        } else {
            console.error(`DB Error creating photo ${photoId}:`, error);
            throw error;
        }
    }
}

// Example: findDetectedFacesByUserId - Requires a GSI on DetectedFaces with userId as the key
// GSI CLI: aws dynamodb update-table --table-name DetectedFaces --attribute-definitions AttributeName=userId,AttributeType=S --global-secondary-index-updates '[{"Create":{"IndexName": "UserIdIndex","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"INCLUDE", "NonKeyAttributes":["photoId", "anonymousRekognitionFaceId"]},"ProvisionedThroughput": {"ReadCapacityUnits": 5,"WriteCapacityUnits": 5}}}]'
export async function findDetectedFacesByUserId(userId: string): Promise<any[]> { // Use a proper DetectedFace type
  console.log(`DB: Finding detected faces for user ${userId} using UserIdIndex`);
  const command = new QueryCommand({
      TableName: DETECTED_FACES_TABLE,
      IndexName: "UserIdIndex", 
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ':uid': userId },
  });
  try {
      const result = await docClient.send(command);
      console.log(`DB: Found ${result.Items?.length ?? 0} detected faces for user ${userId}`);
      return result.Items ?? [];
  } catch(error: any) {
      if (error.name === 'ValidationException' && error.message.includes('Index not found')) {
           console.error("DB Error: UserIdIndex does not exist on DetectedFaces table. Cannot efficiently query by userId. Please create the GSI.");
           return []; 
      } else {
          console.error(`DB Error finding detected faces for user ${userId}:`, error);
          throw error;
      }
  }
}

// Example: findPhotosByIds - Fetches multiple photos by their primary keys
// Note: DynamoDB GetCommand gets one item. Query/Scan can get multiple.
// BatchGetCommand is most efficient for fetching multiple known keys.
// This example uses multiple Query commands for simplicity, BatchGet is better.
export async function findPhotosByIds(photoIds: string[]): Promise<any[]> { // Use a proper Photo type
  if (!photoIds || photoIds.length === 0) return [];
  if (photoIds.length > 100) {
      console.warn("findPhotosByIds: Exceeded maximum batch size (100), only fetching first 100.");
      photoIds = photoIds.slice(0, 100);
  }
  console.log(`DB: Finding photos for ${photoIds.length} IDs using BatchGet`);
  
  const keys = photoIds.map(id => ({ photoId: id }));

  const command = new BatchGetCommand({
      RequestItems: {
          [PHOTOS_TABLE]: { // Table name as key
              Keys: keys
          }
      }
  });

  try {
      const result = await docClient.send(command);
      const photos = result.Responses?.[PHOTOS_TABLE] ?? [];
      console.log(`DB: Found ${photos.length} photos.`);
      // Handle unprocessed keys if necessary (result.UnprocessedKeys)
      return photos;
  } catch (error) {
      console.error(`DB Error finding photos by IDs:`, error);
      throw error;
  }
}
// << ----------------------------- 