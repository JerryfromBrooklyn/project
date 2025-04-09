    // IndexFace/index.mjs
    import { RekognitionClient, IndexFacesCommand } from '@aws-sdk/client-rekognition';

    const REGION = "us-east-1"; // Ensure this matches your region
    const rekognition = new RekognitionClient({ region: REGION });
    const COLLECTION_ID = 'shmong-faces'; // Ensure this matches your collection ID

    export const handler = async (event) => {
        try {
            console.log('Event received:', JSON.stringify(event));

            // Parse request body if coming from API Gateway
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;

            const bucket = body.bucket;
            const key = body.key;
            const userId = body.userId;

            if (!bucket || !key || !userId) {
                console.error("Missing required parameters", { bucket, key, userId });
                throw new Error('Missing required parameters: bucket, key, or userId');
            }

            console.log(`Indexing face for user ${userId} from image: ${bucket}/${key} in region ${REGION}`);

            const indexParams = {
                CollectionId: COLLECTION_ID,
                Image: {
                    S3Object: {
                        Bucket: bucket,
                        Name: key
                    }
                },
                ExternalImageId: userId, // Use userId as the external ID for the face
                DetectionAttributes: ['ALL'],
                MaxFaces: 1, // Only index the largest face found
                QualityFilter: "AUTO" // Automatically filter low-quality images
            };

            console.log('Sending IndexFaces command with params:', JSON.stringify(indexParams));
            const command = new IndexFacesCommand(indexParams);
            const indexResult = await rekognition.send(command);

            console.log('Rekognition IndexFaces result:', JSON.stringify(indexResult));

            // Check if faces were actually indexed
            if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
                const faceId = indexResult.FaceRecords[0].Face.FaceId;
                const indexedUserId = indexResult.FaceRecords[0].Face.ExternalImageId;
                console.log(`Face indexed successfully. FaceId: ${faceId}, ExternalImageId (userId): ${indexedUserId}`);

                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({
                        success: true,
                        faceId: faceId,
                        userId: indexedUserId,
                        message: "Face indexed successfully"
                    })
                };
            } else if (indexResult.UnindexedFaces && indexResult.UnindexedFaces.length > 0) {
                 // Log reasons why faces weren't indexed (e.g., low quality)
                 console.warn('Faces detected but not indexed:', JSON.stringify(indexResult.UnindexedFaces));
                 const reason = indexResult.UnindexedFaces[0].Reasons.join(', ');
                 return {
                     statusCode: 400,
                     headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                     body: JSON.stringify({
                         success: false,
                         message: `Face detected but not indexed. Reason: ${reason}`
                     })
                 };
            }
             else {
                 // No faces detected at all
                 console.warn('No faces detected by Rekognition in the image.');
                 return {
                     statusCode: 400,
                     headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                     body: JSON.stringify({
                         success: false,
                         message: "No faces detected in the image"
                     })
                 };
             }
        } catch (error) {
            console.error('Error indexing face:', error);
            const errorMessage = error.message || 'An unknown error occurred during face indexing.';
            const errorName = error.name || 'UnknownError';
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    success: false,
                    error: errorMessage,
                    errorType: errorName
                })
            };
        }
    };