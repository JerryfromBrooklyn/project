# Supabase to AWS Migration Guide

**Date**: June 12, 2024

## Introduction

This document outlines the steps, challenges, and implementation details for migrating our face recognition photo app from Supabase to AWS. It's intended for developers who need to understand the architectural differences and how to adapt our current implementation to AWS services.

## Current Architecture (Supabase)

Our application currently relies on three core Supabase features:

1. **Supabase Storage**: Stores face ID data in a structured `user-data` bucket
2. **Supabase Database**: Manages user data, face IDs, and photo metadata across multiple tables
3. **Supabase Realtime**: Provides subscription-based updates for photo matches

## Migration Components

### 1. Storage Migration (Supabase Storage → AWS S3)

#### Implementation Steps:

1. Create an S3 bucket with appropriate CORS and access policies
2. Update `FaceStorageService.js` to use AWS SDK instead of Supabase client
3. Develop a migration script to transfer existing files
4. Test with a small subset of users before full migration

#### Code Changes Required:

```javascript
// CURRENT: Supabase Storage Implementation
import { supabase } from '../lib/supabaseClient';

export const storeFaceId = async (userId, faceId) => {
  const filePath = `${userId}/face-id.json`;
  const content = JSON.stringify({ faceId, updatedAt: new Date().toISOString() });
  
  await supabase.storage
    .from('user-data')
    .upload(filePath, content, {
      upsert: true,
      contentType: 'application/json'
    });
};

export const getFaceId = async (userId) => {
  const filePath = `${userId}/face-id.json`;
  const { data, error } = await supabase.storage
    .from('user-data')
    .download(filePath);
    
  if (error) return null;
  
  const text = await data.text();
  const { faceId } = JSON.parse(text);
  return faceId;
};

// NEW: AWS S3 Implementation
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = "user-data";

export const storeFaceId = async (userId, faceId) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${userId}/face-id.json`,
    Body: JSON.stringify({ faceId, updatedAt: new Date().toISOString() }),
    ContentType: "application/json"
  };
  
  await s3Client.send(new PutObjectCommand(params));
};

export const getFaceId = async (userId) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${userId}/face-id.json`
    };
    
    const response = await s3Client.send(new GetObjectCommand(params));
    const bodyContents = await streamToString(response.Body);
    const { faceId } = JSON.parse(bodyContents);
    return faceId;
  } catch (error) {
    console.error('[FaceStorage] Error retrieving face ID:', error);
    return null;
  }
};

// Helper function to convert stream to string
const streamToString = (stream) => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('error', reject);
  stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
});
```

### 2. Database Migration (Supabase DB → AWS RDS/DynamoDB)

#### Implementation Options:

**Option A: AWS RDS (PostgreSQL)**
- Most compatible option, requiring minimal code changes
- Similar SQL queries can be maintained
- Use AWS Database Migration Service (DMS) for seamless migration

**Option B: AWS DynamoDB**
- Requires significant query rewrites
- Better scaling capabilities for high-traffic applications
- Different data modeling approach required

#### RDS Migration Steps:

1. Create RDS PostgreSQL instance with matching schema
2. Use AWS DMS to migrate data from Supabase PostgreSQL
3. Update connection strings in application code
4. Test database operations thoroughly

#### RDS Implementation (minimal changes):

```javascript
// CURRENT: Supabase Database queries
const { data: faceData, error } = await supabase
  .from('user_faces')
  .select('face_id')
  .eq('user_id', userId)
  .single();

// NEW: RDS with node-postgres
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  port: process.env.RDS_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

const getFaceId = async (userId) => {
  const result = await pool.query(
    'SELECT face_id FROM user_faces WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].face_id;
  }
  return null;
};
```

#### DynamoDB Implementation (major changes):

