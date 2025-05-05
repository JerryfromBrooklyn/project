/**
 * S3 Configuration Script
 * 
 * This script configures the S3 bucket for the application,
 * setting up proper CORS and bucket policies for uploads.
 */

const { S3Client, PutBucketPolicyCommand, PutPublicAccessBlockCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// AWS credentials and configuration
const AWS_REGION = 'us-east-1';
const AWS_ACCESS_KEY_ID = 'AKIA3ISBVSQ26AGWN3OT';
const AWS_SECRET_ACCESS_KEY = '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';
const BUCKET_NAME = 'shmong';

// Initialize the S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

// Define the bucket policy for public access
const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
    },
    {
      Sid: 'AllowDirectUploads',
      Effect: 'Allow',
      Principal: '*',
      Action: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      Resource: `arn:aws:s3:::${BUCKET_NAME}/photos/*`
    }
  ]
};

// Define CORS configuration
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: ['*'],
      ExposeHeaders: ['ETag', 'x-amz-meta-custom-header', 'x-amz-server-side-encryption'],
      MaxAgeSeconds: 3600
    }
  ]
};

// Apply configuration to S3 bucket
async function configureS3Bucket() {
  try {
    // 1. Apply bucket policy for public access
    console.log(`Applying bucket policy to ${BUCKET_NAME}...`);
    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    }));
    console.log('✅ Bucket policy applied successfully');
    
    // 2. Remove block public access settings
    console.log('Removing public access block...');
    await s3Client.send(new PutPublicAccessBlockCommand({
      Bucket: BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }));
    console.log('✅ Public access block removed successfully');
    
    // 3. Apply CORS configuration
    console.log('Applying CORS configuration...');
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    }));
    console.log('✅ CORS configuration applied successfully');
    
    console.log('🎉 S3 bucket configuration complete!');
  } catch (error) {
    console.error('❌ Error configuring S3 bucket:', error);
  }
}

// Execute the configuration
configureS3Bucket(); 