import { FaceIndexingService } from './services/FaceIndexingService.jsx';
import { supabase } from './lib/supabaseClient';

// Test function to check if linked accounts functionality is working
async function testLinkedAccounts() {
  console.log("======= TESTING LINKED ACCOUNTS FUNCTIONALITY =======");
  
  // Test user IDs (use actual user IDs from your database)
  const userId = "628cc470-0c30-43a3-9759-886a6d24c22f"; // Replace with a valid user ID
  const photoId = "photo-" + Date.now(); // Create a test photo ID
  const faceId = "face-" + Date.now(); // Create a test face ID
  
  try {
    // First, test the getLinkedUserIds function
    console.log("Testing getLinkedUserIds function...");
    const linkedIds = await FaceIndexingService.getLinkedUserIds(userId);
    console.log(`Found ${linkedIds.length} linked IDs for user ${userId}:`, linkedIds);
    
    // Now test the addUserMatchToPhoto method
    console.log("\nTesting addUserMatchToPhoto method...");
    const result = await FaceIndexingService.addUserMatchToPhoto(photoId, userId, faceId);
    console.log("Result:", result);
    
    console.log("\n======= TEST COMPLETE =======");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
testLinkedAccounts(); 