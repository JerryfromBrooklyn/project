// Script to scan all user data from DynamoDB
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function scanAllUsers(limit = 10) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the scan parameters
  const params = {
    TableName: 'shmong-face-data',
    Limit: limit // Limit the number of results to avoid a large response
  };
  
  try {
    console.log('Scanning for all users (limited to', limit, 'records)');
    const command = new ScanCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} records in the database`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Display user IDs and face IDs for each record
      items.forEach((item, index) => {
        console.log(`${index + 1}. User ID: ${item.userId}, Face ID: ${item.faceId}`);
      });
      
      return items;
    } else {
      console.log('No records found in the database');
      return [];
    }
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw error;
  }
}

// Scan for all users in the database
scanAllUsers()
  .then(() => console.log('Scan completed'))
  .catch(err => console.error('Scan failed:', err)); 