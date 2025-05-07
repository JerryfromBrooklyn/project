const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const companion = require('@uppy/companion');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const AWS = require('aws-sdk');

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
const COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || 'shmong-faces';
const PHOTOS_TABLE = process.env.DYNAMODB_PHOTOS_TABLE || 'shmong-photos';

// Function to process an uploaded file (similar to awsPhotoService.uploadPhoto)
const processUploadedFile = async (s3Path, fileData, metadata) => {
  try {
    console.log(`🔍 [COMPANION] Processing uploaded file: ${s3Path}`);
    
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
    const publicUrl = `https://${bucketName}.s3.amazonaws.com/${s3Path}`;
    
    console.log(`📊 [COMPANION] Starting face detection and indexing for ${s3Path}`);
    
    // 2. Index faces using Rekognition
    const indexParams = {
      CollectionId: COLLECTION_ID,
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: s3Path
        }
      },
      DetectionAttributes: ["ALL"],
      ExternalImageId: `photo_${photoId}`,
      MaxFaces: 10,
      QualityFilter: "AUTO"
    };
    
    let allDetectedFaces = [];
    let faceIds = [];
    let matchedUsers = [];
    
    try {
      // Index faces
      const indexResult = await rekognitionClient.indexFaces(indexParams).promise();
      
      if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
        console.log(`✅ [COMPANION] Successfully indexed ${indexResult.FaceRecords.length} face(s)`);
        
        // Store face info
        allDetectedFaces = indexResult.FaceRecords.map(record => ({ 
          faceId: record.Face.FaceId,
          boundingBox: record.Face.BoundingBox,
          confidence: record.Face.Confidence,
          attributes: record.FaceDetail 
        }));
        
        faceIds = allDetectedFaces.map(f => f.faceId);
        
        // 3. Search for matching faces using SearchFacesByImage
        const searchParams = {
          CollectionId: COLLECTION_ID,
          Image: {
            S3Object: {
              Bucket: bucketName,
              Name: s3Path
            }
          },
          MaxFaces: 1000,
          FaceMatchThreshold: 80
        };
        
        const searchResult = await rekognitionClient.searchFacesByImage(searchParams).promise();
        
        // Process matches
        if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
          console.log(`✅ [COMPANION] Found ${searchResult.FaceMatches.length} potential face matches`);
          
          // Track unique user IDs
          const uniqueMatchedUserIds = new Set();
          
          // Process each match
          for (const match of searchResult.FaceMatches) {
            const matchedFaceId = match.Face?.FaceId;
            const matchedExternalId = match.Face?.ExternalImageId;
            const similarity = match.Similarity;
            
            // Only process user_ prefixed IDs (registered faces)
            if (matchedExternalId && matchedExternalId.startsWith('user_')) {
              const potentialUserId = matchedExternalId.substring(5);
              
              // Add user to list if not already added
              if (!uniqueMatchedUserIds.has(potentialUserId)) {
                matchedUsers.push({
                  userId: potentialUserId,
                  faceId: matchedFaceId,
                  similarity: similarity,
                  matchedAt: new Date().toISOString()
                });
                uniqueMatchedUserIds.add(potentialUserId);
              }
            }
          }
        }
      }
    } catch (rekError) {
      console.error(`❌ [COMPANION] Error in face processing:`, rekError);
      // Continue with the upload even if face processing fails
    }
    
    // 4. Store photo metadata in DynamoDB
    const photoMetadata = {
      id: photoId,
      user_id: userId,
      username: username,
      storage_path: s3Path,
      url: publicUrl,
      public_url: publicUrl,
      uploaded_by: userId,
      uploadedBy: userId,
      file_size: fileData.size || 0,
      fileSize: fileData.size || 0,
      file_type: fileData.type || 'image/jpeg',
      fileType: fileData.type || 'image/jpeg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      faces: allDetectedFaces,
      matched_users: matchedUsers,
      face_ids: faceIds,
      // Add additional metadata from the request
      ...metadata
    };
    
    // Convert matched_users to string if it's an array (for GSI compatibility)
    if (photoMetadata.matched_users && Array.isArray(photoMetadata.matched_users)) {
      photoMetadata.matched_users_list = [...photoMetadata.matched_users];
      photoMetadata.matched_users = photoMetadata.matched_users
        .map(match => typeof match === 'object' ? match.userId : match)
        .filter(Boolean)
        .join(',');
    }
    
    // Store in DynamoDB
    const putParams = {
      TableName: PHOTOS_TABLE,
      Item: photoMetadata
    };
    
    await docClient.put(putParams).promise();
    console.log(`✅ [COMPANION] Successfully stored photo metadata in DynamoDB`);
    
    // 5. Set photo visibility (if applicable)
    // This would be implementation-specific to your app
    
    return {
      success: true,
      photoId: photoId,
      photoMetadata,
      s3Url: publicUrl
    };
  } catch (error) {
    console.error(`❌ [COMPANION] Error processing uploaded file:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Hook into Companion's upload complete event
const handleUploadComplete = (payload) => {
  try {
    console.log('🎉 [COMPANION] Upload complete event received:', payload.url);
    
    // Extract key from S3 URL 
    // Example URL: https://bucket-name.s3.amazonaws.com/photos/user-id/fileId_filename.jpg
    const s3Url = payload.url;
    const bucketName = process.env.COMPANION_AWS_BUCKET;
    const s3Path = s3Url.replace(`https://${bucketName}.s3.amazonaws.com/`, '');
    
    console.log(`🔍 [COMPANION] Extracted S3 path: ${s3Path}`);
    
    // Get metadata from the payload
    const metadata = payload.metadata || {};
    const fileData = payload.file || {};
    
    // Process asynchronously
    processUploadedFile(s3Path, fileData, metadata)
      .then(result => {
        if (result.success) {
          console.log(`✅ [COMPANION] Successfully processed file: ${result.photoId}`);
        } else {
          console.error(`❌ [COMPANION] Failed to process file:`, result.error);
        }
      })
      .catch(err => {
        console.error(`❌ [COMPANION] Unexpected error processing file:`, err);
      });
      
  } catch (error) {
    console.error(`❌ [COMPANION] Error in handleUploadComplete:`, error);
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
              console.log('❌ [COMPANION] No metadata found in any location, using empty object');
            }
          } else {
            console.log('⚠️ [COMPANION] req object is null or undefined');
            
            // If req is null, try to get metadata from our global store
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
                foundMetadata = userMetadataStore.get(key);
                console.log(`✅ [COMPANION] Found metadata in global store with key ${key}:`, 
                    JSON.stringify(foundMetadata, null, 2));
                break;
              }
            }
            
            // If we still don't have metadata, check all entries in the store
            if (Object.keys(foundMetadata).length === 0 && userMetadataStore.size > 0) {
              console.log(`🔍 [COMPANION] Searching all ${userMetadataStore.size} entries in metadata store`);
              // Just get the first entry as a fallback
              const firstKey = Array.from(userMetadataStore.keys())[0];
              foundMetadata = userMetadataStore.get(firstKey);
              console.log(`✅ [COMPANION] Using first available metadata with key ${firstKey}:`, 
                  JSON.stringify(foundMetadata, null, 2));
            }
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
        if (data && data.userId) {
          // Store in our global map using socket ID as key
          userMetadataStore.set(socket.id, data);
          console.log(`📦 [COMPANION] Stored user metadata in global map with socket ID: ${socket.id}`);
        }
      } catch (error) {
        console.error(`❌ [COMPANION] Error processing socket auth:`, error);
      }
    });
    
    // Set user data in global store if passed as query param in socket connection
    if (socket.handshake && socket.handshake.query) {
      const { userId, username } = socket.handshake.query;
      if (userId) {
        userMetadataStore.set(socket.id, { userId, username: username || DEFAULT_USERNAME });
        console.log(`📦 [COMPANION] Stored user metadata from socket handshake: ${socket.id}`);
      }
    }
    
    socket.on('disconnect', () => {
      console.log(`🔌 [COMPANION] Socket disconnected: ${socket.id}`);
      // Clean up metadata for this socket
      userMetadataStore.delete(socket.id);
    });
  });
  
  companionSocket.on('upload-complete', handleUploadComplete);
  console.log('✅ [COMPANION] Registered upload-complete event handler');
} else {
  // Fallback method using companionOptions hooks
  if (companionOptions.hooks) {
    companionOptions.hooks.afterComplete = handleUploadComplete;
    console.log('✅ [COMPANION] Registered afterComplete hook for uploads');
  } else {
    console.warn('⚠️ [COMPANION] Could not register upload handlers, face processing may not work');
  }
} 