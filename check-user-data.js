// Script to check user data in the database
const AWS = require('aws-sdk');

// Configure AWS with the region
AWS.config.update({
  region: 'us-east-1' // Adjust this to your actual AWS region
});

const docClient = new AWS.DynamoDB.DocumentClient();

// The user ID we want to check
const userId = 'd4881428-c021-70b6-015c-f08cb9e4e8b9';

// Function to query the database
async function getUserData(userId) {
  const params = {
    TableName: 'users',
    Key: {
      id: userId
    }
  };

  try {
    const data = await docClient.get(params).promise();
    if (!data.Item) {
      console.log(`No user found with ID: ${userId}`);
      return;
    }

    console.log('User data found:');
    console.log(`User ID: ${data.Item.id}`);
    console.log(`Name: ${data.Item.name || 'N/A'}`);
    
    // Check if user has face data
    if (data.Item.faces && data.Item.faces.length > 0) {
      console.log('\n--- Face Registration Data ---');
      const faceData = data.Item.faces[0]; // Get the first face registration
      
      console.log(`Registration Date: ${faceData.createdAt || 'N/A'}`);
      console.log(`Face ID: ${faceData.faceId || 'N/A'}`);
      
      // Check for location data
      if (faceData.locationData) {
        console.log('\n--- Location Data ---');
        console.log(`Coordinates: ${faceData.locationData.latitude}, ${faceData.locationData.longitude}`);
        console.log(`Address: ${faceData.locationData.address || 'N/A'}`);
        console.log(`Source: ${faceData.locationData.source || 'direct'}`);
        
        // Check for detailed address components
        if (faceData.locationData.addressDetails) {
          console.log('\n--- Address Details ---');
          const details = faceData.locationData.addressDetails;
          console.log(JSON.stringify(details, null, 2));
        }
      } else {
        console.log('\nNo location data found');
      }
      
      // Check for device data and IP address
      if (faceData.deviceData) {
        console.log('\n--- Device Data ---');
        console.log(`IP Address: ${faceData.deviceData.ipAddress || 'N/A'}`);
        console.log(`Browser: ${faceData.deviceData.userAgent || 'N/A'}`);
        
        // Check for IP-based location
        if (faceData.deviceData.ipCity || faceData.deviceData.ipCountry) {
          console.log('\n--- IP-Based Location ---');
          console.log(`City: ${faceData.deviceData.ipCity || 'N/A'}`);
          console.log(`Region: ${faceData.deviceData.ipRegion || 'N/A'}`);
          console.log(`Country: ${faceData.deviceData.ipCountry || 'N/A'}`);
          console.log(`Coordinates: ${faceData.deviceData.ipLatitude || 'N/A'}, ${faceData.deviceData.ipLongitude || 'N/A'}`);
        }
      } else {
        console.log('\nNo device data found');
      }
      
      // Check for video data
      if (faceData.videoUrl) {
        console.log('\n--- Video Data ---');
        console.log(`Video URL: ${faceData.videoUrl}`);
      }
      
      // Check for image data
      if (faceData.imageUrl) {
        console.log('\n--- Image Data ---');
        console.log(`Image URL: ${faceData.imageUrl}`);
      }
    } else {
      console.log('No face registration data found for this user');
    }
    
  } catch (error) {
    console.error('Error retrieving data:', error);
  }
}

// Execute the function
getUserData(userId); 