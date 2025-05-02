// Script to check user address information in the database
const AWS = require('aws-sdk');

// Configure AWS with the region
AWS.config.update({
  region: 'us-east-1' // Adjust this to your actual AWS region
});

const docClient = new AWS.DynamoDB.DocumentClient();

// The user ID we want to check
const userId = 'd4881428-c021-70b6-015c-f08cb9e4e8b9';

// Try both approaches - first with query, then with get if needed
async function getUserAddressData(userId) {
  console.log(`Checking address data for user: ${userId}`);
  
  // First try with query - if userId is the partition key
  try {
    const queryParams = {
      TableName: 'shmong-face-data',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    console.log('Trying query method first...');
    const queryData = await docClient.query(queryParams).promise();
    
    if (queryData.Items && queryData.Items.length > 0) {
      console.log(`Found ${queryData.Items.length} records using query method`);
      processItems(queryData.Items);
      return;
    } else {
      console.log('No results found using query method. Trying get method...');
    }
  } catch (queryError) {
    console.log('Query error:', queryError.message);
    console.log('Trying get method instead...');
  }
  
  // If query fails or returns no results, try with get - if userId is the primary key
  try {
    const getParams = {
      TableName: 'shmong-face-data',
      Key: {
        'userId': userId
      }
    };
    
    const getData = await docClient.get(getParams).promise();
    
    if (getData.Item) {
      console.log('Found record using get method');
      processItems([getData.Item]);
      return;
    } else {
      console.log('No results found using get method');
    }
  } catch (getError) {
    console.log('Get error:', getError.message);
  }
  
  // Try the users table next
  try {
    const usersParams = {
      TableName: 'users',
      Key: {
        'id': userId
      }
    };
    
    console.log('Trying in users table...');
    const userData = await docClient.get(usersParams).promise();
    
    if (userData.Item) {
      console.log('Found user record in users table');
      
      // Check if there's face data
      if (userData.Item.faces && userData.Item.faces.length > 0) {
        console.log(`Found ${userData.Item.faces.length} face records`);
        processItems(userData.Item.faces);
      } else {
        console.log('No face data found in user record');
      }
    } else {
      console.log('User not found in users table');
    }
  } catch (userError) {
    console.log('Users table error:', userError.message);
  }
  
  console.log('Could not find user data in any of the expected tables');
}

// Helper function to process items consistently
function processItems(items) {
  items.forEach((item, index) => {
    console.log(`\n--- Record ${index + 1} ---`);
    
    // Check for location data
    if (item.locationData) {
      let locationData;
      
      // Location data might be stored as a string JSON or as an object
      if (typeof item.locationData === 'string') {
        try {
          locationData = JSON.parse(item.locationData);
        } catch (e) {
          console.log('Error parsing locationData string:', e);
          locationData = { raw: item.locationData };
        }
      } else {
        locationData = item.locationData;
      }
      
      console.log('\n--- Location Data ---');
      console.log(`Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
      console.log(`Address: ${locationData.address || 'N/A'}`);
      console.log(`Source: ${locationData.source || 'direct'}`);
      
      // Check for detailed address components
      if (locationData.addressDetails) {
        console.log('\n--- Address Details ---');
        console.log(JSON.stringify(locationData.addressDetails, null, 2));
      }
    } else {
      console.log('\nNo direct locationData field found');
    }
    
    // Also check inside deviceData for location info
    if (item.deviceData) {
      let deviceData;
      
      // Device data might be stored as a string JSON or as an object
      if (typeof item.deviceData === 'string') {
        try {
          deviceData = JSON.parse(item.deviceData);
        } catch (e) {
          console.log('Error parsing deviceData string:', e);
          deviceData = { raw: item.deviceData };
        }
      } else {
        deviceData = item.deviceData;
      }
      
      console.log('\n--- Device Data ---');
      console.log(`IP Address: ${deviceData.ipAddress || 'N/A'}`);
      
      // Check for IP-based location
      if (deviceData.ipCity || deviceData.ipCountry) {
        console.log('\n--- IP-Based Location ---');
        console.log(`City: ${deviceData.ipCity || 'N/A'}`);
        console.log(`Region: ${deviceData.ipRegion || 'N/A'}`);
        console.log(`Country: ${deviceData.ipCountry || 'N/A'}`);
        console.log(`Coordinates: ${deviceData.ipLatitude || 'N/A'}, ${deviceData.ipLongitude || 'N/A'}`);
      }
      
      // Check for address in deviceData
      if (deviceData.locationData) {
        console.log('\n--- Location Data in deviceData ---');
        console.log(JSON.stringify(deviceData.locationData, null, 2));
      }
    } else {
      console.log('\nNo deviceData field found');
    }
  });
}

// Execute the function
getUserAddressData(userId); 