import { RekognitionClient, IndexFacesCommand, SearchFacesCommand } from "@aws-sdk/client-rekognition";
import { fromEnv } from "@aws-sdk/credential-providers"; // To load credentials from environment variables
// --- Configuration ---
// Best practice: Load these from environment variables or a config service
const AWS_REGION = process.env.AWS_REGION || "us-east-1"; // Replace with your desired AWS region
const REKOGNITION_COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || "shmong-faces"; // Replace with your Rekognition Collection ID
const FACE_MATCH_THRESHOLD = 99; // Confidence threshold for matching faces
// --- AWS SDK Client Initialization ---
let rekognitionClient;
/**
 * Initializes and returns the Rekognition client.
 * Uses credentials from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).
 * Make sure these variables are set in your backend environment.
 */
const initializeRekognitionClient = () => {
    if (!rekognitionClient) {
        console.log(`Initializing Rekognition client for region: ${AWS_REGION}`);
        rekognitionClient = new RekognitionClient({
            region: AWS_REGION,
            credentials: fromEnv(), // Load credentials from environment variables
        });
    }
    return rekognitionClient;
};
// --- Service Functions ---
/**
 * Indexes the primary face from user registration (e.g., webcam capture)
 * into the Rekognition collection.
 * @param imageBytes - The image data as a Uint8Array or Buffer.
 * @param userId - The unique ID of the user registering.
 * @returns The canonical FaceId assigned by Rekognition, or null on failure.
 */
export const indexFaceForRegistration = async (imageBytes, userId) => {
    const client = initializeRekognitionClient();
    const command = new IndexFacesCommand({
        CollectionId: REKOGNITION_COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: `user-${userId}-profile`, // Example ExternalImageId
        MaxFaces: 1, // We only want to index the single best face for the user's canonical record
        QualityFilter: "AUTO", // Use Rekognition's default quality filtering
        DetectionAttributes: ["DEFAULT"],
    });
    try {
        console.log(`Indexing face for user: ${userId}`);
        const response = await client.send(command);
        if (response.FaceRecords && response.FaceRecords.length > 0 && response.FaceRecords[0].Face?.FaceId) {
            const faceId = response.FaceRecords[0].Face.FaceId;
            console.log(`Successfully indexed face for user ${userId}. Canonical FaceId: ${faceId}`);
            return faceId;
        }
        else {
            console.warn(`No face record found in IndexFaces response for user ${userId}. Unindexed faces:`, response.UnindexedFaces);
            return null;
        }
    }
    catch (error) {
        console.error(`Error indexing face for user ${userId}:`, error);
        // Consider more specific error handling based on AWS error types
        return null;
    }
};
/**
 * Searches the collection for faces matching the user's canonical FaceId.
 * Used for historical matching right after registration.
 * @param faceId - The user's canonical FaceId obtained from indexFaceForRegistration.
 * @returns An array of matching anonymous FaceIds from the collection, or null on failure.
 */
export const searchFacesByFaceId = async (faceId) => {
    const client = initializeRekognitionClient();
    const command = new SearchFacesCommand({
        CollectionId: REKOGNITION_COLLECTION_ID,
        FaceId: faceId,
        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
        MaxFaces: 1000, // Adjust as needed, limits the number of matches returned *per call*
    });
    try {
        console.log(`Searching for matches for FaceId: ${faceId}`);
        const response = await client.send(command);
        if (response.FaceMatches && response.FaceMatches.length > 0) {
            const matchedFaceIds = response.FaceMatches
                .filter(match => match.Face?.FaceId) // Ensure FaceId exists
                .map(match => match.Face.FaceId); // Extract the IDs
            console.log(`Found ${matchedFaceIds.length} matches for FaceId ${faceId}`);
            return matchedFaceIds;
        }
        else {
            console.log(`No matches found for FaceId ${faceId}`);
            return []; // Return empty array if no matches
        }
    }
    catch (error) {
        console.error(`Error searching faces for FaceId ${faceId}:`, error);
        return null;
    }
};
/**
 * Processes a newly uploaded photo: detects faces, indexes them anonymously,
 * stores metadata (requires backend DB logic), and attempts real-time matching.
 * @param photoId - The unique ID assigned to the photo in your database.
 * @param imageBytes - The image data as a Uint8Array or Buffer.
 * @returns {Promise<void>}
 */
