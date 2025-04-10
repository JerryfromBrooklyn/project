const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB();

const userIds = [
  { id: 'b428d4f8-70d1-70e7-564d-1e1dc029929b', name: 'Jerry' },
  { id: '247804a8-9091-7029-ef02-aebb0450ee43', name: 'Jason' },
  { id: '749824e8-b011-7008-69ba-fbd51a255bb9', name: 'Fred' }
];

async function getUserData(userId) {
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId }
    }
  };
  
  try {
    const result = await dynamodb.scan(params).promise();
    if (result.Items && result.Items.length > 0) {
      return result.Items[0]; // Take the first item
    }
    return null;
  } catch (err) {
    console.error(`Error getting data for user ${userId}:`, err);
    return null;
  }
}

async function main() {
  console.log('Checking number of matches for each user...');
  
  for (const user of userIds) {
    const userData = await getUserData(user.id);
    
    if (userData && userData.historicalMatches) {
      const matchCount = userData.historicalMatches.L.length;
      console.log(`User ${user.name} (${user.id}) has ${matchCount} historical matches`);
      
      // List the first 3 matches
      console.log('  First few matches:');
      for (let i = 0; i < Math.min(3, matchCount); i++) {
        const match = userData.historicalMatches.L[i];
        console.log(`    - ${match.M.id.S} (similarity: ${match.M.similarity.N}%)`);
      }
      
      // List all match IDs
      console.log('  All match IDs:');
      const matchIds = userData.historicalMatches.L.map(match => match.M.id.S);
      console.log(`    ${matchIds.join(', ')}`);
    } else {
      console.log(`User ${user.name} (${user.id}) has no historicalMatches data`);
    }
    console.log('---');
  }
}

main().catch(err => console.error('Error in main:', err)); 