```javascript
// NEW: DynamoDB Implementation
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Get face ID from DynamoDB
export const getFaceId = async (userId) => {
  try {
    const params = {
      TableName: "user_faces",
      Key: { user_id: userId }
    };
    
    const response = await docClient.send(new GetCommand(params));
    return response.Item?.face_id;
  } catch (error) {
    console.error('[Database] Error getting face ID:', error);
    return null;
  }
};

// Save face ID to DynamoDB
export const saveFaceId = async (userId, faceId) => {
  try {
    const params = {
      TableName: "user_faces",
      Item: {
        user_id: userId,
        face_id: faceId,
        updated_at: new Date().toISOString()
      }
    };
    
    await docClient.send(new PutCommand(params));
    return true;
  } catch (error) {
    console.error('[Database] Error saving face ID:', error);
    return false;
  }
};
```

### 3. Realtime Subscriptions (Supabase Realtime → AWS)

This is the most critical and challenging component to migrate, as AWS doesn't have a direct equivalent to Supabase Realtime.

#### Current Implementation:

```javascript
// PhotoManager.js
useEffect(() => {
  console.log('Setting up realtime subscription for photo matches...');
  
  // Subscribe to all changes on the photos table
  const subscription = supabase
    .from('photos')
    .on('*', payload => {
      // Handle updates, refresh UI when photos change
      fetchPhotos();
    })
    .subscribe();
    
  // Cleanup on unmount
  return () => {
    console.log('Cleaning up realtime subscriptions');
    supabase.removeSubscription(subscription);
  };
}, [user]);
```

#### AWS Alternatives:

**Option A: AWS AppSync with GraphQL**

```javascript
// AWS AppSync implementation
import { API, graphqlOperation } from 'aws-amplify';
import { onUpdatePhoto } from './graphql/subscriptions';

// In component:
useEffect(() => {
  // Subscribe to photo updates
  const subscription = API.graphql(
    graphqlOperation(onUpdatePhoto, { userId: user.id })
  ).subscribe({
    next: ({ provider, value }) => {
      // Handle updated photo data
      const updatedPhoto = value.data.onUpdatePhoto;
      fetchPhotos(); // Or update state directly with the new data
    },
    error: error => console.warn(error)
  });
  
  // Cleanup
  return () => subscription.unsubscribe();
}, [user]);
```

Required backend GraphQL schema:
```graphql
type Photo @model 
@key(name: "byUser", fields: ["userId"])
@auth(rules: [{allow: owner, operations: [create, read, update]}]) {
  id: ID!
  userId: ID!
  matched_users: [MatchedUser]
  # other fields...
}

type Subscription {
  onUpdatePhoto(userId: ID!): Photo
    @aws_subscribe(mutations: ["updatePhoto"])
}
```

**Option B: API Gateway WebSockets + Lambda**

```javascript
// Client-side implementation
class PhotoMatchSocket {
  constructor(userId) {
    this.userId = userId;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = [];
  }
  
  connect() {
    this.socket = new WebSocket(
      'wss://abcdef123.execute-api.us-east-1.amazonaws.com/production'
    );
    
    this.socket.onopen = () => {
      // Register for updates about this user's photos
      this.socket.send(JSON.stringify({
        action: 'subscribe',
        userId: this.userId
      }));
      this.reconnectAttempts = 0;
    };
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PHOTO_UPDATED') {
        // Notify all listeners
        this.listeners.forEach(callback => callback(data.photo));
      }
    };
    
    this.socket.onclose = () => this.handleDisconnect();
    this.socket.onerror = () => this.handleDisconnect();
  }
  
  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }
  
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// In React component:
useEffect(() => {
  if (!user) return;
  
  const socket = new PhotoMatchSocket(user.id);
  socket.connect();
  
  const removeListener = socket.addListener((updatedPhoto) => {
    // Update the UI with the new photo data
    setPhotos(prev => {
      const existingIndex = prev.findIndex(p => p.id === updatedPhoto.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedPhoto;
        return updated;
      } else {
        return [...prev, updatedPhoto];
      }
    });
  });
  
  return () => {
    removeListener();
    socket.disconnect();
  };
}, [user]);
```

**Option C: Amazon DynamoDB Streams + Lambda + IoT Core**

This is a more complex but fully serverless approach:

1. Configure DynamoDB Streams on photos table
2. Create Lambda function to process change events
3. Lambda publishes updates to IoT Core topics
4. Client subscribes to IoT Core topics for real-time updates

