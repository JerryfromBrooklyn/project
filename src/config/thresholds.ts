/**
 * Configuration file for thresholds and confidence values
 * Modify these values to adjust face recognition and detection sensitivity
 */

// Face matching threshold for AWS Rekognition
// Higher values (0-100) require more similarity for a match
export const FACE_MATCH_THRESHOLD = 90;

// Confidence thresholds for different features
export const CONFIDENCE_THRESHOLDS = {
  // Minimum confidence required to consider a face match valid (0-100)
  MIN_MATCH_CONFIDENCE: 90,
  
  // Minimum confidence to consider a face detection valid (0-100)
  MIN_DETECTION_CONFIDENCE: 90,
  
  // Minimum confidence for identifying specific face attributes (0-100)
  FACE_ATTRIBUTES: {
    GENDER: 90,
    AGE: 90,
    EMOTIONS: 90,
    SMILE: 90,
    EYEGLASSES: 90,
    SUNGLASSES: 90,
    BEARD: 90,
    MUSTACHE: 90,
    EYES_OPEN: 90,
    MOUTH_OPEN: 90
  }
};

// Quality settings for face indexing
export const FACE_QUALITY_SETTINGS = {
  // Quality filter for face indexing ("AUTO", "LOW", "MEDIUM", "HIGH")
  QUALITY_FILTER: "HIGH",
  
  // Maximum number of faces to index in a single image
  MAX_FACES_TO_INDEX: 100,
  
  // Maximum number of faces to return in search results
  MAX_SEARCH_RESULTS: 1000
};

// Retry settings for face operations
export const OPERATION_SETTINGS = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000 // milliseconds
}; 