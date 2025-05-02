// Script to find users with IP address information
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function findUsersWithIPAddress(limit = 20) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the scan parameters to find records with ipAddress field
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: 'attribute_exists(ipAddress)',
    Limit: limit
  };
  
  try {
    console.log('Scanning for users with IP address information...');
    const command = new ScanCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} records with IP address information`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Display user IDs, face IDs, and IP addresses for each record
      items.forEach((item, index) => {
        console.log(`\n${index + 1}. User: ${item.userId}`);
        console.log(`   Face ID: ${item.faceId}`);
        console.log(`   IP Address: ${item.ipAddress || 'Not found in direct field'}`);
        
        // Also check if IP is in deviceData
        if (item.deviceData) {
          try {
            const deviceData = typeof item.deviceData === 'string' 
              ? JSON.parse(item.deviceData) 
              : item.deviceData;
            
            if (deviceData.ipAddress) {
              console.log(`   IP Address (from deviceData): ${deviceData.ipAddress}`);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
      
      return items;
    } else {
      console.log('No records with IP address information found in the database');
      return [];
    }
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw error;
  }
}

// Scan for users with IP address information
findUsersWithIPAddress()
  .then(() => console.log('\nScan completed'))
  .catch(err => console.error('Scan failed:', err)); 