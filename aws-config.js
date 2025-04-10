/**
 * AWS Configuration
 * Global configuration for AWS SDK
 */

// Import AWS SDK
import AWS from 'aws-sdk';

// Configure the SDK
AWS.config.update({
  region: 'us-east-1', // Set to your AWS region
  maxRetries: 3
});

// Allow cross-origin credential use
AWS.config.credentials = new AWS.Credentials({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
});

// Export configured services
export const Lambda = new AWS.Lambda();
export const DynamoDB = new AWS.DynamoDB.DocumentClient();
export const Rekognition = new AWS.Rekognition();
export const S3 = new AWS.S3();

// Export default config
export default AWS; 