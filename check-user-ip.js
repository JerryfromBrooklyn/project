// Script to query user data for A@b.com and check if IP address was stored
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function checkUserIP(email) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the query parameters
  const params = {
    TableName: 'shmong-face-data',
    KeyConditionExpression: 'userId = :email',
    ExpressionAttributeValues: {
      ':email': { S: email }
    }
  };
  
  try {
    console.log(`Querying for user: ${email}`);
    const command = new QueryCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} records for ${email}`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Check each record for IP address
      items.forEach((item, index) => {
        console.log(`\nRecord #${index + 1}:`);
        console.log(`Created: ${item.createdAt}`);
        
        // Check for direct IP address field
        if (item.ipAddress) {
          console.log(`✅ IP Address stored directly: ${item.ipAddress}`);
        } else {
          console.log(`❌ No direct IP address field found`);
        }
        
        // Check for IP address in deviceData
        if (item.deviceData) {
          try {
            const deviceData = typeof item.deviceData === 'string' 
              ? JSON.parse(item.deviceData) 
              : item.deviceData;
            
            if (deviceData.ipAddress) {
              console.log(`✅ IP Address stored in deviceData: ${deviceData.ipAddress}`);
            } else {
              console.log(`❌ No IP address found in deviceData`);
            }
            
            // Show other device information
            console.log('\nOther device data:');
            Object.keys(deviceData).forEach(key => {
              if (key !== 'ipAddress' && typeof deviceData[key] !== 'object') {
                console.log(`  ${key}: ${deviceData[key]}`);
              }
            });
          } catch (e) {
            console.log(`❌ Error parsing deviceData: ${e.message}`);
          }
        } else {
          console.log(`❌ No deviceData field found`);
        }
      });
      
      return items;
    } else {
      console.log(`No records found for ${email}`);
      return [];
    }
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    throw error;
  }
}

// Check the user with email A@b.com
checkUserIP('A@b.com')
  .then(() => console.log('\nQuery completed'))
  .catch(err => console.error('Query failed:', err)); 