require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const companion = require('@uppy/companion');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./utils/errorHandler');
const routes = require('./routes');
const { companionConfig } = require('./config/companion');

const app = express();

// Cookie parser
app.use(cookieParser(process.env.COMPANION_SECRET));

// Middleware to get token from cookies
app.use((req, res, next) => {
  req.dropboxToken = req.cookies['uppy-dropbox-token'];
  next();
});

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.VALID_HOSTS?.split(',') || [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-uppy-auth-token']
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('combined'));
app.use(express.json());

// Debug middleware for Dropbox routes
app.use((req, res, next) => {
  if (req.path.startsWith('/dropbox')) {
    console.log('Dropbox request details:', {
      path: req.path,
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      originalUrl: req.originalUrl,
      params: req.params
    });
    // Log the response
    const originalSend = res.send;
    res.send = function(body) {
      console.log('Dropbox response:', {
        statusCode: res.statusCode,
        body: body
      });
      return originalSend.apply(res, arguments);
    };
  }
  next();
});

// Add custom Dropbox authentication route
app.get('/dropbox/connect', (req, res) => {
  const { uppyVersions, state } = req.query;
  
  // Redirect to Dropbox OAuth
  const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
    new URLSearchParams({
      response_type: 'code',
      client_id: companionConfig.providerOptions.dropbox.key,
      redirect_uri: 'http://localhost:3020/dropbox/callback',
      state: state,
      scope: 'files.content.read files.metadata.read'
    });

  res.redirect(authUrl);
});

// Add custom Dropbox callback handler
app.get('/dropbox/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    // Exchange code for access token
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: companionConfig.providerOptions.dropbox.key,
        client_secret: companionConfig.providerOptions.dropbox.secret,
        redirect_uri: 'http://localhost:3020/dropbox/callback'
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokenData = await response.json();
    console.log('Dropbox token data:', tokenData);

    // Store token in cookie
    res.cookie('uppy-dropbox-token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax'
    });
    
    // Redirect back to Uppy with success
    res.redirect(`http://localhost:5173/?state=${state}`);
  } catch (error) {
    console.error('Dropbox callback error:', error);
    res.redirect(`http://localhost:5173/?error=${encodeURIComponent(error.message)}`);
  }
});

// Add Dropbox list endpoint
app.get('/dropbox/list/', async (req, res) => {
  try {
    const token = req.dropboxToken;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get files from Dropbox
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: '',
        recursive: false,
        include_media_info: true
      })
    });

    if (!response.ok) {
      throw new Error(`Dropbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Dropbox response to Uppy format
    const files = data.entries
      .filter(item => item['.tag'] === 'file')
      .map(item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.media_info?.metadata?.format || 'unknown',
        url: `https://content.dropboxapi.com/2/files/download?path=${encodeURIComponent(item.path_display)}`
      }));

    res.json(files);
  } catch (error) {
    console.error('Dropbox list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount companion app
const companionApp = companion.app(companionConfig);

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Companion error:', err);
  if (err.status === 400) {
    res.status(400).json({
      error: 'Bad Request',
      message: err.message
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  }
});

app.use(companionApp);

// Custom Routes
app.use(routes);

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`Companion server listening on port ${port}`);
  console.log('Dropbox configuration:', {
    key: process.env.DROPBOX_KEY ? 'Set' : 'Not set',
    secret: process.env.DROPBOX_SECRET ? 'Set' : 'Not set',
    companionUrl: process.env.COMPANION_URL || 'http://localhost:3020',
    validHosts: corsOptions.origin
  });
}); 