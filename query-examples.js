/**
 * Example queries for the face registration database
 * 
 * This file contains sample code for querying the face registration data 
 * based on various attributes using both the base table and GSIs.
 */

const AWS = require('aws-sdk');

// Configure AWS SDK with your credentials
AWS.config.update({
  region: 'us-east-1'
});

const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * Get all face data for a specific user
 * @param {string} userId - The user ID to query
 */
async function getFaceDataForUser(userId) {
  const params = {
    TableName: 'shmong-face-data',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  try {
    const result = await docClient.query(params).promise();
    console.log(`Found ${result.Items.length} records for user ${userId}`);
    return result.Items;
  } catch (error) {
    console.error('Error querying by userId:', error);
    throw error;
  }
}

/**
 * Find all registrations from a specific IP address using GSI
 * @param {string} ipAddress - The IP address to query
 */
async function findRegistrationsByIp(ipAddress) {
  const params = {
    TableName: 'shmong-face-data',
    IndexName: 'IpAddressIndex',
    KeyConditionExpression: 'ipAddress = :ipAddress',
    ExpressionAttributeValues: {
      ':ipAddress': ipAddress
    }
  };

  try {
    const result = await docClient.query(params).promise();
    console.log(`Found ${result.Items.length} registrations from IP ${ipAddress}`);
    return result.Items;
  } catch (error) {
    console.error('Error querying by IP address:', error);
    throw error;
  }
}

/**
 * Find registrations by location (country and optional city)
 * Note: This uses a scan with filter and is not efficient for large datasets
 * This would be more efficient with a CountryCity GSI
 * @param {string} country - The country name
 * @param {string} city - Optional city name
 */
async function findRegistrationsByLocation(country, city = null) {
  let filterExpression = 'country = :country';
  let expressionAttributeValues = {
    ':country': country
  };

  if (city) {
    filterExpression += ' AND city = :city';
    expressionAttributeValues[':city'] = city;
  }

  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues
  };

  try {
    const result = await docClient.scan(params).promise();
    console.log(`Found ${result.Items.length} registrations from ${city ? city + ', ' : ''}${country}`);
    return result.Items;
  } catch (error) {
    console.error('Error querying by location:', error);
    throw error;
  }
}

/**
 * Find registrations by demographics (gender and age range)
 * Note: This uses a scan with filter and is not efficient for large datasets
 * @param {string} gender - The gender to filter by
 * @param {number} minAge - Minimum age in the range
 * @param {number} maxAge - Maximum age in the range
 */
async function findRegistrationsByDemographics(gender, minAge, maxAge) {
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: 'gender = :gender AND ageRangeLow >= :minAge AND ageRangeHigh <= :maxAge',
    ExpressionAttributeValues: {
      ':gender': gender,
      ':minAge': minAge,
      ':maxAge': maxAge
    }
  };

  try {
    const result = await docClient.scan(params).promise();
    console.log(`Found ${result.Items.length} ${gender} registrations between ages ${minAge}-${maxAge}`);
    return result.Items;
  } catch (error) {
    console.error('Error querying by demographics:', error);
    throw error;
  }
}

/**
 * Find registrations by device type (browser and OS)
 * Note: This uses a scan with filter and is not efficient for large datasets
 * @param {string} browser - The browser name
 * @param {string} os - The operating system
 */
async function findRegistrationsByDevice(browser, os) {
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: 'browser = :browser AND operatingSystem = :os',
    ExpressionAttributeValues: {
      ':browser': browser,
      ':os': os
    }
  };

  try {
    const result = await docClient.scan(params).promise();
    console.log(`Found ${result.Items.length} registrations from ${browser} on ${os}`);
    return result.Items;
  } catch (error) {
    console.error('Error querying by device:', error);
    throw error;
  }
}

/**
 * Find registrations within a time range
 * This would be more efficient with a CreatedAtGlobalIndex GSI
 * @param {string} startDate - ISO format date string for start date
 * @param {string} endDate - ISO format date string for end date
 */
async function findRegistrationsByTimeRange(startDate, endDate) {
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: 'createdAt BETWEEN :startDate AND :endDate',
    ExpressionAttributeValues: {
      ':startDate': startDate,
      ':endDate': endDate
    }
  };

  try {
    const result = await docClient.scan(params).promise();
    console.log(`Found ${result.Items.length} registrations between ${startDate} and ${endDate}`);
    return result.Items;
  } catch (error) {
    console.error('Error querying by time range:', error);
    throw error;
  }
}

/**
 * Advanced query: Find registrations matching multiple criteria
 * Demonstrates complex filtering capabilities
 */
