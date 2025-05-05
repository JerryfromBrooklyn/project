#!/usr/bin/env node

// Script to create a Global Secondary Index on matched_users in the shmong-photos table
// This enables faster querying for matched photos without performing full table scans

const { DynamoDBClient, UpdateTableCommand } = require('@aws-sdk/client-dynamodb');

// Configuration - should match your app's environment settings
const REGION = process.env.AWS_REGION || 'us-east-1';
const PHOTOS_TABLE = 'shmong-photos';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: REGION });

async function createMatchedUsersIndex() {
    console.log(`Creating Global Secondary Index for '${PHOTOS_TABLE}' table...`);
    
    try {
        const params = {
            TableName: PHOTOS_TABLE,
            AttributeDefinitions: [
                {
                    AttributeName: 'user_id',
                    AttributeType: 'S'
                }
            ],
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: 'MatchedUsersIndex',
                        KeySchema: [
                            {
                                AttributeName: 'user_id',
                                KeyType: 'HASH'
                            }
                        ],
                        Projection: {
                            ProjectionType: 'ALL'
                        }
                    }
                }
            ]
        };
        
        console.log('Sending UpdateTable command with the following parameters:');
        console.log(JSON.stringify(params, null, 2));
        
        const command = new UpdateTableCommand(params);
        const result = await dynamoClient.send(command);
        
        console.log('GSI creation initiated successfully!');
        console.log('IndexStatus:', result.TableDescription?.GlobalSecondaryIndexes?.[0]?.IndexStatus);
        console.log('Note: The index may take several minutes to become active.');
        console.log('You can monitor the status in the AWS Console.');
        
        return result;
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log('The table is being modified. Please wait and try again later.');
        } else if (error.name === 'ValidationException' && error.message.includes('already exists')) {
            console.log('The index "MatchedUsersIndex" already exists on this table.');
        } else {
            console.error('Error creating GSI:', error);
        }
        process.exit(1);
    }
}

// Add a command to also create a GSI for historical matches if needed
async function createHistoricalMatchesIndex() {
    console.log(`Creating Historical Matches Index for '${PHOTOS_TABLE}' table...`);
    
    try {
        const params = {
            TableName: PHOTOS_TABLE,
            AttributeDefinitions: [
                {
                    AttributeName: 'id',
                    AttributeType: 'S'
                }
            ],
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: 'HistoricalMatchesIndex',
                        KeySchema: [
                            {
                                AttributeName: 'id',
                                KeyType: 'HASH'
                            }
                        ],
                        Projection: {
                            ProjectionType: 'ALL'
                        }
                    }
                }
            ]
        };
        
        const command = new UpdateTableCommand(params);
        const result = await dynamoClient.send(command);
        
        console.log('Historical Matches GSI creation initiated successfully!');
        return result;
    } catch (error) {
        if (error.name === 'ValidationException' && error.message.includes('already exists')) {
            console.log('The index "HistoricalMatchesIndex" already exists on this table.');
        } else {
            console.error('Error creating Historical Matches GSI:', error);
        }
    }
}

// Run both functions
async function run() {
    await createMatchedUsersIndex();
    await createHistoricalMatchesIndex();
    console.log('Script completed!');
}

run().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
}); 