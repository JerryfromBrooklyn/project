// Script to query user data from DynamoDB
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

async function queryUserData(email) {
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
      
      // Display the data in a readable format
      console.log(JSON.stringify(items, null, 2));
      
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

// Query for the specific email
queryUserData('clap@clap.com')
  .then(() => console.log('Query completed'))
  .catch(err => console.error('Query failed:', err)); 