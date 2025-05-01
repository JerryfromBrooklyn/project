import { rekognitionClient } from '../lib/awsClient';
import { 
  CreateFaceLivenessSessionCommand, 
  GetFaceLivenessSessionResultsCommand 
} from '@aws-sdk/client-rekognition';

/**
 * Creates a Face Liveness session with AWS Rekognition
 * @param {string} userId - The ID of the user creating the session
 * @returns {Promise<Object>} The session data with sessionId
 */
export const createFaceLivenessSession = async (userId) => {
  try {
    console.log('[FaceLivenessAPI] Creating liveness session for user:', userId);
    
    // Create a Face Liveness session with AWS Rekognition
    const command = new CreateFaceLivenessSessionCommand({
      ClientRequestToken: `session-${userId}-${Date.now()}`, // Optional: Unique identifier for this request
      Settings: {
        OutputConfig: {
          S3Bucket: import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'YOUR_S3_BUCKET_NAME',
          // Use user ID in the S3 key prefix to organize results by user
          S3KeyPrefix: `face-liveness/${userId}/`
        }
      }
    });
    
    const response = await rekognitionClient.send(command);
    
    console.log('[FaceLivenessAPI] Session created successfully:', response.SessionId);
    
    return {
      success: true,
      sessionId: response.SessionId
    };
  } catch (error) {
    console.error('[FaceLivenessAPI] Error creating liveness session:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Gets the results of a Face Liveness session
 * @param {string} sessionId - The ID of the session to get results for
 * @param {string} userId - The ID of the user who created the session
 * @returns {Promise<Object>} The session results
 */
export const getFaceLivenessResults = async (sessionId, userId) => {
  try {
    console.log('[FaceLivenessAPI] Getting results for session:', sessionId);
    
    // Get the results of a Face Liveness session from AWS Rekognition
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    const response = await rekognitionClient.send(command);
    
    console.log('[FaceLivenessAPI] Session results retrieved successfully:', response);
    
    // Extract the important fields from the response
    const result = {
      isLive: response.Status === 'SUCCEEDED' && response.Confidence >= parseFloat(import.meta.env.VITE_FACE_LIVENESS_CONFIDENCE_THRESHOLD || '90'),
      confidence: response.Confidence || 0,
      status: response.Status,
      // Reference image: high-quality image from the session for face comparison
      referenceImage: response.ReferenceImage?.S3ObjectKey 
        ? `https://${import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${response.ReferenceImage.S3ObjectKey}`
        : null,
      // Audit images: images for manual verification if needed
      auditImages: response.AuditImages?.map(img => 
        img.S3ObjectKey 
          ? `https://${import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${img.S3ObjectKey}`
          : null
      ).filter(Boolean) || []
    };
    
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('[FaceLivenessAPI] Error getting liveness results:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createFaceLivenessSession,
  getFaceLivenessResults
}; 