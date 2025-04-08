import { RekognitionClient, DetectFacesCommand, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, userId, metadata } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Extract bucket and key from imageUrl
    // Format: https://s3.amazonaws.com/bucket-name/key
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketName = pathParts[1];
    const objectKey = pathParts.slice(2).join('/');

    // Initialize AWS clients
    const rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    // Step 1: Detect Faces in the image
    const detectFacesParams = {
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: objectKey
        }
      },
      Attributes: ['ALL']
    };

    const detectFacesCommand = new DetectFacesCommand(detectFacesParams);
    const detectFacesResponse = await rekognitionClient.send(detectFacesCommand);

    const detectedFaces = detectFacesResponse.FaceDetails || [];
    console.log(`Detected ${detectedFaces.length} faces in image`);

    // Step 2: For each detected face, search for matches in the collection
    const matchedFaces = [];
    const collectionId = process.env.REKOGNITION_COLLECTION || 'user-faces';

    for (const faceDetail of detectedFaces) {
      // Only process faces with high confidence
      if (faceDetail.Confidence < 90) continue;

      // Get the bounding box for the face
      const boundingBox = faceDetail.BoundingBox;

      // Search for matching faces
      const searchFacesParams = {
        CollectionId: collectionId,
        Image: {
          S3Object: {
            Bucket: bucketName,
            Name: objectKey
          }
        },
        FaceMatchThreshold: 70, // Adjust based on your requirements
        MaxFaces: 5 // Limit to top 5 matches
      };

      const searchFacesCommand = new SearchFacesByImageCommand(searchFacesParams);
      const searchFacesResponse = await rekognitionClient.send(searchFacesCommand);

      if (searchFacesResponse.FaceMatches && searchFacesResponse.FaceMatches.length > 0) {
        // Found matches - process them
        const matches = searchFacesResponse.FaceMatches.map(match => ({
          similarity: match.Similarity,
          faceId: match.Face.FaceId,
          userId: match.Face.ExternalImageId || 'unknown',
          confidence: match.Face.Confidence,
          boundingBox
        }));

        matchedFaces.push(...matches);
        
        // Store matches in DynamoDB for notification
        for (const match of matches) {
          const timestamp = new Date().toISOString();
          const putItemParams = {
            TableName: 'face-matches',
            Item: {
              matchId: { S: `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` },
              photoUrl: { S: imageUrl },
              photoKey: { S: objectKey },
              faceId: { S: match.faceId },
              userId: { S: match.userId },
              uploaderId: { S: userId || 'anonymous' },
              similarity: { N: match.similarity.toString() },
              confidence: { N: match.confidence.toString() },
              boundingBox: { 
                M: {
                  top: { N: boundingBox.Top.toString() },
                  left: { N: boundingBox.Left.toString() },
                  width: { N: boundingBox.Width.toString() },
                  height: { N: boundingBox.Height.toString() }
                }
              },
              metadata: { 
                M: metadata ? Object.entries(metadata).reduce((acc, [key, value]) => {
                  acc[key] = { S: value.toString() };
                  return acc;
                }, {}) : {}
              },
              createdAt: { S: timestamp },
              notified: { BOOL: false }
            }
          };

          try {
            await dynamoClient.send(new PutItemCommand(putItemParams));
            console.log(`Stored match for userId: ${match.userId}`);
          } catch (dbError) {
            console.error('Error storing match in DynamoDB:', dbError);
          }
        }
      }
    }

    // Return the results
    return res.status(200).json({
      success: true,
      faces: detectedFaces.map(face => ({
        boundingBox: face.BoundingBox,
        confidence: face.Confidence,
        landmarks: face.Landmarks,
        ageRange: face.AgeRange,
        gender: face.Gender,
        emotions: face.Emotions
      })),
      matches: matchedFaces
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: 'Failed to process image', details: error.message });
  }
} 