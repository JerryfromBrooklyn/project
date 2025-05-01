import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { 
  CreateFaceLivenessSessionCommand, 
  GetFaceLivenessSessionResultsCommand 
} from '@aws-sdk/client-rekognition';
import { rekognitionClient } from './lib/awsClient.js';

// Load environment variables
dotenv.config();
console.log('Loaded environment variables with dotenv');

// Print environment variables (for debugging - mask sensitive values)
if (process.env.NODE_ENV === 'development') {
  console.log('[ENV DEBUG] Environment variables loaded:');
  console.log('[ENV DEBUG] AWS_REGION:', process.env.AWS_REGION || '(not set)');
  console.log('[ENV DEBUG] AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '(set)' : '(not set)');
  console.log('[ENV DEBUG] AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '(set)' : '(not set)');
}

// Initialize Express app
const app = express();
let PORT = process.env.PORT || 3001;

// Configure S3 bucket for Face Liveness
const FACE_LIVENESS_S3_BUCKET = process.env.VITE_FACE_LIVENESS_S3_BUCKET || 'face-liveness-bucket--20250430';
console.log('[SERVER] Face Liveness S3 bucket:', FACE_LIVENESS_S3_BUCKET);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Authentication middleware (simplified for example)
// In a real app, you'd validate JWT tokens or session cookies
const authenticate = (req, res, next) => {
  // For debugging, let's bypass authentication during development
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: req.body.userId || '123' };
    return next();
  }
  
  // Example: Check for an auth header or session
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Simplified example - extract user from token
    // In a real app, you'd verify the token with JWT
    const token = authHeader.split(' ')[1];
    const user = { id: '123' }; // Mock user
    
    // Set user on request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid authentication' });
  }
};

// Route to create a Face Liveness session
app.post('/api/create-face-liveness-session', authenticate, async (req, res) => {
  console.log('Creating Face Liveness session with userId:', req.body.userId);
  try {
    const { userId } = req.body;
    
    // Ensure the request is authorized
    if (req.user.id !== userId && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not authorized to create a session for this user' 
      });
    }
    
    console.log('[SERVER] Creating Face Liveness session with S3 bucket:', FACE_LIVENESS_S3_BUCKET);
    
    // Create a Face Liveness session with AWS Rekognition
    const command = new CreateFaceLivenessSessionCommand({
      ClientRequestToken: `session-${userId}-${Date.now()}`,
      Settings: {
        OutputConfig: {
          S3Bucket: FACE_LIVENESS_S3_BUCKET,
          S3KeyPrefix: `face-liveness/${userId}/`
        }
      }
    });
    
    console.log('[SERVER] Sending CreateFaceLivenessSessionCommand:', JSON.stringify(command, null, 2));
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

// Route to get Face Liveness session results
app.post('/api/get-face-liveness-results', authenticate, async (req, res) => {
  console.log('Getting Face Liveness results with sessionId:', req.body.sessionId);
  try {
    const { sessionId, userId } = req.body;
    
    // Ensure the request is authorized
    if (req.user.id !== userId && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not authorized to access session results for this user' 
      });
    }
    
    // Get the results of a Face Liveness session from AWS Rekognition
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId
    });
    
    console.log('[SERVER] Sending GetFaceLivenessSessionResultsCommand for session:', sessionId);
    const response = await rekognitionClient.send(command);
    console.log('[SERVER] Received Face Liveness results:', JSON.stringify({
      Status: response.Status,
      Confidence: response.Confidence,
      ReferenceImage: response.ReferenceImage ? 'Present' : 'Not present',
      AuditImages: response.AuditImages ? response.AuditImages.length : 0
    }, null, 2));
    
    // Process the response
    const confidenceThreshold = parseFloat(process.env.VITE_FACE_LIVENESS_CONFIDENCE_THRESHOLD || '90');
    const result = {
      isLive: response.Status === 'SUCCEEDED' && response.Confidence >= confidenceThreshold,
      confidence: response.Confidence || 0,
      status: response.Status,
      referenceImage: response.ReferenceImage?.S3ObjectKey 
        ? `https://${FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${response.ReferenceImage.S3ObjectKey}`
        : null,
      auditImages: response.AuditImages?.map(img => 
        img.S3ObjectKey 
          ? `https://${FACE_LIVENESS_S3_BUCKET}.s3.amazonaws.com/${img.S3ObjectKey}`
          : null
      ).filter(Boolean) || []
    };
    
    console.log(`Face Liveness results retrieved for session ${sessionId}, isLive: ${result.isLive}, confidence: ${result.confidence}`);
    
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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server with error handling for port conflicts
let server;
const startServer = () => {
  try {
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle errors during startup
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is in use, trying ${PORT + 1}...`);
        PORT++;
        server.close();
        startServer();
      } else {
        console.error('Server error:', error);
      }
    });
    
    // Handle process termination
    process.on('SIGTERM', shutDown);
    process.on('SIGINT', shutDown);
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

// Graceful shutdown
const shutDown = () => {
  console.log('Received kill signal, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });
    
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
};

// Start the server
startServer();

export default app; 