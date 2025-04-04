#!/usr/bin/env node

/**
 * AWS Setup Script
 * This script helps set up the required AWS resources for the application.
 * 
 * It will:
 * 1. Create the Rekognition Collection
 * 2. Create the required DynamoDB tables
 * 3. Create the S3 bucket with proper CORS configuration
 * 
 * Prerequisites:
 * - AWS CLI must be installed and configured with credentials
 * - Node.js 18+ must be installed
 * - Proper environment variables must be set (see .env.sample)
 */

import { 
  RekognitionClient, 
  CreateCollectionCommand,
  DescribeCollectionCommand,
  ListCollectionsCommand 
} from '@aws-sdk/client-rekognition';

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand
} from '@aws-sdk/client-dynamodb';

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand
} from '@aws-sdk/client-s3';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// AWS Configuration
const AWS_REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_SECRET_ACCESS_KEY;
const COLLECTION_ID = process.env.VITE_AWS_COLLECTION_ID || 'shmong-faces';
const FACE_BUCKET_NAME = 'shmong-face-data';

// Check if AWS credentials are set
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('AWS credentials are not set. Please set them in your .env file.');
  process.exit(1);
}

// Initialize AWS clients
const rekognitionClient = new RekognitionClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// DynamoDB table definitions
const TABLE_DEFINITIONS = {
  'shmong-users': {
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  'shmong-photos': {
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user_id-index',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  'shmong-face-data': {
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user_id-index',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  'shmong-face-matches': {
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'target_user_id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user_id-index',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'target_user_id-index',
        KeySchema: [
          { AttributeName: 'target_user_id', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
};

// S3 CORS configuration
const CORS_CONFIGURATION = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: ['*'], // Limit this to your domains in production
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000,
    },
  ],
};

/**
 * Main setup function
 */
async function main() {
  console.log('Starting AWS setup...');
  
  try {
    // 1. Set up Rekognition Collection
    await setupRekognitionCollection();
    
    // 2. Set up DynamoDB tables
    await setupDynamoDBTables();
    
    // 3. Set up S3 bucket
    await setupS3Bucket();
    
    console.log('\nAWS setup complete! 🎉');
    console.log('\nNote: You still need to set up Amazon Cognito manually.');
    console.log('Follow the instructions in the README for setting up Cognito User Pool and Identity Pool.');
    
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

/**
 * Set up Rekognition Collection
 */
async function setupRekognitionCollection() {
  console.log('\n=== Setting up Rekognition Collection ===');
  
  try {
    // Check if collection exists
    const listCommand = new ListCollectionsCommand({});
    const collections = await rekognitionClient.send(listCommand);
    
    if (collections.CollectionIds?.includes(COLLECTION_ID)) {
      console.log(`Collection '${COLLECTION_ID}' already exists.`);
      
      // Describe the collection
      const describeCommand = new DescribeCollectionCommand({ CollectionId: COLLECTION_ID });
      const description = await rekognitionClient.send(describeCommand);
      
      console.log(`Collection ARN: ${description.CollectionARN}`);
      console.log(`Number of faces: ${description.FaceCount}`);
      console.log(`Created: ${description.CreationTimestamp}`);
    } else {
      // Create the collection
      console.log(`Creating collection '${COLLECTION_ID}'...`);
      const createCommand = new CreateCollectionCommand({ CollectionId: COLLECTION_ID });
      const result = await rekognitionClient.send(createCommand);
      
      console.log(`Collection '${COLLECTION_ID}' created with status code: ${result.StatusCode}`);
      console.log(`Collection ARN: ${result.CollectionARN}`);
    }
  } catch (error) {
    console.error(`Error setting up Rekognition Collection: ${error.message}`);
    throw error;
  }
}

/**
 * Set up DynamoDB tables
 */
async function setupDynamoDBTables() {
  console.log('\n=== Setting up DynamoDB Tables ===');
  
  try {
    // List existing tables
    const listTablesCommand = new ListTablesCommand({});
    const existingTables = await dynamoDBClient.send(listTablesCommand);
    
    for (const tableName of Object.keys(TABLE_DEFINITIONS)) {
      if (existingTables.TableNames?.includes(tableName)) {
        console.log(`Table '${tableName}' already exists.`);
        
        // Describe the table
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const description = await dynamoDBClient.send(describeCommand);
        
        console.log(`Status: ${description.Table?.TableStatus}`);
        console.log(`Item count (approximate): ${description.Table?.ItemCount}`);
      } else {
        // Create the table
        console.log(`Creating table '${tableName}'...`);
        const createCommand = new CreateTableCommand({
          TableName: tableName,
          ...TABLE_DEFINITIONS[tableName],
        });
        
        const result = await dynamoDBClient.send(createCommand);
        console.log(`Table '${tableName}' created with status: ${result.TableDescription?.TableStatus}`);
      }
    }
  } catch (error) {
    console.error(`Error setting up DynamoDB tables: ${error.message}`);
    throw error;
  }
}

/**
 * Set up S3 bucket
 */
async function setupS3Bucket() {
  console.log('\n=== Setting up S3 Bucket ===');
  
  try {
    // Check if bucket exists
    try {
      const headBucketCommand = new HeadBucketCommand({ Bucket: FACE_BUCKET_NAME });
      await s3Client.send(headBucketCommand);
      console.log(`Bucket '${FACE_BUCKET_NAME}' already exists.`);
    } catch (error) {
      if (error.name === 'NotFound') {
        // Create the bucket
        console.log(`Creating bucket '${FACE_BUCKET_NAME}'...`);
        const createBucketCommand = new CreateBucketCommand({ 
          Bucket: FACE_BUCKET_NAME,
          CreateBucketConfiguration: {
            LocationConstraint: AWS_REGION === 'us-east-1' ? null : AWS_REGION
          }
        });
        
        await s3Client.send(createBucketCommand);
        console.log(`Bucket '${FACE_BUCKET_NAME}' created.`);
      } else {
        throw error;
      }
    }
    
    // Set CORS configuration
    console.log(`Setting CORS configuration on bucket '${FACE_BUCKET_NAME}'...`);
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: FACE_BUCKET_NAME,
      CORSConfiguration: CORS_CONFIGURATION,
    });
    
    await s3Client.send(putCorsCommand);
    console.log('CORS configuration set successfully.');
    
    console.log('\nNote: Make sure to configure public access settings for the bucket according to your needs.');
    console.log('By default, the bucket is private. You may need to adjust its policy to allow public read access if needed.');
  } catch (error) {
    console.error(`Error setting up S3 bucket: ${error.message}`);
    throw error;
  }
}

// Run the main function
main().catch(console.error); 