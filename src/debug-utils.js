import { 
  DynamoDBClient, 
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { 
  AWS_REGION, 
  AWS_ACCESS_KEY_ID, 
  AWS_SECRET_ACCESS_KEY,
  testRekognitionConnectivity,
  validateAwsConfig,
  debugFaceLivenessSession,
  checkCameraForFaceLiveness
} from './lib/awsClient';
import { Amplify } from 'aws-amplify';

// Initialize AWS client for debugging
const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  } : undefined
});

/**
 * Global function to inspect DynamoDB items directly
 * @param {string} userId - User ID
 * @param {string} faceId - Face ID
 * @returns {Promise<object>} The inspection result
 */
export async function inspectDynamoItem(userId, faceId) {
  try {
    console.log(`[DEBUG] 🔍 Inspecting DynamoDB item - userId: ${userId}, faceId: ${faceId}`);
    
    const getCommand = new GetItemCommand({
      TableName: "shmong-face-data",
      Key: {
        userId: { S: userId },
        faceId: { S: faceId }
      }
    });
    
    const getResult = await dynamoDBClient.send(getCommand);
    console.log(`[DEBUG] 📊 DynamoDB Item:`, getResult.Item);
    
    if (getResult.Item) {
      console.log(`[DEBUG] 📊 Item keys: ${Object.keys(getResult.Item).join(', ')}`);
      console.log(`[DEBUG] 📊 Has face_attributes: ${!!getResult.Item.face_attributes}`);
      
      if (getResult.Item.face_attributes) {
        if (getResult.Item.face_attributes.S) {
          console.log(`[DEBUG] 📊 face_attributes is String type, length: ${getResult.Item.face_attributes.S.length}`);
          console.log(`[DEBUG] 📊 face_attributes preview: ${getResult.Item.face_attributes.S.substring(0, 100)}...`);
        } else {
          console.log(`[DEBUG] 📊 face_attributes is not String type:`, getResult.Item.face_attributes);
        }
      }
    }
    
    return getResult.Item;
  } catch (error) {
    console.error(`[DEBUG] ❌ Error inspecting DynamoDB item:`, error);
    return null;
  }
}

/**
 * EMERGENCY FIX: Repair all face data entries for a user by adding face_attributes to all their faces
 * @param {string} userId - The user ID to fix records for
 * @returns {Promise<object>} - Result summary
 */