export const processUploadedPhotoForIndexingAndMatching = async (photoId, imageBytes) => {
    const client = initializeRekognitionClient();
    // --- 1. Detect Faces (Optional but Recommended for Quality Check) ---
    // You might want to detect first to check quality before indexing.
    // For simplicity here, we'll combine detection implicitly within IndexFaces below,
    // but a separate DetectFaces call allows pre-filtering.
    // const detectCommand = new DetectFacesCommand({ ... });
    // const detectedFaces = await client.send(detectCommand);
    // Filter detectedFaces based on quality, size etc. before proceeding...
    // --- 2. Index Detected Faces Anonymously ---
    const indexCommand = new IndexFacesCommand({
        CollectionId: REKOGNITION_COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: `photo-${photoId}`, // Link face records back to the photo
        MaxFaces: 100, // Index up to 100 largest faces found in the photo
        QualityFilter: "AUTO",
        DetectionAttributes: ["DEFAULT"], // Or "ALL" if you need more attributes like landmarks, emotions
    });
    let indexedFaces = []; // Store successfully indexed faces for searching
    try {
        console.log(`Indexing faces for photo: ${photoId}`);
        const indexResponse = await client.send(indexCommand);
        if (indexResponse.FaceRecords && indexResponse.FaceRecords.length > 0) {
            indexedFaces = indexResponse.FaceRecords
                .filter(record => record.Face?.FaceId)
                .map(record => ({
                faceId: record.Face.FaceId,
                boundingBox: record.Face.BoundingBox // Store bounding box too
            }));
            console.log(`Successfully indexed ${indexedFaces.length} faces for photo ${photoId}.`);
            // --- 3. Store Anonymous Face Data (Backend Logic Needed) ---
            // TODO: Implement database logic here
            // For each face in indexedFaces:
            //  - Save the anonymous faceId (indexedFaces[i].faceId)
            //  - Save the associated photoId
            //  - Save the boundingBox (indexedFaces[i].boundingBox)
            //  - Initially, set the associated userId to NULL
            // Example placeholder: await saveDetectedFaceToDB(photoId, indexedFaces[i].faceId, indexedFaces[i].boundingBox);
            console.log(`Placeholder: Would now save ${indexedFaces.length} detected faces to DB for photo ${photoId}`);
        }
        else {
            console.log(`No faces were indexed for photo ${photoId}. Unindexed:`, indexResponse.UnindexedFaces);
            return; // Nothing more to do if no faces were indexed
        }
        if (indexResponse.UnindexedFaces && indexResponse.UnindexedFaces.length > 0) {
            console.log(`Photo ${photoId} had ${indexResponse.UnindexedFaces.length} faces not indexed due to quality/size/etc.`);
            // You might want to log details about why faces were unindexed
        }
    }
    catch (error) {
        console.error(`Error indexing faces for photo ${photoId}:`, error);
        return; // Stop processing this photo if indexing fails
    }
    // --- 4. Search for Matches for Each Newly Indexed Face (Real-time Matching) ---
    if (indexedFaces.length > 0) {
        console.log(`Performing real-time search for ${indexedFaces.length} newly indexed faces from photo ${photoId}...`);
        for (const indexedFace of indexedFaces) {
            const searchCommand = new SearchFacesCommand({
                CollectionId: REKOGNITION_COLLECTION_ID,
                FaceId: indexedFace.faceId, // Search using the *anonymous* ID just indexed
                FaceMatchThreshold: FACE_MATCH_THRESHOLD,
                MaxFaces: 5, // Usually expect only 0 or 1 match against registered users' canonical faces
            });
            try {
                const searchResponse = await client.send(searchCommand);
                if (searchResponse.FaceMatches && searchResponse.FaceMatches.length > 0) {
                    // We found potential matches in the collection for this anonymous face
                    for (const match of searchResponse.FaceMatches) {
                        if (match.Face?.FaceId && match.Similarity) {
                            const matchedCanonicalFaceId = match.Face.FaceId;
                            const similarity = match.Similarity;
                            console.log(`Real-time match found for anonymous face ${indexedFace.faceId} (Photo: ${photoId})! Matched Canonical FaceId: ${matchedCanonicalFaceId} with similarity ${similarity}%`);
                            // --- 5. Link to User (Backend Logic Needed) ---
                            // TODO: Implement database logic here
                            //  - Look up which userId corresponds to the matchedCanonicalFaceId in your Users table
                            //  - If found, update the specific DetectedFaces record (for photoId and indexedFace.faceId)
                            //    to set its userId field.
                            // Example placeholder: await linkDetectedFaceToUser(indexedFace.faceId, matchedCanonicalFaceId);
                            console.log(`Placeholder: Would now link anonymous face ${indexedFace.faceId} to user via canonical ID ${matchedCanonicalFaceId} in DB.`);
                        }
                    }
                }
                // else { console.log(`No registered user match found for anonymous face ${indexedFace.faceId}`); }
            }
            catch (searchError) {
                console.error(`Error searching for matches for anonymous face ${indexedFace.faceId} (Photo: ${photoId}):`, searchError);
                // Continue processing other faces even if one search fails
            }
        }
        console.log(`Finished real-time search for photo ${photoId}.`);
    }
};
// --- Helper Functions (Example) ---
// TODO: Implement these functions in your backend data access layer
// async function saveDetectedFaceToDB(photoId: string, anonymousFaceId: string, boundingBox: any): Promise<void> {
//   console.log(`DB: Saving detected face ${anonymousFaceId} for photo ${photoId}`);
//   // ... database insertion logic ...
// }
// async function linkDetectedFaceToUser(anonymousFaceId: string, matchedCanonicalFaceId: string): Promise<void> {
//   console.log(`DB: Linking anonymous face ${anonymousFaceId} to user with canonical face ${matchedCanonicalFaceId}`);
//   // 1. Find userId associated with matchedCanonicalFaceId in Users table
//   // 2. Update DetectedFaces table SET userId = foundUserId WHERE anonymousRekognitionFaceId = anonymousFaceId
//   // ... database update logic ...
// } 