async function findRegistrationsAdvanced(criteria) {
  let filterExpressions = [];
  let expressionAttributeValues = {};
  
  // Build dynamic filter expression based on provided criteria
  if (criteria.gender) {
    filterExpressions.push('gender = :gender');
    expressionAttributeValues[':gender'] = criteria.gender;
  }
  
  if (criteria.minAge && criteria.maxAge) {
    filterExpressions.push('ageRangeLow >= :minAge AND ageRangeHigh <= :maxAge');
    expressionAttributeValues[':minAge'] = criteria.minAge;
    expressionAttributeValues[':maxAge'] = criteria.maxAge;
  }
  
  if (criteria.country) {
    filterExpressions.push('country = :country');
    expressionAttributeValues[':country'] = criteria.country;
  }
  
  if (criteria.browser) {
    filterExpressions.push('browser = :browser');
    expressionAttributeValues[':browser'] = criteria.browser;
  }
  
  if (criteria.os) {
    filterExpressions.push('operatingSystem = :os');
    expressionAttributeValues[':os'] = criteria.os;
  }
  
  if (criteria.networkType) {
    filterExpressions.push('networkType = :networkType');
    expressionAttributeValues[':networkType'] = criteria.networkType;
  }
  
  // Join all expressions with AND
  const filterExpression = filterExpressions.join(' AND ');
  
  const params = {
    TableName: 'shmong-face-data',
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues
  };

  try {
    const result = await docClient.scan(params).promise();
    console.log(`Found ${result.Items.length} registrations matching advanced criteria`);
    return result.Items;
  } catch (error) {
    console.error('Error with advanced query:', error);
    throw error;
  }
}

/**
 * Extract demographic statistics from the database
 * This is an example of an analytics function
 */
async function getDemographicStatistics() {
  // Scan the entire table (not efficient for large datasets)
  const params = {
    TableName: 'shmong-face-data'
  };

  try {
    const result = await docClient.scan(params).promise();
    
    // Process results to extract demographic statistics
    const stats = {
      totalRegistrations: result.Items.length,
      genderDistribution: {},
      ageDistribution: {
        '0-17': 0,
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0, 
        '55+': 0
      },
      countryDistribution: {},
      browserDistribution: {},
      osDistribution: {}
    };
    
    // Calculate distributions
    result.Items.forEach(item => {
      // Gender distribution
      if (item.gender) {
        stats.genderDistribution[item.gender] = (stats.genderDistribution[item.gender] || 0) + 1;
      }
      
      // Age distribution
      if (item.ageRangeLow) {
        const avgAge = (parseInt(item.ageRangeLow) + parseInt(item.ageRangeHigh || item.ageRangeLow)) / 2;
        
        if (avgAge < 18) stats.ageDistribution['0-17']++;
        else if (avgAge < 25) stats.ageDistribution['18-24']++;
        else if (avgAge < 35) stats.ageDistribution['25-34']++;
        else if (avgAge < 45) stats.ageDistribution['35-44']++;
        else if (avgAge < 55) stats.ageDistribution['45-54']++;
        else stats.ageDistribution['55+']++;
      }
      
      // Country distribution
      if (item.country) {
        stats.countryDistribution[item.country] = (stats.countryDistribution[item.country] || 0) + 1;
      }
      
      // Browser distribution
      if (item.browser) {
        stats.browserDistribution[item.browser] = (stats.browserDistribution[item.browser] || 0) + 1;
      }
      
      // OS distribution
      if (item.operatingSystem) {
        stats.osDistribution[item.operatingSystem] = (stats.osDistribution[item.operatingSystem] || 0) + 1;
      }
    });
    
    console.log('Demographic statistics calculated successfully');
    return stats;
  } catch (error) {
    console.error('Error calculating demographic statistics:', error);
    throw error;
  }
}

// Example usage
async function runExamples() {
  try {
    // Example 1: Get face data for a specific user
    const userData = await getFaceDataForUser('test-user-123');
    console.log('User Face Data:', userData);
    
    // Example 2: Find registrations by IP
    const ipRegistrations = await findRegistrationsByIp('192.168.1.1');
    console.log('IP Registrations:', ipRegistrations.length);
    
    // Example 3: Find registrations by location
    const locationRegistrations = await findRegistrationsByLocation('United States', 'San Francisco');
    console.log('Location Registrations:', locationRegistrations.length);
    
    // Example 4: Find registrations by demographics
    const demographicRegistrations = await findRegistrationsByDemographics('Male', 25, 35);
    console.log('Demographic Registrations:', demographicRegistrations.length);
    
    // Example 5: Find registrations by device
    const deviceRegistrations = await findRegistrationsByDevice('Chrome', 'Mac OS');
    console.log('Device Registrations:', deviceRegistrations.length);
    
    // Example 6: Advanced query
    const advancedResults = await findRegistrationsAdvanced({
      gender: 'Male',
      minAge: 25,
      maxAge: 35,
      country: 'United States',
      browser: 'Chrome',
      networkType: '4G'
    });
    console.log('Advanced Query Results:', advancedResults.length);
    
    // Example 7: Get demographic statistics
    const stats = await getDemographicStatistics();
    console.log('Demographic Statistics:', JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples when this file is executed directly
if (require.main === module) {
  console.log('Running example queries...');
  runExamples();
}

// Export the functions for use in other modules
module.exports = {
  getFaceDataForUser,
  findRegistrationsByIp,
  findRegistrationsByLocation,
  findRegistrationsByDemographics,
  findRegistrationsByDevice,
  findRegistrationsByTimeRange,
  findRegistrationsAdvanced,
  getDemographicStatistics
}; 