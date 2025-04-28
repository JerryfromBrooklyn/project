const awsConfig = {
  s3: {
    bucket: process.env.S3_BUCKET || 'shmong-photos',
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    getKey: (req, filename) => {
      // Use the same key structure as existing uploads
      return `uploads/${Date.now()}-${filename}`;
    }
  },
  ecs: {
    cluster: process.env.ECS_CLUSTER_NAME,
    service: process.env.ECS_SERVICE_NAME,
    taskDefinition: process.env.ECS_TASK_DEFINITION
  }
};

module.exports = awsConfig; 