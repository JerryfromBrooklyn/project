const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const companion = require('@uppy/companion');
const path = require('path');
const fs = require('fs');

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
      // Log the full request for debugging
      console.log('📋 Request data:', {
        body: req?.body || 'No body',
        metadata: req?.body?.metadata || 'No metadata',
        headers: req?.headers || 'No headers',
        path: req?.path || 'No path',
        originalUrl: req?.originalUrl || 'No URL',
        query: req?.query || 'No query params'
      });

      // Get user ID from metadata (check multiple possible fields)
      let userId = 'default-user';
      if (req?.body?.metadata) {
        userId = req.body.metadata.userId || 
                req.body.metadata.user_id || 
                req.body.metadata.uploadedBy || 
                req.body.metadata.uploaded_by || 
                'default-user';
        
        console.log('🔑 Found user ID in metadata:', userId);
      } else {
        console.log('⚠️ No metadata found in request body');
      }

      // Get folder path from metadata
      const folderPath = req?.body?.metadata?.folderPath || '';

      // Generate a unique key for the file
      const fileId = Math.random().toString(36).substring(2, 15);
      
      // Use the original filename if available, otherwise use a default
      const originalFilename = filename || 'unnamed-file';
      
      // Construct the key with folder path if provided
      const key = folderPath 
        ? `photos/${userId}/${folderPath}/${fileId}_${originalFilename}`
        : `photos/${userId}/${fileId}_${originalFilename}`;
      
      console.log('📤 S3 Upload - Generated key:', key, {
        userId,
        folderPath,
        fileId,
        filename: originalFilename,
        fullPath: `s3://${process.env.COMPANION_AWS_BUCKET}/${key}`,
        localPath: path.join(process.env.COMPANION_DATADIR || './uploads', key),
        requestType: req?.method || 'unknown',
        contentType: req?.headers?.['content-type'] || 'unknown',
        metadata: req?.body?.metadata || 'No metadata'
      });
      
      return key;
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
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With', 'uppy-auth-token'],
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
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With, uppy-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
companion.socket(server); 