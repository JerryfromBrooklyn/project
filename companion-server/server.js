const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const companion = require('@uppy/companion');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const AWS = require('aws-sdk');
const { HeadObjectCommand, DetectFacesCommand, SearchFacesByImageCommand, QueryCommand, PutCommand } = require('@aws-sdk/client-dynamodb');

// Debug: Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log('\n🔍 Checking .env file...');
console.log('📁 .env file path:', envPath);
console.log('✅ .env file exists:', fs.existsSync(envPath) ? 'Yes' : 'No');

// Load environment variables
require('dotenv').config({ path: envPath });

// Debug: Log all environment variables in a formatted way
console.log('\n📋 Environment Variables Status:');
console.log('----------------------------------------');
console.log('Server Configuration:');
console.log('----------------------------------------');
console.log('COMPANION_HOST:', process.env.COMPANION_HOST || '❌ Not Set');
console.log('COMPANION_PROTOCOL:', process.env.COMPANION_PROTOCOL || '❌ Not Set');
console.log('COMPANION_SECRET:', process.env.COMPANION_SECRET ? '✅ Set' : '❌ Not Set');
console.log('COMPANION_DATADIR:', process.env.COMPANION_DATADIR || '❌ Not Set');
console.log('\nOAuth Configuration:');
console.log('----------------------------------------');
console.log('COMPANION_GOOGLE_KEY:', process.env.COMPANION_GOOGLE_KEY ? '✅ Set' : '❌ Not Set');
console.log('COMPANION_GOOGLE_SECRET:', process.env.COMPANION_GOOGLE_SECRET ? '✅ Set' : '❌ Not Set');
console.log('COMPANION_DROPBOX_KEY:', process.env.COMPANION_DROPBOX_KEY ? '✅ Set' : '❌ Not Set');
console.log('COMPANION_DROPBOX_SECRET:', process.env.COMPANION_DROPBOX_SECRET ? '✅ Set' : '❌ Not Set');
console.log('\nURL Configuration:');
console.log('----------------------------------------');
console.log('VITE_COMPANION_URL:', process.env.VITE_COMPANION_URL || '❌ Not Set');
console.log('\nS3 Configuration:');
console.log('----------------------------------------');
console.log('COMPANION_AWS_KEY:', process.env.COMPANION_AWS_KEY ? '✅ Set' : '❌ Not Set');
console.log('COMPANION_AWS_SECRET:', process.env.COMPANION_AWS_SECRET ? '✅ Set' : '❌ Not Set');
console.log('COMPANION_AWS_BUCKET:', process.env.COMPANION_AWS_BUCKET || '❌ Not Set');
console.log('COMPANION_AWS_REGION:', process.env.COMPANION_AWS_REGION || '❌ Not Set');
console.log('----------------------------------------\n');

const app = express();

// Required middleware
app.use(bodyParser.json());
app.use(session({
  secret: process.env.COMPANION_SECRET || 'some-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COMPANION_PROTOCOL === 'https',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add this before the companionOptions definition
const DEFAULT_USER_ID = 'default-user';
const DEFAULT_USERNAME = 'default-user';

// Extract auth user info from headers and query parameters
const extractUserInfoFromHeaders = (req) => {
  try {
    // Check if req is null or undefined
    if (!req) {
      console.log('⚠️ [COMPANION] extractUserInfoFromHeaders called with null/undefined req');
      return { userId: DEFAULT_USER_ID, username: DEFAULT_USERNAME };
    }
    
    // First check query parameters (highest priority)
    if (req.query && req.query.userId) {
      console.log('✅ [COMPANION] Found user ID in query parameters:', req.query.userId);
      return {
        userId: req.query.userId,
        username: req.query.username || DEFAULT_USERNAME
      };
    }
    
    // Next, check for X-User-Data header (contains JSON)
    if (req.headers && req.headers['x-user-data']) {
      try {
        const userData = JSON.parse(req.headers['x-user-data']);
        if (userData.userId) {
          console.log('✅ [COMPANION] Found user ID in X-User-Data header:', userData.userId);
          return {
            userId: userData.userId,
            username: userData.username || DEFAULT_USERNAME
          };
        }
      } catch (e) {
        console.error('❌ [COMPANION] Error parsing X-User-Data header:', e);
      }
    }
    
    // Check authorization header
    const authHeader = req?.headers?.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      // If there's a token, we might be able to decode it (depends on your token format)
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('📝 [COMPANION] Found auth token:', token.substring(0, 15) + '...');
      // You could implement JWT decoding here to extract user info
    }
    
    // Finally, check old-style custom headers
    const userId = req?.headers?.['x-user-id'] || DEFAULT_USER_ID;
    const username = req?.headers?.['x-username'] || DEFAULT_USERNAME;
    
    return { userId, username };
  } catch (error) {
    console.error('❌ [COMPANION] Error extracting user info from headers:', error);
    return { userId: DEFAULT_USER_ID, username: DEFAULT_USERNAME };
  }
};

// Add a function to extract metadata from a typical Dropbox/Google Drive request
const extractMetadataFromProvider = (req) => {
  // For Dropbox/Google Drive, find info from the URL path parameters
  try {
    // Check if req is null
    if (!req) {
      console.log('⚠️ [COMPANION] extractMetadataFromProvider called with null/undefined req');
      return {
        userId: DEFAULT_USER_ID,
        username: DEFAULT_USERNAME
      };
    }
    
    // First check the query parameters
    if (req.query && req.query.userId) {
      console.log('✅ [COMPANION] Found user ID in provider request query params:', req.query.userId);
      return {
        userId: req.query.userId,
        username: req.query.username || DEFAULT_USERNAME
      };
    }
    
    // Check if this is a provider request
    const url = req.url || '';
    const isProviderRequest = url.includes('/dropbox/') || 
                              url.includes('/google/') || 
                              url.includes('/drive/');
    
    if (isProviderRequest) {
      console.log('📂 [COMPANION] Detected provider request:', url);
      
      // Extract query parameters from the URL if not parsed automatically
      const urlObj = new URL('http://localhost' + url);
      const urlParams = urlObj.searchParams;
      if (urlParams.has('userId')) {
        console.log('✅ [COMPANION] Found user ID in URL params:', urlParams.get('userId'));
        return {
          userId: urlParams.get('userId'),
          username: urlParams.get('username') || DEFAULT_USERNAME
        };
      }
      
      // Try to extract from custom X-User-Data header
      if (req.headers && req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data']);
          if (userData.userId) {
            console.log('✅ [COMPANION] Found user ID in X-User-Data header:', userData.userId);
            return {
              userId: userData.userId,
              username: userData.username || DEFAULT_USERNAME
            };
          }
        } catch (e) {
          console.error('❌ [COMPANION] Error parsing X-User-Data header:', e);
        }
      }
      
      // Try to extract from Authorization header if it exists
      const authHeader = req.headers?.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        console.log('🔑 [COMPANION] Found auth token in provider request');
        // You could decode the token here to get user info
      }
    }
    
    return {
      userId: DEFAULT_USER_ID,
      username: DEFAULT_USERNAME
    };
  } catch (error) {
    console.error('❌ [COMPANION] Error extracting metadata from provider request:', error);
    return {
      userId: DEFAULT_USER_ID, 
      username: DEFAULT_USERNAME
    };
  }
};

