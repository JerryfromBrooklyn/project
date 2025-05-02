// Script to test IP address collection and storage to DynamoDB
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const fetch = require('node-fetch');

async function getIPAddress() {
  try {
    // Try ipify.org first
    console.log('Attempting to get IP address from ipify.org...');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log(`✏️ IP address captured: ${data.ip}`);
    return data.ip;
  } catch (error) {
    console.error('Error getting IP from ipify:', error);
    
    try {
      // Try ipapi.co as fallback
      console.log('Attempting to get IP address from ipapi.co...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      console.log(`✏️ IP address captured (fallback): ${data.ip}`);
      return data.ip;
    } catch (fallbackError) {
      console.error('Error getting IP from fallback source:', fallbackError);
      return null;
    }
  }
}

async function storeTestRecord() {
  const ipAddress = await getIPAddress();
  
  if (!ipAddress) {
    console.error('Failed to retrieve IP address');
    return;
  }
  
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Create a test user ID
  const userId = `test-ip-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  // Prepare the DynamoDB item
  const item = {
    userId: { S: userId },
    faceId: { S: 'test-face-id' },
    createdAt: { S: timestamp },
    updatedAt: { S: timestamp },
    ipAddress: { S: ipAddress },
    deviceData: { S: JSON.stringify({
      ipAddress: ipAddress,
      userAgent: 'Test User Agent',
      language: 'en-US',
      platform: 'Test Platform',
      timezone: 'America/New_York'
    })}
  };
  
  // Store in DynamoDB
  const params = {
    TableName: 'shmong-face-data',
    Item: item
  };
  
  try {
    console.log('Storing test record in DynamoDB with IP address...');
    await client.send(new PutItemCommand(params));
    console.log('✅ Successfully stored test record with IP address');
    console.log(`User ID: ${userId}`);
    console.log(`IP Address: ${ipAddress}`);
  } catch (error) {
    console.error('Error storing test record:', error);
  }
}

// Run the test
storeTestRecord()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 