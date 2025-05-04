const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const companion = require('@uppy/companion');

const app = express();

// Required middleware
app.use(bodyParser.json());
app.use(session({
  secret: process.env.COMPANION_SECRET || 'some-secret-key',
  resave: true,
  saveUninitialized: true
}));

// Companion configuration
const companionOptions = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET,
    },
    dropbox: {
      key: 'kew5qhqmcd5txjp',
      secret: 'nxn47jv7yllg6pn',
    }
  },
  server: {
    host: process.env.COMPANION_DOMAIN || 'localhost:3020',
    protocol: process.env.COMPANION_PROTOCOL || 'http',
  },
  filePath: process.env.COMPANION_DATADIR || './uploads',
  secret: process.env.COMPANION_SECRET || 'some-secret-key',
  debug: true,
  corsOrigins: ['http://localhost:5173', 'http://localhost:5174'],
  uploadUrls: ['http://localhost:5173', 'http://localhost:5174'],
  oauthDomain: process.env.COMPANION_OAUTH_DOMAIN || 'localhost:3020',
  validHosts: process.env.COMPANION_DOMAINS ? process.env.COMPANION_DOMAINS.split(',') : ['localhost:3020'],
  streamingUpload: true,
  chunkSize: 6 * 1024 * 1024, // 6MB chunks
  enableUrlEndpoint: true,
  enableGooglePickerEndpoint: true
};

// Add CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
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
const PORT = process.env.PORT || 3020;
const server = app.listen(PORT, () => {
  console.log(`Companion server running on port ${PORT}`);
});

// Add WebSocket support
companion.socket(server); 