import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://gmupwzjxirpkskolsuix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdXB3emp4aXJwa3Nrb2xzdWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDU5OTAsImV4cCI6MjA1NjgyMTk5MH0.TRH6LIgIYD4QWaqQxUXxm6HMURqyUGQlhbvLnkgxvik';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Direct function to repair the face collection by directly calling the Edge Function
async function directRepairFaces() {
  try {
    console.log('Starting direct face collection repair...');
    
    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required. Please sign in first.');
    }
    
    console.log(`Authenticated as ${user.email}`);
    
    // 2. Create a reset record directly in the database
    console.log('Creating reset record...');
    
    const { data: resetData, error: resetError } = await supabase
      .from('face_collection_resets')
      .insert({
        user_id: user.id,
        status: 'requested',
        message: 'Reset requested via direct script'
      })
      .select('id')
      .single();
      
    if (resetError) {
      throw new Error(`Failed to create reset record: ${resetError.message}`);
    }
    
    const resetId = resetData.id;
    console.log(`Created reset record with ID: ${resetId}`);
    
    // 3. Call the Edge Function directly to reset the collection
    console.log('Calling reset-face-collection function...');
    
    const { data: functionData, error: functionError } = await supabase.functions.invoke('reset-face-collection', {
      body: { reset_id: resetId }
    });
    
    if (functionError) {
      throw new Error(`Function error: ${functionError.message}`);
    }
    
    console.log('Face collection reset initiated successfully!');
    console.log('Response:', functionData);
    
    // 4. Poll the status a few times
    console.log('Polling for status updates...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkStatus = async () => {
      attempts++;
      
      // Get the status directly from the database
      const { data: statusData, error: statusError } = await supabase
        .from('face_collection_resets')
        .select('status, message, updated_at')
        .eq('id', resetId)
        .single();
        
      if (statusError) {
        console.error(`Status check error: ${statusError.message}`);
        return;
      }
      
      console.log(`Attempt ${attempts}/${maxAttempts}: Status = ${statusData.status}, Message = ${statusData.message}, Updated = ${statusData.updated_at}`);
      
      // Continue polling if not complete and we haven't exceeded max attempts
      if (attempts < maxAttempts && statusData.status !== 'completed' && statusData.status !== 'failed') {
        console.log('Waiting 5 seconds before next check...');
        setTimeout(checkStatus, 5000);
      } else {
        console.log('Polling complete');
        if (statusData.status === 'completed') {
          console.log('REPAIR SUCCESSFUL!');
        } else if (statusData.status === 'failed') {
          console.log('REPAIR FAILED! Check the message for details.');
        } else {
          console.log('REPAIR IN PROGRESS. Please check the admin interface for updates.');
        }
      }
    };
    
    // Start polling
    setTimeout(checkStatus, 3000);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the direct repair function
directRepairFaces(); 