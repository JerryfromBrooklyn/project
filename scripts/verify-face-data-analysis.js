#!/usr/bin/env node

/**
 * Verification script for AWS Face Data Analysis
 * 
 * This script checks if image analysis data is properly stored in DynamoDB
 * It queries the shmong-face-data table and verifies if the records contain
 * the expected image analysis data (labels, properties, etc.)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Table name
const TABLE_NAME = 'shmong-face-data';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper to print colored text
const print = {
  info: (text) => console.log(`${colors.blue}INFO:${colors.reset} ${text}`),
  success: (text) => console.log(`${colors.green}SUCCESS:${colors.reset} ${text}`),
  error: (text) => console.log(`${colors.red}ERROR:${colors.reset} ${text}`),
  warning: (text) => console.log(`${colors.yellow}WARNING:${colors.reset} ${text}`),
  highlight: (text) => console.log(`${colors.cyan}${text}${colors.reset}`),
  header: (text) => console.log(`\n${colors.magenta}==== ${text} ====${colors.reset}\n`)
};

/**
 * Scan the table for records with image analysis data
 */
async function scanForRecordsWithImageAnalysis() {
  print.header('SCANNING FOR FACE RECORDS WITH IMAGE ANALYSIS DATA');
  print.info('Scanning shmong-face-data table for records with image analysis data...');

  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'attribute_exists(imageAnalysis) OR attribute_exists(imageLabels) OR attribute_exists(imageProperties)',
      Limit: 20 // Limit to 20 records for initial check
    });

    const response = await docClient.send(command);
    
    if (response.Items && response.Items.length > 0) {
      print.success(`Found ${response.Items.length} records with image analysis data.`);
      
      // Group by fields present
      const withAnalysis = response.Items.filter(item => item.imageAnalysis);
      const withLabels = response.Items.filter(item => item.imageLabels);
      const withProperties = response.Items.filter(item => item.imageProperties);
      const withDominantColors = response.Items.filter(item => item.dominantColors);
      
      print.info(`Records with imageAnalysis: ${withAnalysis.length}`);
      print.info(`Records with imageLabels: ${withLabels.length}`);
      print.info(`Records with imageProperties: ${withProperties.length}`);
      print.info(`Records with dominantColors: ${withDominantColors.length}`);
      
      // Return the first 5 records for detailed analysis
      return response.Items.slice(0, 5);
    } else {
      print.warning('No records found with image analysis data.');
      return [];
    }
  } catch (error) {
    print.error(`Error scanning table: ${error.message}`);
    return [];
  }
}

/**
 * Analyze a specific user's records
 */
async function analyzeUserRecords(userId) {
  print.header(`ANALYZING RECORDS FOR USER: ${userId}`);
  print.info(`Querying shmong-face-data table for user ID: ${userId}...`);

  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const response = await docClient.send(command);
    
    if (response.Items && response.Items.length > 0) {
      print.success(`Found ${response.Items.length} records for user ${userId}.`);
      
      // Check each record for image analysis data
      let recordsWithAnalysis = 0;
      
      for (const item of response.Items) {
        if (item.imageAnalysis || item.imageLabels || item.imageProperties) {
          recordsWithAnalysis++;
        }
      }
      
      print.info(`Records with image analysis data: ${recordsWithAnalysis} / ${response.Items.length}`);
      
      if (recordsWithAnalysis > 0) {
        // Return the first record with analysis data
        return response.Items.find(item => item.imageAnalysis || item.imageLabels || item.imageProperties);
      } else {
        print.warning(`No records with image analysis data found for user ${userId}.`);
        return null;
      }
    } else {
      print.warning(`No records found for user ${userId}.`);
      return null;
    }
  } catch (error) {
    print.error(`Error querying table: ${error.message}`);
    return null;
  }
}

/**
 * Check record details
 */
