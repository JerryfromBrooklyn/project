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
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET
    },
    google: {
      key: process.env.GOOGLE_KEY,
      secret: process.env.GOOGLE_SECRET,
      scope: ['https://www.googleapis.com/auth/drive.readonly']
    }
  },
  server: {
    host: process.env.COMPANION_HOST || 'localhost',
    protocol: process.env.COMPANION_PROTOCOL || 'http',
    path: '/companion'
  },
  filePath: process.env.FILE_PATH || '/tmp',
  secret: process.env.COMPANION_SECRET || 'your_super_secret_value',
  uploadUrls: process.env.UPLOAD_URLS?.split(',') || [],
  validHosts: process.env.VALID_HOSTS?.split(',') || []
};

module.exports = { companionConfig }; 