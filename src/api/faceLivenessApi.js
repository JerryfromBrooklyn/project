import { rekognitionClient } from '../lib/awsClient';
import { 
  CreateFaceLivenessSessionCommand, 
  GetFaceLivenessSessionResultsCommand 
} from '@aws-sdk/client-rekognition';

// Enhanced logging for debugging
const logPrefix = '[FaceLivenessAPI]';
const log = {
  info: (message, ...args) => console.log(`${logPrefix} ${message}`, ...args),
  warn: (message, ...args) => console.warn(`${logPrefix} ${message}`, ...args),
  error: (message, ...args) => console.error(`${logPrefix} ${message}`, ...args),
  debug: (message, ...args) => console.debug(`${logPrefix} ${message}`, ...args)
};

// Read region and bucket from environment variables with fallbacks
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const S3_BUCKET = import.meta.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430';

// Validate AWS configuration
log.info('AWS Configuration:', { 
  region: AWS_REGION, 
  bucketConfigured: !!S3_BUCKET,
  accessKeyConfigured: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID, 
  secretKeyConfigured: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY 
});

/**
 * Creates a Face Liveness session with AWS Rekognition
 * @param {string} userId - The ID of the user creating the session
 * @returns {Promise<Object>} The session data with sessionId
 */
export const createFaceLivenessSession = async (userId) => {
  try {
    log.info('Creating liveness session for user:', userId);
    log.debug('Using AWS Region:', AWS_REGION);
    log.debug('Using S3 Bucket:', S3_BUCKET);
    
    // Create a Face Liveness session with AWS Rekognition
    const command = new CreateFaceLivenessSessionCommand({
      ClientRequestToken: `session-${userId}-${Date.now()}`, // Unique identifier for this request
      Settings: {
        OutputConfig: {
          S3Bucket: S3_BUCKET,
          // Use user ID in the S3 key prefix to organize results by user
          S3KeyPrefix: `face-liveness/${userId}/`
        }
      }
    });
    
    log.debug('Sending CreateFaceLivenessSession command:', command);
    const response = await rekognitionClient.send(command);
    
    log.info('Session created successfully:', response.SessionId);
    
    return {
      success: true,
      sessionId: response.SessionId
    };
  } catch (error) {
    log.error('Error creating liveness session:', error);
    
    // Provide more detailed error messages based on error type
    let errorMessage = 'Failed to create a face verification session.';
    
    if (error.name === 'AccessDeniedException' || error.message?.includes('Access Denied')) {
      errorMessage = 'AWS access denied. Check your IAM permissions for Face Liveness operations.';
      log.error('Access denied error details:', { message: error.message, code: error.code });
    } else if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'The S3 bucket specified for Face Liveness does not exist or is not accessible.';
      log.error('Resource not found error details:', { message: error.message, code: error.code });
    } else if (error.name === 'ValidationException') {
      errorMessage = `AWS validation error: ${error.message}`;
      log.error('Validation error details:', { message: error.message, code: error.code });
    } else if (error.name === 'ThrottlingException') {
      errorMessage = 'AWS request rate exceeded. Please try again in a few moments.';
      log.error('Throttling error details:', { message: error.message, code: error.code });
    } else if (error.message?.includes('Credential') || error.message?.includes('credentials')) {
      errorMessage = 'AWS credential error. Check your AWS access key and secret key configuration.';
      log.error('Credential error details:', { message: error.message, code: error.code });
    }
    
    return {
      success: false,
      error: errorMessage,
      originalError: error.message
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
    log.info('Getting results for session:', sessionId);
    
    // Get the results of a Face Liveness session from AWS Rekognition
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    log.debug('Sending GetFaceLivenessSessionResults command');
    const response = await rekognitionClient.send(command);
    
    log.info('Session results retrieved successfully:', {
      status: response.Status,
      confidence: response.Confidence,
      referenceImageAvailable: !!response.ReferenceImage,
      auditImagesCount: response.AuditImages?.length || 0
    });
    
    // Use configured confidence threshold or default to 90
    const confidenceThreshold = parseFloat(import.meta.env.VITE_FACE_LIVENESS_CONFIDENCE_THRESHOLD || '90');
    log.debug('Using confidence threshold:', confidenceThreshold);
    
    // Extract the important fields from the response
    const result = {
      isLive: response.Status === 'SUCCEEDED' && response.Confidence >= confidenceThreshold,
      confidence: response.Confidence || 0,
      status: response.Status,
      // Reference image: high-quality image from the session for face comparison
      referenceImage: response.ReferenceImage?.S3ObjectKey 
        ? `https://${S3_BUCKET}.s3.amazonaws.com/${response.ReferenceImage.S3ObjectKey}`
        : null,
      // Audit images: images for manual verification if needed
      auditImages: response.AuditImages?.map(img => 
        img.S3ObjectKey 
          ? `https://${S3_BUCKET}.s3.amazonaws.com/${img.S3ObjectKey}`
          : null
      ).filter(Boolean) || []
    };
    
    log.debug('Processed result:', result);
    
    return {
      success: true,
      ...result
    };
  } catch (error) {
    log.error('Error getting liveness results:', error);
    
    let errorMessage = 'Failed to get face verification results.';
    
    if (error.name === 'AccessDeniedException' || error.message?.includes('Access Denied')) {
      errorMessage = 'AWS access denied when retrieving results. Check your IAM permissions.';
    } else if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'The face verification session was not found or has expired.';
    } else if (error.name === 'ValidationException') {
      errorMessage = `AWS validation error: ${error.message}`;
    } else if (error.name === 'ThrottlingException') {
      errorMessage = 'AWS request rate exceeded. Please try again in a few moments.';
    }
    
    log.error('Error details:', { errorType: error.name, message: error.message });
    
    return {
      success: false,
      error: errorMessage,
      originalError: error.message
    };
  }
};

