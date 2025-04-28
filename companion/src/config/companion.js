console.log('ENV:', {
  COMPANION_SECRET: process.env.COMPANION_SECRET,
  COMPANION_HOST: process.env.COMPANION_HOST,
  FILE_PATH: process.env.FILE_PATH
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