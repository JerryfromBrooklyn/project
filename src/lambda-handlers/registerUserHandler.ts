import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as faceMatchingService from '../services/faceMatchingService'; // Adjust path if needed
import * as databaseService from '../services/databaseService'; // Adjust path if needed
import { randomUUID } from 'crypto'; // For generating user IDs
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing

// --- Helper Function for Responses ---
const createResponse = (statusCode: number, body: any): APIGatewayProxyResultV2 => {
    return {
        statusCode: statusCode,
        headers: { 
            "Access-Control-Allow-Origin": "*", // Allow requests from any origin (adjust for production)
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        body: JSON.stringify(body),
    };
};

// --- Lambda Handler --- 
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    console.log("RegisterUserHandler invoked. Event body:", event.body);

    if (!event.body) {
        return createResponse(400, { message: 'Missing request body.' });
    }

    let email: string;
    let password: string;
    let imageBase64Data: string;

    // 1. Parse and Validate Input
    try {
        const body = JSON.parse(event.body);
        email = body.email;
        password = body.password;
        imageBase64Data = body.imageBase64Data;

        // Basic validation
        if (!email || !password || !imageBase64Data) {
             return createResponse(400, { message: 'Missing email, password, or image data.' });
        }
        // Add more validation if needed (e.g., email format, password complexity)

    } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return createResponse(400, { message: 'Invalid request body format.' });
    }

    try {
        // 2. Check if user already exists
        const existingUser = await databaseService.findUserByEmail(email);
        if (existingUser) {
            console.warn(`Attempt to register existing email: ${email}`);
            return createResponse(409, { message: 'User with this email already exists.' });
        }

        // 3. Hash password securely
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // 4. Generate a unique user ID
        const userId = randomUUID();

        // 5. Convert base64 image data to Buffer for Rekognition
        let imageBuffer: Buffer;
        try {
             // Ensure the frontend sends only the base64 part, without 'data:image/jpeg;base64,' prefix
            imageBuffer = Buffer.from(imageBase64Data, 'base64'); 
        } catch (bufferError) {
             console.error("Failed to convert base64 image data:", bufferError);
             return createResponse(400, { message: 'Invalid image data format.' });
        }

        // 6. Index the user's face with Rekognition
        const canonicalFaceId = await faceMatchingService.indexFaceForRegistration(imageBuffer, userId);

        if (!canonicalFaceId) {
            // Handle case where face couldn't be indexed
             console.warn(`Could not index face for user ${userId} (email: ${email})`);
             return createResponse(400, { message: 'Could not detect or index face from image. Please try a clearer photo.' });
        }
        console.log(`Successfully indexed canonicalFaceId ${canonicalFaceId} for user ${userId}`);

        // 7. Create user record in DynamoDB
        await databaseService.createUser(userId, email, passwordHash);

        // 8. Save canonicalFaceId to the user record
        await databaseService.saveUserRekognitionFaceId(userId, canonicalFaceId);

        // --- 9. Historical Matching --- 
        let matchCount = 0;
        try {
            const matchedAnonFaceIds = await faceMatchingService.searchFacesByFaceId(canonicalFaceId);
            
            if (matchedAnonFaceIds && matchedAnonFaceIds.length > 0) {
                console.log(`Found ${matchedAnonFaceIds.length} potential historical matches for user ${userId}`);
                
                // Attempt to link each found anonymous face ID to the user's canonical ID
                // The linkDetectedFaceToUser function handles finding the item and updating the userId
                const linkPromises = matchedAnonFaceIds.map(anonId => 
                    databaseService.linkDetectedFaceToUser(anonId, canonicalFaceId)
                        .then(() => true) // Indicate success
                        .catch(err => {
                            console.error(`Failed to link anonId ${anonId} for user ${userId}:`, err);
                            return false; // Indicate failure
                        })
                );
                
                const results = await Promise.all(linkPromises);
                matchCount = results.filter(success => success).length; // Count only successful links
                console.log(`Successfully linked ${matchCount} historical faces for user ${userId}`);

            } else {
                console.log(`No historical face matches found for user ${userId}`);
            }
        } catch (searchLinkError) {
             console.error(`Error during historical face search/linking for user ${userId}:`, searchLinkError);
             // Decide if registration should still succeed even if historical search fails
             // For now, we'll let it succeed but log the error.
        }
        
        // 10. Return success response
        console.log(`Registration complete for user ${userId}`);
        return createResponse(201, { 
            message: 'User registered successfully!', 
            userId: userId,
            historicalMatchesFound: matchCount
        });

    } catch (error: any) {
        console.error(`Error during registration process for email ${email}:`, error);
        // Provide a generic error message to the client
        return createResponse(500, { message: 'Internal server error during registration.', details: error.message });
    }
}; 