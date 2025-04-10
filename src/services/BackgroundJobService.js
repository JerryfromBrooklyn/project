import FaceMatchingService from './FaceMatchingService';

/**
 * BackgroundJobService - Handles scheduling and execution of background tasks
 */
const BackgroundJobService = {
  // Track job intervals for cleanup
  intervals: {},
  
  /**
   * Starts a background job to update bidirectional face matches
   * @param {number} intervalMinutes - How often to run the job (in minutes)
   * @param {string} [userId] - Optional specific user to update matches for
   * @returns {string} - Job ID that can be used to stop the job
   */
  startFaceMatchingJob: (intervalMinutes = 30, userId = null) => {
    const jobId = `face-matching-${Date.now()}`;
    console.log(`🔄 [BackgroundJobService] Starting face matching job ${jobId} with interval: ${intervalMinutes} minutes`);
    
    // Initial run (immediate)
    if (userId) {
      console.log(`[BackgroundJobService] Running initial bidirectional match for user: ${userId}`);
      FaceMatchingService.updateBidirectionalMatches(userId)
        .then(result => console.log(`[BackgroundJobService] Initial match result:`, result))
        .catch(err => console.error(`[BackgroundJobService] Initial match error:`, err));
    } else {
      console.log(`[BackgroundJobService] Running initial bidirectional match for all users`);
      FaceMatchingService.updateAllUserMatches()
        .then(result => console.log(`[BackgroundJobService] Initial match result:`, result))
        .catch(err => console.error(`[BackgroundJobService] Initial match error:`, err));
    }
    
    // Schedule recurring runs
    const intervalMs = intervalMinutes * 60 * 1000;
    const interval = setInterval(() => {
      console.log(`[BackgroundJobService] Running scheduled face matching job ${jobId}`);
      if (userId) {
        FaceMatchingService.updateBidirectionalMatches(userId)
          .then(result => console.log(`[BackgroundJobService] Scheduled match result:`, result))
          .catch(err => console.error(`[BackgroundJobService] Scheduled match error:`, err));
      } else {
        FaceMatchingService.updateAllUserMatches()
          .then(result => console.log(`[BackgroundJobService] Scheduled match result:`, result))
          .catch(err => console.error(`[BackgroundJobService] Scheduled match error:`, err));
      }
    }, intervalMs);
    
    // Store interval reference for cleanup
    BackgroundJobService.intervals[jobId] = interval;
    
    return jobId;
  },
  
  /**
   * Stops a running background job
   * @param {string} jobId - Job ID returned when starting the job
   * @returns {boolean} - Whether the job was successfully stopped
   */
  stopJob: (jobId) => {
    if (BackgroundJobService.intervals[jobId]) {
      console.log(`[BackgroundJobService] Stopping job ${jobId}`);
      clearInterval(BackgroundJobService.intervals[jobId]);
      delete BackgroundJobService.intervals[jobId];
      return true;
    }
    console.log(`[BackgroundJobService] Job ${jobId} not found or already stopped`);
    return false;
  },
  
  /**
   * Runs a one-time bidirectional face matching job for all users
   * @returns {Promise<object>} - Result of the operation
   */
  runOneTimeFaceMatchingJob: async () => {
    console.log(`[BackgroundJobService] Running one-time face matching job for all users`);
    return await FaceMatchingService.updateAllUserMatches();
  },
  
  /**
   * Runs a one-time bidirectional face matching job for a specific user
   * @param {string} userId - User ID to update matches for
   * @returns {Promise<object>} - Result of the operation
   */
  runOneTimeFaceMatchingJobForUser: async (userId) => {
    console.log(`[BackgroundJobService] Running one-time face matching job for user: ${userId}`);
    return await FaceMatchingService.updateBidirectionalMatches(userId);
  },
  
  /**
   * Stops all running background jobs
   */
  stopAllJobs: () => {
    console.log(`[BackgroundJobService] Stopping all background jobs`);
    Object.keys(BackgroundJobService.intervals).forEach(jobId => {
      clearInterval(BackgroundJobService.intervals[jobId]);
      delete BackgroundJobService.intervals[jobId];
    });
  }
};

export default BackgroundJobService; 