// Store user metadata when discovered for later retrieval
const userMetadataStore = new Map();

// Add this middleware captures headers early and stores them for later use
app.use((req, res, next) => {
  try {
    // Store headers on the session to maintain state across redirects
    if (req.session && req.headers && req.headers['x-user-data']) {
      console.log('🔍 [COMPANION] Storing X-User-Data header in session');
      req.session.userData = req.headers['x-user-data'];
      
      // Also store in our global map using socket ID or a session ID as key
      try {
        const userData = JSON.parse(req.headers['x-user-data']);
        if (userData.userId) {
          // Use session ID as key
          const sessionKey = req.session.id || 'default-session';
          userMetadataStore.set(sessionKey, userData);
          console.log(`📦 [COMPANION] Stored user metadata in global map with key: ${sessionKey}`);
        }
      } catch (e) {
        console.error('❌ [COMPANION] Error parsing X-User-Data for global store:', e);
      }
    } 
    
    // If we don't have headers but have session data, use it
    if (req.session && req.session.userData && (!req.headers || !req.headers['x-user-data'])) {
      console.log('🔄 [COMPANION] Restoring user data from session');
      if (!req.headers) req.headers = {};
      req.headers['x-user-data'] = req.session.userData;
    }
    
    // Log the current headers and session state
    if (req.url && (req.url.includes('/dropbox') || req.url.includes('/google'))) {
      console.log('🔍 [COMPANION] OAuth flow request:', req.url);
      console.log('Session has userData:', req.session && req.session.userData ? 'Yes' : 'No');
      console.log('Headers has x-user-data:', req.headers && req.headers['x-user-data'] ? 'Yes' : 'No');
    }
    
    next();
  } catch (error) {
    console.error('❌ [COMPANION] Error in session middleware:', error);
    next();
  }
});

