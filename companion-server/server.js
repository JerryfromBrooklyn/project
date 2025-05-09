const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const companion = require('@uppy/companion');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const AWS = require('aws-sdk');
const axios = require('axios');
// const sharp = require('sharp');
const { promisify } = require('util');

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
const DEFAULT_USER_ID = 'f4d84428-70b1-705c-6c35-a6fea5d94aae'; // Use an actual UUID instead of 'default-user'
const DEFAULT_USERNAME = ''; // Empty string instead of 'default-user'

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

// Update the extractMetadataFromProvider function to handle Google Drive better
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
    
    if (!isProviderRequest) {
      return null;
    }
    
    console.log('📂 [COMPANION] Detected provider request:', url);
    
    // Check headers for user data
    const userDataHeader = req.headers?.['x-user-data'] || req.headers?.['X-User-Data'];
    if (userDataHeader) {
      try {
        const userData = JSON.parse(userDataHeader);
        if (userData.userId) {
          console.log('✅ [COMPANION] Found user data in X-User-Data header:', userData.userId);
          return userData;
        }
      } catch (e) {
        console.error('❌ [COMPANION] Error parsing X-User-Data header:', e);
      }
    }
    
    // Check session for user data
    if (req.session && req.session.userData) {
      try {
        const sessionData = typeof req.session.userData === 'string'
          ? JSON.parse(req.session.userData)
          : req.session.userData;
          
        if (sessionData.userId || sessionData.user_id) {
          console.log('✅ [COMPANION] Found user data in session:', sessionData.userId || sessionData.user_id);
          return sessionData;
        }
      } catch (e) {
        console.error('❌ [COMPANION] Error parsing session userData:', e);
      }
    }
    
    // Return basic metadata
    console.log('📎 [COMPANION] Created metadata for provider request:', {
      userId: DEFAULT_USER_ID,
      username: DEFAULT_USERNAME
    });
    
    return {
      userId: DEFAULT_USER_ID,
      username: DEFAULT_USERNAME
    };
  } catch (error) {
    console.error('❌ [COMPANION] Error in extractMetadataFromProvider:', error);
    return {
      userId: DEFAULT_USER_ID,
      username: DEFAULT_USERNAME
    };
  }
};

// Store user metadata when discovered for later retrieval
const userMetadataStore = new Map();

