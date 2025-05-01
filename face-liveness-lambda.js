const { RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand } = require('@aws-sdk/client-rekognition');

// Initialize the Rekognition client
const rekognitionClient = new RekognitionClient({ region: 'us-east-1' });

// S3 bucket for Face Liveness
const FACE_LIVENESS_S3_BUCKET = 'face-liveness-bucket--20250430';

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Parse the request body
        const body = JSON.parse(event.body || '{}');
        const { action, userId, sessionId } = body;
        
        // CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        };
        
        // Handle preflight CORS request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }
        
        let response;
        
        // Process based on the action requested
        switch (action) {
            case 'createSession':
                // Create a Face Liveness session
                const createCommand = new CreateFaceLivenessSessionCommand({
                    ClientRequestToken: `session-${userId}-${Date.now()}`,
                    Settings: {
                        OutputConfig: {
                            S3Bucket: FACE_LIVENESS_S3_BUCKET,
                            S3KeyPrefix: `face-liveness/${userId}/`
                        }
                    }
                });
                
                const createResponse = await rekognitionClient.send(createCommand);
                
                response = {
                    success: true,
                    sessionId: createResponse.SessionId
                };
                
                console.log(`Face Liveness session created for user ${userId}: ${createResponse.SessionId}`);
                break;
                
            case 'getResults':
                // Get Face Liveness session results
                const getCommand = new GetFaceLivenessSessionResultsCommand({
                    SessionId: sessionId
                });
                
                const getResponse = await rekognitionClient.send(getCommand);
                
                // Process the response
                const confidenceThreshold = 90;
                const result = {
                    isLive: getResponse.Status === 'SUCCEEDED' && getResponse.Confidence >= confidenceThreshold,
                    confidence: getResponse.Confidence || 0,
                    status: getResponse.Status,
                    referenceImage: getResponse.ReferenceImage?.S3ObjectKey 
                        ? `https://${FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${getResponse.ReferenceImage.S3ObjectKey}`
                        : null,
                    auditImages: getResponse.AuditImages?.map(img => 
                        img.S3ObjectKey 
                            ? `https://${FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${img.S3ObjectKey}`
                            : null
                    ).filter(Boolean) || []
                };
                
                response = {
                    success: true,
                    ...result
                };
                
                console.log(`Face Liveness results retrieved for session ${sessionId}`);
                break;
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action specified' })
                };
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error processing request:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}; 