# Understanding DynamoDB Global Secondary Indexes (GSIs)

## What Are GSIs?

Global Secondary Indexes (GSIs) in DynamoDB are specialized data structures that enable efficient queries on attributes other than the primary key. Unlike the primary index, which is tied to the partition key and sort key, GSIs allow you to query your data using alternative keys.

A GSI has its own partition key and optional sort key, which can be different from those on the base table. This means you can effectively query your data in multiple ways beyond your primary access pattern.

## Cost Implications of GSIs

GSIs do come with additional costs that you should be aware of:

1. **Storage Costs**: Each GSI maintains a copy of attributes from the base table, meaning you're paying for additional storage. The storage cost for a GSI is the same per GB as the base table.

2. **Write Costs**: Every write to the base table that affects an attribute in a GSI requires a corresponding write to the index. This effectively doubles your write costs for each GSI you maintain.

3. **Read Costs**: Queries against GSIs consume read capacity units (RCUs), similar to queries against the base table.

4. **Provisioned Capacity**: GSIs require their own provisioned throughput settings (if using provisioned capacity mode), which adds to the overall cost.

### Cost Optimization Strategies:

- **Selective Attribute Projection**: Only project attributes you need to retrieve from queries to reduce storage costs
- **Use Sparse Indexes**: Create indexes that only contain a subset of items from the base table
- **Consider On-Demand Capacity**: For unpredictable workloads, on-demand capacity can be more cost-effective

## Recommended GSIs for Face Registration System

Based on the face registration system's data structure and likely query patterns, I recommend the following GSIs:

### 1. IpAddressIndex (Already Implemented)
- **Partition Key**: `ipAddress`
- **Sort Key**: `createdAt`
- **Purpose**: Find all registrations from a specific IP address, ordered by creation time
- **Use Cases**: Fraud detection, security analysis, identifying multiple registrations from the same location

### 2. CountryGenderIndex
- **Partition Key**: `country`
- **Sort Key**: `gender`
- **Purpose**: Analyze demographic distribution by country and gender
- **Use Cases**: Regional demographic analysis, targeted marketing campaigns, population distribution analysis

### 3. AgeRangeIndex
- **Partition Key**: `ageRangeLow` (Number)
- **Sort Key**: `userId`
- **Purpose**: Query users by age ranges for demographic analysis
- **Use Cases**: Age-targeted analysis, demographic segmentation

### 4. DeviceOsIndex
- **Partition Key**: `operatingSystem`
- **Sort Key**: `browser`
- **Purpose**: Analyze device and browser usage patterns
- **Use Cases**: Platform-specific experience optimization, browser compatibility planning

### 5. CreatedAtGlobalIndex
- **Partition Key**: A fixed value like "ALL_FACES"
- **Sort Key**: `createdAt`
- **Purpose**: Get all face registrations in chronological order regardless of user
- **Use Cases**: Time-series analysis, registration trend analysis, system usage patterns

## Implementation Strategy

I recommend implementing these GSIs in phases:

1. **Phase 1**: Start with IpAddressIndex (already done) and CreatedAtGlobalIndex for basic operational needs
2. **Phase 2**: Add CountryGenderIndex for initial demographic analysis
3. **Phase 3**: Add AgeRangeIndex and DeviceOsIndex as your analytics needs grow

## GSI Cost Management

To manage costs while maintaining query flexibility:

1. **Sparse Indexing**: For attributes that may not exist in all items, create GSIs that naturally only include relevant items
2. **Limited Projection**: Only project attributes you need in query results
3. **Monitor Usage**: Set up CloudWatch alerts to monitor GSI usage and costs
4. **Periodic Review**: Regularly review which GSIs are being used and their query patterns

## Code Example: Creating a GSI

```javascript
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB();

// Create a new GSI on an existing table
const params = {
  TableName: 'shmong-face-data',
  AttributeDefinitions: [
    { AttributeName: 'country', AttributeType: 'S' },
    { AttributeName: 'gender', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexUpdates: [
    {
      Create: {
        IndexName: 'CountryGenderIndex',
        KeySchema: [
          { AttributeName: 'country', KeyType: 'HASH' },  // Partition key
          { AttributeName: 'gender', KeyType: 'RANGE' }   // Sort key
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: ['userId', 'faceId', 'ageRangeLow', 'ageRangeHigh', 'city']
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    }
  ]
};

dynamoDB.updateTable(params, (err, data) => {
  if (err) console.error('Error creating GSI:', err);
  else console.log('Successfully created GSI:', data);
});
```

## Query Example Using a GSI

```javascript
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

// Example: Find all male users in the United States
const params = {
  TableName: 'shmong-face-data',
  IndexName: 'CountryGenderIndex',
  KeyConditionExpression: 'country = :country AND gender = :gender',
  ExpressionAttributeValues: {
    ':country': 'United States',
    ':gender': 'Male'
  }
};

docClient.query(params, (err, data) => {
  if (err) console.error('Error querying GSI:', err);
  else console.log('Query results:', data.Items);
});
``` 