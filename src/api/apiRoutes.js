import express from 'express';
import { 
  CreateFaceLivenessSessionCommand, 
  GetFaceLivenessSessionResultsCommand 
} from '@aws-sdk/client-rekognition';
import { rekognitionClient } from '../lib/awsClient';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Middleware to ensure users are authenticated
router.use(authMiddleware);

/**
 * Create a Face Liveness session
 * POST /api/create-face-liveness-session
 */
router.post('/create-face-liveness-session', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Ensure the request is authorized
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not authorized to create a session for this user' 
      });
    }
    
    // Create a Face Liveness session with AWS Rekognition
    const command = new CreateFaceLivenessSessionCommand({
      ClientRequestToken: `session-${userId}-${Date.now()}`,
      Settings: {
        OutputConfig: {
          S3Bucket: process.env.S3_BUCKET || 'YOUR_S3_BUCKET_NAME',
          S3KeyPrefix: `face-liveness/${userId}/`
        }
      }
    });
    
    const response = await rekognitionClient.send(command);
    
    console.log(`Face Liveness session created for user ${userId}: ${response.SessionId}`);
    
    res.json({
      success: true,
      sessionId: response.SessionId
    });
  } catch (error) {
    console.error('Error creating Face Liveness session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Face Liveness session results
 * POST /api/get-face-liveness-results
 */
router.post('/get-face-liveness-results', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    // Ensure the request is authorized
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not authorized to access session results for this user' 
      });
    }
    
    // Get the results of a Face Liveness session from AWS Rekognition
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    const response = await rekognitionClient.send(command);
    
    // Process the response
    const result = {
      isLive: response.Status === 'SUCCEEDED' && response.Confidence >= 90,
      confidence: response.Confidence || 0,
      status: response.Status,
      referenceImage: response.ReferenceImage?.S3ObjectKey 
        ? `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${response.ReferenceImage.S3ObjectKey}`
        : null,
      auditImages: response.AuditImages?.map(img => 
        img.S3ObjectKey 
          ? `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${img.S3ObjectKey}`
          : null
      ).filter(Boolean) || []
    };
    
    console.log(`Face Liveness results retrieved for session ${sessionId}`);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error retrieving Face Liveness results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 