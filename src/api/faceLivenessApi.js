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
 * Creates a Face Liveness session using AWS Rekognition
 * 
 * @param {string} userId - Optional user ID for the session
 * @returns {Promise<{sessionId: string}>} - The created session ID
 */
export const createFaceLivenessSession = async (userId) => {
  log.info('Creating liveness session for user:', userId);
  
  try {
    const params = {
      ClientRequestToken: userId,  // Optional, but can help with idempotency
      Settings: {
        OutputConfig: {
          S3Bucket: S3_BUCKET,
          S3KeyPrefix: `users/${userId || 'anonymous'}/sessions/`
        }
      }
    };
    
    log.info(`Using AWS Region: ${AWS_REGION}`);
    log.info(`Using S3 Bucket: ${S3_BUCKET}`);
    
    const command = new CreateFaceLivenessSessionCommand(params);
    log.info('Sending CreateFaceLivenessSession command:', command);
    
    // Add a small delay before sending the command to avoid race conditions
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response = await rekognitionClient.send(command);
    
    if (!response || !response.SessionId) {
      throw new Error('No session ID returned from AWS Rekognition');
    }
    
    log.info('Session created successfully:', response.SessionId);
    return { 
      sessionId: response.SessionId,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    log.error('Error creating Face Liveness session:', error);
    
    // Provide more detailed error info based on the error type
    let errorMessage = 'Failed to create Face Liveness session';
    
    if (error.name === 'ValidationException') {
      errorMessage = `Validation error: ${error.message}`;
    } else if (error.name === 'ServiceQuotaExceededException') {
      errorMessage = 'AWS service quota exceeded. Please try again later.';
    } else if (error.name === 'AccessDeniedException') {
      errorMessage = 'Access denied. Check AWS permissions.';
    } else if (error.name === 'ThrottlingException') {
      errorMessage = 'AWS request rate limit exceeded. Please try again later.';
    }
    
    // Instead of throwing, return an error object in a consistent format
    return {
      error: errorMessage || error.message,
      errorDetails: {
        name: error.name,
        message: error.message,
        code: error.code
      }
    };
  }
};

/**
 * Gets the results of a Face Liveness session
 * 
 * @param {string} sessionId - The Face Liveness session ID
 * @returns {Promise<{isLive: boolean, confidence: number, referenceImage: string}>} - Session results
 */
export const getFaceLivenessSessionResults = async (sessionId) => {
  log.info('Getting results for session:', sessionId);
  
  try {
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    // Add a small delay to ensure session data is available
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await rekognitionClient.send(command);
    
    if (!response) {
      throw new Error('No response from AWS Rekognition');
    }
    
    log.info('Session results received, confidence:', response.Confidence);
    
    // Determine liveness based on confidence threshold
    // AWS recommends a minimum threshold of 90 for production
    const isLive = response.Status === 'SUCCEEDED' && (response.Confidence >= 90);
    
    // Extract reference image - this is a base64 encoded string
    const referenceImage = response.ReferenceImage ? 
      response.ReferenceImage.Bytes ? 
        Buffer.from(response.ReferenceImage.Bytes).toString('base64') :
        null : 
      null;
    
    return {
      isLive,
      confidence: response.Confidence || 0,
      referenceImage,
      status: response.Status,
      auditImages: response.AuditImages || []
    };
  } catch (error) {
    log.error('Error getting Face Liveness session results:', error);
    
    // Provide more detailed error info based on the error type
    let errorMessage = 'Failed to get Face Liveness session results';
    
    if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'Session not found or expired';
    } else if (error.name === 'AccessDeniedException') {
      errorMessage = 'Access denied. Check AWS permissions.';
    } else if (error.name === 'ValidationException') {
      errorMessage = `Validation error: ${error.message}`;
    }
    
    // Return error object instead of throwing
    return {
      error: errorMessage,
      errorDetails: {
        name: error.name,
        message: error.message,
        code: error.code
      }
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
  getFaceLivenessSessionResults,
  checkCameraForFaceLiveness
}; 