// Middleware to intercept and prepare for both upload and provider requests
app.use((req, res, next) => {
  try {
    // Make sure req.url exists before checking it
    const url = req?.url || '';
    
    // For all requests, extract user data from headers or session
    let userData = null;
    
    // Check for X-User-Data header
    if (req.headers && req.headers['x-user-data']) {
      try {
        userData = JSON.parse(req.headers['x-user-data']);
        console.log('✅ [COMPANION] Found user data in X-User-Data header:', userData.userId);
      } catch (e) {
        console.error('❌ [COMPANION] Error parsing X-User-Data header:', e);
      }
    } 
    // Check for data in session as fallback
    else if (req.session && req.session.userData) {
      try {
        userData = JSON.parse(req.session.userData);
        console.log('✅ [COMPANION] Found user data in session:', userData.userId);
      } catch (e) {
        console.error('❌ [COMPANION] Error parsing session userData:', e);
      }
    }
    
    // If we found valid user data, set it as companion metadata
    if (userData && userData.userId) {
      req.companionMetadata = {
        userId: userData.userId,
        username: userData.username || DEFAULT_USERNAME
      };
      console.log('📎 [COMPANION] Created metadata from user data:', JSON.stringify(req.companionMetadata, null, 2));
    }
    
    // If this is an S3 upload request, check for metadata in the body too
    if (url.includes('/s3/multipart') || url.includes('/s3/upload')) {
      console.log('🔄 [COMPANION] Intercepting S3 upload request');
      
      // If we already have metadata from headers, don't overwrite it unless we find something in the body
      if (!req.companionMetadata && req.body && req.body.metadata) {
        const bodyMetadata = req.body.metadata;
        req.companionMetadata = bodyMetadata;
        console.log('📎 [COMPANION] Created metadata from request body:', JSON.stringify(bodyMetadata, null, 2));
      }
    }
    // For provider requests (Dropbox/Google Drive)
    else if (url.includes('/dropbox/') || url.includes('/google/') || url.includes('/drive/')) {
      console.log('🔄 [COMPANION] Intercepting provider request:', url);
      
      // We already tried to set companionMetadata from headers above
      // If we don't have it yet, try provider-specific extraction
      if (!req.companionMetadata) {
        const providerMetadata = extractMetadataFromProvider(req);
        req.companionMetadata = providerMetadata;
        console.log('📎 [COMPANION] Created metadata for provider request:', JSON.stringify(providerMetadata, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ [COMPANION] Error in middleware:', error);
    // Don't set req.companionMetadata if there's an error,
    // the getKey function has fallbacks
  }
  
  next();
});

// Add this after the CORS middleware but before the companion app initialization
app.get('/test-params', (req, res) => {
  console.log('📋 [COMPANION] Test params route called');
  console.log('Query parameters:', req.query);
  console.log('Headers:', req.headers);
  
  // Extract user info
  const userInfo = extractUserInfoFromHeaders(req);
  
  res.json({
    success: true,
    message: 'Parameters received',
    queryParams: req.query,
    headers: {
      authorization: req.headers.authorization ? 'Present (hidden)' : 'Not present',
      'x-user-data': req.headers['x-user-data'] || 'Not present',
      'x-user-id': req.headers['x-user-id'] || 'Not present',
      'x-username': req.headers['x-username'] || 'Not present'
    },
    extractedUserInfo: userInfo
  });
});

// This middleware updates the req.companion.options.s3.getKey function at runtime
// to include the user info from query parameters 
app.use((req, res, next) => {
  try {
    // Check for query parameters
    if (req.query && (req.query.userId || req.query.username)) {
      console.log('🔍 [COMPANION] Found user info in query parameters, setting companionMetadata');
      
      // Create metadata from query parameters
      req.companionMetadata = {
        userId: req.query.userId || DEFAULT_USER_ID,
        username: req.query.username || DEFAULT_USERNAME
      };
      
      console.log('📎 [COMPANION] Created metadata from query parameters:', JSON.stringify(req.companionMetadata, null, 2));
    }
  } catch (error) {
    console.error('❌ [COMPANION] Error in query parameter middleware:', error);
  }
  
  next();
});

// Configure AWS SDK
const configureAWS = () => {
  // Configure AWS from environment variables
  const accessKeyId = process.env.COMPANION_AWS_KEY;
  const secretAccessKey = process.env.COMPANION_AWS_SECRET;
  const region = process.env.COMPANION_AWS_REGION || 'us-east-1';
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ AWS credentials not configured');
    return false;
  }
  
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region
  });
  
  return true;
};

// Initialize AWS SDK clients
let s3Client;
let rekognitionClient;
let dynamoDbClient;
let docClient;

// Initialize AWS if credentials are available
if (configureAWS()) {
  s3Client = new AWS.S3();
  rekognitionClient = new AWS.Rekognition();
  dynamoDbClient = new AWS.DynamoDB();
  docClient = new AWS.DynamoDB.DocumentClient();
  console.log('✅ AWS SDK initialized successfully');
} else {
  console.log('⚠️ AWS SDK not initialized, face processing will not be available');
}

// Constants
const FACE_COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || 'shmong-faces';
const PHOTOS_TABLE = process.env.DYNAMODB_PHOTOS_TABLE || 'shmong-photos';
const DETECTED_FACES_TABLE = process.env.DYNAMODB_FACES_TABLE || 'shmong-detected-faces';

// Function to process an uploaded file (similar to awsPhotoService.uploadPhoto)
const processUploadedFile = async (s3Path, fileData, metadata) => {
  try {
    console.log('------------------------------------');
    console.log(`🔍 [COMPANION] PROCESSING UPLOADED FILE: ${s3Path}`);
    console.log('------------------------------------');
    
    // Validate AWS services are available
    if (!s3Client || !rekognitionClient || !docClient) {
      console.error('❌ [COMPANION] AWS services not initialized');
      return { success: false, error: 'AWS services not initialized' };
    }
    
    // Parse metadata
    const userId = metadata.userId || metadata.user_id || 'default-user';
    const username = metadata.username || 'default-user';
    
    // Generate photo ID
    const photoId = uuid();
    
    // 1. File should already be in S3, construct URL
    const bucketName = process.env.COMPANION_AWS_BUCKET;
    
    // Format S3 paths consistently - ensure no double-slashes
    let formattedS3Path = s3Path;
    if (formattedS3Path.startsWith('/')) {
      formattedS3Path = formattedS3Path.substring(1);
    }
    
    // Construct S3 URL
    const s3Url = `https://${bucketName}.s3.amazonaws.com/${formattedS3Path}`;
    console.log(`🔗 [COMPANION] S3 URL: ${s3Url}`);
    
    // 2. Check if the file exists in S3
    let s3FileExists = false;
    try {
      await s3Client.headObject({
        Bucket: bucketName,
        Key: formattedS3Path
      }).promise();
      s3FileExists = true;
      console.log(`✅ [COMPANION] File exists in S3: ${formattedS3Path}`);
    } catch (error) {
      console.error(`❌ [COMPANION] File not found in S3 or access error: ${formattedS3Path}`, error);
      // We'll continue and try to create database record anyway
    }
    
    // 3. Process faces with Amazon Rekognition
    let facesData = [];
    let matchedUsers = [];
    
    if (s3FileExists) {
      try {
        console.log(`🔍 [COMPANION] Detecting faces in: ${formattedS3Path}`);
        const detectFacesResponse = await rekognitionClient.detectFaces({
          Image: {
            S3Object: {
              Bucket: bucketName,
              Name: formattedS3Path
            }
          },
          Attributes: ['ALL']
        }).promise();
        
        console.log(`🧠 [COMPANION] Face detection results:`, JSON.stringify(detectFacesResponse, null, 2));
        
        if (detectFacesResponse.FaceDetails && detectFacesResponse.FaceDetails.length > 0) {
          facesData = detectFacesResponse.FaceDetails.map((face, index) => ({
            id: `face-${photoId}-${index}`,
            confidence: face.Confidence,
            boundingBox: face.BoundingBox,
            landmarks: face.Landmarks,
            pose: face.Pose,
            quality: face.Quality,
            emotions: face.Emotions,
            age_range: face.AgeRange,
            gender: face.Gender,
            face_index: index
          }));
          
          console.log(`🧠 [COMPANION] Detected ${facesData.length} faces in photo`);
          
          // Skip face search if no faces detected
          if (facesData.length > 0) {
            // Search for matching faces in our collection
            console.log(`🔍 [COMPANION] Searching for matches in collection: ${FACE_COLLECTION_ID}`);
            try {
              const searchFacesResponse = await rekognitionClient.searchFacesByImage({
                CollectionId: FACE_COLLECTION_ID,
                Image: {
                  S3Object: {
                    Bucket: bucketName,
                    Name: formattedS3Path
                  }
                },
                MaxFaces: 5,
                FaceMatchThreshold: 80
              }).promise();
              
              console.log(`🔍 [COMPANION] Face match results:`, JSON.stringify(searchFacesResponse, null, 2));
              
              if (searchFacesResponse.FaceMatches && searchFacesResponse.FaceMatches.length > 0) {
                // Process each matched face
                for (const match of searchFacesResponse.FaceMatches) {
                  const faceId = match.Face.FaceId;
                  const similarity = match.Similarity;
                  
                  // Get user associated with this face from DynamoDB
                  const getUserParams = {
                    TableName: DETECTED_FACES_TABLE,
                    KeyConditionExpression: 'face_id = :faceId',
                    ExpressionAttributeValues: {
                      ':faceId': faceId
                    }
                  };
                  
                  const userResult = await docClient.query(getUserParams).promise();
                  
                  if (userResult.Items && userResult.Items.length > 0) {
                    const userItem = userResult.Items[0];
                    console.log(`🔍 [COMPANION] Found user for face ${faceId}:`, userItem);
                    
                    // Add to matched users array
                    matchedUsers.push({
                      userId: userItem.user_id,
                      faceId: faceId,
                      similarity: similarity,
                      name: userItem.username || userItem.name || 'Unknown User'
                    });
                  } else {
                    console.log(`🔍 [COMPANION] No user found for face ${faceId}`);
                  }
                }
                
                console.log(`🔍 [COMPANION] Found ${matchedUsers.length} matching users`);
              } else {
                console.log(`🔍 [COMPANION] No matching faces found in collection`);
              }
            } catch (error) {
              console.error(`❌ [COMPANION] Error searching for faces:`, error);
              // Continue with the upload without face matches
            }
          }
        } else {
          console.log(`🧠 [COMPANION] No faces detected in photo`);
        }
      } catch (error) {
        console.error(`❌ [COMPANION] Error processing faces:`, error);
        // Continue with the upload without face processing
      }
    } else {
      console.warn(`⚠️ [COMPANION] Skipping face processing because file not found in S3`);
    }
    
    // 4. Save metadata to DynamoDB
    console.log(`💾 [COMPANION] Saving photo metadata to DynamoDB`);
    
    const now = new Date().toISOString();
    const photoMetadata = {
      id: photoId,
      user_id: userId,
      userId: userId, // duplicate for consistent access
      username: username,
      created_at: now,
      updated_at: now,
      storage_path: formattedS3Path,
      url: s3Url,
      public_url: s3Url, // duplicate for consistent access
      file_size: fileData.size || 0,
      file_type: fileData.type || 'image/jpeg',
      // Add optional metadata fields if provided
      eventId: metadata.eventId || '',
      eventName: metadata.eventName || '',
      venueName: metadata.venueName || '',
      promoterName: metadata.promoterName || '',
      date: metadata.date || now.split('T')[0],
      // Add nested structures if available
      event_details: metadata.event_details || {},
      venue: metadata.venue || {},
      promoter: metadata.promoter || {},
      location: metadata.location || {},
      // Add face data
      faces: facesData,
      matched_users: matchedUsers,
      matched_users_list: matchedUsers, // Add extra field for consistent access
      // Source tracking (for UI filtering and identification) 
      source: metadata.source || 'companion',
      // Timestamp for sorting
      timestamp: Date.now()
    };
    
    // Save to DynamoDB
    const params = {
      TableName: PHOTOS_TABLE,
      Item: photoMetadata
    };
    
    await docClient.put(params).promise();
    console.log(`✅ [COMPANION] Saved photo metadata to DynamoDB: ${photoId}`);
    
    return {
      success: true,
      photoId: photoId,
      photoMetadata: photoMetadata
    };
  } catch (error) {
    console.error(`❌ [COMPANION] Error processing uploaded file:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add this after the companionOptions definition but before the companion app initialization
const handleUploadComplete = async (payload) => {
  try {
    console.log('🎉 [COMPANION] Upload complete event received:', JSON.stringify(payload, null, 2));
    
    // Extract key from S3 URL 
    const s3Url = payload.url;
    const bucketName = process.env.COMPANION_AWS_BUCKET;
    const s3Path = s3Url ? s3Url.replace(`https://${bucketName}.s3.amazonaws.com/`, '') : null;
    
    // Extract storage path in various formats (handle socket events and companion events differently)
    let storagePath = s3Path;
    if (!storagePath && payload.uploadURL) {
      storagePath = payload.uploadURL.replace(`https://${bucketName}.s3.amazonaws.com/`, '');
    }
    
    console.log(`🔍 [COMPANION] Processing upload: ${storagePath || 'Unknown path'}`);
    
    // Get metadata from the payload
    let fileMetadata = payload.metadata || {};
    const fileData = payload.file || {};
    
    console.log(`📋 [COMPANION] Initial metadata:`, JSON.stringify(fileMetadata, null, 2));
    
    // Get user data from our store - try multiple possible keys
    let userData = null;
    
    // First check if we have a direct mapping for this upload ID
    if (payload.uploadId && userMetadataStore.has(`uploadId:${payload.uploadId}`)) {
      userData = userMetadataStore.get(`uploadId:${payload.uploadId}`);
      console.log(`👤 [COMPANION] Found user data for upload ID ${payload.uploadId}:`, userData);
    }
    
    // Then check for S3 key mapping
    if (!userData && storagePath && userMetadataStore.has(`s3key:${storagePath}`)) {
      userData = userMetadataStore.get(`s3key:${storagePath}`);
      console.log(`👤 [COMPANION] Found user data for S3 key ${storagePath}:`, userData);
    }
    
    // Try socket ID
    if (!userData && payload.socketId) {
      userData = userMetadataStore.get(payload.socketId);
      console.log(`👤 [COMPANION] Found user data for socket ${payload.socketId}:`, userData);
    }
    
    // Try session ID
    if (!userData && payload.sessionId) {
      userData = userMetadataStore.get(payload.sessionId);
      console.log(`👤 [COMPANION] Found user data for session ${payload.sessionId}:`, userData);
    }
    
    // Extract user ID directly from S3 path as a last resort
    // Format: photos/userId/fileId_filename
    if (!userData && storagePath) {
      const pathParts = storagePath.split('/');
      if (pathParts.length >= 2 && pathParts[0] === 'photos') {
        const pathUserId = pathParts[1];
        console.log(`👤 [COMPANION] Extracted user ID from S3 path: ${pathUserId}`);
        userData = {
          userId: pathUserId,
          username: fileMetadata.username || DEFAULT_USERNAME
        };
      }
    }
    
    // If we still don't have user data, try to use metadata from the payload
    if (!userData && (fileMetadata.userId || fileMetadata.user_id)) {
      console.log('👤 [COMPANION] Using user data from payload metadata');
      userData = {
        userId: fileMetadata.userId || fileMetadata.user_id,
        username: fileMetadata.username || DEFAULT_USERNAME,
        eventId: fileMetadata.eventId || ''
      };
    }
    
    // If we still don't have user data, use defaults
    if (!userData) {
      console.log('⚠️ [COMPANION] No user data found, using defaults');
      userData = {
        userId: DEFAULT_USER_ID,
        username: DEFAULT_USERNAME
      };
    }
    
    // Ensure the metadata has all the necessary user fields
    const enhancedMetadata = {
      ...fileMetadata,
      userId: userData.userId,
      user_id: userData.userId,
      uploadedBy: userData.userId,
      uploaded_by: userData.userId,
      username: userData.username,
      eventId: userData.eventId || fileMetadata.eventId || '',
      timestamp: Date.now(),
      source: fileMetadata.source || 'companion'
    };
    
    console.log('📤 [COMPANION] Processing with enhanced metadata:', JSON.stringify(enhancedMetadata, null, 2));
    
    // If we don't have a storage path, we can't process the upload
    if (!storagePath) {
      console.error('❌ [COMPANION] No storage path found, cannot process upload');
      throw new Error('No storage path found in payload');
    }
    
    // Process the upload
    const result = await processUploadedFile(storagePath, fileData, enhancedMetadata);
    
    console.log('✅ [COMPANION] Upload processing result:', JSON.stringify(result, null, 2));
    
    // If successful, explicitly send the proper S3 URL back to the client 
    // This ensures the client uses the S3 URL, not any temporary provider URL
    if (result.success && result.photoMetadata) {
      // Ensure we're using S3 URLs, not temporary provider URLs
      const s3Url = result.photoMetadata.url;
      
      // Update URL fields to ensure they're using S3 URLs
      if (result.photoMetadata.url && (
        result.photoMetadata.url.includes('localhost:3020') || 
        result.photoMetadata.url.includes('/companion/') || 
        result.photoMetadata.url.includes('/dropbox/') ||
        result.photoMetadata.url.includes('/drive/')
      )) {
        console.log(`🔄 [COMPANION] Fixing photoMetadata URLs before sending to client:
          From: ${result.photoMetadata.url}
          To: ${s3Url}`);
        
        // Force update URLs to use S3
        result.photoMetadata.url = s3Url;
        result.photoMetadata.public_url = s3Url;
      }
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ [COMPANION] Error processing upload:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Companion configuration
const companionOptions = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET
    },
    dropbox: {
      key: process.env.COMPANION_DROPBOX_KEY,
      secret: process.env.COMPANION_DROPBOX_SECRET,
      oauth: {
        domain: process.env.VITE_COMPANION_URL || 'http://localhost:3020',
        transport: 'session'
      }
    }
  },
  s3: {
    key: process.env.COMPANION_AWS_KEY,
    secret: process.env.COMPANION_AWS_SECRET,
    bucket: process.env.COMPANION_AWS_BUCKET,
    region: process.env.COMPANION_AWS_REGION || 'us-east-1',
    useAccelerateEndpoint: false,
    expires: 3600,
    acl: 'private',
    getKey: (req, filename) => {
      try {
        // More detailed logging of the request
        console.log('📋 [COMPANION] Full Request debug:');
        console.log('Headers:', JSON.stringify(req?.headers || {}, null, 2));
        console.log('Body structure:', Object.keys(req?.body || {}).join(', '));
        console.log('Query params:', JSON.stringify(req?.query || {}, null, 2));
        console.log('Files:', req?.files ? Object.keys(req?.files).join(', ') : 'No files');
        
        // Try to get user info from headers as a fallback
        const headerUserInfo = extractUserInfoFromHeaders(req);
        
        // Initialize with safe empty object
        let foundMetadata = {};
        
        // Try to access companionMetadata safely
        if (req && req.companionMetadata) {
          foundMetadata = req.companionMetadata;
          console.log('✅ [COMPANION] Using req.companionMetadata:', JSON.stringify(foundMetadata, null, 2));
        } else {
          // If companionMetadata is not available, check other locations
          if (req) {
            const possibleMetadataLocations = [
              req.body?.metadata,
              req.query?.metadata,
              req.body?.meta,
              req.body?.params?.metadata,
              req.body?.data?.metadata,
              typeof req?.body === 'string' ? JSON.parse(req?.body || '{}')?.metadata : undefined
            ].filter(Boolean); // Filter out undefined/null values
            
            console.log('🔍 [COMPANION] Possible metadata locations found:', possibleMetadataLocations.length);
            
            if (possibleMetadataLocations.length > 0) {
              foundMetadata = possibleMetadataLocations[0];
              console.log('✅ [COMPANION] Found metadata in request:', JSON.stringify(foundMetadata, null, 2));
            } else {
              console.log('❌ [COMPANION] No metadata found in any location, checking session');
              
              // Check for session-based metadata
              if (req.session && req.session.userData) {
                try {
                  const sessionData = typeof req.session.userData === 'string' 
                    ? JSON.parse(req.session.userData) 
                    : req.session.userData;
                    
                  if (sessionData.userId || sessionData.user_id) {
                    foundMetadata = sessionData;
                    console.log('✅ [COMPANION] Using metadata from session:', JSON.stringify(foundMetadata, null, 2));
                  }
                } catch (e) {
                  console.error('❌ [COMPANION] Error parsing session userData:', e);
                }
              } else {
                console.log('❌ [COMPANION] No session metadata found, using empty object');
              }
            }
          } else {
            console.log('⚠️ [COMPANION] req object is null or undefined');
          }
            
          // Try to get metadata from our global store
          // Check if we have a socket connection ID or session ID
          const socketId = req?.socketId || (req?.uppy && req?.uppy.sessionID);
          
          // Try all possible session keys
          const possibleKeys = [
            socketId,
            req?.session?.id,
            'default-session'
          ].filter(Boolean);
          
          console.log('🔍 [COMPANION] Looking for metadata with session keys:', possibleKeys);
          
          // Try each key
          for (const key of possibleKeys) {
            if (userMetadataStore.has(key)) {
              const storeMetadata = userMetadataStore.get(key);
              // Only use if we don't already have better metadata
              if (Object.keys(foundMetadata).length === 0 || !foundMetadata.userId) {
                foundMetadata = storeMetadata;
                console.log(`✅ [COMPANION] Found metadata in global store with key ${key}:`, 
                    JSON.stringify(foundMetadata, null, 2));
                break;
              }
            }
          }
          
          // If we still don't have metadata, check all entries in the store
          if (Object.keys(foundMetadata).length === 0 && !foundMetadata.userId && userMetadataStore.size > 0) {
            console.log(`🔍 [COMPANION] Searching all ${userMetadataStore.size} entries in metadata store`);
            // Just get the first entry as a fallback
            const firstKey = Array.from(userMetadataStore.keys())[0];
            foundMetadata = userMetadataStore.get(firstKey);
            console.log(`✅ [COMPANION] Using first available metadata with key ${firstKey}:`, 
                JSON.stringify(foundMetadata, null, 2));
          }
        }
        
        // Get user ID from metadata (check multiple possible fields)
        let userId = foundMetadata.userId || 
                    foundMetadata.user_id || 
                    foundMetadata.uploadedBy || 
                    foundMetadata.uploaded_by || 
                    headerUserInfo.userId || 
                    DEFAULT_USER_ID;
        
        // Extract username from metadata
        let username = foundMetadata.username || headerUserInfo.username || DEFAULT_USERNAME;
        
        console.log('🔑 [COMPANION] Using user ID:', userId);
        console.log('👤 [COMPANION] Using username:', username);
        
        // Get folder path from metadata
        const folderPath = foundMetadata?.folderPath || '';
        
        // Generate a unique key for the file
        const fileId = Math.random().toString(36).substring(2, 15);
        
        // Use the original filename if available, otherwise use a default
        const originalFilename = filename || 'unnamed-file';
        
        // Construct the key with folder path USING THE SAME FORMAT AS LOCAL UPLOADS
        // Local format: photos/userId/fileId_filename (no username segment)
        const key = folderPath 
          ? `photos/${userId}/${folderPath}/${fileId}_${originalFilename}`
          : `photos/${userId}/${fileId}_${originalFilename}`;
        
        console.log('📤 [COMPANION] S3 Upload - Generated key:', key, {
          userId,
          username,
          folderPath,
          fileId,
          filename: originalFilename,
          fullPath: `s3://${process.env.COMPANION_AWS_BUCKET}/${key}`,
          localPath: path.join(process.env.COMPANION_DATADIR || './uploads', key),
          requestType: req?.method || 'unknown',
          contentType: req?.headers?.['content-type'] || 'unknown',
          metadata: foundMetadata || 'No metadata'
        });
        
        // Store this mapping for later use
        // This helps us associate the S3 key with the correct user during afterComplete
        if (req?.session?.id) {
          userMetadataStore.set(`s3key:${key}`, {
            userId: userId,
            username: username,
            sessionId: req.session.id,
            timestamp: Date.now()
          });
          console.log(`📦 [COMPANION] Stored metadata mapping for S3 key: ${key}`);
        }
        
        return key;
      } catch (error) {
        console.error('❌ [COMPANION] Error in getKey:', error);
        const fileId = Math.random().toString(36).substring(2, 15);
        const safeFilename = filename || 'unnamed-file';
        // Use the simple format even in the fallback case
        const fallbackKey = `photos/${DEFAULT_USER_ID}/${fileId}_${safeFilename}`;
        console.log('🚨 [COMPANION] Using fallback key:', fallbackKey);
        return fallbackKey;
      }
    }
  },
  server: {
    host: process.env.COMPANION_HOST || 'localhost:3020',
    protocol: process.env.COMPANION_PROTOCOL || 'http'
  },
  filePath: process.env.COMPANION_DATADIR || './uploads',
  secret: process.env.COMPANION_SECRET || 'some-secret-key',
  debug: true,
  corsOrigins: ['http://localhost:5173', 'http://localhost:5174'],
  uploadUrls: ['http://localhost:5173', 'http://localhost:5174'],
  oauthDomain: process.env.VITE_COMPANION_URL || 'http://localhost:3020',
  validHosts: [process.env.VITE_COMPANION_URL || 'http://localhost:3020'],
  streamingUpload: true,
  chunkSize: 6 * 1024 * 1024, // 6MB chunks
  enableUrlEndpoint: true,
  enableGooglePickerEndpoint: true,
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With', 'uppy-auth-token', 'x-user-id', 'x-username', 'X-User-Data'],
  encryption: {
    key: process.env.COMPANION_ENCRYPTION_KEY || process.env.COMPANION_SECRET,
    algorithm: 'aes-256-gcm'
  },
  logger: {
    debug: (...args) => {
      if (args[0]?.includes('upload')) {
        console.log('📤 Upload Debug:', ...args);
        // Add specific logging for file paths
        if (args[0]?.includes('getKey')) {
          console.log('📁 File Path Details:', {
            requestPath: args[1]?.path,
            filePath: args[1]?.filePath,
            uploadPath: args[1]?.uploadPath,
            metadata: args[1]?.metadata
          });
        }
      }
    },
    info: (...args) => {
      if (args[0]?.includes('upload')) {
        console.log('📤 Upload Info:', ...args);
        // Add specific logging for file paths
        if (args[0]?.includes('path')) {
          console.log('📁 File Path Info:', {
            path: args[1],
            metadata: args[2]
          });
        }
      }
    },
    error: (...args) => {
      if (args[0]?.includes('upload')) {
        console.error('❌ Upload Error:', ...args);
        // Add specific logging for file path errors
        if (args[0]?.includes('path')) {
          console.error('❌ File Path Error:', {
            error: args[1],
            path: args[2]
          });
        }
      }
    }
  },
  hooks: {
    afterComplete: handleUploadComplete
  }
};

// Debug companion options
console.log('Companion Options:', {
  server: companionOptions.server,
  filePath: companionOptions.filePath,
  secret: companionOptions.secret ? 'Set' : 'Not Set'
});

// Add CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With, uppy-auth-token, x-user-id, x-username, X-User-Data');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Custom middleware to check and log all incoming requests with metadata
app.use((req, res, next) => {
  // Only log for upload related endpoints
  if (req.path && (req.path.includes('s3') || req.path.includes('upload'))) {
    console.log('🔄 [COMPANION] Incoming request to:', req.method, req.path);
    console.log('📦 [COMPANION] Request metadata check:');
    
    if (req.body && req.body.metadata) {
      console.log('✅ [COMPANION] Metadata found in req.body.metadata:', JSON.stringify(req.body.metadata, null, 2));
    } else if (req.query && req.query.metadata) {
      console.log('✅ [COMPANION] Metadata found in req.query.metadata:', JSON.stringify(req.query.metadata, null, 2));
    } else {
      console.log('❌ [COMPANION] No metadata found in direct properties');
      // Try to see if metadata is nested anywhere in the body
      const bodyKeys = Object.keys(req.body || {});
      console.log('📋 [COMPANION] Body contains these keys:', bodyKeys.join(', '));
    }
  }
  next();
});

// Initialize Companion
const { app: companionApp } = companion.app(companionOptions);
app.use(companionApp);

// Start the server
const PORT = process.env.COMPANION_HOST?.split(':')[1] || 3020;
const server = app.listen(PORT, () => {
  console.log(`Companion server running on port ${PORT}`);
});

// Add WebSocket support
const companionSocket = companion.socket(server);

// Store user data when socket connections are established
if (companionSocket && companionSocket.on) {
  companionSocket.on('connection', (socket) => {
    console.log(`🔌 [COMPANION] Socket connected: ${socket.id}`);
    
    // Listen for custom auth events from the client
    socket.on('auth', (data) => {
      try {
        console.log(`🔑 [COMPANION] Received auth data on socket ${socket.id}:`, data);
        if (data && (data.userId || data.user_id)) {
          // Use the best available user ID
          const userId = data.userId || data.user_id;
          const username = data.username || DEFAULT_USERNAME;
          
          // Store in our global map using socket ID as key
          userMetadataStore.set(socket.id, {
            userId: userId,
            username: username,
            eventId: data.eventId || '',
            metadata: data,
            timestamp: Date.now()
          });
          
          // Also store with a longer session ID if available
          if (socket.handshake && socket.handshake.session && socket.handshake.session.id) {
            userMetadataStore.set(socket.handshake.session.id, {
              userId: userId,
              username: username,
              socketId: socket.id,
              eventId: data.eventId || '',
              metadata: data,
              timestamp: Date.now()
            });
            console.log(`📦 [COMPANION] Stored user metadata with session ID: ${socket.handshake.session.id}`);
          }
          
          console.log(`📦 [COMPANION] Stored user metadata in global map with socket ID: ${socket.id}`);
          
          // Acknowledge the auth with a success message
          socket.emit('auth-response', {
            success: true,
            userId: userId,
            username: username
          });
        } else {
          console.warn(`⚠️ [COMPANION] Received auth event without user ID data`);
          socket.emit('auth-response', {
            success: false,
            error: 'No user ID provided'
          });
        }
      } catch (error) {
        console.error(`❌ [COMPANION] Error processing socket auth:`, error);
        socket.emit('auth-response', {
          success: false,
          error: error.message
        });
      }
    });
    
    // Listen for upload complete events from client
    socket.on('upload-complete', async (data) => {
      try {
        console.log('------------------------------------');
        console.log('🚨🚨🚨 [COMPANION] UPLOAD COMPLETE EVENT RECEIVED 🚨🚨🚨');
        console.log('------------------------------------');
        console.log('📤 [COMPANION] Upload complete event received on socket:', JSON.stringify(data, null, 2));
        
        // Store mapping from upload ID to S3 path/URL if available
        if (data.uploadURL) {
          const bucketName = process.env.COMPANION_AWS_BUCKET;
          const s3Path = data.uploadURL.replace(`https://${bucketName}.s3.amazonaws.com/`, '');
          console.log(`🔄 [COMPANION] Storing mapping for upload ${data.uploadId} to path ${s3Path}`);
          
          // Store by multiple identifiers to improve matching chances
          if (data.uploadId) userMetadataStore.set(`uploadId:${data.uploadId}`, { s3Path, uploadId: data.uploadId });
          if (s3Path) userMetadataStore.set(`s3key:${s3Path}`, { 
            userId: data.metadata?.userId || userMetadataStore.get(socket.id)?.userId,
            username: data.metadata?.username || userMetadataStore.get(socket.id)?.username,
            uploadId: data.uploadId
          });
        }
        
        // Add socket ID to the payload
        data.socketId = socket.id;
        
        // Get user data from our store for this socket
        const userData = userMetadataStore.get(socket.id) || {};
        
        // Combine with data from the event
        const enhancedData = {
          ...data,
          metadata: {
            ...data.metadata,
            userId: userData.userId || data.metadata?.userId,
            user_id: userData.userId || data.metadata?.user_id,
            username: userData.username || data.metadata?.username,
            eventId: userData.eventId || data.metadata?.eventId,
            timestamp: Date.now(),
            source: data.metadata?.source || 'dropbox'
          }
        };
        
        console.log('📦 [COMPANION] Enhanced data for processing:', JSON.stringify(enhancedData, null, 2));
        
        // ADDED: Check if this is a Dropbox or Google Drive file that needs explicit processing
        const isRemoteUpload = 
          data.source === 'dropbox' || 
          data.source === 'googledrive' || 
          data.isDropbox || 
          data.isGoogleDrive ||
          (data.metadata && (data.metadata.source === 'dropbox' || data.metadata.source === 'googledrive'));
        
        if (isRemoteUpload) {
          console.log('------------------------------------');
          console.log('🚨🚨🚨 DETECTED REMOTE UPLOAD - FORCING FACE PROCESSING 🚨🚨🚨');
          console.log('------------------------------------');
          
          // Determine the S3 path - multiple ways to get it
          let s3Path = null;
          
          // Option 1: Direct uploadURL to S3
          if (data.uploadURL) {
            const bucketName = process.env.COMPANION_AWS_BUCKET;
            s3Path = data.uploadURL.replace(`https://${bucketName}.s3.amazonaws.com/`, '');
            console.log(`🔄 [COMPANION] Using uploadURL to determine S3 path: ${s3Path}`);
          } 
          // Option 2: Constructed based on userId and fileId
          else {
            // Format: photos/userId/source/fileId
            const userId = enhancedData.metadata.userId || userData.userId || DEFAULT_USER_ID;
            const source = data.source || 'dropbox';
            const fileId = data.uploadId || data.id || data.photoId || 'unknown';
            s3Path = `photos/${userId}/${source}/${fileId}`;
            console.log(`🔄 [COMPANION] Constructed S3 path for remote file: ${s3Path}`);
          }
          
          // Ensure we have the file information for processing
          const fileData = {
            size: data.fileSize || data.size || 0,
            type: data.fileType || data.type || data.file?.type || 'image/jpeg'
          };
          
          // Process the file using the Rekognition handling
          console.log(`🔄 [COMPANION] EXPLICITLY PROCESSING REMOTE UPLOAD: ${s3Path}`);
          const processingResult = await processUploadedFile(s3Path, fileData, enhancedData.metadata);
          
          console.log('🔄 [COMPANION] EXPLICIT PROCESSING RESULT:', JSON.stringify(processingResult, null, 2));
          
          // Use this result for the response
          if (processingResult.success) {
            // Send success back to client
            console.log(`🔔 [COMPANION] Emitting explicit success for remote file to socket ${socket.id}`);
            socket.emit('upload-processed', {
              success: true,
              photoId: processingResult.photoId,
              photoMetadata: processingResult.photoMetadata,
              uploadId: data.uploadId,
              explicitProcessing: true // Flag to indicate this was processed explicitly
            });
            
            return; // Skip normal processing flow
          }
        }
        
        // Process the upload with combined data (normal flow for non-remote uploads)
        const result = await handleUploadComplete(enhancedData);
        
        if (result && result.success) {
          // Emit success back to client
          console.log(`🔔 [COMPANION] Emitting success to socket ${socket.id} for photo ${result.photoId}`);
          socket.emit('upload-processed', {
            success: true,
            photoId: result.photoId,
            photoMetadata: result.photoMetadata,
            uploadId: data.uploadId // Include the original uploadId for client-side matching
          });
          
          // Also broadcast a global event in case this socket gets disconnected
          socket.broadcast.emit('global-upload-processed', {
            success: true,
            photoId: result.photoId,
            uploadId: data.uploadId,
            s3Path: result.photoMetadata.storage_path,
            userId: result.photoMetadata.user_id || result.photoMetadata.userId
          });
        } else {
          throw new Error(result?.error || 'Unknown error processing upload');
        }
      } catch (error) {
        console.error('❌ [COMPANION] Error processing upload-complete event:', error);
        socket.emit('upload-processed', {
          success: false,
          error: error.message,
          uploadId: data.uploadId // Include uploadId even on errors for client-side matching
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 [COMPANION] Socket disconnected: ${socket.id}`);
      // Clean up metadata for this socket
      userMetadataStore.delete(socket.id);
      
      // Don't delete session mappings as they might be needed for other connections
    });
  });
  
  console.log('✅ [COMPANION] Registered socket event handlers');
} else {
  console.warn('⚠️ [COMPANION] No socket handler available, falling back to hooks');
} 