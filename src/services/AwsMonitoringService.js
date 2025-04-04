import { supabase } from '../lib/supabaseClient';

/**
 * Service for monitoring AWS API calls and providing alerts for failures
 */
export class AwsMonitoringService {
  // Configuration
  static FAILURE_THRESHOLD = 3; // Number of failures before alert is triggered
  static ERROR_TTL = 15 * 60 * 1000; // Errors expire after 15 minutes
  static failureCounters = {};
  static errorLog = [];
  static isAlertActive = false;
  
  /**
   * Log an AWS API error with metadata
   * 
   * @param {string} service - AWS service (e.g., 'Rekognition')
   * @param {string} operation - API operation name (e.g., 'SearchFacesByImage')
   * @param {Error} error - Error object
   * @param {Object} metadata - Additional metadata about the context
   */
  static logApiError(service, operation, error, metadata = {}) {
    console.error(`[AWS-MONITOR] Error in ${service}.${operation}:`, error.message);
    
    const errorData = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      service,
      operation,
      message: error.message,
      code: error.code || 'unknown',
      timestamp: new Date(),
      metadata: {
        ...metadata,
        stack: error.stack,
        awsMetadata: error.$metadata || null
      }
    };
    
    // Add to error log
    this.errorLog.unshift(errorData);
    
    // Keep log to reasonable size
    if (this.errorLog.length > 100) {
      this.errorLog.pop();
    }
    
    // Track failure count for this operation
    const key = `${service}:${operation}`;
    if (!this.failureCounters[key]) {
      this.failureCounters[key] = {
        count: 0,
        firstFailure: new Date(),
        lastFailure: new Date()
      };
    }
    
    this.failureCounters[key].count++;
    this.failureCounters[key].lastFailure = new Date();
    
    // Check if we should trigger an alert
    this.checkAlertThreshold(key, errorData);
    
    // Store in the database for persistence
    this.persistErrorData(errorData);
    
    return errorData;
  }
  
  /**
   * Check if error count exceeds threshold and trigger alert if needed
   * 
   * @param {string} key - Service:operation key
   * @param {Object} errorData - Error data
   */
  static checkAlertThreshold(key, errorData) {
    const counter = this.failureCounters[key];
    
    // If we've exceeded the threshold in a 15-minute window
    const timeWindow = new Date(Date.now() - this.ERROR_TTL);
    
    if (counter.count >= this.FAILURE_THRESHOLD && 
        counter.firstFailure > timeWindow &&
        !this.isAlertActive) {
      this.triggerAlert(key, counter, errorData);
      this.isAlertActive = true;
      
      // Reset alert after 15 minutes
      setTimeout(() => {
        this.isAlertActive = false;
      }, this.ERROR_TTL);
    }
  }
  
  /**
   * Trigger an alert for AWS API failures
   * 
   * @param {string} key - Service:operation key
   * @param {Object} counter - Failure counter
   * @param {Object} lastError - Last error data
   */
  static triggerAlert(key, counter, lastError) {
    console.warn(`[AWS-MONITOR] ALERT: ${key} has failed ${counter.count} times in the last 15 minutes!`);
    
    // Create a log in the database
    this.logSystemAlert({
      type: 'aws_api_failure',
      severity: 'high',
      title: `AWS API failure: ${key}`,
      message: `${key} has failed ${counter.count} times in the last 15 minutes. Last error: ${lastError.message}`,
      details: {
        service: lastError.service,
        operation: lastError.operation,
        failures: counter.count,
        firstFailure: counter.firstFailure,
        lastFailure: counter.lastFailure,
        lastErrorCode: lastError.code,
        lastErrorMessage: lastError.message
      }
    });
    
    // Additional alert actions can be implemented here
    // (e.g., sending emails, SMS, Slack messages, etc.)
  }
  
  /**
   * Persist error data to the database for analysis
   * 
   * @param {Object} errorData - Error data to persist
   */
  static async persistErrorData(errorData) {
    try {
      const { error } = await supabase
        .from('system_repair_log')
        .insert({
          type: 'aws_api_error',
          service: errorData.service,
          operation: errorData.operation,
          error_code: errorData.code,
          error_message: errorData.message,
          metadata: errorData.metadata
        });
        
      if (error) {
        console.error('[AWS-MONITOR] Failed to persist error data:', error);
      }
    } catch (dbError) {
      console.error('[AWS-MONITOR] Exception persisting error data:', dbError);
    }
  }
  
  /**
   * Log a system alert to the database
   * 
   * @param {Object} alertData - Alert data to log
   */
  static async logSystemAlert(alertData) {
    try {
      const { error } = await supabase
        .from('system_repair_log')
        .insert({
          type: 'system_alert',
          service: alertData.type,
          operation: alertData.severity,
          error_code: alertData.title,
          error_message: alertData.message,
          metadata: alertData.details
        });
        
      if (error) {
        console.error('[AWS-MONITOR] Failed to log system alert:', error);
      }
    } catch (dbError) {
      console.error('[AWS-MONITOR] Exception logging system alert:', dbError);
    }
  }
  
  /**
   * Get recent errors for a specific service/operation
   * 
   * @param {string} service - Optional service filter
   * @param {string} operation - Optional operation filter
   * @returns {Array} Filtered error log
   */
  static getRecentErrors(service = null, operation = null) {
    return this.errorLog.filter(entry => {
      if (service && entry.service !== service) return false;
      if (operation && entry.operation !== operation) return false;
      return true;
    });
  }
  
  /**
   * Clean up expired error counters (older than ERROR_TTL)
   */
  static cleanupExpiredErrors() {
    const now = Date.now();
    const expiryThreshold = now - this.ERROR_TTL;
    
    Object.keys(this.failureCounters).forEach(key => {
      const counter = this.failureCounters[key];
      if (counter.lastFailure.getTime() < expiryThreshold) {
        delete this.failureCounters[key];
      }
    });
  }
  
  /**
   * Start periodic cleanup of expired errors
   */
  static startPeriodicCleanup() {
    setInterval(() => this.cleanupExpiredErrors(), this.ERROR_TTL);
  }
  
  /**
   * Initialize the monitoring service
   */
  static initialize() {
    console.log('[AWS-MONITOR] Initializing AWS API monitoring service');
    this.startPeriodicCleanup();
  }
}

// Initialize the service
AwsMonitoringService.initialize(); 