function checkRecordDetails(record) {
  print.header('CHECKING RECORD DETAILS');
  
  if (!record) {
    print.error('No record provided for analysis.');
    return;
  }
  
  print.info(`Record ID: ${record.userId}/${record.faceId}`);
  print.info(`Created at: ${record.createdAt}`);
  
  // Check for image URLs
  if (record.imageUrl) {
    print.success(`Image URL: ${record.imageUrl}`);
  } else {
    print.warning('No image URL found in record.');
  }
  
  // Check for video URLs
  if (record.videoUrl) {
    print.success(`Video URL: ${record.videoUrl}`);
  } else {
    print.warning('No video URL found in record.');
  }
  
  // Check for location data
  if (record.locationData) {
    try {
      const locationData = typeof record.locationData === 'string' 
        ? JSON.parse(record.locationData) 
        : record.locationData;
      
      print.success(`Location data: ${locationData.address || 'No address'}`);
      print.info(`Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
    } catch (error) {
      print.error(`Error parsing location data: ${error.message}`);
    }
  } else {
    print.warning('No location data found in record.');
  }
  
  // Check for image labels
  if (record.imageLabels) {
    try {
      const labels = typeof record.imageLabels === 'string'
        ? JSON.parse(record.imageLabels)
        : record.imageLabels;
      
      print.success(`Image labels: ${labels.length} labels found`);
      
      // Print top 5 labels
      if (labels.length > 0) {
        print.highlight('Top labels:');
        labels.slice(0, 5).forEach(label => {
          console.log(`  - ${label.Name} (${label.Confidence.toFixed(2)}%)`);
        });
      }
    } catch (error) {
      print.error(`Error parsing image labels: ${error.message}`);
    }
  } else {
    print.warning('No image labels found in record.');
  }
  
  // Check for top labels summary
  if (record.topLabels) {
    try {
      const topLabels = typeof record.topLabels === 'string'
        ? JSON.parse(record.topLabels)
        : record.topLabels;
      
      print.success(`Top labels summary: ${topLabels.join(', ')}`);
    } catch (error) {
      print.error(`Error parsing top labels: ${error.message}`);
    }
  }
  
  // Check for image properties
  if (record.imageProperties) {
    try {
      const properties = typeof record.imageProperties === 'string'
        ? JSON.parse(record.imageProperties)
        : record.imageProperties;
      
      print.success('Image properties found');
      
      // Check for quality metrics
      if (properties.Quality) {
        const quality = properties.Quality;
        print.highlight('Image quality:');
        console.log(`  - Sharpness: ${quality.Sharpness?.toFixed(2)}`);
        console.log(`  - Brightness: ${quality.Brightness?.toFixed(2)}`);
        console.log(`  - Contrast: ${quality.Contrast?.toFixed(2)}`);
      }
      
      // Check for dominant colors
      if (properties.DominantColors && properties.DominantColors.length > 0) {
        print.highlight('Dominant colors:');
        properties.DominantColors.slice(0, 3).forEach(color => {
          console.log(`  - ${color.HexCode} (${color.SimplifiedColor || 'Unknown'}, ${color.PixelPercent?.toFixed(2)}%)`);
        });
      }
    } catch (error) {
      print.error(`Error parsing image properties: ${error.message}`);
    }
  } else {
    print.warning('No image properties found in record.');
  }
  
  // Check for image quality summary
  if (record.imageQuality) {
    try {
      const quality = typeof record.imageQuality === 'string'
        ? JSON.parse(record.imageQuality)
        : record.imageQuality;
      
      print.success(`Image quality summary: Sharpness=${quality.sharpness?.toFixed(2)}, Brightness=${quality.brightness?.toFixed(2)}, Contrast=${quality.contrast?.toFixed(2)}`);
    } catch (error) {
      print.error(`Error parsing image quality: ${error.message}`);
    }
  }
  
  // Check for dominant colors summary
  if (record.dominantColors) {
    try {
      const colors = typeof record.dominantColors === 'string'
        ? JSON.parse(record.dominantColors)
        : record.dominantColors;
      
      print.success(`Dominant colors summary: ${colors.join(', ')}`);
    } catch (error) {
      print.error(`Error parsing dominant colors: ${error.message}`);
    }
  }
}

/**
 * Generate report
 */
function generateReport(records) {
  print.header('VERIFICATION REPORT');
  
  if (!records || records.length === 0) {
    print.warning('No records to analyze. Report cannot be generated.');
    return;
  }
  
  const withAnalysis = records.filter(item => item.imageAnalysis);
  const withLabels = records.filter(item => item.imageLabels);
  const withProperties = records.filter(item => item.imageProperties);
  const withDominantColors = records.filter(item => item.dominantColors);
  const withTopLabels = records.filter(item => item.topLabels);
  const withQuality = records.filter(item => item.imageQuality);
  
  const total = records.length;
  
  print.highlight('Summary:');
  console.log(`  - Total records analyzed: ${total}`);
  console.log(`  - Records with complete analysis: ${withAnalysis.length} (${(withAnalysis.length / total * 100).toFixed(1)}%)`);
  console.log(`  - Records with labels: ${withLabels.length} (${(withLabels.length / total * 100).toFixed(1)}%)`);
  console.log(`  - Records with properties: ${withProperties.length} (${(withProperties.length / total * 100).toFixed(1)}%)`);
  console.log(`  - Records with dominant colors: ${withDominantColors.length} (${(withDominantColors.length / total * 100).toFixed(1)}%)`);
  console.log(`  - Records with top labels: ${withTopLabels.length} (${(withTopLabels.length / total * 100).toFixed(1)}%)`);
  console.log(`  - Records with quality metrics: ${withQuality.length} (${(withQuality.length / total * 100).toFixed(1)}%)`);
  
  // Overall status
  if (withAnalysis.length > 0) {
    print.success('Verification: PASSED - Image analysis data is stored correctly');
  } else if (withLabels.length > 0 || withProperties.length > 0) {
    print.success('Verification: PASSED - Some image analysis data is stored');
  } else {
    print.error('Verification: FAILED - No image analysis data found');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('AWS Face Data Analysis Verification Script');
  console.log('=========================================');
  
  // Get user ID from command line arguments
  const args = process.argv.slice(2);
  let userId = null;
  
  if (args.length > 0 && args[0].startsWith('--user=')) {
    userId = args[0].split('=')[1];
  }
  
  // Run verification
  let recordsToAnalyze = [];
  
  if (userId) {
    print.info(`Verifying records for specific user: ${userId}`);
    const userRecord = await analyzeUserRecords(userId);
    
    if (userRecord) {
      checkRecordDetails(userRecord);
      recordsToAnalyze = [userRecord];
    }
  } else {
    print.info('Verifying all records with image analysis data');
    recordsToAnalyze = await scanForRecordsWithImageAnalysis();
    
    if (recordsToAnalyze.length > 0) {
      // Check details of first record
      checkRecordDetails(recordsToAnalyze[0]);
    }
  }
  
  // Generate report
  generateReport(recordsToAnalyze);
}

// Run the script
main().catch(error => {
  print.error(`Script execution failed: ${error.message}`);
  console.error(error);
  process.exit(1);
}); 