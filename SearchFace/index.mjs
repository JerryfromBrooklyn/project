    // SearchFace/index.mjs
    import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition';

    const REGION = "us-east-1"; // Ensure this matches your region
    const rekognition = new RekognitionClient({ region: REGION });
    const COLLECTION_ID = 'shmong-faces'; // Ensure this matches your collection ID
    const FACE_MATCH_THRESHOLD = 95; // Set to 95% for optimal balance

    export const handler = async (event) => {
        try {
            console.log('Event received:', JSON.stringify(event));

            // Parse request body if coming from API Gateway
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;

            const bucket = body.bucket;
            const key = body.key;

             if (!bucket || !key) {
                console.error("Missing required parameters", { bucket, key });
                throw new Error('Missing required parameters: bucket or key');
            }

            console.log(`Searching for faces in image: ${bucket}/${key} in collection ${COLLECTION_ID}`);

            const searchParams = {
                CollectionId: COLLECTION_ID,
                Image: {
                    S3Object: {
                        Bucket: bucket,
                        Name: key
                    }
                },
                MaxFaces: 5, // Max number of matches to return per detected face
                FaceMatchThreshold: FACE_MATCH_THRESHOLD
            };

            console.log('Sending SearchFacesByImage command with params:', JSON.stringify(searchParams));
            const command = new SearchFacesByImageCommand(searchParams);
            const searchResult = await rekognition.send(command);

            console.log('Rekognition SearchFacesByImage result:', JSON.stringify(searchResult));

            // Process matches found for the faces in the input image
            if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
                console.log(`Found ${searchResult.FaceMatches.length} matching faces for the largest face in the image!`);

                // Map results to include userId (ExternalImageId) and confidence
                const matches = searchResult.FaceMatches.map(match => ({
                    faceId: match.Face?.FaceId, // The FaceId of the matched face in the collection
                    userId: match.Face?.ExternalImageId, // The userId associated with the matched face
                    confidence: match.Similarity // The confidence score of the match
                }));

                // You could add logic here to aggregate matches if multiple faces were detected in the input image
                // searchResult.SearchedFaceBoundingBox tells you which face in the input image was searched

                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({
                        success: true,
                        matches: matches, // Return the list of matched user IDs and confidence
                        message: `Found ${matches.length} matching faces`
                    })
                };
            } else {
                console.log('No matching faces found in the collection for the face(s) in the image.');
                return {
                    statusCode: 200, // Success, but no matches
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({
                        success: true,
                        matches: [],
                        message: "No matching faces found"
                    })
                };
            }
        } catch (error) {
            console.error('Error searching for faces:', error);
            const errorMessage = error.message || 'An unknown error occurred during face search.';
            const errorName = error.name || 'UnknownError';

             // Check for specific Rekognition errors
             if (errorName === 'InvalidParameterException' && errorMessage.includes('There are no faces in the image')) {
                 return {
                     statusCode: 400,
                     headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                     body: JSON.stringify({ success: false, error: 'No faces detected in the provided image.' })
                 };
            }

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