// Track already processed uploads to prevent duplicates
const processedUploads = new Map(); // Changed from Set to Map to store timestamp

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
    if (req.url && (req.url.includes('/dropbox') || req.url.includes('/google') || req.url.includes('/drive'))) {
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

    // **** CRITICAL FIX ****
    // Always generate a new UUID for every upload, regardless of source
    // This ensures each upload creates a new database entry
    let photoId = uuid();
    console.log(`🔑 [COMPANION] Generated fresh UUID for upload: ${photoId}`);
    
    // Store original ID if provided (for Dropbox/Google Drive sources) but only as reference
    const originalId = metadata.originalId || metadata.id || null;
    if (originalId && originalId.startsWith('id:')) {
      console.log(`📊 [COMPANION] Original Dropbox ID: ${originalId} (using UUID: ${photoId})`);
    }

    // 1. File should already be in S3, construct URL
    const bucketName = process.env.COMPANION_AWS_BUCKET;
    const publicUrl = `https://${bucketName}.s3.amazonaws.com/${s3Path}`;
    
    console.log(`📊 [COMPANION] Starting face detection and indexing for ${s3Path}`);
    
    // Check if this is a remote source (Dropbox or Google Drive)
    const isRemoteSource = metadata.source === 'dropbox' || 
                          metadata.source === 'googledrive' || 
                          s3Path.includes('dropbox') || 
                          s3Path.includes('googledrive') ||
                          s3Path.includes('drive') ||
                          s3Path.includes('google') ||
                          metadata.source === 'Dropbox' ||
                          metadata.source === 'Google Drive';
    
    // CRITICAL FIX: First download the image data
    let imageBuffer;
    try {
      // Prioritize downloads for ALL remote sources, especially if forceProcess is set
      if ((isRemoteSource || metadata.forceProcess) && metadata.url) {
        console.log(`🔄 [COMPANION] Downloading remote file from URL for face processing: ${metadata.url}`);
        
        try {
          // Use Axios with timeout and responseType set to arraybuffer
          const response = await axios.get(metadata.url, { 
            responseType: 'arraybuffer',
            timeout: 30000, // 30 second timeout
            headers: {
              // Add authorization if we have it
              ...(metadata.accessToken ? { 'Authorization': `Bearer ${metadata.accessToken}` } : {}),
              // Ensure we accept all content types
              'Accept': 'image/*,*/*'
            }
          });
          
          imageBuffer = Buffer.from(response.data);
          console.log(`✅ [COMPANION] Successfully downloaded remote file (${imageBuffer.length} bytes)`);
          
          // Now that we have the file, upload it to S3 directly to ensure it's properly stored
          // CRITICAL FIX: Always use a UUID in the S3 key, never the provider ID
          const fileExt = path.extname(s3Path) || '.jpg'; // Get extension or default to .jpg
          const fileName = path.basename(s3Path, fileExt); // Get filename without extension
          const newFileName = `${photoId}${fileExt}`; // Use the UUID as filename with original extension
          const newS3Key = `photos/${userId}/${newFileName}`;
          console.log(`📤 [COMPANION] Uploading downloaded file to S3 at ${newS3Key}`);
          
          await s3Client.putObject({
            Bucket: bucketName,
            Key: newS3Key,
            Body: imageBuffer,
            ContentType: fileData.type || 'image/jpeg'
          }).promise();
          
          // Update s3Path to use the new location
          s3Path = newS3Key;
          
          // Update publicUrl to use new S3 location
          const publicUrl = `https://${bucketName}.s3.amazonaws.com/${newS3Key}`;
          
          console.log(`✅ [COMPANION] Successfully uploaded file to S3 at new location: ${newS3Key}`);
          console.log(`✅ [COMPANION] Public URL: ${publicUrl}`);
          
          // Update URLs in metadata to point to S3
          metadata.url = publicUrl;
          metadata.storage_path = newS3Key;
        } catch (downloadError) {
          console.error(`❌ [COMPANION] Error downloading file from provider URL:`, downloadError);
          console.log(`⚠️ [COMPANION] Will try alternative method for Dropbox/Google Drive files`);
          
          // For Dropbox/Google Drive, make a special attempt to download via API
          if (metadata.source === 'dropbox' || metadata.source.toLowerCase().includes('dropbox')) {
            try {
              console.log(`🔍 [COMPANION] Attempting specialized Dropbox download for ${metadata.id}`);
              
              // Build a clean URL that properly handles the Dropbox file path
              let dropboxUrl = metadata.url;
              
              // If it's a companion URL, ensure it's properly formatted
              if (dropboxUrl.includes('localhost:3020/dropbox/get/') || 
                  dropboxUrl.includes('/dropbox/get/')) {
                // Extract the file path from the URL
                const urlParts = dropboxUrl.split('/dropbox/get/');
                if (urlParts.length > 1) {
                  const filePath = decodeURIComponent(urlParts[1]);
                  console.log(`🔍 [COMPANION] Extracted Dropbox file path: ${filePath}`);
                  
                  // Rebuild the URL with proper encoding
                  const baseUrl = urlParts[0];
                  dropboxUrl = `${baseUrl}/dropbox/get/${encodeURIComponent(filePath)}`;
                  console.log(`🔍 [COMPANION] Rebuilt Dropbox URL: ${dropboxUrl}`);
                }
              }
              
              // Make request to companion server's Dropbox endpoint
              const dropboxResponse = await axios.get(dropboxUrl, { 
                responseType: 'arraybuffer',
                timeout: 60000, // 60 second timeout for Dropbox
                headers: {
                  // Add authorization if we have it
                  ...(metadata.accessToken ? { 'Authorization': `Bearer ${metadata.accessToken}` } : {}),
                  // Ensure we accept all content types
                  'Accept': 'image/*,*/*'
                }
              });
              
              imageBuffer = Buffer.from(dropboxResponse.data);
              console.log(`✅ [COMPANION] Successfully downloaded Dropbox file (${imageBuffer.length} bytes)`);
              
              // Upload to S3 with consistent naming - NEVER use the original provider ID in the path
              // Instead, use the UUID we generated
              const fileExt = path.extname(metadata.name || 'file.jpg') || '.jpg';
              const newS3Key = `photos/${userId}/${photoId}${fileExt}`;
              console.log(`📁 [COMPANION] Using proper UUID in storage path: ${newS3Key}`);
              
              await s3Client.putObject({
                Bucket: bucketName,
                Key: newS3Key,
                Body: imageBuffer,
                ContentType: fileData.type || 'image/jpeg'
              }).promise();
              
              // Update paths
              s3Path = newS3Key;
              const publicUrl = `https://${bucketName}.s3.amazonaws.com/${newS3Key}`;
              
              // Update URLs in metadata to point to S3
              metadata.url = publicUrl;
              metadata.storage_path = newS3Key;
              
              console.log(`✅ [COMPANION] Successfully uploaded Dropbox file to S3 at: ${newS3Key}`);
              console.log(`✅ [COMPANION] Public URL: ${publicUrl}`);
            } catch (dropboxError) {
              console.error(`❌ [COMPANION] Failed Dropbox specialized download:`, dropboxError);
            }
          }
        }
      } else {
        // For files already in S3, just download from there
        console.log(`🔄 [COMPANION] Downloading file from S3 for face processing: ${s3Path}`);
        const getParams = {
          Bucket: bucketName,
          Key: s3Path
        };
        
        const s3Object = await s3Client.getObject(getParams).promise();
        imageBuffer = s3Object.Body;
        console.log(`✅ [COMPANION] Successfully downloaded file (${imageBuffer.length} bytes)`);
      }
    } catch (error) {
      console.error(`❌ [COMPANION] Error downloading file:`, error);
      // Continue without image processing if download fails
      // We'll still save the metadata, but without face detection
      console.log(`⚠️ [COMPANION] Will proceed without face detection for ${s3Path}`);
    }
    
    // 2. Index faces using Rekognition (only if we successfully downloaded the image)
    let allDetectedFaces = [];
    let faceIds = [];
    let matchedUsers = [];
    
    if (imageBuffer) {
      try {
        console.log(`🔎 [COMPANION] Running face detection on downloaded image (${imageBuffer.length} bytes)`);
        
        // 2.1 First, detect faces to verify image quality and face presence
        const detectParams = {
          Image: {
            Bytes: imageBuffer
          },
          Attributes: ['ALL']
        };
        
        const detectResult = await rekognitionClient.detectFaces(detectParams).promise();
        
        if (detectResult.FaceDetails && detectResult.FaceDetails.length > 0) {
          console.log(`✅ [COMPANION] Detected ${detectResult.FaceDetails.length} faces in image`);
          
          // 2.2 Now index the faces in the Rekognition collection
          const indexParams = {
            CollectionId: COLLECTION_ID,
            Image: {
              Bytes: imageBuffer
            },
            DetectionAttributes: ["ALL"],
            ExternalImageId: `photo_${photoId}`,
            MaxFaces: 10,
            QualityFilter: "AUTO"
          };
          
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
                Bytes: imageBuffer
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
        } else {
          console.log(`ℹ️ [COMPANION] No faces detected in the image`);
        }
      } catch (rekError) {
        console.error(`❌ [COMPANION] Error in face processing:`, rekError);
        // Continue with the upload even if face processing fails
      }
    } else {
      console.log(`⚠️ [COMPANION] Skipping face detection/indexing (imageBuffer not available)`);
    }
    
    // 4. Store photo metadata in DynamoDB
    // First create a blank metadata object with the essentials
    const photoMetadata = {
      // CRITICAL: Ensure that we ALWAYS use our generated UUID as primary key
      id: photoId,
      
      // Store the original provider ID in both formats for easy reference
      original_id: originalId,
      originalId: originalId,
      
      // Basic info
      user_id: userId,
      userId: userId,
      uploadedBy: userId,
      uploaded_by: userId,
      username: username,
      storage_path: s3Path,  // Use the actual S3 path after potential reupload
      url: metadata.url || publicUrl,  // Use updated URL from metadata if available
      public_url: metadata.url || publicUrl,  // Use updated URL from metadata if available
      file_size: fileData.size || 0,
      fileSize: fileData.size || 0,
      file_type: fileData.type || 'image/jpeg',
      fileType: fileData.type || 'image/jpeg',
      name: metadata.name || path.basename(s3Path),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Face processing results
      faces: allDetectedFaces,
      matched_users: matchedUsers,
      face_ids: faceIds,
      
      // Source info
      source: metadata.source || (isRemoteSource ? 'remote' : 'local'),
      provider: isRemoteSource ? (metadata.source || 'remote') : 'local',
      
      // Processing flags
      face_processing_attempted: !!imageBuffer,
      face_processing_completed: !!imageBuffer && rekognitionClient !== null,
      
      // Add a timestamp to ensure uniqueness
      upload_timestamp: Date.now()
    };
    
    // Now merge with the additional metadata from the request, but DON'T let it override our UUID
    const metadataId = photoId;
    
    // Copy other metadata fields, but protect the critical ones
    const protectedFields = ['id', 'original_id', 'originalId'];
    Object.keys(metadata).forEach(key => {
      // Skip the protected fields
      if (!protectedFields.includes(key)) {
        photoMetadata[key] = metadata[key];
      }
    });
    
    // Final sanity check before storing in DynamoDB - make absolutely sure the ID is our UUID
    if (typeof photoMetadata.id !== 'string' || photoMetadata.id.startsWith('id:')) {
      console.log(`🚨 [COMPANION] EMERGENCY: Found Dropbox ID still being used as key: ${photoMetadata.id}`);
      
      // Force replace with our UUID
      console.log(`🔐 [COMPANION] EMERGENCY: Replacing with UUID: ${metadataId}`);
      
      // Update the ID field
      photoMetadata.id = metadataId;
    }
    
    // Convert matched_users to string if it's an array (for GSI compatibility)
    if (photoMetadata.matched_users && Array.isArray(photoMetadata.matched_users)) {
      // Store the full array in matched_users_list for JSON access
      photoMetadata.matched_users_list = [...photoMetadata.matched_users];
      
      // For GSI compatibility, create a comma-separated list of user IDs
      photoMetadata.matched_users_string = photoMetadata.matched_users
        .map(match => typeof match === 'object' ? match.userId : match)
        .filter(Boolean)
        .join(',');
        
      // Leave matched_users as a proper JSON array, but serialized to a string
      // This way it can be correctly parsed by JSON.parse() in the client
      photoMetadata.matched_users = JSON.stringify(photoMetadata.matched_users);
    }
    
    // Store in DynamoDB
    const putParams = {
      TableName: PHOTOS_TABLE,
      Item: photoMetadata
    };
    
    console.log(`📝 [COMPANION] Saving metadata to DynamoDB with ID: ${photoMetadata.id}`);
    await docClient.put(putParams).promise();
    console.log(`✅ [COMPANION] Successfully stored photo metadata in DynamoDB`);

    // Double-check what was saved
    console.log(`🔍 [COMPANION] Saved item with ID: ${photoMetadata.id}`);
    console.log(`🔍 [COMPANION] Original ID stored as reference: ${photoMetadata.originalId || photoMetadata.original_id || 'none'}`);
    if (photoMetadata.id.startsWith('id:')) {
      console.error(`❌ [COMPANION] WARNING: Still saved with Dropbox ID as primary key: ${photoMetadata.id}`);
    } else {
      console.log(`✅ [COMPANION] Confirmed saved with UUID as primary key: ${photoMetadata.id}`);
    }
    
    return {
      success: true,
      photoId: photoId,
      photoMetadata,
      s3Url: publicUrl,
      facesDetected: allDetectedFaces.length,
      isRemoteSource: isRemoteSource
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
    
    // Check if this upload has already been processed in the last few seconds
    // Use the original provider ID or URL as the key, plus the current timestamp
    const trackingId = payload.id || payload.url;
    const currentTime = Date.now();
    console.log(`🔍 [COMPANION] Checking if ${trackingId} has already been processed recently`);
    
    // Debug log the current processed uploads
    console.log(`📋 [COMPANION] Currently processed uploads (${processedUploads.size}):`, 
                Array.from(processedUploads.keys()).slice(0, 10));
    
    // CHANGED: Now we check if processed within last 3 seconds to avoid double-processing
    // BUT we ALWAYS allow a new upload even of the same file (with new UUID)
    if (trackingId && processedUploads.has(trackingId)) {
      const lastProcessed = processedUploads.get(trackingId);
      // Only consider as duplicate if processed within the last 3 seconds
      if (currentTime - lastProcessed < 3000) {
        console.log(`⏭️ [COMPANION] Upload ${trackingId} processed within last 3 seconds, debouncing...`);
        // Continue processing but log the short interval
        console.log(`📊 [COMPANION] Will create another entry with a new UUID for this upload`);
      }
    }
    
    // Mark this upload as processed with current timestamp
    if (trackingId) {
      processedUploads.set(trackingId, currentTime);
      console.log(`✅ [COMPANION] Marked ${trackingId} as processed at ${currentTime}, now ${processedUploads.size} tracked uploads`);
      
      // Cleanup processedUploads Map - remove entries older than 1 hour
      const oneHourAgo = currentTime - (60 * 60 * 1000);
      for (const [id, timestamp] of processedUploads.entries()) {
        if (timestamp < oneHourAgo) {
          processedUploads.delete(id);
        }
      }
    }
    
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
    
    // Determine the source of the upload (Dropbox, Google Drive, or local)
    let uploadSource = 'local';
    
    // Check if there's an explicit source in the metadata
    if (fileMetadata.source) {
      uploadSource = fileMetadata.source;
      console.log(`📂 [COMPANION] Using source from metadata: ${uploadSource}`);
    } 
    // Check if the source is in the userData
    else if (userData.source) {
      uploadSource = userData.source;
      console.log(`📂 [COMPANION] Using source from userData: ${uploadSource}`);
    }
    // Try to detect from path for Dropbox
    else if (storagePath && storagePath.includes('/dropbox/')) {
      uploadSource = 'dropbox';
      console.log(`📂 [COMPANION] Detected Dropbox source from path`);
    }
    // Try to detect from path for Google Drive
    else if (storagePath && (storagePath.includes('/googledrive/') || 
              storagePath.includes('/google/') || 
              storagePath.includes('/drive/'))) {
      uploadSource = 'googledrive';
      console.log(`📂 [COMPANION] Detected Google Drive source from path`);
    }
    // Look for patterns in file ID or URL
    else if (payload.id) {
      // Dropbox upload IDs start with "id:"
      if (typeof payload.id === 'string' && payload.id.startsWith('id:')) {
        uploadSource = 'dropbox';
        console.log(`📂 [COMPANION] Detected Dropbox source from ID format`);
      }
      // Google Drive IDs often contain underscores or start with "drive-"
      else if (typeof payload.id === 'string' && 
              (payload.id.startsWith('drive-') || payload.id.includes('_'))) {
        uploadSource = 'googledrive';
        console.log(`📂 [COMPANION] Detected Google Drive source from ID format`);
      }
    }
    // Check URL for telltale signs
    if (payload.url && (
        payload.url.includes('dropbox') || 
        payload.url.includes('/dropbox/') ||
        payload.url.includes('localhost:3020/dropbox/')
      )) {
      uploadSource = 'dropbox';
      console.log(`📂 [COMPANION] Detected Dropbox source from URL`);
    }
    
    console.log(`📂 [COMPANION] Final determined source: ${uploadSource}`);
    
    // CRITICAL: Always generate a new UUID for every upload
    // This ensures each upload creates a brand new database entry
    const generatedUuid = uuid();
    console.log(`🔑 [COMPANION] Generated new UUID for this upload: ${generatedUuid}`);
    
    // CRITICAL: Always use a new UUID for the primary ID, never the provider ID
    // For Dropbox files, we want a new entry every time the file is selected
    const primaryId = generatedUuid;
    
    // Store the original provider ID only in memory/logs, not in the database
    if (payload.id) {
      console.log(`📊 [COMPANION] Original provider ID: ${payload.id} (using new UUID: ${primaryId})`);
    }
    
    // Store the original provider ID (especially important for Dropbox)
    const originalProviderId = payload.id;
    if (originalProviderId) {
      if (typeof originalProviderId === 'string' && originalProviderId.startsWith('id:')) {
        console.log(`📊 [COMPANION] Original Dropbox ID detected: ${originalProviderId}`);
      } else if (uploadSource === 'googledrive') {
        console.log(`📊 [COMPANION] Original Google Drive ID detected: ${originalProviderId}`);
      }
      console.log(`📊 [COMPANION] Original provider ID: ${originalProviderId} (using new UUID: ${primaryId})`);
    }
    
    // Ensure the metadata has all the necessary user fields
    const enhancedMetadata = {
      // First, include basic properties from fileMetadata, but NOT the id
      timestamp: Date.now(),
      source: uploadSource,
      
      // User info - ensure consistency
      userId: userData.userId,
      user_id: userData.userId,
      uploadedBy: userData.userId,
      uploaded_by: userData.userId,
      username: userData.username,
      eventId: userData.eventId || fileMetadata.eventId || '',
      
      // CRITICAL: Always use our UUID as the primary ID
      id: primaryId,
      
      // Store original provider ID only as reference
      originalId: originalProviderId,
      original_id: originalProviderId,
      
      // Processing flag
      forceProcess: true // Signal to process this fully even for remote uploads
    };
    
    // Now copy all other properties from fileMetadata except the id
    for (const key in fileMetadata) {
      if (key !== 'id') { // NEVER copy the 'id' field from fileMetadata
        enhancedMetadata[key] = fileMetadata[key];
      }
    }
    
    // Final safety check - make absolutely sure we're using the UUID
    console.log(`🔐 [COMPANION] Final ID verification - using UUID: ${enhancedMetadata.id}`);
    
    // Ensure storage path doesn't contain provider ID if this is from Dropbox
    if (uploadSource === 'dropbox' && originalProviderId && typeof originalProviderId === 'string' && originalProviderId.startsWith('id:')) {
      const safeStoragePath = `photos/${userData.userId}/${primaryId}`;
      enhancedMetadata.storage_path = safeStoragePath;
      console.log(`🔐 [COMPANION] Set safe storage path: ${safeStoragePath}`);
    }
    
    console.log('📤 [COMPANION] Processing with enhanced metadata:', JSON.stringify(enhancedMetadata, null, 2));
    
    // If we don't have a storage path, we can't process the upload
    if (!storagePath) {
      console.error('❌ [COMPANION] No storage path found, cannot process upload');
      throw new Error('No storage path found in payload');
    }
    
    // Process the upload
    const result = await processUploadedFile(storagePath, fileData, enhancedMetadata);
    
    console.log('✅ [COMPANION] Upload processing result:', JSON.stringify(result, null, 2));
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
      secret: process.env.COMPANION_GOOGLE_SECRET,
      // Add this to match Dropbox config
      oauth: {
        domain: process.env.VITE_COMPANION_URL || 'http://localhost:3020',
        transport: 'session'
      }
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
        
        // For Dropbox/Google Drive, we need to ensure each file gets a proper UUID
        // This is important to avoid React key collisions when displaying the files
        // and to ensure a new database entry is created for each upload
        const fileId = uuid(); // Always generate a new UUID for each upload
        
        // Store original provider ID for reference only
        let remoteId = null;
        if (foundMetadata.source === 'dropbox' || foundMetadata.source === 'googledrive') {
          // Extract original ID for reference but always use a proper UUID for the file key
          remoteId = foundMetadata.id || null;
          
          // Log the new ID mapping
          console.log(`📁 [COMPANION] Generated new UUID ${fileId} for provider file ${remoteId || 'unknown'}`);
          
          // Store the mapping if we have userMetadataStore available
          if (remoteId && userMetadataStore) {
            userMetadataStore.set(`original:${fileId}`, { 
              originalId: remoteId, 
              generatedId: fileId 
            });
          }
        }
        
        // Construct the key with folder path USING THE SAME FORMAT AS LOCAL UPLOADS
        // Local format: photos/userId/fileId_filename (no username segment)
        const key = folderPath 
          ? `photos/${userId}/${folderPath}/${fileId}_${filename}`
          : `photos/${userId}/${fileId}_${filename}`;
        
        console.log('📤 [COMPANION] S3 Upload - Generated key:', key, {
          userId,
          username,
          folderPath,
          fileId,
          filename: filename,
          fullPath: `s3://${process.env.COMPANION_AWS_BUCKET}/${key}`,
          localPath: path.join(process.env.COMPANION_DATADIR || './uploads', key),
          requestType: req?.method || 'unknown',
          contentType: req?.headers?.['content-type'] || 'unknown',
          metadata: foundMetadata || 'No metadata',
          isGoogleDrive: foundMetadata.source === 'googledrive',
          isDropbox: foundMetadata.source === 'dropbox',
          sourceFolder: foundMetadata.source || 'local'
        });
        
        // Store this mapping for later use
        // This helps us associate the S3 key with the correct user during afterComplete
        if (req?.session?.id) {
          userMetadataStore.set(`s3key:${key}`, {
            userId: userId,
            username: username,
            sessionId: req.session.id,
            timestamp: Date.now(),
            source: foundMetadata.source || 'local'
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
        console.log('📤 [COMPANION] Upload complete event received on socket:', JSON.stringify(data, null, 2));
        
        // Always generate a new UUID for every upload
        const newUuid = uuid();
        console.log(`🔑 [COMPANION] Generated new UUID for socket upload: ${newUuid}`);
        
        // CRITICAL FIX FOR DROPBOX IDs
        // If data.id is a Dropbox ID (starts with "id:"), 
        // we need to preserve it as originalId but use a UUID for the main ID
        const originalId = data.id; // Store the original ID for reference
        if (data.id && typeof data.id === 'string' && data.id.startsWith('id:')) {
          console.log(`🚨 [COMPANION] Detected Dropbox ID in socket data: ${data.id}`);
          console.log(`🔐 [COMPANION] Will store as originalId but use UUID as primary key`);
        }
        
        // Store original ID for tracking but use UUID as the main ID
        data.originalId = originalId;
        data.id = newUuid;
        
        // If there's metadata, also update it
        if (data.metadata) {
          data.metadata.originalId = originalId;
          data.metadata.id = newUuid;
          data.metadata.upload_timestamp = Date.now();

          // Ensure we capture the name of the file
          if (data.name && !data.metadata.name) {
            data.metadata.name = data.name;
          }
          
          // For Dropbox, ensure we capture the direct download URL if available
          if ((data.metadata.source === 'dropbox' || data.source === 'dropbox') && 
              data.url && !data.metadata.direct_url) {
            data.metadata.direct_url = data.url;
          }
          
          console.log(`🔐 [COMPANION] Updated metadata with UUID as primary key`);
        }
        
        // Check if this upload has already been processed in the last few seconds
        // Use the originalId (for Dropbox) or uploadId as the tracking key to avoid immediate duplicates
        const trackingId = originalId || data.uploadId || data.url;
        const currentTime = Date.now();
        console.log(`🔍 [COMPANION] Checking if ${trackingId} has already been processed recently`);
        
        // Log the current processed uploads
        console.log(`📋 [COMPANION] Current processed uploads (${processedUploads.size}):`, 
                    Array.from(processedUploads.keys()).slice(0, 5));
        
        let skipProcessing = false;
        if (trackingId && processedUploads.has(trackingId)) {
          const lastProcessed = processedUploads.get(trackingId);
          // Only consider as duplicate if processed within the last 2 seconds
          if (currentTime - lastProcessed < 2000) {
            console.log(`⏭️ [COMPANION] Upload ${trackingId} processed within last 2 seconds, debouncing...`);
            skipProcessing = true; // Skip duplicate socket processing if within 2 seconds
          } else {
            console.log(`📊 [COMPANION] Upload ${trackingId} processed before but not recently, will create a new entry`);
          }
        }
        
        if (skipProcessing) {
          socket.emit('upload-processed', {
            success: true,
            alreadyProcessed: true,
            message: 'Upload already processed (debounced)',
            uploadId: data.uploadId // Include uploadId for client-side matching
          });
          return;
        }
        
        // Mark this upload as processed with current timestamp
        if (trackingId) {
          processedUploads.set(trackingId, currentTime);
          console.log(`✅ [COMPANION] Marked ${trackingId} as processed at ${currentTime}, now ${processedUploads.size} tracked uploads`);
          
          // Cleanup processedUploads Map - remove entries older than 1 hour
          const oneHourAgo = currentTime - (60 * 60 * 1000);
          for (const [id, timestamp] of processedUploads.entries()) {
            if (timestamp < oneHourAgo) {
              processedUploads.delete(id);
            }
          }
        }
        
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
        
        // For Dropbox files, ensure we capture the original URL and path
        if (data.source === 'dropbox' || (data.metadata && data.metadata.source === 'dropbox')) {
          // Make sure accessToken is passed through if available
          if (data.accessToken && (!data.metadata || !data.metadata.accessToken)) {
            if (!data.metadata) data.metadata = {};
            data.metadata.accessToken = data.accessToken;
          }
          
          // Ensure we have the URL
          if (data.url && (!data.metadata || !data.metadata.url)) {
            if (!data.metadata) data.metadata = {};
            data.metadata.url = data.url;
          }
          
          // Add source info
          if (!data.metadata) data.metadata = {};
          data.metadata.source = 'dropbox';
        }
        
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
            // Ensure source is set
            source: data.metadata?.source || data.source || 'dropbox',
            // Add the name if available
            name: data.name || data.metadata?.name
          }
        };
        
        console.log('📦 [COMPANION] Enhanced data for processing:', enhancedData);
        
        // Process the upload with combined data
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