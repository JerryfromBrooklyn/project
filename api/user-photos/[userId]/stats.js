// API endpoint to get user photo match statistics
// GET /api/user-photos/[userId]/stats

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Configuration
const USER_PHOTOS_TABLE = 'shmong-user-photos';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache to reduce DB queries
const statsCache = new Map();

/**
 * API handler to get a user's photo match statistics
 */
module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId' });
  }
  
  try {
    // Check cache first
    const cacheKey = `stats-${userId}`;
    const now = Date.now();
    const cachedData = statsCache.get(cacheKey);
    
    if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
      console.log(`Using cached stats for user ${userId}`);
      return res.status(200).json(cachedData.data);
    }
    
    // Get recent matches (added in last 24 hours)
    const recentMatchesParams = {
      TableName: USER_PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'matchTimestamp > :since',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':since': now - (24 * 60 * 60 * 1000) // 24 hours ago
      }
    };
    
    const recentMatches = await dynamoDB.query(recentMatchesParams).promise();
    
    // Get all matches count
    const allMatchesParams = {
      TableName: USER_PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const allMatches = await dynamoDB.query(allMatchesParams).promise();
    
    // Create stats object
    const stats = {
      userId,
      matchesAdded: recentMatches.Items.length,
      totalMatches: allMatches.Items.length,
      timestamp: now,
      photos: {
        recent: recentMatches.Items.map(item => ({
          photoId: item.photoId,
          matchTimestamp: item.matchTimestamp,
          confidence: item.confidence
        })),
        count: allMatches.Items.length
      }
    };
    
    // Update cache
    statsCache.set(cacheKey, {
      timestamp: now,
      data: stats
    });
    
    // Log statistics for monitoring
    console.log(`User ${userId} stats: ${stats.matchesAdded} new matches, ${stats.totalMatches} total matches`);
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error(`Error getting photo match stats for user ${userId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to retrieve photo match statistics',
      details: error.message
    });
  }
}; 