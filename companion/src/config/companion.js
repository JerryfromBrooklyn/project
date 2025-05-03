require('dotenv').config();

console.log('ENV:', {
  COMPANION_SECRET: process.env.COMPANION_SECRET,
  COMPANION_HOST: process.env.COMPANION_HOST,
  FILE_PATH: process.env.FILE_PATH,
  DROPBOX_KEY: process.env.DROPBOX_KEY,
  DROPBOX_SECRET: process.env.DROPBOX_SECRET,
  GOOGLE_KEY: process.env.GOOGLE_KEY,
  GOOGLE_SECRET: process.env.GOOGLE_SECRET
});

const companionConfig = {
  providerOptions: {
    s3: {
      getKey: (req, filename) => {
        const userId = req.user?.id || 'anonymous';
        const eventId = req.body.eventId || 'default';
        return `${userId}/${eventId}/${Date.now()}-${filename}`;
      },
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY
    },
    dropbox: {
      key: '3z9dfal8w3ycd6m',
      secret: 'nx1kfxg5wuelnhv',
      scope: ['files.content.read', 'files.metadata.read'],
      companionAllowedHosts: [
        'localhost:3020',
        'localhost:5173',
        '127.0.0.1:5173',
        ...(process.env.VALID_HOSTS?.split(',') || [])
      ],
      companionHeaders: {
        'x-uppy-auth-token': process.env.COMPANION_SECRET
      },
      companionUrl: process.env.COMPANION_URL || 'http://localhost:3020',
      companionPath: '/',
      debug: true,
      auth: {
        path: '/dropbox/connect',
        callback: '/dropbox/callback',
        token: {
          name: 'uppy-dropbox-token',
          secret: process.env.COMPANION_SECRET,
          cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
          }
        }
      },
      oauth: {
        redirectUri: 'http://localhost:3020/dropbox/callback',
        scope: 'files.content.read files.metadata.read',
        state: true,
        responseType: 'code',
        tokenPath: '/oauth2/token',
        authPath: '/oauth2/authorize',
        baseUrl: 'https://www.dropbox.com'
      },
      verifyToken: (req, token) => {
        return token === req.cookies['uppy-dropbox-token'];
      },
      middleware: {
        before: async (req, res, next) => {
          // Get token from cookies
          const token = req.cookies['uppy-dropbox-token'];
          
          // Verify token with Dropbox API
          const verifyResponse = await fetch('https://api.dropboxapi.com/2/auth/token/validate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!verifyResponse.ok) {
            // Token is invalid or expired
            return res.status(401).json({ error: 'Token invalid or expired' });
          }

          // Token is valid, proceed
          req.headers['Authorization'] = `Bearer ${token}`;
          next();
        }
      }
    },
    drive: {
      key: process.env.GOOGLE_KEY,
      secret: process.env.GOOGLE_SECRET,
      scope: ['https://www.googleapis.com/auth/drive.readonly']
    }
  },
  server: {
    host: process.env.COMPANION_HOST || 'localhost',
    protocol: process.env.COMPANION_PROTOCOL || 'http',
    path: '/',
    debug: true,
    errorHandler: (err, req, res, next) => {
      console.error('Companion error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    },
    session: {
      secret: process.env.COMPANION_SECRET || 'your_super_secret_value',
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    },
    middleware: {
      before: [
        (req, res, next) => {
          // Log the incoming request path and session
          console.log('Incoming request:', {
            path: req.path,
            session: req.session,
            body: req.body,
            query: req.query,
            headers: req.headers
          });
          next();
        }
      ]
    }
  },
  filePath: process.env.FILE_PATH || '/tmp',
  secret: process.env.COMPANION_SECRET || 'your_super_secret_value',
  uploadUrls: process.env.UPLOAD_URLS?.split(',') || [],
  validHosts: [
    'localhost:3020',
    'localhost:5173',
    '127.0.0.1:5173',
    ...(process.env.VALID_HOSTS?.split(',') || [])
  ],
  debug: true,
  provider: {
    dropbox: {
      path: '/dropbox',
      auth: {
        path: '/dropbox/connect',
        callback: '/dropbox/callback'
      },
      list: {
        path: '/dropbox/list',
        method: 'GET'
      }
    }
  }
};

module.exports = { companionConfig }; 