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
  PutItemCommand
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
  DetectFacesCommand
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

// Modify the storeFaceData function to use Lambda
export const storeFaceData = async (userId, faceId, imageBlob, faceAttributes) => {
  try {
    console.log(`[FaceStorage] 🔷 START - Storing face data for user: ${userId} with faceId: ${faceId}`);
    console.log(`[FaceStorage] 📊 Face attributes summary:`, {
      age: faceAttributes?.AgeRange,
      gender: faceAttributes?.Gender,
      emotions: faceAttributes?.Emotions?.slice(0, 3),
      confidence: faceAttributes?.Confidence
    });
    
    // First upload the image to S3
    const imageName = `face-${userId}-${Date.now()}.jpg`;
    const s3Key = `faces/${userId}/${imageName}`;
    
    console.log(`[FaceStorage] 🔷 Preparing S3 upload: bucket=${FACE_BUCKET_NAME}, key=${s3Key}`);
    
    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: FACE_BUCKET_NAME,
      Key: s3Key,
      Body: imageBlob,
      ContentType: 'image/jpeg'
    });
    
    try {
      await s3Client.send(uploadCommand);
      console.log(`[FaceStorage] ✅ Face image uploaded to S3: ${s3Key}`);
    } catch (s3Error) {
      console.error(`[FaceStorage] ❌ S3 UPLOAD FAILED:`, s3Error);
      console.error(`[FaceStorage] 📝 S3 error details:`, {
        message: s3Error.message,
        code: s3Error.code,
        requestId: s3Error.$metadata?.requestId
      });
      throw s3Error;
    }
    
    // Log S3 upload to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/file-operations", 
        `file-upload-${userId}-${Date.now()}`,
        {
          operation: "UPLOAD_FILE",
          userId,
          fileKey: s3Key,
          fileType: 'image/jpeg',
          fileSize: imageBlob.size,
          bucket: FACE_BUCKET_NAME,
          timestamp: new Date().toISOString(),
          success: true
        }
      );
      console.log(`[FaceStorage] ✅ S3 upload logged to CloudWatch`);
    } catch (logError) {
      console.error(`[FaceStorage] ⚠️ Failed to log S3 upload to CloudWatch:`, logError);
    }
    
    // Generate a public URL for the image
    const publicUrl = `https://${FACE_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    console.log(`[FaceStorage] 🔗 Generated public URL: ${publicUrl}`);
    
    let lambdaSuccess = false;
    
    // Try Lambda first
    console.log(`[FaceStorage] 🔷 STEP 1: Attempting Lambda update with faceId: ${faceId}`);
    try {
      await updateViaLambda(userId, faceId, faceAttributes, publicUrl);
      console.log(`[FaceStorage] ✅ Lambda update SUCCESSFUL`);
      lambdaSuccess = true;
    } catch (lambdaError) {
      console.error(`[FaceStorage] ❌ LAMBDA UPDATE FAILED:`, lambdaError);
      console.error(`[FaceStorage] 📝 Lambda error details:`, {
        message: lambdaError.message,
        stack: lambdaError.stack,
        name: lambdaError.name
      });
    }
    
    // Always try direct DynamoDB update as well, to ensure data is saved
    console.log(`[FaceStorage] 🔷 STEP 2: Attempting direct DynamoDB update (Lambda success: ${lambdaSuccess})`);
    
    try {
      // Create a properly formatted DynamoDB item with all required fields
      const item = {
        userId: { S: userId },
        faceId: { S: faceId },
        status: { S: "active" },
        updated_at: { S: new Date().toISOString() },
        created_at: { S: new Date().toISOString() },
        public_url: { S: publicUrl }
      };
      
      // Add face attributes if provided
      if (faceAttributes) {
        console.log(`[FaceStorage] 📊 Adding face attributes to DynamoDB item`);
        item.face_attributes = { S: JSON.stringify(faceAttributes) };
      }
      
      console.log(`[FaceStorage] 🔷 DynamoDB put operation preparing:`, {
        table: "shmong-face-data", 
        keys: Object.keys(item),
        itemSize: JSON.stringify(item).length
      });
      
      const putCommand = new PutItemCommand({
        TableName: "shmong-face-data",
        Item: item
      });
      
      await dynamoDBClient.send(putCommand);
      console.log(`[FaceStorage] ✅ Direct DynamoDB update SUCCESSFUL`);
      
      // Log successful DynamoDB write to CloudWatch
      try {
        await logToCloudWatch(
          "/shmong/face-operations", 
          `dynamo-direct-write-${userId}-${Date.now()}`,
          {
            operation: "DIRECT_DYNAMODB_WRITE",
            userId,
            faceId,
            status: "active",
            timestamp: new Date().toISOString(),
            success: true
          }
        );
      } catch (cwError) {
        console.error(`[FaceStorage] ⚠️ Failed to log DynamoDB write to CloudWatch:`, cwError);
      }
    } catch (dbError) {
      console.error(`[FaceStorage] ❌ DIRECT DYNAMODB UPDATE FAILED:`, dbError);
      console.error(`[FaceStorage] 📝 DynamoDB error details:`, {
        message: dbError.message,
        code: dbError.code,
        requestId: dbError.$metadata?.requestId
      });
      
      // If both Lambda and direct DynamoDB failed, we need to throw an error
      if (!lambdaSuccess) {
        throw new Error(`Both Lambda and direct DynamoDB updates failed: ${dbError.message}`);
      }
    }
    
    // Log overall operation summary to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-storage-summary-${userId}-${Date.now()}`,
      {
        operation: "SAVE_FACE_DATA",
        userId,
        faceId,
        publicUrl,
        faceAttributesKeys: Object.keys(faceAttributes || {}),
        lambdaUpdateSuccess: lambdaSuccess,
        directDynamoUpdateAttempted: true,
        timestamp: new Date().toISOString(),
        success: true
      }
    );
    
    console.log(`[FaceStorage] ✅ COMPLETE - Face data storage complete for user: ${userId}`);
    return { success: true, faceId, publicUrl };
  } catch (error) {
    console.error('[FaceStorage] ❌ CRITICAL ERROR storing face data:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-storage-errors-${Date.now()}`,
        {
          operation: "SAVE_FACE_DATA",
          userId,
          faceId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return { success: false, error: error.message };
  }
};

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 

// Process face indexing with AWS Rekognition
export const indexFace = async (userId, imageBlob) => {
  try {
    console.log(`[FaceIndexing] 🔷 STARTING FACE INDEXING for user: ${userId}`);
    console.log(`[FaceIndexing] 🔷 Image blob size: ${imageBlob.size} bytes`);
    
    // Convert blob to buffer for AWS SDK
    console.log(`[FaceIndexing] 🔷 Converting image blob to buffer`);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Index face with AWS Rekognition
    console.log(`[FaceIndexing] 🔷 Preparing to call AWS Rekognition IndexFaces API`);
    console.log(`[FaceIndexing] 🔷 Using collection: ${COLLECTION_ID}, external ID: ${userId}`);
    
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      ExternalImageId: userId,
      Image: { Bytes: buffer },
      DetectionAttributes: ['ALL'] // Request all face attributes
    });
    
    console.log(`[FaceIndexing] 🔷 Sending request to AWS Rekognition...`);
    const response = await rekognitionClient.send(command);
    console.log(`[FaceIndexing] ✅ Successfully received response from AWS Rekognition`);
    
    // Log the complete raw response for debugging
    console.log(`[FaceIndexing] 📊 REKOGNITION RAW RESPONSE:`, JSON.stringify(response, null, 2));
    
    // Check for any faces not indexed (errors during processing)
    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      console.warn(`[FaceIndexing] ⚠️ WARNING: ${response.UnindexedFaces.length} faces were not indexed:`, response.UnindexedFaces);
    }
    
    // Log detailed response to browser for debugging
    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceAttributes = response.FaceRecords[0].FaceDetail;
      
      // Detailed face attributes logging with emotion scores
      const emotions = faceAttributes.Emotions ? 
        faceAttributes.Emotions.map(emotion => `${emotion.Type}: ${emotion.Confidence.toFixed(2)}%`).join(', ') : 
        'No emotions detected';
      
      console.log(`[FaceIndexing] 📊 FACE ATTRIBUTES SUMMARY:`);
      console.log(`[FaceIndexing] 📊 - Face ID: ${response.FaceRecords[0].Face.FaceId}`);
      console.log(`[FaceIndexing] 📊 - Confidence: ${response.FaceRecords[0].Face.Confidence.toFixed(2)}%`);
      console.log(`[FaceIndexing] 📊 - Age Range: ${faceAttributes.AgeRange?.Low}-${faceAttributes.AgeRange?.High} years`);
      console.log(`[FaceIndexing] 📊 - Gender: ${faceAttributes.Gender?.Value} (${faceAttributes.Gender?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Emotions: ${emotions}`);
      console.log(`[FaceIndexing] 📊 - Smiling: ${faceAttributes.Smile?.Value ? 'Yes' : 'No'} (${faceAttributes.Smile?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Glasses: ${faceAttributes.Eyeglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Eyeglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Sunglasses: ${faceAttributes.Sunglasses?.Value ? 'Yes' : 'No'} (${faceAttributes.Sunglasses?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Beard: ${faceAttributes.Beard?.Value ? 'Yes' : 'No'} (${faceAttributes.Beard?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mustache: ${faceAttributes.Mustache?.Value ? 'Yes' : 'No'} (${faceAttributes.Mustache?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Eyes Open: ${faceAttributes.EyesOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.EyesOpen?.Confidence.toFixed(2)}%)`);
      console.log(`[FaceIndexing] 📊 - Mouth Open: ${faceAttributes.MouthOpen?.Value ? 'Yes' : 'No'} (${faceAttributes.MouthOpen?.Confidence.toFixed(2)}%)`);
      
      // Additional face quality metrics
      if (faceAttributes.Quality) {
        console.log(`[FaceIndexing] 📊 - Image Quality: Brightness: ${faceAttributes.Quality.Brightness.toFixed(2)}, Sharpness: ${faceAttributes.Quality.Sharpness.toFixed(2)}`);
      }
      
      // Bounding box for face location
      if (response.FaceRecords[0].Face.BoundingBox) {
        const bb = response.FaceRecords[0].Face.BoundingBox;
        console.log(`[FaceIndexing] 📊 - Face Position: Left: ${bb.Left.toFixed(2)}, Top: ${bb.Top.toFixed(2)}, Width: ${bb.Width.toFixed(2)}, Height: ${bb.Height.toFixed(2)}`);
      }
    }
    
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      const errorMsg = 'No face detected in the image';
      console.error(`[FaceIndexing] ❌ ERROR: ${errorMsg}`);
      
      // Log failure to CloudWatch
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: errorMsg,
          success: false
        }
      );
      
      throw new Error(errorMsg);
    }
    
    const faceRecord = response.FaceRecords[0];
    const faceId = faceRecord.Face.FaceId;
    console.log(`[FaceIndexing] 🔑 Generated face ID: ${faceId}`);
    
    // Extract face attributes from the response
    const faceAttributes = {
      BoundingBox: faceRecord.Face.BoundingBox,
      Confidence: faceRecord.Face.Confidence,
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
    
    // Store face data in DynamoDB with image and attributes
    console.log(`[FaceIndexing] 🔷 Storing face data in DynamoDB with ID: ${faceId}`);
    await storeFaceData(userId, faceId, imageBlob, faceAttributes);
    console.log(`[FaceIndexing] ✅ Face data stored successfully in DynamoDB`);
    
    // After indexing, match against all faces to find similar faces
    console.log(`[FaceIndexing] 🔍 Matching face against existing collection`);
    const matches = await matchFace(buffer);
    console.log(`[FaceIndexing] 🔍 Found ${matches.length} similar faces in collection`);
    
    // Log success to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-indexing-${userId}-${Date.now()}`,
      {
        operation: "INDEX_FACE",
        userId,
        faceId,
        timestamp: new Date().toISOString(),
        faceAttributes: {
          ageRange: faceRecord.FaceDetail.AgeRange,
          gender: faceRecord.FaceDetail.Gender,
          topEmotion: faceRecord.FaceDetail.Emotions?.[0] || {},
          allEmotions: faceRecord.FaceDetail.Emotions,
          smile: faceRecord.FaceDetail.Smile,
          eyeglasses: faceRecord.FaceDetail.Eyeglasses,
          beard: faceRecord.FaceDetail.Beard,
          quality: faceRecord.FaceDetail.Quality
        },
        confidence: faceRecord.Face.Confidence,
        imageId: faceRecord.Face.ImageId,
        boundingBox: faceRecord.Face.BoundingBox,
        externalImageId: faceRecord.Face.ExternalImageId,
        matchesFound: matches.length,
        success: true
      }
    );
    
    console.log(`[FaceIndexing] ✅ COMPLETE - Face successfully indexed with ID: ${faceId}`);
    
    return {
      success: true,
      faceId,
      matches,
      faceAttributes: faceRecord.FaceDetail  // Include all face attributes in the response
    };
  } catch (error) {
    console.error(`[FaceIndexing] ❌ ERROR indexing face: ${error.message}`);
    console.error(`[FaceIndexing] ❌ Error stack: ${error.stack}`);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-indexing-errors-${Date.now()}`,
        {
          operation: "INDEX_FACE",
          userId,
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error(`[CloudWatch] Failed to log error to CloudWatch:`, logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Process face search with AWS Rekognition
export const searchFaces = async (imageBlob) => {
  try {
    // Convert blob to buffer for AWS SDK
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Search faces in collection 
    const params = {
      CollectionId: COLLECTION_ID,
      Image: { Bytes: buffer },
      MaxFaces: 10,
      FaceMatchThreshold: 80
    };
    
    console.log(`[FaceSearch] Searching for faces in collection: ${COLLECTION_ID}`);
    const command = new SearchFacesByImageCommand(params);
    const response = await rekognitionClient.send(command);
    
    // Add detailed logging
    console.log('[FaceSearch] FULL SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    const matches = response.FaceMatches || [];
    console.log(`[FaceSearch] Found ${matches.length} matching faces`);
    
    // Log to CloudWatch
    await logToCloudWatch(
      "/shmong/face-operations", 
      `face-search-${Date.now()}`,
      {
        operation: "SEARCH_FACE",
        searchParams: {
          collectionId: COLLECTION_ID,
          maxFaces: 10,
          threshold: 80
        },
        timestamp: new Date().toISOString(),
        matchesFound: matches.length,
        matches: matches.map(match => ({
          faceId: match.Face.FaceId,
          similarity: match.Similarity,
          confidence: match.Face.Confidence,
          externalImageId: match.Face.ExternalImageId
        })),
        success: true
      }
    );
    
    return {
      success: true,
      matches
    };
  } catch (error) {
    console.error('[FaceSearch] Error searching faces:', error);
    
    // Log failure to CloudWatch
    try {
      await logToCloudWatch(
        "/shmong/face-operations", 
        `face-search-errors-${Date.now()}`,
        {
          operation: "SEARCH_FACE",
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          success: false
        }
      );
    } catch (logError) {
      console.error('[CloudWatch] Failed to log error to CloudWatch:', logError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}; 