/**
 * Checks if the camera is accessible for Face Liveness
 * @returns {Promise<Object>} Camera status information
 */
export const checkCameraForFaceLiveness = async () => {
  try {
    log.info('Checking camera availability for Face Liveness...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      log.warn('MediaDevices API not available in this browser');
      return {
        available: false,
        error: 'Camera API not supported by this browser'
      };
    }
    
    // Request camera with exact constraints that Face Liveness will use
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    };
    
    log.debug('Attempting to access camera with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Log camera tracks information
    if (stream && stream.getVideoTracks) {
      const videoTracks = stream.getVideoTracks();
      log.info('Camera access successful. Video tracks:', videoTracks.length);
      
      videoTracks.forEach((track, index) => {
        log.debug(`Video track ${index}:`, {
          label: track.label,
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          kind: track.kind
        });
        
        // Log advanced capabilities if available
        if (track.getCapabilities) {
          const capabilities = track.getCapabilities();
          log.debug(`Track ${index} capabilities:`, capabilities);
        }
      });
      
      // Always release the camera after testing
      stream.getTracks().forEach(track => track.stop());
    }
    
    return {
      available: true,
      videoTracksCount: stream.getVideoTracks().length
    };
  } catch (error) {
    log.error('Error accessing camera:', error);
    
    let errorMessage = 'Failed to access camera.';
    let errorType = 'unknown';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Camera permission was denied by the user.';
      errorType = 'permission_denied';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = 'No camera device found on this system.';
      errorType = 'device_not_found';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = 'Camera is already in use by another application.';
      errorType = 'device_in_use';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera constraints cannot be satisfied.';
      errorType = 'constraints_error';
    } else if (error.name === 'TypeError') {
      errorMessage = 'Invalid camera constraints specified.';
      errorType = 'invalid_constraints';
    }
    
    return {
      available: false,
      error: errorMessage,
      errorType: errorType,
      errorName: error.name,
      errorMessage: error.message
    };
  }
};

export default {
  createFaceLivenessSession,
  getFaceLivenessResults,
  checkCameraForFaceLiveness
}; 