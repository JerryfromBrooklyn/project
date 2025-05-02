// Script to get detailed user data from DynamoDB
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

async function getUserDetails(userId) {
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
    console.log(`Getting details for user: ${userId}`);
    const command = new QueryCommand(params);
    const response = await client.send(command);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`Found ${response.Items.length} records for user ${userId}`);
      
      // Unmarshall the DynamoDB records to JavaScript objects
      const items = response.Items.map(item => unmarshall(item));
      
      // Display the most important information about the user
      const firstRecord = items[0];
      console.log('\n--- USER DETAILS ---');
      console.log(`User ID: ${firstRecord.userId}`);
      console.log(`Face ID: ${firstRecord.faceId}`);
      console.log(`Created At: ${firstRecord.createdAt}`);
      console.log(`Updated At: ${firstRecord.updatedAt || 'N/A'}`);
      
      // Display image and video URLs if available
      if (firstRecord.imageUrl) {
        console.log(`Image URL: ${firstRecord.imageUrl}`);
      }
      
      if (firstRecord.videoUrl) {
        console.log(`Video URL: ${firstRecord.videoUrl}`);
      }
      
      // Display location information if available
      if (firstRecord.latitude || firstRecord.longitude) {
        console.log(`\n--- LOCATION ---`);
        
        if (firstRecord.latitude) {
          console.log(`Latitude: ${firstRecord.latitude}`);
        }
        
        if (firstRecord.longitude) {
          console.log(`Longitude: ${firstRecord.longitude}`);
        }
        
        if (firstRecord.address) {
          console.log(`Address: ${firstRecord.address}`);
        }
        
        if (firstRecord.city) {
          console.log(`City: ${firstRecord.city}`);
        }
        
        if (firstRecord.country) {
          console.log(`Country: ${firstRecord.country}`);
        }
      }
      
      // Display device information if available
      if (firstRecord.browser || firstRecord.operatingSystem || firstRecord.ipAddress) {
        console.log(`\n--- DEVICE INFO ---`);
        
        if (firstRecord.browser) {
          console.log(`Browser: ${firstRecord.browser}`);
        }
        
        if (firstRecord.operatingSystem) {
          console.log(`OS: ${firstRecord.operatingSystem}`);
        }
        
        if (firstRecord.ipAddress) {
          console.log(`IP Address: ${firstRecord.ipAddress}`);
        }
        
        if (firstRecord.language) {
          console.log(`Language: ${firstRecord.language}`);
        }
        
        if (firstRecord.networkType) {
          console.log(`Network Type: ${firstRecord.networkType}`);
        }
        
        if (firstRecord.isp) {
          console.log(`ISP: ${firstRecord.isp}`);
        }
      }
      
      // Display demographics if available
      if (firstRecord.gender || firstRecord.ageRangeLow || firstRecord.ageRangeHigh || firstRecord.emotion) {
        console.log(`\n--- DEMOGRAPHICS ---`);
        
        if (firstRecord.gender) {
          console.log(`Gender: ${firstRecord.gender}`);
        }
        
        if (firstRecord.ageRangeLow !== undefined || firstRecord.ageRangeHigh !== undefined) {
          console.log(`Age Range: ${firstRecord.ageRangeLow || '?'}-${firstRecord.ageRangeHigh || '?'}`);
        }
        
        if (firstRecord.emotion) {
          console.log(`Emotion: ${firstRecord.emotion}`);
          
          if (firstRecord.emotionConfidence) {
            console.log(`Emotion Confidence: ${firstRecord.emotionConfidence}`);
          }
        }
      }
      
      // Also show any JSON data stored in columns
      console.log('\n--- JSON DATA ---');
      
      // Helper function to safely parse and display JSON data
      const displayJsonField = (record, fieldName, label) => {
        if (record[fieldName]) {
          try {
            const data = typeof record[fieldName] === 'string' 
              ? JSON.parse(record[fieldName]) 
              : record[fieldName];
            console.log(`${label}:`, JSON.stringify(data, null, 2));
          } catch (e) {
            console.log(`${label} (raw):`, record[fieldName]);
          }
        }
      };
      
      // Display all JSON fields
      displayJsonField(firstRecord, 'locationData', 'Location Data');
      displayJsonField(firstRecord, 'deviceData', 'Device Data');
      displayJsonField(firstRecord, 'faceAttributes', 'Face Attributes');
      displayJsonField(firstRecord, 'faceLandmarks', 'Face Landmarks');
      displayJsonField(firstRecord, 'historicalMatchesJson', 'Historical Matches');
      
      // Show video metadata if available
      if (firstRecord.videoResolution || firstRecord.videoDuration || firstRecord.videoFrameRate) {
        console.log('\n--- VIDEO METADATA ---');
        
        if (firstRecord.videoResolution) {
          console.log(`Resolution: ${firstRecord.videoResolution}`);
        }
        
        if (firstRecord.videoDuration) {
          console.log(`Duration: ${firstRecord.videoDuration} seconds`);
        }
        
        if (firstRecord.videoFrameRate) {
          console.log(`Frame Rate: ${firstRecord.videoFrameRate} fps`);
        }
      }
      
      return items;
    } else {
      console.log(`No records found for user ${userId}`);
      return [];
    }
  } catch (error) {
    console.error('Error getting user details:', error);
    throw error;
  }
}

// Try another user from our scan results with likely device data
getUserDetails('d4e8e4e8-40b1-7018-fd76-d9284884c8d3')
  .then(() => console.log('\nQuery completed'))
  .catch(err => console.error('Query failed:', err)); 