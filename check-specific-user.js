// Script to query data for a specific user ID
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function checkSpecificUser(userId) {
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
    console.log(`Querying for specific user ID: ${userId}`);
    const command = new QueryCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} records for user ${userId}`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Check each record for IP address
      items.forEach((item, index) => {
        console.log(`\nRecord #${index + 1}:`);
        console.log(`Face ID: ${item.faceId || 'Unknown'}`);
        console.log(`Created At: ${item.createdAt || 'Unknown'}`);
        console.log(`Updated At: ${item.updatedAt || 'Unknown'}`);
        
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
            console.log('\nDevice Data:');
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
        
        // Check for location data
        if (item.locationData) {
          try {
            const locationData = typeof item.locationData === 'string'
              ? JSON.parse(item.locationData)
              : item.locationData;
            
            console.log('\nLocation Data:');
            if (locationData.latitude && locationData.longitude) {
              console.log(`  Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
            }
            if (locationData.address) {
              console.log(`  Address: ${locationData.address}`);
            }
          } catch (e) {
            console.log(`❌ Error parsing locationData: ${e.message}`);
          }
        } else {
          console.log(`❌ No locationData field found`);
        }
        
        // Display media URLs if available
        if (item.imageUrl) {
          console.log(`\nImage URL: ${item.imageUrl}`);
        }
        
        if (item.videoUrl) {
          console.log(`Video URL: ${item.videoUrl}`);
        }
      });
      
      return items;
    } else {
      console.log(`No records found for user ${userId}`);
      return [];
    }
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    throw error;
  }
}

// Check the specific user ID
checkSpecificUser('a49844e8-c051-7095-17be-15da61b05d85')
  .then(() => console.log('\nQuery completed'))
  .catch(err => console.error('Query failed:', err)); 