// Script to verify the test IP address record
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function verifyTestRecord(userId) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the query parameters
  const params = {
    TableName: 'shmong-face-data',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId }
    }
  };
  
  try {
    console.log(`Querying for test record with user ID: ${userId}`);
    const command = new QueryCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} record(s) for user ID ${userId}`);
      
      // Unmarshall the DynamoDB record to a JavaScript object
      const item = unmarshall(response.Items[0]);
      
      console.log('\n--- TEST RECORD DETAILS ---');
      console.log(`User ID: ${item.userId}`);
      console.log(`Face ID: ${item.faceId}`);
      console.log(`Created At: ${item.createdAt}`);
      
      // Display IP address information
      if (item.ipAddress) {
        console.log(`\nIP Address (direct field): ${item.ipAddress}`);
      } else {
        console.log('\nNo direct ipAddress field found');
      }
      
      // Check for IP address in deviceData
      if (item.deviceData) {
        try {
          const deviceData = typeof item.deviceData === 'string' 
            ? JSON.parse(item.deviceData) 
            : item.deviceData;
          
          console.log('\nDevice Data:');
          if (deviceData.ipAddress) {
            console.log(`IP Address (from deviceData): ${deviceData.ipAddress}`);
          }
          
          // Display other device fields
          Object.keys(deviceData).forEach(key => {
            if (key !== 'ipAddress') { // Already displayed above
              console.log(`${key}: ${deviceData[key]}`);
            }
          });
        } catch (e) {
          console.log(`Error parsing deviceData: ${e.message}`);
        }
      } else {
        console.log('\nNo deviceData field found');
      }
      
      return item;
    } else {
      console.log(`No record found for user ID ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    throw error;
  }
}

// Get the user ID from command line arguments or use the one from our test
const testUserId = process.argv[2] || 'test-ip-1746173043203';

// Verify the test record
verifyTestRecord(testUserId)
  .then(() => console.log('\nVerification completed'))
  .catch(err => console.error('Verification failed:', err)); 