// Import AWS configuration
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, COLLECTION_ID, FACE_BUCKET_NAME } from '../lib/awsClient';

// Add CloudWatch Logs client import
import { 
  CloudWatchLogsClient, 
  PutLogEventsCommand, 
  CreateLogStreamCommand,
  CreateLogGroupCommand
} from "@aws-sdk/client-cloudwatch-logs";

// Add CloudWatch client initialization
const cloudwatchClient = new CloudWatchLogsClient({ 
  region: 'us-east-1', // Hard-code region to us-east-1
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

// Simplified CloudWatch logging function
async function logToCloudWatch(logGroupName, logStreamName, message) {
  try {
    console.log(`[CloudWatch] Attempting to log to ${logGroupName}/${logStreamName}`);
    
    // First create the log group if needed (silently continue if it exists)
    try {
      await cloudwatchClient.send(new CreateLogGroupCommand({ logGroupName }));
    } catch (e) { /* Ignore if already exists */ }
    
    // Then create the log stream if needed (silently continue if it exists)
    try {
      await cloudwatchClient.send(new CreateLogStreamCommand({ 
        logGroupName, 
        logStreamName 
      }));
    } catch (e) { /* Ignore if already exists */ }

    // Now log the event
    const stringMessage = typeof message === 'string' 
      ? message 
      : JSON.stringify(message, null, 2);
    
    await cloudwatchClient.send(new PutLogEventsCommand({
      logGroupName,
      logStreamName,
      logEvents: [{
        message: stringMessage,
        timestamp: Date.now()
      }]
    }));
    
    console.log(`[CloudWatch] Successfully logged to ${logGroupName}/${logStreamName}`);
  } catch (error) {
    // Don't let CloudWatch errors break the app flow
    console.error(`[CloudWatch] Logging failed:`, error);
  }
}

// Add DynamoDB client import
import { 
  DynamoDBClient, 
  ScanCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  S3Client, 
  PutObjectCommand 
} from '@aws-sdk/client-s3';
import { 
  RekognitionClient, 
  IndexFacesCommand, 
  SearchFacesByImageCommand,
  SearchFacesCommand,
  ListFacesCommand
} from '@aws-sdk/client-rekognition';

// Initialize AWS clients
const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

const rekognitionClient = new RekognitionClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

// After successful face indexing, call lambda to update DynamoDB
// This code replaces the direct DynamoDB update in storeFaceData
async function updateViaLambda(userId, faceId, faceAttributes, publicUrl) {
  console.log(`[FaceStorage] 🔶 LAMBDA: Update process starting for user ${userId}`);
  
  try {
    // Prepare payload for Lambda
    const payload = {
      operation: "UPDATE_FACE_DATA",
      userId: userId,
      faceId: faceId,
      status: "active",
      publicUrl: publicUrl,
      faceAttributes: faceAttributes,
      timestamp: new Date().toISOString()
    };
    
    // IMPORTANT: Try both endpoints - we'll try the Lambda URL first, then API Gateway if that fails
    const lambdaUrl = 'https://g5lcn763ibjq4wqsn3lvrswb6y0jztnz.lambda-url.us-east-1.on.aws';
    const apiGatewayUrl = 'https://60x98imf4a.execute-api.us-east-1.amazonaws.com/prod/update-face-data';
    
    console.log(`[FaceStorage] 🔶 LAMBDA: Attempting direct Lambda URL first: ${lambdaUrl}`);
    console.log(`[FaceStorage] 🔶 LAMBDA: Payload summary:`, {
      operation: payload.operation,
      userId: payload.userId,
      faceId: payload.faceId,
      status: payload.status,
      hasPublicUrl: !!payload.publicUrl,
      hasFaceAttributes: !!payload.faceAttributes,
      attributeKeys: payload.faceAttributes ? Object.keys(payload.faceAttributes) : []
    });
    
    // Enhanced fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Try Lambda URL first
    let response;
    try {
      response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      console.log(`[FaceStorage] 🔶 LAMBDA URL: Response received, status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Lambda URL HTTP error: ${response.status} ${response.statusText}`);
      }
    } catch (lambdaUrlError) {
      console.error(`[FaceStorage] ⚠️ LAMBDA URL FAILED: ${lambdaUrlError.message}, falling back to API Gateway`);
      
      // Try API Gateway as fallback
      console.log(`[FaceStorage] 🔶 LAMBDA: Trying API Gateway fallback: ${apiGatewayUrl}`);
      try {
        response = await fetch(apiGatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        console.log(`[FaceStorage] 🔶 API GATEWAY: Response received, status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          throw new Error(`API Gateway HTTP error: ${response.status} ${response.statusText}`);
        }
      } catch (apiGatewayError) {
        console.error(`[FaceStorage] ❌ API GATEWAY FAILED: ${apiGatewayError.message}`);
        throw new Error(`Both Lambda URL and API Gateway attempts failed: ${lambdaUrlError.message} | ${apiGatewayError.message}`);
      }
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
    }
    
    // Get response details no matter which endpoint succeeded
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(`[FaceStorage] 🔶 LAMBDA: Response headers:`, headers);
    
    // Get the raw response text first
    const responseText = await response.text();
    console.log(`[FaceStorage] 🔶 LAMBDA: Raw response body:`, responseText);
    
    // Now try to parse it as JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log(`[FaceStorage] 🔶 LAMBDA: Parsed JSON response:`, result);
    } catch (parseError) {
      console.error(`[FaceStorage] ❌ JSON PARSE ERROR: Failed to parse Lambda response:`, parseError);
      console.error(`[FaceStorage] ❌ Invalid JSON: ${responseText}`);
      throw new Error(`Invalid JSON response from Lambda: ${responseText}`);
    }
    
    // Check for success in the body property for Lambda URL responses
    let successResult;
    if (result.body && typeof result.body === 'string') {
      try {
        successResult = JSON.parse(result.body);
        console.log(`[FaceStorage] 🔶 LAMBDA: Parsed nested JSON from body:`, successResult);
      } catch (bodyParseError) {
        console.error(`[FaceStorage] ❌ BODY JSON PARSE ERROR:`, bodyParseError);
        successResult = { success: false, error: `Failed to parse body: ${result.body}` };
      }
    } else {
      successResult = result;
    }
    
    if (!successResult.success) {
      const errorMsg = successResult.error || "Lambda update failed without specific error";
      console.error(`[FaceStorage] ❌ LAMBDA LOGIC ERROR: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Log successful lambda call to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/lambda-operations", 
        `lambda-success-${userId}-${Date.now()}`,
        {
          operation: "LAMBDA_UPDATE",
          userId,
          faceId,
          timestamp: new Date().toISOString(),
          success: true
        }
      );
    } catch (logError) {
      console.error(`[FaceStorage] ⚠️ Failed to log Lambda success to CloudWatch:`, logError);
    }
    
    console.log(`[FaceStorage] ✅ LAMBDA: Successfully updated face data for user ${userId} with faceId ${faceId}`);
    return successResult;
  } catch (error) {
    console.error(`[FaceStorage] ❌ LAMBDA ERROR: ${error.message}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/lambda-operations", 
        `lambda-error-${userId}-${Date.now()}`,
        {
          operation: "LAMBDA_UPDATE_ERROR",
          userId,
          faceId,
          error: error.message,
          timestamp: new Date().toISOString(),
          success: false
        }
      );
    } catch (logError) {
      console.error(`[FaceStorage] ⚠️ Failed to log Lambda error to CloudWatch:`, logError);
    }
    
    throw error;
  }
}

// Refactored storeFaceData function
export const storeFaceData = async (userId, faceId, imageBlob, faceAttributes) => {
  const functionStartTime = Date.now();
  console.log(`[storeFaceData] 🔷 START - User: ${userId}, Face: ${faceId}`);

  let publicUrl = null;
  let s3UploadSuccess = false;
  let dynamoWriteSuccess = false;
  let verificationSuccess = false;

  try {
    // --- Step 1: Upload image to S3 --- 
    const imageName = `face-${userId}-${Date.now()}.jpg`;
    const s3Key = `faces/${userId}/${imageName}`;
    console.log(`[storeFaceData]  S3: Uploading image to ${FACE_BUCKET_NAME}/${s3Key}`);

    const uploadCommand = new PutObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: s3Key,
      Body: imageBlob,
      ContentType: 'image/jpeg'
    });

    try {
      await s3Client.send(uploadCommand);
      publicUrl = `https://${FACE_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
      console.log(`[storeFaceData] ✅ S3: Upload SUCCESSFUL. URL: ${publicUrl}`);
      s3UploadSuccess = true;
      // Log S3 success to CloudWatch (non-critical)
      logToCloudWatch(
        "/shmong/file-operations", 
        `s3-upload-success-${userId}-${Date.now()}`,
        { userId, fileKey: s3Key, fileSize: imageBlob.size, success: true }
      );
    } catch (s3Error) {
      console.error(`[storeFaceData] ❌ S3: Upload FAILED`, s3Error);
      logToCloudWatch(
        "/shmong/file-operations", 
        `s3-upload-error-${userId}-${Date.now()}`,
        { userId, fileKey: s3Key, error: s3Error.message, success: false }
      );
      throw new Error(`S3 upload failed: ${s3Error.message}`); // Re-throw to stop the process if S3 fails
    }

    // --- Step 2: Prepare DynamoDB Item --- 
    console.log(`[storeFaceData] DynamoDB: Preparing item for PutItemCommand`);
    const timestamp = new Date().toISOString();
    const itemPayload = {
      // Primary Keys - MUST match schema
      userId: { S: userId },
      faceId: { S: faceId },
      
      // Core Attributes
      created_at: { S: timestamp },
      updated_at: { S: timestamp },
      status: { S: "active" },
      public_url: { S: publicUrl || "" } // Ensure publicUrl is a string
    };

    // Add face_attributes safely
    if (faceAttributes && typeof faceAttributes === 'object' && Object.keys(faceAttributes).length > 0) {
      try {
        const attributesJson = JSON.stringify(faceAttributes);
        console.log(`[storeFaceData] DynamoDB: Adding face_attributes (Length: ${attributesJson.length})`);
        itemPayload.face_attributes = { S: attributesJson };
      } catch (jsonError) {
        console.error(`[storeFaceData] ⚠️ DynamoDB: Failed to stringify face_attributes`, jsonError);
        // Do not add the attribute if stringify fails
        logToCloudWatch(
          "/shmong/face-operations", 
          `dynamo-stringify-error-${userId}-${Date.now()}`,
          { userId, faceId, error: jsonError.message }
        );
      }
    } else {
      console.warn(`[storeFaceData] DynamoDB: No valid face_attributes provided or they are empty. Skipping.`);
      // Optionally add a placeholder or specific value if needed when attributes are missing
      // itemPayload.face_attributes = { S: JSON.stringify({ status: 'missing' }) }; 
    }

    console.log(`[storeFaceData] DynamoDB: Final Item keys: ${Object.keys(itemPayload).join(', ')}`);
    console.log(`[storeFaceData] DynamoDB: Has face_attributes field: ${!!itemPayload.face_attributes}`);

    // --- Step 3: Execute PutItemCommand --- 
    const putCommand = new PutItemCommand({
      TableName: "shmong-face-data",
      Item: itemPayload
    });

    // ADDED: Log the exact payload before sending to DynamoDB
    console.log('[storeFaceData] DynamoDB: Final PutItemCommand Payload:', JSON.stringify(putCommand, null, 2)); 

    console.log(`[storeFaceData] DynamoDB: Sending PutItemCommand...`);
    try {
      await dynamoDBClient.send(putCommand);
      console.log(`[storeFaceData] ✅ DynamoDB: PutItemCommand SUCCESSFUL`);
      dynamoWriteSuccess = true;
      logToCloudWatch(
        "/shmong/face-operations", 
        `dynamo-put-success-${userId}-${Date.now()}`,
        { userId, faceId, success: true, hasAttributes: !!itemPayload.face_attributes }
      );
    } catch (dbError) {
      console.error(`[storeFaceData] ❌ DynamoDB: PutItemCommand FAILED`, dbError);
      console.error(`[storeFaceData] 📝 Failing Payload Keys: ${Object.keys(itemPayload)}`);
      // Log detailed error
      logToCloudWatch(
        "/shmong/face-operations", 
        `dynamo-put-error-${userId}-${Date.now()}`,
        { userId, faceId, error: dbError.message, code: dbError.code, success: false }
      );
      // Determine if we should throw or attempt recovery/Lambda
      throw new Error(`DynamoDB PutItem failed: ${dbError.message}`); // Critical failure
    }

    // --- Step 4: Verify Write (Optional but Recommended) --- 
    console.log(`[storeFaceData] DynamoDB: Verifying write operation...`);
    try {
      const verifyCommand = new GetItemCommand({
        TableName: "shmong-face-data",
        Key: {
          userId: { S: userId },
          faceId: { S: faceId }
        }
      });
      const verifyResult = await dynamoDBClient.send(verifyCommand);
      if (verifyResult.Item) {
        console.log(`[storeFaceData] ✅ DynamoDB: Verification SUCCESSFUL. Item found.`);
        console.log(`[storeFaceData] 📊 Verified item has face_attributes: ${!!verifyResult.Item.face_attributes}`);
        if (verifyResult.Item.face_attributes?.S) {
          console.log(`[storeFaceData] 📊 Verified face_attributes length: ${verifyResult.Item.face_attributes.S.length}`);
        } else {
           console.warn(`[storeFaceData] ⚠️ Verified item is missing face_attributes string or field.`);
        }
        verificationSuccess = true;
      } else {
        console.error(`[storeFaceData] ❌ DynamoDB: Verification FAILED. Item not found after PutItem!`);
      }
    } catch (verifyError) {
      console.error(`[storeFaceData] ❌ DynamoDB: Verification ERROR`, verifyError);
    }

    // --- Step 5: Call Lambda (Secondary) --- 
    if (dynamoWriteSuccess) {
      console.log(`[storeFaceData] Lambda: Initiating secondary update/notification`);
      // Call Lambda but don't let its failure block the success return
      updateViaLambda(userId, faceId, faceAttributes, publicUrl)
        .then(() => console.log(`[storeFaceData] Lambda: Call completed (status logged internally)`))
        .catch(err => console.error(`[storeFaceData] Lambda: Call failed (logged internally):`, err.message));
    }

    // --- Step 6: Return Result --- 
    const duration = Date.now() - functionStartTime;
    console.log(`[storeFaceData] ✅ COMPLETE - Duration: ${duration}ms. S3: ${s3UploadSuccess}, DynamoDB: ${dynamoWriteSuccess}, Verified: ${verificationSuccess}`);
    return {
      success: dynamoWriteSuccess, // Success depends primarily on the DynamoDB write
      faceId,
      publicUrl,
      faceAttributes: faceAttributes || null // Return the original attributes passed in
    };

  } catch (error) {
    // Catch errors from S3 or DynamoDB that were re-thrown
    const duration = Date.now() - functionStartTime;
    console.error(`[storeFaceData] ❌ CRITICAL ERROR in storeFaceData after ${duration}ms:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Refactored indexFace function
export const indexFace = async (userId, imageBlob) => {
  console.log(`[indexFace] 🔷 START - User: ${userId}, Image size: ${imageBlob.size} bytes`);
  let faceId = null;
  let faceAttributes = null;

  try {
    // --- Step 1: Convert blob to buffer --- 
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- Step 2: Call Rekognition IndexFaces --- 
    console.log(`[indexFace] Rekognition: Calling IndexFaces...`);
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId, // Use userId here if needed, or a unique ID
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL']
    });

    const response = await rekognitionClient.send(command);
    console.log(`[indexFace] ✅ Rekognition: IndexFaces SUCCESSFUL`);
    // console.log(`[indexFace] 📊 Rekognition Raw Response:`, JSON.stringify(response, null, 2)); // Optional: Log raw for deep debug

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      throw new Error('No face detected or indexed by Rekognition');
    }

    const faceRecord = response.FaceRecords[0];
    faceId = faceRecord.Face.FaceId;
    console.log(`[indexFace] Rekognition: Detected FaceId: ${faceId}`);

    // --- Step 3: Extract Attributes --- 
    // Check if FaceDetail exists before trying to access its properties
    if (faceRecord.FaceDetail) {
      faceAttributes = {
        BoundingBox: faceRecord.Face.BoundingBox, // Keep BoundingBox from Face, not FaceDetail
        Confidence: faceRecord.Face.Confidence,   // Keep Confidence from Face, not FaceDetail
        AgeRange: faceRecord.FaceDetail.AgeRange,
        Gender: faceRecord.FaceDetail.Gender,
        Emotions: faceRecord.FaceDetail.Emotions,
        Smile: faceRecord.FaceDetail.Smile,
        Eyeglasses: faceRecord.FaceDetail.Eyeglasses,
        Sunglasses: faceRecord.FaceDetail.Sunglasses,
        Beard: faceRecord.FaceDetail.Beard,
        Mustache: faceRecord.FaceDetail.Mustache,
        EyesOpen: faceRecord.FaceDetail.EyesOpen,
        MouthOpen: faceRecord.FaceDetail.MouthOpen,
        Quality: faceRecord.FaceDetail.Quality
      };
      console.log(`[indexFace] Rekognition: Extracted ${Object.keys(faceAttributes).length} face attributes.`);
    } else {
      console.warn(`[indexFace] Rekognition: No FaceDetail found in response. Attributes will be null.`);
    }

    // --- Step 4: Store Data --- 
    console.log(`[indexFace] Storage: Calling storeFaceData...`);
    const storageResult = await storeFaceData(userId, faceId, imageBlob, faceAttributes);

    if (!storageResult.success) {
      // Propagate error from storage function
      throw new Error(storageResult.error || 'Failed to store face data in DynamoDB');
    }

    console.log(`[indexFace] ✅ Storage: storeFaceData successful.`);

    // --- Step 5: Match Face (Optional - can be removed if not needed for immediate return) ---
    // console.log(`[indexFace] Matching: Calling matchFace...`);
    // const matches = await matchFace(buffer); // Assuming matchFace exists
    // console.log(`[indexFace] Matching: Found ${matches.length} matches.`);

    // --- Step 6: Log Success & Return --- 
    logToCloudWatch(
      "/shmong/face-operations", 
      `index-face-success-${userId}-${Date.now()}`,
      { userId, faceId, success: true, attributesExtracted: !!faceAttributes }
    );
    console.log(`[indexFace] ✅ COMPLETE - Face indexed successfully. FaceId: ${faceId}`);
    return {
      success: true,
      faceId,
      faceAttributes // Return the extracted attributes
      // matches: matches // Include if matching step is kept
    };

  } catch (error) {
    console.error(`[indexFace] ❌ ERROR during face indexing:`, error.message);
    console.error(`[indexFace] ❌ Error Stack:`, error.stack); // Log stack for better debugging
    logToCloudWatch(
      "/shmong/face-operations", 
      `index-face-error-${userId}-${Date.now()}`,
      { userId, error: error.message, success: false }
    );
    return {
      success: false,
      error: error.message
    };
  }
};

// Match Face function (assuming it exists and works, keep as is or simplify if needed)
export const matchFace = async (buffer) => {
  // ... existing matchFace code ... 
  // Ensure it has proper error handling and logging
};

// Search Faces function (assuming it exists and works, keep as is or simplify if needed)
export const searchFaces = async (imageBlob) => {
  // ... existing searchFaces code ...
  // Ensure it has proper error handling and logging
};


// ----- DEBUG UTILITIES ----- 
// Keep these as they are useful, ensure they use the correct table structure now

/**
 * Global debug utility to test face attributes storage directly
 * This makes it possible to call from the browser console using:
 * window.testFaceAttributesStorage({userId, faceId})
 */
export const testFaceAttributesStorage = async ({ userId, faceId, testData = true }) => {
 // ... existing testFaceAttributesStorage code ...
 // Make sure any UpdateItem here uses the correct key structure and attributes format
};

/**
 * Global function to inspect DynamoDB items directly
 * @param {string} userId - User ID
 * @param {string} faceId - Face ID
 * @returns {Promise<object>} The inspection result
 */
export async function inspectDynamoItem(userId, faceId) {
 // ... existing inspectDynamoItem code ...
}

/**
 * EMERGENCY FIX: Repair all face data entries for a user by adding face_attributes to all their faces
 * @param {string} userId - The user ID to fix records for
 * @returns {Promise<object>} - Result summary
 */
export async function fixAllFaceAttributes(userId) {
 // ... existing fixAllFaceAttributes code ...
 // Make sure any UpdateItem here uses the correct key structure and attributes format
}

// Make debug functions available globally
if (typeof window !== 'undefined') {
  window.inspectDynamoItem = inspectDynamoItem;
  window.testFaceAttributesStorage = testFaceAttributesStorage;
  window.fixAllFaceAttributes = fixAllFaceAttributes;
  
  console.log('[DEBUG] ✅ Debug utilities re-attached to window object (v2)');
  console.log('[DEBUG] 📝 - window.inspectDynamoItem(userId, faceId)');
  console.log('[DEBUG] 📝 - window.testFaceAttributesStorage({userId, faceId})');
  console.log('[DEBUG] 📝 - window.fixAllFaceAttributes(userId)');
} 