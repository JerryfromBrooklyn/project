// Script to scan for recent registrations and check IP address data
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function scanRecentRegistrations(limit = 100) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the scan parameters with no limit
  const params = {
    TableName: 'shmong-face-data'
  };
  
  try {
    console.log(`Scanning all registration records...`);
    const command = new ScanCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} registration records`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Sort by createdAt timestamp, most recent first
      items.sort((a, b) => {
        const dateA = new Date(a.createdAt || '1970-01-01');
        const dateB = new Date(b.createdAt || '1970-01-01');
        return dateB - dateA;
      });
      
      // Filter to find the test record we just created
      const testRecords = items.filter(item => item.userId && item.userId.startsWith('test-ip-'));
      
      if (testRecords.length > 0) {
        console.log(`\nFound ${testRecords.length} test records with IP address information:`);
        
        testRecords.forEach((item, index) => {
          console.log(`\n${index + 1}. Test User: ${item.userId}`);
          console.log(`   Created: ${item.createdAt}`);
          
          if (item.ipAddress) {
            console.log(`   IP Address: ${item.ipAddress}`);
          }
          
          if (item.deviceData) {
            try {
              const deviceData = typeof item.deviceData === 'string' 
                ? JSON.parse(item.deviceData) 
                : item.deviceData;
              
              if (deviceData.ipAddress) {
                console.log(`   IP Address (from deviceData): ${deviceData.ipAddress}`);
              }
              
              // Display other device fields
              Object.keys(deviceData).forEach(key => {
                if (key !== 'ipAddress') { // Already displayed above
                  console.log(`   ${key}: ${deviceData[key]}`);
                }
              });
            } catch (e) {
              console.log(`   Error parsing deviceData: ${e.message}`);
            }
          }
        });
      } else {
        console.log(`\nNo test records found with 'test-ip-' in the user ID.`);
      }
      
      // Count IP addresses found in regular registrations
      let ipCount = 0;
      const regularRecords = items.filter(item => !item.userId || !item.userId.startsWith('test-ip-'));
      
      console.log(`\nChecking ${regularRecords.length} regular registration records for IP addresses:`);
      
      regularRecords.forEach(item => {
        let hasIpAddress = false;
        
        if (item.ipAddress) {
          hasIpAddress = true;
          ipCount++;
        }
        
        if (item.deviceData) {
          try {
            const deviceData = typeof item.deviceData === 'string' 
              ? JSON.parse(item.deviceData) 
              : item.deviceData;
            
            if (deviceData.ipAddress && !hasIpAddress) {
              hasIpAddress = true;
              ipCount++;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
      
      console.log(`\nSummary: Found ${ipCount} out of ${regularRecords.length} regular records with IP address information.`);
      
      return items;
    } else {
      console.log('No registration records found');
      return [];
    }
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw error;
  }
}

// Scan for all registrations
scanRecentRegistrations()
  .then(() => console.log('\nScan completed'))
  .catch(err => console.error('Scan failed:', err)); 