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
const crypto = require('crypto');

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

// Track processed uploads to prevent duplicates
const processedUploads = new Map();

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

const handleUploadComplete = async (payload) => {
  console.log('🔄 [Server] Processing upload complete:', payload);
  
  try {
    // Check if this upload was recently processed (within last 5 seconds)
    const uploadKey = payload.uploadId || payload.photoId || payload.originalId;
    if (uploadKey) {
      const lastProcessed = processedUploads.get(uploadKey);
      const now = Date.now();
      if (lastProcessed && (now - lastProcessed) < 5000) {
        console.log(`⚠️ [Server] Upload ${uploadKey} was processed recently, skipping...`);
        return {
          success: true,
          alreadyProcessed: true,
          message: 'Upload was processed recently'
        };
      }
      // Mark as processed with timestamp
      processedUploads.set(uploadKey, now);
      
      // Clean up old entries (older than 5 minutes)
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      for (const [key, timestamp] of processedUploads.entries()) {
        if (timestamp < fiveMinutesAgo) {
          processedUploads.delete(key);
        }
      }
    }
    
    // Generate a new UUID for the database entry
    const newUUID = crypto.randomUUID();
    
    // Extract user info
    const userId = payload.metadata?.userId || payload.metadata?.user_id;
    const username = payload.metadata?.username;
    
    if (!userId) {
      throw new Error('Missing user ID in upload metadata');
    }
    
    // Determine the source
    const source = payload.source || payload.metadata?.source || 'local';
    const isRemoteUpload = source === 'dropbox' || source === 'googledrive';
    
    // For remote uploads, we need to download the file first
    let fileBuffer;
    if (isRemoteUpload) {
      console.log(`📥 [Server] Downloading remote file from ${source}...`);
      fileBuffer = await getFileFromS3(payload.s3Key);
    }
    
    // Process the upload (face detection, etc.)
    const processedResult = await processUpload({
      fileBuffer,
      userId,
      username,
      source,
      metadata: payload.metadata,
      s3Key: payload.s3Key,
      newUUID
    });
    
    console.log(`✅ [Server] Upload processing complete for ${newUUID}`);
    return processedResult;
    
  } catch (error) {
    console.error('❌ [Server] Error processing upload:', error);
    throw error;
  }
};

// Helper function to download remote files
const downloadRemoteFile = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return await response.buffer();
  } catch (error) {
    console.error('Error downloading remote file:', error);
    throw error;
  }
};

// Helper function to get file from S3
const getFileFromS3 = async (s3Path) => {
  try {
    const params = {
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: s3Path
    };
    
    const data = await s3Client.getObject(params).promise();
    return data.Body;
  } catch (error) {
    console.error('Error getting file from S3:', error);
    throw error;
  }
};

// Helper function to upload to S3
const uploadToS3 = async (fileBuffer, s3Path, options = {}) => {
  try {
    const params = {
      Bucket: process.env.COMPANION_AWS_BUCKET,
      Key: s3Path,
      Body: fileBuffer,
      ContentType: options.ContentType || 'image/jpeg',
      Metadata: options.Metadata || {}
    };
    
    await s3Client.putObject(params).promise();
    
    // Generate URLs
    const url = `https://${process.env.COMPANION_AWS_BUCKET}.s3.amazonaws.com/${s3Path}`;
    const publicUrl = url; // You might want to use CloudFront or other CDN URL here
    
    return {
      success: true,
      url,
      publicUrl
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

// Helper function to detect faces
const detectFaces = async (imageBuffer) => {
  try {
    // Use AWS Rekognition or your face detection service
    const rekognition = new AWS.Rekognition();
    
    const params = {
      Image: {
        Bytes: imageBuffer
      },
      Attributes: ['ALL']
    };
    
    const result = await rekognition.detectFaces(params).promise();
    
    return {
      faces: result.FaceDetails.map(face => ({
        boundingBox: face.BoundingBox,
        confidence: face.Confidence,
        landmarks: face.Landmarks,
        pose: face.Pose,
        quality: face.Quality
      }))
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return { faces: [] };
  }
};

// Helper function to match faces
const matchFaces = async (faces) => {
  try {
    // Implement your face matching logic here
    // This could involve:
    // 1. Searching your face collection
    // 2. Comparing against known users
    // 3. Returning matches with confidence scores
    
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error matching faces:', error);
    return [];
  }
};

// Helper function to save to database
const saveToDatabase = async (metadata) => {
  try {
    // Use your database service (e.g., DynamoDB) to save the metadata
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: metadata
    };
    
    await dynamoDbClient.put(params).promise();
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
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
    console.log('🔌 [Socket] Client connected');
    
    // Handle authentication
    socket.on('auth', (data) => {
      console.log('🔑 [Socket] Auth data received:', data);
      
      // Store user info with socket ID
      const userInfo = {
        userId: data.userId || data.user_id,
        username: data.username,
        eventId: data.eventId
      };
      
      socket.userInfo = userInfo;
      console.log('✅ [Socket] User authenticated:', userInfo);
    });
    
    // Handle upload-complete events
    socket.on('upload-complete', async (data) => {
      console.log('📤 [Socket] Upload complete event received:', data);
      
      try {
        // Add user info from socket to metadata
        const metadata = {
          ...data.metadata,
          userId: socket.userInfo?.userId || data.metadata?.userId,
          username: socket.userInfo?.username || data.metadata?.username
        };
        
        // Process the upload using our unified flow
        const result = await handleUploadComplete({
          ...data,
          metadata
        });
        
        // Emit the result back to the client
        socket.emit('upload-processed', result);
        
        // Also emit a global event for all clients
        io.emit('global-upload-processed', {
          success: result.success,
          photoId: result.photoId,
          userId: metadata.userId,
          s3Path: result.photoMetadata?.storage_path
        });
        
      } catch (error) {
        console.error('❌ [Socket] Error processing upload:', error);
        socket.emit('upload-processed', {
          success: false,
          error: error.message
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 [Socket] Client disconnected');
    });
  });
  
  console.log('✅ [COMPANION] Registered socket event handlers');
} else {
  console.warn('⚠️ [COMPANION] No socket handler available, falling back to hooks');
} 