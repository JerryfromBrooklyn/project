import { rekognitionClient } from '../lib/awsClient';
import { DetectFacesCommand, CompareFacesCommand } from '@aws-sdk/client-rekognition';

/**
 * Simple face detection service using AWS Rekognition
 * Detects faces in an image and returns face details
 */
export const detectFaces = async (imageData) => {
  try {
    console.log('[FACE DETECTION] Detecting faces with Rekognition...');
    
    // Prepare the command with the image data
    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageData
      },
      Attributes: ['ALL'] // Request all available attributes
    });

    // Send the command to AWS Rekognition
    const response = await rekognitionClient.send(command);
    
    console.log('[FACE DETECTION] Rekognition response:', response);
    
    return {
      success: true,
      faces: response.FaceDetails || [],
      count: response.FaceDetails?.length || 0
    };
  } catch (error) {
    console.error('[FACE DETECTION] Error with Rekognition:', error);
    return {
      success: false,
      error: error.message,
      faces: [],
      count: 0
    };
  }
};

/**
 * Detects faces in a base64 encoded image string
 * @param {string} base64Image - Base64 encoded image string (e.g., data:image/jpeg;base64,...)
 * @returns {Promise<Array>} - Array of detected faces with attributes
 */
export const detectFacesInImage = async (base64Image) => {
  try {
    console.log('[FACE DETECTION] Detecting faces from base64 image...');
    
    // Extract the actual base64 data from the data URL
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid base64 image format');
    }
    
    // Convert base64 to binary
    const binaryData = atob(base64Data);
    
    // Convert binary to Uint8Array
    const imageBytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      imageBytes[i] = binaryData.charCodeAt(i);
    }
    
    // Use the existing detectFaces function with the Uint8Array
    const result = await detectFaces(imageBytes);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to detect faces');
    }
    
    return result.faces;
  } catch (error) {
    console.error('[FACE DETECTION] Error detecting faces from base64:', error);
    return [];
  }
};

/**
 * Compare two face images using AWS Rekognition
 * @param {Uint8Array} sourceImageData - The reference/source image
 * @param {Uint8Array} targetImageData - The target image to compare against the source
 * @param {number} similarityThreshold - Optional similarity threshold (0-100)
 */
export const compareFaces = async (sourceImageData, targetImageData, similarityThreshold = 80) => {
  try {
    console.log('[FACE COMPARISON] Comparing faces with Rekognition...');
    
    // Prepare the command for face comparison
    const command = new CompareFacesCommand({
      SourceImage: {
        Bytes: sourceImageData
      },
      TargetImage: {
        Bytes: targetImageData
      },
      SimilarityThreshold: similarityThreshold
    });

    // Send the command to AWS Rekognition
    const response = await rekognitionClient.send(command);
    
    console.log('[FACE COMPARISON] Rekognition response:', response);
    
    return {
      success: true,
      matches: response.FaceMatches || [],
      matchCount: response.FaceMatches?.length || 0,
      unmatchedFaces: response.UnmatchedFaces || [],
      sourceImageFace: response.SourceImageFace
    };
  } catch (error) {
    console.error('[FACE COMPARISON] Error with Rekognition:', error);
    return {
      success: false,
      error: error.message,
      matches: [],
      matchCount: 0
    };
  }
};

/**
 * Helper function to capture an image from a video element
 */
export const captureImageFromVideo = async (videoElement) => {
  try {
    // Create a canvas element with the same dimensions as the video
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw the current video frame to the canvas
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    const blob = await new Promise(resolve => 
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    );
    
    // Convert blob to Uint8Array for Rekognition
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    return {
      success: true,
      imageData: uint8Array,
      imageUrl: canvas.toDataURL('image/jpeg')
    };
  } catch (error) {
    console.error('[FACE DETECTION] Error capturing image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
    detectFaces,
    detectFacesInImage,
    captureImageFromVideo,
    compareFaces
}; 