```javascript
// Client-side implementation using AWS IoT Device SDK
import { mqtt, iot } from 'aws-iot-device-sdk-v2';

// In React component:
useEffect(() => {
  if (!user) return;
  
  // Configure MQTT client
  const config = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
    .with_endpoint('your-iot-endpoint.iot.us-east-1.amazonaws.com')
    .with_credentials(/* configure with Cognito or custom auth */)
    .with_client_id(`photo-app-${user.id}-${Date.now()}`)
    .build();
    
  const client = new mqtt.MqttClient();
  const connection = client.new_connection(config);
  
  // Connect and subscribe to user-specific topic
  connection.connect()
    .then(() => {
      console.log('Connected to IoT Core');
      return connection.subscribe(
        `photos/${user.id}/updates`, 
        mqtt.QoS.AtLeastOnce,
        (topic, payload) => {
          const message = JSON.parse(new TextDecoder().decode(payload));
          // Update UI with new photo data
          if (message.type === 'PHOTO_UPDATED') {
            fetchPhotos(); // Or update state directly
          }
        }
      );
    })
    .catch(err => console.error('Error connecting to IoT Core:', err));
    
  // Cleanup
  return () => {
    connection.disconnect();
  };
}, [user]);
```

## Minimum Viable Migration Strategy

For teams looking to migrate quickly with minimal disruption, we recommend this phased approach:

### Phase 1: Storage Migration (1-2 weeks)
1. Create S3 bucket with appropriate policies
2. Update FaceStorageService.js to dual-write to both systems
3. Create Lambda function to migrate existing files from Supabase to S3
4. Update read operations to check S3 first, then fall back to Supabase

### Phase 2: Database Migration (2-3 weeks)
1. Set up RDS PostgreSQL instance (fastest option)
2. Use AWS Database Migration Service to transfer schema and data
3. Update connection strings and queries with minimal code changes
4. Implement dual-write for critical operations during transition

### Phase 3: Realtime Implementation (3-4 weeks)
1. Implement WebSockets via API Gateway (simplest option)
2. Create Lambda function to process database changes
3. Update client code to use WebSockets instead of Supabase Realtime
4. Test thoroughly with real-world usage patterns

### Phase 4: Decommission Supabase (1 week)
1. Verify all functionality works properly on AWS
2. Remove dual-write code paths
3. Redirect all client operations to AWS services
4. Monitor for any issues and maintain ability to roll back

## Comparison: What's Different?

| Feature | Supabase | AWS Equivalent | Migration Difficulty |
|---------|----------|----------------|----------------------|
| Storage | Supabase Storage | S3 | Easy (similar APIs) |
| Database | PostgreSQL | RDS PostgreSQL | Medium (connection config changes) |
| Realtime | Supabase Realtime | AppSync/WebSockets | Hard (architectural changes) |
| Auth | Supabase Auth | Cognito | Medium (auth flow changes) |
| Row-Level Security | PostgreSQL RLS | IAM + Application Logic | Hard (different paradigm) |

## Common Issues and Solutions

1. **CORS Configuration**
   - S3 buckets require explicit CORS configuration
   - API Gateway endpoints need proper CORS headers

2. **Authentication Flow Changes**
   - Supabase JWT tokens won't work with AWS services
   - Need to implement Cognito or custom auth with IAM

3. **Realtime Connectivity**
   - WebSocket connections can be less reliable than Supabase Realtime
   - Implement proper reconnection logic and error handling

4. **Permission Models**
   - Supabase RLS policies must be replicated with IAM and application logic
   - Requires careful testing to ensure proper access control

5. **Cost Considerations**
   - AWS services are billed separately and can add up
   - Monitor usage and implement cost controls early

## Conclusion

Migrating from Supabase to AWS is a significant undertaking, particularly for the realtime functionality. However, by following a phased approach and understanding the architectural differences, it's possible to maintain all current functionality while gaining the benefits of AWS's mature ecosystem.

The storage and database migrations are relatively straightforward, but the realtime subscription functionality will require careful planning and implementation. We recommend starting with the storage migration as it's the simplest component and provides the most immediate value. 