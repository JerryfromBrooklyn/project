// BackgroundTaskService.js - Handles background task processing
import { supabase } from '../lib/supabaseClient';
import { FaceIndexingService } from './FaceIndexingService';

// Default settings
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_CHECK_INTERVAL = 60000; // 1 minute

class BackgroundTaskService {
    static isRunning = false;
    static processorInterval = null;
    static batchSize = DEFAULT_BATCH_SIZE;
    static checkInterval = DEFAULT_CHECK_INTERVAL;
    
    /**
     * Initialize the background task processor
     * @param {Object} options - Configuration options
     * @param {number} options.batchSize - Number of tasks to process in each batch
     * @param {number} options.checkInterval - Milliseconds between checks for new tasks
     * @param {boolean} options.autoStart - Whether to start processing immediately
     */
    static initialize(options = {}) {
        this.batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
        this.checkInterval = options.checkInterval || DEFAULT_CHECK_INTERVAL;
        
        console.log(`[TASK] Initializing background task processor: batch size ${this.batchSize}, interval ${this.checkInterval}ms`);
        
        if (options.autoStart) {
            this.start();
        }
    }
    
    /**
     * Start the background task processor
     */
    static start() {
        if (this.isRunning) {
            console.log('[TASK] Background processor already running');
            return;
        }
        
        console.log('[TASK] Starting background task processor');
        this.isRunning = true;
        
        // Process immediately on start
        this.processTasks();
        
        // Set up interval for regular processing
        this.processorInterval = setInterval(() => {
            this.processTasks();
        }, this.checkInterval);
    }
    
    /**
     * Stop the background task processor
     */
    static stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('[TASK] Stopping background task processor');
        this.isRunning = false;
        
        if (this.processorInterval) {
            clearInterval(this.processorInterval);
            this.processorInterval = null;
        }
    }
    
    /**
     * Process pending tasks from the queue
     */
    static async processTasks() {
        if (!this.isRunning) {
            return;
        }
        
        try {
            console.log('[TASK] Checking for pending tasks');
            
            // First try the database function if available
            try {
                const { data, error } = await supabase.rpc('process_face_matching_queue', {
                    p_batch_size: this.batchSize
                });
                
                if (!error) {
                    console.log(`[TASK] Processed batch via RPC: ${JSON.stringify(data)}`);
                    return;
                }
                
                console.log(`[TASK] RPC not available, using client-side implementation: ${error.message}`);
            } catch (rpcError) {
                console.log(`[TASK] RPC error, using fallback: ${rpcError.message}`);
            }
            
            // Fallback to client-side implementation
            const { data: tasks, error } = await supabase
                .from('background_tasks')
                .select('id, task_type, user_id, data, attempts')
                .eq('status', 'pending')
                .lte('scheduled_for', new Date().toISOString())
                .order('scheduled_for', { ascending: true })
                .limit(this.batchSize);
                
            if (error) {
                console.error(`[TASK] Error fetching pending tasks: ${error.message}`);
                return;
            }
            
            if (!tasks || tasks.length === 0) {
                console.log('[TASK] No pending tasks found');
                return;
            }
            
            console.log(`[TASK] Processing ${tasks.length} pending tasks`);
            
            // Process each task
            for (const task of tasks) {
                await this.processTask(task);
            }
        } catch (error) {
            console.error(`[TASK] Error in process tasks: ${error.message}`);
        }
    }
    
    /**
     * Process an individual task
     * @param {Object} task - The task to process
     */
    static async processTask(task) {
        console.log(`[TASK] Processing task ${task.id} of type ${task.task_type}`);
        
        try {
            // Mark as processing
            await supabase
                .from('background_tasks')
                .update({
                    status: 'processing',
                    attempts: task.attempts + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id);
                
            // Process based on task type
            let result;
            switch (task.task_type) {
                case 'face_matching':
                    result = await this.processFaceMatchingTask(task);
                    break;
                    
                default:
                    throw new Error(`Unknown task type: ${task.task_type}`);
            }
            
            // Mark as completed
            await supabase
                .from('background_tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    data: {
                        ...task.data,
                        result
                    }
                })
                .eq('id', task.id);
                
            console.log(`[TASK] Successfully completed task ${task.id}`);
        } catch (error) {
            console.error(`[TASK] Error processing task ${task.id}: ${error.message}`);
            
            // Check if this was the final attempt
            const isFinalAttempt = task.attempts >= 2; // 3 attempts total (0, 1, 2)
            
            // Update task status
            await supabase
                .from('background_tasks')
                .update({
                    status: isFinalAttempt ? 'failed' : 'pending',
                    error: error.message,
                    scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 minutes
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id);
        }
    }
    
    /**
     * Process a face matching task
     * @param {Object} task - The face matching task
     */
    static async processFaceMatchingTask(task) {
        const { user_id, data } = task;
        const { face_id } = data;
        
        if (!user_id || !face_id) {
            throw new Error('Missing required task data: user_id or face_id');
        }
        
        console.log(`[TASK] Processing face matching for user ${user_id} with face ID ${face_id}`);
        
        // Use the batch processing method for large photo sets
        const result = await FaceIndexingService.processBatchedFaceMatching(
            user_id, face_id, 50 // Process in batches of 50
        );
        
        console.log(`[TASK] Face matching complete: processed ${result.processed} of ${result.total} photos`);
        return result;
    }
}

export default BackgroundTaskService; 