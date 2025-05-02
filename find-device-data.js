// Script to find users with device data (which might contain IP addresses)
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function findUsersWithDeviceData(limit = 20) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the scan parameters to find records with deviceData field
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: 'attribute_exists(deviceData)',
    Limit: limit
  };
  
  try {
    console.log('Scanning for users with device data...');
    const command = new ScanCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} records with device data`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Display user IDs and device data for each record
      items.forEach((item, index) => {
        console.log(`\n${index + 1}. User: ${item.userId}`);
        
        // Parse and display device data
        if (item.deviceData) {
          try {
            const deviceData = typeof item.deviceData === 'string' 
              ? JSON.parse(item.deviceData) 
              : item.deviceData;
            
            console.log(`   Device Data:`);
            
            // Look specifically for IP address
            if (deviceData.ipAddress) {
              console.log(`   * IP Address: ${deviceData.ipAddress}`);
            }
            
            // Display other device fields
            if (deviceData.userAgent) console.log(`   * User Agent: ${deviceData.userAgent}`);
            if (deviceData.browser) console.log(`   * Browser: ${deviceData.browser}`);
            if (deviceData.platform) console.log(`   * Platform: ${deviceData.platform}`);
            if (deviceData.language) console.log(`   * Language: ${deviceData.language}`);
            if (deviceData.timezone) console.log(`   * Timezone: ${deviceData.timezone}`);
            if (deviceData.networkType) console.log(`   * Network Type: ${deviceData.networkType}`);
            
            // IP-based location
            if (deviceData.ipCountry) console.log(`   * Country (from IP): ${deviceData.ipCountry}`);
            if (deviceData.ipCity) console.log(`   * City (from IP): ${deviceData.ipCity}`);
            if (deviceData.ipLatitude) console.log(`   * Latitude (from IP): ${deviceData.ipLatitude}`);
            if (deviceData.ipLongitude) console.log(`   * Longitude (from IP): ${deviceData.ipLongitude}`);
          } catch (e) {
            console.log(`   Failed to parse device data: ${e.message}`);
            console.log(`   Raw device data: ${item.deviceData}`);
          }
        }
      });
      
      return items;
    } else {
      console.log('No records with device data found in the database');
      return [];
    }
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw error;
  }
}

// Scan for users with device data
findUsersWithDeviceData()
  .then(() => console.log('\nScan completed'))
  .catch(err => console.error('Scan failed:', err)); 