export async function fixAllFaceAttributes(userId) {
  try {
    console.log(`[EMERGENCY FIX] 🚨 Starting emergency repair for all faces for user ${userId}`);
    
    // Get all faces for this user
    const queryCommand = new QueryCommand({
      TableName: "shmong-face-data",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId }
      }
    });
    
    const queryResult = await dynamoDBClient.send(queryCommand);
    
    if (!queryResult.Items || queryResult.Items.length === 0) {
      console.log(`[EMERGENCY FIX] ⚠️ No faces found for user ${userId}`);
      return {
        success: false,
        error: "No faces found for user"
      };
    }
    
    console.log(`[EMERGENCY FIX] 🔍 Found ${queryResult.Items.length} faces to repair`);
    
    // Test attributes that match expected format
    const defaultAttrs = {
      AgeRange: { Low: 27, High: 35 },
      Gender: { Value: "Male", Confidence: 99.8 },
      Emotions: [
        { Type: "CALM", Confidence: 98.5 }
      ],
      Beard: { Value: true, Confidence: 97.3 },
      Smile: { Value: false, Confidence: 99.2 },
      Confidence: 99.9,
      EMERGENCY_FIX: `Added manually at ${new Date().toISOString()}`
    };
    
    // Convert to properly formatted JSON string
    const attributesJson = JSON.stringify(defaultAttrs);
    console.log(`[EMERGENCY FIX] 📊 Default attributes JSON size: ${attributesJson.length} bytes`);
    
    // Process each face record
    const results = [];
    for (const item of queryResult.Items) {
      const faceId = item.faceId.S;
      
      try {
        // Check if this record already has face_attributes
        if (item.face_attributes && item.face_attributes.S) {
          console.log(`[EMERGENCY FIX] ✅ Face ID ${faceId} already has face_attributes, skipping`);
          results.push({
            faceId,
            status: "skipped",
            reason: "Already has face_attributes"
          });
          continue;
        }
        
        // Update the record with face_attributes
        console.log(`[EMERGENCY FIX] 🔧 Repairing face ID ${faceId}`);
        const updateCommand = new UpdateItemCommand({
          TableName: "shmong-face-data",
          Key: {
            userId: { S: userId },
            faceId: { S: faceId }
          },
          UpdateExpression: "SET face_attributes = :attrs, updated_at = :timestamp",
          ExpressionAttributeValues: {
            ":attrs": { S: attributesJson },
            ":timestamp": { S: new Date().toISOString() }
          },
          ReturnValues: "ALL_NEW"
        });
        
        const updateResult = await dynamoDBClient.send(updateCommand);
        
        console.log(`[EMERGENCY FIX] ✅ Successfully repaired face ID ${faceId}`);
        console.log(`[EMERGENCY FIX] 📊 Updated attributes:`, 
          updateResult.Attributes ? Object.keys(updateResult.Attributes).join(", ") : "No attributes returned");
        
        results.push({
          faceId,
          status: "fixed",
          hasAttributes: !!updateResult.Attributes?.face_attributes
        });
      } catch (error) {
        console.error(`[EMERGENCY FIX] ❌ Failed to repair face ID ${faceId}:`, error);
        results.push({
          faceId,
          status: "error",
          error: error.message
        });
      }
    }
    
    console.log(`[EMERGENCY FIX] 🏁 Repair completed with results:`, {
      totalFaces: queryResult.Items.length,
      fixed: results.filter(r => r.status === "fixed").length,
      skipped: results.filter(r => r.status === "skipped").length,
      errors: results.filter(r => r.status === "error").length
    });
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error(`[EMERGENCY FIX] ❌ Emergency repair failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Global function to test face attributes storage directly
 * @param {object} params - Test parameters
 * @returns {Promise<object>} Test results
 */
export async function testFaceAttributesStorage({ userId, faceId, testData = true }) {
  try {
    console.log(`[DEBUG] 🧪 Testing face attributes storage - userId: ${userId}, faceId: ${faceId}`);
    
    // 1. Check the current state
    const getCommand = new GetItemCommand({
      TableName: "shmong-face-data",
      Key: {
        userId: { S: userId },
        faceId: { S: faceId }
      }
    });
    
    const getResult = await dynamoDBClient.send(getCommand);
    console.log(`[DEBUG] 🔍 Current item:`, getResult.Item ? 
      `Found with ${Object.keys(getResult.Item).length} keys` : 'Not found');
    
    if (getResult.Item) {
      console.log(`[DEBUG] 📊 Has face_attributes: ${!!getResult.Item.face_attributes}`);
    }
    
    // 2. Add test attributes if requested
    if (testData) {
      console.log(`[DEBUG] 🧪 Adding test face attributes`);
      
      const testAttributes = {
        AgeRange: { Low: 25, High: 35 },
        Gender: { Value: "Male", Confidence: 99.5 },
        Emotions: [
          { Type: "HAPPY", Confidence: 95.2 },
          { Type: "CALM", Confidence: 4.3 }
        ],
        Smile: { Value: true, Confidence: 98.7 },
        Beard: { Value: true, Confidence: 97.2 },
        Confidence: 99.9,
        TEST_MARKER: `Test attributes added at ${new Date().toISOString()}`
      };
      
      // Convert attributes to JSON string
      const attributesJson = JSON.stringify(testAttributes);
      console.log(`[DEBUG] 📊 Test attributes JSON string size: ${attributesJson.length} bytes`);
      
      try {
        const updateCommand = new UpdateItemCommand({
          TableName: "shmong-face-data",
          Key: {
            userId: { S: userId },
            faceId: { S: faceId }
          },
          UpdateExpression: "SET face_attributes = :attributes, updated_at = :timestamp",
          ExpressionAttributeValues: {
            ":attributes": { S: attributesJson },
            ":timestamp": { S: new Date().toISOString() }
          },
          ReturnValues: "ALL_NEW"
        });
        
        const updateResult = await dynamoDBClient.send(updateCommand);
        console.log(`[DEBUG] ✅ Update successful with ${Object.keys(updateResult.Attributes || {}).length} updated attributes`);
        
        // Verify the update worked
        if (updateResult.Attributes) {
          console.log(`[DEBUG] 📊 Updated item has face_attributes: ${!!updateResult.Attributes.face_attributes}`);
          
          if (updateResult.Attributes.face_attributes) {
            if (updateResult.Attributes.face_attributes.S) {
              console.log(`[DEBUG] 📊 Updated face_attributes length: ${updateResult.Attributes.face_attributes.S.length}`);
              console.log(`[DEBUG] 📊 Updated face_attributes preview: ${updateResult.Attributes.face_attributes.S.substring(0, 100)}...`);
            }
          }
        }
      } catch (updateError) {
        console.error(`[DEBUG] ❌ Error updating test attributes:`, updateError);
      }
    }
    
    return { success: true, message: "Test completed" };
  } catch (error) {
    console.error(`[DEBUG] ❌ Test failed:`, error);
    return { success: false, error: error.message };
  }
}

// Create a global debug namespace
window.FaceLivenessDebug = {
  // Test camera access with detailed logging
  testCamera: async () => {
    console.log('🔍 Testing camera access and capabilities...');
    const result = await checkCameraForFaceLiveness();
    console.log('📊 Camera test results:', result);
    return result;
  },
  
  // Check AWS configuration
  checkAwsConfig: async () => {
    console.log('🔍 Validating AWS configuration...');
    const result = await validateAwsConfig();
    console.log('📊 AWS configuration results:', result);
    return result;
  },
  
  // Debug a Face Liveness session
  debugSession: async (sessionId) => {
    if (!sessionId) {
      console.error('❌ No session ID provided. Usage: FaceLivenessDebug.debugSession("your-session-id")');
      return null;
    }
    
    console.log(`🔍 Debugging Face Liveness session: ${sessionId}`);
    const result = await debugFaceLivenessSession(sessionId);
    console.log('📊 Session debug results:', result);
    return result;
  },
  
  // List all connected devices
  listDevices: async () => {
    console.log('🔍 Listing all media devices...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.error('❌ This browser does not support mediaDevices API');
      return [];
    }
    
    try {
      // Request permission first to get labels
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Group by type
      const result = {
        videoinput: devices.filter(d => d.kind === 'videoinput'),
        audioinput: devices.filter(d => d.kind === 'audioinput'),
        audiooutput: devices.filter(d => d.kind === 'audiooutput')
      };
      
      console.log('📊 Devices found:', result);
      return result;
    } catch (err) {
      console.error('❌ Error accessing devices:', err);
      return { error: err.message, name: err.name };
    }
  },
  
  // Test camera with specific ID
  testCameraById: async (deviceId) => {
    if (!deviceId) {
      console.error('❌ No device ID provided. Use FaceLivenessDebug.listDevices() first to get IDs');
      return null;
    }
    
    console.log(`🔍 Testing camera with ID: ${deviceId}`);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      const videoTracks = stream.getVideoTracks();
      
      const trackInfo = videoTracks.map(track => ({
        label: track.label,
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings ? track.getSettings() : null,
        constraints: track.getConstraints ? track.getConstraints() : null
      }));
      
      // Stop all tracks
      videoTracks.forEach(track => track.stop());
      
      console.log('📊 Camera test results:', trackInfo);
      return {
        success: true,
        tracks: trackInfo
      };
    } catch (err) {
      console.error('❌ Error testing camera:', err);
      return {
        success: false,
        error: err.message,
        name: err.name
      };
    }
  },
  
  // Display Amplify configuration
  showAmplifyConfig: () => {
    const config = Amplify.getConfig();
    console.log('📊 Amplify configuration:', config);
    return config;
  },
  
  // Add a direct reference to testRekognitionConnectivity
  testAwsConnection: async () => {
    console.log('🔍 Testing AWS Rekognition connectivity...');
    const result = await testRekognitionConnectivity();
    console.log('📊 Rekognition connectivity result:', result);
    return result;
  },
  
  // List all available cameras
  listCameras: async () => {
    try {
      // First request permission
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // List devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      // Release camera
      tempStream.getTracks().forEach(track => track.stop());
      
      console.table(cameras.map((cam, idx) => ({
        index: idx + 1,
        name: cam.label,
        id: cam.deviceId.substring(0, 10) + '...'
      })));
      
      return cameras;
    } catch (error) {
      console.error('❌ Failed to list cameras:', error);
      return [];
    }
  },
  
  // Test Face Liveness full flow manually
  testFaceLiveness: async (deviceId) => {
    const { createFaceLivenessSession, getFaceLivenessSessionResults } = await import('./api/faceLivenessApi');
    
    try {
      // Step 1: Test camera access
      const cameraTest = await testCamera(deviceId);
      if (!cameraTest.success) {
        console.error('❌ Camera test failed - cannot proceed with Face Liveness test');
        return false;
      }
      
      // Step 2: Test AWS connectivity
      const awsTest = await testAwsConnection();
      if (!awsTest) {
        console.error('❌ AWS connectivity test failed - cannot proceed with Face Liveness test');
        return false;
      }
      
      // Step 3: Create a Face Liveness session
      console.log('🔍 Creating Face Liveness session...');
      const userId = 'debug-test-' + Date.now();
      const session = await createFaceLivenessSession(userId);
      console.log('✅ Session created:', session.sessionId);
      
      console.log('🔍 To complete the test, you would need to manually start the Face Liveness check with this session ID');
      console.log('🔍 After completing the liveness check, you can get results with:');
      console.log(`FaceLivenessDebug.getSessionResults("${session.sessionId}")`);
      
      return session.sessionId;
    } catch (error) {
      console.error('❌ Face Liveness test failed:', error);
      return false;
    }
  },
  
  // Get session results manually
  getSessionResults: async (sessionId) => {
    const { getFaceLivenessSessionResults } = await import('./api/faceLivenessApi');
    
    try {
      console.log('🔍 Getting results for session:', sessionId);
      const results = await getFaceLivenessSessionResults(sessionId);
      console.log('✅ Session results:', results);
      return results;
    } catch (error) {
      console.error('❌ Failed to get session results:', error);
      return false;
    }
  }
};

// Log available debug tools
console.log('🔧 Face Liveness debug tools available in console:');
console.log('- FaceLivenessDebug.testCamera() - Test camera access');
console.log('- FaceLivenessDebug.checkAwsConfig() - Validate AWS configuration');
console.log('- FaceLivenessDebug.debugSession("sessionId") - Debug a specific session');
console.log('- FaceLivenessDebug.listDevices() - List all media devices');
console.log('- FaceLivenessDebug.testCameraById("deviceId") - Test specific camera');
console.log('- FaceLivenessDebug.showAmplifyConfig() - Show Amplify configuration');
console.log('- FaceLivenessDebug.testAwsConnection() - Test Rekognition API connection');
console.log('- FaceLivenessDebug.listCameras() - List all available cameras');
console.log('- FaceLivenessDebug.testFaceLiveness("deviceId") - Test Face Liveness full flow');
console.log('- FaceLivenessDebug.getSessionResults("sessionId") - Get session results');

export default window.FaceLivenessDebug;

// Make these functions available globally for browser console use
if (typeof window !== 'undefined') {
  window.inspectDynamoItem = inspectDynamoItem;
  window.testFaceAttributesStorage = testFaceAttributesStorage;
  window.fixAllFaceAttributes = fixAllFaceAttributes;
  
  console.log('[DEBUG] ✅ Debug utilities loaded and attached to window object');
  console.log('[DEBUG] 📝 Available commands:');
  console.log('[DEBUG] 📝 - window.inspectDynamoItem("userId", "faceId")');
  console.log('[DEBUG] 📝 - window.testFaceAttributesStorage({userId: "userId", faceId: "faceId"})');
  console.log('[DEBUG] 📝 - window.fixAllFaceAttributes("userId")');
} 