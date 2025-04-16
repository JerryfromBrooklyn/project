const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS clients
const rekognition = new AWS.Rekognition({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const PHOTOS_TABLE = 'shmong-photos';
const FACE_DATA_TABLE = 'shmong-face-data';
const FACE_COLLECTION_ID = 'shmong-faces';
const S3_BUCKET = process.env.PHOTOS_BUCKET || 'shmong-photos';
const SIMILARITY_THRESHOLD = 95;
const MIN_CONFIDENCE = 90;

/**
 * Handles photo upload and face matching
 */
exports.handler = async (event) => {
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
    const { imageData, eventId, description } = requestBody;
    if (!imageData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'imageData is required' })
      };
    }

    // Prepare image data
    let imageBuffer;
    try {
      // Strip the base64 prefix if it exists (e.g., "data:image/jpeg;base64,")
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid image data format' })
      };
    }

    // Generate unique photo ID
    const photoId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Upload photo to S3
    const s3Key = `photos/${photoId}.jpg`;
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: 'image/jpeg'
    };

    await s3.putObject(s3Params).promise();
    
    // Create photo record in DynamoDB
    const photoRecord = {
      photoId,
      s3Key,
      eventId,
      description,
      uploadedAt: timestamp,
      updatedAt: timestamp,
      hasBeenProcessed: false
    };

    const putPhotoParams = {
      TableName: PHOTOS_TABLE,
      Item: photoRecord
    };

    await dynamoDB.put(putPhotoParams).promise();

    // Detect faces in the image
    const detectFacesParams = {
      Image: {
        Bytes: imageBuffer
      },
      Attributes: ['ALL']
    };

    const detectResult = await rekognition.detectFaces(detectFacesParams).promise();
    const faceCount = detectResult.FaceDetails ? detectResult.FaceDetails.length : 0;

    // If no faces are detected, just return the photo record
    if (faceCount === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Photo uploaded successfully. No faces detected.',
          photo: photoRecord,
          faceCount: 0,
          matches: []
        })
      };
    }

    // Index detected faces in Rekognition
    const indexParams = {
      CollectionId: FACE_COLLECTION_ID,
      ExternalImageId: photoId,
      Image: {
        Bytes: imageBuffer
      },
      MaxFaces: 10,
      QualityFilter: 'AUTO',
      DetectionAttributes: ['ALL']
    };

    const indexResult = await rekognition.indexFaces(indexParams).promise();
    const faceRecords = indexResult.FaceRecords || [];
    
    // Store face records and search for matches
    const matches = [];
    
    for (const faceRecord of faceRecords) {
      const faceId = faceRecord.Face.FaceId;
      
      // Save face record to DynamoDB
      const faceData = {
        photoId,
        faceId,
        boundingBox: faceRecord.Face.BoundingBox,
        confidence: faceRecord.Face.Confidence,
        indexedAt: timestamp,
        matchedUserId: null
      };
      
      const putFaceParams = {
        TableName: FACE_DATA_TABLE,
        Item: faceData
      };
      
      await dynamoDB.put(putFaceParams).promise();
      
      // Search for matching faces
      const searchParams = {
        CollectionId: FACE_COLLECTION_ID,
        FaceId: faceId,
        MaxFaces: 1000,
        FaceMatchThreshold: SIMILARITY_THRESHOLD
      };
      console.log('[Upload Handler] Searching for matches with params:', searchParams);
      
      const searchResult = await rekognition.searchFaces(searchParams).promise();
      const faceMatches = searchResult.FaceMatches || [];
      
      for (const match of faceMatches) {
        // Skip if it's a match to the same face
        if (match.Face.FaceId === faceId) continue;
        
        // Look up if this face belongs to a registered user
        const queryParams = {
          TableName: 'shmong-users',
          IndexName: 'RekognitionFaceIdIndex',
          KeyConditionExpression: 'rekognitionFaceId = :faceId',
          ExpressionAttributeValues: {
            ':faceId': match.Face.FaceId
          }
        };
        
        const userResult = await dynamoDB.query(queryParams).promise();
        
        if (userResult.Items && userResult.Items.length > 0) {
          const matchedUser = userResult.Items[0];
          
          // Update face record with matched user ID
          const updateParams = {
            TableName: FACE_DATA_TABLE,
            Key: { photoId, faceId },
            UpdateExpression: 'set matchedUserId = :userId, updatedAt = :timestamp',
            ExpressionAttributeValues: {
              ':userId': matchedUser.userId,
              ':timestamp': new Date().toISOString()
            }
          };
          
          await dynamoDB.update(updateParams).promise();
          
          // Add to matches array
          matches.push({
            faceId,
            matchedUserId: matchedUser.userId,
            similarity: match.Similarity,
            boundingBox: faceRecord.Face.BoundingBox
          });
        }
      }
    }
    
    // Update photo record to indicate it's been processed
    const updatePhotoParams = {
      TableName: PHOTOS_TABLE,
      Key: { photoId },
      UpdateExpression: 'set hasBeenProcessed = :processed, faceCount = :count, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':processed': true,
        ':count': faceCount,
        ':timestamp': new Date().toISOString()
      }
    };
    
    await dynamoDB.update(updatePhotoParams).promise();
    
    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Photo uploaded and processed successfully',
        photo: {
          ...photoRecord,
          hasBeenProcessed: true,
          faceCount
        },
        faceCount,
        matches
      })
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    
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