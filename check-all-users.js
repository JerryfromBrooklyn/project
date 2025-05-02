// Script to scan all users and find any records related to A@b.com
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function scanAndFindUser(email) {
  // Initialize the DynamoDB client
  const client = new DynamoDBClient({ region: 'us-east-1' });
  
  // Set up the scan parameters - no limit to check all records
  const params = {
    TableName: 'shmong-face-data'
  };
  
  try {
    console.log(`Scanning all records to find any related to: ${email}`);
    const command = new ScanCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} total records in the database`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Sort by creation date (newest first)
      items.sort((a, b) => {
        const dateA = new Date(a.createdAt || '1970-01-01');
        const dateB = new Date(b.createdAt || '1970-01-01');
        return dateB - dateA;
      });
      
      // Find recent registrations (last 10)
      console.log("\n=== MOST RECENT REGISTRATIONS ===");
      items.slice(0, 10).forEach((item, index) => {
        console.log(`\n${index + 1}. User: ${item.userId || 'Unknown'}`);
        console.log(`   Created: ${item.createdAt || 'Unknown'}`);
        
        // Check for IP address
        if (item.ipAddress) {
          console.log(`   IP Address: ${item.ipAddress}`);
        }
        
        // Check if deviceData has IP address
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
      
      // Look for any users that might be related to the target email
      console.log("\n=== SEARCHING FOR EMAIL MATCH ===");
      
      // Look for exact match first
      const exactMatches = items.filter(item => 
        item.userId === email || 
        (item.email && item.email === email)
      );
      
      if (exactMatches.length > 0) {
        console.log(`Found ${exactMatches.length} exact matches for ${email}`);
        processMatchedUsers(exactMatches);
      } else {
        console.log(`No exact matches found for ${email}`);
      }
      
      // Look for partial matches (user ID might contain the email in a different format)
      const emailParts = email.split('@');
      const partialMatches = items.filter(item => {
        // Skip exact matches we already processed
        if (exactMatches.some(match => match.userId === item.userId)) {
          return false;
        }
        
        // Check if userId contains parts of the email
        const userId = item.userId || '';
        return emailParts.some(part => 
          part.length > 2 && userId.toLowerCase().includes(part.toLowerCase())
        );
      });
      
      if (partialMatches.length > 0) {
        console.log(`\nFound ${partialMatches.length} possible partial matches that might be related to ${email}`);
        processMatchedUsers(partialMatches);
      } else {
        console.log(`\nNo partial matches found that might be related to ${email}`);
      }
      
      // Look for any records created in the last hour (recent registrations)
      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);
      
      const recentRegistrations = items.filter(item => {
        const createdAt = new Date(item.createdAt || '1970-01-01');
        return createdAt > lastHour;
      });
      
      if (recentRegistrations.length > 0) {
        console.log(`\n=== REGISTRATIONS IN THE LAST HOUR ===`);
        console.log(`Found ${recentRegistrations.length} registrations in the last hour:`);
        
        recentRegistrations.forEach((item, index) => {
          console.log(`\n${index + 1}. User: ${item.userId || 'Unknown'}`);
          console.log(`   Created: ${item.createdAt || 'Unknown'}`);
          
          // Check for IP address
          if (item.ipAddress) {
            console.log(`   IP Address: ${item.ipAddress}`);
          }
          
          // Check if deviceData has IP address
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
      } else {
        console.log(`\nNo registrations found in the last hour`);
      }
      
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

function processMatchedUsers(users) {
  users.forEach((user, index) => {
    console.log(`\nMatch #${index + 1}:`);
    console.log(`User ID: ${user.userId || 'Unknown'}`);
    console.log(`Created: ${user.createdAt || 'Unknown'}`);
    
    // Check for direct IP address field
    if (user.ipAddress) {
      console.log(`✅ IP Address stored directly: ${user.ipAddress}`);
    } else {
      console.log(`❌ No direct IP address field found`);
    }
    
    // Check for IP address in deviceData
    if (user.deviceData) {
      try {
        const deviceData = typeof user.deviceData === 'string' 
          ? JSON.parse(user.deviceData) 
          : user.deviceData;
        
        if (deviceData.ipAddress) {
          console.log(`✅ IP Address stored in deviceData: ${deviceData.ipAddress}`);
        } else {
          console.log(`❌ No IP address found in deviceData`);
        }
        
        // Show other device information
        console.log('Other device data:');
        Object.keys(deviceData).forEach(key => {
          if (key !== 'ipAddress' && typeof deviceData[key] !== 'object') {
            console.log(`  ${key}: ${deviceData[key]}`);
          }
        });
      } catch (e) {
        console.log(`Error parsing deviceData: ${e.message}`);
      }
    } else {
      console.log(`❌ No deviceData field found`);
    }
  });
}

// Scan the database to find any records related to A@b.com
scanAndFindUser('A@b.com')
  .then(() => console.log('\nScan completed'))
  .catch(err => console.error('Scan failed:', err)); 